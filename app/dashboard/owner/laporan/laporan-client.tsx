"use client";

import { useMemo, useState, useTransition } from "react";
import {
  TrendingUp,
  TrendingDown,
  Download,
  Printer,
  Calendar,
  Building,
  DollarSign,
  Percent,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Search,
  Filter,
  Sparkles,
  ShieldAlert,
  Send,
  MessageSquare,
  BarChart3,
  Lightbulb,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils";
import type { PortfolioReportResult } from "./action";
import type { ExecutiveSummaryReport } from "@/lib/intelligence/portfolio-summary";

interface LaporanClientProps {
  initialReport: PortfolioReportResult;
  properties: Array<{ id: string; nama: string }>;
  initialExecutiveSummary?: ExecutiveSummaryReport;
}

export function LaporanClient({
  initialReport,
  properties,
  initialExecutiveSummary,
}: LaporanClientProps) {
  const [activeTab, setActiveTab] = useState<"financial" | "ai_advisory">("financial");
  const [report] = useState<PortfolioReportResult>(initialReport);
  const [search, setSearch] = useState<string>("");
  const [watchlistFilter, setWatchlistFilter] = useState<string>("all");

  const executiveSummary = initialExecutiveSummary;

  // Filter unit profitability
  const filteredUnits = useMemo(() => {
    const q = search.trim().toLowerCase();
    return report.unitProfitability.filter((u) => {
      if (!q) return true;
      return (
        u.nomor.toLowerCase().includes(q) ||
        u.propertiNama.toLowerCase().includes(q) ||
        (u.penghuniNama || "").toLowerCase().includes(q) ||
        u.tipe.toLowerCase().includes(q)
      );
    });
  }, [report.unitProfitability, search]);

  // Filter delinquency watchlist
  const filteredWatchlist = useMemo(() => {
    if (!executiveSummary?.delinquencyWatchlist) return [];
    if (watchlistFilter === "all") return executiveSummary.delinquencyWatchlist;
    return executiveSummary.delinquencyWatchlist.filter((t) => t.riskLevel === watchlistFilter);
  }, [executiveSummary?.delinquencyWatchlist, watchlistFilter]);

  // CSV Export
  function exportCSV() {
    const headers = [
      "Nomor Kamar",
      "Properti",
      "Tipe",
      "Penyewa",
      "Status",
      "Pendapatan (Rp)",
      "Pengeluaran (Rp)",
      "Net Kontribusi (Rp)",
    ];
    const rows = report.unitProfitability.map((u) => [
      `Kamar ${u.nomor}`,
      u.propertiNama,
      u.tipe,
      u.penghuniNama || "Kosong",
      u.status,
      u.revenue,
      u.expenses,
      u.netContribution,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Kontribusi_Unit_${report.year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handlePrint() {
    window.print();
  }

  function sendWhatsAppReminder(phone: string, tenantName: string, actionMsg: string) {
    let cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) cleanPhone = "62" + cleanPhone.slice(1);
    else if (!cleanPhone.startsWith("62")) cleanPhone = "62" + cleanPhone;

    const msg = `Halo Kak *${tenantName}*,\n\nIni pesan koordinasi berkala dari manajemen pengelola terkait tagihan sewa Anda.\n${actionMsg}\n\nTerima kasih atas kerjasamanya! 🙏`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  const profitMargin =
    report.totalRevenue > 0
      ? Math.round((report.netOperatingIncome / report.totalRevenue) * 100)
      : 0;

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Laporan Kinerja &amp; Profitabilitas Portofolio
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Analisis Net Operating Income (NOI), efisiensi penagihan sewa, dan rekomendasi intelligence operasional.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            className="gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <Download className="size-4" />
            <span>Export CSV</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <Printer className="size-4" />
            <span>Cetak Ringkasan</span>
          </Button>
        </div>
      </div>

      {/* ── Tab Switcher ────────────────────────────────────────────── */}
      <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1">
        <button
          onClick={() => setActiveTab("financial")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
            activeTab === "financial"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <BarChart3 className="size-4 text-teal-600" />
          <span>Analisis Finansial &amp; Kontribusi Unit</span>
        </button>
        <button
          onClick={() => setActiveTab("ai_advisory")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
            activeTab === "ai_advisory"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Sparkles className="size-4 text-indigo-600" />
          <span>AI Advisory &amp; Ringkasan Eksekutif</span>
          {executiveSummary?.delinquencyWatchlist && executiveSummary.delinquencyWatchlist.length > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              {executiveSummary.delinquencyWatchlist.length} dipantau
            </span>
          )}
        </button>
      </div>

      {activeTab === "financial" ? (
        <>
          {/* ── Top Portfolio KPIs ──────────────────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {/* NOI */}
            <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-600 to-teal-800 p-5 text-white shadow-sm shadow-teal-200 xl:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
                Net Operating Income (NOI)
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-white">
                {formatRupiah(report.netOperatingIncome)}
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs text-white/90">
                <span className="rounded-full bg-white/20 px-2 py-0.5 font-semibold">
                  {profitMargin}% margin
                </span>
                <span>keuntungan bersih</span>
              </div>
            </div>

            {/* Total Revenue */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Total Pendapatan</p>
              <p className="mt-2 text-2xl font-bold text-emerald-600">
                {formatRupiah(report.totalRevenue)}
              </p>
              <p className="mt-1 text-xs text-slate-400">Penerimaan sewa &amp; jasa</p>
            </div>

            {/* Total Expenses */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Beban Operasional</p>
              <p className="mt-2 text-2xl font-bold text-rose-600">
                {formatRupiah(report.totalExpenses)}
              </p>
              <p className="mt-1 text-xs text-slate-400">Listrik, air, maintenance, gaji</p>
            </div>

            {/* Collection Efficiency */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Efisiensi Koleksi</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {report.collectionRate}%
              </p>
              <p className="mt-1 text-xs text-slate-400">Rasio tagihan terbayar</p>
            </div>

            {/* Physical Occupancy */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Okupansi Fisik</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {report.physicalOccupancy}%
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {report.kamarTerisi} dari {report.totalKamar} unit terisi
              </p>
            </div>
          </div>

          {/* ── Monthly Cashflow Chart ───────────────────────────────────── */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Tren Arus Kas Bulanan ({report.year})</h2>
                <p className="text-xs text-slate-500">Perbandingan pemasukan, pengeluaran, dan margin laba bersih tiap bulan.</p>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.monthlyTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)}M`}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatRupiah(Number(val)), ""]}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                  <Bar dataKey="revenue" name="Pemasukan" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="netIncome" name="Laba Bersih (NOI)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Unit Profitability Analysis Table ────────────────────────── */}
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Analisis Margin &amp; Kontribusi per Unit Kamar</h2>
                <p className="text-xs text-slate-500">Evaluasi performa finansial setiap unit untuk mendeteksi kamar yang merugikan atau butuh penyesuaian tarif.</p>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Cari kamar / penyewa..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-52 pl-9 text-xs sm:w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Unit Kamar</th>
                    <th className="px-5 py-3.5">Properti</th>
                    <th className="px-5 py-3.5">Penyewa Aktif</th>
                    <th className="px-5 py-3.5 text-right">Pendapatan</th>
                    <th className="px-5 py-3.5 text-right">Pengeluaran</th>
                    <th className="px-5 py-3.5 text-right">Net Margin</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUnits.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                        Tidak ada unit kamar yang sesuai dengan kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredUnits.map((u) => {
                      const isNegative = u.netContribution < 0;
                      return (
                        <tr key={u.kamarId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-4 font-semibold text-slate-900">
                            Kamar {u.nomor}
                            <span className="ml-2 text-xs font-normal text-slate-400">({u.tipe})</span>
                          </td>
                          <td className="px-5 py-4 text-slate-600">{u.propertiNama}</td>
                          <td className="px-5 py-4">
                            {u.penghuniNama ? (
                              <span className="font-medium text-slate-800">{u.penghuniNama}</span>
                            ) : (
                              <span className="italic text-slate-400">Kosong</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right font-medium text-emerald-600">
                            {formatRupiah(u.revenue)}
                          </td>
                          <td className="px-5 py-4 text-right font-medium text-rose-500">
                            {formatRupiah(u.expenses)}
                          </td>
                          <td className="px-5 py-4 text-right font-bold">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                isNegative
                                  ? "bg-rose-50 text-rose-700"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {isNegative ? (
                                <TrendingDown className="size-3" />
                              ) : (
                                <TrendingUp className="size-3" />
                              )}
                              {formatRupiah(u.netContribution)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                u.status === "terisi"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : u.status === "kosong"
                                  ? "bg-slate-100 text-slate-600"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {u.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* ── AI Advisory & Executive Summary View ──────────────────────── */
        <div className="space-y-6">
          {/* Executive Headline Banner */}
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-6 text-white shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-400/30">
                    <Sparkles className="size-3 text-indigo-300" />
                    Intelligence Advisory
                  </span>
                  <span className="text-xs text-slate-400">
                    Tahun Buku {executiveSummary?.year || report.year}
                  </span>
                </div>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">
                  {executiveSummary?.headline || "Ringkasan Eksekutif Portofolio"}
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  Sintesis data operasional untuk membantu pengambilan keputusan strategis pemilik properti.
                </p>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3 backdrop-blur-sm">
                <div className="text-right">
                  <p className="text-xs text-indigo-200">Margin Operasi</p>
                  <p className="text-lg font-bold text-white">{profitMargin}%</p>
                </div>
                <div className="h-8 w-px bg-white/20" />
                <div className="text-right">
                  <p className="text-xs text-indigo-200">Koleksi Sewa</p>
                  <p className="text-lg font-bold text-white">{report.collectionRate}%</p>
                </div>
              </div>
            </div>

            {/* Highlights Grid */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {executiveSummary?.operationalHighlights.map((hl, i) => (
                <div key={i} className="flex items-start gap-2.5 rounded-xl bg-white/5 p-3.5 border border-white/10">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-400 mt-0.5" />
                  <p className="text-xs leading-relaxed text-slate-200">{hl}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Strategic Recommendations Card */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="size-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900">Rekomendasi Strategis untuk Pemilik</h3>
            </div>
            <div className="space-y-3">
              {executiveSummary?.strategicRecommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 border border-slate-100">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                    {i + 1}
                  </div>
                  <p className="text-xs leading-relaxed text-slate-700 font-medium">{rec}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Loss-Making Units Warning */}
          {executiveSummary?.lossMakingUnits && executiveSummary.lossMakingUnits.length > 0 && (
            <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-rose-800">
                <AlertTriangle className="size-5 text-rose-600" />
                <h3 className="text-sm font-bold">
                  Perhatian: {executiveSummary.lossMakingUnits.length} Unit Menghasilkan Margin Negatif
                </h3>
              </div>
              <p className="mt-1 text-xs text-rose-700">
                Unit berikut memiliki pengeluaran operasional atau perbaikan yang melebihi pendapatan sewa.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {executiveSummary.lossMakingUnits.map((u, i) => (
                  <div key={i} className="rounded-xl border border-rose-200 bg-white p-3.5 shadow-xs">
                    <p className="text-xs font-bold text-slate-900">
                      Kamar {u.nomor} ({u.propertiNama})
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Penyewa: {u.penghuniNama || "Kosong"}</p>
                    <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                      <span className="text-slate-400">Kerugian:</span>
                      <span className="font-bold text-rose-600">- {u.netLossFormatted}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delinquency Risk Watchlist */}
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="size-5 text-rose-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Watchlist Risiko Penagihan &amp; Tunggakan (Delinquency Forecasting)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pemeringkatan risiko gagal bayar berbasis ketepatan waktu pembayaran historis dan usia tunggakan aktif.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Select value={watchlistFilter} onValueChange={(val) => setWatchlistFilter(val || "all")}>
                  <SelectTrigger className="h-8 w-36 text-xs">
                    <SelectValue placeholder="Filter Risiko" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Risiko</SelectItem>
                    <SelectItem value="high">Risiko Tinggi</SelectItem>
                    <SelectItem value="medium">Risiko Sedang</SelectItem>
                    <SelectItem value="low">Risiko Rendah</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Penyewa / Kamar</th>
                    <th className="px-5 py-3.5 text-center">Skor Risiko</th>
                    <th className="px-5 py-3.5 text-right">Tunggakan Aktif</th>
                    <th className="px-5 py-3.5">Faktor Risiko Terdeteksi</th>
                    <th className="px-5 py-3.5">Rekomendasi Tindakan</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredWatchlist.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                        Tidak ada penyewa yang masuk dalam kriteria risiko terpilih. Kinerja penagihan aman!
                      </td>
                    </tr>
                  ) : (
                    filteredWatchlist.map((t) => (
                      <tr key={t.penghuniId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">{t.penghuniNama}</p>
                          <p className="text-xs text-slate-400">
                            Kamar {t.kamarNomor} • {t.propertiNama}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                              t.riskLevel === "high"
                                ? "bg-rose-100 text-rose-800"
                                : t.riskLevel === "medium"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {t.riskScore}/100 • {t.riskLevelLabel.split(" ")[0]}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-rose-600">
                          {formatRupiah(t.totalOutstanding)}
                        </td>
                        <td className="px-5 py-4">
                          <ul className="list-disc list-inside text-xs text-slate-600 space-y-0.5">
                            {t.riskFactors.map((f, idx) => (
                              <li key={idx}>{f}</li>
                            ))}
                          </ul>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-600 max-w-xs leading-relaxed">
                          {t.recommendedAction}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              sendWhatsAppReminder(t.penghuniNoHp, t.penghuniNama, t.recommendedAction)
                            }
                            className="h-8 gap-1 border-emerald-200 px-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                          >
                            <MessageSquare className="size-3.5" />
                            <span>Kirim WA</span>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
