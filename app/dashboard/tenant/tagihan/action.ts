"use server";

import { requireTenant } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function bayarTagihan(formData: FormData) {
  const user = await requireTenant();
  const metode = formData.get("metode") as string;

  if (!metode) {
    throw new Error("Pilih metode pembayaran terlebih dahulu");
  }
  
  const penghuni = await prisma.penghuni.findFirst({
    where: { userId: user.id },
    include: { kamar: true },
  });

  if (!penghuni || !penghuni.kamarId || !penghuni.kamar) {
    throw new Error("Kamar tidak ditemukan");
  }

  // Membuat transaksi pembayaran yang sukses (mocking)
  await prisma.transaksi.create({
    data: {
      jenis: "pemasukan",
      kategori: "Sewa Kamar",
      jumlah: penghuni.kamar.hargaBulanan,
      tanggal: new Date(),
      keterangan: `Pembayaran Sewa Bulanan via ${metode}`,
      kamarId: penghuni.kamarId,
      penghuniId: penghuni.id,
      ownerId: penghuni.ownerId, // transaksi dipegang oleh owner
    }
  });

  revalidatePath("/dashboard/tenant/tagihan");
  revalidatePath("/dashboard/owner/keuangan");
  redirect("/dashboard/tenant/tagihan?success=true");
}
