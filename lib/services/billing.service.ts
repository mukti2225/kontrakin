import { prisma } from "@/lib/db/prisma";
import { logAuditEvent } from "@/lib/audit/audit-logger";
import { eventBus } from "@/lib/events/event-bus";

export interface CustomAllocationInput {
  invoiceId: string;
  amount: number;
}

export interface RecordPaymentInput {
  organizationId: string;
  penghuniId: string;
  amount: number;
  paymentMethod?: string;
  paymentReference?: string;
  invoiceId?: string; // Target invoice, or automatically allocated to oldest overdue invoice
  actorUserId?: string;
  customAllocations?: CustomAllocationInput[];
  allowAdvancePayment?: boolean;
  notes?: string;
}

export class BillingService {
  /**
   * Generates recurring monthly invoices for all active leases within an organization.
   * Strictly IDEMPOTENT: Retrying for the same month will never create duplicate invoices.
   */
  async generateMonthlyInvoices(
    organizationId: string,
    billingDate: Date = new Date(),
    actorUserId?: string
  ) {
    const year = billingDate.getFullYear();
    const month = String(billingDate.getMonth() + 1).padStart(2, "0");
    const periodTag = `${year}-${month}`; // e.g. "2026-10"

    // 1. Fetch all active leases in this organization
    const activeLeases = await prisma.lease.findMany({
      where: {
        organizationId,
        status: "active",
      },
      include: {
        charges: true,
        penghuni: true,
        kamar: true,
      },
    });

    let generatedCount = 0;
    let skippedCount = 0;
    const generatedInvoiceIds: string[] = [];

    for (const lease of activeLeases) {
      // Idempotency check: Look for existing invoice for this lease & period
      const existing = await prisma.invoice.findFirst({
        where: {
          organizationId,
          leaseId: lease.id,
          invoiceNumber: {
            startsWith: `INV-${periodTag}-${lease.kamar.nomor}-`,
          },
        },
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      // Calculate invoice totals from lease charges
      const charges =
        lease.charges.length > 0
          ? lease.charges
          : [
              {
                type: "rent",
                name: "Sewa Pokok",
                amount: lease.rentAmount,
              },
            ];

      const totalAmount = charges.reduce(
        (sum, c) => sum + Number(c.amount),
        0
      );

      // Due date based on lease billing day or default 5th of month
      const billingDay = Math.min(Math.max(lease.billingDay, 1), 28);
      const dueDate = new Date(year, billingDate.getMonth(), billingDay);

      const invoiceNumber = `INV-${periodTag}-${lease.kamar.nomor}-${Date.now()
        .toString()
        .slice(-4)}`;

      const createdInvoice = await prisma.$transaction(async (tx) => {
        return tx.invoice.create({
          data: {
            organizationId,
            penghuniId: lease.penghuniId,
            leaseId: lease.id,
            invoiceNumber,
            issueDate: new Date(),
            dueDate,
            subtotal: totalAmount,
            total: totalAmount,
            balanceDue: totalAmount,
            status: "issued",
            currency: "IDR",
            lines: {
              create: charges.map((ch) => ({
                type: ch.type,
                description: ch.name,
                quantity: 1,
                unitPrice: Number(ch.amount),
                amount: Number(ch.amount),
              })),
            },
          },
        });
      });

      generatedInvoiceIds.push(createdInvoice.id);
      generatedCount++;

      await logAuditEvent({
        organizationId,
        actorUserId: actorUserId || null,
        action: "invoice.generated_recurring",
        entityType: "Invoice",
        entityId: createdInvoice.id,
        afterData: {
          invoiceNumber: createdInvoice.invoiceNumber,
          total: totalAmount,
          dueDate: dueDate.toISOString(),
        },
      });

      await eventBus.publish("invoice.issued", {
        invoiceId: createdInvoice.id,
        invoiceNumber: createdInvoice.invoiceNumber,
        total: totalAmount,
        dueDate: dueDate.toISOString(),
        penghuniId: lease.penghuniId,
        organizationId,
      });
    }

    return {
      period: periodTag,
      generatedCount,
      skippedCount,
      totalActiveLeases: activeLeases.length,
      generatedInvoiceIds,
    };
  }

  /**
   * Records a payment and allocates it toward one or more invoices.
   * Supports partial payments and multi-invoice settlement.
   */
  async recordPayment(input: RecordPaymentInput) {
    if (input.amount <= 0) {
      throw new Error("Nominal pembayaran harus lebih besar dari 0");
    }

    const txResult = await prisma.$transaction(async (tx) => {
      // 1. Identify candidate invoices to pay
      let targetInvoices: Array<{ id: string; balanceDue: any; organizationId: string; penghuniId: string }> = [];

      if (input.customAllocations && input.customAllocations.length > 0) {
        // Explicit custom allocations
        for (const item of input.customAllocations) {
          if (item.amount <= 0) continue;
          const inv = await tx.invoice.findUnique({
            where: { id: item.invoiceId },
          });
          if (!inv || inv.organizationId !== input.organizationId) {
            throw new Error(`Tagihan ${item.invoiceId} tidak ditemukan`);
          }
          if (inv.penghuniId !== input.penghuniId) {
            throw new Error("Tagihan bukan milik penyewa yang dipilih");
          }
          targetInvoices.push(inv);
        }
      } else if (input.invoiceId) {
        const inv = await tx.invoice.findUnique({
          where: { id: input.invoiceId },
        });
        if (!inv || inv.organizationId !== input.organizationId) {
          throw new Error("Tagihan tidak ditemukan");
        }
        if (Number(inv.balanceDue) <= 0) {
          throw new Error("Tagihan ini sudah lunas");
        }
        targetInvoices = [inv];
      } else {
        // Auto-allocate to oldest unpaid invoices for this tenant
        targetInvoices = await tx.invoice.findMany({
          where: {
            organizationId: input.organizationId,
            penghuniId: input.penghuniId,
            status: { in: ["issued", "partial", "overdue"] },
            balanceDue: { gt: 0 },
          },
          orderBy: { dueDate: "asc" },
        });
      }

      if (targetInvoices.length === 0 && !input.allowAdvancePayment) {
        throw new Error("Tidak ada tagihan tertunggak untuk penyewa ini");
      }

      // 2. Create the master Payment record
      const payment = await tx.payment.create({
        data: {
          organizationId: input.organizationId,
          penghuniId: input.penghuniId,
          amount: input.amount,
          paymentMethod: input.paymentMethod || "transfer",
          paymentReference: input.paymentReference || null,
          provider: "manual",
          status: "completed",
          notes: input.notes || null,
          paidAt: new Date(),
        },
      });

      // 3. Allocate payment across invoices
      let remainingToAllocate = input.amount;
      const allocationRecords = [];

      if (input.customAllocations && input.customAllocations.length > 0) {
        for (const item of input.customAllocations) {
          if (remainingToAllocate <= 0 || item.amount <= 0) continue;
          const inv = targetInvoices.find((i) => i.id === item.invoiceId);
          if (!inv) continue;

          const currentBalance = Number(inv.balanceDue);
          const allocatedAmount = Math.min(currentBalance, item.amount, remainingToAllocate);
          if (allocatedAmount <= 0) continue;

          const newBalance = currentBalance - allocatedAmount;
          const newStatus = newBalance === 0 ? "paid" : "partial";

          const alloc = await tx.paymentAllocation.create({
            data: {
              paymentId: payment.id,
              invoiceId: inv.id,
              amount: allocatedAmount,
            },
          });
          allocationRecords.push(alloc);

          await tx.invoice.update({
            where: { id: inv.id },
            data: {
              balanceDue: newBalance,
              status: newStatus,
            },
          });

          remainingToAllocate -= allocatedAmount;
        }
      } else {
        for (const inv of targetInvoices) {
          if (remainingToAllocate <= 0) break;

          const currentBalance = Number(inv.balanceDue);
          const allocatedAmount = Math.min(currentBalance, remainingToAllocate);
          const newBalance = currentBalance - allocatedAmount;
          const newStatus = newBalance === 0 ? "paid" : "partial";

          // Create PaymentAllocation
          const alloc = await tx.paymentAllocation.create({
            data: {
              paymentId: payment.id,
              invoiceId: inv.id,
              amount: allocatedAmount,
            },
          });
          allocationRecords.push(alloc);

          // Update Invoice balance and status
          await tx.invoice.update({
            where: { id: inv.id },
            data: {
              balanceDue: newBalance,
              status: newStatus,
            },
          });

          remainingToAllocate -= allocatedAmount;
        }
      }

      // Also create legacy Transaksi entry for backward compatibility with existing reports
      await tx.transaksi.create({
        data: {
          jenis: "pemasukan",
          kategori: "Sewa Kamar",
          jumlah: input.amount,
          tanggal: new Date(),
          keterangan: `Pembayaran ${input.paymentMethod || "Transfer"} - Ref: ${payment.id}`,
          penghuniId: input.penghuniId,
          ownerId: input.actorUserId || "system",
          organizationId: input.organizationId,
        },
      });

      return {
        payment,
        allocations: allocationRecords,
        remainingCredit: remainingToAllocate,
      };
    });

    // Log domain audit event
    await logAuditEvent({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      action: "payment.recorded",
      entityType: "Payment",
      entityId: txResult.payment.id,
      afterData: {
        amount: input.amount,
        paymentMethod: input.paymentMethod || "transfer",
        paymentReference: input.paymentReference,
        penghuniId: input.penghuniId,
        allocationsCount: txResult.allocations.length,
        remainingCredit: txResult.remainingCredit,
      },
    });

    // Publish domain events outside the transaction
    await eventBus.publish("payment.received", {
      paymentId: txResult.payment.id,
      amount: input.amount,
      paymentMethod: input.paymentMethod || "transfer",
      penghuniId: input.penghuniId,
      organizationId: input.organizationId,
    });

    for (const alloc of txResult.allocations) {
      const inv = await prisma.invoice.findUnique({
        where: { id: alloc.invoiceId },
        select: { balanceDue: true },
      });
      const newBal = inv ? Number(inv.balanceDue) : 0;
      await eventBus.publish("payment.allocated", {
        paymentId: txResult.payment.id,
        invoiceId: alloc.invoiceId,
        allocatedAmount: Number(alloc.amount),
        newBalanceDue: newBal,
        isFullyPaid: newBal === 0,
        penghuniId: input.penghuniId,
        organizationId: input.organizationId,
      });
    }

    return txResult;
  }

  /**
   * Reconciles existing unallocated credit from a payment to one or more unpaid invoices.
   */
  async reconcilePaymentCredit(input: {
    paymentId: string;
    organizationId: string;
    allocations: CustomAllocationInput[];
    actorUserId?: string;
  }) {
    if (!input.allocations || input.allocations.length === 0) {
      throw new Error("Pilih minimal satu tagihan untuk dialokasikan");
    }

    const txResult = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: input.paymentId },
        include: { allocations: true },
      });

