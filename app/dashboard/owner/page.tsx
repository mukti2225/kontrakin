import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  Download,
  ChevronDown,
  TrendingUp,
  Minus,
  AlertTriangle,
  Video,
  Megaphone,
  Wrench,
  FileText,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/db/prisma";
import { dashboardService } from "@/lib/services/dashboard";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { OccupancyBarChart } from "@/components/dashboard/OccupancyBarChart";
import { CapacityGauge } from "@/components/dashboard/CapacityGauge";

// ─── Status badge helpers ──────────────────────────────────────────────────────

const statusStyles: Record<string, string> = {
  selesai: "bg-emerald-50 text-emerald-700 border-emerald-200",
  diproses: "bg-amber-50 text-amber-700 border-amber-200",
  menunggu: "bg-rose-50 text-rose-700 border-rose-200",
};

const statusLabel: Record<string, string> = {
  selesai: "Selesai",
  diproses: "Dalam Proses",
  menunggu: "Menunggu",
};

// ─── Avatar placeholder ────────────────────────────────────────────────────────

function ActivityAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const colors = [
    "bg-teal-100 text-teal-700",
    "bg-blue-100 text-blue-700",
    "bg-purple-100 text-purple-700",
    "bg-amber-100 text-amber-700",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div
      className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${color}`}
    >
      {initials}
    </div>
  );
}

// ─── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  delta,
  deltaLabel,
  variant = "default",
  badge,
}: {
  label: string;
  value: string | number;
  delta?: string;
  deltaLabel?: string;
  variant?: "teal" | "default";
  badge?: React.ReactNode;
}) {
  const isTeal = variant === "teal";
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 ${
        isTeal
          ? "bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-teal-200/50"
          : "border border-slate-100 bg-white"
      } shadow-sm`}
    >
      <button
        className={`absolute right-3 top-3 flex size-7 items-center justify-center rounded-full transition ${
          isTeal
            ? "bg-white/15 text-white hover:bg-white/25"
            : "border border-slate-200 text-slate-400 hover:bg-slate-50"
        }`}
      >
        <ArrowUpRight className="size-3.5" />
      </button>

      <p className={`text-sm font-medium ${isTeal ? "text-white/80" : "text-slate-500"}`}>
        {label}
      </p>
      <p className={`mt-2 text-4xl font-bold ${isTeal ? "text-white" : "text-slate-800"}`}>
        {value}
      </p>

      {(delta || badge) && (
        <div className="mt-3 flex items-center gap-2">
          {delta && (
            <span
              className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                isTeal ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-700"
              }`}
            >
              <TrendingUp className="size-3" />
              {delta}
            </span>
          )}
          {badge}
          {deltaLabel && (
            <span
              className={`text-xs ${isTeal ? "text-white/70" : "text-slate-500"}`}
            >
              {deltaLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function OwnerPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "owner") redirect("/unauthorized");

  const [dashboard, properties, maintenanceItems] = await Promise.all([
    dashboardService.getDashboardData(user.id),
    prisma.properti.findMany({
      where: { ownerId: user.id },
      include: { kamar: { include: { penghuni: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.pemeliharaan.findMany({
      where: { ownerId: user.id },
      include: { kamar: true, penghuni: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const totalKamar = dashboard.kamar.length;
  const kamarTerisi = dashboard.kamar.filter((k) => k.status === "terisi").length;
  const kamarKosong = dashboard.kamar.filter((k) => k.status === "kosong").length;
  const tunggakan = maintenanceItems.filter((m) => m.status === "menunggu").length;
  const occupancyPct = totalKamar > 0 ? Math.round((kamarTerisi / totalKamar) * 100) : 0;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {/* ── Page header ─────────────────────────────────────────── */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">
              Pantau status properti dan kelola operasional dengan mudah.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/owner/properti"
              className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-teal-200 transition hover:bg-teal-700 active:scale-[0.98]"
            >
              <Plus className="size-4" />
              Tambah Kamar
            </Link>
            <button className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]">
              <Download className="size-4" />
              Export Laporan
            </button>
          </div>
        </div>

        {/* ── Stat cards ──────────────────────────────────────────── */}
        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Kamar"
            value={totalKamar}
            delta="+2"
            deltaLabel="Bulan ini"
            variant="teal"
          />
          <StatCard
            label="Terisi"
            value={kamarTerisi}
            delta="+1"
            deltaLabel="Dari bulan lalu"
          />
          <StatCard
            label="Kosong"
            value={kamarKosong}
            delta="→ 0"
            deltaLabel="Stabil"
          />
          <StatCard
            label="Tunggakan"
            value={tunggakan}
            badge={
              tunggakan > 0 ? (
                <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  <AlertTriangle className="size-3" />
                  Perhatian
                </span>
              ) : undefined
            }
            deltaLabel={tunggakan > 0 ? "Menunggu validasi" : "Tidak ada"}
          />
        </section>

        {/* ── Main 2-col grid ─────────────────────────────────────── */}
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          {/* ── Left column ──────────────────────────────────────── */}
          <div className="space-y-6">
            {/* Tingkat Hunian chart */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-800">Tingkat Hunian</h2>
                <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
                  Minggu Ini
                  <ChevronDown className="size-3.5" />
                </button>
              </div>
              <OccupancyBarChart occupancyRate={occupancyPct} />
            </div>

            {/* Aktivitas & Perhatian */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-800">Aktivitas &amp; Perhatian</h2>
                <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
                  <Plus className="size-3.5" />
                  Tambah Catatan
                </button>
              </div>

              {maintenanceItems.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
                  Tidak ada aktivitas terbaru.
                </p>
              ) : (
                <ul className="divide-y divide-slate-50">
                  {maintenanceItems.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 py-3">
                      <ActivityAvatar name={item.penghuni?.nama ?? "?"} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {item.penghuni?.nama ?? "Penghuni"}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {item.judul} {item.kamar ? `Kamar ${item.kamar.nomor}` : ""}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          statusStyles[item.status] ?? "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        {statusLabel[item.status] ?? item.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {maintenanceItems.length > 0 && (
                <Link
                  href="/dashboard/owner/pemeliharaan"
                  className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Lihat semua
                  <ArrowRight className="size-4" />
                </Link>
              )}
            </div>
          </div>

          {/* ── Right column ─────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Pengingat */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Pengingat
              </p>
              <p className="text-base font-bold text-slate-800">Meeting dengan Calon Penyewa</p>
              <p className="mt-0.5 text-xs text-slate-500">Waktu: 14.00 - 15.00 WIB</p>
              <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-200 transition hover:bg-teal-700 active:scale-[0.98]">
                <Video className="size-4" />
                Start Meeting
              </button>
            </div>

            {/* Kapasitas Properti */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="mb-3 text-sm font-semibold text-slate-800">Kapasitas Properti</p>
              <CapacityGauge filled={kamarTerisi} total={totalKamar} />
            </div>

            {/* Tugas Cepat */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">Tugas Cepat</p>
                <button className="rounded-lg border border-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
                  +New
                </button>
              </div>

              <ul className="space-y-3">
                {[
                  {
                    icon: Megaphone,
                    title: "Broadcast Pesan",
                    desc: "Informasi pemadaman listrik",
                    color: "bg-teal-50 text-teal-600",
                  },
                  {
                    icon: Wrench,
                    title: "Jadwal Maintenance",
                    desc: "Pembersihan AC Bulanan",
                    color: "bg-amber-50 text-amber-600",
                  },
                  {
                    icon: FileText,
                    title: "Cetak Invoice",
                    desc: "Tagihan bulan ini",
                    color: "bg-blue-50 text-blue-600",
                  },
                ].map((task) => (
                  <li key={task.title} className="flex items-center gap-3">
                    <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${task.color}`}>
                      <task.icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-700">{task.title}</p>
                      <p className="truncate text-xs text-slate-500">{task.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
