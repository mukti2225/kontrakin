"use server";

import { prisma } from "@/lib/db/prisma";
import { requireOrganization } from "@/lib/auth/get-current-user";
import { logAuditEvent } from "@/lib/audit/audit-logger";
import { revalidatePath } from "next/cache";

export interface CreateLeaseInput {
  penghuniId: string;
  kamarId: string;
  nomorKontrak?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  billingFrequency?: "monthly" | "quarterly" | "yearly";
  rentAmount: number;
  depositAmount?: number;
  depositReceived?: boolean;
  billingDay?: number;
  notes?: string;
  sendPortalAccess?: boolean;
  originUrl?: string;
  additionalCharges?: Array<{
    type: string;
    name: string;
    amount: number;
  }>;
}

export async function getLeaseList() {
  const { user, organization } = await requireOrganization();

  // Find leases belonging to the organization or owner
  const leases = await prisma.lease.findMany({
    where: {
      OR: [
        { organizationId: organization.id },
        { kamar: { ownerId: user.id } },
      ],
    },
    include: {
      penghuni: true,
      kamar: {
        include: { properti: { select: { id: true, nama: true } } },
      },
      charges: true,
      invoices: {
        select: {
          id: true,
          invoiceNumber: true,
          total: true,
          balanceDue: true,
          status: true,
          dueDate: true,
        },
        orderBy: { dueDate: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return leases.map((lease) => ({
    ...lease,
    rentAmount: Number(lease.rentAmount),
    depositAmount: Number(lease.depositAmount),
    charges: lease.charges.map((c) => ({
      ...c,
      amount: Number(c.amount),
    })),
    invoices: (lease.invoices ?? []).map((inv) => ({
      ...inv,
      total: Number(inv.total),
      balanceDue: Number(inv.balanceDue),
    })),
  }));
}

export async function createLease(input: CreateLeaseInput) {
  const { user, organization } = await requireOrganization();

  // Validate room ownership
  const kamar = await prisma.kamar.findUnique({
    where: { id: input.kamarId },
  });

  if (!kamar || (kamar.ownerId !== user.id && kamar.organizationId !== organization.id)) {
    throw new Error("Kamar tidak ditemukan atau bukan milik organisasi Anda");
  }

  // Prevent conflicting active lease on this room
  const conflictingLease = await prisma.lease.findFirst({
    where: {
      kamarId: input.kamarId,
      status: "active",
    },
    include: { penghuni: true },
  });

  if (conflictingLease) {
    throw new Error(
      `Kamar ini masih memiliki kontrak sewa aktif (${conflictingLease.nomorKontrak ?? "Aktif"}) atas nama ${conflictingLease.penghuni?.nama ?? "penyewa lain"}. Selesaikan atau batalkan kontrak sebelumnya terlebih dahulu.`
    );
  }

  // Validate tenant ownership
  const penghuni = await prisma.penghuni.findUnique({
    where: { id: input.penghuniId },
  });

  if (!penghuni || (penghuni.ownerId !== user.id && penghuni.organizationId !== organization.id)) {
    throw new Error("Penyewa tidak ditemukan atau bukan milik organisasi Anda");
  }

  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);

  if (endDate <= startDate) {
    throw new Error("Tanggal selesai harus setelah tanggal mulai sewa");
  }

  const leaseNumber =
    input.nomorKontrak?.trim() ||
    `KTR-${Date.now().toString().slice(-6)}`;

  const lease = await prisma.$transaction(async (tx) => {
    // 1. Create Lease
    const createdLease = await tx.lease.create({
      data: {
        organizationId: organization.id,
        penghuniId: input.penghuniId,
        kamarId: input.kamarId,
        nomorKontrak: leaseNumber,
        startDate,
        endDate,
        billingFrequency: input.billingFrequency || "monthly",
        rentAmount: input.rentAmount,
        depositAmount: input.depositAmount || 0,
        billingDay: input.billingDay || 1,
        status: "active",
        notes: input.notes || null,
        charges: {
          create: [
            {
              type: "rent",
              name: "Sewa Pokok",
              amount: input.rentAmount,
              isRecurring: true,
            },
            ...(input.additionalCharges || []).map((ch) => ({
              type: ch.type,
              name: ch.name,
              amount: ch.amount,
              isRecurring: true,
            })),
          ],
        },
      },
      include: {
        charges: true,
        penghuni: true,
        kamar: {
          include: { properti: { select: { id: true, nama: true } } },
        },
      },
    });

    // 2. Update room status to terisi and link tenant
    await tx.kamar.update({
      where: { id: input.kamarId },
      data: { status: "terisi" },
    });

    await tx.penghuni.update({
      where: { id: input.penghuniId },
      data: {
        kamarId: input.kamarId,
        status: "aktif",
        tanggalMasuk: startDate,
        tanggalKeluar: endDate,
      },
    });

    // 3. Auto-record deposit payment to cashbook if already received
    if (input.depositReceived && input.depositAmount && input.depositAmount > 0) {
      await tx.transaksi.create({
        data: {
          jenis: "pemasukan",
          kategori: "Deposit",
          jumlah: Math.round(input.depositAmount),
          tanggal: new Date(),
          keterangan: `Penerimaan deposit jaminan sewa: Kontrak ${leaseNumber} (Kamar ${kamar.nomor})`,
          kamarId: input.kamarId,
          penghuniId: input.penghuniId,
          ownerId: user.id,
          organizationId: organization.id,
        },
      });
    }

    return createdLease;
  });

  await logAuditEvent({
    organizationId: organization.id,
    actorUserId: user.id,
    action: "lease.created",
    entityType: "Lease",
    entityId: lease.id,
    afterData: {
      nomorKontrak: lease.nomorKontrak,
      penghuniId: lease.penghuniId,
      kamarId: lease.kamarId,
      rentAmount: input.rentAmount,
      depositAmount: input.depositAmount,
    },
  });

  // Auto-send tenant portal access if requested
  let portalAccessResult = null;
  if (input.sendPortalAccess) {
    try {
      const { TenantActivationService } = await import("@/lib/services/tenant-activation-service");
      portalAccessResult = await TenantActivationService.sendPortalAccess({
        penghuniId: input.penghuniId,
        organizationId: organization.id,
        actorUserId: user.id,
        channel: "whatsapp",
        originUrl: input.originUrl,
      });
    } catch (portalErr) {
      console.error("Failed to auto-send portal access:", portalErr);
    }
  }

  return {
    ...lease,
    rentAmount: Number(lease.rentAmount),
    depositAmount: Number(lease.depositAmount),
    portalAccessResult,
    charges: lease.charges.map((c) => ({
      ...c,
      amount: Number(c.amount),
    })),
    invoices: [],
  };
}

export async function updateLeaseStatus(
  leaseId: string,
  newStatus: "active" | "expiring" | "renewed" | "completed" | "terminated"
) {
  const { user, organization } = await requireOrganization();

  const existing = await prisma.lease.findUnique({
    where: { id: leaseId },
    include: { kamar: true, penghuni: true },
  });

  if (!existing || (existing.organizationId !== organization.id && existing.kamar.ownerId !== user.id)) {
    throw new Error("Kontrak sewa tidak ditemukan atau bukan milik organisasi Anda");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.lease.update({
      where: { id: leaseId },
      data: { status: newStatus },
    });

    // If lease completed or terminated, release room
    if (newStatus === "completed" || newStatus === "terminated") {
      await tx.kamar.update({
        where: { id: existing.kamarId },
        data: { status: "kosong" },
      });

      await tx.penghuni.update({
        where: { id: existing.penghuniId },
        data: {
          status: "nonaktif",
          kamarId: null,
          tanggalKeluar: new Date(),
        },
      });
    }

    return res;
  });

  await logAuditEvent({
    organizationId: organization.id,
    actorUserId: user.id,
    action: `lease.status_${newStatus}`,
    entityType: "Lease",
    entityId: leaseId,
    beforeData: { status: existing.status },
    afterData: { status: newStatus },
  });

  revalidatePath("/dashboard/owner/kontrak");
  revalidatePath("/dashboard/owner/penghuni");
  revalidatePath("/dashboard/owner/properti");
  revalidatePath("/dashboard/owner/kamar");

  return updated;
}

export interface RenewLeaseInput {
  oldLeaseId: string;
  newEndDate: string; // YYYY-MM-DD
  newRentAmount?: number;
  newDepositAmount?: number;
  notes?: string;
}

export async function renewLease(input: RenewLeaseInput) {
  const { user, organization } = await requireOrganization();

  const oldLease = await prisma.lease.findUnique({
    where: { id: input.oldLeaseId },
    include: { kamar: true, penghuni: true, charges: true },
  });

  if (!oldLease || (oldLease.organizationId !== organization.id && oldLease.kamar.ownerId !== user.id)) {
    throw new Error("Kontrak sewa lama tidak ditemukan atau bukan milik organisasi Anda");
  }

  const renewalStartDate = new Date(oldLease.endDate);
  const renewalEndDate = new Date(input.newEndDate);

  if (renewalEndDate <= renewalStartDate) {
    throw new Error("Tanggal perpanjangan baru harus setelah tanggal berakhir kontrak sebelumnya");
  }

  const newRent =
    input.newRentAmount !== undefined && input.newRentAmount > 0
      ? input.newRentAmount
      : Number(oldLease.rentAmount);
  const newDeposit =
    input.newDepositAmount !== undefined
      ? input.newDepositAmount
      : Number(oldLease.depositAmount);
  const newLeaseNumber = `${oldLease.nomorKontrak ?? "KTR"}-RNW`;

  const renewed = await prisma.$transaction(async (tx) => {
    // 1. Tandai kontrak lama sebagai diperpanjang (renewed)
    await tx.lease.update({
      where: { id: oldLease.id },
      data: { status: "renewed" },
    });

    // 2. Buat kontrak baru yang aktif
    const created = await tx.lease.create({
      data: {
        organizationId: organization.id,
        penghuniId: oldLease.penghuniId,
        kamarId: oldLease.kamarId,
        nomorKontrak: newLeaseNumber,
        startDate: renewalStartDate,
        endDate: renewalEndDate,
        billingFrequency: oldLease.billingFrequency,
        rentAmount: newRent,
        depositAmount: newDeposit,
        billingDay: oldLease.billingDay,
        status: "active",
        notes:
          input.notes ??
          `Perpanjangan resmi dari kontrak ${oldLease.nomorKontrak ?? oldLease.id}`,
        charges: {
          create: [
            {
              type: "rent",
              name: "Sewa Pokok (Perpanjangan)",
              amount: newRent,
              isRecurring: true,
            },
          ],
        },
      },
      include: {
        charges: true,
        penghuni: true,
        kamar: {
          include: { properti: { select: { id: true, nama: true } } },
        },
        invoices: {
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
    });

    // 3. Update tanggal keluar penyewa
    await tx.penghuni.update({
      where: { id: oldLease.penghuniId },
      data: {
        tanggalKeluar: renewalEndDate,
      },
    });

    return created;
  });

  await logAuditEvent({
    organizationId: organization.id,
    actorUserId: user.id,
    action: "lease.renewed",
    entityType: "Lease",
    entityId: renewed.id,
    beforeData: { oldLeaseId: oldLease.id, previousEndDate: oldLease.endDate },
    afterData: {
      newLeaseId: renewed.id,
      newEndDate: renewalEndDate,
      rentAmount: newRent,
    },
  });

  revalidatePath("/dashboard/owner/kontrak");
  revalidatePath("/dashboard/owner/penghuni");
  revalidatePath("/dashboard/owner/properti");
  revalidatePath("/dashboard/owner/kamar");

  return {
    ...renewed,
    rentAmount: Number(renewed.rentAmount),
    depositAmount: Number(renewed.depositAmount),
    charges: renewed.charges.map((c) => ({
      ...c,
      amount: Number(c.amount),
    })),
    invoices: (renewed.invoices ?? []).map((inv) => ({
      ...inv,
      total: Number(inv.total),
      balanceDue: Number(inv.balanceDue),
    })),
  };
}

