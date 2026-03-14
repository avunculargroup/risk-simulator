import { auth } from "@/lib/auth";
import { getLatestPrice } from "@/db/queries/prices";
import { redis } from "@/lib/redis";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Try Redis cache first
    const cached = await redis.get("btc:price:latest").catch(() => null);
    if (cached) {
      return Response.json({ data: { price: Number(cached), source: "cache" } });
    }

    const price = await getLatestPrice();
    if (!price) {
      return Response.json({ error: "No price data available" }, { status: 404 });
    }

    return Response.json({ data: { price: price.close, timestamp: price.timestamp } });
  } catch (err) {
    console.error("[price/current]", err);
    return Response.json({ error: "Failed to fetch price" }, { status: 500 });
  }
}
