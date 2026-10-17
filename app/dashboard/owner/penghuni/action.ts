"use server";

import { prisma } from "@/lib/db/prisma";
import { requireOrganization } from "@/lib/auth/get-current-user";
import { normalizeIndonesianPhone } from "@/lib/communication/provider";
import { logAuditEvent } from "@/lib/audit/audit-logger";
import { revalidatePath } from "next/cache";

const PENGHUNI_PATH = "/dashboard/owner/penghuni";
const PROPERTI_PATH = "/dashboard/owner/properti";

export interface PenghuniInput {
  nama: string;
  noHp: string;
  email?: string;
  noKtp?: string;
  tanggalMasuk: string; // format "YYYY-MM-DD" dari <input type="date">
  catatan?: string;
}

// LIST — semua penghuni milik organisasi/owner ini beserta kamar, kontrak aktif, invoice terbuka, dan maintenance
export async function getPenghuniList() {
  const { user, organization } = await requireOrganization();
  return prisma.penghuni.findMany({
    where: {
      OR: [
        { organizationId: organization.id },
        { ownerId: user.id },
      ],
    },
    include: {
      kamar: {
        include: {
          properti: { select: { id: true, nama: true } },
        },
      },
      leases: {
        where: { status: "active" },
        take: 1,
        select: {
          id: true,
          status: true,
          startDate: true,
          endDate: true,
          rentAmount: true,
          billingFrequency: true,
        },
      },
      invoices: {
        where: { status: { in: ["issued", "overdue", "partial"] } },
        select: {
          id: true,
          invoiceNumber: true,
          total: true,
          balanceDue: true,
          status: true,
          dueDate: true,
        },
      },
      pemeliharaan: {
        select: {
          id: true,
          judul: true,
          status: true,
          prioritas: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      },
      activationTokens: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: {
          createdAt: true,
          expiresAt: true,
          usedAt: true,
          revokedAt: true,
        },
      },
    },
    orderBy: { nama: "asc" },
  });
}

// LIST — hanya penghuni aktif milik organisasi/owner ini (dipakai dropdown di halaman Kamar)
export async function getPenghuniAktif() {
  const { user, organization } = await requireOrganization();
  return prisma.penghuni.findMany({
    where: {
      status: "aktif",
      OR: [
        { organizationId: organization.id },
        { ownerId: user.id },
      ],
    },
    orderBy: { nama: "asc" },
  });
}

// CREATE
export async function createPenghuni(data: PenghuniInput) {
  const { user, organization } = await requireOrganization();
  const normalizedPhone = normalizeIndonesianPhone(data.noHp);

  const penghuni = await prisma.penghuni.create({
    data: {
      nama: data.nama.trim(),
      noHp: normalizedPhone,
      email: data.email?.trim() || undefined,
      noKtp: data.noKtp?.trim() || undefined,
      tanggalMasuk: new Date(data.tanggalMasuk),
      catatan: data.catatan?.trim() || undefined,
      status: "aktif",
      ownerId: user.id,
      organizationId: organization.id,
    },
  });
  revalidatePath(PENGHUNI_PATH);
  return penghuni;
}

// UPDATE
export async function updatePenghuni(id: string, data: PenghuniInput) {
  const { user, organization } = await requireOrganization();

  const existing = await prisma.penghuni.findUnique({ where: { id } });
  if (!existing || (existing.ownerId !== user.id && existing.organizationId !== organization.id)) {
    throw new Error("Penghuni tidak ditemukan atau bukan milik organisasi Anda");
  }

  const normalizedPhone = normalizeIndonesianPhone(data.noHp);

  const penghuni = await prisma.penghuni.update({
    where: { id },
    data: {
      nama: data.nama.trim(),
      noHp: normalizedPhone,
      email: data.email?.trim() || null,
      noKtp: data.noKtp?.trim() || null,
      tanggalMasuk: new Date(data.tanggalMasuk),
      catatan: data.catatan?.trim() || null,
      organizationId: organization.id,
    },
  });
  revalidatePath(PENGHUNI_PATH);
  revalidatePath(PROPERTI_PATH);
  return penghuni;
}

