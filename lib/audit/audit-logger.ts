import { prisma } from "../db/prisma.ts";

export interface LogAuditParams {
  organizationId?: string | null;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeData?: unknown;
  afterData?: unknown;
  ipAddress?: string | null;
}

/**
 * Logs a domain or sensitive mutation event to the database audit_log table.
 * Designed to be non-blocking and safe: failures to log will not abort business transactions.
 */
export async function logAuditEvent(params: LogAuditParams): Promise<void> {
  try {
    const sanitize = (data: unknown) => {
      if (!data) return undefined;
      // Deep clone and mask sensitive keys
      const str = JSON.stringify(data, (key, value) => {
        const lowerKey = key.toLowerCase();
        if (
          lowerKey.includes("password") ||
          lowerKey.includes("secret") ||
          lowerKey.includes("token") ||
          lowerKey.includes("credential")
        ) {
          return "[MASKED]";
        }
        return value;
      });
      return JSON.parse(str);
    };

    await prisma.auditLog.create({
      data: {
        organizationId: params.organizationId || null,
        actorUserId: params.actorUserId || null,
        action: params.action,
        entityType: params.entityType,
        entityId: String(params.entityId),
        beforeData: sanitize(params.beforeData),
        afterData: sanitize(params.afterData),
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (err) {
    // Audit failures should be recorded in server logs, never crash the app
    console.error(`[AUDIT_ERROR] Failed to record audit log for ${params.action} on ${params.entityType}:${params.entityId}`, err);
  }
}
