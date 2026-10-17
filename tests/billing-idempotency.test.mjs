import test from "node:test";
import assert from "node:assert/strict";

test("Billing Engine - Idempotent Recurring Invoice Generation", () => {
  const activeLease = {
    id: "lease-101",
    organizationId: "org-xyz",
    penghuniId: "penghuni-01",
    rentAmount: 2000000,
    billingDay: 5,
    charges: [
      { type: "rent", name: "Sewa Pokok", amount: 2000000 },
      { type: "water", name: "Iuran Air", amount: 50000 },
    ],
    kamar: { nomor: "A101" },
  };

  const invoiceStore = [];

  const generateRecurringInvoice = (lease, targetMonth) => {
    const year = targetMonth.getFullYear();
    const month = String(targetMonth.getMonth() + 1).padStart(2, "0");
    const periodTag = `${year}-${month}`;
    const invoicePrefix = `INV-${periodTag}-${lease.kamar.nomor}-`;

    // Idempotency check: see if invoice already exists for this lease and period
    const existing = invoiceStore.find(
      (inv) =>
        inv.leaseId === lease.id && inv.invoiceNumber.startsWith(invoicePrefix)
    );

    if (existing) {
      return { status: "skipped", invoice: existing };
    }

    const total = lease.charges.reduce((sum, c) => sum + c.amount, 0);
    const newInvoice = {
      id: `inv-${Date.now()}-${invoiceStore.length + 1}`,
      leaseId: lease.id,
      invoiceNumber: `${invoicePrefix}0001`,
      period: periodTag,
      total,
      balanceDue: total,
      status: "issued",
      lines: lease.charges.map((c) => ({
        type: c.type,
        description: c.name,
        amount: c.amount,
      })),
    };

    invoiceStore.push(newInvoice);
    return { status: "created", invoice: newInvoice };
  };

  const october2026 = new Date(2026, 9, 1); // Oct 2026

  // First run: Should create invoice
  const run1 = generateRecurringInvoice(activeLease, october2026);
  assert.equal(run1.status, "created");
  assert.equal(run1.invoice.total, 2050000);
  assert.equal(run1.invoice.balanceDue, 2050000);
  assert.equal(invoiceStore.length, 1);

  // Second run: Retry / cron execution for the same month MUST be skipped
  const run2 = generateRecurringInvoice(activeLease, october2026);
  assert.equal(run2.status, "skipped");
  assert.equal(invoiceStore.length, 1, "Duplicate invoice was created!");

  // Third run: Next month (Nov 2026) Should create a new invoice
  const november2026 = new Date(2026, 10, 1);
  const run3 = generateRecurringInvoice(activeLease, november2026);
  assert.equal(run3.status, "created");
  assert.equal(run3.invoice.period, "2026-11");
  assert.equal(invoiceStore.length, 2);
});

test("Billing Engine - Multi-Invoice Sequential Settlement", () => {
  // Scenario: Tenant has 2 overdue invoices from past months
  const invoices = [
    { id: "inv-sep", dueDate: "2026-09-05", total: 1500000, balanceDue: 1500000, status: "overdue" },
    { id: "inv-oct", dueDate: "2026-10-05", total: 1500000, balanceDue: 1500000, status: "overdue" },
  ];

  // Tenant pays Rp 2.000.000:
  // Should fully pay September (Rp 1.500.000) and partially pay October (Rp 500.000)
  const paymentAmount = 2000000;
  let remainingPayment = paymentAmount;
  const allocations = [];

  for (const inv of invoices) {
    if (remainingPayment <= 0) break;
    const allocated = Math.min(inv.balanceDue, remainingPayment);
    inv.balanceDue -= allocated;
    inv.status = inv.balanceDue === 0 ? "paid" : "partial";
    allocations.push({ invoiceId: inv.id, amount: allocated });
    remainingPayment -= allocated;
  }

  // September invoice must be fully paid
  assert.equal(invoices[0].balanceDue, 0);
  assert.equal(invoices[0].status, "paid");
  assert.equal(allocations[0].amount, 1500000);

  // October invoice must be partially paid
  assert.equal(invoices[1].balanceDue, 1000000);
  assert.equal(invoices[1].status, "partial");
  assert.equal(allocations[1].amount, 500000);

  // Remaining payment credit must be 0
  assert.equal(remainingPayment, 0);
});
