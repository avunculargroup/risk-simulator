import { db } from "../client";
import { auditLog } from "../schema";

export interface AuditLogEntry {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  data?: unknown;
  ipAddress?: string;
}

export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await db.insert(auditLog).values({
      userId: entry.userId,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      data: entry.data as Record<string, unknown> | null,
      ipAddress: entry.ipAddress,
    });
  } catch (err) {
    // Audit log failures must never break the main operation
    console.error("[audit] Failed to write audit log:", err);
  }
}