      if (!payment || payment.organizationId !== input.organizationId) {
        throw new Error("Pembayaran tidak ditemukan");
      }

      if (payment.status === "refunded") {
        throw new Error("Pembayaran yang telah direfund tidak dapat dialokasikan");
      }

      const totalAllocated = payment.allocations.reduce((sum, a) => sum + Number(a.amount), 0);
      const availableCredit = Number(payment.amount) - totalAllocated;

      const requestedTotal = input.allocations.reduce((sum, a) => sum + a.amount, 0);
      if (requestedTotal > availableCredit) {
        throw new Error(
          `Total alokasi (Rp ${requestedTotal.toLocaleString("id-ID")}) melebihi sisa kredit yang tersedia (Rp ${availableCredit.toLocaleString("id-ID")})`
        );
      }

      const newAllocations = [];

      for (const item of input.allocations) {
        if (item.amount <= 0) continue;

        const inv = await tx.invoice.findUnique({
          where: { id: item.invoiceId },
        });

        if (!inv || inv.organizationId !== input.organizationId) {
          throw new Error(`Tagihan ${item.invoiceId} tidak ditemukan`);
        }

        if (inv.penghuniId !== payment.penghuniId) {
          throw new Error("Tagihan bukan milik penyewa pembayar");
        }

        const currentBalance = Number(inv.balanceDue);
        if (currentBalance <= 0) {
          throw new Error(`Tagihan ${inv.invoiceNumber} sudah lunas`);
        }

        if (item.amount > currentBalance) {
          throw new Error(
            `Nominal alokasi untuk ${inv.invoiceNumber} (Rp ${item.amount.toLocaleString("id-ID")}) melebihi sisa tagihan (Rp ${currentBalance.toLocaleString("id-ID")})`
          );
        }

        const newBalance = currentBalance - item.amount;
        const newStatus = newBalance === 0 ? "paid" : "partial";

        const alloc = await tx.paymentAllocation.create({
          data: {
            paymentId: payment.id,
            invoiceId: inv.id,
            amount: item.amount,
          },
        });
        newAllocations.push(alloc);

        await tx.invoice.update({
          where: { id: inv.id },
          data: {
            balanceDue: newBalance,
            status: newStatus,
          },
        });
      }

