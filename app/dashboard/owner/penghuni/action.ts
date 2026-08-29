"use server";

import { prisma } from "@/lib/db/prisma";
import { requireOwner } from "@/lib/auth/get-current-user";
import { revalidatePath } from "next/cache";

const PENGHUNI_PATH = "/dashboard/owner/penghuni";
const PROPERTI_PATH = "/dashboard/owner/properti";

async function requireOwnerId() {
  const user = await requireOwner(); // harus melempar error kalau bukan owner / belum login
  return user.id;
}

export interface PenghuniInput {
  nama: string;
  noHp: string;
  email?: string;
  noKtp?: string;
  tanggalMasuk: string; // format "YYYY-MM-DD" dari <input type="date">
  catatan?: string;
}

// LIST — semua penghuni milik owner ini beserta kamar yang dihuni (jika ada)
export async function getPenghuniList() {
  const ownerId = await requireOwnerId();
  return prisma.penghuni.findMany({
    where: { ownerId },
    include: { kamar: true },
    orderBy: { nama: "asc" },
  });
}

// LIST — hanya penghuni aktif milik owner ini (dipakai dropdown di halaman Kamar)
export async function getPenghuniAktif() {
  const ownerId = await requireOwnerId();
  return prisma.penghuni.findMany({
    where: { ownerId, status: "aktif" },
    orderBy: { nama: "asc" },
  });
}

// CREATE
export async function createPenghuni(data: PenghuniInput) {
  const ownerId = await requireOwnerId();

  const penghuni = await prisma.penghuni.create({
    data: {
      nama: data.nama,
      noHp: data.noHp,
      email: data.email || undefined,
      noKtp: data.noKtp || undefined,
      tanggalMasuk: new Date(data.tanggalMasuk),
      catatan: data.catatan || undefined,
      status: "aktif",
      ownerId, // <-- ini yang tadinya hilang, penyebab error TypeScript
    },
  });
  revalidatePath(PENGHUNI_PATH);
  return penghuni;
}

// UPDATE
export async function updatePenghuni(id: string, data: PenghuniInput) {
  const ownerId = await requireOwnerId();

  // pastikan penghuni yang diedit memang milik owner yang login
  const existing = await prisma.penghuni.findUnique({ where: { id } });
  if (!existing || existing.ownerId !== ownerId) {
    throw new Error("Penghuni tidak ditemukan atau bukan milik Anda");
  }

  const penghuni = await prisma.penghuni.update({
    where: { id },
    data: {
      nama: data.nama,
      noHp: data.noHp,
      email: data.email || null,
      noKtp: data.noKtp || null,
      tanggalMasuk: new Date(data.tanggalMasuk),
      catatan: data.catatan || null,
    },
  });
  revalidatePath(PENGHUNI_PATH);
  revalidatePath(PROPERTI_PATH);
  return penghuni;
}

// NONAKTIFKAN (keluar dari kamar, tapi data tetap tersimpan sebagai histori)
export async function nonaktifkanPenghuni(id: string) {
  const ownerId = await requireOwnerId();

  const existing = await prisma.penghuni.findUnique({ where: { id } });
  if (!existing || existing.ownerId !== ownerId) {
    throw new Error("Penghuni tidak ditemukan atau bukan milik Anda");
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
  const ownerId = await requireOwnerId();

  const existing = await prisma.penghuni.findUnique({ where: { id } });
  if (!existing || existing.ownerId !== ownerId) {
    throw new Error("Penghuni tidak ditemukan atau bukan milik Anda");
  }

  await prisma.penghuni.delete({ where: { id } });
  revalidatePath(PENGHUNI_PATH);
  revalidatePath(PROPERTI_PATH);
}