// NONAKTIFKAN (keluar dari kamar, tapi data tetap tersimpan sebagai histori)
export async function nonaktifkanPenghuni(id: string) {
  const { user, organization } = await requireOrganization();

  const existing = await prisma.penghuni.findUnique({ where: { id } });
  if (!existing || (existing.ownerId !== user.id && existing.organizationId !== organization.id)) {
    throw new Error("Penghuni tidak ditemukan atau bukan milik organisasi Anda");
  }

  const penghuni = await prisma.$transaction(async (tx) => {
    if (existing.kamarId) {
      await tx.kamar.update({
        where: { id: existing.kamarId },
        data: { status: "kosong" },
      });
    }

    return tx.penghuni.update({
      where: { id },
      data: {
        status: "nonaktif",
        tanggalKeluar: new Date(),
        kamarId: null,
      },
    });
  });

  revalidatePath(PENGHUNI_PATH);
  revalidatePath(PROPERTI_PATH);
  return penghuni;
}

// DELETE permanen
export async function deletePenghuni(id: string) {
  const { user, organization } = await requireOrganization();

  const existing = await prisma.penghuni.findUnique({ where: { id } });
  if (!existing || (existing.ownerId !== user.id && existing.organizationId !== organization.id)) {
    throw new Error("Penghuni tidak ditemukan atau bukan milik organisasi Anda");
  }

  await prisma.penghuni.delete({ where: { id } });
  revalidatePath(PENGHUNI_PATH);
  revalidatePath(PROPERTI_PATH);
}

export interface ImportPenghuniRow {
  rowNumber?: number;
  nama: string;
  noHp: string;
  email?: string;
  noKtp?: string;
  tanggalMasuk?: string;
  catatan?: string;
}

export interface ImportRowError {
  rowNumber: number;
  nama: string;
  noHp: string;
  email?: string;
  noKtp?: string;
  tanggalMasuk?: string;
  catatan?: string;
  reason: string;
}

export interface ImportBatchResult {
  success: boolean;
  totalProcessed: number;
  importedCount: number;
  failedCount: number;
  created: any[];
  errors: ImportRowError[];
}