      await logAuditEvent({
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        action: "payment.reconciled",
        entityType: "Payment",
        entityId: payment.id,
        beforeData: {
          availableCreditBefore: availableCredit,
        },
        afterData: {
          allocatedTotal: requestedTotal,
          remainingCreditAfter: availableCredit - requestedTotal,
          newAllocationsCount: newAllocations.length,
        },
      });

      return {
        payment,
        newAllocations,
        remainingCredit: availableCredit - requestedTotal,
      };
    });

    for (const alloc of txResult.newAllocations) {
      const inv = await prisma.invoice.findUnique({
        where: { id: alloc.invoiceId },
        select: { balanceDue: true },
      });
      const newBal = inv ? Number(inv.balanceDue) : 0;
      await eventBus.publish("payment.allocated", {
        paymentId: txResult.payment.id,
        invoiceId: alloc.invoiceId,
        allocatedAmount: Number(alloc.amount),
        newBalanceDue: newBal,
        isFullyPaid: newBal === 0,
        penghuniId: txResult.payment.penghuniId,
        organizationId: input.organizationId,
      });
    }

    return txResult;
  }

  /**
   * Reverses a payment, restores invoice balance due, and creates a reversing cashbook entry.
   */
  async refundPayment(input: {
    paymentId: string;
    organizationId: string;
    reason: string;
    actorUserId?: string;
  }) {
    if (!input.reason || input.reason.trim().length === 0) {
      throw new Error("Alasan refund wajib diisi");
    }

    const txResult = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: input.paymentId },
        include: {
          allocations: {
            include: { invoice: true },
          },
          penghuni: true,
        },
      });

      if (!payment || payment.organizationId !== input.organizationId) {
        throw new Error("Pembayaran tidak ditemukan");
      }

      if (payment.status === "refunded") {
        throw new Error("Pembayaran ini sudah pernah direfund sebelumnya");
      }

      // 1. Restore balance on all allocated invoices
      const restoredInvoices = [];
      for (const alloc of payment.allocations) {
        const inv = alloc.invoice;
        const currentBal = Number(inv.balanceDue);
        const restoredBal = Math.min(Number(inv.total), currentBal + Number(alloc.amount));
        const isOverdue = new Date(inv.dueDate) < new Date();
        const restoredStatus =
          restoredBal >= Number(inv.total)
            ? isOverdue
              ? "overdue"
              : "issued"
            : "partial";

        await tx.invoice.update({
          where: { id: inv.id },
          data: {
            balanceDue: restoredBal,
            status: restoredStatus,
          },
        });
        restoredInvoices.push({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          restoredBalance: restoredBal,
          restoredStatus,
        });
      }

      // 2. Mark payment as refunded
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "refunded",
          notes: payment.notes
            ? `${payment.notes} | [REFUNDED: ${input.reason}]`
            : `[REFUNDED: ${input.reason}]`,
        },
      });

      // 3. Create balancing Transaksi record (pengeluaran: Refund Pembayaran)
      await tx.transaksi.create({
        data: {
          jenis: "pengeluaran",
          kategori: "Refund Pembayaran",
          jumlah: Number(payment.amount),
          tanggal: new Date(),
          keterangan: `Reversal / Refund Pembayaran Ref: ${payment.id} - ${input.reason}`,
          penghuniId: payment.penghuniId,
          ownerId: input.actorUserId || "system",
          organizationId: input.organizationId,
        },
      });

      // 4. Log audit event
      await logAuditEvent({
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        action: "payment.refunded",
        entityType: "Payment",
        entityId: payment.id,
        beforeData: {
          status: payment.status,
          amount: Number(payment.amount),
          allocationsCount: payment.allocations.length,
        },
        afterData: {
          status: "refunded",
          reason: input.reason,
          restoredInvoices,
        },
      });

      return {
        payment: updatedPayment,
        restoredInvoices,
      };
    });

    await eventBus.publish("payment.refunded", {
      paymentId: txResult.payment.id,
      amount: Number(txResult.payment.amount),
      organizationId: input.organizationId,
    });

    return txResult;
  }
}

export const billingService = new BillingService();
