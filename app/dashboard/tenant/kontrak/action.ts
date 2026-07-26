"use server";

import { prisma } from "@/lib/db/prisma";
import { requireTenant } from "@/lib/auth/get-current-user";
import { revalidatePath } from "next/cache";

export interface GabungInput {
  kodeUndangan: string;
  noHp: string;
  tanggalMasuk: string;
}

export async function getStatusGabungTenant() {
  const user = await requireTenant();

  const penghuni = await prisma.penghuni.findUnique({
    where: { userId: user.id },
    include: { owner: { select: { name: true } }, kamar: true },
  });

  return penghuni;
}

export async function gabungDenganKode(data: GabungInput) {
  const user = await requireTenant();

  // Tenant hanya boleh join sekali
  const sudahAda = await prisma.penghuni.findUnique({ where: { userId: user.id } });
  if (sudahAda) {
    throw new Error("Akun ini sudah terhubung dengan salah satu properti");
  }

  const owner = await prisma.user.findUnique({
    where: { kodeUndangan: data.kodeUndangan.trim().toUpperCase() },
  });

  if (!owner || owner.role !== "owner") {
    throw new Error("Kode undangan tidak valid");
  }

  const penghuni = await prisma.penghuni.create({
    data: {
      nama: user.name,
      noHp: data.noHp.trim(),
      tanggalMasuk: new Date(data.tanggalMasuk),
      status: "aktif",
      ownerId: owner.id,
      userId: user.id,
    },
  });

  revalidatePath("/dashboard/tenant");
  revalidatePath("/dashboard/owner/penghuni");
  return penghuni;
}
