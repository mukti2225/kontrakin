"use client";

import { useMemo, useState, useTransition } from "react";
import type { PemeliharaanDTO } from "@/lib/types/dto";
import {
  Search,
  Plus,
  Filter,
  ArrowUpRight,
  Wrench,
  CheckCircle2,
  Banknote,
  MoreVertical,
  CalendarDays,
  Snowflake,
  Bug,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { updateStatusPemeliharaan } from "./action";
import { toast } from "sonner";

// ─── Status & Prioritas Styling ──────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; badge: string; border: string }> = {
  menunggu: {
    label: "Menunggu",
    badge: "text-amber-600",
    border: "border-amber-200",
  },
  diproses: {
    label: "Proses",
    badge: "text-slate-700",
    border: "border-slate-800",
  },
  selesai: {
    label: "Selesai",
    badge: "text-emerald-600",
    border: "border-emerald-200",
  },
};

const PRIORITAS_CONFIG: Record<string, string> = {
  rendah: "bg-slate-200 text-slate-700",
  sedang: "bg-[#d4bcae] text-[#7c533c]", // matching the brown tone in image
  tinggi: "bg-rose-100 text-rose-700",
};

// ─── Mock Data for Charts & Routine Schedule ─────────────────────────────────

const MOCK_ROUTINE = [
  {
    title: "Cuci AC Berkala",
    desc: "Seluruh kamar lantai 1 & 2",
    date: "25 Nov",
    icon: Snowflake,
    iconColor: "text-teal-700",
    iconBg: "bg-teal-50",
  },
  {
    title: "Fogging & Pest Control",
    desc: "Area luar & selokan",
    date: "1 Dec",
    icon: Bug,
    iconColor: "text-teal-700",
    iconBg: "bg-teal-50",
  },
];

const MOCK_CHART_DATA = [
  { name: "Plumbing", value: 40, color: "#0d9488" }, // teal-600
  { name: "Electrical", value: 30, color: "#99f6e4" }, // teal-200
  { name: "AC", value: 20, color: "#d4bcae" }, // brown tone
  { name: "Lainnya", value: 10, color: "#cbd5e1" }, // slate-300
];

// ─── Main Component ──────────────────────────────────────────────────────────

