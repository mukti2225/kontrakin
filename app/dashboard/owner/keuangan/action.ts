"use server";

import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { requireOwner, requireOrganization } from "@/lib/auth/get-current-user";
import { billingService } from "@/lib/services/billing.service";
import { logAuditEvent } from "@/lib/audit/audit-logger";

export interface TransaksiInput {
  jenis: "pemasukan" | "pengeluaran";
  kategori: string;
  jumlah: number;
  tanggal: string;
  keterangan?: string;
  kamarId?: string;
  penghuniId?: string;
}

const includeRelasi = {
  kamar: true,
  penghuni: true,
} as const;

async function requireOwnerId() {
  const user = await requireOwner();
  return user.id;
}

export async function generateInvoicesAction() {
  const { user, organization } = await requireOrganization();
  const result = await billingService.generateMonthlyInvoices(
    organization.id,
    new Date(),
    user.id
  );

  revalidatePath("/dashboard/owner/keuangan");
  return result;
}

export async function getInvoiceList() {
  const { organization } = await requireOrganization();

  const invoices = await prisma.invoice.findMany({
    where: { organizationId: organization.id },
    include: {
      penghuni: { select: { id: true, nama: true, noHp: true, email: true } },
      lease: {
        select: {
          id: true,
          nomorKontrak: true,
          billingFrequency: true,
          startDate: true,
          endDate: true,
          kamar: {
            select: {
              id: true,
              nomor: true,
              properti: { select: { id: true, nama: true } },
            },
          },
        },
      },
      lines: true,
      allocations: {
        include: {
          payment: {
            select: {
              id: true,
              paymentMethod: true,
              paymentReference: true,
              paidAt: true,
            },
          },
        },
      },
    },
    orderBy: { dueDate: "desc" },
  });

  return invoices.map((inv) => ({
    ...inv,
    issueDate: inv.issueDate.toISOString(),
    dueDate: inv.dueDate.toISOString(),
    createdAt: inv.createdAt.toISOString(),
    updatedAt: inv.updatedAt.toISOString(),
    subtotal: Number(inv.subtotal),
    discountTotal: Number(inv.discountTotal),
    taxTotal: Number(inv.taxTotal),
    penaltyTotal: Number(inv.penaltyTotal),
    total: Number(inv.total),
    balanceDue: Number(inv.balanceDue),
    lease: inv.lease
      ? {
          ...inv.lease,
          startDate: inv.lease.startDate.toISOString(),
          endDate: inv.lease.endDate.toISOString(),
        }
      : null,
    lines: inv.lines.map((l) => ({
      ...l,
      unitPrice: Number(l.unitPrice),
      amount: Number(l.amount),
    })),
    allocations: inv.allocations.map((a) => ({
      ...a,
      amount: Number(a.amount),
      allocatedAt: a.allocatedAt.toISOString(),
      payment: a.payment
        ? {
            ...a.payment,
            paidAt: a.payment.paidAt.toISOString(),
          }
        : null,
    })),
  }));
}

export async function cancelInvoiceAction(invoiceId: string, reason?: string) {
  const { user, organization } = await requireOrganization();

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { allocations: true },
  });

  if (!invoice || invoice.organizationId !== organization.id) {
    throw new Error("Tagihan tidak ditemukan atau tidak memiliki akses");
  }

  if (invoice.status === "cancelled") {
    throw new Error("Tagihan ini sudah dibatalkan sebelumnya");
  }

  const totalAllocated = invoice.allocations.reduce((sum, a) => sum + Number(a.amount), 0);
  if (totalAllocated > 0) {
    throw new Error(
      "Tagihan tidak dapat dibatalkan karena sudah ada pembayaran yang dialokasikan. Harap lakukan refund atau batalkan alokasi pembayaran terlebih dahulu."
    );
  }

  const cancellationNote = reason ? `[Dibatalkan: ${reason}]` : "[Dibatalkan oleh pemilik]";
  const updated = await prisma.$transaction(async (tx) => {
    const updatedInv = await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "cancelled",
        balanceDue: 0,
        notes: invoice.notes ? `${invoice.notes} | ${cancellationNote}` : cancellationNote,
      },
    });

    await logAuditEvent({
      organizationId: organization.id,
      actorUserId: user.id,
      action: "invoice.cancelled",
      entityType: "Invoice",
      entityId: invoice.id,
      beforeData: {
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        total: Number(invoice.total),
        balanceDue: Number(invoice.balanceDue),
      },
      afterData: {
        status: "cancelled",
        balanceDue: 0,
        reason: reason || "Manual cancellation",
      },
    });

    return updatedInv;
  });

  revalidatePath("/dashboard/owner/keuangan");
  revalidatePath("/dashboard/owner");
  return { success: true, invoiceNumber: updated.invoiceNumber };
}

