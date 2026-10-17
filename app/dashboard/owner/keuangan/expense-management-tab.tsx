"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Kamar, Penghuni, Transaksi } from "@/lib/generated/prisma/client";
import {
  Search,
  Plus,
  Download,
  Filter,
  Calendar,
  DollarSign,
  TrendingDown,
  Wrench,
  Zap,
  Users,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Eye,
  Pencil,
  Trash2,
  Building2,
  Tag,
  AlertCircle,
  ArrowUpRight,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Printer,
  Sparkles,
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
import { toast } from "sonner";
import { exportToCSV } from "@/lib/utils/export-csv";

import {
  createTransaksi,
  updateTransaksi,
  deleteTransaksi,
  type TransaksiInput,
} from "./action";

// ─── Types & Metadata ─────────────────────────────────────────────────────────

type TransaksiWithRelasi = Transaksi & {
  kamar: (Kamar & { properti?: { id?: string; nama: string } | null }) | null;
  penghuni: Penghuni | null;
};

export type VendorSimple = {
  id: string;
  name: string;
  category: string;
  phone: string;
  email?: string | null;
};

export type PemeliharaanSimple = {
  id: string;
  judul: string;
  status: string;
  kategori: string;
  kamarId?: string;
  penghuniId?: string;
  vendorId?: string | null;
  kamar?: {
    id: string;
    nomor: string;
    properti?: { id?: string; nama: string } | null;
  } | null;
};

interface ExpenseManagementTabProps {
  transaksiList: TransaksiWithRelasi[];
  kamarList: Array<Kamar & { properti?: { id?: string; nama: string } | null }>;
  penghuniList: Penghuni[];
  propertiList?: Array<{ id: string; nama: string }>;
  vendorList?: VendorSimple[];
  pemeliharaanList?: PemeliharaanSimple[];
}

export const EXPENSE_CATEGORIES = [
  "Utilitas: Listrik & PLN",
  "Utilitas: Air & PDAM",
  "Utilitas: Internet & Wifi",
  "Operasional: Gaji & Upah Staf",
  "Operasional: Kebersihan & Sampah",
  "Pemeliharaan: AC & Pendingin",
  "Pemeliharaan: Plumbing & Pompa Air",
  "Pemeliharaan: Kelistrikan",
  "Pemeliharaan: Bangunan & Sipil",
  "Pajak & Legal: PBB & Izin",
  "Pemasaran & Iklan",
  "Perlengkapan & Logistik",
  "Lain-lain",
] as const;

export interface ExpenseMetadata {
  vendorName?: string;
  maintenanceTicketId?: string;
  maintenanceTitle?: string;
  receiptUrl?: string;
  cleanDescription: string;
}

export function parseExpenseDescription(keterangan?: string | null): ExpenseMetadata {
  if (!keterangan) return { cleanDescription: "-" };
  let str = keterangan;
  let vendorName: string | undefined = undefined;
  let maintenanceTicketId: string | undefined = undefined;
  let maintenanceTitle: string | undefined = undefined;
  let receiptUrl: string | undefined = undefined;

  // Extract [Vendor: ...]
  const vendorMatch = str.match(/\[Vendor:\s*([^\]]+)\]/i);
  if (vendorMatch) {
    vendorName = vendorMatch[1].trim();
    str = str.replace(vendorMatch[0], "").trim();
  }

  // Extract [Tiket: ...]
  const ticketMatch = str.match(/\[Tiket:\s*([^\]]+)\]/i);
  if (ticketMatch) {
    const ticketPart = ticketMatch[1].trim();
    if (ticketPart.includes(" - ")) {
      const [idPart, titlePart] = ticketPart.split(" - ");
      maintenanceTicketId = idPart.trim();
      maintenanceTitle = titlePart.trim();
    } else {
      maintenanceTicketId = ticketPart;
    }
    str = str.replace(ticketMatch[0], "").trim();
  }

  // Extract [Struk: ...] or [Bukti: ...]
  const receiptMatch = str.match(/\[(Struk|Bukti):\s*([^\]]+)\]/i);
  if (receiptMatch) {
    receiptUrl = receiptMatch[2].trim();
    str = str.replace(receiptMatch[0], "").trim();
  }

  // Check for auto-generated maintenance format: "Biaya perbaikan: {judul} (Kamar {nomor})"
  if (!maintenanceTitle && str.startsWith("Biaya perbaikan:")) {
    const m = str.match(/^Biaya perbaikan:\s*(.+?)(?:\s*\(Kamar|\s*$)/i);
    if (m) {
      maintenanceTitle = m[1].trim();
    }
  }

  return {
    vendorName,
    maintenanceTicketId,
    maintenanceTitle,
    receiptUrl,
    cleanDescription: str || keterangan,
  };
}

