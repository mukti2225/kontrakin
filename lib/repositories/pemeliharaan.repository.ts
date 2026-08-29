import { prisma } from "@/lib/db/prisma";
import type { Pemeliharaan } from "@/lib/types";
import type { Prisma } from "@/lib/generated/prisma/client";

export class PemeliharaanRepository {
  /**
   * Mengambil daftar pemeliharaan berdasarkan ownerId
   */
  async getByOwner(ownerId: string): Promise<Pemeliharaan[]> {
    return prisma.pemeliharaan.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
      include: {
        penghuni: true,
        kamar: true,
      },
    });
  }

  /**
   * Mengambil daftar keluhan berdasarkan penghuniId
   */
  async getByPenghuni(penghuniId: string): Promise<Pemeliharaan[]> {
    return prisma.pemeliharaan.findMany({
      where: { penghuniId },
      orderBy: { createdAt: "desc" },
      include: {
        kamar: true,
      },
    });
  }

  /**
   * Membuat keluhan baru
   */
  async create(data: Prisma.PemeliharaanUncheckedCreateInput): Promise<Pemeliharaan> {
    return prisma.pemeliharaan.create({
      data,
    });
  }

  /**
   * Memperbarui status pemeliharaan
   */
  async updateStatus(id: string, status: any): Promise<Pemeliharaan> {
    return prisma.pemeliharaan.update({
      where: { id },
      data: { status },
    });
  }
}

export const pemeliharaanRepository = new PemeliharaanRepository();
