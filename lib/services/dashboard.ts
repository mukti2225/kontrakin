import type { DashboardData, Kamar, Pembayaran, StatRingkasan, TitikData } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";

const pendapatanBulanan: TitikData[] = [
  { bulan: "Feb", value: 18_200_000 },
  { bulan: "Mar", value: 19_850_000 },
  { bulan: "Apr", value: 21_100_000 },
  { bulan: "Mei", value: 20_400_000 },
  { bulan: "Jun", value: 23_950_000 },
  { bulan: "Jul", value: 26_700_000 },
];

const okupansiBulanan: TitikData[] = [
  { bulan: "Feb", value: 78 },
  { bulan: "Mar", value: 82 },
  { bulan: "Apr", value: 80 },
  { bulan: "Mei", value: 88 },
  { bulan: "Jun", value: 91 },
  { bulan: "Jul", value: 94 },
];

const kamar: Kamar[] = [
  { id: "k1", nomor: "A-01", lantai: 1, tipe: "Standar", hargaBulanan: 950_000, status: "Terisi", penyewaId: "p1" },
  { id: "k2", nomor: "A-02", lantai: 1, tipe: "Standar", hargaBulanan: 950_000, status: "Terisi", penyewaId: "p2" },
  { id: "k3", nomor: "A-03", lantai: 1, tipe: "Standar", hargaBulanan: 950_000, status: "Kosong" },
  { id: "k4", nomor: "B-01", lantai: 2, tipe: "Deluxe", hargaBulanan: 1_350_000, status: "Terisi", penyewaId: "p3" },
  { id: "k5", nomor: "B-02", lantai: 2, tipe: "Deluxe", hargaBulanan: 1_350_000, status: "Perbaikan" },
  { id: "k6", nomor: "B-03", lantai: 2, tipe: "Deluxe", hargaBulanan: 1_350_000, status: "Terisi", penyewaId: "p4" },
  { id: "k7", nomor: "C-01", lantai: 3, tipe: "VIP", hargaBulanan: 1_800_000, status: "Terisi", penyewaId: "p5" },
  { id: "k8", nomor: "C-02", lantai: 3, tipe: "VIP", hargaBulanan: 1_800_000, status: "Kosong" },
];

const pembayaranTerbaru: Pembayaran[] = [
  { id: "tx1", penyewaNama: "Adi Nugroho", inisial: "AN", kamarNomor: "A-01", jumlah: 950_000, tanggal: "2026-07-21", metode: "Transfer BCA", status: "Berhasil" },
  { id: "tx2", penyewaNama: "Sri Wulandari", inisial: "SW", kamarNomor: "B-03", jumlah: 1_350_000, tanggal: "2026-07-20", metode: "Transfer BRI", status: "Berhasil" },
  { id: "tx3", penyewaNama: "Bagas Pratama", inisial: "BP", kamarNomor: "B-01", jumlah: 1_350_000, tanggal: "2026-07-18", metode: "QRIS", status: "Tertunda" },
  { id: "tx4", penyewaNama: "Citra Amelia", inisial: "CA", kamarNomor: "C-01", jumlah: 1_800_000, tanggal: "2026-07-15", metode: "Tunai", status: "Berhasil" },
  { id: "tx5", penyewaNama: "Farhan Ramadhan", inisial: "FR", kamarNomor: "A-02", jumlah: 950_000, tanggal: "2026-07-12", metode: "Transfer BCA", status: "Gagal" },
];

function hitungStats(): StatRingkasan[] {
  const totalKamar = kamar.length;
  const kamarTerisi = kamar.filter((k) => k.status === "Terisi").length;
  const tingkatOkupansi = Math.round((kamarTerisi / totalKamar) * 100);
  const kamarKosong = kamar.filter((k) => k.status === "Kosong").length;
  const tunggakan = pembayaranTerbaru.filter((p) => p.status !== "Berhasil").reduce((total, p) => total + p.jumlah, 0);

  return [
    {
      id: "pendapatan",
      label: "Pendapatan bulan ini",
      value: formatRupiah(pendapatanBulanan[pendapatanBulanan.length - 1].value),
      delta: "+11,6%",
      naik: true,
      icon: "revenue",
    },
    {
      id: "okupansi",
      label: "Tingkat hunian",
      value: `${tingkatOkupansi}%`,
      delta: "+3%",
      naik: true,
      icon: "occupancy",
    },
    {
      id: "kamar-kosong",
      label: "Kamar kosong",
      value: `${kamarKosong} kamar`,
      delta: kamarKosong > 0 ? "Perlu diisi" : "Penuh",
      naik: kamarKosong === 0,
      icon: "tenants",
    },
    {
      id: "tunggakan",
      label: "Tunggakan",
      value: formatRupiah(tunggakan),
      delta: tunggakan > 0 ? "Perlu ditagih" : "Aman",
      naik: tunggakan === 0,
      icon: "overdue",
    },
  ];
}

export { formatRupiah };

export async function getDashboardData(): Promise<DashboardData> {
  return {
    stats: hitungStats(),
    pendapatanBulanan,
    okupansiBulanan,
    kamar,
    pembayaranTerbaru,
  };
}
