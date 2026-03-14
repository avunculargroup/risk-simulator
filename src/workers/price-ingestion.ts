import "dotenv/config";
import { Worker, Queue } from "bullmq";
import { createRedisConnection, redis } from "../lib/redis";
import { insertPrice, getPriceCount } from "../db/queries/prices";

const QUEUE_NAME = "price-ingestion";
const COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd";

async function fetchCurrentPrice(): Promise<number | null> {
  try {
    const apiKey = process.env.COINGECKO_API_KEY;
    const headers: Record<string, string> = {};
    if (apiKey) headers["x-cg-demo-api-key"] = apiKey;

    const res = await fetch(COINGECKO_URL, { headers });
    if (!res.ok) throw new Error(`CoinGecko responded with ${res.status}`);
    const data = await res.json() as { bitcoin: { usd: number } };
    return data.bitcoin.usd;
  } catch (err) {
    console.error("[price-ingestion] Fetch error:", err);
    return null;
  }
}

async function backfillHistoricalPrices(): Promise<void> {
  const count = await getPriceCount();
  if (count > 100) return; // Already have data

  console.log("[price-ingestion] Backfilling historical prices...");
  try {
    const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=365&interval=daily`;
    const res = await fetch(url);
    if (!res.ok) return;

    const data = await res.json() as { prices: [number, number][] };
    for (const [ts, price] of data.prices) {
      await insertPrice({
        timestamp: new Date(ts),
        close: price.toString(),
        source: "coingecko_historical",
      });
    }
    console.log(`[price-ingestion] Backfilled ${data.prices.length} price points`);
  } catch (err) {
    console.error("[price-ingestion] Backfill error:", err);
  }
}

// Set up repeatable job
const queue = new Queue(QUEUE_NAME, { connection: createRedisConnection() });

async function setupCron() {
  await backfillHistoricalPrices();

  await queue.add("fetch-price", {}, {
    repeat: { every: 60_000 }, // every 60 seconds
    jobId: "price-ingestion-cron",
  });

  const worker = new Worker(
    QUEUE_NAME,
    async () => {
      const price = await fetchCurrentPrice();
      if (!price) return;

      const now = new Date();
      await insertPrice({
        timestamp: now,
        close: price.toString(),
        source: "coingecko",
      });

      await redis.set("btc:price:latest", price.toString(), "EX", 120);
      console.log(`[price-ingestion] Updated BTC price: $${price.toFixed(2)}`);
    },
    { connection: createRedisConnection() }
  );

  worker.on("ready", () => {
    console.log("[price-ingestion] Worker ready, polling every 60s");
  });

  process.on("SIGTERM", async () => {
    await worker.close();
    await queue.close();
    process.exit(0);
  });
}

setupCron().catch(console.error);
