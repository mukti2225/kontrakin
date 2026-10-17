"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Kamar, Penghuni, Transaksi } from "@/lib/generated/prisma/client";
import {
  Search,
  Plus,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  Bell,
  MoreVertical,
  FileText,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Receipt,
  CreditCard,
  Sparkles,
  RefreshCw,
  Layers,
  ArrowUpRight,
  Printer,
  X,
  Send,
  CalendarDays,
  Building2,
  User,
  Copy,
  Check,
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
  createTransaksi,
  updateTransaksi,
  deleteTransaksi,
  generateInvoicesAction,
  recordInvoicePaymentAction,
  cancelInvoiceAction,
  createManualInvoiceAction,
  type TransaksiInput,
  type CreateManualInvoiceInput,
} from "./action";
import { PaymentReconciliationTab, type PaymentItem } from "./payment-reconciliation-tab";
import {
  ExpenseManagementTab,
  type VendorSimple,
  type PemeliharaanSimple,
} from "./expense-management-tab";

// ─── Types ────────────────────────────────────────────────────────────────────

type TransaksiDenganRelasi = Transaksi & { kamar: Kamar | null; penghuni: Penghuni | null };
type Jenis = "pemasukan" | "pengeluaran";

export type InvoiceItem = {
  id: string;
  organizationId: string;
  penghuniId: string;
  leaseId: string | null;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  penaltyTotal: number;
  total: number;
  balanceDue: number;
  status: string;
  currency: string;
  notes: string | null;
  penghuni: { id: string; nama: string; noHp: string; email?: string | null } | null;
  lease: {
    id?: string;
    nomorKontrak?: string | null;
    billingFrequency?: string;
    startDate?: string;
    endDate?: string;
    kamar: {
      id: string;
      nomor: string;
      properti: { id?: string; nama: string } | null;
    } | null;
  } | null;
  lines: Array<{
    id: string;
    type: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  allocations: Array<{
    id: string;
    amount: number;
    allocatedAt: string;
    payment: {
      id: string;
      paymentMethod: string;
      paymentReference: string | null;
      paidAt: string;
    } | null;
  }>;
};

const KATEGORI_PEMASUKAN = ["Sewa Kamar", "Deposit", "Lainnya"];
const KATEGORI_PENGELUARAN = ["Listrik", "Air", "Internet", "Gaji", "Perawatan", "Lainnya"];

interface FormState {
  jenis: Jenis;
  kategori: string;
  jumlah: string;
  tanggal: string;
  keterangan: string;
  kamarId: string;
  penghuniId: string;
}

interface FormErrors {
  kategori?: string;
  jumlah?: string;
  tanggal?: string;
}

function formKosong(): FormState {
  return {
    jenis: "pemasukan",
    kategori: "",
    jumlah: "",
    tanggal: new Date().toISOString().slice(0, 10),
    keterangan: "",
    kamarId: "",
    penghuniId: "",
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function formatTanggal(date: Date | string) {
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, "0")} ${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface KeuanganClientProps {
  transaksi: TransaksiDenganRelasi[];
  kamarList: Kamar[];
  penghuniList: Penghuni[];
  initialInvoices?: InvoiceItem[];
  propertiList?: Array<{ id: string; nama: string }>;
  initialPayments?: PaymentItem[];
  vendorList?: VendorSimple[];
  pemeliharaanList?: PemeliharaanSimple[];
}

const PAGE_SIZE = 10;

// ─── Main component ───────────────────────────────────────────────────────────

export function KeuanganClient({
  transaksi,
  kamarList,
  penghuniList,
  initialInvoices = [],
  propertiList = [],
  initialPayments = [],
  vendorList = [],
  pemeliharaanList = [],
}: KeuanganClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const initialTab =
    tabParam === "cashbook" ? "cashbook" : tabParam === "payments" ? "payments" : "invoices";
  const [activeTab, setActiveTab] = useState<"invoices" | "payments" | "cashbook">(initialTab);

  const paymentsWithCreditCount = useMemo(() => {
    return initialPayments.filter((p) => p.status === "completed" && p.unallocatedAmount > 0)
      .length;
  }, [initialPayments]);

  const [invoices, setInvoices] = useState<InvoiceItem[]>(initialInvoices);
  const [list, setList] = useState<TransaksiDenganRelasi[]>(transaksi);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  // ── Invoice Filters State ─────────────────────────────────────────────────
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>(
    searchParams.get("filter") === "overdue" ? "overdue" : "all"
  );
  const [invoicePropertyFilter, setInvoicePropertyFilter] = useState<string>("all");
  const [invoiceDatePreset, setInvoiceDatePreset] = useState<string>("all");
  const [invoiceDateStart, setInvoiceDateStart] = useState<string>("");
  const [invoiceDateEnd, setInvoiceDateEnd] = useState<string>("");

  // Dialog states for Cashbook
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(formKosong());
  const [errors, setErrors] = useState<FormErrors>({});
  const [deleteTarget, setDeleteTarget] = useState<TransaksiDenganRelasi | null>(null);

  // Dialog states for Invoices
  const [detailInvoice, setDetailInvoice] = useState<InvoiceItem | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<InvoiceItem | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("transfer");
  const [paymentReference, setPaymentReference] = useState<string>("");

  // Modals for Cancellation, Bulk Reminders, Manual Invoice, and Printable Receipt
  const [cancelInvoiceTarget, setCancelInvoiceTarget] = useState<InvoiceItem | null>(null);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [receiptInvoice, setReceiptInvoice] = useState<InvoiceItem | null>(null);
  const [bulkReminderOpen, setBulkReminderOpen] = useState<boolean>(false);
  const [manualInvoiceOpen, setManualInvoiceOpen] = useState<boolean>(false);

  // Manual Invoice Form State
  const [manualInvoiceTenantId, setManualInvoiceTenantId] = useState<string>("");
  const [manualInvoiceDueDate, setManualInvoiceDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [manualInvoiceNotes, setManualInvoiceNotes] = useState<string>("");
  const [manualInvoiceLines, setManualInvoiceLines] = useState<
    Array<{ type: string; description: string; quantity: number; unitPrice: number }>
  >([{ type: "rent", description: "Sewa Kamar", quantity: 1, unitPrice: 0 }]);

  // ── Date Info ─────────────────────────────────────────────────────────────
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const periodeLabel = `${MONTH_NAMES[currentMonth]} ${currentYear}`;

  // ── Invoice Stats ─────────────────────────────────────────────────────────
  const invoiceStats = useMemo(() => {
    let totalTertunggak = 0;
    let countTertunggak = 0;
    let totalOutstandingAktif = 0;
    let countUnpaid = 0;
    let totalDitagihkanBulanIni = 0;
    let totalTerbayarBulanIni = 0;
    let countLunas = 0;

    let countAll = invoices.length;
    let countOverdue = 0;
    let countPartial = 0;
    let countPaid = 0;
    let countDraft = 0;
    let countCancelled = 0;

    for (const inv of invoices) {
      const invDueDate = new Date(inv.dueDate);
      const isOverdue = invDueDate < now && inv.balanceDue > 0;

      if (inv.status === "cancelled") {
        countCancelled++;
        continue;
      }

      if (inv.status === "draft") {
        countDraft++;
      } else if (inv.balanceDue === 0) {
        countPaid++;
      } else if (inv.balanceDue < inv.total) {
        countPartial++;
      }

      if (isOverdue || inv.status === "overdue") {
        totalTertunggak += inv.balanceDue;
        countTertunggak++;
        countOverdue++;
      }

      if (inv.balanceDue > 0) {
        totalOutstandingAktif += inv.balanceDue;
        countUnpaid++;
      }

      if (invDueDate.getMonth() === currentMonth && invDueDate.getFullYear() === currentYear) {
        totalDitagihkanBulanIni += inv.total;
        totalTerbayarBulanIni += inv.total - inv.balanceDue;
        if (inv.balanceDue === 0) countLunas++;
      }
    }

    const collectionRate =
      totalDitagihkanBulanIni > 0
        ? Math.round((totalTerbayarBulanIni / totalDitagihkanBulanIni) * 100)
        : 100;

    return {
      totalTertunggak,
      countTertunggak,
      totalOutstandingAktif,
      countUnpaid,
      totalDitagihkanBulanIni,
      totalTerbayarBulanIni,
      countLunas,
      totalInvoices: invoices.length,
      collectionRate,
      counts: {
        all: countAll,
        overdue: countOverdue,
        unpaid: countUnpaid,
        partial: countPartial,
        paid: countPaid,
        draft: countDraft,
        cancelled: countCancelled,
      },
    };
  }, [invoices, currentMonth, currentYear, now]);

  // Overdue Invoices List (for Bulk Reminders)
  const overdueInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const isOverdue = new Date(inv.dueDate) < now && inv.balanceDue > 0;
      return (isOverdue || inv.status === "overdue") && inv.status !== "cancelled";
    });
  }, [invoices, now]);

  // ── Cashbook Stats ────────────────────────────────────────────────────────
  const isThisMonth = (d: Date | string) => {
    const date = new Date(d);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  };

  const cashbookStats = useMemo(() => {
    const thisMonth = list.filter((t) => isThisMonth(t.tanggal));
    const pemasukan = thisMonth
      .filter((t) => t.jenis === "pemasukan")
      .reduce((s, t) => s + t.jumlah, 0);
    const pengeluaran = thisMonth
      .filter((t) => t.jenis === "pengeluaran")
      .reduce((s, t) => s + t.jumlah, 0);
    const saldo = pemasukan - pengeluaran;

    return { pemasukan, pengeluaran, saldo, totalTransaksi: thisMonth.length };
  }, [list, currentMonth, currentYear]);

  // ── Filtered Invoices ─────────────────────────────────────────────────────
  const filteredInvoices = useMemo(() => {
    const q = invoiceSearch.trim().toLowerCase();
    return invoices.filter((inv) => {
      const dueDate = new Date(inv.dueDate);
      const isOverdue = dueDate < now && inv.balanceDue > 0;

      // Status filter
      if (invoiceStatusFilter === "overdue") {
        if (!isOverdue && inv.status !== "overdue") return false;
        if (inv.status === "cancelled") return false;
      } else if (invoiceStatusFilter === "unpaid") {
        if (inv.balanceDue <= 0 || inv.status === "cancelled") return false;
      } else if (invoiceStatusFilter === "partial") {
        if (inv.balanceDue <= 0 || inv.balanceDue >= inv.total || inv.status === "cancelled") return false;
      } else if (invoiceStatusFilter === "paid") {
        if (inv.balanceDue > 0 || inv.status === "cancelled") return false;
      } else if (invoiceStatusFilter === "draft") {
        if (inv.status !== "draft") return false;
      } else if (invoiceStatusFilter === "cancelled") {
        if (inv.status !== "cancelled") return false;
      }

      // Property filter
      if (invoicePropertyFilter !== "all") {
        const propId = inv.lease?.kamar?.properti?.id;
        const propName = inv.lease?.kamar?.properti?.nama;
        if (propId !== invoicePropertyFilter && propName !== invoicePropertyFilter) {
          return false;
        }
      }

      // Date range preset filter
      if (invoiceDatePreset === "this_month") {
        if (dueDate.getMonth() !== currentMonth || dueDate.getFullYear() !== currentYear) return false;
      } else if (invoiceDatePreset === "last_month") {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        if (dueDate.getMonth() !== lastMonth || dueDate.getFullYear() !== lastMonthYear) return false;
      } else if (invoiceDatePreset === "this_year") {
        if (dueDate.getFullYear() !== currentYear) return false;
      } else if (invoiceDatePreset === "custom") {
        if (invoiceDateStart && new Date(inv.dueDate) < new Date(invoiceDateStart)) return false;
        if (invoiceDateEnd && new Date(inv.dueDate) > new Date(invoiceDateEnd + "T23:59:59")) return false;
      }

      // Search query (inv number, tenant name, phone, room, property)
      if (!q) return true;
      const tenantName = inv.penghuni?.nama?.toLowerCase() || "";
      const tenantPhone = inv.penghuni?.noHp?.toLowerCase() || "";
      const invNum = inv.invoiceNumber.toLowerCase();
      const roomNum = inv.lease?.kamar?.nomor?.toLowerCase() || "";
      const propName = inv.lease?.kamar?.properti?.nama?.toLowerCase() || "";
      return (
        tenantName.includes(q) ||
        tenantPhone.includes(q) ||
        invNum.includes(q) ||
        roomNum.includes(q) ||
        propName.includes(q)
      );
    });
  }, [
    invoices,
    invoiceSearch,
    invoiceStatusFilter,
    invoicePropertyFilter,
    invoiceDatePreset,
    invoiceDateStart,
    invoiceDateEnd,
    now,
    currentMonth,
    currentYear,
  ]);

  // ── Filtered Cashbook ─────────────────────────────────────────────────────
  const filteredCashbook = useMemo(() => {
    const kata = search.trim().toLowerCase();
    return list
      .filter((t) => {
        if (!kata) return true;
        return (
          (t.penghuni?.nama ?? "").toLowerCase().includes(kata) ||
          (t.kamar?.nomor ?? "").toLowerCase().includes(kata) ||
          t.kategori.toLowerCase().includes(kata)
        );
      })
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [list, search]);

  const totalPages = Math.max(1, Math.ceil(filteredCashbook.length / PAGE_SIZE));
  const paginatedCashbook = filteredCashbook.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Recurring Invoice Generation Handler ──────────────────────────────────
  function handleGenerateInvoices() {
    startTransition(async () => {
      try {
        const result = await generateInvoicesAction();
        toast.success(
          `Selesai: ${result.generatedCount} tagihan baru dibuat (${result.skippedCount} sudah ada untuk periode ini).`
        );
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Gagal generate tagihan otomatis");
      }
    });
  }

  // ── CSV Export Handlers ───────────────────────────────────────────────────
  function handleExportInvoicesCSV() {
    if (filteredInvoices.length === 0) {
      toast.error("Tidak ada data tagihan yang sesuai filter untuk diekspor");
      return;
    }

    const headers = [
      "No. Tagihan",
      "Penyewa",
      "No. HP",
      "Kamar",
      "Properti",
      "Tanggal Terbit",
      "Jatuh Tempo",
      "Total Tagihan (IDR)",
      "Sudah Dibayar (IDR)",
      "Sisa Tagihan (IDR)",
      "Status Tagihan",
    ];

    const rows = filteredInvoices.map((inv) => {
      const amountPaid = Math.max(0, inv.total - inv.balanceDue);
      return [
        inv.invoiceNumber,
        inv.penghuni?.nama || "-",
        inv.penghuni?.noHp || "-",
        inv.lease?.kamar?.nomor ? `Kamar ${inv.lease.kamar.nomor}` : "-",
        inv.lease?.kamar?.properti?.nama || "-",
        new Date(inv.issueDate).toLocaleDateString("id-ID"),
        new Date(inv.dueDate).toLocaleDateString("id-ID"),
        inv.total,
        amountPaid,
        inv.balanceDue,
        inv.balanceDue <= 0 ? "LUNAS" : new Date(inv.dueDate) < now ? "TERTUNGGAK" : "BELUM LUNAS",
      ];
    });

    exportToCSV("daftar_tagihan_sewa", headers, rows);
    toast.success("Berhasil mengekspor rekapan tagihan ke file CSV");
  }

  function handleExportCashbookCSV() {
    if (filteredCashbook.length === 0) {
      toast.error("Tidak ada data transaksi kas yang sesuai filter untuk diekspor");
      return;
    }

    const headers = [
      "Tanggal",
      "Jenis",
      "Kategori",
      "Keterangan",
      "Kamar",
      "Penyewa",
      "Jumlah (IDR)",
    ];

    const rows = filteredCashbook.map((t) => [
      new Date(t.tanggal).toLocaleDateString("id-ID"),
      t.jenis.toUpperCase(),
      t.kategori,
      t.keterangan || "-",
      t.kamar?.nomor ? `Kamar ${t.kamar.nomor}` : "-",
      t.penghuni?.nama || "-",
      t.jumlah,
    ]);

    exportToCSV("buku_kas_transaksi", headers, rows);
    toast.success("Berhasil mengekspor buku kas ke file CSV");
  }

  // ── Payment Allocation Handler ───────────────────────────────────────────
  function openRecordPayment(inv: InvoiceItem) {
    setPaymentInvoice(inv);
    setPaymentAmount(inv.balanceDue);
    setPaymentMethod("transfer");
    setPaymentReference("");
  }

  function handleSavePayment() {
    if (!paymentInvoice) return;
    if (paymentAmount <= 0) {
      toast.error("Nominal pembayaran harus lebih besar dari Rp 0");
      return;
    }
    if (paymentAmount > paymentInvoice.balanceDue) {
      toast.error("Nominal pembayaran melebihi sisa tagihan");
      return;
    }

    startTransition(async () => {
      try {
        await recordInvoicePaymentAction({
          invoiceId: paymentInvoice.id,
          penghuniId: paymentInvoice.penghuniId,
          amount: paymentAmount,
          paymentMethod,
          paymentReference: paymentReference.trim() || undefined,
        });

        // Optimistically update invoice state
        setInvoices((prev) =>
          prev.map((inv) => {
            if (inv.id !== paymentInvoice.id) return inv;
            const newBal = inv.balanceDue - paymentAmount;
            return {
              ...inv,
              balanceDue: newBal,
              status: newBal === 0 ? "paid" : "partial",
            };
          })
        );

        toast.success("Pembayaran berhasil dicatat dan dialokasikan!");
        setPaymentInvoice(null);
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Gagal mencatat pembayaran");
      }
    });
  }

  // ── Invoice Actions & Handlers ────────────────────────────────────────────
  function sendWhatsAppReminder(inv: InvoiceItem) {
    if (!inv.penghuni?.noHp) {
      toast.error("Nomor HP penyewa belum tercatat");
      return;
    }
    const dueDateObj = new Date(inv.dueDate);
    const dueDateFormatted = `${dueDateObj.getDate()}/${dueDateObj.getMonth() + 1}/${dueDateObj.getFullYear()}`;
    const isPast = dueDateObj < now;
    const diffDays = Math.max(1, Math.ceil((now.getTime() - dueDateObj.getTime()) / (1000 * 60 * 60 * 24)));
    const msg = isPast
      ? `⚠️ *Pemberitahuan Tunggakan Sewa*\n\nHalo Kak *${inv.penghuni.nama}*,\nKami menginformasikan bahwa tagihan sewa Kamar *${inv.lease?.kamar?.nomor || "-"}* (${inv.lease?.kamar?.properti?.nama || "Kost"}) sebesar *${formatRupiah(inv.balanceDue)}* telah melewati jatuh tempo (${dueDateFormatted}, terlambat *${diffDays} hari*).\n\nMohon bantuannya untuk melakukan pelunasan sesegera mungkin ya agar pencatatan sewa tetap lancar. Apabila sudah transfer, mohon kirimkan buktinya. Terima kasih! 🙏`
      : `Halo Kak *${inv.penghuni.nama}*,\n\nIni pengingat ramah tagihan sewa Kamar *${inv.lease?.kamar?.nomor || "-"}* sebesar *${formatRupiah(inv.balanceDue)}* yang jatuh tempo pada *${dueDateFormatted}*.\n\nMohon lakukan pembayaran tepat waktu ya. Terima kasih! 🙏`;

    let cleanPhone = inv.penghuni.noHp.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) cleanPhone = "62" + cleanPhone.slice(1);
    else if (!cleanPhone.startsWith("62")) cleanPhone = "62" + cleanPhone;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
    toast.success("WhatsApp dibuka untuk penyewa!");
  }

  function copyOverdueBroadcastList() {
    if (overdueInvoices.length === 0) {
      toast.error("Tidak ada tagihan tertunggak");
      return;
    }
    let text = `📋 *REKAPITULASI TAGIHAN SEWA TERTUNGGAK*\nPer Tanggal: ${formatTanggal(new Date())}\nTotal Tertunggak: ${formatRupiah(invoiceStats.totalTertunggak)} (${invoiceStats.countTertunggak} Tagihan)\n\n`;
    overdueInvoices.forEach((inv, i) => {
      const diffDays = Math.max(1, Math.ceil((now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24)));
      text += `${i + 1}. *${inv.penghuni?.nama || "Penyewa"}* (Kamar ${inv.lease?.kamar?.nomor || "-"} - ${inv.lease?.kamar?.properti?.nama || "Properti"})\n   • No. Tagihan: ${inv.invoiceNumber}\n   • Nominal: *${formatRupiah(inv.balanceDue)}*\n   • Terlambat: ${diffDays} hari (Jatuh Tempo: ${formatTanggal(inv.dueDate)})\n   • No. HP: ${inv.penghuni?.noHp || "-"}\n\n`;
    });
    navigator.clipboard.writeText(text);
    toast.success("Daftar tagihan tertunggak berhasil disalin ke clipboard!");
  }

  function handleCancelInvoice() {
    if (!cancelInvoiceTarget) return;
    startTransition(async () => {
      try {
        await cancelInvoiceAction(cancelInvoiceTarget.id, cancelReason);
        setInvoices((prev) =>
          prev.map((inv) =>
            inv.id === cancelInvoiceTarget.id
              ? {
                  ...inv,
                  status: "cancelled",
                  balanceDue: 0,
                  notes: cancelReason ? `[Dibatalkan: ${cancelReason}]` : "[Dibatalkan oleh pemilik]",
                }
              : inv
          )
        );
        if (detailInvoice?.id === cancelInvoiceTarget.id) {
          setDetailInvoice((prev) =>
            prev ? { ...prev, status: "cancelled", balanceDue: 0 } : null
          );
        }
        toast.success(`Tagihan ${cancelInvoiceTarget.invoiceNumber} berhasil dibatalkan.`);
        setCancelInvoiceTarget(null);
        setCancelReason("");
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Gagal membatalkan tagihan");
      }
    });
  }

  function handleCreateManualInvoice() {
    if (!manualInvoiceTenantId) {
      toast.error("Pilih penyewa terlebih dahulu");
      return;
    }
    if (!manualInvoiceDueDate) {
      toast.error("Tentukan tanggal jatuh tempo");
      return;
    }
    if (manualInvoiceLines.length === 0) {
      toast.error("Minimal harus ada satu baris rincian tagihan");
      return;
    }
    for (const l of manualInvoiceLines) {
      if (!l.description.trim()) {
        toast.error("Deskripsi komponen biaya tidak boleh kosong");
        return;
      }
      if (l.unitPrice <= 0) {
        toast.error("Tarif biaya harus lebih besar dari Rp 0");
        return;
      }
    }

    startTransition(async () => {
      try {
        await createManualInvoiceAction({
          penghuniId: manualInvoiceTenantId,
          dueDate: manualInvoiceDueDate,
          notes: manualInvoiceNotes.trim() || undefined,
          lines: manualInvoiceLines.map((l) => ({
            type: l.type,
            description: l.description.trim(),
            quantity: Number(l.quantity) || 1,
            unitPrice: Number(l.unitPrice),
          })),
        });

        toast.success("Tagihan baru berhasil diterbitkan!");
        setManualInvoiceOpen(false);
        setManualInvoiceTenantId("");
        setManualInvoiceNotes("");
        setManualInvoiceLines([{ type: "rent", description: "Sewa Kamar", quantity: 1, unitPrice: 0 }]);
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Gagal menerbitkan tagihan");
      }
    });
  }

  function addManualLine() {
    setManualInvoiceLines((prev) => [
      ...prev,
      { type: "other", description: "", quantity: 1, unitPrice: 0 },
    ]);
  }

  function removeManualLine(index: number) {
    if (manualInvoiceLines.length <= 1) return;
    setManualInvoiceLines((prev) => prev.filter((_, i) => i !== index));
  }

  function updateManualLine(index: number, field: string, val: any) {
    setManualInvoiceLines((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item))
    );
  }

  // ── Cashbook CRUD Handlers ────────────────────────────────────────────────
  function bukaTambah() {
    setEditingId(null);
    setForm(formKosong());
    setErrors({});
    setFormOpen(true);
  }

  function bukaEdit(t: TransaksiDenganRelasi) {
    setEditingId(t.id);
    setForm({
      jenis: t.jenis as Jenis,
      kategori: t.kategori,
      jumlah: String(t.jumlah),
      tanggal: new Date(t.tanggal).toISOString().slice(0, 10),
      keterangan: t.keterangan ?? "",
      kamarId: t.kamarId ?? "",
      penghuniId: t.penghuniId ?? "",
    });
    setErrors({});
    setFormOpen(true);
  }

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!form.kategori.trim()) e.kategori = "Kategori wajib diisi";
    const angka = Number(form.jumlah);
    if (!form.jumlah || Number.isNaN(angka) || angka <= 0) e.jumlah = "Jumlah harus lebih dari 0";
    if (!form.tanggal) e.tanggal = "Tanggal wajib diisi";
    return e;
  }

  function submitTransaksi() {
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) {
      toast.error("Lengkapi dulu field yang wajib diisi");
      return;
    }

    const payload: TransaksiInput = {
      jenis: form.jenis,
      kategori: form.kategori.trim(),
      jumlah: Number(form.jumlah),
      tanggal: form.tanggal,
      keterangan: form.keterangan.trim() || undefined,
      kamarId: form.kamarId || undefined,
      penghuniId: form.penghuniId || undefined,
    };

    startTransition(async () => {
      try {
        if (editingId) {
          const updated = await updateTransaksi(editingId, payload);
          setList((prev) => prev.map((t) => (t.id === editingId ? updated : t)));
          toast.success("Transaksi berhasil diperbarui");
        } else {
          const created = await createTransaksi(payload);
          setList((prev) => [created, ...prev]);
          toast.success("Transaksi berhasil dicatat");
        }
        setFormOpen(false);
      } catch {
        toast.error("Gagal menyimpan transaksi");
      }
    });
  }

  function konfirmasiHapus() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      try {
        await deleteTransaksi(target.id);
        setList((prev) => prev.filter((t) => t.id !== target.id));
        toast.success("Transaksi berhasil dihapus");
      } catch {
        toast.error("Gagal menghapus transaksi");
      } finally {
        setDeleteTarget(null);
      }
    });
  }

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manajemen Keuangan</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola penagihan sewa, rekonsiliasi pembayaran, dan buku kas operasional.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center rounded-xl bg-slate-200/70 p-1">
          <button
            onClick={() => setActiveTab("invoices")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === "invoices"
                ? "bg-white text-teal-800 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Receipt className="size-4" />
            <span>Tagihan Sewa</span>
            {invoiceStats.countTertunggak > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {invoiceStats.countTertunggak}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === "payments"
                ? "bg-white text-teal-800 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CreditCard className="size-4" />
            <span>Pembayaran &amp; Rekonsiliasi</span>
            {paymentsWithCreditCount > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                {paymentsWithCreditCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("cashbook")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === "cashbook"
                ? "bg-white text-teal-800 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="size-4" />
            <span>Pengeluaran &amp; Buku Kas</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB 1: TAGIHAN SEWA (INVOICES & BILLING)                      */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === "invoices" && (
        <div className="space-y-6">
          {/* ── KPI Cards ────────────────────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* Total Tertunggak */}
            <div className="relative overflow-hidden rounded-2xl border border-rose-200/90 bg-rose-50/50 p-5 shadow-xs">
              <div className="flex items-start justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-rose-800">Total Tertunggak</p>
                <div className="flex size-7 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                  <AlertTriangle className="size-4" />
                </div>
              </div>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                {formatRupiah(invoiceStats.totalTertunggak)}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-700">
                <span className="rounded-full bg-rose-200/80 px-2 py-0.5 font-bold">
                  {invoiceStats.countTertunggak} tagihan
                </span>
                <span>melewati jatuh tempo</span>
              </div>
            </div>

            {/* Sisa Tagihan Aktif (Total Outstanding) */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-slate-500">Sisa Tagihan Aktif</p>
                <CreditCard className="size-5 text-amber-600" />
              </div>
              <p className="mt-2 text-3xl font-bold text-slate-900 tabular-nums">
                {formatRupiah(invoiceStats.totalOutstandingAktif)}
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                <span className="font-semibold text-amber-600">
                  {invoiceStats.countUnpaid} tagihan
                </span>
                <span>belum lunas secara total</span>
              </div>
            </div>

            {/* Ditagihkan Periode Ini */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-slate-500">Ditagihkan ({periodeLabel})</p>
                <Calendar className="size-5 text-teal-600" />
              </div>
              <p className="mt-2 text-3xl font-bold text-slate-900 tabular-nums">
                {formatRupiah(invoiceStats.totalDitagihkanBulanIni)}
              </p>
              <p className="mt-2 text-xs text-slate-500">Total nilai invoice yang diterbitkan</p>
            </div>

            {/* Terkumpul Bulan Ini */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-slate-500">Terkumpul Bulan Ini</p>
                <CheckCircle2 className="size-5 text-emerald-600" />
              </div>
              <p className="mt-2 text-3xl font-bold text-emerald-600 tabular-nums">
                {formatRupiah(invoiceStats.totalTerbayarBulanIni)}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                <span className="font-semibold text-emerald-600">
                  {invoiceStats.collectionRate}%
                </span>
                <span>terkumpul dari tagihan bulan ini</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                  style={{ width: `${Math.min(100, invoiceStats.collectionRate)}%` }}
                />
              </div>
            </div>
          </div>

          {/* ── Search, Filters & Action Controls ────────────────── */}
          <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            {/* Top row: Search, Property, Date Presets & Actions */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex flex-1 flex-wrap items-center gap-2">
                {/* Search with Clear Button */}
                <div className="relative min-w-[240px] flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Cari no. invoice, penyewa, kamar..."
                    value={invoiceSearch}
                    onChange={(e) => setInvoiceSearch(e.target.value)}
                    className="pl-9 pr-8 text-sm"
                  />
                  {invoiceSearch && (
                    <button
                      onClick={() => setInvoiceSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>

                {/* Date Range Preset */}
                <Select
                  value={invoiceDatePreset}
                  onValueChange={(val) => setInvoiceDatePreset(val ?? "all")}
                >
                  <SelectTrigger className="w-[170px] text-xs h-9">
                    <CalendarDays className="mr-1.5 size-3.5 text-slate-400" />
                    <SelectValue placeholder="Semua Waktu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tanggal</SelectItem>
                    <SelectItem value="this_month">Bulan Ini</SelectItem>
                    <SelectItem value="last_month">Bulan Lalu</SelectItem>
                    <SelectItem value="this_year">Tahun Ini</SelectItem>
                    <SelectItem value="custom">Rentang Kustom...</SelectItem>
                  </SelectContent>
                </Select>

                {/* Custom Date Pickers */}
                {invoiceDatePreset === "custom" && (
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="date"
                      value={invoiceDateStart}
                      onChange={(e) => setInvoiceDateStart(e.target.value)}
                      className="h-9 w-32 text-xs"
                      title="Dari Tanggal"
                    />
                    <span className="text-xs text-slate-400">-</span>
                    <Input
                      type="date"
                      value={invoiceDateEnd}
                      onChange={(e) => setInvoiceDateEnd(e.target.value)}
                      className="h-9 w-32 text-xs"
                      title="Sampai Tanggal"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setManualInvoiceOpen(true)}
                  className="gap-1.5 bg-teal-600 text-white hover:bg-teal-700 shadow-sm"
                >
                  <Plus className="size-4" />
                  <span>Buat Tagihan</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateInvoices}
                  disabled={isPending}
                  className="gap-1.5 border-teal-200 text-teal-800 hover:bg-teal-50"
                  title="Generate tagihan bulanan otomatis untuk semua kontrak sewa aktif"
                >
                  <Sparkles className="size-4 text-teal-600" />
                  <span className="hidden sm:inline">Generate Otomatis</span>
                </Button>

                {invoiceStats.countTertunggak > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBulkReminderOpen(true)}
                    className="gap-1.5 border-rose-200 bg-rose-50/50 text-rose-700 hover:bg-rose-100/70"
                  >
                    <Bell className="size-4 text-rose-600" />
                    <span>Ingatkan Masal ({invoiceStats.countTertunggak})</span>
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportInvoicesCSV}
                  className="gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  <Download className="size-4 text-slate-600" />
                  <span>Ekspor CSV</span>
                </Button>
              </div>
            </div>

            {/* Bottom row: Status Filter Pills with counters */}
            <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "all", label: "Semua", count: invoiceStats.counts.all },
                  { id: "overdue", label: "Tertunggak", count: invoiceStats.counts.overdue, variant: "rose" },
                  { id: "unpaid", label: "Belum Lunas", count: invoiceStats.counts.unpaid },
                  { id: "partial", label: "Sebagian", count: invoiceStats.counts.partial, variant: "amber" },
                  { id: "paid", label: "Lunas", count: invoiceStats.counts.paid, variant: "emerald" },
                  ...(invoiceStats.counts.draft > 0
                    ? [{ id: "draft", label: "Draf", count: invoiceStats.counts.draft }]
                    : []),
                  ...(invoiceStats.counts.cancelled > 0
                    ? [{ id: "cancelled", label: "Dibatalkan", count: invoiceStats.counts.cancelled }]
                    : []),
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setInvoiceStatusFilter(f.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      invoiceStatusFilter === f.id
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
                    }`}
                  >
                    <span>{f.label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                        invoiceStatusFilter === f.id
                          ? "bg-white/20 text-white"
                          : f.id === "overdue" && f.count > 0
                          ? "bg-rose-100 text-rose-700"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>

              <p className="text-xs text-slate-400">
                Menampilkan <span className="font-semibold text-slate-700">{filteredInvoices.length}</span> dari{" "}
                <span className="font-semibold text-slate-700">{invoices.length}</span> tagihan
              </p>
            </div>
          </div>

          {/* ── Invoices Table ───────────────────────────────────── */}
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">No. Tagihan</th>
                    <th className="px-5 py-3.5">Penyewa</th>
                    <th className="px-5 py-3.5">Kamar / Properti</th>
                    <th className="px-5 py-3.5">Jatuh Tempo</th>
                    <th className="px-5 py-3.5 text-right">Total Tagihan</th>
                    <th className="px-5 py-3.5 text-right">Sisa Tagihan</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-14 text-center">
                        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <Receipt className="size-6" />
                        </div>
                        {invoices.length === 0 ? (
                          <>
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 mb-2">
                              <span>Langkah 5 dari 5 Setup Portofolio</span>
                            </div>
                            <p className="mt-1 text-base font-semibold text-slate-800">
                              Belum ada tagihan sewa yang diterbitkan
                            </p>
                            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
                              Terbitkan tagihan baru atau generate otomatis untuk seluruh penyewa yang memiliki kontrak sewa aktif guna melengkapi siklus operasional sewa.
                            </p>
                            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => setManualInvoiceOpen(true)}
                                className="rounded-xl bg-teal-600 text-xs font-semibold text-white shadow-sm hover:bg-teal-700"
                              >
                                <Plus className="mr-1.5 size-3.5" />
                                Buat Tagihan Baru
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleGenerateInvoices}
                                disabled={isPending}
                                className="rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                <Sparkles className="mr-1.5 size-3.5 text-teal-600" />
                                Generate Otomatis
                              </Button>
                              <Link
                                href="/dashboard/owner"
                                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                              >
                                Panduan Setup
                              </Link>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="mt-3 text-base font-semibold text-slate-800">
                              Tidak ada tagihan yang cocok
                            </p>
                            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
                              Tidak ada invoice yang sesuai dengan kata kunci pencarian atau filter status yang dipilih.
                            </p>
                            <div className="mt-4 flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setInvoiceSearch("");
                                  setInvoiceStatusFilter("all");
                                  setInvoicePropertyFilter("all");
                                  setInvoiceDatePreset("all");
                                  setInvoiceDateStart("");
                                  setInvoiceDateEnd("");
                                }}
                                className="rounded-xl border-slate-200 text-xs text-slate-700 hover:bg-slate-50"
                              >
                                Reset Filter &amp; Pencarian
                              </Button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const dueDate = new Date(inv.dueDate);
                      const isOverdue = dueDate < now && inv.balanceDue > 0;
                      const diffDays = isOverdue
                        ? Math.max(1, Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
                        : 0;
                      const isPartial = inv.balanceDue > 0 && inv.balanceDue < inv.total;
                      const paidPct = inv.total > 0 ? Math.round(((inv.total - inv.balanceDue) / inv.total) * 100) : 0;

                      return (
                        <tr key={inv.id} className="transition hover:bg-slate-50/50">
                          {/* Invoice Number & Created */}
                          <td className="px-5 py-4">
                            <button
                              onClick={() => setDetailInvoice(inv)}
                              className="font-mono font-bold text-teal-800 hover:text-teal-900 hover:underline text-left block"
                            >
                              {inv.invoiceNumber}
                            </button>
                            <span className="text-[11px] text-slate-400">
                              Terbit: {formatTanggal(inv.issueDate)}
                            </span>
                          </td>

                          {/* Tenant */}
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-900">
                              {inv.penghuni?.nama || "Penyewa"}
                            </p>
                            <p className="text-xs text-slate-400 font-mono">{inv.penghuni?.noHp || "-"}</p>
                          </td>

                          {/* Room & Property */}
                          <td className="px-5 py-4">
                            <p className="font-medium text-slate-800">
                              Kamar {inv.lease?.kamar?.nomor || "-"}
                            </p>
                            <p className="text-xs text-slate-400">
                              {inv.lease?.kamar?.properti?.nama || "Properti"}
                            </p>
                          </td>

                          {/* Due Date & Overdue Badge */}
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-1 items-start">
                              <span className="font-medium text-slate-700">
                                {formatTanggal(inv.dueDate)}
                              </span>
                              {isOverdue && inv.status !== "cancelled" && (
                                <StatusBadge variant="rose" className="text-[10px] py-0 px-1.5 font-bold">
                                  Terlambat {diffDays} hr
                                </StatusBadge>
                              )}
                            </div>
                          </td>

                          {/* Total */}
                          <td className="px-5 py-4 text-right font-medium text-slate-900 tabular-nums">
                            {formatRupiah(inv.total)}
                          </td>

                          {/* Balance Due + Partial Indicator */}
                          <td className="px-5 py-4 text-right tabular-nums">
                            <div className="flex flex-col items-end">
                              <span
                                className={`font-bold ${
                                  inv.status === "cancelled"
                                    ? "text-slate-400 line-through"
                                    : inv.balanceDue > 0
                                    ? "text-rose-600"
                                    : "text-emerald-600"
                                }`}
                              >
                                {formatRupiah(inv.balanceDue)}
                              </span>
                              {isPartial && inv.status !== "cancelled" && (
                                <span className="text-[10px] font-semibold text-amber-700">
                                  Terbayar {paidPct}%
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="px-5 py-4 text-center">
                            {inv.status === "cancelled" ? (
                              <StatusBadge variant="slate">Dibatalkan</StatusBadge>
                            ) : inv.balanceDue === 0 ? (
                              <StatusBadge variant="emerald" icon="check">
                                Lunas
                              </StatusBadge>
                            ) : isPartial ? (
                              <StatusBadge variant="amber" icon="clock">
                                Sebagian
                              </StatusBadge>
                            ) : isOverdue ? (
                              <StatusBadge variant="rose" icon="alert">
                                Tertunggak
                              </StatusBadge>
                            ) : inv.status === "draft" ? (
                              <StatusBadge variant="slate">Draf</StatusBadge>
                            ) : (
                              <StatusBadge variant="slate" icon="clock">
                                Belum Bayar
                              </StatusBadge>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* 1-click WhatsApp reminder if unpaid */}
                              {inv.balanceDue > 0 && inv.status !== "cancelled" && inv.penghuni?.noHp && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => sendWhatsAppReminder(inv)}
                                  className="h-8 gap-1 border-emerald-200 px-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                                  title="Kirim pengingat WhatsApp ke penyewa"
                                >
                                  <MessageSquare className="size-3.5" />
                                  <span className="hidden sm:inline">Kirim WA</span>
                                </Button>
                              )}

                              {/* Detail Drawer */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDetailInvoice(inv)}
                                className="h-8 px-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                              >
                                Rincian
                              </Button>

                              {/* Record Payment */}
                              {inv.balanceDue > 0 && inv.status !== "cancelled" && (
                                <Button
                                  size="sm"
                                  onClick={() => openRecordPayment(inv)}
                                  className="h-8 bg-teal-600 px-3 text-xs font-semibold text-white hover:bg-teal-700 shadow-sm"
                                >
                                  Catat Bayar
                                </Button>
                              )}

                              {/* More Actions Dropdown */}
                              <DropdownMenu>
                                <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="size-8 p-0" />}>
                                  <MoreVertical className="size-4 text-slate-500" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setReceiptInvoice(inv)}>
                                    <Printer className="mr-2 size-3.5 text-slate-500" />
                                    Cetak Kwitansi
                                  </DropdownMenuItem>
                                  {inv.balanceDue > 0 && inv.status !== "cancelled" && (
                                    <DropdownMenuItem onClick={() => openRecordPayment(inv)}>
                                      <CreditCard className="mr-2 size-3.5 text-slate-500" />
                                      Catat Pembayaran
                                    </DropdownMenuItem>
                                  )}
                                  {/* Cancel invoice guard: only if unpaid and not cancelled */}
                                  {inv.balanceDue === inv.total && inv.status !== "cancelled" && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setCancelInvoiceTarget(inv);
                                        setCancelReason("");
                                      }}
                                      className="text-rose-600 focus:text-rose-600"
                                    >
                                      <Trash2 className="mr-2 size-3.5" />
                                      Batalkan Tagihan
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
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB 2: PEMBAYARAN & REKONSILIASI (PAYMENTS & RECONCILIATION) */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === "payments" && (
        <PaymentReconciliationTab
          payments={initialPayments}
          invoices={invoices}
          penghuniList={penghuniList}
          kamarList={kamarList}
          propertiList={propertiList}
          onViewInvoice={(invoiceId) => {
            const found = invoices.find((inv) => inv.id === invoiceId);
            if (found) {
              setDetailInvoice(found);
            }
          }}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB 3: BEBAN PENGELUARAN & ARUS KAS (EXPENSE & CASHBOOK)      */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === "cashbook" && (
        <ExpenseManagementTab
          transaksiList={list}
          kamarList={kamarList as any}
          penghuniList={penghuniList}
          propertiList={propertiList}
          vendorList={vendorList}
          pemeliharaanList={pemeliharaanList}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* DIALOG: DETAIL INVOICE (360° FINANCIAL & CONTRACT VIEW)      */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Dialog open={!!detailInvoice} onOpenChange={(open) => !open && setDetailInvoice(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-bold text-slate-900">
                <Receipt className="size-5 text-teal-600" />
                <span>Tagihan {detailInvoice?.invoiceNumber}</span>
              </DialogTitle>
              {detailInvoice && (
                <div>
                  {detailInvoice.status === "cancelled" ? (
                    <StatusBadge variant="slate">Dibatalkan</StatusBadge>
                  ) : detailInvoice.balanceDue === 0 ? (
                    <StatusBadge variant="emerald" icon="check">Lunas</StatusBadge>
                  ) : detailInvoice.balanceDue < detailInvoice.total ? (
                    <StatusBadge variant="amber" icon="clock">Sebagian</StatusBadge>
                  ) : new Date(detailInvoice.dueDate) < now ? (
                    <StatusBadge variant="rose" icon="alert">Tertunggak</StatusBadge>
                  ) : (
                    <StatusBadge variant="slate" icon="clock">Belum Bayar</StatusBadge>
                  )}
                </div>
              )}
            </div>
            <DialogDescription>
              Rincian komponen biaya sewa, status pelunasan, linimasa alokasi, dan dokumen tagihan.
            </DialogDescription>
          </DialogHeader>

          {detailInvoice && (() => {
            const dueDate = new Date(detailInvoice.dueDate);
            const isOverdue = dueDate < now && detailInvoice.balanceDue > 0 && detailInvoice.status !== "cancelled";
            const diffDays = isOverdue ? Math.max(1, Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))) : 0;
            const paidAmount = Math.max(0, detailInvoice.total - detailInvoice.balanceDue);
            const paidPct = detailInvoice.total > 0 ? Math.round((paidAmount / detailInvoice.total) * 100) : 0;

            return (
              <div className="space-y-4 text-sm">
                {/* Overdue Warning Alert */}
                {isOverdue && (
                  <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-900">
                    <AlertTriangle className="size-5 shrink-0 text-rose-600 mt-0.5" />
                    <div>
                      <p className="font-bold text-rose-800">
                        Tagihan Melewati Jatuh Tempo ({diffDays} Hari Terlambat)
                      </p>
                      <p className="mt-0.5 text-rose-700">
                        Batas jatuh tempo tagihan ini adalah {formatTanggal(detailInvoice.dueDate)}. Segera hubungi penyewa untuk melakukan penagihan atau kirim pengingat WhatsApp.
                      </p>
                    </div>
                  </div>
                )}

                {/* Partial Payment Progress Bar */}
                {paidAmount > 0 && detailInvoice.status !== "cancelled" && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>Progres Pelunasan: {paidPct}%</span>
                      <span className="tabular-nums">
                        {formatRupiah(paidAmount)} / {formatRupiah(detailInvoice.total)}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                        style={{ width: `${paidPct}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Info Grid: Tenant, Unit, Lease & Property */}
                <div className="grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 text-xs sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="font-bold uppercase tracking-wider text-slate-400">Penyewa</p>
                    <p className="text-sm font-semibold text-slate-900">{detailInvoice.penghuni?.nama || "-"}</p>
                    <div className="flex items-center gap-2 text-slate-600 font-mono">
                      <span>{detailInvoice.penghuni?.noHp || "-"}</span>
                      {detailInvoice.penghuni?.noHp && (
                        <button
                          type="button"
                          onClick={() => sendWhatsAppReminder(detailInvoice)}
                          className="inline-flex items-center gap-1 font-sans text-[11px] font-semibold text-emerald-700 hover:underline"
                        >
                          <MessageSquare className="size-3" />
                          Chat WA
                        </button>
                      )}
                    </div>
                    {detailInvoice.penghuni?.email && (
                      <p className="text-slate-500">{detailInvoice.penghuni.email}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="font-bold uppercase tracking-wider text-slate-400">Unit &amp; Kontrak</p>
                    <p className="text-sm font-semibold text-slate-900">
                      Kamar {detailInvoice.lease?.kamar?.nomor || "-"}
                    </p>
                    <p className="text-slate-600">
                      {detailInvoice.lease?.kamar?.properti?.nama || "Kost & Properti"}
                    </p>
                    {detailInvoice.lease?.nomorKontrak && (
                      <p className="text-slate-500 font-mono text-[11px]">
                        Kontrak: {detailInvoice.lease.nomorKontrak}
                      </p>
                    )}
                  </div>

                  <div className="border-t border-slate-200/60 pt-2 text-slate-600 sm:col-span-2 flex flex-wrap justify-between gap-2">
                    <div>
                      <span className="text-slate-400">Tanggal Terbit: </span>
                      <span className="font-medium text-slate-800">{formatTanggal(detailInvoice.issueDate)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Batas Jatuh Tempo: </span>
                      <span className="font-bold text-slate-900">{formatTanggal(detailInvoice.dueDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Line Items Table */}
                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Rincian Komponen Biaya (Invoice Lines)
                  </h4>
                  <div className="overflow-hidden rounded-xl border border-slate-100">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold uppercase">
                        <tr>
                          <th className="px-3.5 py-2.5">Deskripsi</th>
                          <th className="px-3 py-2.5 text-center">Tipe</th>
                          <th className="px-3 py-2.5 text-center">Qty</th>
                          <th className="px-3.5 py-2.5 text-right">Tarif</th>
                          <th className="px-3.5 py-2.5 text-right">Jumlah</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {detailInvoice.lines.map((l) => (
                          <tr key={l.id} className="hover:bg-slate-50/40">
                            <td className="px-3.5 py-2.5 font-medium text-slate-800">{l.description}</td>
                            <td className="px-3 py-2.5 text-center">
                              <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 uppercase">
                                {l.type}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-center text-slate-500 tabular-nums">{l.quantity}</td>
                            <td className="px-3.5 py-2.5 text-right text-slate-600 tabular-nums">
                              {formatRupiah(l.unitPrice)}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-semibold text-slate-900 tabular-nums">
                              {formatRupiah(l.amount)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50/50 font-bold border-t border-slate-200">
                          <td colSpan={4} className="px-3.5 py-2 text-right text-slate-700">
                            Total Tagihan:
                          </td>
                          <td className="px-3.5 py-2 text-right text-slate-900 tabular-nums">
                            {formatRupiah(detailInvoice.total)}
                          </td>
                        </tr>
                        {paidAmount > 0 && (
                          <tr className="bg-slate-50/50 font-medium text-emerald-700">
                            <td colSpan={4} className="px-3.5 py-2 text-right">
                              Sudah Dibayar:
                            </td>
                            <td className="px-3.5 py-2 text-right font-bold tabular-nums">
                              - {formatRupiah(paidAmount)}
                            </td>
                          </tr>
                        )}
                        <tr className="bg-slate-100 font-extrabold text-sm">
                          <td colSpan={4} className="px-3.5 py-2.5 text-right text-slate-800">
                            Sisa Tagihan (Balance Due):
                          </td>
                          <td
                            className={`px-3.5 py-2.5 text-right tabular-nums ${
                              detailInvoice.status === "cancelled"
                                ? "text-slate-400 line-through"
                                : detailInvoice.balanceDue > 0
                                ? "text-rose-600"
                                : "text-emerald-600"
                            }`}
                          >
                            {formatRupiah(detailInvoice.balanceDue)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Riwayat Alokasi Pembayaran */}
                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Riwayat Alokasi Pembayaran
                  </h4>
                  {detailInvoice.allocations.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-3 text-center text-xs text-slate-400">
                      Belum ada alokasi pembayaran yang tercatat untuk tagihan ini.
                    </p>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-100">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-semibold uppercase">
                          <tr>
                            <th className="px-3.5 py-2.5">Waktu Alokasi</th>
                            <th className="px-3.5 py-2.5">Metode &amp; Ref</th>
                            <th className="px-3.5 py-2.5 text-right">Nominal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {detailInvoice.allocations.map((a) => (
                            <tr key={a.id}>
                              <td className="px-3.5 py-2 text-slate-700 font-medium">
                                {formatTanggal(a.allocatedAt)}
                              </td>
                              <td className="px-3.5 py-2 text-slate-600">
                                <span className="font-semibold uppercase text-slate-800">
                                  {a.payment?.paymentMethod || "Transfer"}
                                </span>
                                {a.payment?.paymentReference && (
                                  <span className="ml-1.5 text-[11px] text-slate-400 font-mono">
                                    ({a.payment.paymentReference})
                                  </span>
                                )}
                              </td>
                              <td className="px-3.5 py-2 text-right font-bold text-emerald-600 tabular-nums">
                                {formatRupiah(a.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Catatan Tagihan */}
                {detailInvoice.notes && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-700">
                    <p className="font-semibold text-slate-500">Catatan:</p>
                    <p className="mt-0.5">{detailInvoice.notes}</p>
                  </div>
                )}
              </div>
            );
          })()}

          <DialogFooter className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-2">
              {detailInvoice && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const target = detailInvoice;
                    setReceiptInvoice(target);
                  }}
                  className="gap-1.5 border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Printer className="size-3.5" />
                  <span>Cetak Bukti</span>
                </Button>
              )}

              {/* Cancel Button if eligible */}
              {detailInvoice &&
                detailInvoice.balanceDue === detailInvoice.total &&
                detailInvoice.status !== "cancelled" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const target = detailInvoice;
                      setCancelInvoiceTarget(target);
                      setCancelReason("");
                    }}
                    className="border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="mr-1.5 size-3.5" />
                    Batalkan Tagihan
                  </Button>
                )}
            </div>

            <div className="flex items-center gap-2">
              {detailInvoice && detailInvoice.balanceDue > 0 && detailInvoice.status !== "cancelled" && (
                <>
                  {detailInvoice.penghuni?.noHp && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendWhatsAppReminder(detailInvoice)}
                      className="gap-1.5 border-emerald-200 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                    >
                      <MessageSquare className="size-3.5" />
                      <span>Kirim WA</span>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => {
                      const target = detailInvoice;
                      setDetailInvoice(null);
                      openRecordPayment(target);
                    }}
                    className="bg-teal-600 text-xs font-semibold text-white hover:bg-teal-700 shadow-sm"
                  >
                    <CreditCard className="mr-1.5 size-3.5" />
                    Catat Bayar
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={() => setDetailInvoice(null)}>
                Tutup
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ALERT DIALOG: BATALKAN TAGIHAN (CANCEL CONFIRMATION)          */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <AlertDialog
        open={!!cancelInvoiceTarget}
        onOpenChange={(open) => !open && setCancelInvoiceTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-700">
              <AlertTriangle className="size-5" />
              <span>Batalkan Tagihan {cancelInvoiceTarget?.invoiceNumber}?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2 text-left">
              <span className="block text-slate-600">
                Tagihan atas nama{" "}
                <strong className="text-slate-900">{cancelInvoiceTarget?.penghuni?.nama}</strong>{" "}
                sebesar{" "}
                <strong className="text-slate-900">
                  {cancelInvoiceTarget && formatRupiah(cancelInvoiceTarget.total)}
                </strong>{" "}
                akan dibatalkan.
              </span>
              <span className="block rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800 border border-amber-200">
                Sisa tagihan akan diubah menjadi Rp 0 dan status tagihan ditandai sebagai <strong>Dibatalkan</strong>. Tindakan ini dicatat dalam audit log sistem.
              </span>
              <div className="space-y-1.5 pt-1">
                <Label htmlFor="cancel-reason" className="text-xs font-semibold text-slate-700">
                  Alasan Pembatalan (Opsional):
                </Label>
                <Input
                  id="cancel-reason"
                  placeholder="Contoh: Kesalahan nominal, penyewa pindah mendadak, dsb."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="text-xs"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelInvoice}
              disabled={isPending}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {isPending ? "Membatalkan..." : "Konfirmasi Batalkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* DIALOG: PENGINGAT MASAL WHATSAPP (BULK OVERDUE REMINDER)      */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Dialog open={bulkReminderOpen} onOpenChange={setBulkReminderOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="flex items-center gap-2">
                <Bell className="size-5 text-rose-600" />
                <span>Pengingat Masal Tagihan Tertunggak</span>
              </DialogTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={copyOverdueBroadcastList}
                className="gap-1.5 border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Copy className="size-3.5" />
                <span>Salin Rekap Text</span>
              </Button>
            </div>
            <DialogDescription>
              Terdapat {overdueInvoices.length} tagihan tertunggak dengan total nominal{" "}
              <strong>{formatRupiah(invoiceStats.totalTertunggak)}</strong>. Kirim pesan WhatsApp personal ke tiap penyewa.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {overdueInvoices.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
                <CheckCircle2 className="mx-auto size-8 text-emerald-600" />
                <p className="mt-2 font-semibold text-slate-800">Tidak Ada Tagihan Tertunggak</p>
                <p className="text-xs text-slate-400">Seluruh penyewa telah melunasi tagihannya tepat waktu.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">
                {overdueInvoices.map((inv) => {
                  const dueDate = new Date(inv.dueDate);
                  const diffDays = Math.max(1, Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
                  return (
                    <div
                      key={inv.id}
                      className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/60"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900">{inv.penghuni?.nama || "Penyewa"}</p>
                          <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                            Terlambat {diffDays} hr
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Kamar {inv.lease?.kamar?.nomor || "-"} ({inv.lease?.kamar?.properti?.nama || "Properti"}) •{" "}
                          <span className="font-mono text-slate-400">{inv.penghuni?.noHp || "No HP Kosong"}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <div className="text-right">
                          <p className="font-bold text-rose-600 tabular-nums">{formatRupiah(inv.balanceDue)}</p>
                          <p className="text-[11px] text-slate-400">Tempo: {formatTanggal(inv.dueDate)}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => sendWhatsAppReminder(inv)}
                          disabled={!inv.penghuni?.noHp}
                          className="h-8 gap-1.5 bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs"
                        >
                          <Send className="size-3.5" />
                          <span>Kirim WA</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkReminderOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* DIALOG: TERBITKAN TAGIHAN BARU (MANUAL INVOICE CREATOR)      */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Dialog open={manualInvoiceOpen} onOpenChange={setManualInvoiceOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="size-5 text-teal-600" />
              <span>Terbitkan Tagihan Baru</span>
            </DialogTitle>
            <DialogDescription>
              Buat tagihan sewa bulanan, denda, listrik, atau iuran utilitas lainnya untuk penyewa.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm py-2">
            {/* Tenant Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Pilih Penyewa *</Label>
              <Select
                value={manualInvoiceTenantId}
                onValueChange={(val) => setManualInvoiceTenantId(val ?? "")}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Pilih penyewa aktif..." />
                </SelectTrigger>
                <SelectContent>
                  {penghuniList.map((p) => {
                    const kamar = kamarList.find((k) => k.id === p.kamarId);
                    return (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nama} {kamar ? `(Kamar ${kamar.nomor})` : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <Label htmlFor="inv-due-date" className="text-xs font-semibold text-slate-700">
                Tanggal Jatuh Tempo *
              </Label>
              <Input
                id="inv-due-date"
                type="date"
                value={manualInvoiceDueDate}
                onChange={(e) => setManualInvoiceDueDate(e.target.value)}
                className="text-xs"
              />
            </div>

            {/* Line Items Form */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700">
                  Komponen Biaya Tagihan *
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addManualLine}
                  className="h-7 text-xs border-dashed text-teal-700 hover:bg-teal-50"
                >
                  <Plus className="mr-1 size-3" />
                  Tambah Baris
                </Button>
              </div>

              <div className="space-y-2">
                {manualInvoiceLines.map((line, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-2 rounded-xl border border-slate-200 p-2.5 bg-slate-50/50 sm:flex-row sm:items-center"
                  >
                    <div className="w-full sm:w-32">
                      <Select
                        value={line.type}
                        onValueChange={(val) => updateManualLine(idx, "type", val ?? "rent")}
                      >
                        <SelectTrigger className="h-8 text-xs bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rent">Sewa Pokok</SelectItem>
                          <SelectItem value="electricity">Listrik</SelectItem>
                          <SelectItem value="water">Air</SelectItem>
                          <SelectItem value="penalty">Denda</SelectItem>
                          <SelectItem value="service_charge">Iuran</SelectItem>
                          <SelectItem value="other">Lainnya</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Input
                      placeholder="Deskripsi komponen biaya..."
                      value={line.description}
                      onChange={(e) => updateManualLine(idx, "description", e.target.value)}
                      className="h-8 text-xs flex-1 bg-white"
                    />

                    <div className="flex items-center gap-1.5 w-full sm:w-44">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={line.quantity}
                        onChange={(e) => updateManualLine(idx, "quantity", Number(e.target.value) || 1)}
                        className="h-8 w-14 text-xs bg-white text-center"
                      />
                      <Input
                        type="number"
                        min="0"
                        placeholder="Tarif (Rp)"
                        value={line.unitPrice || ""}
                        onChange={(e) => updateManualLine(idx, "unitPrice", Number(e.target.value) || 0)}
                        className="h-8 text-xs bg-white flex-1"
                      />
                      {manualInvoiceLines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeManualLine(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <X className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Calculation Display */}
              <div className="flex justify-between rounded-xl bg-teal-50/80 p-3 text-xs font-bold text-teal-900 border border-teal-200/60">
                <span>Total Nilai Tagihan:</span>
                <span className="text-sm text-teal-950 tabular-nums">
                  {formatRupiah(
                    manualInvoiceLines.reduce((s, l) => s + (l.quantity * l.unitPrice), 0)
                  )}
                </span>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="inv-notes" className="text-xs font-semibold text-slate-700">
                Catatan Tambahan (Opsional)
              </Label>
              <Textarea
                id="inv-notes"
                rows={2}
                placeholder="Catatan rekening tujuan pembayaran atau instruksi pelunasan..."
                value={manualInvoiceNotes}
                onChange={(e) => setManualInvoiceNotes(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setManualInvoiceOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleCreateManualInvoice}
              disabled={isPending}
              className="bg-teal-600 text-white hover:bg-teal-700 shadow-sm"
            >
              {isPending ? "Menerbitkan..." : "Terbitkan Tagihan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* DIALOG: CETAK KWITANSI / BUKTI TAGIHAN (PRINTABLE VIEW)      */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Dialog open={!!receiptInvoice} onOpenChange={(open) => !open && setReceiptInvoice(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="size-5 text-teal-600" />
              <span>Kwitansi / Bukti Tagihan Sewa</span>
            </DialogTitle>
            <DialogDescription>
              Dokumen tagihan resmi yang dapat dicetak atau disimpan sebagai arsip pembayaran penyewa.
            </DialogDescription>
          </DialogHeader>

          {receiptInvoice && (() => {
            const paid = Math.max(0, receiptInvoice.total - receiptInvoice.balanceDue);
            return (
              <div id="printable-receipt" className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 text-xs text-slate-800">
                {/* Header Kwitansi */}
                <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold uppercase tracking-tight text-teal-900">
                      Kontrakin • Properti
                    </h3>
                    <p className="text-slate-500 text-[11px]">
                      {receiptInvoice.lease?.kamar?.properti?.nama || "Kost & Hunian Sewa"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-slate-900">{receiptInvoice.invoiceNumber}</span>
                    <p className="text-[11px] text-slate-500">Tgl: {formatTanggal(receiptInvoice.issueDate)}</p>
                  </div>
                </div>

                {/* Info Penyewa */}
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Penyewa</p>
                    <p className="font-bold text-slate-900">{receiptInvoice.penghuni?.nama}</p>
                    <p className="text-slate-500">{receiptInvoice.penghuni?.noHp}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Kamar / Unit</p>
                    <p className="font-bold text-slate-900">Kamar {receiptInvoice.lease?.kamar?.nomor || "-"}</p>
                    <p className="text-slate-500">Jatuh Tempo: {formatTanggal(receiptInvoice.dueDate)}</p>
                  </div>
                </div>

                {/* Lines Table */}
                <table className="w-full text-left">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                    <tr>
                      <th className="py-1.5 px-2">Komponen Biaya</th>
                      <th className="py-1.5 px-2 text-center">Qty</th>
                      <th className="py-1.5 px-2 text-right">Tarif</th>
                      <th className="py-1.5 px-2 text-right">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receiptInvoice.lines.map((l) => (
                      <tr key={l.id}>
                        <td className="py-1.5 px-2 font-medium">{l.description}</td>
                        <td className="py-1.5 px-2 text-center text-slate-500">{l.quantity}</td>
                        <td className="py-1.5 px-2 text-right text-slate-600">{formatRupiah(l.unitPrice)}</td>
                        <td className="py-1.5 px-2 text-right font-semibold">{formatRupiah(l.amount)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-slate-200 font-bold bg-slate-50/60">
                      <td colSpan={3} className="py-1.5 px-2 text-right">Total:</td>
                      <td className="py-1.5 px-2 text-right">{formatRupiah(receiptInvoice.total)}</td>
                    </tr>
                    {paid > 0 && (
                      <tr className="font-medium text-emerald-700">
                        <td colSpan={3} className="py-1.5 px-2 text-right">Terbayar:</td>
                        <td className="py-1.5 px-2 text-right font-bold">- {formatRupiah(paid)}</td>
                      </tr>
                    )}
                    <tr className="font-extrabold text-slate-900 bg-slate-100">
                      <td colSpan={3} className="py-2 px-2 text-right">Sisa Tagihan:</td>
                      <td className="py-2 px-2 text-right text-rose-700">{formatRupiah(receiptInvoice.balanceDue)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Signature Box */}
                <div className="flex justify-between pt-4 border-t border-slate-200 text-center">
                  <div className="w-36">
                    <p className="text-[10px] text-slate-400">Penyewa</p>
                    <div className="h-12" />
                    <p className="font-semibold border-t border-slate-300 pt-1">{receiptInvoice.penghuni?.nama || "Penyewa"}</p>
                  </div>
                  <div className="w-36">
                    <p className="text-[10px] text-slate-400">Pengelola Properti</p>
                    <div className="h-12" />
                    <p className="font-semibold border-t border-slate-300 pt-1">Manajemen</p>
                  </div>
                </div>
              </div>
            );
          })()}

          <DialogFooter>
            <Button
              onClick={() => window.print()}
              className="gap-1.5 bg-teal-600 text-white hover:bg-teal-700 shadow-sm"
            >
              <Printer className="size-4" />
              <span>Cetak Sekarang</span>
            </Button>
            <Button variant="outline" onClick={() => setReceiptInvoice(null)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* DIALOG: CATAT PEMBAYARAN TAGIHAN (ALLOCATION MODAL)          */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Dialog open={!!paymentInvoice} onOpenChange={(open) => !open && setPaymentInvoice(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="size-5 text-teal-600" />
              <span>Catat Pembayaran Tagihan</span>
            </DialogTitle>
            <DialogDescription>
              Rekonsiliasi pembayaran untuk tagihan {paymentInvoice?.invoiceNumber}.
            </DialogDescription>
          </DialogHeader>

          {paymentInvoice && (
            <div className="space-y-4 text-sm">
              {/* Summary Box */}
              <div className="rounded-xl bg-teal-50/70 p-3.5 text-xs text-teal-900">
                <div className="flex justify-between">
                  <span className="text-teal-700">Penyewa:</span>
                  <span className="font-bold">{paymentInvoice.penghuni?.nama}</span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-teal-700">Total Tagihan:</span>
                  <span>{formatRupiah(paymentInvoice.total)}</span>
                </div>
                <div className="mt-1 flex justify-between border-t border-teal-200/60 pt-1 font-semibold">
                  <span className="text-teal-700">Sisa Tagihan:</span>
                  <span className="text-rose-600">{formatRupiah(paymentInvoice.balanceDue)}</span>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <Label htmlFor="pay-amount">Nominal yang Dibayar (Rp)</Label>
                <Input
                  id="pay-amount"
                  type="number"
                  min="1"
                  max={paymentInvoice.balanceDue}
                  value={paymentAmount || ""}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  placeholder="Masukkan jumlah..."
                />
                <p className="text-[11px] text-slate-500">
                  Dapat diisi sebagian jika penyewa mencicil pembayaran.
                </p>
              </div>

              {/* Payment Method */}
              <div className="space-y-1.5">
                <Label htmlFor="pay-method">Metode Pembayaran</Label>
                <Select value={paymentMethod} onValueChange={(val) => setPaymentMethod(val ?? "transfer")}>
                  <SelectTrigger id="pay-method">
                    <SelectValue placeholder="Pilih metode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transfer">Transfer Bank (BCA, Mandiri, BRI, dll)</SelectItem>
                    <SelectItem value="qris">QRIS / E-Wallet</SelectItem>
                    <SelectItem value="cash">Tunai / Cash</SelectItem>
                    <SelectItem value="va">Virtual Account</SelectItem>
                    <SelectItem value="other">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reference */}
              <div className="space-y-1.5">
                <Label htmlFor="pay-ref">Nomor Referensi / Bukti Transfer (Opsional)</Label>
                <Input
                  id="pay-ref"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Contoh: REF-BCA-882319"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentInvoice(null)}>
              Batal
            </Button>
            <Button
              onClick={handleSavePayment}
              disabled={isPending}
              className="bg-teal-600 text-white hover:bg-teal-700 shadow-sm"
            >
              {isPending ? "Menyimpan..." : "Simpan & Alokasikan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* DIALOG: TAMBAH / EDIT TRANSAKSI KAS                          */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Transaksi Kas" : "Tambah Transaksi Kas Baru"}
            </DialogTitle>
            <DialogDescription>
              Catat mutasi arus kas operasional, biaya perawatan, atau pendapatan lain.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            {/* Jenis */}
            <div className="space-y-1.5">
              <Label>Jenis Mutasi</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, jenis: "pemasukan", kategori: "" }))}
                  className={`rounded-lg border p-2 text-xs font-semibold transition ${
                    form.jenis === "pemasukan"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  + Pemasukan
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, jenis: "pengeluaran", kategori: "" }))}
                  className={`rounded-lg border p-2 text-xs font-semibold transition ${
                    form.jenis === "pengeluaran"
                      ? "border-rose-500 bg-rose-50 text-rose-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  - Pengeluaran
                </button>
              </div>
            </div>

            {/* Kategori */}
            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Select
                value={form.kategori}
                onValueChange={(val) => setForm((f) => ({ ...f, kategori: val ?? "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori..." />
                </SelectTrigger>
                <SelectContent>
                  {(form.jenis === "pemasukan" ? KATEGORI_PEMASUKAN : KATEGORI_PENGELUARAN).map(
                    (kat) => (
                      <SelectItem key={kat} value={kat}>
                        {kat}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              {errors.kategori && <p className="text-xs text-rose-600">{errors.kategori}</p>}
            </div>

            {/* Jumlah */}
            <div className="space-y-1.5">
              <Label>Nominal (Rp)</Label>
              <Input
                type="number"
                min="1"
                placeholder="0"
                value={form.jumlah}
                onChange={(e) => setForm((f) => ({ ...f, jumlah: e.target.value }))}
              />
              {errors.jumlah && <p className="text-xs text-rose-600">{errors.jumlah}</p>}
            </div>

            {/* Tanggal */}
            <div className="space-y-1.5">
              <Label>Tanggal Transaksi</Label>
              <Input
                type="date"
                value={form.tanggal}
                onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))}
              />
              {errors.tanggal && <p className="text-xs text-rose-600">{errors.tanggal}</p>}
            </div>

            {/* Kamar & Penghuni Terkait */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Kamar (Opsional)</Label>
                <Select
                  value={form.kamarId}
                  onValueChange={(val) => setForm((f) => ({ ...f, kamarId: val ?? "" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Semua" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua</SelectItem>
                    {kamarList.map((k) => (
                      <SelectItem key={k.id} value={k.id}>
                        Kamar {k.nomor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Penyewa (Opsional)</Label>
                <Select
                  value={form.penghuniId}
                  onValueChange={(val) => setForm((f) => ({ ...f, penghuniId: val ?? "" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua</SelectItem>
                    {penghuniList.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Keterangan */}
            <div className="space-y-1.5">
              <Label>Keterangan Tambahan</Label>
              <Textarea
                rows={2}
                placeholder="Catatan kwitansi, vendor, atau keperluan pengeluaran..."
                value={form.keterangan}
                onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={submitTransaksi}
              disabled={isPending}
              className="bg-teal-600 text-white hover:bg-teal-700"
            >
              {isPending ? "Menyimpan..." : "Simpan Transaksi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ALERT DIALOG: HAPUS TRANSAKSI                                */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Transaksi Kas?</AlertDialogTitle>
            <AlertDialogDescription>
              Transaksi sebesar {deleteTarget && formatRupiah(deleteTarget.jumlah)} (
              {deleteTarget?.kategori}) akan dihapus dari buku kas. Tindakan ini akan dicatat dalam
              audit log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={konfirmasiHapus}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