export interface CreateManualInvoiceInput {
  penghuniId: string;
  leaseId?: string;
  dueDate: string;
  notes?: string;
  lines: Array<{
    type: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export async function createManualInvoiceAction(input: CreateManualInvoiceInput) {
  const { user, organization } = await requireOrganization();

  if (!input.penghuniId) {
    throw new Error("Penyewa wajib dipilih");
  }
  if (!input.dueDate) {
    throw new Error("Tanggal jatuh tempo wajib diisi");
  }
  if (!input.lines || input.lines.length === 0) {
    throw new Error("Minimal harus ada satu baris rincian tagihan");
  }

  const totalAmount = input.lines.reduce((sum, l) => sum + (l.quantity * l.unitPrice), 0);
  if (totalAmount <= 0) {
    throw new Error("Total tagihan harus lebih besar dari Rp 0");
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const invoiceNumber = `INV-M-${year}${month}-${Date.now().toString().slice(-5)}`;

  const created = await prisma.$transaction(async (tx) => {
    return tx.invoice.create({
      data: {
        organizationId: organization.id,
        penghuniId: input.penghuniId,
        leaseId: input.leaseId || null,
        invoiceNumber,
        issueDate: now,
        dueDate: new Date(input.dueDate),
        subtotal: totalAmount,
        total: totalAmount,
        balanceDue: totalAmount,
        status: "issued",
        notes: input.notes || null,
        lines: {
          create: input.lines.map((l) => ({
            type: l.type,
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            amount: l.quantity * l.unitPrice,
          })),
        },
      },
    });
  });

  await logAuditEvent({
    organizationId: organization.id,
    actorUserId: user.id,
    action: "invoice.created_manual",
    entityType: "Invoice",
    entityId: created.id,
    afterData: {
      invoiceNumber: created.invoiceNumber,
      total: totalAmount,
      dueDate: input.dueDate,
    },
  });

  revalidatePath("/dashboard/owner/keuangan");
  revalidatePath("/dashboard/owner");
  return { success: true, invoice: created };
}

export interface RecordInvoicePaymentInput {
  invoiceId: string;
  penghuniId: string;
  amount: number;
  paymentMethod: string;
  paymentReference?: string;
}

export interface RecordManualPaymentInput {
  penghuniId: string;
  amount: number;
  paymentMethod: string;
  paymentReference?: string;
  notes?: string;
  customAllocations?: Array<{ invoiceId: string; amount: number }>;
  allowAdvancePayment?: boolean;
}

export async function getPaymentList() {
  const { organization } = await requireOrganization();

  const payments = await prisma.payment.findMany({
    where: { organizationId: organization.id },
    include: {
      penghuni: {
        select: {
          id: true,
          nama: true,
          noHp: true,
          email: true,
          kamar: {
            select: {
              id: true,
              nomor: true,
              properti: { select: { id: true, nama: true } },
            },
          },
        },
      },
      allocations: {
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              total: true,
              balanceDue: true,
              status: true,
              dueDate: true,
            },
          },
        },
      },
    },
    orderBy: { paidAt: "desc" },
  });

  return payments.map((p) => {
    const amount = Number(p.amount);
    const allocatedAmount = p.allocations.reduce((sum, a) => sum + Number(a.amount), 0);
    const unallocatedAmount = Math.max(0, amount - allocatedAmount);

    return {
      id: p.id,
      organizationId: p.organizationId,
      penghuniId: p.penghuniId,
      amount,
      allocatedAmount,
      unallocatedAmount,
      paymentMethod: p.paymentMethod,
      paymentReference: p.paymentReference,
      provider: p.provider,
      providerTransactionId: p.providerTransactionId,
      status: p.status,
      notes: p.notes,
      paidAt: p.paidAt.toISOString(),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      penghuni: p.penghuni
        ? {
            id: p.penghuni.id,
            nama: p.penghuni.nama,
            noHp: p.penghuni.noHp,
            email: p.penghuni.email,
            kamar: p.penghuni.kamar
              ? {
                  id: p.penghuni.kamar.id,
                  nomor: p.penghuni.kamar.nomor,
                  properti: p.penghuni.kamar.properti
                    ? { id: p.penghuni.kamar.properti.id, nama: p.penghuni.kamar.properti.nama }
                    : null,
                }
              : null,
          }
        : null,
      allocations: p.allocations.map((a) => ({
        id: a.id,
        paymentId: a.paymentId,
        invoiceId: a.invoiceId,
        amount: Number(a.amount),
        allocatedAt: a.allocatedAt.toISOString(),
        invoice: a.invoice
          ? {
              id: a.invoice.id,
              invoiceNumber: a.invoice.invoiceNumber,
              total: Number(a.invoice.total),
              balanceDue: Number(a.invoice.balanceDue),
              status: a.invoice.status,
              dueDate: a.invoice.dueDate.toISOString(),
            }
          : null,
      })),
    };
  });
}

