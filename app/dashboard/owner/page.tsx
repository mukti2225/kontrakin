import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  Download,
  ChevronDown,
  TrendingUp,
  AlertTriangle,
  Clock,
  DoorOpen,
  Sparkles,
  Video,
  Megaphone,
  Wrench,
  FileText,
  Receipt,
  Users,
  CheckCircle2,
  Building2,
  Bed,
  CreditCard,
} from "lucide-react";

import { requireOrganization } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/db/prisma";
import { formatRupiah } from "@/lib/utils";
import { OccupancyBarChart } from "@/components/dashboard/OccupancyBarChart";
import { CapacityGauge } from "@/components/dashboard/CapacityGauge";
import { StatusBadge } from "@/components/ui/status-badge";
import { OnboardingWizard, type OnboardingStepItem } from "@/components/dashboard/OnboardingWizard";

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
  href,
}: {
  label: string;
  value: string | number;
  delta?: string;
  deltaLabel?: string;
  variant?: "teal" | "default";
  badge?: React.ReactNode;
  href?: string;
}) {
  const isTeal = variant === "teal";
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 border transition-all ${
        isTeal
          ? "border-emerald-200/90 bg-gradient-to-b from-emerald-50/50 to-white shadow-xs"
          : "border-slate-200/80 bg-white shadow-xs"
      }`}
    >
      {href ? (
        <Link
          href={href}
          className={`absolute right-4 top-4 flex size-7 items-center justify-center rounded-lg border transition ${
            isTeal
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300"
              : "border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600"
          }`}
          aria-label={`Lihat rincian ${label}`}
        >
          <ArrowUpRight className="size-3.5" />
        </Link>
      ) : null}

      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        {isTeal && (
          <span className="rounded bg-emerald-100/80 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
            Utama
          </span>
        )}
      </div>

      <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
        {value}
      </p>

      {(delta || badge || deltaLabel) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {delta && (
            <span className="flex items-center gap-0.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              <TrendingUp className="size-3" />
              {delta}
            </span>
          )}
          {badge}
          {deltaLabel && (
            <span className="text-xs font-medium text-slate-500">
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
  const { user, organization, role } = await requireOrganization();
  const normalizedUserRole = user.role?.toLowerCase().replace(/[^a-z]/g, "") || "";
  if (
    normalizedUserRole !== "owner" &&
    normalizedUserRole !== "staff" &&
    role !== "owner" &&
    role !== "staff"
  ) {
    redirect("/unauthorized");
  }

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Parallel operational data fetch
  const [
    kamarList,
    overdueInvoices,
    invoicesThisMonth,
    invoicesLastMonth,
    expiringLeases,
    maintenanceItems,
    propertiList,
    penghuniCount,
    recentPayments,
    recentLeases,
    totalInvoicesCount,
  ] = await Promise.all([
    // Rooms
    prisma.kamar.findMany({
      where: {
        OR: [{ ownerId: user.id }, { organizationId: organization.id }],
      },
      include: { penghuni: true },
    }),

    // Overdue Invoices
    prisma.invoice.findMany({
      where: {
        organizationId: organization.id,
        status: { in: ["issued", "partial", "overdue"] },
        dueDate: { lt: now },
        balanceDue: { gt: 0 },
      },
      include: {
        penghuni: { select: { nama: true } },
        lease: { include: { kamar: { select: { nomor: true } } } },
      },
      orderBy: { dueDate: "asc" },
    }),

    // Invoices this month
    prisma.invoice.findMany({
      where: {
        organizationId: organization.id,
        dueDate: {
          gte: new Date(currentYear, currentMonth, 1),
          lt: new Date(currentYear, currentMonth + 1, 1),
        },
      },
    }),

    // Invoices last month for comparison
    prisma.invoice.findMany({
      where: {
        organizationId: organization.id,
        dueDate: {
          gte: new Date(currentYear, currentMonth - 1, 1),
          lt: new Date(currentYear, currentMonth, 1),
        },
      },
      select: { total: true, balanceDue: true },
    }),

    // Expiring leases in < 30 days
    prisma.lease.findMany({
      where: {
        organizationId: organization.id,
        status: "active",
        endDate: { gte: now, lte: in30Days },
      },
      include: {
        penghuni: { select: { nama: true } },
        kamar: { select: { nomor: true } },
      },
      orderBy: { endDate: "asc" },
    }),

    // Maintenance requests
    prisma.pemeliharaan.findMany({
      where: {
        OR: [{ ownerId: user.id }, { organizationId: organization.id }],
      },
      include: { kamar: true, penghuni: true },
      orderBy: { createdAt: "desc" },
    }),

    // Properti list with rooms for multi-property performance overview
    prisma.properti.findMany({
      where: { OR: [{ ownerId: user.id }, { organizationId: organization.id }] },
      include: {
        kamar: {
          select: { id: true, nomor: true, status: true, hargaBulanan: true },
        },
      },
      take: 6,
      orderBy: { createdAt: "desc" },
    }),

    // Penghuni count
    prisma.penghuni.count({
      where: { OR: [{ ownerId: user.id }, { organizationId: organization.id }] },
    }),

    // Recent payments for unified activity stream
    prisma.payment.findMany({
      where: { organizationId: organization.id },
      include: {
        penghuni: { select: { nama: true } },
      },
      orderBy: { paidAt: "desc" },
      take: 4,
    }),

    // Recent leases for unified activity stream
    prisma.lease.findMany({
      where: { organizationId: organization.id, status: "active" },
      include: {
        penghuni: { select: { nama: true } },
        kamar: { select: { nomor: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),

    // Total Invoices Count for Onboarding Checklist
    prisma.invoice.count({
      where: { organizationId: organization.id },
    }),
  ]);

  // Operational metrics
  const propertiCount = propertiList.length;
  const totalKamar = kamarList.length;
  const kamarTerisi = kamarList.filter((k) => k.status === "terisi").length;
  const kamarKosong = kamarList.filter((k) => k.status === "kosong").length;
  const occupancyPct = totalKamar > 0 ? Math.round((kamarTerisi / totalKamar) * 100) : 0;

  const totalTunggakan = overdueInvoices.reduce((sum, inv) => sum + Number(inv.balanceDue), 0);
  const expectedRent = invoicesThisMonth.reduce((sum, inv) => sum + Number(inv.total), 0);
  const collectedRent = invoicesThisMonth.reduce(
    (sum, inv) => sum + (Number(inv.total) - Number(inv.balanceDue)),
    0
  );

  const collectedRentLastMonth = invoicesLastMonth.reduce(
    (sum, inv) => sum + (Number(inv.total) - Number(inv.balanceDue)),
    0
  );

  let collectionGrowthText: string | undefined = undefined;
  if (collectedRentLastMonth > 0) {
    const growth = Math.round(
      ((collectedRent - collectedRentLastMonth) / collectedRentLastMonth) * 100
    );
    collectionGrowthText = growth >= 0 ? `+${growth}% vs bln lalu` : `${growth}% vs bln lalu`;
  } else if (collectedRent > 0) {
    collectionGrowthText = "Bulan perdana aktif";
  }

  const openMaintenance = maintenanceItems.filter((m) => m.status !== "selesai");

  // Unified Chronological Activity Stream
  type ActivityItem = {
    id: string;
    type: "payment" | "lease" | "maintenance";
    title: string;
    subtitle: string;
    date: Date;
    badgeText: string;
    badgeVariant: "emerald" | "blue" | "amber" | "rose" | "slate";
    avatarName: string;
  };

  const activityList: ActivityItem[] = [
    ...recentPayments.map((p) => ({
      id: `pay-${p.id}`,
      type: "payment" as const,
      title: `Pembayaran ${formatRupiah(Number(p.amount))}`,
      subtitle: `${p.penghuni?.nama ?? "Penyewa"} (${p.paymentMethod.toUpperCase()})`,
      date: new Date(p.paidAt),
      badgeText: "Lunas",
      badgeVariant: "emerald" as const,
      avatarName: p.penghuni?.nama ?? "Kas",
    })),
    ...recentLeases.map((l) => ({
      id: `lease-${l.id}`,
      type: "lease" as const,
      title: "Kontrak Sewa Aktif",
      subtitle: `${l.penghuni?.nama ?? "Penyewa"} • Kamar ${l.kamar?.nomor ?? "-"}`,
      date: new Date(l.createdAt),
      badgeText: "Aktif",
      badgeVariant: "blue" as const,
      avatarName: l.penghuni?.nama ?? "Sewa",
    })),
    ...maintenanceItems.slice(0, 4).map((m) => {
      const variant: "emerald" | "amber" | "rose" =
        m.status === "selesai" ? "emerald" : m.status === "diproses" ? "amber" : "rose";
      return {
        id: `maint-${m.id}`,
        type: "maintenance" as const,
        title: m.judul,
        subtitle: `${m.penghuni?.nama ?? "Penghuni"}${m.kamar ? ` • Kamar ${m.kamar.nomor}` : ""}`,
        date: new Date(m.createdAt),
        badgeText: statusLabel[m.status] ?? m.status,
        badgeVariant: variant,
        avatarName: m.penghuni?.nama ?? "Perbaikan",
      };
    }),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

  // Onboarding Setup Steps (Signup -> Organization -> Property -> Units -> Tenant -> Lease -> First Invoice)
  const setupSteps: OnboardingStepItem[] = [
    {
      id: "step-property",
      stepNumber: 1,
      title: "1. Daftarkan Properti",
      shortDesc: "Buat profil gedung, kontrakan, atau kos properti perdana Anda.",
      detailHelp:
        "Daftarkan nama properti, alamat lengkap, tipe pengelolaan (Kost / Kontrakan / Ruko), serta fasilitas umum properti. Setiap unit kamar nantinya akan dikelompokkan ke dalam properti ini.",
      done: propertiCount > 0,
      href: "/dashboard/owner/properti",
      actionText: "Tambah Properti",
      estimatedMinutes: "1 menit",
      icon: "building",
    },
    {
      id: "step-rooms",
      stepNumber: 2,
      title: "2. Tambah Unit Kamar",
      shortDesc: "Tentukan nomor kamar, lantai, tipe, dan tarif sewa bulanan.",
      detailHelp:
        "Tambahkan kamar individual ke properti Anda. Atur harga sewa per bulan dan status ketersediaan awal (Kosong/Siap Huni). Unit ini akan menjadi objek penempatan bagi penyewa.",
      done: totalKamar > 0,
      href: "/dashboard/owner/kamar",
      actionText: "Tambah Kamar",
      estimatedMinutes: "2 menit",
      icon: "bed",
    },
    {
      id: "step-tenants",
      stepNumber: 3,
      title: "3. Daftarkan Penyewa",
      shortDesc: "Catat nama penyewa, nomor WhatsApp, atau bagikan kode undangan.",
      detailHelp:
        "Masukkan kontak penyewa aktif atau bagikan kode undangan registrasi tenant self-service agar penyewa dapat mengakses portal kwitansi digital dan tiket perbaikan mandiri.",
      done: penghuniCount > 0,
      href: "/dashboard/owner/penghuni",
      actionText: "Tambah Penyewa",
      estimatedMinutes: "1 menit",
      icon: "users",
    },
    {
      id: "step-lease",
      stepNumber: 4,
      title: "4. Aktifkan Kontrak Sewa",
      shortDesc: "Kaitkan penyewa dengan kamar untuk mengikat masa sewa resmi.",
      detailHelp:
        "Hubungkan penyewa ke unit kamar yang disewa, tentukan tanggal mulai & berakhir, uang jaminan deposit, serta siklus penagihan. Sistem akan menerbitkan dokumen kontrak sewa resmi.",
      done: kamarTerisi > 0 || expiringLeases.length > 0,
      href: "/dashboard/owner/kontrak",
      actionText: "Buat Kontrak",
      estimatedMinutes: "2 menit",
      icon: "fileText",
    },
    {
      id: "step-invoice",
      stepNumber: 5,
      title: "5. Terbitkan Tagihan Perdana",
      shortDesc: "Generate invoice sewa perdana atau kirim tagihan via WhatsApp.",
      detailHelp:
        "Generate invoice sewa bulanan dari kontrak aktif. Invoice ini mencakup rincian biaya sewa, tanggal jatuh tempo, dan nomor rekening penampung kas untuk rekonsiliasi pembayaran.",
      done: totalInvoicesCount > 0,
      href: "/dashboard/owner/keuangan",
      actionText: "Buka Keuangan",
      estimatedMinutes: "1 menit",
      icon: "receipt",
    },
  ];

  const completedSteps = setupSteps.filter((s) => s.done).length;
  const isSetupIncomplete = completedSteps < setupSteps.length;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* ── Page header ─────────────────────────────────────────── */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Operations Command Center
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Pantau operasional sewa, tindakan penagihan, dan tiket perbaikan properti.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/owner/kontrak"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
            >
              <FileText className="size-4 text-teal-600" />
              Buat Kontrak Sewa
            </Link>
            <Link
              href="/dashboard/owner/properti"
              className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-teal-200 transition hover:bg-teal-700 active:scale-[0.98]"
            >
              <Plus className="size-4" />
              Tambah Kamar
            </Link>
          </div>
        </div>

        {/* ── First-Time Onboarding Wizard (Shown while setup is incomplete) ── */}
        {isSetupIncomplete && (
          <OnboardingWizard
            steps={setupSteps}
            organizationName={organization.name}
          />
        )}

        {/* ── Action Center (Hero Operational Triage) ─────────────── */}
        <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Sparkles className="size-4.5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Pusat Aksi Operasional (Action Center)
                </h2>
                <p className="text-xs text-slate-500">
                  Tindakan prioritas yang memerlukan tindak lanjut Anda hari ini.
                </p>
              </div>
            </div>
            <span className="w-fit rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              Sinkron Real-time
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {/* Action 1: Overdue Invoices */}
            <div
              className={`flex flex-col justify-between rounded-xl border p-4 transition ${
                overdueInvoices.length > 0
                  ? "border-rose-200 bg-rose-50/50"
                  : "border-slate-200/70 bg-slate-50/50"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Tagihan Tertunggak
                  </span>
                  <StatusBadge
                    variant={overdueInvoices.length > 0 ? "rose" : "slate"}
                    icon={overdueInvoices.length > 0 ? "alert" : "check"}
                  >
                    {overdueInvoices.length > 0 ? "Kritis" : "Terkendali"}
                  </StatusBadge>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-black tracking-tight text-slate-900">
                    {overdueInvoices.length}{" "}
                    <span className="text-xs font-normal text-slate-500">tagihan</span>
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-rose-700">
                    {overdueInvoices.length > 0
                      ? `${formatRupiah(totalTunggakan)} tertunggak`
                      : "Semua tagihan lunas tepat waktu"}
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/owner/keuangan?tab=invoices&filter=overdue"
                className={`mt-4 flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition active:scale-[0.98] ${
                  overdueInvoices.length > 0
                    ? "bg-rose-100 text-rose-800 hover:bg-rose-200"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <span>Tinjau Penagihan</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            {/* Action 2: Expiring Leases */}
            <div
              className={`flex flex-col justify-between rounded-xl border p-4 transition ${
                expiringLeases.length > 0
                  ? "border-amber-200 bg-amber-50/50"
                  : "border-slate-200/70 bg-slate-50/50"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Kontrak &lt; 30 Hari
                  </span>
                  <StatusBadge
                    variant={expiringLeases.length > 0 ? "amber" : "slate"}
                    icon={expiringLeases.length > 0 ? "clock" : "check"}
                  >
                    {expiringLeases.length > 0 ? "Perhatian" : "Aman"}
                  </StatusBadge>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-black tracking-tight text-slate-900">
                    {expiringLeases.length}{" "}
                    <span className="text-xs font-normal text-slate-500">kontrak</span>
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-amber-800">
                    {expiringLeases.length > 0
                      ? "Perlu konfirmasi perpanjangan sewa"
                      : "Tidak ada kontrak yang segera berakhir"}
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/owner/kontrak?filter=expiring"
                className={`mt-4 flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition active:scale-[0.98] ${
                  expiringLeases.length > 0
                    ? "bg-amber-100 text-amber-900 hover:bg-amber-200"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <span>Kelola Kontrak</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            {/* Action 3: Open Maintenance */}
            <div
              className={`flex flex-col justify-between rounded-xl border p-4 transition ${
                openMaintenance.length > 0
                  ? "border-blue-200 bg-blue-50/50"
                  : "border-slate-200/70 bg-slate-50/50"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Keluhan Perbaikan
                  </span>
                  <StatusBadge
                    variant={openMaintenance.length > 0 ? "amber" : "emerald"}
                    icon={openMaintenance.length > 0 ? "alert" : "check"}
                  >
                    {openMaintenance.length > 0 ? "Perlu Respon" : "Nir-Keluhan"}
                  </StatusBadge>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-black tracking-tight text-slate-900">
                    {openMaintenance.length}{" "}
                    <span className="text-xs font-normal text-slate-500">tiket aktif</span>
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-blue-800">
                    {openMaintenance.length > 0
                      ? "Tugaskan vendor atau teknisi lapangan"
                      : "Semua fasilitas berfungsi optimal"}
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/owner/pemeliharaan?status=menunggu"
                className={`mt-4 flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition active:scale-[0.98] ${
                  openMaintenance.length > 0
                    ? "bg-blue-100 text-blue-900 hover:bg-blue-200"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <span>Tinjau Perbaikan</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            {/* Action 4: Vacant Units */}
            <div className="flex flex-col justify-between rounded-xl border border-slate-200/70 bg-slate-50/50 p-4 transition">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Kamar Kosong
                  </span>
                  <StatusBadge
                    variant={kamarKosong > 0 ? "slate" : "emerald"}
                    icon={kamarKosong > 0 ? "none" : "check"}
                  >
                    {kamarKosong > 0 ? "Peluang Sewa" : "Penuh (100%)"}
                  </StatusBadge>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-black tracking-tight text-slate-900">
                    {kamarKosong}{" "}
                    <span className="text-xs font-normal text-slate-500">unit</span>
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-slate-600">
                    {kamarKosong > 0
                      ? "Siap untuk dipasarkan dan dihuni"
                      : "Seluruh kapasitas unit terisi"}
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/owner/kamar?status=kosong"
                className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
              >
                <span>Kelola Kamar</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Top KPI Stat Cards ──────────────────────────────────── */}
        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Tingkat Hunian"
            value={`${occupancyPct}%`}
            deltaLabel={`${kamarTerisi} dari ${totalKamar} kamar terisi`}
            variant="teal"
            href="/dashboard/owner/kamar"
          />
          <StatCard
            label="Pemasukan Diharapkan"
            value={formatRupiah(expectedRent)}
            deltaLabel="Bulan ini"
            href="/dashboard/owner/keuangan?tab=invoices"
          />
          <StatCard
            label="Terkumpul Bulan Ini"
            value={formatRupiah(collectedRent)}
            delta={
              collectionGrowthText ||
              (expectedRent > 0 ? `${Math.round((collectedRent / expectedRent) * 100)}%` : "100%")
            }
            deltaLabel={collectionGrowthText ? "Pertumbuhan vs bln lalu" : "Collection rate"}
            href="/dashboard/owner/keuangan"
          />
          <StatCard
            label="Total Tunggakan"
            value={formatRupiah(totalTunggakan)}
            badge={
              totalTunggakan > 0 ? (
                <span className="flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
                  <AlertTriangle className="size-3" />
                  Perhatian
                </span>
              ) : undefined
            }
            deltaLabel={totalTunggakan > 0 ? `${overdueInvoices.length} invoice belum bayar` : "Nihil"}
            href="/dashboard/owner/keuangan?tab=invoices&filter=overdue"
          />
        </section>

        {/* ── Main 2-col grid ─────────────────────────────────────── */}
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          {/* ── Left column ──────────────────────────────────────── */}
          <div className="space-y-6">
            {/* Tingkat Hunian chart */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-800">Tingkat Hunian Properti</h2>
                  <p className="text-xs text-slate-500">Persentase okupansi kamar aktif portofolio.</p>
                </div>
              </div>
              <OccupancyBarChart occupancyRate={occupancyPct} />
            </div>

            {/* Ringkasan Kinerja Portofolio Properti */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-800">
                    Portofolio Properti
                  </h2>
                  <p className="text-xs text-slate-500">
                    Kapasitas unit dan tingkat okupansi per lokasi aset.
                  </p>
                </div>
                <Link
                  href="/dashboard/owner/properti"
                  className="text-xs font-semibold text-teal-700 hover:underline"
                >
                  Kelola Semua ({propertiList.length})
                </Link>
              </div>

              {propertiList.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                  <Building2 className="mx-auto size-8 text-slate-400" />
                  <p className="mt-2 text-sm font-semibold text-slate-700">Belum Ada Properti Terdaftar</p>
                  <p className="mt-1 text-xs text-slate-500">Daftarkan properti pertama untuk mulai memantau unit.</p>
                  <Link
                    href="/dashboard/owner/properti"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-700"
                  >
                    <Plus className="size-3.5" />
                    Tambah Properti
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {propertiList.map((p) => {
                    const totalUnits = p.kamar.length;
                    const filledUnits = p.kamar.filter((k) => k.status === "terisi").length;
                    const propOccupancy = totalUnits > 0 ? Math.round((filledUnits / totalUnits) * 100) : 0;

                    return (
                      <div
                        key={p.id}
                        className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/60 px-3 rounded-xl transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                            <Building2 className="size-5" />
                          </div>
                          <div>
                            <Link
                              href={`/dashboard/owner/properti/${p.id}`}
                              className="font-semibold text-slate-900 hover:text-teal-700 text-sm flex items-center gap-1 group"
                            >
                              <span>{p.nama}</span>
                              <ArrowUpRight className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-teal-600" />
                            </Link>
                            <p className="text-xs text-slate-500">
                              {p.alamat || (p.tipe ? `Tipe ${p.tipe}` : "Lokasi properti")}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <span className="text-xs font-bold text-slate-800">{propOccupancy}%</span>
                              <span className="text-[11px] text-slate-500">
                                ({filledUnits}/{totalUnits} unit)
                              </span>
                            </div>
                            <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full bg-teal-600 rounded-full transition-all duration-300"
                                style={{ width: `${propOccupancy}%` }}
                              />
                            </div>
                          </div>

                          <Link
                            href={`/dashboard/owner/properti/${p.id}`}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0"
                            title="Buka rincian properti"
                          >
                            <ArrowRight className="size-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Right column ─────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Kapasitas Properti */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="mb-3 text-sm font-semibold text-slate-800">Kapasitas Properti</p>
              <CapacityGauge filled={kamarTerisi} total={totalKamar} />
            </div>

            {/* Aktivitas Operasional Terkini */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-800">
                    Aktivitas Operasional
                  </h2>
                  <p className="text-xs text-slate-500">Rekap transaksi, kontrak, &amp; perbaikan.</p>
                </div>
              </div>

              {activityList.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
                  Belum ada aktivitas operasional tercatat.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {activityList.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 py-3">
                      <ActivityAvatar name={item.avatarName} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {item.title}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {item.subtitle}
                        </p>
                      </div>
                      <StatusBadge variant={item.badgeVariant} dot>
                        {item.badgeText}
                      </StatusBadge>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Navigasi Cepat Operasional */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="mb-3 text-sm font-semibold text-slate-800">Navigasi Operasional</p>

              <ul className="space-y-2">
                {[
                  {
                    icon: Receipt,
                    title: "Kelola Tagihan",
                    desc: "Tagihan sewa & rekonsiliasi",
                    href: "/dashboard/owner/keuangan?tab=invoices",
                    color: "bg-teal-50 text-teal-600",
                  },
                  {
                    icon: FileText,
                    title: "Kontrak Sewa",
                    desc: "Kontrak aktif & perpanjangan",
                    href: "/dashboard/owner/kontrak",
                    color: "bg-blue-50 text-blue-600",
                  },
                  {
                    icon: Wrench,
                    title: "Pemeliharaan & Vendor",
                    desc: "Perbaikan & teknisi",
                    href: "/dashboard/owner/pemeliharaan",
                    color: "bg-amber-50 text-amber-600",
                  },
                  {
                    icon: Users,
                    title: "Data Penyewa",
                    desc: "Daftar penyewa & kontak darurat",
                    href: "/dashboard/owner/penghuni",
                    color: "bg-purple-50 text-purple-600",
                  },
                ].map((task) => (
                  <li key={task.title}>
                    <Link
                      href={task.href}
                      className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-slate-50"
                    >
                      <div
                        className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${task.color}`}
                      >
                        <task.icon className="size-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800">{task.title}</p>
                        <p className="truncate text-xs text-slate-500">{task.desc}</p>
                      </div>
                      <ArrowRight className="size-3.5 text-slate-400" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
  );
}
