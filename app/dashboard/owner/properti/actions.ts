"use server";

import { requireOwnerId } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { TipeProperti } from "@/lib/generated/prisma/client";

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function getProperti() {
  const ownerId = await requireOwnerId();
  return prisma.properti.findMany({
    where: { ownerId },
    include: {
      kamar: {
        include: { penghuni: { where: { status: "aktif" } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createProperti(formData: FormData) {
  const ownerId = await requireOwnerId();

  const nama = formData.get("nama") as string;
  const tipe = formData.get("tipe") as TipeProperti;
  const alamat = formData.get("alamat") as string;

  const fotoFile = formData.get("foto") as File | null;
  let foto: string | null = null;

  if (fotoFile && fotoFile.size > 0) {
    const bytes = await fotoFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const fileName = `${Date.now()}-${fotoFile.name.replace(/\s+/g, "-")}`;
    const filePath = join(uploadDir, fileName);

    await writeFile(filePath, buffer);
    foto = `/uploads/${fileName}`;
  }

  const lokasiMaps = formData.get("lokasiMaps") as string | null;
  const fasilitas = formData.get("fasilitas") as string | null;
  const deskripsi = formData.get("deskripsi") as string | null;

  if (!nama || !tipe || !alamat) {
    throw new Error("Nama, Tipe, dan Alamat harus diisi");
  }

  await prisma.properti.create({
    data: {
      nama,
      tipe,
      alamat,
      foto,
      lokasiMaps,
      fasilitas,
      deskripsi,
      ownerId,
    },
  });

  revalidatePath("/dashboard/owner/properti");
}

export async function updateProperti(id: string, formData: FormData) {
  const ownerId = await requireOwnerId();

  const nama = formData.get("nama") as string;
  const tipe = formData.get("tipe") as TipeProperti;
  const alamat = formData.get("alamat") as string;

  const lokasiMaps = formData.get("lokasiMaps") as string | null;
  const fasilitas = formData.get("fasilitas") as string | null;
  const deskripsi = formData.get("deskripsi") as string | null;

  // Cek kepemilikan
  const existing = await prisma.properti.findUnique({ where: { id } });
  if (!existing || existing.ownerId !== ownerId) {
    throw new Error("Properti tidak ditemukan atau Anda tidak memiliki akses");
  }

  const fotoFile = formData.get("foto") as File | null;
  let foto = existing.foto; // Keep existing photo by default

  if (fotoFile && fotoFile.size > 0) {
    const bytes = await fotoFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const fileName = `${Date.now()}-${fotoFile.name.replace(/\s+/g, "-")}`;
    const filePath = join(uploadDir, fileName);

    await writeFile(filePath, buffer);
    foto = `/uploads/${fileName}`;
  } else {
    // If we want to allow removing photo, we would need a way to detect it.
    // e.g. a hidden field "removeFoto" = "true"
    const removeFoto = formData.get("removeFoto") === "true";
    if (removeFoto) {
      foto = null;
    }
  }

  if (!nama || !tipe || !alamat) {
    throw new Error("Nama, Tipe, dan Alamat harus diisi");
  }

  await prisma.properti.update({
    where: { id },
    data: {
      nama,
      tipe,
      alamat,
      foto,
      lokasiMaps,
      fasilitas,
      deskripsi,
    },
  });

  revalidatePath("/dashboard/owner/properti");
}

export async function deleteProperti(id: string) {
  const ownerId = await requireOwnerId();

  const existing = await prisma.properti.findUnique({ where: { id } });
  if (!existing || existing.ownerId !== ownerId) {
    throw new Error("Properti tidak ditemukan atau Anda tidak memiliki akses");
  }

  await prisma.properti.delete({
    where: { id },
  });

  revalidatePath("/dashboard/owner/properti");
}
