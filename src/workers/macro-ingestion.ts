import "dotenv/config";
import { Worker, Queue } from "bullmq";
import { createRedisConnection } from "../lib/redis";
import { db } from "../db/client";
import { macroDataSeries, macroDataPoints } from "../db/schema";
import { eq } from "drizzle-orm";

const QUEUE_NAME = "macro-ingestion";

const MACRO_SERIES = [
  { ticker: "DGS10", name: "10-Year Treasury Yield", source: "fred" },
  { ticker: "DTWEXBGS", name: "US Dollar Index (DXY)", source: "fred" },
  { ticker: "VIXCLS", name: "CBOE Volatility Index (VIX)", source: "fred" },
];

async function fetchFredSeries(ticker: string): Promise<Array<{ date: string; value: string }>> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) return [];

  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${ticker}&api_key=${apiKey}&file_type=json&limit=365&sort_order=desc`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json() as { observations: Array<{ date: string; value: string }> };
    return data.observations.filter(o => o.value !== "." && o.value !== "");
  } catch {
    return [];
  }
}

async function ensureSeries(ticker: string, name: string, source: string): Promise<string> {
  const [existing] = await db
    .select()
    .from(macroDataSeries)
    .where(eq(macroDataSeries.ticker, ticker))
    .limit(1);

  if (existing) return existing.id;

  const [created] = await db
    .insert(macroDataSeries)
    .values({ ticker, name, source })
    .returning();
  return created.id;
}

const queue = new Queue(QUEUE_NAME, { connection: createRedisConnection() });

async function setupMacroCron() {
  await queue.add("fetch-macro", {}, {
    repeat: { every: 24 * 60 * 60 * 1000 }, // daily
    jobId: "macro-ingestion-cron",
  });

  const worker = new Worker(
    QUEUE_NAME,
    async () => {
      for (const { ticker, name, source } of MACRO_SERIES) {
        const seriesId = await ensureSeries(ticker, name, source);
        const observations = await fetchFredSeries(ticker);

        for (const obs of observations) {
          await db
            .insert(macroDataPoints)
            .values({
              seriesId,
              timestamp: new Date(obs.date),
              value: obs.value,
            })
            .onConflictDoNothing();
        }

        console.log(`[macro-ingestion] Updated ${ticker}: ${observations.length} points`);
      }
    },
    { connection: createRedisConnection() }
  );

  worker.on("ready", () => {
    console.log("[macro-ingestion] Worker ready");
  });

  process.on("SIGTERM", async () => {
    await worker.close();
    await queue.close();
    process.exit(0);
  });
}

setupMacroCron().catch(console.error);