export async function importPenghuniBatch(
  rows: ImportPenghuniRow[],
  options?: { fileName?: string }
): Promise<ImportBatchResult> {
  const { user, organization, role: callerRole } = await requireOrganization();

  if (callerRole === "viewer") {
    throw new Error("Peran Anda tidak memiliki izin untuk mengimpor data penyewa");
  }

  if (!rows || rows.length === 0) {
    throw new Error("Tidak ada data penghuni untuk diimpor");
  }

  // 1. Validasi baris & deteksi duplikat internal dalam batch
  const seenPhones = new Set<string>();
  const validCandidates: { row: ImportPenghuniRow; normalizedPhone: string; rowNumber: number }[] = [];
  const errors: ImportRowError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNumber = r.rowNumber ?? (i + 1);
    const cleanNama = r.nama?.trim() || "";
    const cleanNoHp = r.noHp?.trim() || "";

    if (!cleanNama) {
      errors.push({
        rowNumber,
        nama: cleanNama,
        noHp: cleanNoHp,
        email: r.email,
        noKtp: r.noKtp,
        tanggalMasuk: r.tanggalMasuk,
        catatan: r.catatan,
        reason: "Nama penyewa wajib diisi",
      });
      continue;
    }

    if (!cleanNoHp) {
      errors.push({
        rowNumber,
        nama: cleanNama,
        noHp: cleanNoHp,
        email: r.email,
        noKtp: r.noKtp,
        tanggalMasuk: r.tanggalMasuk,
        catatan: r.catatan,
        reason: "Nomor WhatsApp/HP wajib diisi",
      });
      continue;
    }

    const digits = cleanNoHp.replace(/\D/g, "");
    if (digits.length < 9 || digits.length > 15) {
      errors.push({
        rowNumber,
        nama: cleanNama,
        noHp: cleanNoHp,
        email: r.email,
        noKtp: r.noKtp,
        tanggalMasuk: r.tanggalMasuk,
        catatan: r.catatan,
        reason: "Format nomor HP tidak valid (harus 9-15 digit)",
      });
      continue;
    }

    const normalizedPhone = normalizeIndonesianPhone(cleanNoHp);
    if (seenPhones.has(normalizedPhone)) {
      errors.push({
        rowNumber,
        nama: cleanNama,
        noHp: cleanNoHp,
        email: r.email,
        noKtp: r.noKtp,
        tanggalMasuk: r.tanggalMasuk,
        catatan: r.catatan,
        reason: "Nomor HP duplikat dalam file impor ini",
      });
      continue;
    }

    seenPhones.add(normalizedPhone);
    validCandidates.push({ row: r, normalizedPhone, rowNumber });
  }

  // 2. Deteksi duplikat terhadap data penyewa yang sudah ada di organisasi
  const candidatePhones = validCandidates.map((c) => c.normalizedPhone);
  const existingPenghuni =
    candidatePhones.length > 0
      ? await prisma.penghuni.findMany({
          where: {
            organizationId: organization.id,
            noHp: { in: candidatePhones },
          },
          select: { noHp: true, nama: true },
        })
      : [];

  const existingPhoneMap = new Map<string, string>();
  for (const p of existingPenghuni) {
    existingPhoneMap.set(p.noHp, p.nama);
  }

  const rowsToInsert: { row: ImportPenghuniRow; normalizedPhone: string }[] = [];
  for (const cand of validCandidates) {
    if (existingPhoneMap.has(cand.normalizedPhone)) {
      errors.push({
        rowNumber: cand.rowNumber,
        nama: cand.row.nama,
        noHp: cand.row.noHp,
        email: cand.row.email,
        noKtp: cand.row.noKtp,
        tanggalMasuk: cand.row.tanggalMasuk,
        catatan: cand.row.catatan,
        reason: `Nomor HP sudah terdaftar untuk penyewa '${existingPhoneMap.get(cand.normalizedPhone)}'`,
      });
    } else {
      rowsToInsert.push(cand);
    }
  }

  // 3. Masukkan baris yang valid ke database dalam transaksi
  const createdList = await prisma.$transaction(async (tx) => {
    const results = [];
    for (const item of rowsToInsert) {
      const r = item.row;
      const record = await tx.penghuni.create({
        data: {
          nama: r.nama.trim(),
          noHp: item.normalizedPhone,
          email: r.email?.trim() || undefined,
          noKtp: r.noKtp?.trim() || undefined,
          tanggalMasuk: r.tanggalMasuk ? new Date(r.tanggalMasuk) : new Date(),
          catatan: r.catatan?.trim() || undefined,
          status: "aktif",
          ownerId: user.id,
          organizationId: organization.id,
        },
      });
      results.push(record);
    }
    return results;
  });

  // 4. Catat riwayat ke audit_log
  await logAuditEvent({
    organizationId: organization.id,
    actorUserId: user.id,
    action: "penghuni.batch_imported",
    entityType: "Penghuni",
    entityId: organization.id,
    afterData: {
      totalRows: rows.length,
      importedCount: createdList.length,
      failedCount: errors.length,
      fileName: options?.fileName || "import.csv",
    },
  });

  revalidatePath(PENGHUNI_PATH);

  return {
    success: true,
    totalProcessed: rows.length,
    importedCount: createdList.length,
    failedCount: errors.length,
    created: createdList,
    errors,
  };
}

