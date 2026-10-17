import { prisma } from "@/lib/db/prisma";
import { eventBus } from "@/lib/events/event-bus";
import { logAuditEvent } from "@/lib/audit/audit-logger";

export interface AutomationRunResult {
  organizationId: string;
  overdueFlaggedCount: number;
  overdueInvoiceIds: string[];
  executedAt: string;
}

export class AutomationService {
  /**
   * Scans for unpaid invoices that have crossed their due date,
   * updates their status to 'overdue', and emits domain events.
   */
  async checkAndFlagOverdueInvoices(organizationId: string): Promise<AutomationRunResult> {
    const now = new Date();

    const candidateInvoices = await prisma.invoice.findMany({
      where: {
        organizationId,
        status: { in: ["issued", "partial"] },
        dueDate: { lt: now },
        balanceDue: { gt: 0 },
      },
    });

    const flaggedIds: string[] = [];

    for (const inv of candidateInvoices) {
      await prisma.invoice.update({
        where: { id: inv.id },
        data: { status: "overdue" },
      });

      flaggedIds.push(inv.id);

      await eventBus.publish("invoice.overdue", {
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        balanceDue: Number(inv.balanceDue),
        dueDate: inv.dueDate.toISOString(),
        penghuniId: inv.penghuniId,
        organizationId,
      });
    }

    if (flaggedIds.length > 0) {
      await logAuditEvent({
        organizationId,
        action: "automation.daily_overdue_scan",
        entityType: "Automation",
        entityId: `SCAN-${Date.now()}`,
        afterData: {
          flaggedCount: flaggedIds.length,
          invoiceIds: flaggedIds,
        },
      });
    }

    return {
      organizationId,
      overdueFlaggedCount: flaggedIds.length,
      overdueInvoiceIds: flaggedIds,
      executedAt: now.toISOString(),
    };
  }
}

export const automationService = new AutomationService();
