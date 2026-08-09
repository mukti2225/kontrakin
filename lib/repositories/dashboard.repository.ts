import { prisma } from "@/lib/db/prisma";
import type { Kamar, Transaksi, Penghuni } from "@/lib/generated/prisma";

export class DashboardRepository {
  /**
   * Mengambil semua data kamar
   */
  async getAllKamar(ownerId?: string): Promise<Kamar[]> {
    return prisma.kamar.findMany({
      where: ownerId ? { ownerId } : undefined,
      include: {
        penghuni: true,
      },
      orderBy: {
        nomor: "asc",
      },
    });
  }

  /**
   * Mengambil transaksi pembayaran terbaru
   */
  async getRecentTransaksi(limit: number = 5, ownerId?: string): Promise<(Transaksi & { penghuni: Penghuni | null; kamar: Kamar | null })[]> {
    return prisma.transaksi.findMany({
      where: ownerId ? { ownerId } : undefined,
      take: limit,
      orderBy: {
        tanggal: "desc",
      },
      include: {
        penghuni: true,
        kamar: true,
      },
    });
  }

  /**
   * Mengambil total pendapatan bulan ini (contoh sederhana)
   */
  async getPendapatanBulanIni(ownerId?: string): Promise<number> {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const result = await prisma.transaksi.aggregate({
      where: {
        ownerId: ownerId ? ownerId : undefined,
        kategori: "Pembayaran Sewa", // Asumsi kategori
        tanggal: {
          gte: startOfMonth,
        },
      },
      _sum: {
        jumlah: true,
      },
    });

    return result._sum.jumlah || 0;
  }
}

export const dashboardRepository = new DashboardRepository();
