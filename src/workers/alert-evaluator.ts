import "dotenv/config";
import { Worker, Queue } from "bullmq";
import { createRedisConnection, redis } from "../lib/redis";
import { db } from "../db/client";
import { alertRules, users } from "../db/schema";
import { eq } from "drizzle-orm";
import { createAlertEvent } from "../db/queries/alerts";
import { getLatestSimulation } from "../db/queries/simulations";

const QUEUE_NAME = "alert-evaluator";

async function evaluateRules(): Promise<void> {
  const btcPriceStr = await redis.get("btc:price:latest");
  if (!btcPriceStr) return;
  const btcPrice = Number(btcPriceStr);

  // Load all active rules
  const activeRules = await db
    .select()
    .from(alertRules)
    .where(eq(alertRules.isActive, true));

  for (const rule of activeRules) {
    const threshold = Number(rule.threshold);
    let triggered = false;

    if (rule.ruleType === "price_above" && btcPrice > threshold) {
      triggered = true;
    } else if (rule.ruleType === "price_below" && btcPrice < threshold) {
      triggered = true;
    } else if (rule.ruleType === "portfolio_value_below") {
      // Would need latest position data — simplified check
      triggered = false;
    } else if (rule.ruleType === "var_exceeds") {
      const latestSim = await getLatestSimulation(rule.userId);
      if (latestSim?.metrics) {
        const var95 = Math.abs(Number(latestSim.metrics.var95));
        triggered = var95 > threshold;
      }
    }

    if (triggered) {
      await createAlertEvent({
        ruleId: rule.id,
        triggeredValue: btcPrice.toString(),
      });
      console.log(`[alert-evaluator] Triggered alert ${rule.id} (${rule.ruleType})`);
    }
  }
}

const queue = new Queue(QUEUE_NAME, { connection: createRedisConnection() });

async function setupAlertCron() {
  await queue.add("evaluate", {}, {
    repeat: { every: 5 * 60 * 1000 }, // every 5 minutes
    jobId: "alert-evaluator-cron",
  });

  const worker = new Worker(
    QUEUE_NAME,
    async () => {
      await evaluateRules();
    },
    { connection: createRedisConnection() }
  );

  worker.on("ready", () => {
    console.log("[alert-evaluator] Worker ready, evaluating every 5 min");
  });

  process.on("SIGTERM", async () => {
    await worker.close();
    await queue.close();
    process.exit(0);
  });
}

setupAlertCron().catch(console.error);
