import { auth } from "@/lib/auth";
import { getAlertRules, createAlertRule } from "@/db/queries/alerts";
import { writeAuditLog } from "@/db/queries/audit";
import { getOrCreatePosition } from "@/db/queries/positions";
import { z } from "zod";

const createRuleSchema = z.object({
  ruleType: z.enum(["price_above", "price_below", "var_exceeds", "drawdown_exceeds", "portfolio_value_below"]),
  severity: z.enum(["info", "warning", "critical"]).default("warning"),
  threshold: z.number(),
  label: z.string().max(255).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rules = await getAlertRules(session.user.id);
    return Response.json({ data: rules });
  } catch (err) {
    console.error("[alerts/rules GET]", err);
    return Response.json({ error: "Failed to fetch rules" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createRuleSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.message }, { status: 400 });
  }

  try {
    const position = await getOrCreatePosition(session.user.id);
    const rule = await createAlertRule({
      userId: session.user.id,
      positionId: position.id,
      ruleType: parsed.data.ruleType,
      severity: parsed.data.severity,
      threshold: parsed.data.threshold.toString(),
      label: parsed.data.label,
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "create_alert_rule",
      resource: "alert_rule",
      resourceId: rule.id,
      data: parsed.data,
    });

    return Response.json({ data: rule }, { status: 201 });
  } catch (err) {
    console.error("[alerts/rules POST]", err);
    return Response.json({ error: "Failed to create rule" }, { status: 500 });
  }
}
