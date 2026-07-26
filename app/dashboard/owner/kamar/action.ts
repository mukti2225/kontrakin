"use server";

import { prisma } from "@/lib/db/prisma";
import { requireOwner } from "@/lib/auth/get-current-user";
import { revalidatePath } from "next/cache";

const KAMAR_PATH = "/dashboard/owner/kamar";
const PENGHUNI_PATH = "/dashboard/owner/penghuni";

async function requireOwnerId() {
  const user = await requireOwner();
  return user.id;
}

export interface KamarInput {
  nomor: string;
  lantai: number;
  tipe: "Standard" | "Deluxe" | "VIP";
  hargaBulanan: number;
  status: "kosong" | "terisi" | "maintenance";
  penghuniId?: string | null;
  catatan?: string;
}

export async function getKamarList() {
  const ownerId = await requireOwnerId();
  return prisma.kamar.findMany({
    where: { ownerId },
    include: { penghuni: { where: { status: "aktif" } } },
    orderBy: { nomor: "asc" },
  });
}

export async function createKamar(data: KamarInput) {
  const ownerId = await requireOwnerId();
  const { penghuniId, ...kamarData } = data;

  const kamar = await prisma.$transaction(async (tx) => {
    const created = await tx.kamar.create({ data: { ...kamarData, ownerId } });

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

  revalidatePath(KAMAR_PATH);
  revalidatePath(PENGHUNI_PATH);
  return kamar;
}

export async function updateKamar(id: string, data: KamarInput) {
  const { penghuniId, ...kamarData } = data;

  const kamar = await prisma.$transaction(async (tx) => {
    const penghuniLama = await tx.penghuni.findFirst({
      where: { kamarId: id, status: "aktif" },
    });

    // Lepas penghuni lama jika status berubah atau penghuni yang dipilih beda
    if (penghuniLama && (kamarData.status !== "terisi" || penghuniLama.id !== penghuniId)) {
      await tx.penghuni.update({
        where: { id: penghuniLama.id },
        data: { kamarId: null },
      });
    }

    // Pasang penghuni baru jika status "terisi" dan ada pilihan
    if (kamarData.status === "terisi" && penghuniId) {
      await tx.penghuni.update({
        where: { id: penghuniId },
        data: { kamarId: id },
      });
    }

    await tx.kamar.update({ where: { id }, data: kamarData });

    return tx.kamar.findUniqueOrThrow({
      where: { id },
      include: { penghuni: { where: { status: "aktif" } } },
    });
  });

  revalidatePath(KAMAR_PATH);
  revalidatePath(PENGHUNI_PATH);
  return kamar;
}

export async function deleteKamar(id: string) {
  await prisma.kamar.delete({ where: { id } });
  revalidatePath(KAMAR_PATH);
}
