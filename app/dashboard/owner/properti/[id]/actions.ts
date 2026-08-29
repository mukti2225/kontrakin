"use server";

import { prisma } from "@/lib/db/prisma";
import { requireOwner } from "@/lib/auth/get-current-user";
import { revalidatePath } from "next/cache";
import { TipeKamar } from "@/lib/generated/prisma/client";

const PROPERTI_PATH = "/dashboard/owner/properti";

async function requireOwnerId() {
  const user = await requireOwner();
  return user.id;
}

// ─── GET DETAIL ───────────────────────────────────────────────────────────────
export async function getPropertiDetail(propertiId: string) {
  const ownerId = await requireOwnerId();

  const properti = await prisma.properti.findUnique({
    where: { id: propertiId, ownerId },
    include: {
      kamar: {
        include: {
          penghuni: { where: { status: "aktif" } },
        },
        orderBy: { nomor: "asc" },
      },
    },
  });

  if (!properti) {
    throw new Error("Properti tidak ditemukan atau Anda tidak memiliki akses.");
  }

  return properti;
}

export async function getPenghuniTersedia(editingKamarId?: string | null) {
  const ownerId = await requireOwnerId();
  return prisma.penghuni.findMany({
    where: {
      ownerId,
      status: "aktif",
      OR: [{ kamarId: null }, ...(editingKamarId ? [{ kamarId: editingKamarId }] : [])],
    },
    orderBy: { nama: "asc" },
  });
}

// ─── KAMAR CRUD ───────────────────────────────────────────────────────────────

export interface UnitInput {
  nomor: string;
  lantai: number;
  tipe: "Standard" | "Deluxe" | "VIP";
  hargaBulanan: number;
  status: "kosong" | "terisi" | "maintenance";
  penghuniId?: string | null;
  catatan?: string;
}

/**
 * Tambah unit/kamar baru ke dalam properti tertentu.
 */
export async function createUnit(propertiId: string, data: UnitInput) {
  const ownerId = await requireOwnerId();

  // Pastikan properti milik owner ini
  const properti = await prisma.properti.findUnique({ where: { id: propertiId, ownerId } });
  if (!properti) throw new Error("Properti tidak ditemukan atau Anda tidak memiliki akses.");

  const { penghuniId, ...kamarData } = data;

  const kamar = await prisma.$transaction(async (tx) => {
    const created = await tx.kamar.create({
      data: {
        ...kamarData,
        ownerId,
        propertiId,
      },
    });

    if (kamarData.status === "terisi" && penghuniId) {
      await tx.penghuni.update({
        where: { id: penghuniId, ownerId },
        data: { kamarId: created.id },
      });
    }

    return tx.kamar.findUniqueOrThrow({
      where: { id: created.id },
      include: { penghuni: { where: { status: "aktif" } } },
    });
  });

  revalidatePath(`${PROPERTI_PATH}/${propertiId}`);
  revalidatePath("/dashboard/owner/properti");
  revalidatePath("/dashboard/owner/penghuni");
  return kamar;
}

/**
 * Update unit/kamar yang sudah ada.
 */
export async function updateUnit(kamarId: string, propertiId: string, data: UnitInput) {
  const ownerId = await requireOwnerId();

  const existing = await prisma.kamar.findUnique({ where: { id: kamarId } });
  if (!existing || existing.ownerId !== ownerId) {
    throw new Error("Kamar tidak ditemukan atau Anda tidak memiliki akses.");
  }

  const { penghuniId, ...kamarData } = data;

  const kamar = await prisma.$transaction(async (tx) => {
    // Lepas penghuni lama jika status berubah / penghuni berbeda
    const penghuniLama = await tx.penghuni.findFirst({ where: { kamarId, status: "aktif" } });
    if (penghuniLama && (kamarData.status !== "terisi" || penghuniLama.id !== penghuniId)) {
      await tx.penghuni.update({ where: { id: penghuniLama.id }, data: { kamarId: null } });
    }

    // Pasang penghuni baru
    if (kamarData.status === "terisi" && penghuniId) {
      await tx.penghuni.update({ where: { id: penghuniId }, data: { kamarId } });
    }

    await tx.kamar.update({ where: { id: kamarId }, data: kamarData });

    return tx.kamar.findUniqueOrThrow({
      where: { id: kamarId },
      include: { penghuni: { where: { status: "aktif" } } },
    });
  });

  revalidatePath(`${PROPERTI_PATH}/${propertiId}`);
  revalidatePath("/dashboard/owner/properti");
  revalidatePath("/dashboard/owner/penghuni");
  return kamar;
}

/**
 * Hapus unit/kamar dari properti.
 */
export async function deleteUnit(kamarId: string, propertiId: string) {
  const ownerId = await requireOwnerId();

  const existing = await prisma.kamar.findUnique({ where: { id: kamarId } });
  if (!existing || existing.ownerId !== ownerId) {
    throw new Error("Kamar tidak ditemukan atau Anda tidak memiliki akses.");
  }

  await prisma.kamar.delete({ where: { id: kamarId } });

  revalidatePath(`${PROPERTI_PATH}/${propertiId}`);
  revalidatePath("/dashboard/owner/properti");
}
