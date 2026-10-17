import type { DomainEventName, DomainEventMap } from "./domain-events";
import { logAuditEvent } from "@/lib/audit/audit-logger";

type EventHandler<K extends DomainEventName> = (
  payload: DomainEventMap[K]
) => Promise<void> | void;

export class DomainEventBus {
  private handlers: Map<DomainEventName, Set<EventHandler<any>>> = new Map();

  subscribe<K extends DomainEventName>(eventName: K, handler: EventHandler<K>): () => void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }
    const handlerSet = this.handlers.get(eventName)!;
    handlerSet.add(handler);

    return () => {
      handlerSet.delete(handler);
    };
  }

  async publish<K extends DomainEventName>(
    eventName: K,
    payload: DomainEventMap[K]
  ): Promise<void> {
    const handlerSet = this.handlers.get(eventName);
    if (!handlerSet || handlerSet.size === 0) {
      return;
    }

    // Execute handlers asynchronously with error isolation
    const promises = Array.from(handlerSet).map(async (handler) => {
      try {
        await handler(payload);
      } catch (err) {
        console.error(`[EventBus Error] Failed to handle event "${eventName}":`, err);
      }
    });

    await Promise.allSettled(promises);
  }
}

export const eventBus = new DomainEventBus();

// ─── Default Automation Event Handlers ────────────────────────────────────────

// 1. When payment is allocated and invoice is fully paid
eventBus.subscribe("payment.allocated", async (payload) => {
  if (payload.isFullyPaid) {
    await logAuditEvent({
      organizationId: payload.organizationId,
      action: "automation.invoice_settled",
      entityType: "Invoice",
      entityId: payload.invoiceId,
      afterData: {
        paymentId: payload.paymentId,
        allocatedAmount: payload.allocatedAmount,
        status: "paid",
      },
    });
  }
});

// 2. When an invoice becomes overdue
eventBus.subscribe("invoice.overdue", async (payload) => {
  await logAuditEvent({
    organizationId: payload.organizationId,
    action: "automation.invoice_flagged_overdue",
    entityType: "Invoice",
    entityId: payload.invoiceId,
    afterData: {
      invoiceNumber: payload.invoiceNumber,
      balanceDue: payload.balanceDue,
      dueDate: payload.dueDate,
    },
  });
});

// 3. When maintenance ticket is created with high priority
eventBus.subscribe("maintenance.created", async (payload) => {
  if (payload.prioritas === "tinggi") {
    await logAuditEvent({
      organizationId: payload.organizationId,
      action: "automation.urgent_maintenance_flagged",
      entityType: "Pemeliharaan",
      entityId: payload.ticketId,
      afterData: {
        judul: payload.judul,
        kategori: payload.kategori,
        prioritas: payload.prioritas,
      },
    });
  }
});
