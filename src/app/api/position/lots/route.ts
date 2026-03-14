import { auth } from "@/lib/auth";
import { getOrCreatePosition, getLots, addLot } from "@/db/queries/positions";
import { writeAuditLog } from "@/db/queries/audit";
import { z } from "zod";

const addLotSchema = z.object({
  btcAmount: z.number().positive(),
  purchasePrice: z.number().positive(),
  purchaseDate: z.string().datetime(),
  label: z.string().max(255).optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const position = await getOrCreatePosition(session.user.id);
    const lots = await getLots(position.id);
    return Response.json({ data: lots });
  } catch (err) {
    console.error("[lots GET]", err);
    return Response.json({ error: "Failed to fetch lots" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = addLotSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.message }, { status: 400 });
  }

  try {
    const position = await getOrCreatePosition(session.user.id);
    const lot = await addLot({
      positionId: position.id,
      btcAmount: parsed.data.btcAmount.toString(),
      purchasePrice: parsed.data.purchasePrice.toString(),
      purchaseDate: new Date(parsed.data.purchaseDate),
      label: parsed.data.label,
      notes: parsed.data.notes,
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "add_lot",
      resource: "treasury_lot",
      resourceId: lot.id,
      data: parsed.data,
    });

    return Response.json({ data: lot }, { status: 201 });
  } catch (err) {
    console.error("[lots POST]", err);
    return Response.json({ error: "Failed to add lot" }, { status: 500 });
  }
}
