import "dotenv/config";
import { Worker, type Job } from "bullmq";
import { createRedisConnection } from "../lib/redis";
import { runSimulation } from "../engine/index";
import type { SimulationParams } from "../engine/types";
import {
  updateSimulationRunStatus,
  saveSimulationMetrics,
  saveSimulationPaths,
} from "../db/queries/simulations";
import { getPositionSnapshot } from "../db/queries/positions";
import { getPriceHistory, getLatestPrice } from "../db/queries/prices";

interface SimulationJobData {
  runId: string;
  userId: string;
  params: SimulationParams;
}

const worker = new Worker<SimulationJobData>(
  "simulations",
  async (job: Job<SimulationJobData>) => {
    const { runId, userId, params } = job.data;
    console.log(`[worker] Starting simulation ${runId} (engine: ${params.engine})`);

    await updateSimulationRunStatus(runId, "running");

    const latestPrice = await getLatestPrice();
    const currentPrice = latestPrice?.close ?? 50000;

    const output = await runSimulation(userId, params, {
      fetchPosition: (uid) => getPositionSnapshot(uid, currentPrice),
      fetchPriceHistory: (days) => getPriceHistory(days),
    });

    await job.updateProgress(80);

    await saveSimulationMetrics(runId, output.metrics, output.pathCount);
    await saveSimulationPaths(runId, output.bands);

    await updateSimulationRunStatus(runId, "completed");
    console.log(`[worker] Simulation ${runId} completed`);
  },
  {
    connection: createRedisConnection(),
    concurrency: 2,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  }
);

worker.on("failed", async (job, err) => {
  console.error(`[worker] Simulation ${job?.data.runId} failed:`, err.message);
  if (job) {
    await updateSimulationRunStatus(job.data.runId, "failed", err.message);
  }
});

worker.on("ready", () => {
  console.log("[worker] Simulation worker ready, waiting for jobs...");
});

process.on("SIGTERM", async () => {
  await worker.close();
  process.exit(0);
});
