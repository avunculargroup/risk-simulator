import { eq, desc } from "drizzle-orm";
import { db } from "../client";
import { simulationRuns, simulationMetrics, simulationPaths } from "../schema";
import type { RiskMetrics, PercentileBands } from "@/engine/types";

export type SimulationRun = typeof simulationRuns.$inferSelect;
export type NewSimulationRun = typeof simulationRuns.$inferInsert;

export type SimulationRunWithMetrics = SimulationRun & {
  metrics: typeof simulationMetrics.$inferSelect | null;
};

export async function createSimulationRun(data: NewSimulationRun): Promise<SimulationRun> {
  const [run] = await db.insert(simulationRuns).values(data).returning();
  return run;
}

export async function getSimulationRun(id: string): Promise<SimulationRunWithMetrics | null> {
  const [run] = await db
    .select()
    .from(simulationRuns)
    .where(eq(simulationRuns.id, id))
    .limit(1);

  if (!run) return null;

  const [metrics] = await db
    .select()
    .from(simulationMetrics)
    .where(eq(simulationMetrics.runId, id))
    .limit(1);

  return { ...run, metrics: metrics ?? null };
}

export async function updateSimulationRunStatus(
  id: string,
  status: "pending" | "running" | "completed" | "failed",
  errorMessage?: string
): Promise<void> {
  const updates: Partial<SimulationRun> = { status };
  if (status === "running") updates.startedAt = new Date();
  if (status === "completed" || status === "failed") updates.completedAt = new Date();
  if (errorMessage) updates.errorMessage = errorMessage;

  await db
    .update(simulationRuns)
    .set(updates)
    .where(eq(simulationRuns.id, id));
}

export async function saveSimulationMetrics(
  runId: string,
  metrics: RiskMetrics,
  pathCount: number
): Promise<void> {
  await db
    .insert(simulationMetrics)
    .values({
      runId,
      var95: metrics.var95.toString(),
      var99: metrics.var99.toString(),
      cvar95: metrics.cvar95.toString(),
      cvar99: metrics.cvar99.toString(),
      maxDrawdown: metrics.maxDrawdown.toString(),
      expectedReturn: metrics.expectedReturn.toString(),
      volatility: metrics.volatility.toString(),
      terminalPriceMedian: metrics.terminalPriceMedian.toString(),
      terminalPriceMean: metrics.terminalPriceMean.toString(),
      probLoss: metrics.probLoss.toString(),
      pathCount,
    })
    .onConflictDoUpdate({
      target: simulationMetrics.runId,
      set: {
        var95: metrics.var95.toString(),
        var99: metrics.var99.toString(),
        cvar95: metrics.cvar95.toString(),
        cvar99: metrics.cvar99.toString(),
        maxDrawdown: metrics.maxDrawdown.toString(),
        expectedReturn: metrics.expectedReturn.toString(),
        volatility: metrics.volatility.toString(),
        terminalPriceMedian: metrics.terminalPriceMedian.toString(),
        terminalPriceMean: metrics.terminalPriceMean.toString(),
        probLoss: metrics.probLoss.toString(),
        pathCount,
      },
    });
}

export async function saveSimulationPaths(
  runId: string,
  bands: PercentileBands
): Promise<void> {
  await db
    .insert(simulationPaths)
    .values({
      runId,
      bands: bands as unknown as Record<string, unknown>,
      timestamps: bands.timestamps as unknown as Record<string, unknown>,
    })
    .onConflictDoUpdate({
      target: simulationPaths.runId,
      set: {
        bands: bands as unknown as Record<string, unknown>,
        timestamps: bands.timestamps as unknown as Record<string, unknown>,
      },
    });
}

export async function getSimulationPaths(runId: string): Promise<PercentileBands | null> {
  const [row] = await db
    .select()
    .from(simulationPaths)
    .where(eq(simulationPaths.runId, runId))
    .limit(1);

  if (!row) return null;
  return row.bands as unknown as PercentileBands;
}

export async function getLatestSimulation(
  userId: string
): Promise<SimulationRunWithMetrics | null> {
  const [run] = await db
    .select()
    .from(simulationRuns)
    .where(eq(simulationRuns.userId, userId))
    .orderBy(desc(simulationRuns.createdAt))
    .limit(1);

  if (!run) return null;

  const [metrics] = await db
    .select()
    .from(simulationMetrics)
    .where(eq(simulationMetrics.runId, run.id))
    .limit(1);

  return { ...run, metrics: metrics ?? null };
}

export async function listSimulations(
  userId: string,
  limit = 20
): Promise<SimulationRun[]> {
  return db
    .select()
    .from(simulationRuns)
    .where(eq(simulationRuns.userId, userId))
    .orderBy(desc(simulationRuns.createdAt))
    .limit(limit);
}
