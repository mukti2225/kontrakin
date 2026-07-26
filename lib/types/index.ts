export type StatusKamar = "Terisi" | "Kosong" | "Perbaikan";

export interface Kamar {
  id: string;
  nomor: string;
  lantai: number;
  tipe: string;
  hargaBulanan: number;
  status: StatusKamar;
  penghuniId?: string;
}

export type StatusPembayaran = "Berhasil" | "Tertunda" | "Gagal";

export interface Penghuni {
  id: string;
  nama: string;
  inisial: string;
  kamarNomor: string;
  telepon: string;
  mulaiSewa: string;
  akhirKontrak: string;
  statusPembayaran: StatusPembayaran;
}

export interface Pembayaran {
  id: string;
  penghuniNama: string;
  inisial: string;
  kamarNomor: string;
  jumlah: number;
  tanggal: string;
  metode: string;
  status: StatusPembayaran;
}

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

export interface DashboardData {
  stats: StatRingkasan[];
  pendapatanBulanan: TitikData[];
  okupansiBulanan: TitikData[];
  kamar: Kamar[];
  pembayaranTerbaru: Pembayaran[];
}
