"use server";

import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth/get-current-user";

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

export async function createTransaksi(input: TransaksiInput) {
  const ownerId = await requireOwnerId();
  const created = await prisma.transaksi.create({
    data: {
      jenis: input.jenis,
      kategori: input.kategori,
      jumlah: input.jumlah,
      tanggal: new Date(input.tanggal),
      keterangan: input.keterangan,
      kamarId: input.kamarId || null,
      penghuniId: input.penghuniId || null,
      ownerId,
    },
    include: includeRelasi,
  });

  revalidatePath("/dashboard/owner/keuangan");
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
  const ownerId = await requireOwnerId();

  const created = await prisma.transaksi.create({
    data: {
      jenis: "pemasukan",
      kategori: "Sewa Kamar",
      jumlah: input.jumlah,
      tanggal: new Date(input.tanggal),
      keterangan: input.keterangan,
      penghuniId: input.penghuniId,
      kamarId: input.kamarId,
      ownerId,
    },
    include: includeRelasi,
  });

  revalidatePath("/dashboard/owner/keuangan");
  revalidatePath("/dashboard/owner/penghuni");
  return created;
}
