"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Kamar, Penghuni } from "@/lib/generated/prisma/client";
import {
  Search,
  Plus,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  Receipt,
  CreditCard,
  Building2,
  User,
  Printer,
  Eye,
  History,
  Layers,
  ArrowUpRight,
  Check,
  X,
  RefreshCw,
  Wallet,
} from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/utils/export-csv";

import {
  recordManualPaymentAction,
  reconcilePaymentCreditAction,
  refundPaymentAction,
  getPaymentAuditTrailAction,
} from "./action";
import type { InvoiceItem } from "./keuangan-client";

export type PaymentItem = {
  id: string;
  organizationId: string;
  penghuniId: string;
  amount: number;
  allocatedAmount: number;
  unallocatedAmount: number;
  paymentMethod: string;
  paymentReference: string | null;
  provider: string | null;
  providerTransactionId: string | null;
  status: string; // "completed", "refunded", "pending", "failed"
  notes: string | null;
  paidAt: string;
  createdAt: string;
  updatedAt: string;
  penghuni: {
    id: string;
    nama: string;
    noHp: string;
    email: string | null;
    kamar: {
      id: string;
      nomor: string;
      properti: { id?: string; nama: string } | null;
    } | null;
  } | null;
  allocations: Array<{
    id: string;
    paymentId: string;
    invoiceId: string;
    amount: number;
    allocatedAt: string;
    invoice: {
      id: string;
      invoiceNumber: string;
      total: number;
      balanceDue: number;
      status: string;
      dueDate: string;
    } | null;
  }>;
};

interface PaymentReconciliationTabProps {
  payments: PaymentItem[];
  invoices: InvoiceItem[];
  penghuniList: Penghuni[];
  kamarList: Kamar[];
  propertiList?: Array<{ id: string; nama: string }>;
  onViewInvoice?: (invoiceId: string) => void;
}

const fmt = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

function formatRupiah(n: number) {
  return fmt.format(n);
}

