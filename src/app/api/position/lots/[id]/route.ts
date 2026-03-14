import { auth } from "@/lib/auth";
import { updateLot, deleteLot } from "@/db/queries/positions";
import { writeAuditLog } from "@/db/queries/audit";
import { z } from "zod";

const updateLotSchema = z.object({
  btcAmount: z.number().positive().optional(),
  purchasePrice: z.number().positive().optional(),
  purchaseDate: z.string().datetime().optional(),
  label: z.string().max(255).optional(),
  notes: z.string().optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = updateLotSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.message }, { status: 400 });
  }

  try {
    const updates: Parameters<typeof updateLot>[1] = {};
    if (parsed.data.btcAmount !== undefined) updates.btcAmount = parsed.data.btcAmount.toString();
    if (parsed.data.purchasePrice !== undefined) updates.purchasePrice = parsed.data.purchasePrice.toString();
    if (parsed.data.purchaseDate !== undefined) updates.purchaseDate = new Date(parsed.data.purchaseDate);
    if (parsed.data.label !== undefined) updates.label = parsed.data.label;
    if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;

    const lot = await updateLot(params.id, updates);

    await writeAuditLog({
      userId: session.user.id,
      action: "update_lot",
      resource: "treasury_lot",
      resourceId: params.id,
      data: parsed.data,
    });

    return Response.json({ data: lot });
  } catch (err) {
    console.error("[lot PUT]", err);
    return Response.json({ error: "Failed to update lot" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await deleteLot(params.id);

    await writeAuditLog({
      userId: session.user.id,
      action: "delete_lot",
      resource: "treasury_lot",
      resourceId: params.id,
    });

    return Response.json({ data: { deleted: true } });
  } catch (err) {
    console.error("[lot DELETE]", err);
    return Response.json({ error: "Failed to delete lot" }, { status: 500 });
  }
}
