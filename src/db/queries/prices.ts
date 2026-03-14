import { desc, gte, sql } from "drizzle-orm";
import { db } from "../client";
import { priceHistory } from "../schema";
import type { PricePoint } from "@/engine/types";

export type NewPricePoint = typeof priceHistory.$inferInsert;

export async function getLatestPrice(): Promise<{ close: number; timestamp: Date } | null> {
  const [row] = await db
    .select()
    .from(priceHistory)
    .orderBy(desc(priceHistory.timestamp))
    .limit(1);

  if (!row) return null;
  return { close: Number(row.close), timestamp: row.timestamp };
}

export async function getPriceHistory(days: number): Promise<PricePoint[]> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rows = await db
    .select()
    .from(priceHistory)
    .where(gte(priceHistory.timestamp, cutoff))
    .orderBy(priceHistory.timestamp);

  return rows.map(row => ({
    timestamp: row.timestamp,
    close: Number(row.close),
    open: row.open ? Number(row.open) : undefined,
    high: row.high ? Number(row.high) : undefined,
    low: row.low ? Number(row.low) : undefined,
    volume: row.volume ? Number(row.volume) : undefined,
  }));
}

export async function insertPrice(data: NewPricePoint): Promise<void> {
  await db
    .insert(priceHistory)
    .values(data)
    .onConflictDoNothing();
}

export async function getPriceCount(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(priceHistory);
  return row?.count ?? 0;
}
