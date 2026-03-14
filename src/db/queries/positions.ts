import { eq, desc } from "drizzle-orm";
import { db } from "../client";
import { treasuryPositions, treasuryLots } from "../schema";
import type { PositionSnapshot, LotSnapshot } from "@/engine/types";

export type NewTreasuryLot = typeof treasuryLots.$inferInsert;
export type TreasuryLot = typeof treasuryLots.$inferSelect;
export type TreasuryPosition = typeof treasuryPositions.$inferSelect;

export async function getOrCreatePosition(userId: string): Promise<TreasuryPosition> {
  const [existing] = await db
    .select()
    .from(treasuryPositions)
    .where(eq(treasuryPositions.userId, userId))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(treasuryPositions)
    .values({ userId, name: "Primary Treasury", currency: "USD" })
    .returning();

  return created;
}

export async function getPosition(userId: string): Promise<TreasuryPosition | null> {
  const [position] = await db
    .select()
    .from(treasuryPositions)
    .where(eq(treasuryPositions.userId, userId))
    .limit(1);

  return position ?? null;
}

export async function getLots(positionId: string): Promise<TreasuryLot[]> {
  return db
    .select()
    .from(treasuryLots)
    .where(eq(treasuryLots.positionId, positionId))
    .orderBy(desc(treasuryLots.purchaseDate));
}

export async function addLot(data: NewTreasuryLot): Promise<TreasuryLot> {
  const [lot] = await db.insert(treasuryLots).values(data).returning();
  return lot;
}

export async function updateLot(
  id: string,
  data: Partial<Pick<TreasuryLot, "btcAmount" | "purchasePrice" | "purchaseDate" | "label" | "notes">>
): Promise<TreasuryLot> {
  const [lot] = await db
    .update(treasuryLots)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(treasuryLots.id, id))
    .returning();
  return lot;
}

export async function deleteLot(id: string): Promise<void> {
  await db.delete(treasuryLots).where(eq(treasuryLots.id, id));
}

export async function getPositionSnapshot(
  userId: string,
  currentPrice: number
): Promise<PositionSnapshot> {
  const position = await getOrCreatePosition(userId);
  const lots = await getLots(position.id);

  const lotSnapshots: LotSnapshot[] = lots.map(lot => ({
    id: lot.id,
    btcAmount: Number(lot.btcAmount),
    purchasePrice: Number(lot.purchasePrice),
    purchaseDate: lot.purchaseDate,
    label: lot.label ?? undefined,
  }));

  const totalBtc = lotSnapshots.reduce((sum, l) => sum + l.btcAmount, 0);
  const totalCostBasis = lotSnapshots.reduce(
    (sum, l) => sum + l.btcAmount * l.purchasePrice,
    0
  );
  const currentValue = totalBtc * currentPrice;
  const unrealizedPnl = currentValue - totalCostBasis;
  const unrealizedPnlPct = totalCostBasis > 0 ? unrealizedPnl / totalCostBasis : 0;

  return {
    id: position.id,
    userId,
    name: position.name,
    lots: lotSnapshots,
    totalBtc,
    totalCostBasis,
    currentPrice,
    currentValue,
    unrealizedPnl,
    unrealizedPnlPct,
  };
}
