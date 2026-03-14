import { auth } from "@/lib/auth";
import { getOrCreatePosition, getLots } from "@/db/queries/positions";
import { getLatestPrice } from "@/db/queries/prices";
import { writeAuditLog } from "@/db/queries/audit";
import { db } from "@/db/client";
import { treasuryPositions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const position = await getOrCreatePosition(session.user.id);
    const lots = await getLots(position.id);
    const price = await getLatestPrice();
    const currentPrice = price?.close ?? 0;

    const totalBtc = lots.reduce((sum, l) => sum + Number(l.btcAmount), 0);
    const totalCostBasis = lots.reduce(
      (sum, l) => sum + Number(l.btcAmount) * Number(l.purchasePrice),
      0
    );

    return Response.json({
      data: {
        position,
        lots,
        metrics: {
          totalBtc,
          totalCostBasis,
          currentPrice,
          currentValue: totalBtc * currentPrice,
          unrealizedPnl: totalBtc * currentPrice - totalCostBasis,
          unrealizedPnlPct: totalCostBasis > 0
            ? (totalBtc * currentPrice - totalCostBasis) / totalCostBasis
            : 0,
        },
      },
    });
  } catch (err) {
    console.error("[position GET]", err);
    return Response.json({ error: "Failed to fetch position" }, { status: 500 });
  }
}

const updatePositionSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  currency: z.string().length(3).optional(),
  notes: z.string().optional(),
});

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = updatePositionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.message }, { status: 400 });
  }

  try {
    const position = await getOrCreatePosition(session.user.id);
    const [updated] = await db
      .update(treasuryPositions)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(treasuryPositions.id, position.id))
      .returning();

    await writeAuditLog({
      userId: session.user.id,
      action: "update_position",
      resource: "treasury_position",
      resourceId: position.id,
      data: parsed.data,
    });

    return Response.json({ data: updated });
  } catch (err) {
    console.error("[position PUT]", err);
    return Response.json({ error: "Failed to update position" }, { status: 500 });
  }
}
