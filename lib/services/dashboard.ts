import { dashboardRepository } from '@/lib/repositories/dashboard.repository';
import { DashboardData, StatRingkasan, TitikData, PembayaranDTO } from '@/lib/types';
import { formatRupiah } from '@/lib/utils';
import { AppError } from '@/lib/errors';

export class DashboardService {
  /**
   * Mendapatkan data dashboard lengkap
   */
  async getDashboardData(ownerId?: string): Promise<DashboardData> {
    try {
      const kamar = await dashboardRepository.getAllKamar(ownerId);
      const transaksi = await dashboardRepository.getRecentTransaksi(5, ownerId);
      
      const totalKamar = kamar.length;
      const kamarTerisi = kamar.filter((k) => k.status === 'terisi').length;
      const tingkatOkupansi = totalKamar > 0 ? Math.round((kamarTerisi / totalKamar) * 100) : 0;
      const kamarKosong = kamar.filter((k) => k.status === 'kosong').length;

      // Hitung tunggakan dari transaksi yang statusnya belum lunas/berhasil
      // Dalam implementasi nyata, ini mungkin kueri terpisah ke tabel Tagihan
      const tunggakan = 0; // Placeholder

      const pendapatanBulanIni = await dashboardRepository.getPendapatanBulanIni(ownerId);

      const stats: StatRingkasan[] = [
        {
          id: 'pendapatan',
          label: 'Pendapatan bulan ini',
          value: formatRupiah(pendapatanBulanIni),
          delta: '+0%', // Bisa dihitung dari bulan lalu
          naik: true,
          icon: 'revenue',
        },
        {
          id: 'okupansi',
          label: 'Tingkat hunian',
          value: `${tingkatOkupansi}%`,
          delta: '',
          naik: tingkatOkupansi > 80,
          icon: 'occupancy',
        },
        {
          id: 'kamar-kosong',
          label: 'Kamar kosong',
          value: `${kamarKosong} kamar`,
          delta: kamarKosong > 0 ? 'Perlu diisi' : 'Penuh',
          naik: kamarKosong === 0,
          icon: 'tenants',
        },
        {
          id: 'tunggakan',
          label: 'Tunggakan',
          value: formatRupiah(tunggakan),
          delta: tunggakan > 0 ? 'Perlu ditagih' : 'Aman',
          naik: tunggakan === 0,
          icon: 'overdue',
        },
      ];

      // Format DTO untuk UI
      const pembayaranTerbaru: PembayaranDTO[] = transaksi.map(tx => ({
        id: tx.id,
        penghuniNama: tx.penghuni?.nama || 'Unknown',
        inisial: tx.penghuni?.nama?.substring(0, 2).toUpperCase() || 'UN',
        kamarNomor: tx.kamar?.nomor || '-',
        jumlah: tx.jumlah,
        tanggal: tx.tanggal.toISOString().split('T')[0],
        metode: 'Transfer', // Placeholder dari DB
        status: 'Berhasil' // Placeholder dari DB
      }));

      // Placeholder data grafik
      const pendapatanBulanan: TitikData[] = [
        { bulan: "Jan", value: 0 },
        { bulan: "Feb", value: pendapatanBulanIni }
      ];
      
      const okupansiBulanan: TitikData[] = [
        { bulan: "Jan", value: 0 },
        { bulan: "Feb", value: tingkatOkupansi }
      ];

      return {
        stats,
        pendapatanBulanan,
        okupansiBulanan,
        kamar,
        pembayaranTerbaru,
      };
    } catch (error) {
      console.error('Failed to get dashboard data:', error);
      throw new AppError('Gagal memuat data dashboard', 500);
    }
  }
}

export const dashboardService = new DashboardService();
export { formatRupiah }; // Mempertahankan export util jika masih dibutuhkan dari sini