export async function recordInvoicePaymentAction(input: RecordInvoicePaymentInput) {
  const { user, organization } = await requireOrganization();
  const result = await billingService.recordPayment({
    organizationId: organization.id,
    penghuniId: input.penghuniId,
    invoiceId: input.invoiceId,
    amount: input.amount,
    paymentMethod: input.paymentMethod,
    paymentReference: input.paymentReference,
    actorUserId: user.id,
  });

  revalidatePath("/dashboard/owner/keuangan");
  revalidatePath("/dashboard/owner");
  return result;
}

export async function recordManualPaymentAction(input: RecordManualPaymentInput) {
  const { user, organization } = await requireOrganization();
  const result = await billingService.recordPayment({
    organizationId: organization.id,
    penghuniId: input.penghuniId,
    amount: input.amount,
    paymentMethod: input.paymentMethod,
    paymentReference: input.paymentReference,
    notes: input.notes,
    customAllocations: input.customAllocations,
    allowAdvancePayment: input.allowAdvancePayment ?? true,
    actorUserId: user.id,
  });

  revalidatePath("/dashboard/owner/keuangan");
  revalidatePath("/dashboard/owner");
  return {
    success: true,
    paymentId: result.payment.id,
    remainingCredit: result.remainingCredit,
  };
}

export async function reconcilePaymentCreditAction(input: {
  paymentId: string;
  allocations: Array<{ invoiceId: string; amount: number }>;
}) {
  const { user, organization } = await requireOrganization();
  const result = await billingService.reconcilePaymentCredit({
    paymentId: input.paymentId,
    organizationId: organization.id,
    allocations: input.allocations,
    actorUserId: user.id,
  });

  revalidatePath("/dashboard/owner/keuangan");
  revalidatePath("/dashboard/owner");
  return {
    success: true,
    paymentId: result.payment.id,
    remainingCredit: result.remainingCredit,
  };
}

export async function refundPaymentAction(paymentId: string, reason: string) {
  const { user, organization } = await requireOrganization();
  const result = await billingService.refundPayment({
    paymentId,
    organizationId: organization.id,
    reason,
    actorUserId: user.id,
  });

  revalidatePath("/dashboard/owner/keuangan");
  revalidatePath("/dashboard/owner");
  return {
    success: true,
    paymentId: result.payment.id,
    restoredInvoicesCount: result.restoredInvoices.length,
  };
}

