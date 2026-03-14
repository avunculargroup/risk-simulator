import { auth } from "@/lib/auth";
import { getOrCreatePosition, addLot } from "@/db/queries/positions";
import { writeAuditLog } from "@/db/queries/audit";

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

function parseCSV(text: string): Array<Record<string, string>> {
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/["\r]/g, ""));
  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map(v => v.trim().replace(/["\r]/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] ?? ""; });
    rows.push(row);
  }

  return rows;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const text = await req.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      return Response.json({ error: "No valid CSV data found" }, { status: 400 });
    }

    const position = await getOrCreatePosition(session.user.id);
    const result: ImportResult = { success: 0, failed: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        // Accept multiple column naming conventions
        const btcAmount = parseFloat(
          row["btc_amount"] || row["amount"] || row["btc"] || row["quantity"] || ""
        );
        const purchasePrice = parseFloat(
          row["purchase_price"] || row["price"] || row["cost"] || row["usd_price"] || ""
        );
        const dateStr = row["purchase_date"] || row["date"] || row["acquired_date"] || "";
        const purchaseDate = new Date(dateStr);

        if (isNaN(btcAmount) || btcAmount <= 0) throw new Error("Invalid BTC amount");
        if (isNaN(purchasePrice) || purchasePrice <= 0) throw new Error("Invalid purchase price");
        if (isNaN(purchaseDate.getTime())) throw new Error("Invalid date");

        await addLot({
          positionId: position.id,
          btcAmount: btcAmount.toString(),
          purchasePrice: purchasePrice.toString(),
          purchaseDate,
          label: row["label"] || row["note"] || undefined,
        });
        result.success++;
      } catch (err) {
        result.failed++;
        result.errors.push(`Row ${i + 2}: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    await writeAuditLog({
      userId: session.user.id,
      action: "import_lots",
      resource: "treasury_lot",
      resourceId: position.id,
      data: { totalRows: rows.length, success: result.success, failed: result.failed },
    });

    return Response.json({ data: result });
  } catch (err) {
    console.error("[import POST]", err);
    return Response.json({ error: "Failed to process import" }, { status: 500 });
  }
}
