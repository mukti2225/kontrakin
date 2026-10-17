// app/dashboard/owner/pengaturan/action.ts
"use server";

import { prisma } from "@/lib/db/prisma";
import { requireOwnerId, getCurrentUser } from "@/lib/auth/get-current-user";
import { revalidatePath } from "next/cache";
import { customAlphabet } from "nanoid";

const generateKode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

export async function getOrCreateKodeUndangan() {
  const ownerId = await requireOwnerId();
  if (!ownerId) {
    throw new Error("Hanya owner yang dapat mengakses kode undangan");
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: ownerId } });

  if (user.kodeUndangan) return user.kodeUndangan;

  // Generate sampai dapat kode yang belum dipakai
  let kode = generateKode();
  while (await prisma.user.findUnique({ where: { kodeUndangan: kode } })) {
    kode = generateKode();
  }

  await prisma.user.update({ where: { id: user.id }, data: { kodeUndangan: kode } });
  return kode;
}

export async function updateProfileName(name: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  if (!name.trim()) throw new Error("Nama tidak boleh kosong");

  await prisma.user.update({
    where: { id: user.id },
    data: { name: name.trim() },
  });

  revalidatePath("/dashboard/owner/pengaturan");
  revalidatePath("/dashboard/owner");
  return { success: true };
}
