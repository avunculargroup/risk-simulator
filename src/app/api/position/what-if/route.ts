import { auth } from "@/lib/auth";
import { getOrCreatePosition } from "@/db/queries/positions";
import { getLatestPrice } from "@/db/queries/prices";
import { writeAuditLog } from "@/db/queries/audit";
import { db } from "@/db/client";
import { whatIfScenarios } from "@/db/schema";
import { z } from "zod";

const whatIfSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  hypotheticalLots: z.array(z.object({
    btcAmount: z.number().positive(),
    purchasePrice: z.number().positive(),
    purchaseDate: z.string().datetime(),
    label: z.string().optional(),
  })),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = whatIfSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.message }, { status: 400 });
  }

  try {
    const position = await getOrCreatePosition(session.user.id);
    const price = await getLatestPrice();
    const currentPrice = price?.close ?? 0;

    const lots = parsed.data.hypotheticalLots;
    const totalBtc = lots.reduce((sum, l) => sum + l.btcAmount, 0);
    const totalCostBasis = lots.reduce((sum, l) => sum + l.btcAmount * l.purchasePrice, 0);
    const currentValue = totalBtc * currentPrice;

    const metrics = {
      totalBtc,
      totalCostBasis,
      currentValue,
      unrealizedPnl: currentValue - totalCostBasis,
      unrealizedPnlPct: totalCostBasis > 0 ? (currentValue - totalCostBasis) / totalCostBasis : 0,
    };

    const [scenario] = await db
      .insert(whatIfScenarios)
      .values({
        userId: session.user.id,
        positionId: position.id,
        name: parsed.data.name,
        description: parsed.data.description,
        hypotheticalLots: parsed.data.hypotheticalLots as unknown as Record<string, unknown>,
        metrics: metrics as unknown as Record<string, unknown>,
      })
      .returning();

    await writeAuditLog({
      userId: session.user.id,
      action: "create_what_if",
      resource: "what_if_scenario",
      resourceId: scenario.id,
      data: { name: parsed.data.name },
    });

    return Response.json({ data: { scenario, metrics } }, { status: 201 });
  } catch (err) {
    console.error("[what-if POST]", err);
    return Response.json({ error: "Failed to create what-if scenario" }, { status: 500 });
  }
}
