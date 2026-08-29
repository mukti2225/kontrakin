import type { Kamar } from "@/lib/types";

export type StatusPembayaran = "Berhasil" | "Tertunda" | "Gagal";

export interface TitikData {
  bulan: string;
  value: number;
}

export interface StatRingkasan {
  id: string;
  label: string;
  value: string;
  delta: string;
  naik: boolean;
  icon: "revenue" | "occupancy" | "tenants" | "overdue";
}

// DTO untuk list Penghuni di UI yang butuh data gabungan
export interface PenghuniDTO {
  id: string;
  nama: string;
  inisial: string;
  kamarNomor: string;
  telepon: string;
  mulaiSewa: string;
  akhirKontrak: string | null;
  statusPembayaran: StatusPembayaran;
}

// DTO untuk list Pembayaran/Transaksi di UI
export interface PembayaranDTO {
  id: string;
  penghuniNama: string;
  inisial: string;
  kamarNomor: string;
  jumlah: number;
  tanggal: string;
  metode: string;
  status: StatusPembayaran;
}

export interface DashboardData {
  stats: StatRingkasan[];
  pendapatanBulanan: TitikData[];
  okupansiBulanan: TitikData[];
  kamar: Kamar[];
  pembayaranTerbaru: PembayaranDTO[];
}

export interface PemeliharaanDTO {
  id: string;
  judul: string;
  deskripsi: string;
  status: "menunggu" | "diproses" | "selesai";
  prioritas: "rendah" | "sedang" | "tinggi";
  kategori: string;
  foto: string | null;
  penghuniNama?: string;
  kamarNomor?: string;
  tanggalDibuat: string;
}
