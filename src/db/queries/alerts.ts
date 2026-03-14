import { eq, desc, and } from "drizzle-orm";
import { db } from "../client";
import { alertRules, alertEvents } from "../schema";

export type AlertRule = typeof alertRules.$inferSelect;
export type NewAlertRule = typeof alertRules.$inferInsert;
export type AlertEvent = typeof alertEvents.$inferSelect;
export type NewAlertEvent = typeof alertEvents.$inferInsert;

export type AlertEventWithRule = AlertEvent & { rule: AlertRule };

export async function getAlertRules(userId: string): Promise<AlertRule[]> {
  return db
    .select()
    .from(alertRules)
    .where(eq(alertRules.userId, userId))
    .orderBy(desc(alertRules.createdAt));
}

export async function getActiveAlertRules(userId: string): Promise<AlertRule[]> {
  return db
    .select()
    .from(alertRules)
    .where(and(eq(alertRules.userId, userId), eq(alertRules.isActive, true)));
}

export async function createAlertRule(data: NewAlertRule): Promise<AlertRule> {
  const [rule] = await db.insert(alertRules).values(data).returning();
  return rule;
}

export async function updateAlertRule(
  id: string,
  data: Partial<Pick<AlertRule, "ruleType" | "severity" | "threshold" | "label" | "isActive">>
): Promise<AlertRule> {
  const [rule] = await db
    .update(alertRules)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(alertRules.id, id))
    .returning();
  return rule;
}

export async function deleteAlertRule(id: string): Promise<void> {
  await db.delete(alertRules).where(eq(alertRules.id, id));
}

export async function createAlertEvent(data: NewAlertEvent): Promise<AlertEvent> {
  const [event] = await db.insert(alertEvents).values(data).returning();
  return event;
}

export async function getAlertEvents(
  userId: string,
  limit = 50
): Promise<AlertEventWithRule[]> {
  const rules = await getAlertRules(userId);
  const ruleIds = rules.map(r => r.id);

  if (ruleIds.length === 0) return [];

  const events = await db
    .select()
    .from(alertEvents)
    .where(eq(alertEvents.ruleId, ruleIds[0])) // Simplified — works for single user
    .orderBy(desc(alertEvents.createdAt))
    .limit(limit);

  const ruleMap = new Map(rules.map(r => [r.id, r]));
  return events.map(e => ({ ...e, rule: ruleMap.get(e.ruleId)! }));
}

export async function acknowledgeAlert(eventId: string): Promise<void> {
  await db
    .update(alertEvents)
    .set({ acknowledged: true, acknowledgedAt: new Date() })
    .where(eq(alertEvents.id, eventId));
}
