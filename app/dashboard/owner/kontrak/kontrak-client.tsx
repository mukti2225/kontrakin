"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  Plus,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  MoreVertical,
  XCircle,
  Building,
  Download,
  RotateCw,
  Eye,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  Clock3,
} from "lucide-react";

import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DestructiveDialog } from "@/components/ui/destructive-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DataTablePagination,
  ColumnVisibilityToggle,
  BulkActionBar,
} from "@/components/ui/data-table-controls";
import { SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { formatRupiah } from "@/lib/utils";
import { exportToCSV } from "@/lib/utils/export-csv";

import {
  createLease,
  renewLease,
  updateLeaseStatus,
  getLeaseList,
} from "./action";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LeaseItem = Awaited<ReturnType<typeof getLeaseList>>[number];

interface KontrakClientProps {
  initialLeases: LeaseItem[];
  kamars: any[];
  penghunis: any[];
  propertis?: any[];
}

export function KontrakClient({
  initialLeases,
  kamars,
  penghunis,
  propertis = [],
}: KontrakClientProps) {
  const searchParams = useSearchParams();
  const initialFilter = searchParams?.get("filter") || "all";

  const [leases, setLeases] = useState<LeaseItem[]>(initialLeases);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter);
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [isPending, startTransition] = useTransition();

  // Wizard Buat Kontrak Baru
  const [formOpen, setFormOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Fields
  const [selectedPropertiId, setSelectedPropertiId] = useState<string>("all");
  const [selectedKamarId, setSelectedKamarId] = useState("");
  const [selectedPenghuniId, setSelectedPenghuniId] = useState("");
  const [nomorKontrak, setNomorKontrak] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [billingFrequency, setBillingFrequency] = useState<"monthly" | "quarterly" | "yearly">("monthly");
  const [billingDay, setBillingDay] = useState<number>(1);
  const [rentAmount, setRentAmount] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [depositReceived, setDepositReceived] = useState(true);
  const [sendPortalAccess, setSendPortalAccess] = useState(true);
  const [notes, setNotes] = useState("");

  // Detail Modal & Linimasa
  const [detailLease, setDetailLease] = useState<LeaseItem | null>(null);

  // Renewal Modal
  const [renewTarget, setRenewTarget] = useState<LeaseItem | null>(null);
  const [renewEndDate, setRenewEndDate] = useState("");
  const [renewRentAmount, setRenewRentAmount] = useState<number>(0);
  const [renewDepositAmount, setRenewDepositAmount] = useState<number>(0);
  const [renewNotes, setRenewNotes] = useState("");
  const [isRenewing, setIsRenewing] = useState(false);

  // Terminate Modal
  const [terminateTarget, setTerminateTarget] = useState<LeaseItem | null>(null);

  // ─── Helpers & Calculations ──────────────────────────────────────────────────

  function setDurationMonths(months: number) {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);
    setEndDate(end.toISOString().slice(0, 10));
  }

  function handleKamarChange(kamarId: string) {
    setSelectedKamarId(kamarId);
    const selected = kamars.find((k) => k.id === kamarId);
    if (selected) {
      setRentAmount(selected.hargaBulanan);
      setDepositAmount(selected.hargaBulanan); // default deposit 1 bulan
    }
  }

  // Selected Entities
  const selectedKamar = kamars.find((k) => k.id === selectedKamarId);
  const selectedPenghuni = penghunis.find((p) => p.id === selectedPenghuniId);

  // Filtered rooms for create wizard
  const availableRoomsForCreate = useMemo(() => {
    return kamars.filter((k) => {
      if (selectedPropertiId !== "all" && k.propertiId !== selectedPropertiId) {
        return false;
      }
      return true;
    });
  }, [kamars, selectedPropertiId]);

  // Conflict warning on chosen room
  const hasConflict = useMemo(() => {
    if (!selectedKamarId) return false;
    return leases.some((l) => l.kamarId === selectedKamarId && l.status === "active");
  }, [leases, selectedKamarId]);

  // Statistics KPIs
  const stats = useMemo(() => {
    const total = leases.length;
    const active = leases.filter((l) => l.status === "active").length;
    const expiring = leases.filter((l) => {
      const days = Math.ceil(
        (new Date(l.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return l.status === "active" && days <= 30 && days >= 0;
    }).length;
    const renewed = leases.filter((l) => l.status === "renewed").length;
    const completed = leases.filter(
      (l) => l.status === "completed" || l.status === "terminated"
    ).length;

    return { total, active, expiring, renewed, completed };
  }, [leases]);

  // Filtered leases
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return leases.filter((lease) => {
      // 1. Text Search
      const matchSearch =
        !q ||
        lease.nomorKontrak?.toLowerCase().includes(q) ||
        lease.penghuni?.nama?.toLowerCase().includes(q) ||
        lease.kamar?.nomor?.toLowerCase().includes(q) ||
        lease.kamar?.properti?.nama?.toLowerCase().includes(q);

      if (!matchSearch) return false;

      // 2. Property Filter
      if (propertyFilter !== "all" && lease.kamar?.properti?.id !== propertyFilter) {
        return false;
      }

      // 3. Status Filter
      if (statusFilter === "all") return true;
      if (statusFilter === "active") return lease.status === "active";
      if (statusFilter === "expiring") {
        const daysLeft = Math.ceil(
          (new Date(lease.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return lease.status === "active" && daysLeft <= 30 && daysLeft >= 0;
      }
      if (statusFilter === "renewed") return lease.status === "renewed";
      if (statusFilter === "terminated") {
        return lease.status === "completed" || lease.status === "terminated";
      }

      return true;
    });
  }, [leases, search, statusFilter, propertyFilter]);

  // ─── Table Usability & Responsive Data Views (Batch 19) ──────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState({
    nomorKontrak: true,
    penghuni: true,
    kamar: true,
    masaSewa: true,
    tarif: true,
    jaminan: true,
    status: true,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, propertyFilter]);

  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const allPageSelected =
    paginatedList.length > 0 && paginatedList.every((l) => selectedIds.has(l.id));

  function handleToggleSelectAll() {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedList.forEach((l) => next.delete(l.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedList.forEach((l) => next.add(l.id));
        return next;
      });
    }
  }

  function handleToggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSelectAllFiltered() {
    setSelectedIds(new Set(filtered.map((l) => l.id)));
  }

  function handleExportSelected() {
    const selectedData = leases.filter((l) => selectedIds.has(l.id));
    if (selectedData.length === 0) return;
    const headers = [
      "No. Kontrak",
      "Penyewa",
      "Nomor WhatsApp",
      "Properti",
      "Kamar",
      "Tanggal Mulai",
      "Tanggal Selesai",
      "Tarif Bulanan (Rp)",
      "Uang Jaminan (Rp)",
      "Status",
    ];
    const rows = selectedData.map((l) => [
      l.nomorKontrak || l.id.slice(0, 8),
      l.penghuni?.nama || "-",
      l.penghuni?.noHp || "-",
      l.kamar?.properti?.nama || "-",
      l.kamar ? `Kamar ${l.kamar.nomor}` : "-",
      new Date(l.startDate).toLocaleDateString("id-ID"),
      new Date(l.endDate).toLocaleDateString("id-ID"),
      Number(l.rentAmount),
      Number(l.depositAmount),
      l.status,
    ]);
    exportToCSV(`kontrak_terpilih_${selectedData.length}`, headers, rows);
    toast.success(`${selectedData.length} kontrak terpilih berhasil diekspor ke CSV`);
  }

  // ─── Actions ─────────────────────────────────────────────────────────────────

  function handleOpenCreate() {
    setSelectedPropertiId("all");
    setSelectedKamarId("");
    setSelectedPenghuniId("");
    setNomorKontrak("");
    setStartDate(new Date().toISOString().slice(0, 10));
    const defaultEnd = new Date();
    defaultEnd.setFullYear(defaultEnd.getFullYear() + 1);
    setEndDate(defaultEnd.toISOString().slice(0, 10));
    setBillingFrequency("monthly");
    setBillingDay(1);
    setRentAmount(0);
    setDepositAmount(0);
    setDepositReceived(true);
    setSendPortalAccess(true);
    setNotes("");
    setWizardStep(1);
    setFormOpen(true);
  }

  function handleCreateSubmit() {
    if (!selectedPenghuniId || !selectedKamarId) {
      toast.error("Pilih penyewa dan unit kamar terlebih dahulu");
      setWizardStep(1);
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      toast.error("Tanggal selesai sewa harus setelah tanggal mulai");
      setWizardStep(2);
      return;
    }

    if (rentAmount <= 0) {
      toast.error("Biaya sewa pokok per bulan harus lebih dari Rp 0");
      setWizardStep(3);
      return;
    }

    startTransition(async () => {
      try {
        const newLease = await createLease({
          penghuniId: selectedPenghuniId,
          kamarId: selectedKamarId,
          nomorKontrak,
          startDate,
          endDate,
          billingFrequency,
          billingDay,
          rentAmount,
          depositAmount,
          depositReceived,
          notes,
          sendPortalAccess,
          originUrl: window.location.origin,
        });

        setLeases((prev) => [newLease as LeaseItem, ...prev]);
        setFormOpen(false);
        const toastMsg = sendPortalAccess
          ? `Kontrak sewa ${newLease.nomorKontrak} aktif & Akses Tenant Portal berhasil dikirim via WhatsApp!`
          : `Kontrak sewa ${newLease.nomorKontrak} berhasil diaktifkan`;
        toast.success(toastMsg);
      } catch (err: any) {
        toast.error(err.message || "Gagal membuat kontrak sewa");
      }
    });
  }

  function handleOpenRenew(lease: LeaseItem) {
    setRenewTarget(lease);
    const oldEnd = new Date(lease.endDate);
    const newEnd = new Date(oldEnd);
    newEnd.setFullYear(newEnd.getFullYear() + 1); // default +1 year
    setRenewEndDate(newEnd.toISOString().slice(0, 10));
    setRenewRentAmount(lease.rentAmount);
    setRenewDepositAmount(lease.depositAmount);
    setRenewNotes(`Perpanjangan sewa dari kontrak ${lease.nomorKontrak}`);
  }

  async function handleConfirmRenew() {
    if (!renewTarget) return;

    if (new Date(renewEndDate) <= new Date(renewTarget.endDate)) {
      toast.error("Tanggal selesai perpanjangan harus setelah tanggal berakhir kontrak lama");
      return;
    }

    setIsRenewing(true);
    try {
      const renewedLease = await renewLease({
        oldLeaseId: renewTarget.id,
        newEndDate: renewEndDate,
        newRentAmount: renewRentAmount,
        newDepositAmount: renewDepositAmount,
        notes: renewNotes,
      });

      // Update state
      setLeases((prev) => [
        renewedLease as LeaseItem,
        ...prev.map((l) => (l.id === renewTarget.id ? { ...l, status: "renewed" } : l)),
      ]);

      setRenewTarget(null);
      toast.success(
        `Kontrak sewa berhasil diperpanjang hingga ${new Date(renewEndDate).toLocaleDateString("id-ID")}`
      );
    } catch (err: any) {
      toast.error(err.message || "Gagal memperpanjang kontrak");
    } finally {
      setIsRenewing(false);
    }
  }

  function handleTerminateConfirm() {
    if (!terminateTarget) return;

    startTransition(async () => {
      try {
        await updateLeaseStatus(terminateTarget.id, "terminated");
        setLeases((prev) =>
          prev.map((l) =>
            l.id === terminateTarget.id ? { ...l, status: "terminated" } : l
          )
        );
        setTerminateTarget(null);
        toast.success(
          `Kontrak ${terminateTarget.nomorKontrak} berhasil diakhiri. Kamar kini kembali Kosong.`
        );
      } catch (err: any) {
        toast.error(err.message || "Gagal mengakhiri kontrak");
      }
    });
  }

  function handleExportCSV() {
    const headers = [
      "No Kontrak",
      "Penyewa",
      "No HP",
      "Kamar",
      "Properti",
      "Mulai",
      "Berakhir",
      "Tarif Bulanan",
      "Deposit",
      "Status",
    ];
    const rows = filtered.map((l) => [
      l.nomorKontrak || "-",
      l.penghuni?.nama || "-",
      l.penghuni?.noHp || "-",
      l.kamar?.nomor || "-",
      l.kamar?.properti?.nama || "-",
      new Date(l.startDate).toISOString().slice(0, 10),
      new Date(l.endDate).toISOString().slice(0, 10),
      l.rentAmount,
      l.depositAmount,
      l.status,
    ]);
    exportToCSV("daftar_kontrak_lengkap", headers, rows);
    toast.success("Daftar kontrak berhasil diekspor ke CSV");
  }

  return (
    <div className="p-6 space-y-6">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Kontrak Sewa (Lease)
          </h1>
          <p className="text-sm text-slate-500">
            Kelola siklus hidup perjanjian sewa legal, perpanjangan sewa, jatuh tempo, dan deposit jaminan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="mr-1.5 size-3.5" />
            Ekspor CSV
          </Button>
          <Button
            onClick={handleOpenCreate}
            className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-sm"
          >
            <Plus className="mr-1.5 size-3.5" /> Buat Kontrak Baru
          </Button>
        </div>
      </div>

      {/* ── Expiring Soon Alert Banner ────────────────────────────── */}
      {stats.expiring > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Clock3 className="size-5" />
            </div>
            <div>
              <p className="font-bold text-amber-900 text-sm">
                Ada {stats.expiring} kontrak sewa yang segera berakhir dalam 30 hari ke depan
              </p>
              <p className="text-xs text-amber-700">
                Lakukan konfirmasi perpanjangan sewa atau persiapkan inspeksi akhir kamar.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setStatusFilter("expiring")}
            className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shrink-0"
          >
            Tampilkan Kontrak Segera Berakhir
          </Button>
        </div>
      )}

      {/* ── KPI Stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total Kontrak */}
        <div
          onClick={() => setStatusFilter("all")}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            statusFilter === "all"
              ? "border-teal-500 bg-teal-50/30 ring-1 ring-teal-400"
              : "border-slate-100 bg-white hover:border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Total Kontrak</span>
            <FileText className="size-4 text-teal-600" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">{stats.total}</p>
          <p className="mt-1 text-xs text-slate-400">Seluruh riwayat perjanjian</p>
        </div>

        {/* Kontrak Aktif */}
        <div
          onClick={() => setStatusFilter("active")}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            statusFilter === "active"
              ? "border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-400"
              : "border-slate-100 bg-white hover:border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Aktif Berjalan</span>
            <CheckCircle2 className="size-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-emerald-700">{stats.active}</p>
          <p className="mt-1 text-xs text-slate-400">Penyewa terikat kontrak</p>
        </div>

        {/* Segera Berakhir */}
        <div
          onClick={() => setStatusFilter("expiring")}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            statusFilter === "expiring"
              ? "border-amber-500 bg-amber-50/30 ring-1 ring-amber-400"
              : "border-slate-100 bg-white hover:border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Segera Berakhir</span>
            <Clock className="size-4 text-amber-500" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-amber-600">{stats.expiring}</p>
          <p className="mt-1 text-xs text-amber-600 font-medium">Kurang dari 30 hari</p>
        </div>

        {/* Selesai / Diperpanjang */}
        <div
          onClick={() => setStatusFilter("terminated")}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            statusFilter === "terminated"
              ? "border-slate-500 bg-slate-50/60 ring-1 ring-slate-400"
              : "border-slate-100 bg-white hover:border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Selesai / Berhenti</span>
            <XCircle className="size-4 text-slate-500" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-700">{stats.completed}</p>
          <p className="mt-1 text-xs text-slate-400">Riwayat kontrak lampau</p>
        </div>
      </div>

      {/* ── Filter Bar ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1">
          {[
            { id: "all", label: `Semua (${stats.total})` },
            { id: "active", label: `Aktif (${stats.active})` },
            { id: "expiring", label: `Segera Berakhir (${stats.expiring})` },
            { id: "renewed", label: `Diperpanjang (${stats.renewed})` },
            { id: "terminated", label: `Selesai (${stats.completed})` },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setStatusFilter(pill.id)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                statusFilter === pill.id
                  ? "bg-white text-teal-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Search, Column Toggle & Property Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {propertis.length > 0 && (
            <Select
              value={propertyFilter}
              onValueChange={(val) => setPropertyFilter(val ?? "all")}
            >
              <SelectTrigger className="h-9 w-44 rounded-xl border-slate-200 text-xs">
                <SelectValue placeholder="Semua Properti" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Semua Properti</SelectItem>
                {propertis.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari kontrak, penyewa, kamar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 rounded-xl border-slate-200 bg-slate-50/50 text-xs focus:bg-white"
            />
          </div>

          {/* Column Visibility Selector */}
          <ColumnVisibilityToggle
            columns={[
              { key: "nomorKontrak", label: "No. Kontrak", visible: visibleColumns.nomorKontrak },
              { key: "penghuni", label: "Penyewa", visible: visibleColumns.penghuni },
              { key: "kamar", label: "Kamar & Properti", visible: visibleColumns.kamar },
              { key: "masaSewa", label: "Masa Sewa & Sisa Hari", visible: visibleColumns.masaSewa },
              { key: "tarif", label: "Tarif / Bulan", visible: visibleColumns.tarif },
              { key: "jaminan", label: "Uang Jaminan", visible: visibleColumns.jaminan },
              { key: "status", label: "Status Kontrak", visible: visibleColumns.status },
            ]}
            onToggle={(key) =>
              setVisibleColumns((prev: any) => ({ ...prev, [key]: !prev[key] }))
            }
          />
        </div>
      </div>

      {/* ── Floating / Sticky Bulk Action Bar ──────────────────────── */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        totalFilteredCount={filtered.length}
        onClearSelection={() => setSelectedIds(new Set())}
        onSelectAllFiltered={handleSelectAllFiltered}
        itemLabel="kontrak"
        actions={[
          {
            label: "Ekspor Terpilih (CSV)",
            icon: <Download className="size-3.5" />,
            onClick: handleExportSelected,
            variant: "default",
          },
        ]}
      />

      {/* ── Main Table Card ───────────────────────────────────────── */}
      <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <FileText className="size-6" />
              </div>
              {leases.length === 0 ? (
                <>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 mb-2 mt-4">
                    <span>Langkah 4 dari 5 Setup Portofolio</span>
                  </div>
                  <h3 className="mt-1 text-base font-semibold text-slate-800">
                    Belum ada kontrak sewa aktif
                  </h3>
                  <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
                    Buat kontrak sewa resmi pertama Anda untuk mengaitkan penyewa dengan unit kamar, menentukan durasi sewa, dan mengaktifkan tagihan otomatis.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleOpenCreate}
                      className="rounded-xl bg-teal-600 text-xs font-semibold text-white shadow-sm hover:bg-teal-700"
                    >
                      <Plus className="mr-1.5 size-3.5" /> Buat Kontrak Sewa Perdana
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
                  <h3 className="mt-3 text-base font-semibold text-slate-800">
                    Tidak ada kontrak yang cocok
                  </h3>
                  <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
                    Tidak ada kontrak sewa yang sesuai dengan filter atau kata kunci &quot;{search}&quot;.
                  </p>
                  <div className="mt-4 flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSearch("");
                        setStatusFilter("all");
                        setPropertyFilter("all");
                      }}
                      className="rounded-xl border-slate-200 text-xs text-slate-700 hover:bg-slate-50"
                    >
                      Reset Filter &amp; Pencarian
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Mobile View: Stacked Cards (Hidden on md+) */}
              <div className="md:hidden divide-y divide-slate-100">
                {paginatedList.map((lease) => {
                  const daysLeft = Math.ceil(
                    (new Date(lease.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  const isExpiring = lease.status === "active" && daysLeft <= 30 && daysLeft >= 0;
                  const isExpiredPast = lease.status === "active" && daysLeft < 0;
                  const isSelected = selectedIds.has(lease.id);

                  return (
                    <div
                      key={lease.id}
                      onClick={() => setDetailLease(lease)}
                      className={`p-4 transition-colors cursor-pointer active:bg-slate-50 ${
                        isSelected ? "bg-teal-50/40" : "bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleSelect(lease.id)}
                              aria-label={`Pilih kontrak ${lease.nomorKontrak}`}
                            />
                          </div>
                          <div>
                            <span className="font-mono text-xs font-bold text-slate-900">
                              {lease.nomorKontrak || "-"}
                            </span>
                            <div className="font-semibold text-slate-900 text-sm">
                              {lease.penghuni?.nama || "Penyewa"}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              {lease.penghuni?.noHp ? `+${lease.penghuni.noHp}` : "-"}
                            </div>
                          </div>
                        </div>

                        <div>
                          {lease.status === "active" ? (
                            isExpiring ? (
                              <StatusBadge variant="amber" dot>
                                Segera Berakhir
                              </StatusBadge>
                            ) : isExpiredPast ? (
                              <StatusBadge variant="rose" dot>
                                Kadaluarsa
                              </StatusBadge>
                            ) : (
                              <StatusBadge variant="emerald" dot>
                                Aktif
                              </StatusBadge>
                            )
                          ) : lease.status === "renewed" ? (
                            <StatusBadge variant="blue" dot>
                              Diperpanjang
                            </StatusBadge>
                          ) : lease.status === "terminated" ? (
                            <StatusBadge variant="slate">
                              Berhenti
                            </StatusBadge>
                          ) : (
                            <StatusBadge variant="slate">
                              {lease.status}
                            </StatusBadge>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-slate-600 border-t border-slate-50 pt-2.5">
                        <div className="flex items-center gap-1 font-medium">
                          <Building className="size-3.5 text-slate-400" />
                          <span>Kamar {lease.kamar?.nomor || "-"} • {lease.kamar?.properti?.nama || "Kost Utama"}</span>
                        </div>
                        <div className="font-bold text-slate-900">
                          {formatRupiah(lease.rentAmount)}
                          <span className="text-[10px] font-normal text-slate-400">/bln</span>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs">
                        <div className="text-slate-500 flex items-center gap-1">
                          <Calendar className="size-3 text-slate-400" />
                          <span>s/d {new Date(lease.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </div>
                        {isExpiring && (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
                            <Clock className="size-2.5 text-amber-600" />
                            Sisa {daysLeft} hari
                          </span>
                        )}
                        {lease.depositAmount > 0 && (
                          <span className="text-[11px] text-teal-700 font-medium">
                            Jaminan {formatRupiah(lease.depositAmount)}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-end gap-2 pt-2 border-t border-slate-50" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDetailLease(lease)}
                          className="h-7 px-2.5 rounded-lg border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Eye className="mr-1 size-3 text-slate-500" />
                          Detail
                        </Button>
                        {lease.status === "active" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenRenew(lease)}
                            className="h-7 px-2.5 rounded-lg border-teal-200 bg-teal-50/50 text-xs font-semibold text-teal-700 hover:bg-teal-100"
                          >
                            <RotateCw className="mr-1 size-3 text-teal-600" />
                            Perpanjang
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon" className="size-7 rounded-lg text-slate-500">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => setDetailLease(lease)}>
                              <Eye className="mr-2 h-3.5 w-3.5 text-slate-500" />
                              Lihat Detail &amp; Linimasa
                            </DropdownMenuItem>
                            {lease.status === "active" && (
                              <DropdownMenuItem onClick={() => handleOpenRenew(lease)}>
                                <RotateCw className="mr-2 h-3.5 w-3.5 text-teal-600" />
                                Perpanjang Sewa
                              </DropdownMenuItem>
                            )}
                            {lease.status === "active" && (
                              <DropdownMenuItem
                                onClick={() => setTerminateTarget(lease)}
                                className="text-rose-600 focus:text-rose-600"
                              >
                                <XCircle className="mr-2 h-3.5 w-3.5 text-rose-600" />
                                Akhiri Kontrak Sewa
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop View: Full Table with Sticky Header (Hidden on < md) */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs border-b border-slate-100">
                    <TableRow>
                      <TableHead className="w-10 px-4 py-3">
                        <Checkbox
                          checked={allPageSelected}
                          onCheckedChange={handleToggleSelectAll}
                          aria-label="Pilih semua baris di halaman ini"
                        />
                      </TableHead>
                      {visibleColumns.nomorKontrak && (
                        <TableHead className="px-5 py-3 text-xs font-bold text-slate-600">No. Kontrak</TableHead>
                      )}
                      {visibleColumns.penghuni && (
                        <TableHead className="px-5 py-3 text-xs font-bold text-slate-600">Penyewa</TableHead>
                      )}
                      {visibleColumns.kamar && (
                        <TableHead className="px-5 py-3 text-xs font-bold text-slate-600">Kamar &amp; Properti</TableHead>
                      )}
                      {visibleColumns.masaSewa && (
                        <TableHead className="px-5 py-3 text-xs font-bold text-slate-600">Masa Sewa &amp; Sisa Hari</TableHead>
                      )}
                      {visibleColumns.tarif && (
                        <TableHead className="px-5 py-3 text-xs font-bold text-slate-600">Tarif / Bulan</TableHead>
                      )}
                      {visibleColumns.jaminan && (
                        <TableHead className="px-5 py-3 text-xs font-bold text-slate-600">Uang Jaminan</TableHead>
                      )}
                      {visibleColumns.status && (
                        <TableHead className="px-5 py-3 text-xs font-bold text-slate-600">Status</TableHead>
                      )}
                      <TableHead className="px-5 py-3 text-xs font-bold text-slate-600 text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100">
                    {paginatedList.map((lease) => {
                      const daysLeft = Math.ceil(
                        (new Date(lease.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                      );
                      const isExpiring = lease.status === "active" && daysLeft <= 30 && daysLeft >= 0;
                      const isExpiredPast = lease.status === "active" && daysLeft < 0;
                      const isSelected = selectedIds.has(lease.id);

                      return (
                        <TableRow
                          key={lease.id}
                          onClick={() => setDetailLease(lease)}
                          className={`cursor-pointer transition-colors group ${
                            isSelected ? "bg-teal-50/40 hover:bg-teal-50/70" : "hover:bg-slate-50/80"
                          }`}
                        >
                          {/* Selection Checkbox */}
                          <TableCell className="w-10 px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleSelect(lease.id)}
                              aria-label={`Pilih ${lease.nomorKontrak}`}
                            />
                          </TableCell>

                          {/* No Kontrak */}
                          {visibleColumns.nomorKontrak && (
                            <TableCell className="px-5 py-3.5 font-mono text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                              {lease.nomorKontrak || "-"}
                            </TableCell>
                          )}

                          {/* Penyewa */}
                          {visibleColumns.penghuni && (
                            <TableCell className="px-5 py-3.5">
                              <div className="font-semibold text-slate-900 text-sm">
                                {lease.penghuni?.nama || "Penyewa"}
                              </div>
                              <div className="text-[11px] font-mono text-slate-400">
                                {lease.penghuni?.noHp ? `+${lease.penghuni.noHp}` : "-"}
                              </div>
                            </TableCell>
                          )}

                          {/* Kamar & Properti */}
                          {visibleColumns.kamar && (
                            <TableCell className="px-5 py-3.5">
                              <div className="font-bold text-slate-900 text-sm">
                                Kamar {lease.kamar?.nomor || "-"}
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-1">
                                <Building className="size-3" />
                                {lease.kamar?.properti?.nama || "Kost Utama"} (Lt. {lease.kamar?.lantai})
                              </div>
                            </TableCell>
                          )}

                          {/* Periode Sewa & Countdown */}
                          {visibleColumns.masaSewa && (
                            <TableCell className="px-5 py-3.5">
                              <div className="text-xs text-slate-700 flex items-center gap-1 font-medium">
                                <Calendar className="size-3 text-slate-400" />
                                <span>
                                  {new Date(lease.startDate).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}{" "}
                                  s/d{" "}
                                  {new Date(lease.endDate).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                              {isExpiring && (
                                <span className="inline-flex items-center gap-1 mt-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
                                  <Clock className="size-3 text-amber-600" />
                                  Sisa {daysLeft} hari lagi
                                </span>
                              )}
                              {isExpiredPast && (
                                <span className="inline-flex items-center gap-1 mt-1 rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-800 border border-rose-200">
                                  <AlertCircle className="size-3 text-rose-600" />
                                  Masa sewa telah berakhir
                                </span>
                              )}
                            </TableCell>
                          )}

                          {/* Sewa per Bulan */}
                          {visibleColumns.tarif && (
                            <TableCell className="px-5 py-3.5 font-bold text-slate-900 text-sm">
                              {formatRupiah(lease.rentAmount)}
                              <span className="text-[11px] font-normal text-slate-400">/bln</span>
                            </TableCell>
                          )}

                          {/* Deposit */}
                          {visibleColumns.jaminan && (
                            <TableCell className="px-5 py-3.5 text-xs">
                              {lease.depositAmount > 0 ? (
                                <div>
                                  <p className="font-bold text-teal-700">
                                    {formatRupiah(lease.depositAmount)}
                                  </p>
                                  <span className="inline-block mt-0.5 rounded px-1.5 py-0.5 bg-teal-50 text-[10px] font-semibold text-teal-700 border border-teal-200/50">
                                    Jaminan Disetor
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400">Tanpa Deposit</span>
                              )}
                            </TableCell>
                          )}

                          {/* Status */}
                          {visibleColumns.status && (
                            <TableCell className="px-5 py-3.5">
                              {lease.status === "active" ? (
                                isExpiring ? (
                                  <StatusBadge variant="amber" dot>
                                    Segera Berakhir
                                  </StatusBadge>
                                ) : isExpiredPast ? (
                                  <StatusBadge variant="rose" dot>
                                    Kadaluarsa
                                  </StatusBadge>
                                ) : (
                                  <StatusBadge variant="emerald" dot>
                                    Aktif
                                  </StatusBadge>
                                )
                              ) : lease.status === "renewed" ? (
                                <StatusBadge variant="blue" dot>
                                  Diperpanjang
                                </StatusBadge>
                              ) : lease.status === "terminated" ? (
                                <StatusBadge variant="slate">
                                  Berhenti
                                </StatusBadge>
                              ) : (
                                <StatusBadge variant="slate">
                                  {lease.status}
                                </StatusBadge>
                              )}
                            </TableCell>
                          )}

                          {/* Aksi Operasional */}
                          <TableCell className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDetailLease(lease)}
                                className="h-8 rounded-xl border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
                              >
                                <Eye className="mr-1 size-3 text-slate-500" />
                                Detail
                              </Button>

                              {lease.status === "active" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenRenew(lease)}
                                  className="h-8 rounded-xl border-teal-200 bg-teal-50/50 text-xs font-semibold text-teal-700 hover:bg-teal-100"
                                >
                                  <RotateCw className="mr-1 size-3 text-teal-600" />
                                  Perpanjang
                                </Button>
                              )}

                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  render={
                                    <Button variant="ghost" size="icon" className="size-8 rounded-xl text-slate-500">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  }
                                />
                                <DropdownMenuContent align="end" className="rounded-xl">
                                  <DropdownMenuItem onClick={() => setDetailLease(lease)}>
                                    <Eye className="mr-2 h-3.5 w-3.5 text-slate-500" />
                                    Lihat Detail &amp; Linimasa
                                  </DropdownMenuItem>
                                  {lease.status === "active" && (
                                    <DropdownMenuItem onClick={() => handleOpenRenew(lease)}>
                                      <RotateCw className="mr-2 h-3.5 w-3.5 text-teal-600" />
                                      Perpanjang Sewa
                                    </DropdownMenuItem>
                                  )}
                                  {lease.status === "active" && (
                                    <DropdownMenuItem
                                      onClick={() => setTerminateTarget(lease)}
                                      className="text-rose-600 focus:text-rose-600"
                                    >
                                      <XCircle className="mr-2 h-3.5 w-3.5 text-rose-600" />
                                      Akhiri Kontrak Sewa
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>

        {/* ── Table Pagination Bar ──────────────────────────────────── */}
        {filtered.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/40">
            <DataTablePagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={filtered.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              itemLabel="kontrak"
            />
          </div>
        )}
      </Card>

      {/* ── 4-Step Wizard Modal Buat Kontrak Baru ───────────────────── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Buat Kontrak Sewa Baru</DialogTitle>
            <DialogDescription>
              Ikuti 4 langkah terstruktur untuk menerbitkan perjanjian sewa dan mengikat unit kamar.
            </DialogDescription>
          </DialogHeader>

          {/* Stepper Bar */}
          <div className="grid grid-cols-4 gap-2 border-b border-slate-100 pb-3 text-center">
            {[
              { num: 1, title: "1. Unit & Penyewa" },
              { num: 2, title: "2. Periode Sewa" },
              { num: 3, title: "3. Tarif & Jaminan" },
              { num: 4, title: "4. Ringkasan" },
            ].map((s) => (
              <button
                key={s.num}
                type="button"
                onClick={() => setWizardStep(s.num as any)}
                className={`rounded-lg py-1.5 text-xs font-semibold transition ${
                  wizardStep === s.num
                    ? "bg-teal-600 text-white shadow-xs"
                    : wizardStep > s.num
                    ? "bg-teal-50 text-teal-800"
                    : "text-slate-400 bg-slate-50 hover:text-slate-700"
                }`}
              >
                {s.title}
              </button>
            ))}
          </div>

          <div className="space-y-4 py-2">
            {/* ── STEP 1: Unit & Penyewa ── */}
            {wizardStep === 1 && (
              <div className="space-y-3.5">
                {propertis.length > 0 && (
                  <div className="space-y-1.5">
                    <Label htmlFor="propertiPick">Filter Properti (Opsional)</Label>
                    <Select
                      value={selectedPropertiId}
                      onValueChange={(val) => setSelectedPropertiId(val ?? "all")}
                    >
                      <SelectTrigger id="propertiPick" className="rounded-xl">
                        <SelectValue placeholder="Pilih properti..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">Semua Properti</SelectItem>
                        {propertis.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="kamarSelect">Pilih Unit Kamar *</Label>
                  <Select
                    value={selectedKamarId}
                    onValueChange={(val) => handleKamarChange(val ?? "")}
                  >
                    <SelectTrigger id="kamarSelect" className="rounded-xl">
                      <SelectValue placeholder="Pilih unit kamar..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {availableRoomsForCreate.map((k) => (
                        <SelectItem key={k.id} value={k.id}>
                          Kamar {k.nomor} ({k.tipe}) — {k.properti?.nama ?? "Kost"} (
                          {formatRupiah(k.hargaBulanan)}/bln) — {k.status.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Conflict Notice */}
                  {hasConflict && (
                    <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200 mt-2">
                      <AlertCircle className="size-4 shrink-0 text-rose-600" />
                      <span>
                        Peringatan: Kamar ini masih terikat dengan kontrak sewa aktif. Anda tidak dapat membuat kontrak baru sampai kontrak sebelumnya diakhiri.
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="penghuniSelect">Pilih Penyewa Terdaftar *</Label>
                  <Select
                    value={selectedPenghuniId}
                    onValueChange={(val) => setSelectedPenghuniId(val ?? "")}
                  >
                    <SelectTrigger id="penghuniSelect" className="rounded-xl">
                      <SelectValue placeholder="Pilih nama penyewa..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {penghunis.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nama} ({p.noHp ? `+${p.noHp}` : "No HP kosong"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="nomorKontrak">Nomor Perjanjian Kontrak (Opsional)</Label>
                  <Input
                    id="nomorKontrak"
                    placeholder="Contoh: KTR-2026-001 (Biarkan kosong untuk nomor otomatis)"
                    value={nomorKontrak}
                    onChange={(e) => setNomorKontrak(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>
            )}

            {/* ── STEP 2: Periode Sewa ── */}
            {wizardStep === 2 && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="startDate">Tanggal Mulai Sewa *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="endDate">Tanggal Berakhir Sewa *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="rounded-xl"
                      required
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">Pilih Durasi Cepat:</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "1 Bulan", m: 1 },
                      { label: "3 Bulan", m: 3 },
                      { label: "6 Bulan", m: 6 },
                      { label: "1 Tahun", m: 12 },
                    ].map((d) => (
                      <Button
                        key={d.m}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setDurationMonths(d.m)}
                        className="rounded-xl text-xs font-semibold border-slate-200 hover:bg-slate-50"
                      >
                        {d.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="billingFreq">Siklus Penagihan</Label>
                    <Select
                      value={billingFrequency}
                      onValueChange={(val) => setBillingFrequency((val ?? "monthly") as any)}
                    >
                      <SelectTrigger id="billingFreq" className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="monthly">Bulanan (Monthly)</SelectItem>
                        <SelectItem value="quarterly">Per 3 Bulan (Quarterly)</SelectItem>
                        <SelectItem value="yearly">Tahunan (Yearly)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="billingDay">Tanggal Jatuh Tempo Bulanan</Label>
                    <Input
                      id="billingDay"
                      type="number"
                      min={1}
                      max={28}
                      value={billingDay}
                      onChange={(e) => setBillingDay(Number(e.target.value))}
                      className="rounded-xl"
                    />
                    <p className="text-[11px] text-slate-400">Jatuh tempo setiap tanggal {billingDay}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Biaya & Jaminan ── */}
            {wizardStep === 3 && (
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="rentAmount">Biaya Sewa Pokok / Bulan (Rp) *</Label>
                  <Input
                    id="rentAmount"
                    type="number"
                    min="0"
                    value={rentAmount || ""}
                    onChange={(e) => setRentAmount(Number(e.target.value))}
                    className="rounded-xl font-bold text-teal-700"
                    required
                  />
                  <p className="text-[11px] text-slate-400">
                    Otomatis mengambil tarif sewa dari kamar yang dipilih.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="depositAmount">Uang Jaminan / Deposit Kerusakan (Rp)</Label>
                  <Input
                    id="depositAmount"
                    type="number"
                    min="0"
                    value={depositAmount || ""}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="rounded-xl"
                  />
                  <p className="text-[11px] text-slate-400">
                    Uang jaminan yang dikembalikan saat masa sewa selesai tanpa kerusakan unit.
                  </p>
                </div>

                {depositAmount > 0 && (
                  <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-teal-900">
                      <input
                        type="checkbox"
                        checked={depositReceived}
                        onChange={(e) => setDepositReceived(e.target.checked)}
                        className="rounded border-teal-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span>Deposit sudah diterima penuh (Otomatis catat kas masuk ke Buku Kas)</span>
                    </label>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="notes">Catatan Ketentuan Tambahan</Label>
                  <Textarea
                    id="notes"
                    rows={2}
                    placeholder="Aturan jam malam, parkir, ketentuan pengembalian deposit..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="rounded-xl text-xs"
                  />
                </div>

                {/* Akses Tenant Portal via WhatsApp */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold text-emerald-950">
                    <input
                      type="checkbox"
                      checked={sendPortalAccess}
                      onChange={(e) => setSendPortalAccess(e.target.checked)}
                      className="mt-0.5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="space-y-0.5">
                      <span className="font-bold">Kirim Akses Tenant Portal via WhatsApp</span>
                      <p className="text-[11px] font-normal text-emerald-800">
                        Penyewa akan langsung menerima tautan aktivasi mandiri ke WhatsApp tanpa memerlukan kode undangan manual.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* ── STEP 4: Ringkasan Aktivasi ── */}
            {wizardStep === 4 && (
              <div className="space-y-3.5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Konfirmasi Data Kontrak Sewa
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400">Penyewa:</span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">
                        {selectedPenghuni?.nama ?? "Belum dipilih"}
                      </p>
                      <p className="text-[11px] font-mono text-slate-500">
                        {selectedPenghuni?.noHp ? `+${selectedPenghuni.noHp}` : "-"}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-400">Unit Kamar:</span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">
                        Kamar {selectedKamar?.nomor ?? "-"} ({selectedKamar?.tipe ?? ""})
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {selectedKamar?.properti?.nama ?? "Kost Utama"} (Lt. {selectedKamar?.lantai ?? 1})
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-400">Periode Perjanjian:</span>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {new Date(startDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        s/d{" "}
                        {new Date(endDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-400">Siklus Penagihan:</span>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {billingFrequency === "monthly"
                          ? "Bulanan"
                          : billingFrequency === "quarterly"
                          ? "Triwulanan"
                          : "Tahunan"}{" "}
                        (Tgl {billingDay})
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-3 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tarif Sewa Pokok / Bulan:</span>
                      <span className="font-bold text-slate-900">{formatRupiah(rentAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Uang Jaminan Deposit:</span>
                      <span className="font-bold text-teal-700">
                        {depositAmount > 0 ? formatRupiah(depositAmount) : "Tanpa Deposit"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-teal-50 p-3 text-xs text-teal-900 border border-teal-200 flex items-center gap-2">
                  <ShieldCheck className="size-4 shrink-0 text-teal-600" />
                  <span>
                    Setelah diaktifkan, status kamar otomatis berubah menjadi <strong>Terisi</strong> dan penyewa resmi terikat kontrak sewa.
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between border-t border-slate-100 pt-3">
            {wizardStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setWizardStep((prev) => (prev - 1) as any)}
                className="rounded-xl border-slate-200"
              >
                Kembali
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                className="rounded-xl border-slate-200"
              >
                Batal
              </Button>
            )}

            {wizardStep < 4 ? (
              <Button
                type="button"
                onClick={() => {
                  if (wizardStep === 1 && (!selectedPenghuniId || !selectedKamarId)) {
                    toast.error("Pilih unit kamar dan penyewa terlebih dahulu");
                    return;
                  }
                  if (wizardStep === 1 && hasConflict) {
                    toast.error("Kamar ini masih memiliki kontrak aktif");
                    return;
                  }
                  setWizardStep((prev) => (prev + 1) as any);
                }}
                className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold"
              >
                Lanjutkan <ChevronRight className="ml-1 size-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleCreateSubmit}
                disabled={isPending || hasConflict}
                className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold"
              >
                {isPending ? "Mengaktifkan Kontrak..." : "Aktifkan Kontrak Sewa"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal Perpanjangan Kontrak (Renewal Flow) ───────────────── */}
      <Dialog open={!!renewTarget} onOpenChange={(open) => !open && setRenewTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Perpanjang Kontrak Sewa</DialogTitle>
            <DialogDescription>
              Perpanjang masa sewa untuk penyewa{" "}
              <strong className="text-slate-800">{renewTarget?.penghuni?.nama}</strong> di{" "}
              <strong>Kamar {renewTarget?.kamar?.nomor}</strong>.
            </DialogDescription>
          </DialogHeader>

          {renewTarget && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
                <span className="text-slate-500">Masa sewa saat ini berakhir pada:</span>
                <p className="font-bold text-slate-900 text-sm">
                  {new Date(renewTarget.endDate).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="renewEnd">Tanggal Selesai Baru *</Label>
                <Input
                  id="renewEnd"
                  type="date"
                  value={renewEndDate}
                  onChange={(e) => setRenewEndDate(e.target.value)}
                  className="rounded-xl font-bold"
                  required
                />
              </div>

              {/* Quick Presets */}
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Durasi Perpanjangan:</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "+3 Bulan", m: 3 },
                    { label: "+6 Bulan", m: 6 },
                    { label: "+1 Tahun", m: 12 },
                  ].map((preset) => (
                    <Button
                      key={preset.m}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const base = new Date(renewTarget.endDate);
                        base.setMonth(base.getMonth() + preset.m);
                        setRenewEndDate(base.toISOString().slice(0, 10));
                      }}
                      className="rounded-xl text-xs font-semibold border-slate-200 hover:bg-slate-50"
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="renewRent">Tarif Sewa Baru (Rp)</Label>
                  <Input
                    id="renewRent"
                    type="number"
                    min={0}
                    value={renewRentAmount || ""}
                    onChange={(e) => setRenewRentAmount(Number(e.target.value))}
                    className="rounded-xl font-bold text-teal-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="renewDeposit">Deposit (Rp)</Label>
                  <Input
                    id="renewDeposit"
                    type="number"
                    min={0}
                    value={renewDepositAmount || ""}
                    onChange={(e) => setRenewDepositAmount(Number(e.target.value))}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="renewNotes">Catatan Perpanjangan</Label>
                <Textarea
                  id="renewNotes"
                  rows={2}
                  value={renewNotes}
                  onChange={(e) => setRenewNotes(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenewTarget(null)}
              disabled={isRenewing}
              className="rounded-xl border-slate-200"
            >
              Batal
            </Button>
            <Button
              onClick={handleConfirmRenew}
              disabled={isRenewing}
              className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold"
            >
              {isRenewing ? "Menyimpan Perpanjangan..." : "Konfirmasi Perpanjang"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Drawer Detail & Linimasa Kontrak (Batch 21: Contextual Inspection) ── */}
      <Sheet open={!!detailLease} onOpenChange={(open) => !open && setDetailLease(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-6 flex flex-col gap-4">
          {detailLease && (
            <>
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-xl font-bold text-slate-900 font-mono">
                    {detailLease.nomorKontrak || "Detail Kontrak"}
                  </SheetTitle>
                  <StatusBadge
                    variant={
                      detailLease.status === "active"
                        ? "emerald"
                        : detailLease.status === "renewed"
                        ? "blue"
                        : "slate"
                    }
                  >
                    {detailLease.status.toUpperCase()}
                  </StatusBadge>
                </div>
                <SheetDescription className="text-xs text-slate-500">
                  Diterbitkan pada{" "}
                  {new Date(detailLease.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </SheetDescription>
              </SheetHeader>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                {detailLease.penghuni?.noHp && (
                  <a
                    href={`https://wa.me/${detailLease.penghuni.noHp}?text=${encodeURIComponent(
                      `Halo ${detailLease.penghuni.nama}, terkait kontrak sewa ${detailLease.nomorKontrak}...`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition text-center"
                  >
                    <MessageSquare className="size-3.5 text-emerald-600" />
                    Chat WA
                  </a>
                )}

                {detailLease.status === "active" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const l = detailLease;
                      setDetailLease(null);
                      handleOpenRenew(l);
                    }}
                    className="rounded-xl border-teal-200 bg-teal-50 text-xs font-semibold text-teal-800 hover:bg-teal-100"
                  >
                    <RotateCw className="mr-1.5 size-3.5 text-teal-600" />
                    Perpanjang
                  </Button>
                )}

                {detailLease.status === "active" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const l = detailLease;
                      setDetailLease(null);
                      setTerminateTarget(l);
                    }}
                    className="rounded-xl border-rose-200 bg-rose-50 text-xs font-semibold text-rose-800 hover:bg-rose-100"
                  >
                    <XCircle className="mr-1.5 size-3.5 text-rose-600" />
                    Akhiri Sewa
                  </Button>
                )}
              </div>

              {/* Details Content */}
              <div className="space-y-4 pt-2">
                {/* 1. Entity Cards */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                    <p className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-1">
                      Identitas Penyewa
                    </p>
                    <p className="font-bold text-slate-900 text-sm">{detailLease.penghuni?.nama}</p>
                    <p className="font-mono text-slate-500 mt-0.5">
                      {detailLease.penghuni?.noHp ? `+${detailLease.penghuni.noHp}` : "-"}
                    </p>
                    <p className="text-slate-400 mt-0.5">KTP: {detailLease.penghuni?.noKtp || "-"}</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                    <p className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-1">
                      Unit Properti
                    </p>
                    <p className="font-bold text-slate-900 text-sm">
                      Kamar {detailLease.kamar?.nomor} ({detailLease.kamar?.tipe})
                    </p>
                    <p className="text-slate-600 mt-0.5">
                      {detailLease.kamar?.properti?.nama ?? "Kost Utama"} (Lt. {detailLease.kamar?.lantai})
                    </p>
                  </div>
                </div>

                {/* 2. Financial Overview */}
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2 text-xs">
                  <p className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                    Ketentuan Finansial
                  </p>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tarif Sewa Pokok:</span>
                    <span className="font-bold text-slate-900">{formatRupiah(detailLease.rentAmount)} / bulan</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Uang Jaminan Kerusakan:</span>
                    <span className="font-bold text-teal-700">
                      {detailLease.depositAmount > 0
                        ? formatRupiah(detailLease.depositAmount)
                        : "Tanpa Deposit"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Siklus Penagihan:</span>
                    <span className="font-medium text-slate-800">
                      {detailLease.billingFrequency.toUpperCase()} (Setiap Tgl {detailLease.billingDay})
                    </span>
                  </div>
                </div>

                {/* 3. Timeline */}
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3">
                  <p className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                    Linimasa Sewa (Timeline)
                  </p>

                  <div className="relative pl-6 space-y-4 border-l border-slate-200 text-xs">
                    {/* Start */}
                    <div className="relative">
                      <div className="absolute -left-[31px] top-0.5 size-3.5 rounded-full bg-teal-600 border-2 border-white ring-2 ring-teal-200" />
                      <p className="font-bold text-slate-900">
                        Mulai Sewa:{" "}
                        {new Date(detailLease.startDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Kontrak resmi diaktifkan.</p>
                    </div>

                    {/* End */}
                    <div className="relative">
                      <div
                        className={`absolute -left-[31px] top-0.5 size-3.5 rounded-full border-2 border-white ring-2 ${
                          detailLease.status === "active"
                            ? "bg-amber-500 ring-amber-200"
                            : "bg-slate-400 ring-slate-200"
                        }`}
                      />
                      <p className="font-bold text-slate-900">
                        Akhir Masa Sewa:{" "}
                        {new Date(detailLease.endDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Jadwal serah terima kunci / perpanjangan sewa.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 4. Notes */}
                {detailLease.notes && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs">
                    <p className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-1">
                      Catatan &amp; Ketentuan
                    </p>
                    <p className="text-slate-700 whitespace-pre-wrap">{detailLease.notes}</p>
                  </div>
                )}
              </div>

              <SheetFooter className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => setDetailLease(null)}
                  className="rounded-xl border-slate-200 text-xs font-semibold"
                >
                  Tutup Detail
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Dialog Konfirmasi Akhiri Kontrak (Batch 21: Destructive Confirmation) ── */}
      <DestructiveDialog
        open={!!terminateTarget}
        onOpenChange={(open) => !open && setTerminateTarget(null)}
        onConfirm={handleTerminateConfirm}
        title="Akhiri Kontrak Sewa?"
        entityName={terminateTarget ? `${terminateTarget.penghuni?.nama} (Kamar ${terminateTarget.kamar?.nomor})` : undefined}
        description="Unit kamar akan otomatis berstatus Kosong kembali dan penyewa dilepaskan dari penempatan kamar ini."
        confirmLabel="Akhiri Kontrak"
        isPending={isPending}
      />
    </div>
  );
}
