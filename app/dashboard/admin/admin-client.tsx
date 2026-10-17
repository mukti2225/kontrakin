"use client";

import { useState, useTransition } from "react";
import {
  Building2,
  Users,
  FileCheck2,
  Activity,
  ShieldCheck,
  Search,
  ExternalLink,
  Layers,
  Sparkles,
  CreditCard,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Server,
  RefreshCw,
  Eye,
  X,
  FileDown,
  MessageSquare,
  Zap,
  HelpCircle,
  Database,
  Radio,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah } from "@/lib/utils";
import { toast } from "sonner";
import {
  type PlatformStats,
  type OrganizationDTO,
  retryFailedJob,
  logSupportAccess,
} from "./action";

interface AdminClientProps {
  stats: PlatformStats;
}

export function AdminClient({ stats }: AdminClientProps) {
  const [activeTab, setActiveTab] = useState<"orgs" | "plans" | "users" | "health" | "audit">("orgs");
  const [orgSearch, setOrgSearch] = useState("");
  const [orgStatusFilter, setOrgStatusFilter] = useState<"semua" | "active" | "trial" | "past_due">("semua");
  const [userSearch, setUserSearch] = useState("");
  const [auditSearch, setAuditSearch] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<OrganizationDTO | null>(null);
  const [isPending, startTransition] = useTransition();

  // Organizations filtering
  const filteredOrgs = stats.organizations.filter((o) => {
    const matchesSearch =
      o.name.toLowerCase().includes(orgSearch.toLowerCase()) ||
      o.ownerName.toLowerCase().includes(orgSearch.toLowerCase()) ||
      o.ownerEmail.toLowerCase().includes(orgSearch.toLowerCase()) ||
      (o.slug && o.slug.toLowerCase().includes(orgSearch.toLowerCase()));

    const matchesStatus =
      orgStatusFilter === "semua" ? true : o.subscriptionStatus === orgStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // Users filtering
  const filteredUsers = stats.recentUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Audit logs filtering
  const filteredAudit = stats.recentAuditLogs.filter(
    (l) =>
      l.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.actorName.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.organizationName.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.entityType.toLowerCase().includes(auditSearch.toLowerCase())
  );

  // Safe Support Access Action
  const handleOpenSupportModal = (org: OrganizationDTO) => {
    setSelectedOrg(org);
    startTransition(async () => {
      try {
        await logSupportAccess(org.id, org.name);
      } catch {
        // Non-blocking log
      }
    });
  };

  const handleRetryJob = (jobId: string) => {
    startTransition(async () => {
      try {
        const res = await retryFailedJob(jobId);
        toast.success(res.message);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal menjadwalkan ulang job");
      }
    });
  };

  const handleExportOrgsCSV = () => {
    const headers = [
      "ID Organisasi",
      "Nama Organisasi",
      "Slug",
      "Pemilik (Owner)",
      "Email Owner",
      "Paket",
      "MRR (IDR)",
      "Status Langganan",
      "Jumlah Unit",
      "Jumlah Properti",
      "Tanggal Terdaftar",
    ];

    const rows = filteredOrgs.map((o) => [
      o.id,
      `"${o.name.replace(/"/g, '""')}"`,
      o.slug || "-",
      `"${o.ownerName.replace(/"/g, '""')}"`,
      o.ownerEmail,
      o.plan,
      o.planPrice,
      o.subscriptionStatus,
      o.unitCount,
      o.propertyCount,
      o.createdAt.slice(0, 10),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `platform_organisasi_kontrakin_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Data organisasi customer berhasil diekspor ke CSV!");
  };

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white shadow-xs">
              <ShieldCheck className="size-3.5 text-teal-400" />
              Platform Console Superadmin
            </span>
            <span className="text-xs text-slate-500 font-medium">SaaS Enterprise Control</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Platform Operations &amp; Health Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitoring performa bisnis SaaS, kesehatan klaster aplikasi, kepatuhan batas paket, dan log audit seluruh tenant.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportOrgsCSV}
            className="h-10 text-xs font-bold gap-1.5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <FileDown className="size-4 text-emerald-600" />
            <span>Ekspor CSV Organisasi</span>
          </Button>
        </div>
      </div>

      {/* ── 8 Core Action Center KPI Cards ──────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Total Organizations */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Organisasi Customer</p>
            <div className="flex size-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Building2 className="size-4.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{stats.totalOrganizations}</p>
          <p className="mt-1 text-[11px] text-slate-400">Total entitas bisnis rental terdaftar</p>
        </div>

        {/* 2. Active Subscriptions */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Langganan Berbayar</p>
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="size-4.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-700">{stats.activeSubscriptions}</p>
          <p className="mt-1 text-[11px] text-emerald-600 font-medium">Akun berstatus aktif (Paid)</p>
        </div>

        {/* 3. Trial Organizations */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Masa Uji Coba (Trial)</p>
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Clock className="size-4.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-blue-700">{stats.trialOrganizations}</p>
          <p className="mt-1 text-[11px] text-slate-400">Trial 14 hari masa evaluasi</p>
        </div>

        {/* 4. Monthly Recurring Revenue (MRR) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estimasi MRR</p>
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <TrendingUp className="size-4.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 tabular-nums">
            {formatRupiah(stats.mrr)}
          </p>
          <p className="mt-1 text-[11px] text-amber-700 font-semibold">Pendapatan langganan bulanan</p>
        </div>

        {/* 5. Managed Units */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit / Kamar Terkelola</p>
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Layers className="size-4.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-indigo-600">{stats.totalUnits}</p>
          <p className="mt-1 text-[11px] text-slate-400">{stats.totalActiveLeases} unit berpenghuni aktif</p>
        </div>

        {/* 6. Total Users by Role */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pengguna SaaS</p>
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Users className="size-4.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{stats.totalUsers}</p>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold">
            <span className="text-teal-700">{stats.usersByRole.owner} Owner</span> •
            <span className="text-indigo-700">{stats.usersByRole.staff} Staff</span> •
            <span className="text-emerald-700">{stats.usersByRole.tenant} Tenant</span>
          </div>
        </div>

        {/* 7. Failed Payments / Past Due */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Perlu Atensi Billing</p>
            <div className="flex size-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="size-4.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-rose-600">{stats.failedPaymentsCount}</p>
          <p className="mt-1 text-[11px] text-rose-500 font-medium">Organisasi berstatus past due</p>
        </div>

        {/* 8. Platform Health & Issues */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kesehatan Platform</p>
            <div className="flex size-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Server className="size-4.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-700">100% Online</p>
          <p className="mt-1 text-[11px] text-slate-400">
            {stats.platformIssuesCount > 0
              ? `${stats.platformIssuesCount} antrean tugas perlu retry`
              : "Semua klaster operasional normal"}
          </p>
        </div>
      </div>

      {/* ── 5 Tab Navigation Switcher ───────────────────────────────── */}
      <div className="flex rounded-2xl border border-slate-200 bg-slate-100 p-1 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab("orgs")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 px-3 min-h-[40px] whitespace-nowrap transition-all ${
            activeTab === "orgs"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Building2 className="size-4 text-teal-600" />
          <span>Direktori Organisasi ({stats.organizations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("plans")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 px-3 min-h-[40px] whitespace-nowrap transition-all ${
            activeTab === "plans"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Sparkles className="size-4 text-amber-600" />
          <span>Paket &amp; Batasan Fitur</span>
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 px-3 min-h-[40px] whitespace-nowrap transition-all ${
            activeTab === "users"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Users className="size-4 text-indigo-600" />
          <span>Pengguna Platform ({stats.totalUsers})</span>
        </button>

        <button
          onClick={() => setActiveTab("health")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 px-3 min-h-[40px] whitespace-nowrap transition-all ${
            activeTab === "health"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Server className="size-4 text-emerald-600" />
          <span>Kesehatan &amp; Job Gagal ({stats.failedJobs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 px-3 min-h-[40px] whitespace-nowrap transition-all ${
            activeTab === "audit"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Activity className="size-4 text-slate-700" />
          <span>Log Audit Global ({stats.recentAuditLogs.length})</span>
        </button>
      </div>

      {/* ── TAB 1: Direktori Organisasi Customer ────────────────────── */}
      {activeTab === "orgs" && (
        <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/75 border-b border-slate-100 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Direktori Organisasi Pelanggan
              </CardTitle>
              <CardDescription className="text-xs">
                Seluruh entitas rental SaaS, paket langganan aktif, penggunaan kuota unit, dan mode dukungan teknis.
              </CardDescription>
            </div>

            {/* Filter and Search controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex items-center gap-1 rounded-xl bg-slate-200/60 p-1 text-xs">
                {(["semua", "active", "trial", "past_due"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrgStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg font-bold capitalize transition ${
                      orgStatusFilter === st
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {st === "semua"
                      ? "Semua"
                      : st === "active"
                      ? "Aktif"
                      : st === "trial"
                      ? "Trial"
                      : "Past Due"}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Cari organisasi / owner..."
                  value={orgSearch}
                  onChange={(e) => setOrgSearch(e.target.value)}
                  className="h-10 w-full sm:w-60 pl-9 text-xs rounded-xl"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5">Organisasi &amp; Slug</th>
                    <th className="px-5 py-3.5">Akun Pemilik (Owner)</th>
                    <th className="px-5 py-3.5 text-center">Paket &amp; MRR</th>
                    <th className="px-5 py-3.5 text-center">Status Langganan</th>
                    <th className="px-5 py-3.5 text-center">Penggunaan Kuota</th>
                    <th className="px-5 py-3.5 text-right">Aksi Superadmin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrgs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                        Tidak ada organisasi yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredOrgs.map((org) => {
                      const pctUsed = Math.min(100, Math.round((org.unitCount / org.limitUnits) * 100));

                      return (
                        <tr key={org.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-4">
                            <p className="font-bold text-slate-900 text-sm">{org.name}</p>
                            <p className="font-mono text-[11px] text-slate-400">
                              @{org.slug || org.id.slice(-6)} • {org.propertyCount} Properti
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-800">{org.ownerName}</p>
                            <p className="text-[11px] text-slate-400">{org.ownerEmail}</p>
                          </td>

                          <td className="px-5 py-4 text-center">
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-extrabold uppercase ${
                                org.plan === "Business"
                                  ? "bg-purple-100 text-purple-800"
                                  : org.plan === "Pro"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {org.plan}
                            </span>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5 tabular-nums">
                              {formatRupiah(org.planPrice)}/bln
                            </p>
                          </td>

                          <td className="px-5 py-4 text-center">
                            <StatusBadge
                              variant={
                                org.subscriptionStatus === "active"
                                  ? "emerald"
                                  : org.subscriptionStatus === "trial"
                                  ? "blue"
                                  : org.subscriptionStatus === "past_due"
                                  ? "rose"
                                  : "slate"
                              }
                              dot
                            >
                              {org.subscriptionStatus === "active"
                                ? "Aktif (Paid)"
                                : org.subscriptionStatus === "trial"
                                ? "Trial 14 Hari"
                                : org.subscriptionStatus === "past_due"
                                ? "Past Due"
                                : "Cancelled"}
                            </StatusBadge>
                          </td>

                          <td className="px-5 py-4 text-center">
                            <p className="font-bold text-slate-800 tabular-nums">
                              {org.unitCount} / {org.limitUnits} Unit
                            </p>
                            <div className="w-24 mx-auto bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                              <div
                                className={`h-full rounded-full ${
                                  pctUsed > 90 ? "bg-rose-500" : pctUsed > 70 ? "bg-amber-500" : "bg-emerald-500"
                                }`}
                                style={{ width: `${pctUsed}%` }}
                              />
                            </div>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenSupportModal(org)}
                              className="h-8 text-xs font-semibold gap-1.5 border-teal-200 text-teal-800 bg-teal-50/40 hover:bg-teal-100 rounded-xl"
                            >
                              <Eye className="size-3.5" />
                              <span>Detail &amp; Support</span>
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── TAB 2: Paket & Batasan Fitur (Plans & Limits) ─────────────── */}
      {activeTab === "plans" && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Starter Plan */}
            <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tier 1</span>
                  <h3 className="text-xl font-black text-slate-900 mt-1">Starter</h3>
                  <p className="text-xs text-slate-500">Untuk pemilik kos pemula &amp; kontrakan mandiri.</p>
                </div>
                <span className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-black text-slate-800">
                  Rp 99.000<span className="text-[10px] font-normal">/bln</span>
                </span>
              </div>

              <div className="divide-y divide-slate-100 text-xs text-slate-600">
                <div className="py-2.5 flex justify-between">
                  <span className="font-medium">Maksimal Properti</span>
                  <span className="font-bold text-slate-900">1 Properti</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="font-medium">Maksimal Kamar / Unit</span>
                  <span className="font-bold text-slate-900">10 Unit</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="font-medium">Akun Tim &amp; Staf</span>
                  <span className="font-bold text-slate-900">1 Owner Saja</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="font-medium">WhatsApp Reminder</span>
                  <span className="font-bold text-emerald-600">Manual / Click</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="font-medium">AI Financial Advisory</span>
                  <span className="text-slate-400">Tidak Termasuk</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Pelanggan Aktif:</span>
                <span className="font-extrabold text-slate-900">
                  {stats.organizations.filter((o) => o.plan === "Starter").length} Organisasi
                </span>
              </div>
            </Card>

            {/* Pro Plan */}
            <Card className="border-2 border-teal-500/80 bg-white shadow-xs rounded-2xl p-5 space-y-4 relative">
              <div className="absolute -top-3 right-5">
                <span className="rounded-full bg-teal-600 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs">
                  Paling Populer
                </span>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Tier 2</span>
                  <h3 className="text-xl font-black text-slate-900 mt-1">Professional</h3>
                  <p className="text-xs text-slate-500">Untuk bisnis kos multi-lokasi skala menengah.</p>
                </div>
                <span className="rounded-xl bg-teal-50 px-3 py-1 text-xs font-black text-teal-800">
                  Rp 299.000<span className="text-[10px] font-normal">/bln</span>
                </span>
              </div>

              <div className="divide-y divide-slate-100 text-xs text-slate-600">
                <div className="py-2.5 flex justify-between">
                  <span className="font-medium">Maksimal Properti</span>
                  <span className="font-bold text-slate-900">5 Properti</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="font-medium">Maksimal Kamar / Unit</span>
                  <span className="font-bold text-slate-900">50 Unit</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="font-medium">Akun Tim &amp; Staf</span>
                  <span className="font-bold text-slate-900">Hingga 5 User</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="font-medium">WhatsApp Gateway</span>
                  <span className="font-bold text-emerald-600">Otomatis / Scheduled</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="font-medium">Modul Rekanan Vendor</span>
                  <span className="font-bold text-emerald-600">Termasuk</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Pelanggan Aktif:</span>
                <span className="font-extrabold text-teal-700">
                  {stats.organizations.filter((o) => o.plan === "Pro").length} Organisasi
                </span>
              </div>
            </Card>

            {/* Business Plan */}
            <Card className="border border-purple-200/80 bg-white shadow-xs rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-600">Tier 3</span>
                  <h3 className="text-xl font-black text-slate-900 mt-1">Business Scale</h3>
                  <p className="text-xs text-slate-500">Portofolio besar, pengelolaan residensial komprehensif.</p>
                </div>
                <span className="rounded-xl bg-purple-50 px-3 py-1 text-xs font-black text-purple-800">
                  Rp 699.000<span className="text-[10px] font-normal">/bln</span>
                </span>
              </div>

              <div className="divide-y divide-slate-100 text-xs text-slate-600">
                <div className="py-2.5 flex justify-between">
                  <span className="font-medium">Maksimal Properti</span>
                  <span className="font-bold text-slate-900">Unlimited</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="font-medium">Maksimal Kamar / Unit</span>
                  <span className="font-bold text-slate-900">200 Unit</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="font-medium">Akun Tim &amp; Staf</span>
                  <span className="font-bold text-slate-900">Unlimited Staf</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="font-medium">AI Advisory &amp; Analytics</span>
                  <span className="font-bold text-purple-600">Prioritas &amp; Terbuka</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="font-medium">Dukungan SLA Dedicated</span>
                  <span className="font-bold text-emerald-600">24/7 Priority</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Pelanggan Aktif:</span>
                <span className="font-extrabold text-purple-700">
                  {stats.organizations.filter((o) => o.plan === "Business").length} Organisasi
                </span>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── TAB 3: Distribusi Pengguna Platform ─────────────────────── */}
      {activeTab === "users" && (
        <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/75 border-b border-slate-100 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Distribusi Akun Pengguna Platform
              </CardTitle>
              <CardDescription className="text-xs">
                Klasifikasi hak akses akun di seluruh ekosistem Kontrakin.
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Cari user / email / role..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="h-10 w-full sm:w-60 pl-9 text-xs rounded-xl"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5">Nama Pengguna</th>
                    <th className="px-5 py-3.5">Alamat Email</th>
                    <th className="px-5 py-3.5 text-center">Peran (Role)</th>
                    <th className="px-5 py-3.5 text-right">Tanggal Registrasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-xs text-slate-400">
                        Tidak ada pengguna yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const r = u.role.toLowerCase();
                      const isSuperadmin = r === "superadmin" || r === "super-admin" || r === "admin";
                      const isOwner = r === "owner";
                      const isStaff = r === "staff";

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-4 font-bold text-slate-900">{u.name}</td>
                          <td className="px-5 py-4 text-slate-600 font-mono text-[11px]">{u.email}</td>
                          <td className="px-5 py-4 text-center">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                                isSuperadmin
                                  ? "bg-slate-900 text-teal-400"
                                  : isOwner
                                  ? "bg-teal-100 text-teal-800"
                                  : isStaff
                                  ? "bg-indigo-100 text-indigo-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right text-slate-400">
                            {new Date(u.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── TAB 4: Kesehatan Sistem & Antrean Gagal ─────────────────── */}
      {activeTab === "health" && (
        <div className="space-y-6">
          {/* Health Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border border-slate-200/80 bg-white p-5 rounded-2xl shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Database Cluster</span>
                <Database className="size-4 text-emerald-600" />
              </div>
              <p className="text-lg font-black text-slate-900">PostgreSQL Cloud</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span className="text-emerald-700 font-bold">Latency: {stats.systemHealth.database.latencyMs}ms</span>
              </div>
            </Card>

            <Card className="border border-slate-200/80 bg-white p-5 rounded-2xl shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Background Queue</span>
                <Radio className="size-4 text-blue-600" />
              </div>
              <p className="text-lg font-black text-slate-900">Event Dispatcher</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="size-2 rounded-full bg-blue-500" />
                <span className="text-blue-700 font-bold">{stats.systemHealth.backgroundQueue.activeWorkers} Active Workers</span>
              </div>
            </Card>

            <Card className="border border-slate-200/80 bg-white p-5 rounded-2xl shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Private Storage</span>
                <Server className="size-4 text-teal-600" />
              </div>
              <p className="text-lg font-black text-slate-900">Encrypted Storage</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="size-2 rounded-full bg-teal-500" />
                <span className="text-teal-700 font-bold">{stats.systemHealth.storage.provider}</span>
              </div>
            </Card>

            <Card className="border border-slate-200/80 bg-white p-5 rounded-2xl shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">WhatsApp Gateway</span>
                <MessageSquare className="size-4 text-emerald-600" />
              </div>
              <p className="text-lg font-black text-slate-900">Outbound Gateway</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span className="text-emerald-700 font-bold">{stats.systemHealth.whatsappGateway.status.toUpperCase()}</span>
              </div>
            </Card>
          </div>

          {/* Failed Jobs Section */}
          <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/75 border-b border-slate-100 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-600" />
                  Antrean Tugas Gagal (Failed Jobs Queue)
                </CardTitle>
                <CardDescription className="text-xs">
                  Daftar event background yang mengalami kendala timeout atau rejected webhook payload.
                </CardDescription>
              </div>

              {stats.failedJobs.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => stats.failedJobs.forEach((j) => handleRetryJob(j.id))}
                  disabled={isPending}
                  className="h-9 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                >
                  <RefreshCw className="size-3.5" />
                  <span>Jadwalkan Ulang Semua ({stats.failedJobs.length})</span>
                </Button>
              )}
            </CardHeader>

            <CardContent className="p-0">
              {stats.failedJobs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  <CheckCircle2 className="size-6 text-emerald-500 mx-auto mb-2" />
                  Tidak ada kegagalan background job saat ini. Semua antrean bersih.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {stats.failedJobs.map((job) => (
                    <div key={job.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{job.name}</span>
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600 font-semibold">
                            {job.queue}
                          </span>
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Percobaan ke-{job.retryCount}
                          </span>
                        </div>
                        <p className="text-rose-600 text-[11px] font-medium leading-relaxed">
                          {job.error}
                        </p>
                        <p className="text-slate-400 text-[10px]">
                          Gagal pada: {new Date(job.failedAt).toLocaleString("id-ID")}
                        </p>
                      </div>

                      <div className="shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRetryJob(job.id)}
                          disabled={isPending}
                          className="h-8 text-xs font-bold gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl"
                        >
                          <RefreshCw className="size-3" />
                          <span>Retry Job</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB 5: Audit Log Platform ───────────────────────────────── */}
      {activeTab === "audit" && (
        <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/75 border-b border-slate-100 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Aliran Log Audit Platform Global
              </CardTitle>
              <CardDescription className="text-xs">
                Seluruh rekaman mutasi finansial, perubahan kontrak, dan akses dukungan teknis di platform SaaS.
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Cari aksi / user / organisasi..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="h-10 w-full sm:w-60 pl-9 text-xs rounded-xl"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 text-xs">
              {filteredAudit.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Tidak ada catatan audit log yang cocok dengan pencarian.
                </div>
              ) : (
                filteredAudit.map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 hover:bg-slate-50/80 transition-colors gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        <Activity className="size-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-900">{log.action}</span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                            {log.entityType}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Pelaku: <span className="font-semibold text-slate-700">{log.actorName}</span> • Organisasi:{" "}
                          <span className="font-semibold text-slate-700">{log.organizationName}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-slate-400 font-mono">
                      {new Date(log.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── 360° ORGANIZATION DETAIL & SAFE SUPPORT MODAL ───────────── */}
      {selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 backdrop-blur-xs px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-teal-600" />
                <span className="text-xs font-bold text-slate-800">
                  Profil Organisasi 360° &amp; Dukungan Teknis
                </span>
              </div>
              <button
                onClick={() => setSelectedOrg(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                aria-label="Tutup"
              >
                <X className="size-4.5" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs text-slate-700">
              {/* Organization Hero Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">{selectedOrg.name}</h2>
                  <p className="font-mono text-xs text-slate-400 mt-0.5">
                    Slug: @{selectedOrg.slug || "none"} • ID: {selectedOrg.id}
                  </p>
                </div>
                <div>
                  <StatusBadge
                    variant={
                      selectedOrg.subscriptionStatus === "active"
                        ? "emerald"
                        : selectedOrg.subscriptionStatus === "trial"
                        ? "blue"
                        : "rose"
                    }
                    dot
                  >
                    {selectedOrg.subscriptionStatus === "active"
                      ? "Langganan Aktif"
                      : selectedOrg.subscriptionStatus === "trial"
                      ? "Trial 14 Hari"
                      : "Past Due"}
                  </StatusBadge>
                </div>
              </div>

              {/* Safe Support Mode Notice */}
              <div className="rounded-2xl border border-teal-200 bg-teal-50/80 p-4 space-y-2">
                <div className="flex items-center gap-2 text-teal-900 font-bold">
                  <ShieldCheck className="size-4 text-teal-700" />
                  <span>Mode Dukungan Teknis Superadmin (Read-Only Verified)</span>
                </div>
                <p className="text-[11px] text-teal-950/80 leading-relaxed">
                  Akses dukungan teknis ini terlindungi oleh protokol keamanan Kontrakin. Anda diizinkan mendiagnosis status kuota dan integritas data tanpa hak mutasi sewenang-wenang terhadap buku kas atau rekening pembayaran pelanggan. Sesi ini telah dicatat di audit log.
                </p>
              </div>

              {/* Plan & Usage Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Paket Langganan</span>
                  <p className="text-sm font-black text-slate-900 mt-0.5">{selectedOrg.plan}</p>
                  <p className="text-[11px] text-slate-500">{formatRupiah(selectedOrg.planPrice)}/bln</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Penggunaan Unit</span>
                  <p className="text-sm font-black text-slate-900 mt-0.5">
                    {selectedOrg.unitCount} / {selectedOrg.limitUnits}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Sisa {Math.max(0, selectedOrg.limitUnits - selectedOrg.unitCount)} unit kuota
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Properti Aktif</span>
                  <p className="text-sm font-black text-slate-900 mt-0.5">
                    {selectedOrg.propertyCount} / {selectedOrg.limitProperties}
                  </p>
                  <p className="text-[11px] text-slate-500">Lokasi properti</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Mulai Terdaftar</span>
                  <p className="text-sm font-black text-slate-900 mt-0.5">
                    {new Date(selectedOrg.createdAt).toLocaleDateString("id-ID", {
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-[11px] text-slate-500">Akun terverifikasi</p>
                </div>
              </div>

              {/* Team Members List */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Daftar Pengguna &amp; Tim Organisasi ({selectedOrg.teamMembers.length})
                </h3>
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden text-xs">
                  {selectedOrg.teamMembers.length === 0 ? (
                    <div className="p-3 text-slate-400 text-center">Belum ada anggota tim terdaftar.</div>
                  ) : (
                    selectedOrg.teamMembers.map((m) => (
                      <div key={m.id} className="p-3 flex justify-between items-center bg-white">
                        <div>
                          <p className="font-bold text-slate-900">{m.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{m.email}</p>
                        </div>
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                          {m.role}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Halo ${selectedOrg.ownerName}, saya dari Tim Dukungan Kontrakin terkait organisasi ${selectedOrg.name}. Ada yang bisa kami bantu?`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-700 transition"
                >
                  <MessageSquare className="size-3.5" />
                  <span>Hubungi Owner via WhatsApp</span>
                </a>

                <Button
                  variant="outline"
                  onClick={() => setSelectedOrg(null)}
                  className="w-full sm:w-auto rounded-xl text-xs font-semibold"
                >
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
