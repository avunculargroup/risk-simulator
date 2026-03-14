import { auth } from "@/lib/auth";
import { createSimulationRun } from "@/db/queries/simulations";
import { getOrCreatePosition } from "@/db/queries/positions";
import { writeAuditLog } from "@/db/queries/audit";
import { redis, createRedisConnection } from "@/lib/redis";
import { Queue } from "bullmq";
import { z } from "zod";

const monteCarloSchema = z.object({
  engine: z.literal("monte_carlo"),
  horizon: z.number().int().min(1).max(365),
  simulations: z.number().int().min(100).max(10000),
  enableJumps: z.boolean().optional(),
  jumpIntensity: z.number().optional(),
  jumpMeanSize: z.number().optional(),
  jumpVolatility: z.number().optional(),
});

const historicalReplaySchema = z.object({
  engine: z.literal("historical_replay"),
  horizon: z.number().int().min(1).max(365),
});

const customStressSchema = z.object({
  engine: z.literal("custom_stress_test"),
  scenarios: z.array(z.object({
    name: z.string(),
    priceMovePct: z.number().min(-1).max(10),
    timeHorizonDays: z.number().int().min(1).max(365),
  })).min(1),
});

const simulationParamsSchema = z.discriminatedUnion("engine", [
  monteCarloSchema,
  historicalReplaySchema,
  customStressSchema,
]);

// Rate limit: 20 simulations per hour per user
const RATE_LIMIT = 20;
const RATE_WINDOW = 3600; // seconds

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = simulationParamsSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.message }, { status: 400 });
  }

  try {
    // Rate limiting
    const rateLimitKey = `ratelimit:sim:${session.user.id}`;
    const current = await redis.incr(rateLimitKey);
    if (current === 1) {
      await redis.expire(rateLimitKey, RATE_WINDOW);
    }
    if (current > RATE_LIMIT) {
      return Response.json(
        { error: "Rate limit exceeded. Maximum 20 simulations per hour." },
        { status: 429 }
      );
    }

    const position = await getOrCreatePosition(session.user.id);

    const run = await createSimulationRun({
      userId: session.user.id,
      positionId: position.id,
      engine: parsed.data.engine,
      status: "pending",
      params: parsed.data as unknown as Record<string, unknown>,
    });

    // Enqueue simulation job
    const queue = new Queue("simulations", { connection: createRedisConnection() });
    await queue.add(
      "run",
      { runId: run.id, userId: session.user.id, params: parsed.data },
      { jobId: run.id }
    );
    await queue.close();

    await writeAuditLog({
      userId: session.user.id,
      action: "run_simulation",
      resource: "simulation_run",
      resourceId: run.id,
      data: { engine: parsed.data.engine },
    });

    return Response.json({ data: { runId: run.id } }, { status: 202 });
  } catch (err) {
    console.error("[simulation/run POST]", err);
    return Response.json({ error: "Failed to enqueue simulation" }, { status: 500 });
  }
}