export async function getPaymentAuditTrailAction(paymentId: string) {
  const { organization } = await requireOrganization();
  const logs = await prisma.auditLog.findMany({
    where: {
      organizationId: organization.id,
      entityType: "Payment",
      entityId: paymentId,
    },
    include: {
      actorUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return logs.map((l) => ({
    id: l.id,
    action: l.action,
    entityType: l.entityType,
    entityId: l.entityId,
    beforeData: l.beforeData,
    afterData: l.afterData,
    createdAt: l.createdAt.toISOString(),
    actorUser: l.actorUser
      ? { id: l.actorUser.id, name: l.actorUser.name, email: l.actorUser.email }
      : null,
  }));
}

export async function createTransaksi(input: TransaksiInput) {
  const { user, organization } = await requireOrganization();

  // If this is a rent payment for a tenant, reconcile with unpaid invoices if available
  if (input.jenis === "pemasukan" && input.penghuniId && input.kategori === "Sewa Kamar") {
    const unpaidInvoice = await prisma.invoice.findFirst({
      where: {
        organizationId: organization.id,
        penghuniId: input.penghuniId,
        status: { in: ["issued", "partial", "overdue"] },
        balanceDue: { gt: 0 },
      },
      orderBy: { dueDate: "asc" },
    });

    if (unpaidInvoice) {
      await billingService.recordPayment({
        organizationId: organization.id,
        penghuniId: input.penghuniId,
        invoiceId: unpaidInvoice.id,
        amount: input.jumlah,
        paymentMethod: "cash",
        paymentReference: input.keterangan || "Kasir Manual",
        actorUserId: user.id,
      });

      const createdTx = await prisma.transaksi.findFirst({
        where: {
          organizationId: organization.id,
          penghuniId: input.penghuniId,
          jenis: "pemasukan",
        },
        orderBy: { createdAt: "desc" },
        include: includeRelasi,
      });

      revalidatePath("/dashboard/owner/keuangan");
      revalidatePath("/dashboard/owner");
      revalidatePath("/dashboard/tenant/tagihan");
      if (createdTx) return createdTx;
    }
  }

  const created = await prisma.transaksi.create({
    data: {
      jenis: input.jenis,
      kategori: input.kategori,
      jumlah: input.jumlah,
      tanggal: new Date(input.tanggal),
      keterangan: input.keterangan,
      kamarId: input.kamarId || null,
      penghuniId: input.penghuniId || null,
      ownerId: user.id,
      organizationId: organization.id,
    },
    include: includeRelasi,
  });

  revalidatePath("/dashboard/owner/keuangan");
  revalidatePath("/dashboard/owner");
  return created;
}

export async function updateTransaksi(id: string, input: TransaksiInput) {
  const ownerId = await requireOwnerId();
  
  const existing = await prisma.transaksi.findUnique({ where: { id } });
  if (!existing || existing.ownerId !== ownerId) throw new Error("Unauthorized");

  const updated = await prisma.transaksi.update({
    where: { id },
    data: {
      jenis: input.jenis,
      kategori: input.kategori,
      jumlah: input.jumlah,
      tanggal: new Date(input.tanggal),
      keterangan: input.keterangan,
      kamarId: input.kamarId || null,
      penghuniId: input.penghuniId || null,
    },
    include: includeRelasi,
  });

  revalidatePath("/dashboard/owner/keuangan");
  return updated;
}

export async function deleteTransaksi(id: string) {
  const ownerId = await requireOwnerId();
  const existing = await prisma.transaksi.findUnique({ where: { id } });
  if (!existing || existing.ownerId !== ownerId) throw new Error("Unauthorized");
  
  await logAuditEvent({
    organizationId: existing.organizationId,
    actorUserId: ownerId,
    action: "transaction.deleted",
    entityType: "Transaksi",
    entityId: id,
    beforeData: {
      jenis: existing.jenis,
      kategori: existing.kategori,
      jumlah: existing.jumlah,
      tanggal: existing.tanggal,
    },
  });

  await prisma.transaksi.delete({ where: { id } });
  revalidatePath("/dashboard/owner/keuangan");
}

// Dipanggil dari halaman Penghuni saat penghuni membayar sewa.
// Otomatis membuat transaksi Pemasukan kategori "Sewa Kamar" yang
// sudah tertaut ke penghuni & kamarnya, jadi langsung muncul di Keuangan.
export interface PembayaranSewaInput {
  penghuniId: string;
  kamarId: string;
  jumlah: number;
  tanggal: string; // ISO date (yyyy-mm-dd)
  keterangan?: string;
}

export async function catatPembayaranSewa(input: PembayaranSewaInput) {
  const { user, organization } = await requireOrganization();

  // Check if unpaid invoice exists for this tenant
  const unpaidInvoice = await prisma.invoice.findFirst({
    where: {
      organizationId: organization.id,
      penghuniId: input.penghuniId,
      status: { in: ["issued", "partial", "overdue"] },
      balanceDue: { gt: 0 },
    },
    orderBy: { dueDate: "asc" },
  });

  if (unpaidInvoice) {
    await billingService.recordPayment({
      organizationId: organization.id,
      penghuniId: input.penghuniId,
      invoiceId: unpaidInvoice.id,
      amount: input.jumlah,
      paymentMethod: "cash",
      paymentReference: input.keterangan || "Pembayaran Sewa Kasir",
      actorUserId: user.id,
    });

    const createdTx = await prisma.transaksi.findFirst({
      where: {
        organizationId: organization.id,
        penghuniId: input.penghuniId,
        jenis: "pemasukan",
      },
      orderBy: { createdAt: "desc" },
      include: includeRelasi,
    });

    revalidatePath("/dashboard/owner/keuangan");
    revalidatePath("/dashboard/owner/penghuni");
    revalidatePath("/dashboard/owner");
    revalidatePath("/dashboard/tenant/tagihan");
    if (createdTx) return createdTx;
  }

  const created = await prisma.transaksi.create({
    data: {
      jenis: "pemasukan",
      kategori: "Sewa Kamar",
      jumlah: input.jumlah,
      tanggal: new Date(input.tanggal),
      keterangan: input.keterangan,
      penghuniId: input.penghuniId,
      kamarId: input.kamarId,
      ownerId: user.id,
      organizationId: organization.id,
    },
    include: includeRelasi,
  });

  revalidatePath("/dashboard/owner/keuangan");
  revalidatePath("/dashboard/owner/penghuni");
  revalidatePath("/dashboard/owner");
  revalidatePath("/dashboard/tenant/tagihan");
  return created;
}