export function formatExpenseDescription(input: {
  keterangan: string;
  vendorName?: string;
  maintenanceTicketId?: string;
  maintenanceTitle?: string;
  receiptUrl?: string;
}): string {
  const parts: string[] = [];
  if (input.vendorName && input.vendorName.trim()) {
    parts.push(`[Vendor: ${input.vendorName.trim()}]`);
  }
  if (input.maintenanceTicketId || input.maintenanceTitle) {
    const tId = input.maintenanceTicketId || "";
    const tTitle = input.maintenanceTitle || "";
    parts.push(`[Tiket: ${tId ? `${tId} - ` : ""}${tTitle}]`);
  }
  if (input.receiptUrl && input.receiptUrl.trim()) {
    parts.push(`[Bukti: ${input.receiptUrl.trim()}]`);
  }
  if (input.keterangan && input.keterangan.trim()) {
    parts.push(input.keterangan.trim());
  }
  return parts.join(" ");
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

export function ExpenseManagementTab({
  transaksiList,
  kamarList,
  penghuniList,
  propertiList = [],
  vendorList = [],
  pemeliharaanList = [],
}: ExpenseManagementTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // View Mode: "expenses" (only pengeluaran) vs "all" (cashbook) vs "incomes"
  const [viewMode, setViewMode] = useState<"expenses" | "all" | "incomes">("expenses");

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [datePreset, setDatePreset] = useState<"all" | "this_month" | "last_month" | "this_year">("this_month");
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<TransaksiWithRelasi | null>(null);
  const [editItem, setEditItem] = useState<TransaksiWithRelasi | null>(null);
  const [deleteItemTarget, setDeleteItemTarget] = useState<TransaksiWithRelasi | null>(null);
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<{ url: string; title: string } | null>(null);

  // ─── Filter & KPI Calculations ──────────────────────────────────────────────
  const stats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let totalPengeluaranBulanIni = 0;
    let totalPemasukanBulanIni = 0;
    let totalPemeliharaanBulanIni = 0;
    let totalUtilitasBulanIni = 0;

    // Room expense tracking for leak detection
    const roomExpenses: Record<string, { total: number; roomNo: string; propertyName: string }> = {};

    for (const t of transaksiList) {
      const d = new Date(t.tanggal);
      const isThisMonth = d.getFullYear() === currentYear && d.getMonth() === currentMonth;

      if (t.jenis === "pengeluaran") {
        if (isThisMonth) {
          totalPengeluaranBulanIni += t.jumlah;

          const cat = t.kategori.toLowerCase();
          if (cat.includes("pemeliharaan") || cat.includes("perawatan") || cat.includes("perbaikan")) {
            totalPemeliharaanBulanIni += t.jumlah;
          } else if (
            cat.includes("utilitas") ||
            cat.includes("listrik") ||
            cat.includes("air") ||
            cat.includes("internet")
          ) {
            totalUtilitasBulanIni += t.jumlah;
          }

          // Track room leak
          if (t.kamarId && t.kamar) {
            const kId = t.kamarId;
            if (!roomExpenses[kId]) {
              roomExpenses[kId] = {
                total: 0,
                roomNo: t.kamar.nomor,
                propertyName: t.kamar.properti?.nama || "Properti",
              };
            }
            roomExpenses[kId].total += t.jumlah;
          }
        }
      } else if (t.jenis === "pemasukan" && isThisMonth) {
        totalPemasukanBulanIni += t.jumlah;
      }
    }

    // Find highest expense unit
    let highestExpenseRoom: { total: number; roomNo: string; propertyName: string } | null = null;
    for (const item of Object.values(roomExpenses)) {
      if (!highestExpenseRoom || item.total > highestExpenseRoom.total) {
        highestExpenseRoom = item;
      }
    }

    const netCashflow = totalPemasukanBulanIni - totalPengeluaranBulanIni;

    return {
      totalPengeluaranBulanIni,
      totalPemasukanBulanIni,
      totalPemeliharaanBulanIni,
      totalUtilitasBulanIni,
      netCashflow,
      highestExpenseRoom,
    };
  }, [transaksiList]);

  // Filtered List
  const filteredList = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return transaksiList.filter((t) => {
      // View Mode Filter
      if (viewMode === "expenses" && t.jenis !== "pengeluaran") return false;
      if (viewMode === "incomes" && t.jenis !== "pemasukan") return false;

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const kat = t.kategori.toLowerCase();
        const ket = (t.keterangan || "").toLowerCase();
        const kamarNo = (t.kamar?.nomor || "").toLowerCase();
        const propName = (t.kamar?.properti?.nama || "").toLowerCase();
        const penghuniName = (t.penghuni?.nama || "").toLowerCase();

        if (
          !kat.includes(q) &&
          !ket.includes(q) &&
          !kamarNo.includes(q) &&
          !propName.includes(q) &&
          !penghuniName.includes(q)
        ) {
          return false;
        }
      }

      // Category Filter
      if (categoryFilter !== "all") {
        if (!t.kategori.toLowerCase().includes(categoryFilter.toLowerCase())) {
          return false;
        }
      }

      // Property Filter
      if (propertyFilter !== "all") {
        const pId = t.kamar?.properti?.id;
        if (pId !== propertyFilter) return false;
      }

      // Room Filter
      if (roomFilter !== "all") {
        if (t.kamarId !== roomFilter) return false;
      }

      // Vendor Filter
      if (vendorFilter !== "all") {
        const parsed = parseExpenseDescription(t.keterangan);
        if (!parsed.vendorName || !parsed.vendorName.toLowerCase().includes(vendorFilter.toLowerCase())) {
          return false;
        }
      }

      // Date Preset
      if (datePreset !== "all") {
        const d = new Date(t.tanggal);
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
  }, [transaksiList, viewMode, search, categoryFilter, propertyFilter, roomFilter, vendorFilter, datePreset]);

  // Pagination
  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const paginatedList = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredList.slice(start, start + itemsPerPage);
  }, [filteredList, page, itemsPerPage]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "ID Transaksi",
      "Tanggal",
      "Jenis",
      "Kategori",
      "Properti",
      "Nomor Kamar",
      "Penyewa",
      "Vendor / Pihak Ketiga",
      "Tiket Pemeliharaan",
      "Keterangan",
      "Jumlah (Rp)",
      "Bukti Struk URL",
    ];

    const rows = filteredList.map((t) => {
      const parsed = parseExpenseDescription(t.keterangan);
      return [
        t.id,
        formatTanggal(t.tanggal),
        t.jenis === "pengeluaran" ? "Pengeluaran" : "Pemasukan",
        t.kategori,
        t.kamar?.properti?.nama || "Umum",
        t.kamar?.nomor ? `Kamar ${t.kamar.nomor}` : "-",
        t.penghuni?.nama || "-",
        parsed.vendorName || "-",
        parsed.maintenanceTitle ? `${parsed.maintenanceTicketId || ""}: ${parsed.maintenanceTitle}` : "-",
        parsed.cleanDescription || "-",
        t.jumlah,
        parsed.receiptUrl || "-",
      ];
    });

    exportToCSV("daftar_pengeluaran_operasional", headers, rows);
    toast.success("Data pengeluaran berhasil diekspor ke CSV!");
  };

  // Delete Action
  const handleConfirmDelete = () => {
    if (!deleteItemTarget) return;
    startTransition(async () => {
      try {
        await deleteTransaksi(deleteItemTarget.id);
        toast.success("Transaksi berhasil dihapus");
        setDeleteItemTarget(null);
        if (detailItem?.id === deleteItemTarget.id) {
          setDetailItem(null);
        }
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Gagal menghapus transaksi");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* ── KPI Action Center for Expenses ──────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Pengeluaran Bulan Ini */}
        <div className="relative overflow-hidden rounded-2xl border border-rose-200/90 bg-rose-50/50 p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-800">
                Pengeluaran Bulan Ini
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-rose-950">
                {formatRupiah(stats.totalPengeluaranBulanIni)}
              </p>
              <p className="mt-1 text-xs text-rose-700">
                Beban operasional, utilitas, &amp; vendor
              </p>
            </div>
            <div className="rounded-xl bg-rose-600/10 p-2.5 text-rose-700">
              <TrendingDown className="size-5" />
            </div>
          </div>
        </div>

        {/* Beban Pemeliharaan & Perbaikan */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-200/90 bg-amber-50/50 p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                Biaya Pemeliharaan
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-amber-950">
                {formatRupiah(stats.totalPemeliharaanBulanIni)}
              </p>
              <p className="mt-1 text-xs text-amber-700">
                Perbaikan teknisi AC, pipa, &amp; kelistrikan
              </p>
            </div>
            <div className="rounded-xl bg-amber-600/10 p-2.5 text-amber-700">
              <Wrench className="size-5" />
            </div>
          </div>
        </div>

        {/* Beban Utilitas */}
        <div className="relative overflow-hidden rounded-2xl border border-blue-200/90 bg-blue-50/50 p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-800">
                Biaya Utilitas
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-blue-950">
                {formatRupiah(stats.totalUtilitasBulanIni)}
              </p>
              <p className="mt-1 text-xs text-blue-700">
                Listrik PLN, Air PDAM, &amp; Internet Wifi
              </p>
            </div>
            <div className="rounded-xl bg-blue-600/10 p-2.5 text-blue-700">
              <Zap className="size-5" />
            </div>
          </div>
        </div>

        {/* Unit dengan Beban Tertinggi (Leak Detection) */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Unit Beban Tertinggi
              </p>
              {stats.highestExpenseRoom ? (
                <>
                  <p className="mt-2 text-xl font-bold tracking-tight text-slate-900 truncate max-w-[170px]">
                    Kamar {stats.highestExpenseRoom.roomNo}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-rose-600">
                    {formatRupiah(stats.highestExpenseRoom.total)}
                    <span className="font-normal text-slate-500 ml-1">
                      ({stats.highestExpenseRoom.propertyName})
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-2 text-base font-bold text-slate-700">Nihil pengeluaran</p>
                  <p className="mt-1 text-xs text-slate-400">Tidak ada unit dengan beban abnormal</p>
                </>
              )}
            </div>
            <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
              <Building2 className="size-5" />
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
              placeholder="Cari keterangan, kategori, nama vendor, tiket pemeliharaan, atau nomor kamar..."
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
              onClick={() => {
                setEditItem(null);
                setCreateModalOpen(true);
              }}
              className="bg-teal-700 hover:bg-teal-800 text-white font-medium shadow-xs"
            >
              <Plus className="mr-1.5 size-4" />
              <span>Catat Pengeluaran Baru</span>
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
          {/* View mode toggle */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => {
                setViewMode("expenses");
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === "expenses"
                  ? "bg-white text-rose-800 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Pengeluaran Operasional
            </button>
            <button
              onClick={() => {
                setViewMode("all");
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === "all"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Semua Arus Kas
            </button>
            <button
              onClick={() => {
                setViewMode("incomes");
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === "incomes"
                  ? "bg-white text-emerald-800 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Pemasukan Saja
            </button>
          </div>

          {/* Category Dropdown */}
          <Select
            value={categoryFilter}
            onValueChange={(val) => {
              if (val) setCategoryFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8.5 w-[150px] text-xs">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              <SelectItem value="Utilitas">Utilitas (Listrik/Air/Wifi)</SelectItem>
              <SelectItem value="Pemeliharaan">Pemeliharaan &amp; Servis</SelectItem>
              <SelectItem value="Gaji">Gaji &amp; Upah Staf</SelectItem>
              <SelectItem value="Kebersihan">Kebersihan &amp; Sampah</SelectItem>
              <SelectItem value="Pajak">Pajak &amp; Legal</SelectItem>
              <SelectItem value="Pemasaran">Pemasaran &amp; Komisi</SelectItem>
              <SelectItem value="Refund">Refund Pembayaran</SelectItem>
              <SelectItem value="Lainnya">Lain-lain</SelectItem>
            </SelectContent>
          </Select>

          {/* Property Dropdown */}
          {propertiList.length > 0 && (
            <Select
              value={propertyFilter}
              onValueChange={(val) => {
                if (val) setPropertyFilter(val);
                setRoomFilter("all");
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8.5 w-[140px] text-xs">
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

          {/* Room Dropdown */}
          <Select
            value={roomFilter}
            onValueChange={(val) => {
              if (val) setRoomFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8.5 w-[130px] text-xs">
              <SelectValue placeholder="Semua Kamar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kamar</SelectItem>
              {kamarList
                .filter((k) => propertyFilter === "all" || k.propertiId === propertyFilter)
                .map((k) => (
                  <SelectItem key={k.id} value={k.id}>
                    Kamar {k.nomor}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {/* Vendor Dropdown */}
          {vendorList.length > 0 && (
            <Select
              value={vendorFilter}
              onValueChange={(val) => {
                if (val) setVendorFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8.5 w-[140px] text-xs">
                <SelectValue placeholder="Semua Vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Vendor</SelectItem>
                {vendorList.map((v) => (
                  <SelectItem key={v.id} value={v.name}>
                    {v.name} ({v.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Date Presets */}
          <Select
            value={datePreset}
            onValueChange={(val: any) => {
              if (val) setDatePreset(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8.5 w-[130px] text-xs">
              <SelectValue placeholder="Waktu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">Bulan Ini</SelectItem>
              <SelectItem value="last_month">Bulan Lalu</SelectItem>
              <SelectItem value="this_year">Tahun Ini</SelectItem>
              <SelectItem value="all">Semua Waktu</SelectItem>
            </SelectContent>
          </Select>

          {/* Reset button */}
          {(search || categoryFilter !== "all" || propertyFilter !== "all" || roomFilter !== "all" || vendorFilter !== "all" || datePreset !== "this_month") && (
            <button
              onClick={() => {
                setSearch("");
                setCategoryFilter("all");
                setPropertyFilter("all");
                setRoomFilter("all");
                setVendorFilter("all");
                setDatePreset("this_month");
                setPage(1);
              }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* ── Expense List Table ───────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Tanggal</th>
                <th className="px-5 py-3.5">Kategori &amp; Jenis</th>
                <th className="px-5 py-3.5">Unit &amp; Properti</th>
                <th className="px-5 py-3.5">Vendor / Tiket Terkait</th>
                <th className="px-5 py-3.5">Keterangan &amp; Bukti</th>
                <th className="px-5 py-3.5 text-right">Nominal</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <TrendingDown className="size-6" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-900">
                      Tidak ada catatan pengeluaran yang sesuai
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Coba sesuaikan filter pencarian Anda atau catat transaksi pengeluaran baru.
                    </p>
                    <Button
                      onClick={() => setCreateModalOpen(true)}
                      className="mt-4 bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium"
                    >
                      <Plus className="mr-1.5 size-3.5" />
                      Catat Pengeluaran Baru
                    </Button>
                  </td>
                </tr>
              ) : (
                paginatedList.map((t) => {
                  const isExpense = t.jenis === "pengeluaran";
                  const parsed = parseExpenseDescription(t.keterangan);

                  return (
                    <tr
                      key={t.id}
                      className="group transition-colors hover:bg-slate-50/70 cursor-pointer"
                      onClick={() => setDetailItem(t)}
                    >
                      {/* Tanggal */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="text-xs font-medium text-slate-800">{formatTanggal(t.tanggal)}</p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          ID: {t.id.slice(0, 8)}...
                        </p>
                      </td>

                      {/* Kategori & Jenis */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                              isExpense
                                ? "bg-rose-50 text-rose-800 border border-rose-200"
                                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            {t.kategori}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {isExpense ? "Kas Keluar" : "Kas Masuk"}
                        </p>
                      </td>

                      {/* Unit & Properti */}
                      <td className="px-5 py-4">
                        {t.kamar ? (
                          <>
                            <p className="font-semibold text-slate-900 text-xs">
                              Kamar {t.kamar.nomor}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {t.kamar.properti?.nama || "Kost Properti"}
                            </p>
                          </>
                        ) : (
                          <span className="text-xs text-slate-500 font-medium">
                            Umum / Beban Gedung
                          </span>
                        )}
                      </td>

                      {/* Vendor / Tiket Terkait */}
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col gap-1 text-xs">
                          {parsed.vendorName ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                              <Users className="size-3 text-slate-400" />
                              <span className="truncate max-w-[130px]">{parsed.vendorName}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">-</span>
                          )}

                          {parsed.maintenanceTitle && (
                            <span
                              className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200 truncate max-w-[150px]"
                              title={parsed.maintenanceTitle}
                            >
                              <Wrench className="size-2.5 text-amber-600" />
                              <span>{parsed.maintenanceTitle}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Keterangan & Bukti */}
                      <td className="px-5 py-4">
                        <p className="text-xs text-slate-700 line-clamp-1 max-w-[200px]" title={parsed.cleanDescription}>
                          {parsed.cleanDescription}
                        </p>
                        {parsed.receiptUrl && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewReceiptUrl({
                                url: parsed.receiptUrl!,
                                title: `${t.kategori} - ${formatRupiah(t.jumlah)}`,
                              });
                            }}
                            className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 hover:underline"
                          >
                            <ImageIcon className="size-3" />
                            <span>Lihat Nota / Struk</span>
                          </button>
                        )}
                      </td>

                      {/* Nominal */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <p
                          className={`font-semibold text-sm ${
                            isExpense ? "text-rose-600" : "text-emerald-600"
                          }`}
                        >
                          {isExpense ? "-" : "+"} {formatRupiah(t.jumlah)}
                        </p>
                      </td>

                      {/* Aksi */}
                      <td className="px-5 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDetailItem(t)}
                            className="h-8 px-2 text-xs text-slate-600 hover:text-slate-900"
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
                            <DropdownMenuContent align="end" className="w-44 text-xs">
                              <DropdownMenuItem onClick={() => setDetailItem(t)}>
                                <Eye className="mr-2 size-3.5" />
                                <span>Rincian Biaya</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => {
                                  setEditItem(t);
                                  setCreateModalOpen(true);
                                }}
                              >
                                <Pencil className="mr-2 size-3.5" />
                                <span>Edit Transaksi</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => setDeleteItemTarget(t)}
                                className="text-rose-600 focus:text-rose-600"
                              >
                                <Trash2 className="mr-2 size-3.5" />
                                <span>Hapus Transaksi</span>
                              </DropdownMenuItem>
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
              {Math.min(page * itemsPerPage, filteredList.length)} dari {filteredList.length} transaksi
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
      {/* MODAL 1: FORM CATAT / EDIT PENGELUARAN                             */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {createModalOpen && (
        <ExpenseFormModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          initialData={editItem}
          kamarList={kamarList}
          propertiList={propertiList}
          vendorList={vendorList}
          pemeliharaanList={pemeliharaanList}
          onSuccess={() => {
            setCreateModalOpen(false);
            setEditItem(null);
            router.refresh();
          }}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: DETAIL EXPENSE 360°                                       */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {detailItem && (
        <ExpenseDetailModal
          item={detailItem}
          open={!!detailItem}
          onOpenChange={(open) => !open && setDetailItem(null)}
          onEdit={() => {
            setEditItem(detailItem);
            setCreateModalOpen(true);
            setDetailItem(null);
          }}
          onDelete={() => {
            setDeleteItemTarget(detailItem);
            setDetailItem(null);
          }}
          onPreviewReceipt={(url, title) => setPreviewReceiptUrl({ url, title })}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: RECEIPT PREVIEW MODAL                                     */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {previewReceiptUrl && (
        <Dialog open={!!previewReceiptUrl} onOpenChange={(open) => !open && setPreviewReceiptUrl(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <ImageIcon className="size-4 text-teal-700" />
                <span>Bukti Kwitansi / Struk Nota</span>
              </DialogTitle>
              <DialogDescription className="text-xs truncate">
                {previewReceiptUrl.title}
              </DialogDescription>
            </DialogHeader>

            <div className="py-2">
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center min-h-[300px] max-h-[500px]">
                {previewReceiptUrl.url.startsWith("http") || previewReceiptUrl.url.startsWith("/") ? (
                  <img
                    src={previewReceiptUrl.url}
                    alt="Bukti kwitansi pengeluaran"
                    className="max-h-[480px] w-auto object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="text-center p-6 text-xs text-slate-500">
                    <FileText className="size-10 mx-auto text-slate-400 mb-2" />
                    <p className="font-semibold text-slate-700">Tautan Dokumen / Referensi</p>
                    <p className="mt-1 font-mono text-slate-600 break-all">{previewReceiptUrl.url}</p>
                    <a
                      href={previewReceiptUrl.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800"
                    >
                      <ExternalLink className="size-3.5" />
                      <span>Buka di Tab Baru</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setPreviewReceiptUrl(null)}>
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 4: DELETE CONFIRMATION                                       */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {deleteItemTarget && (
        <AlertDialog open={!!deleteItemTarget} onOpenChange={(open) => !open && setDeleteItemTarget(null)}>
          <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                  <AlertCircle className="size-5" />
                </div>
                <div>
                  <AlertDialogTitle>Hapus Catatan Transaksi?</AlertDialogTitle>
                  <AlertDialogDescription className="text-xs text-slate-500">
                    Tindakan ini akan menghapus transaksi kas sebesar{" "}
                    <strong>{formatRupiah(deleteItemTarget.jumlah)}</strong> ({deleteItemTarget.kategori})
                    secara permanen.
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isPending}
                className="bg-rose-600 hover:bg-rose-700 text-xs font-medium"
              >
                {isPending ? "Menghapus..." : "Ya, Hapus Transaksi"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: ExpenseFormModal (Create / Edit with Maintenance & Vendor Link)
// ─────────────────────────────────────────────────────────────────────────────

interface ExpenseFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: TransaksiWithRelasi | null;
  kamarList: Array<Kamar & { properti?: { id?: string; nama: string } | null }>;
  propertiList: Array<{ id: string; nama: string }>;
  vendorList: VendorSimple[];
  pemeliharaanList: PemeliharaanSimple[];
  onSuccess: () => void;
}

function ExpenseFormModal({
  open,
  onOpenChange,
  initialData,
  kamarList,
  propertiList,
  vendorList,
  pemeliharaanList,
  onSuccess,
}: ExpenseFormModalProps) {
  const isEditing = !!initialData;
  const parsed = useMemo(
    () => (initialData ? parseExpenseDescription(initialData.keterangan) : null),
    [initialData]
  );

  const [jenis, setJenis] = useState<"pengeluaran" | "pemasukan">(
    initialData?.jenis === "pemasukan" ? "pemasukan" : "pengeluaran"
  );
  const [kategori, setKategori] = useState(initialData?.kategori || "Utilitas: Listrik & PLN");
  const [jumlahStr, setJumlahStr] = useState(initialData ? String(initialData.jumlah) : "");
  const [tanggal, setTanggal] = useState(
    initialData ? new Date(initialData.tanggal).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [propertiId, setPropertiId] = useState(
    initialData?.kamar?.properti?.id || "none"
  );
  const [kamarId, setKamarId] = useState(initialData?.kamarId || "none");
  const [vendorName, setVendorName] = useState(parsed?.vendorName || "");
  const [maintenanceId, setMaintenanceId] = useState(parsed?.maintenanceTicketId || "none");
  const [receiptUrl, setReceiptUrl] = useState(parsed?.receiptUrl || "");
  const [keterangan, setKeterangan] = useState(parsed?.cleanDescription || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // When a maintenance ticket is selected, automatically pre-fill unit, category, and vendor!
  const handleSelectMaintenance = (ticketId: string) => {
    setMaintenanceId(ticketId);
    if (ticketId === "none") return;

    const ticket = pemeliharaanList.find((p) => p.id === ticketId);
    if (ticket) {
      setKategori("Pemeliharaan: " + ticket.kategori);
      if (ticket.kamarId) {
        setKamarId(ticket.kamarId);
        const kmr = kamarList.find((k) => k.id === ticket.kamarId);
        if (kmr?.propertiId) {
          setPropertiId(kmr.propertiId);
        }
      }
      if (ticket.vendorId) {
        const vnd = vendorList.find((v) => v.id === ticket.vendorId);
        if (vnd) {
          setVendorName(vnd.name);
        }
      }
      if (!keterangan.trim()) {
        setKeterangan(`Perbaikan tiket: ${ticket.judul}`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(jumlahStr) || 0;
    if (amount <= 0) {
      toast.error("Nominal transaksi harus lebih besar dari Rp 0");
      return;
    }
    if (!kategori.trim()) {
      toast.error("Kategori transaksi wajib diisi");
      return;
    }

    const selectedTicket = pemeliharaanList.find((p) => p.id === maintenanceId);
    const formattedKeterangan = formatExpenseDescription({
      keterangan: keterangan.trim(),
      vendorName: vendorName.trim() || undefined,
      maintenanceTicketId: maintenanceId !== "none" ? maintenanceId : undefined,
      maintenanceTitle: selectedTicket?.judul,
      receiptUrl: receiptUrl.trim() || undefined,
    });

    const payload: TransaksiInput = {
      jenis,
      kategori: kategori.trim(),
      jumlah: amount,
      tanggal,
      keterangan: formattedKeterangan,
      kamarId: kamarId !== "none" ? kamarId : undefined,
    };

    setIsSubmitting(true);
    try {
      if (isEditing && initialData) {
        await updateTransaksi(initialData.id, payload);
        toast.success("Catatan transaksi berhasil diperbarui");
      } else {
        await createTransaksi(payload);
        toast.success("Pengeluaran kas berhasil dicatat");
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan transaksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <TrendingDown className="size-5 text-rose-600" />
            <span>{isEditing ? "Edit Catatan Pengeluaran" : "Catat Pengeluaran Operasional"}</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Rekam biaya utilitas, servis teknisi, gaji staf, atau perbaikan kamar kos secara terstruktur.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Jenis & Kategori */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-xs font-semibold">
                Kategori Operasional <span className="text-rose-500">*</span>
              </Label>
              <Select value={kategori} onValueChange={(val) => val && setKategori(val)}>
                <SelectTrigger id="category" className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-xs font-semibold">
                Nominal Biaya (Rp) <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                min="1"
                placeholder="Contoh: 350000"
                value={jumlahStr}
                onChange={(e) => setJumlahStr(e.target.value)}
                className="text-xs font-semibold"
                required
              />
              {Number(jumlahStr) > 0 && (
                <p className="text-[11px] text-slate-500">{formatRupiah(Number(jumlahStr))}</p>
              )}
            </div>
          </div>

          {/* Tanggal & Link Maintenance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date" className="text-xs font-semibold">
                Tanggal Pengeluaran <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="maintenance-link" className="text-xs font-semibold flex items-center justify-between">
                <span>Tautkan Tiket Pemeliharaan</span>
                <span className="text-[10px] text-slate-400 font-normal">Opsional</span>
              </Label>
              <Select
                value={maintenanceId}
                onValueChange={(val) => {
                  if (val) handleSelectMaintenance(val);
                }}
              >
                <SelectTrigger id="maintenance-link" className="text-xs">
                  <SelectValue placeholder="Pilih tiket jika ada..." />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  <SelectItem value="none">-- Tidak ditautkan ke tiket --</SelectItem>
                  {pemeliharaanList.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.judul} ({p.kamar?.nomor ? `Kamar ${p.kamar.nomor}` : p.kategori})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Properti & Unit Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100 pt-3">
            <div className="space-y-1.5">
              <Label htmlFor="property-select" className="text-xs font-semibold">
                Properti Terkait
              </Label>
              <Select
                value={propertiId}
                onValueChange={(val) => {
                  if (val) {
                    setPropertiId(val);
                    setKamarId("none");
                  }
                }}
              >
                <SelectTrigger id="property-select" className="text-xs">
                  <SelectValue placeholder="Pilih properti..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Beban Umum / Seluruh Gedung --</SelectItem>
                  {propertiList.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="room-select" className="text-xs font-semibold">
                Unit Kamar Spesifik
              </Label>
              <Select
                value={kamarId}
                onValueChange={(val) => {
                  if (val) setKamarId(val);
                }}
              >
                <SelectTrigger id="room-select" className="text-xs">
                  <SelectValue placeholder="Pilih kamar..." />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  <SelectItem value="none">-- Bukan Beban Kamar Spesifik --</SelectItem>
                  {kamarList
                    .filter((k) => propertiId === "none" || k.propertiId === propertiId)
                    .map((k) => (
                      <SelectItem key={k.id} value={k.id} className="text-xs">
                        Kamar {k.nomor} {k.properti?.nama && `(${k.properti.nama})`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Vendor & Receipt URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="vendor" className="text-xs font-semibold">
                Penyedia Jasa / Vendor / Toko
              </Label>
              <div className="flex gap-1.5">
                <Input
                  id="vendor"
                  placeholder="Contoh: Teknisi AC Berkah / Toko Bangunan Jaya"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="text-xs"
                />
                {vendorList.length > 0 && (
                  <Select
                    value="select-vendor"
                    onValueChange={(val) => {
                      if (val && val !== "select-vendor") setVendorName(val);
                    }}
                  >
                    <SelectTrigger className="w-10 px-2 text-xs" title="Pilih dari daftar vendor">
                      <Users className="size-3.5 text-slate-500" />
                    </SelectTrigger>
                    <SelectContent align="end">
                      <SelectItem value="select-vendor" disabled>
                        Pilih Vendor Terdaftar:
                      </SelectItem>
                      {vendorList.map((v) => (
                        <SelectItem key={v.id} value={v.name} className="text-xs">
                          {v.name} ({v.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="receipt-url" className="text-xs font-semibold">
                Tautan Bukti Nota / Foto Kwitansi
              </Label>
              <Input
                id="receipt-url"
                placeholder="https://... atau /uploads/struk-01.jpg"
                value={receiptUrl}
                onChange={(e) => setReceiptUrl(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>

          {/* Keterangan / Deskripsi */}
          <div className="space-y-1.5 border-t border-slate-100 pt-3">
            <Label htmlFor="description" className="text-xs font-semibold">
              Keterangan &amp; Rincian Pengeluaran <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Jelaskan kebutuhan pengeluaran ini secara rinci..."
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="text-xs h-20"
              required
            />
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
              disabled={isSubmitting || !jumlahStr || Number(jumlahStr) <= 0}
              className="bg-teal-700 hover:bg-teal-800 text-white font-medium"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="size-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </span>
              ) : (
                <span>{isEditing ? "Simpan Perubahan" : "Simpan Pengeluaran"}</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: ExpenseDetailModal (360° Breakdown & Printable Proof)
// ─────────────────────────────────────────────────────────────────────────────

interface ExpenseDetailModalProps {
  item: TransaksiWithRelasi;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  onPreviewReceipt: (url: string, title: string) => void;
}

function ExpenseDetailModal({
  item,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onPreviewReceipt,
}: ExpenseDetailModalProps) {
  const isExpense = item.jenis === "pengeluaran";
  const parsed = useMemo(() => parseExpenseDescription(item.keterangan), [item.keterangan]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <FileText className="size-5 text-teal-700" />
              <span>Rincian Transaksi Kas</span>
            </DialogTitle>
            <Badge
              className={
                isExpense
                  ? "bg-rose-100 text-rose-900 border-rose-300"
                  : "bg-emerald-100 text-emerald-900 border-emerald-300"
              }
            >
              {isExpense ? "Kas Keluar" : "Kas Masuk"}
            </Badge>
          </div>
          <DialogDescription className="text-xs font-mono">
            ID: {item.id} • Tanggal Transaksi: {formatTanggal(item.tanggal)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          {/* Main Amount Card */}
          <div
            className={`rounded-2xl border p-4 text-center ${
              isExpense ? "border-rose-200 bg-rose-50/60" : "border-emerald-200 bg-emerald-50/60"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Nominal
            </p>
            <p
              className={`mt-1 text-3xl font-extrabold ${
                isExpense ? "text-rose-700" : "text-emerald-700"
              }`}
            >
              {isExpense ? "-" : "+"} {formatRupiah(item.jumlah)}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-700">{item.kategori}</p>
          </div>

          {/* Attribute Breakdown */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/70">
              <span className="text-slate-500">Unit Properti:</span>
              <span className="font-semibold text-slate-800">
                {item.kamar ? (
                  `Kamar ${item.kamar.nomor} (${item.kamar.properti?.nama || "Kost Properti"})`
                ) : (
                  "Beban Gedung Umum"
                )}
              </span>
            </div>

            {parsed.vendorName && (
              <div className="flex justify-between items-center py-1 border-b border-slate-200/70">
                <span className="text-slate-500">Vendor / Teknisi:</span>
                <span className="font-semibold text-slate-800">{parsed.vendorName}</span>
              </div>
            )}

            {parsed.maintenanceTitle && (
              <div className="flex justify-between items-center py-1 border-b border-slate-200/70">
                <span className="text-slate-500">Tiket Pemeliharaan:</span>
                <span className="font-semibold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded">
                  {parsed.maintenanceTitle}
                </span>
              </div>
            )}

            <div className="py-1">
              <span className="text-slate-500 block mb-1">Keterangan Lengkap:</span>
              <p className="text-slate-800 font-medium bg-white p-2.5 rounded-lg border border-slate-200">
                {parsed.cleanDescription}
              </p>
            </div>

            {parsed.receiptUrl && (
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500">Bukti Struk / Nota:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPreviewReceipt(parsed.receiptUrl!, `${item.kategori} - ${formatRupiah(item.jumlah)}`)}
                  className="h-7 text-xs border-teal-300 text-teal-800 hover:bg-teal-50"
                >
                  <ImageIcon className="mr-1.5 size-3" />
                  Pratinjau Nota
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between border-t border-slate-100 pt-3">
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            className="bg-rose-600 hover:bg-rose-700 text-xs font-medium"
          >
            <Trash2 className="mr-1 size-3.5" />
            Hapus
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onEdit} className="text-xs font-medium">
              <Pencil className="mr-1 size-3.5" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs font-medium">
              Tutup
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