function formatRupiahShort(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}K`;
  return formatRupiah(n);
}

function formatTanggal(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  transfer: "Transfer Bank",
  qris: "QRIS",
  cash: "Tunai / Kasir",
  va: "Virtual Account",
  other: "Lainnya",
};

export function PaymentReconciliationTab({
  payments,
  invoices,
  penghuniList,
  kamarList,
  propertiList = [],
  onViewInvoice,
}: PaymentReconciliationTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "full" | "credit" | "refunded">("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [datePreset, setDatePreset] = useState<"all" | "this_month" | "last_month" | "this_year">("all");
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  // Modals state
  const [manualPaymentOpen, setManualPaymentOpen] = useState(false);
  const [detailPayment, setDetailPayment] = useState<PaymentItem | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [reconcileCreditPayment, setReconcileCreditPayment] = useState<PaymentItem | null>(null);
  const [refundPaymentTarget, setRefundPaymentTarget] = useState<PaymentItem | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [printReceiptPayment, setPrintReceiptPayment] = useState<PaymentItem | null>(null);

  // ─── Filter & KPI Calculations ──────────────────────────────────────────────
  const stats = useMemo(() => {
    let totalPenerimaan = 0;
    let totalTeralokasi = 0;
    let totalSisaKredit = 0;
    let totalRefunded = 0;
    let countAdaKredit = 0;
    let countRefunded = 0;

    for (const p of payments) {
      if (p.status === "refunded") {
        totalRefunded += p.amount;
        countRefunded += 1;
      } else if (p.status === "completed") {
        totalPenerimaan += p.amount;
        totalTeralokasi += p.allocatedAmount;
        if (p.unallocatedAmount > 0) {
          totalSisaKredit += p.unallocatedAmount;
          countAdaKredit += 1;
        }
      }
    }

    return {
      totalPenerimaan,
      totalTeralokasi,
      totalSisaKredit,
      totalRefunded,
      countAdaKredit,
      countRefunded,
    };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return payments.filter((p) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const nama = p.penghuni?.nama?.toLowerCase() || "";
        const nomorKamar = p.penghuni?.kamar?.nomor?.toLowerCase() || "";
        const propertiNama = p.penghuni?.kamar?.properti?.nama?.toLowerCase() || "";
        const ref = (p.paymentReference || "").toLowerCase();
        const pid = p.id.toLowerCase();
        const invoiceNumbers = p.allocations
          .map((a) => a.invoice?.invoiceNumber.toLowerCase() || "")
          .join(" ");

        if (
          !nama.includes(q) &&
          !nomorKamar.includes(q) &&
          !propertiNama.includes(q) &&
          !ref.includes(q) &&
          !pid.includes(q) &&
          !invoiceNumbers.includes(q)
        ) {
          return false;
        }
      }

      // Status
      if (statusFilter === "full") {
        if (p.status !== "completed" || p.unallocatedAmount > 0) return false;
      } else if (statusFilter === "credit") {
        if (p.status !== "completed" || p.unallocatedAmount <= 0) return false;
      } else if (statusFilter === "refunded") {
        if (p.status !== "refunded") return false;
      }

      // Method
      if (methodFilter !== "all" && p.paymentMethod !== methodFilter) {
        return false;
      }

      // Property
      if (propertyFilter !== "all") {
        const propId = p.penghuni?.kamar?.properti?.id;
        if (propId !== propertyFilter) return false;
      }

      // Date Preset
      if (datePreset !== "all") {
        const d = new Date(p.paidAt);
        if (datePreset === "this_month") {
          if (d.getFullYear() !== currentYear || d.getMonth() !== currentMonth) return false;
        } else if (datePreset === "last_month") {
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          if (d.getFullYear() !== lastMonthYear || d.getMonth() !== lastMonth) return false;
        } else if (datePreset === "this_year") {
          if (d.getFullYear() !== currentYear) return false;
        }
      }

      return true;
    });
  }, [payments, search, statusFilter, methodFilter, propertyFilter, datePreset]);

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage) || 1;
  const paginatedPayments = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredPayments.slice(start, start + itemsPerPage);
  }, [filteredPayments, page, itemsPerPage]);

  // Load audit trail when detail opens
  const handleOpenDetail = async (payment: PaymentItem) => {
    setDetailPayment(payment);
    setLoadingAudit(true);
    try {
      const logs = await getPaymentAuditTrailAction(payment.id);
      setAuditLogs(logs);
    } catch (err) {
      console.error(err);
      setAuditLogs([]);
    } finally {
      setLoadingAudit(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "ID Pembayaran",
      "Tanggal Bayar",
      "Nama Penyewa",
      "Kamar",
      "Properti",
      "Metode Bayar",
      "No. Referensi",
      "Total Bayar (Rp)",
      "Total Teralokasi (Rp)",
      "Sisa Kredit (Rp)",
      "Status",
      "Alokasi Tagihan",
      "Catatan",
    ];

    const rows = filteredPayments.map((p) => [
      p.id,
      formatDateTime(p.paidAt),
      p.penghuni?.nama || "-",
      p.penghuni?.kamar?.nomor ? `Kamar ${p.penghuni.kamar.nomor}` : "-",
      p.penghuni?.kamar?.properti?.nama || "-",
      PAYMENT_METHOD_LABELS[p.paymentMethod] || p.paymentMethod,
      p.paymentReference || "-",
      p.amount,
      p.allocatedAmount,
      p.unallocatedAmount,
      p.status === "refunded" ? "Direfund" : p.unallocatedAmount > 0 ? "Ada Sisa Kredit" : "Lunas Penuh",
      p.allocations
        .map((a) => `${a.invoice?.invoiceNumber || "INV"}: Rp ${a.amount.toLocaleString("id-ID")}`)
        .join("; "),
      p.notes || "-",
    ]);

    exportToCSV("daftar_pembayaran_rekonsiliasi", headers, rows);
    toast.success("Daftar pembayaran berhasil diekspor ke CSV!");
  };

  // Handle Refund Confirmation
  const handleConfirmRefund = () => {
    if (!refundPaymentTarget) return;
    if (!refundReason.trim()) {
      toast.error("Alasan refund wajib diisi");
      return;
    }

    startTransition(async () => {
      try {
        const res = await refundPaymentAction(refundPaymentTarget.id, refundReason.trim());
        toast.success(
          `Pembayaran berhasil direfund. ${res.restoredInvoicesCount} tagihan dikembalikan ke saldo belum lunas.`
        );
        setRefundPaymentTarget(null);
        setRefundReason("");
        if (detailPayment?.id === refundPaymentTarget.id) {
          setDetailPayment(null);
        }
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Gagal merefund pembayaran");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* ── KPI Action Center ────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Penerimaan */}
        <div className="relative overflow-hidden rounded-2xl border border-teal-200/90 bg-teal-50/50 p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-800">
                Penerimaan Pembayaran
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-teal-950">
                {formatRupiah(stats.totalPenerimaan)}
              </p>
              <p className="mt-1 text-xs text-teal-700">
                Dana masuk berhasil dicatat &amp; diverifikasi
              </p>
            </div>
            <div className="rounded-xl bg-teal-600/10 p-2.5 text-teal-700">
              <CreditCard className="size-5" />
            </div>
          </div>
        </div>

        {/* Total Teralokasi */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200/90 bg-emerald-50/50 p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                Teralokasi ke Tagihan
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-950">
                {formatRupiah(stats.totalTeralokasi)}
              </p>
              <p className="mt-1 text-xs text-emerald-700">
                Menyelesaikan kewajiban tagihan sewa
              </p>
            </div>
            <div className="rounded-xl bg-emerald-600/10 p-2.5 text-emerald-700">
              <CheckCircle2 className="size-5" />
            </div>
          </div>
        </div>

        {/* Sisa Kredit / Overpayment */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-200/90 bg-amber-50/50 p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                Sisa Kredit / Overpayment
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-amber-950">
                {formatRupiah(stats.totalSisaKredit)}
              </p>
              <p className="mt-1 text-xs text-amber-700">
                {stats.countAdaKredit} pembayaran memiliki saldo berlebih
              </p>
            </div>
            <div className="rounded-xl bg-amber-600/10 p-2.5 text-amber-700">
              <Wallet className="size-5" />
            </div>
          </div>
        </div>

        {/* Total Direfund */}
        <div className="relative overflow-hidden rounded-2xl border border-rose-200/90 bg-rose-50/50 p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-800">
                Total Direfund
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-rose-950">
                {formatRupiah(stats.totalRefunded)}
              </p>
              <p className="mt-1 text-xs text-rose-700">
                {stats.countRefunded} transaksi pembayaran dibatalkan / reversal
              </p>
            </div>
            <div className="rounded-xl bg-rose-600/10 p-2.5 text-rose-700">
              <RotateCcw className="size-5" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Toolbar: Action buttons & Filter Pills ────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari nama penyewa, nomor kamar, referensi, ID pembayaran, atau nomor tagihan..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10 text-sm"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={() => setManualPaymentOpen(true)}
              className="bg-teal-700 hover:bg-teal-800 text-white font-medium shadow-xs"
            >
              <Plus className="mr-1.5 size-4" />
              <span>Catat Pembayaran Baru</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <Download className="mr-1.5 size-4 text-slate-500" />
              <span>Ekspor CSV</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                startTransition(() => {
                  router.refresh();
                });
              }}
              disabled={isPending}
              title="Muat ulang data"
              className="text-slate-500 hover:text-slate-800"
            >
              <RefreshCw className={`size-4 ${isPending ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Filter Pills and Dropdowns */}
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4 text-sm">
          {/* Status filter tabs */}
          <div className="flex flex-wrap items-center rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => {
                setStatusFilter("all");
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === "all"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Semua ({payments.length})
            </button>
            <button
              onClick={() => {
                setStatusFilter("full");
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === "full"
                  ? "bg-white text-teal-800 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Teralokasi Penuh
            </button>
            <button
              onClick={() => {
                setStatusFilter("credit");
                setPage(1);
              }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === "credit"
                  ? "bg-white text-amber-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Ada Sisa Kredit</span>
              {stats.countAdaKredit > 0 && (
                <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                  {stats.countAdaKredit}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setStatusFilter("refunded");
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === "refunded"
                  ? "bg-white text-rose-800 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Direfund ({stats.countRefunded})
            </button>
          </div>

          {/* Payment Method filter */}
          <Select
            value={methodFilter}
            onValueChange={(val) => {
              if (val) setMethodFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8.5 w-[140px] text-xs">
              <SelectValue placeholder="Metode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Metode</SelectItem>
              <SelectItem value="transfer">Transfer Bank</SelectItem>
              <SelectItem value="qris">QRIS</SelectItem>
              <SelectItem value="cash">Tunai / Kasir</SelectItem>
              <SelectItem value="va">Virtual Account</SelectItem>
              <SelectItem value="other">Lainnya</SelectItem>
            </SelectContent>
          </Select>

          {/* Property Filter */}
          {propertiList.length > 0 && (
            <Select
              value={propertyFilter}
              onValueChange={(val) => {
                if (val) setPropertyFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8.5 w-[150px] text-xs">
                <SelectValue placeholder="Semua Properti" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Properti</SelectItem>
                {propertiList.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Date Presets */}
          <Select
            value={datePreset}
            onValueChange={(val: any) => {
              setDatePreset(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8.5 w-[130px] text-xs">
              <SelectValue placeholder="Rentang Waktu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Waktu</SelectItem>
              <SelectItem value="this_month">Bulan Ini</SelectItem>
              <SelectItem value="last_month">Bulan Lalu</SelectItem>
              <SelectItem value="this_year">Tahun Ini</SelectItem>
            </SelectContent>
          </Select>

          {/* Active filter count clear */}
          {(search || statusFilter !== "all" || methodFilter !== "all" || propertyFilter !== "all" || datePreset !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setMethodFilter("all");
                setPropertyFilter("all");
                setDatePreset("all");
                setPage(1);
              }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* ── Payments Table ───────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-3.5">ID &amp; Metode</th>
                <th className="px-5 py-3.5">Penyewa &amp; Unit</th>
                <th className="px-5 py-3.5">Tanggal Bayar</th>
                <th className="px-5 py-3.5 text-right">Nominal Bayar</th>
                <th className="px-5 py-3.5">Alokasi Tagihan</th>
                <th className="px-5 py-3.5 text-center">Status &amp; Kredit</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <Receipt className="size-6" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-900">
                      Tidak ada data pembayaran yang cocok
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {search || statusFilter !== "all" || methodFilter !== "all"
                        ? "Coba ubah kata kunci pencarian atau sesuaikan filter Anda."
                        : "Belum ada transaksi pembayaran yang dicatat. Catat pembayaran sewa pertama Anda."}
                    </p>
                    {!search && statusFilter === "all" && (
                      <Button
                        onClick={() => setManualPaymentOpen(true)}
                        className="mt-4 bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium"
                      >
                        <Plus className="mr-1.5 size-3.5" />
                        Catat Pembayaran Baru
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((p) => {
                  const isRefunded = p.status === "refunded";
                  const hasCredit = p.unallocatedAmount > 0 && !isRefunded;

                  return (
                    <tr
                      key={p.id}
                      className="group transition-colors hover:bg-slate-50/70 cursor-pointer"
                      onClick={() => handleOpenDetail(p)}
                    >
                      {/* ID & Method */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {p.id.slice(0, 10)}...
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                            {PAYMENT_METHOD_LABELS[p.paymentMethod] || p.paymentMethod}
                          </span>
                          {p.paymentReference && (
                            <span
                              className="truncate text-[11px] text-slate-500 max-w-[120px]"
                              title={p.paymentReference}
                            >
                              Ref: {p.paymentReference}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Penyewa & Unit */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{p.penghuni?.nama || "Penyewa Umum"}</p>
                        <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                          {p.penghuni?.kamar?.nomor ? (
                            <span>
                              Kamar {p.penghuni.kamar.nomor}
                              {p.penghuni.kamar.properti?.nama && ` • ${p.penghuni.kamar.properti.nama}`}
                            </span>
                          ) : (
                            <span>Tanpa unit aktif</span>
                          )}
                        </div>
                      </td>

                      {/* Tanggal Bayar */}
                      <td className="px-5 py-4">
                        <p className="text-xs font-medium text-slate-800">{formatTanggal(p.paidAt)}</p>
                        <p className="text-[11px] text-slate-400">
                          {new Date(p.paidAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          WIB
                        </p>
                      </td>

                      {/* Nominal Bayar */}
                      <td className="px-5 py-4 text-right">
                        <p
                          className={`font-semibold ${
                            isRefunded ? "text-slate-400 line-through" : "text-slate-900"
                          }`}
                        >
                          {formatRupiah(p.amount)}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Teralokasi: {formatRupiahShort(p.allocatedAmount)}
                        </p>
                      </td>

                      {/* Alokasi Tagihan */}
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col gap-1 max-w-[220px]">
                          {p.allocations.length === 0 ? (
                            <span className="text-xs italic text-slate-400">
                              Belum dialokasikan (Deposit/Kredit)
                            </span>
                          ) : (
                            p.allocations.map((a) => (
                              <div
                                key={a.id}
                                className="flex items-center justify-between gap-2 rounded-md bg-slate-100/80 px-2 py-0.5 text-[11px]"
                              >
                                <button
                                  type="button"
                                  onClick={() => onViewInvoice?.(a.invoiceId)}
                                  className="font-mono font-medium text-teal-800 hover:underline truncate"
                                  title={`Buka tagihan ${a.invoice?.invoiceNumber}`}
                                >
                                  {a.invoice?.invoiceNumber || a.invoiceId.slice(0, 8)}
                                </button>
                                <span className="font-semibold text-slate-700 whitespace-nowrap">
                                  {formatRupiahShort(a.amount)}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </td>

                      {/* Status & Kredit */}
                      <td className="px-5 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        {isRefunded ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-800">
                            <RotateCcw className="size-3" />
                            <span>Direfund</span>
                          </span>
                        ) : hasCredit ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                              Sisa Kredit: {formatRupiahShort(p.unallocatedAmount)}
                            </span>
                            <button
                              type="button"
                              onClick={() => setReconcileCreditPayment(p)}
                              className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 hover:underline"
                            >
                              Alokasikan Kredit &rarr;
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                            <CheckCircle2 className="size-3" />
                            <span>Teralokasi Penuh</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDetail(p)}
                            className="h-8 px-2.5 text-xs text-slate-600 hover:text-slate-900"
                          >
                            <Eye className="mr-1 size-3.5" />
                            <span>Detail</span>
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button variant="ghost" size="icon" className="size-8 text-slate-500">
                                  <span className="sr-only">Menu aksi</span>
                                  <span className="text-base font-bold leading-none">⋮</span>
                                </Button>
                              }
                            />
                            <DropdownMenuContent align="end" className="w-48 text-xs">
                              <DropdownMenuItem onClick={() => handleOpenDetail(p)}>
                                <Eye className="mr-2 size-3.5" />
                                <span>Lihat Rincian &amp; Audit</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={() => setPrintReceiptPayment(p)}>
                                <Printer className="mr-2 size-3.5" />
                                <span>Cetak Kwitansi Pembayaran</span>
                              </DropdownMenuItem>

                              {hasCredit && (
                                <DropdownMenuItem onClick={() => setReconcileCreditPayment(p)}>
                                  <Wallet className="mr-2 size-3.5 text-amber-600" />
                                  <span className="font-semibold text-amber-700">
                                    Alokasikan Sisa Kredit
                                  </span>
                                </DropdownMenuItem>
                              )}

                              {!isRefunded && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setRefundPaymentTarget(p);
                                    setRefundReason("");
                                  }}
                                  className="text-rose-600 focus:text-rose-700"
                                >
                                  <RotateCcw className="mr-2 size-3.5" />
                                  <span>Refund / Reversal</span>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            <span>
              Menampilkan {(page - 1) * itemsPerPage + 1} -{" "}
              {Math.min(page * itemsPerPage, filteredPayments.length)} dari{" "}
              {filteredPayments.length} transaksi
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-7 text-xs"
              >
                Sebelumnya
              </Button>
              <span className="px-2 font-semibold text-slate-700">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-7 text-xs"
              >
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: MANUAL PAYMENT (MULTI-INVOICE SETTLEMENT)                 */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {manualPaymentOpen && (
        <ManualPaymentModal
          open={manualPaymentOpen}
          onOpenChange={setManualPaymentOpen}
          penghuniList={penghuniList}
          invoices={invoices}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: 360° PAYMENT DETAIL & AUDIT TRAIL                         */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {detailPayment && (
        <PaymentDetailModal
          payment={detailPayment}
          auditLogs={auditLogs}
          loadingAudit={loadingAudit}
          open={!!detailPayment}
          onOpenChange={(open) => !open && setDetailPayment(null)}
          onPrintReceipt={() => setPrintReceiptPayment(detailPayment)}
          onRefund={() => {
            setRefundPaymentTarget(detailPayment);
            setRefundReason("");
          }}
          onReconcileCredit={() => setReconcileCreditPayment(detailPayment)}
          onViewInvoice={onViewInvoice}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: RECONCILE CREDIT (ALOKASIKAN SISA KREDIT / OVERPAYMENT)   */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {reconcileCreditPayment && (
        <ReconcileCreditModal
          payment={reconcileCreditPayment}
          invoices={invoices}
          open={!!reconcileCreditPayment}
          onOpenChange={(open) => !open && setReconcileCreditPayment(null)}
          onSuccess={() => {
            setReconcileCreditPayment(null);
            router.refresh();
          }}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 4: REFUND / REVERSAL CONFIRMATION                            */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {refundPaymentTarget && (
        <AlertDialog open={!!refundPaymentTarget} onOpenChange={(open) => !open && setRefundPaymentTarget(null)}>
          <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <AlertDialogTitle>Konfirmasi Refund Pembayaran</AlertDialogTitle>
                  <AlertDialogDescription className="text-xs text-slate-500">
                    Tindakan ini akan mengembalikan saldo tagihan dan mencatat pengeluaran reversal.
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>

            <div className="space-y-3 py-2 text-sm">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">ID Pembayaran:</span>
                  <span className="font-mono font-bold text-slate-800">{refundPaymentTarget.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Penyewa:</span>
                  <span className="font-semibold text-slate-800">{refundPaymentTarget.penghuni?.nama}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Nominal Refund:</span>
                  <span className="font-bold text-rose-600">{formatRupiah(refundPaymentTarget.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tagihan Terkait:</span>
                  <span className="font-semibold text-slate-800">
                    {refundPaymentTarget.allocations.length} Tagihan
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800 border border-amber-200">
                <p className="font-semibold">Perhatian:</p>
                <ul className="mt-1 list-disc list-inside space-y-0.5 text-slate-700">
                  <li>Sisa tagihan yang sebelumnya terbayar akan dipulihkan (balance due bertambah).</li>
                  <li>Transaksi pengeluaran baru (Kategori: Refund Pembayaran) otomatis dibuat di buku kas agar neraca seimbang.</li>
                  <li>Tindakan ini dicatat permanen dalam audit log.</li>
                </ul>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="refund-reason" className="text-xs font-semibold">
                  Alasan Refund <span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  id="refund-reason"
                  placeholder="Contoh: Salah transfer nominal, penyewa membatalkan sewa, atau transfer ganda..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="text-xs h-20"
                />
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleConfirmRefund}
                disabled={isPending || !refundReason.trim()}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium"
              >
                {isPending ? "Memproses Refund..." : "Ya, Konfirmasi Refund"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 5: PRINTABLE RECEIPT                                         */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {printReceiptPayment && (
        <Dialog open={!!printReceiptPayment} onOpenChange={(open) => !open && setPrintReceiptPayment(null)}>
          <DialogContent className="max-w-2xl">
            <div className="p-4 print:p-0" id="payment-receipt-print-area">
              {/* Receipt Header */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-teal-700 text-white font-bold">
                      K
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">KWITANSI PEMBAYARAN</h2>
                      <p className="text-xs text-slate-500">KONTRAKIN RENTAL OPERATING SYSTEM</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs font-bold text-slate-700">
                    NO: {printReceiptPayment.id}
                  </p>
                  <p className="text-xs text-slate-500">
                    Tanggal: {formatDateTime(printReceiptPayment.paidAt)}
                  </p>
                </div>
              </div>

              {/* Payer Info */}
              <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-100 text-xs">
                <div>
                  <p className="text-slate-400 font-medium">DITERIMA DARI:</p>
                  <p className="font-bold text-slate-900 mt-1 text-sm">
                    {printReceiptPayment.penghuni?.nama || "Penyewa"}
                  </p>
                  <p className="text-slate-600">
                    Kamar: {printReceiptPayment.penghuni?.kamar?.nomor || "-"} •{" "}
                    {printReceiptPayment.penghuni?.kamar?.properti?.nama || "-"}
                  </p>
                  <p className="text-slate-500">No. HP: {printReceiptPayment.penghuni?.noHp || "-"}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 font-medium">METODE PEMBAYARAN:</p>
                  <p className="font-bold text-slate-900 mt-1">
                    {PAYMENT_METHOD_LABELS[printReceiptPayment.paymentMethod] ||
                      printReceiptPayment.paymentMethod}
                  </p>
                  {printReceiptPayment.paymentReference && (
                    <p className="text-slate-500">Ref: {printReceiptPayment.paymentReference}</p>
                  )}
                  <p className="mt-1 font-semibold text-emerald-700">STATUS: LUNAS &amp; DIVERIFIKASI</p>
                </div>
              </div>

              {/* Allocations Table */}
              <div className="py-4">
                <p className="text-xs font-bold text-slate-700 mb-2">RINCIAN ALOKASI TAGIHAN:</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-1.5 text-left">No. Tagihan</th>
                      <th className="py-1.5 text-left">Jatuh Tempo</th>
                      <th className="py-1.5 text-right">Total Tagihan</th>
                      <th className="py-1.5 text-right">Jumlah Dibayar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {printReceiptPayment.allocations.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-3 text-center text-slate-400 italic">
                          Pembayaran dicatat sebagai Saldo Kredit / Uang Muka (Belum dialokasikan).
                        </td>
                      </tr>
                    ) : (
                      printReceiptPayment.allocations.map((a) => (
                        <tr key={a.id}>
                          <td className="py-2 font-mono font-medium text-slate-800">
                            {a.invoice?.invoiceNumber || "-"}
                          </td>
                          <td className="py-2 text-slate-500">
                            {a.invoice?.dueDate ? formatTanggal(a.invoice.dueDate) : "-"}
                          </td>
                          <td className="py-2 text-right text-slate-600">
                            {a.invoice ? formatRupiah(a.invoice.total) : "-"}
                          </td>
                          <td className="py-2 text-right font-bold text-teal-800">
                            {formatRupiah(a.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Total & Summary Callout */}
              <div className="border-t border-slate-200 pt-3">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-700">TOTAL PEMBAYARAN:</span>
                  <span className="text-lg text-teal-900">{formatRupiah(printReceiptPayment.amount)}</span>
                </div>
                {printReceiptPayment.unallocatedAmount > 0 && (
                  <div className="flex justify-between items-center text-xs text-amber-700 mt-1 font-semibold">
                    <span>SISA KREDIT / SALDO LEBIH:</span>
                    <span>{formatRupiah(printReceiptPayment.unallocatedAmount)}</span>
                  </div>
                )}
              </div>

              {/* Signatures */}
              <div className="mt-8 grid grid-cols-2 gap-8 text-center text-xs text-slate-600 border-t border-slate-100 pt-4">
                <div>
                  <p>Penyewa / Pembayar,</p>
                  <div className="h-16" />
                  <p className="font-semibold text-slate-900">
                    ({printReceiptPayment.penghuni?.nama || "Penyewa"})
                  </p>
                </div>
                <div>
                  <p>Pengelola / Pemilik,</p>
                  <div className="h-16" />
                  <p className="font-semibold text-slate-900">(Manajemen Properti)</p>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-slate-100 pt-3 flex items-center justify-between">
              <Button variant="ghost" onClick={() => setPrintReceiptPayment(null)}>
                Tutup
              </Button>
              <Button
                onClick={() => window.print()}
                className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold"
              >
                <Printer className="mr-1.5 size-4" />
                Cetak Dokumen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: ManualPaymentModal (Interactive Multi-Invoice Settlement)
// ─────────────────────────────────────────────────────────────────────────────

interface ManualPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  penghuniList: Penghuni[];
  invoices: InvoiceItem[];
  onSuccess: () => void;
}

function ManualPaymentModal({
  open,
  onOpenChange,
  penghuniList,
  invoices,
  onSuccess,
}: ManualPaymentModalProps) {
  const [selectedPenghuniId, setSelectedPenghuniId] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("transfer");
  const [paymentReference, setPaymentReference] = useState("");
  const [notes, setNotes] = useState("");
  const [allocationMode, setAllocationMode] = useState<"auto" | "custom">("auto");
  const [customSplits, setCustomSplits] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter open unpaid invoices for this selected tenant
  const tenantOpenInvoices = useMemo(() => {
    if (!selectedPenghuniId) return [];
    return invoices.filter(
      (inv) =>
        inv.penghuniId === selectedPenghuniId &&
        inv.status !== "cancelled" &&
        inv.status !== "paid" &&
        inv.balanceDue > 0
    );
  }, [invoices, selectedPenghuniId]);

  const totalOwed = useMemo(() => {
    return tenantOpenInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
  }, [tenantOpenInvoices]);

  const paymentAmount = Number(amountStr) || 0;

  // Auto FIFO preview calculation
  const autoAllocationsPreview = useMemo(() => {
    let remaining = paymentAmount;
    const preview: Array<{ invoice: InvoiceItem; allocated: number; newBalance: number }> = [];

    for (const inv of tenantOpenInvoices) {
      if (remaining <= 0) {
        preview.push({ invoice: inv, allocated: 0, newBalance: inv.balanceDue });
      } else {
        const alloc = Math.min(inv.balanceDue, remaining);
        preview.push({ invoice: inv, allocated: alloc, newBalance: inv.balanceDue - alloc });
        remaining -= alloc;
      }
    }

    return {
      items: preview,
      remainingCredit: remaining,
      totalAllocated: paymentAmount - remaining,
    };
  }, [tenantOpenInvoices, paymentAmount]);

  // Custom allocation calculation
  const customAllocationsSummary = useMemo(() => {
    let totalAllocated = 0;
    const customList: Array<{ invoiceId: string; amount: number }> = [];

    for (const inv of tenantOpenInvoices) {
      const val = customSplits[inv.id] || 0;
      if (val > 0) {
        totalAllocated += val;
        customList.push({ invoiceId: inv.id, amount: val });
      }
    }

    const remainingCredit = Math.max(0, paymentAmount - totalAllocated);

    return {
      customList,
      totalAllocated,
      remainingCredit,
      isOverallocated: totalAllocated > paymentAmount,
    };
  }, [tenantOpenInvoices, customSplits, paymentAmount]);

  const handleCustomSplitChange = (invId: string, maxVal: number, valueStr: string) => {
    const num = Math.max(0, Math.min(maxVal, Number(valueStr) || 0));
    setCustomSplits((prev) => ({
      ...prev,
      [invId]: num,
    }));
  };

  const handleFillTotalOwed = () => {
    setAmountStr(String(totalOwed));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPenghuniId) {
      toast.error("Penyewa wajib dipilih");
      return;
    }
    if (paymentAmount <= 0) {
      toast.error("Nominal pembayaran harus lebih besar dari Rp 0");
      return;
    }

    if (allocationMode === "custom" && customAllocationsSummary.isOverallocated) {
      toast.error("Total alokasi custom melebihi nominal pembayaran yang diterima");
      return;
    }

    setIsSubmitting(true);
    try {
      let customAllocPayload: Array<{ invoiceId: string; amount: number }> | undefined = undefined;

      if (allocationMode === "custom") {
        customAllocPayload = customAllocationsSummary.customList;
      }

      const res = await recordManualPaymentAction({
        penghuniId: selectedPenghuniId,
        amount: paymentAmount,
        paymentMethod,
        paymentReference: paymentReference.trim() || undefined,
        notes: notes.trim() || undefined,
        customAllocations: customAllocPayload,
        allowAdvancePayment: true,
      });

      toast.success(
        res.remainingCredit > 0
          ? `Pembayaran tersimpan! Rp ${res.remainingCredit.toLocaleString("id-ID")} tersimpan sebagai kredit / overpayment.`
          : "Pembayaran berhasil dicatat dan dialokasikan ke tagihan."
      );
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Gagal mencatat pembayaran");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="size-5 text-teal-700" />
            <span>Catat Penerimaan Pembayaran</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Catat penerimaan sewa, alokasikan ke satu atau beberapa tagihan tertunggak, dan kelola
            kelebihan bayar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Tenant Selector */}
          <div className="space-y-1.5">
            <Label htmlFor="tenant-select" className="text-xs font-semibold">
              Pilih Penyewa <span className="text-rose-500">*</span>
            </Label>
            <Select
              value={selectedPenghuniId}
              onValueChange={(val) => {
                if (val) setSelectedPenghuniId(val);
                setCustomSplits({});
              }}
            >
              <SelectTrigger id="tenant-select" className="text-xs">
                <SelectValue placeholder="Pilih penyewa aktif..." />
              </SelectTrigger>
              <SelectContent>
                {penghuniList.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.nama} ({p.noHp})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tenant Outstanding Summary Banner */}
          {selectedPenghuniId && (
            <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3 text-xs flex items-center justify-between">
              <div>
                <p className="font-semibold text-teal-950">
                  Tagihan Tertunggak: {tenantOpenInvoices.length} Faktur
                </p>
                <p className="text-teal-700">
                  Total Kewajiban:{" "}
                  <span className="font-bold text-teal-900">{formatRupiah(totalOwed)}</span>
                </p>
              </div>
              {totalOwed > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFillTotalOwed}
                  className="h-7 text-xs border-teal-300 text-teal-800 hover:bg-teal-100"
                >
                  Bayar Lunas Semua
                </Button>
              )}
            </div>
          )}

          {/* Payment Amount & Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-xs font-semibold">
                Nominal Pembayaran (Rp) <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                min="1"
                placeholder="Contoh: 1500000"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="text-xs font-semibold"
                required
              />
              {paymentAmount > 0 && (
                <p className="text-[11px] text-slate-500">{formatRupiah(paymentAmount)}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="method" className="text-xs font-semibold">
                Metode Pembayaran <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={paymentMethod}
                onValueChange={(val) => {
                  if (val) setPaymentMethod(val);
                }}
              >
                <SelectTrigger id="method" className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transfer">Transfer Bank</SelectItem>
                  <SelectItem value="qris">QRIS</SelectItem>
                  <SelectItem value="cash">Tunai / Kasir</SelectItem>
                  <SelectItem value="va">Virtual Account</SelectItem>
                  <SelectItem value="other">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reference & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ref" className="text-xs font-semibold">
                No. Referensi / Bukti Transfer
              </Label>
              <Input
                id="ref"
                placeholder="Contoh: TRX-BCA-9821"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs font-semibold">
                Catatan Transaksi
              </Label>
              <Input
                id="notes"
                placeholder="Keterangan tambahan (opsional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          {/* Allocation Strategy & Preview */}
          {tenantOpenInvoices.length > 0 && (
            <div className="space-y-3 border-t border-slate-200 pt-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-semibold text-slate-900">
                    Alokasi Pembayaran ke Tagihan
                  </Label>
                  <p className="text-[11px] text-slate-500">
                    Tentukan bagaimana pembayaran disalurkan ke faktur tertunggak.
                  </p>
                </div>
                <div className="flex items-center rounded-lg bg-slate-100 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setAllocationMode("auto")}
                    className={`px-2.5 py-1 rounded-md font-semibold transition ${
                      allocationMode === "auto"
                        ? "bg-white text-teal-800 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Otomatis (FIFO)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllocationMode("custom")}
                    className={`px-2.5 py-1 rounded-md font-semibold transition ${
                      allocationMode === "custom"
                        ? "bg-white text-teal-800 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Kustom (Manual)
                  </button>
                </div>
              </div>

              {/* Invoices list preview */}
              <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="p-2.5">No. Tagihan</th>
                      <th className="p-2.5">Jatuh Tempo</th>
                      <th className="p-2.5 text-right">Sisa Tagihan</th>
                      <th className="p-2.5 text-right w-36">
                        {allocationMode === "auto" ? "Alokasi Otomatis" : "Nominal Dialokasikan"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allocationMode === "auto"
                      ? autoAllocationsPreview.items.map((item) => (
                          <tr key={item.invoice.id}>
                            <td className="p-2.5 font-mono font-medium text-slate-800">
                              {item.invoice.invoiceNumber}
                            </td>
                            <td className="p-2.5 text-slate-500">
                              {formatTanggal(item.invoice.dueDate)}
                            </td>
                            <td className="p-2.5 text-right font-medium text-slate-700">
                              {formatRupiah(item.invoice.balanceDue)}
                            </td>
                            <td className="p-2.5 text-right font-bold text-teal-800">
                              {formatRupiah(item.allocated)}
                              {item.newBalance === 0 && (
                                <span className="ml-1.5 text-[10px] text-emerald-600 font-semibold">
                                  (Lunas)
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      : tenantOpenInvoices.map((inv) => {
                          const val = customSplits[inv.id] || 0;
                          return (
                            <tr key={inv.id}>
                              <td className="p-2.5 font-mono font-medium text-slate-800">
                                {inv.invoiceNumber}
                              </td>
                              <td className="p-2.5 text-slate-500">
                                {formatTanggal(inv.dueDate)}
                              </td>
                              <td className="p-2.5 text-right font-medium text-slate-700">
                                {formatRupiah(inv.balanceDue)}
                              </td>
                              <td className="p-2 text-right">
                                <Input
                                  type="number"
                                  min="0"
                                  max={inv.balanceDue}
                                  value={val || ""}
                                  placeholder="0"
                                  onChange={(e) =>
                                    handleCustomSplitChange(inv.id, inv.balanceDue, e.target.value)
                                  }
                                  className="h-7 text-xs text-right font-semibold"
                                />
                              </td>
                            </tr>
                          );
                        })}
                  </tbody>
                </table>
              </div>

              {/* Settlement Summary Footer */}
              <div className="rounded-xl bg-slate-50 p-3 text-xs border border-slate-200 flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Nominal Pembayaran:</span>
                  <span className="font-bold text-slate-900">{formatRupiah(paymentAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Teralokasi ke Tagihan:</span>
                  <span className="font-semibold text-teal-800">
                    {formatRupiah(
                      allocationMode === "auto"
                        ? autoAllocationsPreview.totalAllocated
                        : customAllocationsSummary.totalAllocated
                    )}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200/80 pt-1 font-semibold">
                  <span className="text-amber-800">Sisa Kredit / Overpayment:</span>
                  <span className="text-amber-900 font-bold">
                    {formatRupiah(
                      allocationMode === "auto"
                        ? autoAllocationsPreview.remainingCredit
                        : customAllocationsSummary.remainingCredit
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {selectedPenghuniId && tenantOpenInvoices.length === 0 && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 text-xs text-blue-800">
              <p className="font-semibold">Tidak ada tagihan tertunggak saat ini.</p>
              <p className="mt-0.5 text-slate-600">
                Pembayaran ini akan dicatat sebagai <strong>Saldo Kredit / Uang Muka</strong> dan dapat
                dialokasikan saat tagihan baru terbit.
              </p>
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || paymentAmount <= 0 || !selectedPenghuniId}
              className="bg-teal-700 hover:bg-teal-800 text-white font-medium"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="size-3.5 animate-spin" />
                  <span>Menyimpan Pembayaran...</span>
                </span>
              ) : (
                <span>Konfirmasi Simpan Pembayaran</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: PaymentDetailModal (360° Breakdown & Audit Trail)
// ─────────────────────────────────────────────────────────────────────────────

interface PaymentDetailModalProps {
  payment: PaymentItem;
  auditLogs: any[];
  loadingAudit: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrintReceipt: () => void;
  onRefund: () => void;
  onReconcileCredit: () => void;
  onViewInvoice?: (invoiceId: string) => void;
}

function PaymentDetailModal({
  payment,
  auditLogs,
  loadingAudit,
  open,
  onOpenChange,
  onPrintReceipt,
  onRefund,
  onReconcileCredit,
  onViewInvoice,
}: PaymentDetailModalProps) {
  const isRefunded = payment.status === "refunded";
  const hasCredit = payment.unallocatedAmount > 0 && !isRefunded;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Receipt className="size-5 text-teal-700" />
              <span>Rincian Pembayaran &amp; Rekonsiliasi</span>
            </DialogTitle>
            {isRefunded ? (
              <Badge variant="destructive">Direfund / Dibatalkan</Badge>
            ) : hasCredit ? (
              <Badge className="bg-amber-100 text-amber-900 border-amber-300">
                Ada Sisa Kredit
              </Badge>
            ) : (
              <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300">
                Lunas Penuh
              </Badge>
            )}
          </div>
          <DialogDescription className="text-xs font-mono">
            ID: {payment.id} • Diterima pada {formatDateTime(payment.paidAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          {/* Payer Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-slate-400 font-medium">PENYEWA:</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {payment.penghuni?.nama || "Penyewa Umum"}
              </p>
              <p className="text-slate-600 mt-0.5">
                {payment.penghuni?.kamar?.nomor
                  ? `Kamar ${payment.penghuni.kamar.nomor} • ${payment.penghuni.kamar.properti?.nama || ""}`
                  : "Tanpa unit aktif"}
              </p>
              <p className="text-slate-500">HP: {payment.penghuni?.noHp || "-"}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 font-medium">METODE &amp; REFERENSI:</p>
              <p className="font-bold text-slate-800 mt-0.5">
                {PAYMENT_METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod}
              </p>
              {payment.paymentReference && (
                <p className="text-slate-600">Ref: {payment.paymentReference}</p>
              )}
              {payment.notes && <p className="text-slate-500 italic mt-1">&ldquo;{payment.notes}&rdquo;</p>}
            </div>
          </div>

          {/* Financial Breakdown Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Total Diterima</p>
              <p
                className={`mt-1 text-base font-bold ${
                  isRefunded ? "text-slate-400 line-through" : "text-slate-900"
                }`}
              >
                {formatRupiah(payment.amount)}
              </p>
            </div>
            <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3 text-center">
              <p className="text-[11px] font-semibold text-teal-800 uppercase">Teralokasi</p>
              <p className="mt-1 text-base font-bold text-teal-950">
                {formatRupiah(payment.allocatedAmount)}
              </p>
            </div>
            <div
              className={`rounded-xl border p-3 text-center ${
                hasCredit
                  ? "border-amber-300 bg-amber-50/70"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <p className="text-[11px] font-semibold text-slate-600 uppercase">Sisa Kredit</p>
              <p
                className={`mt-1 text-base font-bold ${
                  hasCredit ? "text-amber-900" : "text-slate-500"
                }`}
              >
                {formatRupiah(payment.unallocatedAmount)}
              </p>
            </div>
          </div>

          {/* Invoices Breakdown Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-900">
                Alokasi Faktur Tagihan ({payment.allocations.length})
              </p>
              {hasCredit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onReconcileCredit}
                  className="h-7 text-xs border-amber-300 text-amber-900 hover:bg-amber-100 font-semibold"
                >
                  <Wallet className="mr-1 size-3 text-amber-600" />
                  Alokasikan Sisa ({formatRupiahShort(payment.unallocatedAmount)})
                </Button>
              )}
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="p-2.5">No. Tagihan</th>
                    <th className="p-2.5">Jatuh Tempo</th>
                    <th className="p-2.5 text-right">Total Tagihan</th>
                    <th className="p-2.5 text-right">Alokasi Bayar</th>
                    <th className="p-2.5 text-right">Status Faktur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payment.allocations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-3 text-center text-slate-400 italic">
                        Pembayaran belum dialokasikan ke tagihan manapun.
                      </td>
                    </tr>
                  ) : (
                    payment.allocations.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/50">
                        <td className="p-2.5">
                          <button
                            type="button"
                            onClick={() => onViewInvoice?.(a.invoiceId)}
                            className="font-mono font-bold text-teal-800 hover:underline"
                          >
                            {a.invoice?.invoiceNumber || a.invoiceId}
                          </button>
                        </td>
                        <td className="p-2.5 text-slate-500">
                          {a.invoice?.dueDate ? formatTanggal(a.invoice.dueDate) : "-"}
                        </td>
                        <td className="p-2.5 text-right text-slate-600">
                          {a.invoice ? formatRupiah(a.invoice.total) : "-"}
                        </td>
                        <td className="p-2.5 text-right font-bold text-teal-800">
                          {formatRupiah(a.amount)}
                        </td>
                        <td className="p-2.5 text-right">
                          <span
                            className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                              a.invoice?.status === "paid"
                                ? "bg-emerald-100 text-emerald-800"
                                : a.invoice?.status === "partial"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {a.invoice?.status === "paid"
                              ? "Lunas"
                              : a.invoice?.status === "partial"
                              ? "Sebagian"
                              : a.invoice?.status || "-"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Audit Trail */}
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <History className="size-3.5 text-slate-500" />
              <span>Audit Trail &amp; Jejak Finansial</span>
            </div>

            {loadingAudit ? (
              <div className="p-4 text-center text-xs text-slate-400">
                <RefreshCw className="size-4 animate-spin mx-auto mb-1 text-slate-400" />
                Memuat riwayat audit...
              </div>
            ) : auditLogs.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Belum ada catatan log audit khusus untuk transaksi ini.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-xs">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-2xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-bold text-teal-800">{log.action}</span>
                      <span className="text-slate-400">{formatDateTime(log.createdAt)}</span>
                    </div>
                    <p className="text-slate-600">
                      Oleh:{" "}
                      <span className="font-medium text-slate-800">
                        {log.actorUser?.name || log.actorUser?.email || "Sistem"}
                      </span>
                    </p>
                    {log.afterData && (
                      <p className="text-[11px] font-mono text-slate-500 truncate" title={JSON.stringify(log.afterData)}>
                        Data: {JSON.stringify(log.afterData)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2">
            {!isRefunded && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onRefund}
                className="bg-rose-600 hover:bg-rose-700 text-xs font-medium"
              >
                <RotateCcw className="mr-1 size-3.5" />
                Refund / Reversal
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrintReceipt}
              className="text-xs font-medium"
            >
              <Printer className="mr-1 size-3.5" />
              Cetak Kwitansi
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs font-medium"
            >
              Tutup
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: ReconcileCreditModal (Alokasikan Sisa Kredit / Overpayment)
// ─────────────────────────────────────────────────────────────────────────────

interface ReconcileCreditModalProps {
  payment: PaymentItem;
  invoices: InvoiceItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function ReconcileCreditModal({
  payment,
  invoices,
  open,
  onOpenChange,
  onSuccess,
}: ReconcileCreditModalProps) {
  const [splits, setSplits] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Unpaid invoices for this payment's tenant
  const tenantUnpaidInvoices = useMemo(() => {
    return invoices.filter(
      (inv) =>
        inv.penghuniId === payment.penghuniId &&
        inv.status !== "cancelled" &&
        inv.status !== "paid" &&
        inv.balanceDue > 0
    );
  }, [invoices, payment.penghuniId]);

  const availableCredit = payment.unallocatedAmount;

  const totalAllocated = useMemo(() => {
    return Object.values(splits).reduce((sum, val) => sum + (val || 0), 0);
  }, [splits]);

  const remainingCreditAfter = availableCredit - totalAllocated;

  const handleSplitChange = (invId: string, maxInvoiceBalance: number, valStr: string) => {
    const num = Math.max(0, Math.min(maxInvoiceBalance, Number(valStr) || 0));
    setSplits((prev) => ({
      ...prev,
      [invId]: num,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalAllocated <= 0) {
      toast.error("Tentukan nominal yang ingin dialokasikan ke tagihan");
      return;
    }
    if (totalAllocated > availableCredit) {
      toast.error("Total alokasi melebihi sisa kredit yang tersedia");
      return;
    }

    const allocations = Object.entries(splits)
      .filter(([_, amount]) => amount > 0)
      .map(([invoiceId, amount]) => ({ invoiceId, amount }));

    setIsSubmitting(true);
    try {
      await reconcilePaymentCreditAction({
        paymentId: payment.id,
        allocations,
      });

      toast.success("Sisa kredit berhasil dialokasikan ke tagihan!");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Gagal mengalokasikan kredit");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Wallet className="size-5 text-amber-700" />
            <span>Alokasikan Sisa Kredit / Overpayment</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Gunakan saldo kredit dari pembayaran ini untuk melunasi tagihan tertunggak milik{" "}
            <strong>{payment.penghuni?.nama}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Credit balance banner */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs flex justify-between items-center">
            <div>
              <p className="text-slate-500 font-medium">Sisa Kredit Tersedia:</p>
              <p className="text-lg font-bold text-amber-950 mt-0.5">
                {formatRupiah(availableCredit)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 font-medium">Sisa Setelah Alokasi:</p>
              <p
                className={`text-sm font-bold mt-0.5 ${
                  remainingCreditAfter < 0 ? "text-rose-600" : "text-slate-800"
                }`}
              >
                {formatRupiah(remainingCreditAfter)}
              </p>
            </div>
          </div>

          {/* Invoices list */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Pilih Tagihan Tertunggak</Label>

            {tenantUnpaidInvoices.length === 0 ? (
              <div className="rounded-xl border border-slate-200 p-6 text-center text-xs text-slate-500">
                Penyewa ini tidak memiliki tagihan tertunggak saat ini. Sisa kredit akan tetap
                tersimpan untuk tagihan bulan depan.
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="p-2.5">No. Tagihan</th>
                      <th className="p-2.5">Jatuh Tempo</th>
                      <th className="p-2.5 text-right">Sisa Tagihan</th>
                      <th className="p-2.5 text-right w-36">Alokasikan (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tenantUnpaidInvoices.map((inv) => {
                      const val = splits[inv.id] || 0;
                      return (
                        <tr key={inv.id}>
                          <td className="p-2.5 font-mono font-medium text-slate-800">
                            {inv.invoiceNumber}
                          </td>
                          <td className="p-2.5 text-slate-500">{formatTanggal(inv.dueDate)}</td>
                          <td className="p-2.5 text-right font-medium text-slate-700">
                            {formatRupiah(inv.balanceDue)}
                          </td>
                          <td className="p-2 text-right">
                            <Input
                              type="number"
                              min="0"
                              max={Math.min(inv.balanceDue, availableCredit)}
                              value={val || ""}
                              placeholder="0"
                              onChange={(e) =>
                                handleSplitChange(inv.id, inv.balanceDue, e.target.value)
                              }
                              className="h-7 text-xs text-right font-semibold"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                totalAllocated <= 0 ||
                totalAllocated > availableCredit ||
                tenantUnpaidInvoices.length === 0
              }
              className="bg-teal-700 hover:bg-teal-800 text-white font-medium"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="size-3.5 animate-spin" />
                  <span>Mengalokasikan...</span>
                </span>
              ) : (
                <span>Terapkan Alokasi Kredit</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
