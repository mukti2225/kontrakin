"use server";

import { prisma } from "@/lib/db/prisma";
import { requireOrganization } from "@/lib/auth/get-current-user";
import { logAuditEvent } from "@/lib/audit/audit-logger";
import { revalidatePath } from "next/cache";

export async function getPemeliharaanList() {
  const { user, organization } = await requireOrganization();

  const items = await prisma.pemeliharaan.findMany({
    where: {
      OR: [
        { organizationId: organization.id },
        { ownerId: user.id },
      ],
    },
    include: {
      penghuni: { select: { id: true, nama: true, noHp: true } },
      kamar: {
        include: { properti: { select: { id: true, nama: true } } },
      },
      vendor: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return items.map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));
}

export async function getVendorList() {
  const { organization } = await requireOrganization();

  const vendors = await prisma.vendor.findMany({
    where: { organizationId: organization.id },
    include: {
      pemeliharaan: {
        include: {
          kamar: {
            include: { properti: { select: { id: true, nama: true } } },
          },
          penghuni: { select: { id: true, nama: true, noHp: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return vendors.map((v) => ({
    ...v,
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
    pemeliharaan: v.pemeliharaan.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
  }));
}

export interface UpdateStatusPemeliharaanOptions {
  biaya?: number;
  catatPengeluaran?: boolean;
  catatanBiaya?: string;
}

export async function updateStatusPemeliharaan(
  id: string,
  newStatus: "menunggu" | "diproses" | "selesai",
  options?: UpdateStatusPemeliharaanOptions
) {
  const { user, organization } = await requireOrganization();

  const existing = await prisma.pemeliharaan.findUnique({
    where: { id },
    include: { kamar: true, penghuni: true },
  });

  if (!existing || (existing.ownerId !== user.id && existing.organizationId !== organization.id)) {
    throw new Error("Tiket pemeliharaan tidak ditemukan atau bukan milik organisasi Anda");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedTicket = await tx.pemeliharaan.update({
      where: { id },
      data: {
        status: newStatus,
        organizationId: organization.id,
      },
      include: {
        penghuni: true,
        kamar: {
          include: { properti: { select: { id: true, nama: true } } },
        },
        vendor: true,
      },
    });

    if (newStatus === "selesai" && options?.catatPengeluaran && options.biaya && options.biaya > 0) {
      const vendorTag = existing.vendorId
        ? `[Vendor: ${updatedTicket.vendor?.name || "Teknisi"}]`
        : "";
      const ticketTag = `[Tiket: #${existing.id.slice(-6).toUpperCase()} - ${existing.judul}]`;
      const cleanDesc =
        options.catatanBiaya?.trim() ||
        `Biaya perbaikan: ${existing.judul} (Kamar ${existing.kamar?.nomor || "-"})`;

      await tx.transaksi.create({
        data: {
          jenis: "pengeluaran",
          kategori: "Pemeliharaan",
          jumlah: Math.round(options.biaya),
          tanggal: new Date(),
          keterangan: `${ticketTag} ${vendorTag} ${cleanDesc}`.trim(),
          kamarId: existing.kamarId,
          penghuniId: existing.penghuniId,
          ownerId: user.id,
          organizationId: organization.id,
        },
      });
    }

    return updatedTicket;
  });

  await logAuditEvent({
    organizationId: organization.id,
    actorUserId: user.id,
    action: "maintenance.status_updated",
    entityType: "Pemeliharaan",
    entityId: id,
    beforeData: { status: existing.status },
    afterData: {
      status: newStatus,
      expenseRecorded: Boolean(options?.catatPengeluaran && options?.biaya),
    },
  });

  revalidatePath("/dashboard/owner/pemeliharaan");
  revalidatePath("/dashboard/owner/keuangan");
  revalidatePath("/dashboard/owner");
  return updated;
}

export interface CreatePemeliharaanInput {
  judul: string;
  deskripsi: string;
  kategori: string;
  prioritas: "rendah" | "sedang" | "tinggi";
  kamarId: string;
  penghuniId: string;
  vendorId?: string | null;
  assignedStaff?: string | null;
  foto?: string | null;
  estimasiBiaya?: number;
}

export async function createPemeliharaanAction(input: CreatePemeliharaanInput) {
  const { user, organization } = await requireOrganization();

  if (!input.judul.trim() || !input.deskripsi.trim()) {
    throw new Error("Judul keluhan dan deskripsi wajib diisi");
  }
  if (!input.kamarId || !input.penghuniId) {
    throw new Error("Kamar dan penyewa wajib dipilih");
  }

  // Format description with metadata tags if applicable
  const tags: string[] = [];
  if (input.estimasiBiaya && input.estimasiBiaya > 0) {
    tags.push(`[Estimasi: Rp ${Math.round(input.estimasiBiaya).toLocaleString("id-ID")}]`);
  }
  if (input.assignedStaff?.trim()) {
    tags.push(`[PIC: ${input.assignedStaff.trim()}]`);
  }
  const fullDescription = tags.length > 0 ? `${tags.join(" ")} ${input.deskripsi.trim()}` : input.deskripsi.trim();

  const initialStatus = input.vendorId || input.assignedStaff ? "diproses" : "menunggu";

  const created = await prisma.pemeliharaan.create({
    data: {
      judul: input.judul.trim(),
      deskripsi: fullDescription,
      kategori: input.kategori || "Lain-lain",
      prioritas: input.prioritas || "sedang",
      status: initialStatus,
      foto: input.foto?.trim() || null,
      kamarId: input.kamarId,
      penghuniId: input.penghuniId,
      vendorId: input.vendorId || null,
      ownerId: user.id,
      organizationId: organization.id,
    },
    include: {
      penghuni: { select: { id: true, nama: true, noHp: true } },
      kamar: {
        include: { properti: { select: { id: true, nama: true } } },
      },
      vendor: true,
    },
  });

  await logAuditEvent({
    organizationId: organization.id,
    actorUserId: user.id,
    action: "maintenance.created",
    entityType: "Pemeliharaan",
    entityId: created.id,
    afterData: {
      judul: created.judul,
      kategori: created.kategori,
      prioritas: created.prioritas,
      kamarId: created.kamarId,
      penghuniId: created.penghuniId,
      vendorId: created.vendorId,
    },
  });

  revalidatePath("/dashboard/owner/pemeliharaan");
  revalidatePath("/dashboard/owner");
  return {
    ...created,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };
}

export async function reopenPemeliharaanAction(id: string, reason: string) {
  const { user, organization } = await requireOrganization();

  const existing = await prisma.pemeliharaan.findUnique({
    where: { id },
  });

  if (!existing || (existing.ownerId !== user.id && existing.organizationId !== organization.id)) {
    throw new Error("Tiket pemeliharaan tidak ditemukan atau bukan milik organisasi Anda");
  }

  const updatedDesc = `${existing.deskripsi} [Reopen: ${reason.trim()} (${new Date().toLocaleDateString("id-ID")})]`.trim();

  const updated = await prisma.pemeliharaan.update({
    where: { id },
    data: {
      status: "diproses",
      deskripsi: updatedDesc,
    },
    include: {
      penghuni: { select: { id: true, nama: true, noHp: true } },
      kamar: {
        include: { properti: { select: { id: true, nama: true } } },
      },
      vendor: true,
    },
  });

  await logAuditEvent({
    organizationId: organization.id,
    actorUserId: user.id,
    action: "maintenance.reopened",
    entityType: "Pemeliharaan",
    entityId: id,
    beforeData: { status: existing.status },
    afterData: { status: "diproses", reopenReason: reason },
  });

  revalidatePath("/dashboard/owner/pemeliharaan");
  revalidatePath("/dashboard/owner");
  return {
    ...updated,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}


export async function assignVendorPemeliharaan(id: string, vendorId: string | null) {
  const { user, organization } = await requireOrganization();

  const existing = await prisma.pemeliharaan.findUnique({
    where: { id },
  });

  if (!existing || (existing.ownerId !== user.id && existing.organizationId !== organization.id)) {
    throw new Error("Tiket pemeliharaan tidak ditemukan atau bukan milik organisasi Anda");
  }

  const updated = await prisma.pemeliharaan.update({
    where: { id },
    data: {
      vendorId: vendorId || null,
      status: vendorId && existing.status === "menunggu" ? "diproses" : existing.status,
    },
    include: {
      penghuni: true,
      kamar: true,
      vendor: true,
    },
  });

  await logAuditEvent({
    organizationId: organization.id,
    actorUserId: user.id,
    action: "maintenance.vendor_assigned",
    entityType: "Pemeliharaan",
    entityId: id,
    afterData: { vendorId },
  });

  revalidatePath("/dashboard/owner/pemeliharaan");
  return updated;
}

export interface CreateVendorInput {
  name: string;
  category: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
}

export async function createVendorAction(input: CreateVendorInput) {
  const { user, organization } = await requireOrganization();

  if (!input.name.trim() || !input.phone.trim()) {
    throw new Error("Nama vendor dan nomor telepon wajib diisi");
  }

  const vendor = await prisma.vendor.create({
    data: {
      organizationId: organization.id,
      name: input.name.trim(),
      category: input.category || "General",
      phone: input.phone.trim(),
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
      notes: input.notes?.trim() || null,
    },
  });

  await logAuditEvent({
    organizationId: organization.id,
    actorUserId: user.id,
    action: "vendor.created",
    entityType: "Vendor",
    entityId: vendor.id,
    afterData: { name: vendor.name, category: vendor.category },
  });

  revalidatePath("/dashboard/owner/pemeliharaan");
  return vendor;
}

export async function triageMaintenanceComplaintAction(judul: string, deskripsi: string) {
  await requireOrganization();
  const { triageMaintenanceTicket } = await import("@/lib/intelligence/maintenance-triage");
  return triageMaintenanceTicket({ judul, deskripsi });
}

export interface UpdateVendorInput {
  name: string;
  category: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  rating?: number | null;
}

export async function updateVendorAction(id: string, input: UpdateVendorInput) {
  const { user, organization } = await requireOrganization();

  const existing = await prisma.vendor.findUnique({
    where: { id },
  });

  if (!existing || existing.organizationId !== organization.id) {
    throw new Error("Vendor tidak ditemukan atau bukan milik organisasi Anda");
  }

  if (!input.name.trim() || !input.phone.trim()) {
    throw new Error("Nama vendor dan nomor telepon wajib diisi");
  }

  const updated = await prisma.vendor.update({
    where: { id },
    data: {
      name: input.name.trim(),
      category: input.category || existing.category,
      phone: input.phone.trim(),
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
      notes: input.notes?.trim() || null,
      rating: input.rating !== undefined ? input.rating : existing.rating,
    },
    include: {
      pemeliharaan: {
        include: {
          kamar: {
            include: { properti: { select: { id: true, nama: true } } },
          },
          penghuni: { select: { id: true, nama: true, noHp: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  await logAuditEvent({
    organizationId: organization.id,
    actorUserId: user.id,
    action: "vendor.updated",
    entityType: "Vendor",
    entityId: id,
    beforeData: { name: existing.name, phone: existing.phone },
    afterData: { name: updated.name, phone: updated.phone },
  });

  revalidatePath("/dashboard/owner/pemeliharaan");
  return {
    ...updated,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    pemeliharaan: updated.pemeliharaan.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
  };
}

export async function deleteVendorAction(id: string) {
  const { user, organization } = await requireOrganization();

  const existing = await prisma.vendor.findUnique({
    where: { id },
    include: {
      pemeliharaan: {
        where: { status: { in: ["menunggu", "diproses"] } },
      },
    },
  });

  if (!existing || existing.organizationId !== organization.id) {
    throw new Error("Vendor tidak ditemukan atau bukan milik organisasi Anda");
  }

  if (existing.pemeliharaan.length > 0) {
    throw new Error(
      `Vendor "${existing.name}" tidak dapat dihapus karena masih memiliki ${existing.pemeliharaan.length} tiket perbaikan aktif yang belum selesai. Alihkan penugasan tiket terlebih dahulu.`
    );
  }

  // Unlink any completed historical tickets before deletion to preserve historical tickets
  await prisma.pemeliharaan.updateMany({
    where: { vendorId: id },
    data: { vendorId: null },
  });

  await prisma.vendor.delete({
    where: { id },
  });

  await logAuditEvent({
    organizationId: organization.id,
    actorUserId: user.id,
    action: "vendor.deleted",
    entityType: "Vendor",
    entityId: id,
    beforeData: { name: existing.name, category: existing.category },
  });

  revalidatePath("/dashboard/owner/pemeliharaan");
  return { success: true };
}

