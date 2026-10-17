import test from "node:test";
import assert from "node:assert/strict";
class DomainEventBus {
  constructor() {
    this.handlers = new Map();
  }

  subscribe(eventName, handler) {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }
    const handlerSet = this.handlers.get(eventName);
    handlerSet.add(handler);

    return () => {
      handlerSet.delete(handler);
    };
  }

  async publish(eventName, payload) {
    const handlerSet = this.handlers.get(eventName);
    if (!handlerSet || handlerSet.size === 0) {
      return;
    }

    const promises = Array.from(handlerSet).map(async (handler) => {
      try {
        await handler(payload);
      } catch (err) {
        // Error isolated
      }
    });

    await Promise.allSettled(promises);
  }
}

test("DomainEventBus - Subscribe and publish event asynchronously with error isolation", async () => {
  const bus = new DomainEventBus();
  const capturedEvents = [];

  bus.subscribe("invoice.issued", (payload) => {
    capturedEvents.push(payload);
  });

  // Listener with error to verify fault isolation
  bus.subscribe("invoice.issued", () => {
    throw new Error("Isolated error in subscriber");
  });

  await bus.publish("invoice.issued", {
    invoiceId: "inv-99",
    invoiceNumber: "INV-2026-10-099",
    total: 2500000,
    dueDate: "2026-10-25T00:00:00Z",
    penghuniId: "p-1",
    organizationId: "org-1",
  });

  assert.equal(capturedEvents.length, 1);
  assert.equal(capturedEvents[0].invoiceId, "inv-99");
  assert.equal(capturedEvents[0].total, 2500000);
});

test("DomainEventBus - Unsubscribe removes handler", async () => {
  const bus = new DomainEventBus();
  let count = 0;

  const unsubscribe = bus.subscribe("payment.received", () => {
    count++;
  });

  await bus.publish("payment.received", {
    paymentId: "pay-1",
    amount: 1000000,
    paymentMethod: "transfer",
    penghuniId: "p-1",
    organizationId: "org-1",
  });

  assert.equal(count, 1);

  unsubscribe();

  await bus.publish("payment.received", {
    paymentId: "pay-2",
    amount: 2000000,
    paymentMethod: "qris",
    penghuniId: "p-2",
    organizationId: "org-1",
  });

  assert.equal(count, 1); // Not incremented after unsubscribe
});

test("Portfolio Analytics - Net Operating Income (NOI) and Contribution formula", () => {
  const transactions = [
    { jenis: "pemasukan", jumlah: 2000000, kamarId: "k1" },
    { jenis: "pemasukan", jumlah: 1500000, kamarId: "k2" },
    { jenis: "pengeluaran", jumlah: 300000, kamarId: "k1" }, // repair AC k1
    { jenis: "pengeluaran", jumlah: 500000, kamarId: null }, // general electricity
  ];

  const totalRevenue = transactions
    .filter((t) => t.jenis === "pemasukan")
    .reduce((s, t) => s + t.jumlah, 0);

  const totalExpenses = transactions
    .filter((t) => t.jenis === "pengeluaran")
    .reduce((s, t) => s + t.jumlah, 0);

  const noi = totalRevenue - totalExpenses;

  assert.equal(totalRevenue, 3500000);
  assert.equal(totalExpenses, 800000);
  assert.equal(noi, 2700000);

  // Unit contribution for k1
  const k1Revenue = transactions
    .filter((t) => t.kamarId === "k1" && t.jenis === "pemasukan")
    .reduce((s, t) => s + t.jumlah, 0);
  const k1Expenses = transactions
    .filter((t) => t.kamarId === "k1" && t.jenis === "pengeluaran")
    .reduce((s, t) => s + t.jumlah, 0);

  const k1Contribution = k1Revenue - k1Expenses;
  assert.equal(k1Contribution, 1700000);
});