export function LaporanClient({ initialData }: { initialData: PemeliharaanDTO[] }) {
  const [data, setData] = useState<PemeliharaanDTO[]>(initialData);
  const [isPending, startTransition] = useTransition();

  // Derived stats
  const stats = useMemo(() => {
    const totalLaporan = data.filter((d) => d.status !== "selesai").length;
    const perbaikanBerjalan = data.filter((d) => d.status === "diproses").length;
    const selesaiBulanIni = data.filter((d) => {
      if (d.status !== "selesai") return false;
      const dDate = new Date(d.tanggalDibuat);
      const now = new Date();
      return dDate.getMonth() === now.getMonth() && dDate.getFullYear() === now.getFullYear();
    }).length;
    
    // Placeholder estimasi biaya
    const estimasiBiaya = 2500000;

    return { totalLaporan, perbaikanBerjalan, selesaiBulanIni, estimasiBiaya };
  }, [data]);

  const handleUpdateStatus = (id: string, status: "menunggu" | "diproses" | "selesai") => {
    startTransition(async () => {
      const result = await updateStatusPemeliharaan(id, status);
      if (result.success) {
        setData((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
        toast.success("Status berhasil diperbarui");
      } else {
        toast.error(result.error || "Gagal memperbarui status");
      }
    });
  };

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8 bg-slate-50 min-h-screen">
      {/* ── Page Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-1 text-sm font-medium text-slate-500 mb-1">
            <span>Laporan</span>
            <span className="text-slate-400">›</span>
            <span className="text-teal-700 font-semibold">Pemeliharaan</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Laporan Pemeliharaan</h1>
          <p className="mt-1 text-sm text-slate-500">
            Pantau perbaikan, jadwal rutin, dan keluhan penghuni.
          </p>
        </div>
        <div className="flex items-center">
          <button className="flex items-center gap-1.5 rounded-xl bg-[#045b56] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#034a46]">
            <Plus className="size-4" />
            Tambah Laporan
          </button>
        </div>
      </div>

      {/* ── Stat Cards ────────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Laporan */}
        <div className="relative overflow-hidden rounded-2xl bg-[#045b56] p-5 shadow-sm">
          <button className="absolute right-4 top-4 flex size-7 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20">
            <ArrowUpRight className="size-4" />
          </button>
          <p className="text-sm font-medium text-white/80">Total Laporan</p>
          <p className="mt-2 text-3xl font-bold text-white">{stats.totalLaporan}</p>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="flex items-center gap-1 text-xs font-medium text-white/80">
              <ArrowUpRight className="size-3" /> Aktif saat ini
            </span>
          </div>
        </div>

        {/* Perbaikan Berjalan */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-500">Perbaikan Berjalan</p>
            <div className="flex size-7 items-center justify-center rounded-full border border-slate-100">
              <Wrench className="size-3.5 text-slate-500" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-800">
            {stats.perbaikanBerjalan} <span className="text-sm font-medium text-slate-500">unit</span>
          </p>
        </div>

        {/* Selesai Bulan Ini */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-500">Selesai Bulan Ini</p>
            <div className="flex size-7 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-800">{stats.selesaiBulanIni}</p>
          <p className="mt-3 text-xs font-medium text-emerald-600">↑ +4 dari bulan lalu</p>
        </div>

        {/* Estimasi Biaya */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-500">Estimasi Biaya</p>
            <div className="flex size-7 items-center justify-center rounded-full border border-amber-100 bg-amber-50">
              <Banknote className="size-3.5 text-amber-500" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-800">
            Rp {stats.estimasiBiaya.toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      {/* ── Main Layout (Left: Table, Right: Widgets) ───────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        {/* ── Left Column: Table ────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden flex flex-col h-fit">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-bold text-slate-800">Daftar Keluhan & Perbaikan</h2>
            <button className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
              Filter <Filter className="size-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium w-1/3">Kamar/Penghuni</th>
                  <th className="px-5 py-3 font-medium">Masalah</th>
                  <th className="px-5 py-3 font-medium">Prioritas</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      Tidak ada laporan saat ini.
                    </td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <tr key={item.id} className="transition hover:bg-slate-50/50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {/* Room Number Bubble */}
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f1f5f9] font-bold text-[#334155]">
                            {item.kamarNomor || "-"}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">
                              {item.penghuniNama || "Area Umum"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {item.kamarNomor ? `Lantai ${String(item.kamarNomor).charAt(0)}` : "Lantai -"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-700">{item.judul}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs font-semibold capitalize ${
                            PRIORITAS_CONFIG[item.prioritas] || "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {item.prioritas}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold capitalize bg-white ${
                            STATUS_CONFIG[item.status]?.border || "border-slate-200"
                          } ${STATUS_CONFIG[item.status]?.badge || "text-slate-600"}`}
                        >
                          {STATUS_CONFIG[item.status]?.label || item.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            disabled={isPending}
                            className="inline-flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          >
                            <MoreVertical className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleUpdateStatus(item.id, "menunggu")}>
                              Set Menunggu
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(item.id, "diproses")}>
                              Set Diproses
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(item.id, "selesai")}>
                              Set Selesai
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Right Column: Widgets ─────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Jadwal Pemeliharaan Rutin */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 leading-tight pr-2">
                Jadwal Pemeliharaan Rutin
              </h2>
              <CalendarDays className="size-5 text-slate-500 shrink-0" />
            </div>
            <div className="space-y-4">
              {MOCK_ROUTINE.map((rt, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${rt.iconBg} ${rt.iconColor}`}>
                    <rt.icon className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-semibold text-slate-800 truncate pr-2">
                        {rt.title}
                      </p>
                      <span className="text-xs font-medium text-slate-800 whitespace-nowrap">
                        {rt.date}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {rt.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Statistik Keluhan */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-6">
              Statistik Keluhan (Bulan Ini)
            </h2>
            
            {/* Donut Chart */}
            <div className="relative h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={MOCK_CHART_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {MOCK_CHART_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Center Total */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-slate-800">34</span>
                <span className="text-xs font-medium text-slate-500">Total</span>
              </div>
            </div>

            {/* Chart Legend */}
            <div className="mt-6 grid grid-cols-2 gap-y-3 gap-x-2">
              {MOCK_CHART_DATA.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs font-medium text-slate-500 truncate">
                    {item.name} ({item.value}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