// RIWAYAT IMPOR — Mengambil 10 batch impor terakhir dari audit log organisasi
export async function getTenantImportHistory() {
  const { organization } = await requireOrganization();
  const logs = await prisma.auditLog.findMany({
    where: {
      organizationId: organization.id,
      action: "penghuni.batch_imported",
    },
    include: {
      actorUser: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return logs.map((log) => {
    const data = (log.afterData as any) || {};
    return {
      id: log.id,
      actorName: log.actorUser?.name || "Pengguna Organisasi",
      actorEmail: log.actorUser?.email || "-",
      createdAt: log.createdAt,
      totalRows: Number(data.totalRows || 0),
      importedCount: Number(data.importedCount || 0),
      failedCount: Number(data.failedCount || 0),
      fileName: String(data.fileName || "File Impor CSV/Excel"),
    };
  });
}

// LIST — kamar kosong untuk pilihan pindah kamar / penempatan baru
export async function getAvailableKamarOptions() {
  const { user, organization } = await requireOrganization();
  return prisma.kamar.findMany({
    where: {
      status: "kosong",
      OR: [
        { organizationId: organization.id },
        { ownerId: user.id },
      ],
    },
    include: {
      properti: { select: { id: true, nama: true } },
    },
    orderBy: { nomor: "asc" },
  });
}

// PINDAH KAMAR — pindah penghuni ke kamar baru atau lepaskan kamar
export async function pindahKamarPenghuni(penghuniId: string, newKamarId: string | null) {
  const { user, organization } = await requireOrganization();

  const tenant = await prisma.penghuni.findUnique({
    where: { id: penghuniId },
    include: { kamar: true, leases: { where: { status: "active" } } },
  });

  if (!tenant || (tenant.ownerId !== user.id && tenant.organizationId !== organization.id)) {
    throw new Error("Penyewa tidak ditemukan atau bukan milik organisasi Anda");
  }

  const oldKamarId = tenant.kamarId;

  await prisma.$transaction(async (tx) => {
    // 1. Kosongkan kamar lama jika ada
    if (oldKamarId) {
      await tx.kamar.update({
        where: { id: oldKamarId },
        data: { status: "kosong" },
      });
    }

    // 2. Jika pindah ke kamar baru
    if (newKamarId) {
      const newRoom = await tx.kamar.findUnique({ where: { id: newKamarId } });
      if (!newRoom) throw new Error("Kamar tujuan tidak ditemukan");

      await tx.kamar.update({
        where: { id: newKamarId },
        data: { status: "terisi" },
      });

      await tx.penghuni.update({
        where: { id: penghuniId },
        data: { kamarId: newKamarId },
      });

      // Update unit reference on active lease if exists
      if (tenant.leases.length > 0) {
        await tx.lease.update({
          where: { id: tenant.leases[0].id },
          data: { kamarId: newKamarId },
        });
      }
    } else {
      // Lepas dari kamar
      await tx.penghuni.update({
        where: { id: penghuniId },
        data: { kamarId: null },
      });
    }
  });

  revalidatePath(PENGHUNI_PATH);
  revalidatePath(PROPERTI_PATH);
}

// ─── AKSES PORTAL TENANT (FRICTIONLESS ONBOARDING) ──────────────────────────

export async function sendTenantPortalAccessAction(penghuniId: string, originUrl?: string) {
  const { user, organization } = await requireOrganization();
  const { TenantActivationService } = await import("@/lib/services/tenant-activation-service");

  const result = await TenantActivationService.sendPortalAccess({
    penghuniId,
    organizationId: organization.id,
    actorUserId: user.id,
    channel: "whatsapp",
    originUrl,
  });

  revalidatePath(PENGHUNI_PATH);
  return result;
}

export async function resendTenantPortalAccessAction(penghuniId: string, originUrl?: string) {
  const { user, organization } = await requireOrganization();
  const { TenantActivationService } = await import("@/lib/services/tenant-activation-service");

  const result = await TenantActivationService.resendPortalAccess({
    penghuniId,
    organizationId: organization.id,
    actorUserId: user.id,
    channel: "whatsapp",
    originUrl,
  });

  revalidatePath(PENGHUNI_PATH);
  return result;
}

export async function disableTenantPortalAccessAction(penghuniId: string) {
  const { user, organization } = await requireOrganization();
  const { TenantActivationService } = await import("@/lib/services/tenant-activation-service");

  const result = await TenantActivationService.disablePortalAccess(
    penghuniId,
    organization.id,
    user.id
  );

  revalidatePath(PENGHUNI_PATH);
  return result;
}


