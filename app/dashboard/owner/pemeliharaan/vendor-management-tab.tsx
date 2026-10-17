"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Star,
  Wrench,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  MessageCircle,
  ExternalLink,
  Printer,
  Pencil,
  Trash2,
  Filter,
  Eye,
  FileText,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/utils/export-csv";

import {
  createVendorAction,
  updateVendorAction,
  deleteVendorAction,
  type CreateVendorInput,
  type UpdateVendorInput,
} from "./action";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VendorTicket {
  id: string;
  judul: string;
  deskripsi: string;
  status: "menunggu" | "diproses" | "selesai";
  prioritas: "rendah" | "sedang" | "tinggi";
  kategori: string;
  createdAt: string;
  updatedAt: string;
  kamar?: {
    id: string;
    nomor: string;
    properti?: { id: string; nama: string } | null;
  } | null;
  penghuni?: {
    id: string;
    nama: string;
    noHp: string;
  } | null;
}

export interface VendorWithHistory {
  id: string;
  name: string;
  category: string;
  phone: string;
  email: string | null;
  address: string | null;
  rating: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  pemeliharaan?: VendorTicket[];
}

export interface MaintenanceExpenseItem {
  id: string;
  jenis: string;
  kategori: string;
  jumlah: number;
  tanggal: string;
  keterangan?: string | null;
  kamarId?: string | null;
  kamar?: {
    nomor: string;
    properti?: { nama: string } | null;
  } | null;
}

interface VendorManagementTabProps {
  vendors: VendorWithHistory[];
  expenses?: MaintenanceExpenseItem[];
  onOpenTicketDetail?: (ticketId: string) => void;
}

export const VENDOR_CATEGORIES = [
  "Teknisi AC",
  "Plumbing & Pompa",
  "Kelistrikan",
  "Tukang Bangunan",
  "Tukang Kunci",
  "Cleaning Service",
  "General",
] as const;

export function VendorManagementTab({
  vendors: initialVendors,
  expenses = [],
  onOpenTicketDetail,
}: VendorManagementTabProps) {
  const router = useRouter();
  const [vendors, setVendors] = useState<VendorWithHistory[]>(initialVendors);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "rating" | "tickets" | "expenses">("tickets");
  const [isPending, startTransition] = useTransition();

  // Modals State
  const [selectedVendor, setSelectedVendor] = useState<VendorWithHistory | null>(null);
  const [vendorDetailSubTab, setVendorDetailSubTab] = useState<"work_history" | "expenses">("work_history");

  const [addVendorOpen, setAddVendorOpen] = useState(false);
  const [newVendor, setNewVendor] = useState<CreateVendorInput>({
    name: "",
    category: "Teknisi AC",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  const [editVendorOpen, setEditVendorOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<{
    id: string;
    name: string;
    category: string;
    phone: string;
    email: string;
    address: string;
    rating: number;
    notes: string;
  } | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<VendorWithHistory | null>(null);

  // Map expenses to vendors based on description tag [Vendor: ...] or ticket reference
  const vendorExpenseMap = useMemo(() => {
    const map = new Map<string, MaintenanceExpenseItem[]>();

    vendors.forEach((v) => {
      const vNameLower = v.name.toLowerCase().trim();
      const matched = expenses.filter((exp) => {
        const ket = (exp.keterangan || "").toLowerCase();
        if (ket.includes(`[vendor: ${vNameLower}]`)) return true;
        if (ket.includes(vNameLower)) return true;

        // Check if ticket ID is in the expense description
        if (v.pemeliharaan && v.pemeliharaan.length > 0) {
          return v.pemeliharaan.some((t) =>
            ket.includes(t.id.slice(-6).toLowerCase())
          );
        }
        return false;
      });
      map.set(v.id, matched);
    });

    return map;
  }, [vendors, expenses]);

  // Cumulative KPI Summary
  const stats = useMemo(() => {
    let totalCompletedTickets = 0;
    let totalActiveTickets = 0;
    let totalExpensesPaid = 0;

    vendors.forEach((v) => {
      const tickets = v.pemeliharaan || [];
      const completed = tickets.filter((t) => t.status === "selesai").length;
      const active = tickets.filter((t) => t.status !== "selesai").length;
      totalCompletedTickets += completed;
      totalActiveTickets += active;

      const vExp = vendorExpenseMap.get(v.id) || [];
      totalExpensesPaid += vExp.reduce((sum, item) => sum + item.jumlah, 0);
    });

    const activeVendorsCount = vendors.filter((v) =>
      (v.pemeliharaan || []).some((t) => t.status !== "selesai")
    ).length;

    return {
      totalVendors: vendors.length,
      activeVendorsCount,
      totalCompletedTickets,
      totalActiveTickets,
      totalExpensesPaid,
    };
  }, [vendors, vendorExpenseMap]);

  // Filtered & Sorted Vendors
  const filteredVendors = useMemo(() => {
    const q = search.trim().toLowerCase();

    const list = vendors.filter((v) => {
      if (categoryFilter !== "all" && v.category !== categoryFilter) return false;
      if (!q) return true;

      const nameMatch = v.name.toLowerCase().includes(q);
      const phoneMatch = v.phone.toLowerCase().includes(q);
      const emailMatch = (v.email || "").toLowerCase().includes(q);
      const addrMatch = (v.address || "").toLowerCase().includes(q);
      const notesMatch = (v.notes || "").toLowerCase().includes(q);
      const catMatch = v.category.toLowerCase().includes(q);

      return nameMatch || phoneMatch || emailMatch || addrMatch || notesMatch || catMatch;
    });

    return list.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "rating") {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === "tickets") {
        const aCount = (a.pemeliharaan || []).length;
        const bCount = (b.pemeliharaan || []).length;
        return bCount - aCount;
      }
      if (sortBy === "expenses") {
        const aExp = (vendorExpenseMap.get(a.id) || []).reduce((s, i) => s + i.jumlah, 0);
        const bExp = (vendorExpenseMap.get(b.id) || []).reduce((s, i) => s + i.jumlah, 0);
        return bExp - aExp;
      }
      return 0;
    });
  }, [vendors, search, categoryFilter, sortBy, vendorExpenseMap]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleCreateVendor() {
    if (!newVendor.name.trim() || !newVendor.phone.trim()) {
      toast.error("Nama vendor dan nomor telepon wajib diisi");
      return;
    }

    startTransition(async () => {
      try {
        const created = await createVendorAction(newVendor);
        setVendors((prev) => [created as any, ...prev]);
        toast.success(`Rekanan vendor "${created.name}" berhasil didaftarkan!`);
        setAddVendorOpen(false);
        setNewVendor({
          name: "",
          category: "Teknisi AC",
          phone: "",
          email: "",
          address: "",
          notes: "",
        });
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Gagal mendaftarkan vendor");
      }
    });
  }

  function handleOpenEdit(v: VendorWithHistory) {
    setEditingVendor({
      id: v.id,
      name: v.name,
      category: v.category,
      phone: v.phone,
      email: v.email || "",
      address: v.address || "",
      rating: v.rating || 5,
      notes: v.notes || "",
    });
    setEditVendorOpen(true);
  }

  function handleUpdateVendor() {
    if (!editingVendor) return;
    if (!editingVendor.name.trim() || !editingVendor.phone.trim()) {
      toast.error("Nama vendor dan nomor telepon wajib diisi");
      return;
    }

    startTransition(async () => {
      try {
        const updated = await updateVendorAction(editingVendor.id, {
          name: editingVendor.name,
          category: editingVendor.category,
          phone: editingVendor.phone,
          email: editingVendor.email || null,
          address: editingVendor.address || null,
          rating: editingVendor.rating,
          notes: editingVendor.notes || null,
        });

        setVendors((prev) => prev.map((v) => (v.id === updated.id ? (updated as any) : v)));
        if (selectedVendor && selectedVendor.id === updated.id) {
          setSelectedVendor(updated as any);
        }
        toast.success(`Profil vendor "${updated.name}" berhasil diperbarui!`);
        setEditVendorOpen(false);
        setEditingVendor(null);
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Gagal memperbarui vendor");
      }
    });
  }

  function handleDeleteVendor() {
    if (!vendorToDelete) return;

    startTransition(async () => {
      try {
        await deleteVendorAction(vendorToDelete.id);
        setVendors((prev) => prev.filter((v) => v.id !== vendorToDelete.id));
        if (selectedVendor && selectedVendor.id === vendorToDelete.id) {
          setSelectedVendor(null);
        }
        toast.success(`Vendor "${vendorToDelete.name}" berhasil dihapus`);
        setDeleteConfirmOpen(false);
        setVendorToDelete(null);
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Gagal menghapus vendor");
      }
    });
  }

  function handleExportCSV() {
    const headers = [
      "Nama Vendor",
      "Kategori",
      "No Telepon",
      "Email",
      "Alamat",
      "Rating",
      "Total Tiket",
      "Tiket Selesai",
      "Total Biaya Jasa (Rp)",
      "Catatan",
    ];
    const rows = filteredVendors.map((v) => {
      const tickets = v.pemeliharaan || [];
      const completed = tickets.filter((t) => t.status === "selesai").length;
      const vExp = vendorExpenseMap.get(v.id) || [];
      const expSum = vExp.reduce((s, i) => s + i.jumlah, 0);

      return [
        v.name,
        v.category,
        v.phone,
        v.email || "-",
        v.address || "-",
        v.rating ? `${v.rating}/5` : "-",
        tickets.length,
        completed,
        expSum,
        v.notes || "-",
      ];
    });
    exportToCSV("direktori_rekanan_vendor", headers, rows);
    toast.success("Daftar vendor berhasil diekspor ke CSV");
  }

  return (
    <div className="space-y-6">
      {/* ── KPI Action Center Stat Cards ────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Vendors */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-500">Total Rekanan Vendor</p>
            <div className="rounded-xl bg-teal-50 p-2 text-teal-700">
              <Users className="size-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.totalVendors}</p>
          <p className="mt-1 text-xs text-slate-400">Teknisi &amp; kontraktor terdaftar</p>
        </div>

        {/* Vendors on Duty */}
        <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-500">Sedang Bertugas</p>
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <Clock className="size-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-amber-600">{stats.activeVendorsCount}</p>
          <p className="mt-1 text-xs text-slate-400">
            Menangani {stats.totalActiveTickets} tiket aktif
          </p>
        </div>

        {/* Completed Work Orders */}
        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-500">Pekerjaan Selesai</p>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <CheckCircle2 className="size-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {stats.totalCompletedTickets}
          </p>
          <p className="mt-1 text-xs text-slate-400">Tiket perbaikan terselesaikan</p>
        </div>

        {/* Total Expenses Paid */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-500">Total Biaya Jasa Dibayarkan</p>
            <div className="rounded-xl bg-teal-50 p-2 text-teal-700">
              <DollarSign className="size-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-teal-800">
            Rp {stats.totalExpensesPaid.toLocaleString("id-ID")}
          </p>
          <p className="mt-1 text-xs text-slate-400">Realisasi pengeluaran jasa kas</p>
        </div>
      </div>

      {/* ── Search, Filters, & Actions ──────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Cari vendor, telepon, alamat, catatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs sm:text-sm h-9"
            />
          </div>

          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val ?? "all")}>
            <SelectTrigger className="h-9 w-44 text-xs bg-slate-50 border-slate-200">
              <SelectValue placeholder="Semua Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Spesialisasi</SelectItem>
              {VENDOR_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
            <SelectTrigger className="h-9 w-44 text-xs bg-slate-50 border-slate-200">
              <SelectValue placeholder="Urutkan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tickets">Tiket Terbanyak</SelectItem>
              <SelectItem value="expenses">Biaya Jasa Tertinggi</SelectItem>
              <SelectItem value="rating">Rating Tertinggi</SelectItem>
              <SelectItem value="name">Nama (A-Z)</SelectItem>
            </SelectContent>
          </Select>

          {(search || categoryFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setCategoryFilter("all");
              }}
              className="h-8 text-xs text-rose-600 hover:bg-rose-50"
            >
              <X className="mr-1 size-3.5" />
              Reset
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-9 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="mr-1.5 size-3.5" />
            Ekspor CSV
          </Button>

          <Button
            size="sm"
            onClick={() => setAddVendorOpen(true)}
            className="h-9 rounded-xl bg-emerald-700 text-xs font-semibold text-white hover:bg-emerald-800 shadow-sm"
          >
            <Plus className="mr-1.5 size-3.5" />
            + Rekanan Baru
          </Button>
        </div>
      </div>

      {/* ── Vendor Cards Grid ───────────────────────────────────────── */}
      {filteredVendors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Users className="size-6" />
          </div>
          {vendors.length === 0 ? (
            <>
              <p className="mt-3 text-base font-semibold text-slate-800">
                Belum ada rekanan vendor terdaftar
              </p>
              <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
                Daftarkan tukang AC, plumbing, kelistrikan, dan langganan perbaikan agar mudah ditugaskan saat keluhan masuk.
              </p>
              <div className="mt-4 flex items-center justify-center">
                <Button
                  size="sm"
                  onClick={() => setAddVendorOpen(true)}
                  className="rounded-xl bg-emerald-700 text-xs font-semibold text-white hover:bg-emerald-800"
                >
                  <Plus className="mr-1.5 size-3.5" />
                  Tambah Vendor Pertama
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-3 text-base font-semibold text-slate-800">
                Tidak ada vendor yang cocok
              </p>
              <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
                Coba sesuaikan kata kunci pencarian atau kategori spesialisasi Anda.
              </p>
              <div className="mt-4 flex items-center justify-center">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setCategoryFilter("all");
                  }}
                  className="rounded-xl border-slate-200 text-xs text-slate-700 hover:bg-slate-50"
                >
                  Reset Filter
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVendors.map((vendor) => {
            const tickets = vendor.pemeliharaan || [];
            const completedCount = tickets.filter((t) => t.status === "selesai").length;
            const activeCount = tickets.filter((t) => t.status !== "selesai").length;
            const vExp = vendorExpenseMap.get(vendor.id) || [];
            const totalPaid = vExp.reduce((sum, item) => sum + item.jumlah, 0);

            return (
              <div
                key={vendor.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-teal-300"
              >
                <div>
                  {/* Top Bar: Name, Category, & Rating */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 items-center justify-center rounded-xl bg-teal-50 text-teal-800 font-bold text-sm border border-teal-200">
                        {vendor.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base leading-snug">
                          {vendor.name}
                        </h3>
                        <span className="inline-block rounded bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-800 mt-0.5">
                          {vendor.category}
                        </span>
                      </div>
                    </div>

                    {/* Star Rating */}
                    <div className="flex items-center gap-0.5 text-amber-500" title={`Rating: ${vendor.rating || 5}/5`}>
                      <Star className="size-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-slate-700 ml-0.5">
                        {vendor.rating || 5}.0
                      </span>
                    </div>
                  </div>

                  {/* Contact Strip */}
                  <div className="mt-4 space-y-1.5 text-xs text-slate-600 border-t pt-3">
                    <div className="flex items-center gap-2">
                      <Phone className="size-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-900">{vendor.phone}</span>
                    </div>
                    {vendor.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="size-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{vendor.email}</span>
                      </div>
                    )}
                    {vendor.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="size-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{vendor.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Notes / Tarif standard */}
                  {vendor.notes && (
                    <p className="mt-2.5 rounded-lg bg-slate-50 p-2 text-[11px] text-slate-600 italic line-clamp-2">
                      &quot;{vendor.notes}&quot;
                    </p>
                  )}

                  {/* Operational Metrics Pill */}
                  <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-2.5 text-center text-xs">
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-slate-400">Pekerjaan</p>
                      <p className="font-bold text-slate-900 mt-0.5">
                        <span className="text-emerald-600">{completedCount} Selesai</span>
                        {activeCount > 0 && (
                          <span className="text-amber-600 font-semibold ml-1">
                            • {activeCount} Aktif
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-slate-400">Total Biaya</p>
                      <p className="font-bold text-teal-800 mt-0.5">
                        Rp {totalPaid.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 flex items-center justify-between gap-1.5 border-t pt-3">
                  <div className="flex items-center gap-1">
                    {/* 1-Tap WhatsApp */}
                    <a
                      href={`https://wa.me/${vendor.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                        `Halo ${vendor.name}, kami dari pengelola properti ingin menanyakan ketersediaan jadwal teknisi untuk perawatan fasilitas.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                      title="Chat WhatsApp"
                    >
                      <MessageCircle className="size-4" />
                    </a>

                    {/* Direct Call */}
                    <a
                      href={`tel:${vendor.phone}`}
                      className="inline-flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                      title="Telepon Langsung"
                    >
                      <Phone className="size-4" />
                    </a>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(vendor)}
                      className="inline-flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                      title="Edit Vendor"
                    >
                      <Pencil className="size-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => {
                        setVendorToDelete(vendor);
                        setDeleteConfirmOpen(true);
                      }}
                      className="inline-flex size-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                      title="Hapus Vendor"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedVendor(vendor);
                      setVendorDetailSubTab("work_history");
                    }}
                    className="h-8 text-xs font-semibold text-slate-700 hover:bg-slate-50 gap-1"
                  >
                    <span>Profil &amp; Riwayat</span>
                    <ChevronRight className="size-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 360° Vendor Profile Modal (Work & Expense History) ──────── */}
      <Dialog open={!!selectedVendor} onOpenChange={(open) => !open && setSelectedVendor(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedVendor && (() => {
            const tickets = selectedVendor.pemeliharaan || [];
            const completedCount = tickets.filter((t) => t.status === "selesai").length;
            const completionRate =
              tickets.length > 0 ? Math.round((completedCount / tickets.length) * 100) : 100;
            const vExp = vendorExpenseMap.get(selectedVendor.id) || [];
            const totalPaid = vExp.reduce((sum, item) => sum + item.jumlah, 0);

            return (
              <>
                <DialogHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-12 items-center justify-center rounded-xl bg-teal-50 text-teal-800 font-bold text-base border border-teal-200">
                        {selectedVendor.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <DialogTitle className="text-lg font-bold text-slate-900">
                          {selectedVendor.name}
                        </DialogTitle>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="border-teal-300 bg-teal-50 text-teal-800">
                            {selectedVendor.category}
                          </Badge>
                          <div className="flex items-center text-xs text-amber-500 font-semibold">
                            <Star className="size-3.5 fill-amber-400 text-amber-400 mr-1" />
                            {selectedVendor.rating || 5}.0 / 5
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`https://wa.me/${selectedVendor.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                      >
                        <MessageCircle className="size-3.5" />
                        Chat WhatsApp
                      </a>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-4 py-2 text-sm">
                  {/* Top Performance Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-center">
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-slate-400">Total Tiket Ditangani</p>
                      <p className="text-xl font-bold text-slate-900 mt-0.5">{tickets.length}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-slate-400">Pekerjaan Selesai</p>
                      <p className="text-xl font-bold text-emerald-600 mt-0.5">{completedCount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-slate-400">Tingkat Keberhasilan</p>
                      <p className="text-xl font-bold text-teal-800 mt-0.5">{completionRate}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-slate-400">Kumulatif Biaya Jasa</p>
                      <p className="text-base font-bold text-teal-800 mt-1">
                        Rp {totalPaid.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>

                  {/* Contact Info & Notes */}
                  <div className="rounded-xl border border-slate-200 p-3.5 space-y-2 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <span className="font-semibold text-slate-400">Telepon / WhatsApp:</span>
                        <p className="font-bold text-slate-800 mt-0.5">{selectedVendor.phone}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-400">Email:</span>
                        <p className="font-medium text-slate-800 mt-0.5">{selectedVendor.email || "-"}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-400">Alamat Bengkel:</span>
                        <p className="font-medium text-slate-800 mt-0.5">{selectedVendor.address || "-"}</p>
                      </div>
                    </div>
                    {selectedVendor.notes && (
                      <div className="border-t pt-2 text-slate-600">
                        <span className="font-semibold text-slate-400">Catatan Tarif &amp; Layanan: </span>
                        <span>{selectedVendor.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Sub-Tabs: Work History vs Expense History */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1 border-b pb-1">
                      <button
                        type="button"
                        onClick={() => setVendorDetailSubTab("work_history")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                          vendorDetailSubTab === "work_history"
                            ? "bg-teal-50 text-teal-800 border border-teal-200"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Wrench className="size-3.5" />
                        <span>Riwayat Pekerjaan ({tickets.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setVendorDetailSubTab("expenses")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                          vendorDetailSubTab === "expenses"
                            ? "bg-teal-50 text-teal-800 border border-teal-200"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <DollarSign className="size-3.5" />
                        <span>Riwayat Pengeluaran Kas ({vExp.length})</span>
                      </button>
                    </div>

                    {/* Sub-Tab 1: Work History */}
                    {vendorDetailSubTab === "work_history" && (
                      <div className="space-y-2">
                        {tickets.length === 0 ? (
                          <div className="rounded-xl bg-slate-50 p-6 text-center text-xs text-slate-400">
                            Vendor ini belum pernah ditugaskan ke tiket pemeliharaan.
                          </div>
                        ) : (
                          <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                                <tr>
                                  <th className="px-3 py-2">ID &amp; Keluhan</th>
                                  <th className="px-3 py-2">Unit Lokasi</th>
                                  <th className="px-3 py-2">Penyewa</th>
                                  <th className="px-3 py-2">Status</th>
                                  <th className="px-3 py-2">Tanggal</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {tickets.map((t) => (
                                  <tr key={t.id} className="hover:bg-slate-50/60">
                                    <td className="px-3 py-2.5">
                                      <span className="font-mono font-bold text-teal-800">
                                        #{t.id.slice(-6).toUpperCase()}
                                      </span>
                                      <p className="font-semibold text-slate-900 mt-0.5">{t.judul}</p>
                                      <span className="text-[10px] text-slate-500">{t.kategori}</span>
                                    </td>
                                    <td className="px-3 py-2.5">
                                      <p className="font-medium text-slate-800">
                                        Kamar {t.kamar?.nomor || "-"}
                                      </p>
                                      <p className="text-[10px] text-slate-400">
                                        {t.kamar?.properti?.nama || "Properti"}
                                      </p>
                                    </td>
                                    <td className="px-3 py-2.5">
                                      <p className="font-medium text-slate-800">{t.penghuni?.nama || "-"}</p>
                                      <p className="text-[10px] text-slate-400">{t.penghuni?.noHp || "-"}</p>
                                    </td>
                                    <td className="px-3 py-2.5">
                                      {t.status === "selesai" ? (
                                        <StatusBadge variant="emerald" icon="check">
                                          Selesai
                                        </StatusBadge>
                                      ) : t.status === "diproses" ? (
                                        <StatusBadge variant="amber" icon="clock">
                                          Diproses
                                        </StatusBadge>
                                      ) : (
                                        <StatusBadge variant="rose" icon="alert">
                                          Menunggu
                                        </StatusBadge>
                                      )}
                                    </td>
                                    <td className="px-3 py-2.5 text-slate-500">
                                      {new Date(t.createdAt).toLocaleDateString("id-ID")}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sub-Tab 2: Expense History */}
                    {vendorDetailSubTab === "expenses" && (
                      <div className="space-y-2">
                        {vExp.length === 0 ? (
                          <div className="rounded-xl bg-slate-50 p-6 text-center text-xs text-slate-400">
                            Belum ada catatan pengeluaran kas yang dibukukan untuk vendor ini.
                          </div>
                        ) : (
                          <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                                <tr>
                                  <th className="px-3 py-2">Tanggal</th>
                                  <th className="px-3 py-2">Nominal Biaya</th>
                                  <th className="px-3 py-2">Uraian Transaksi</th>
                                  <th className="px-3 py-2">Unit Beban</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {vExp.map((e) => (
                                  <tr key={e.id} className="hover:bg-slate-50/60">
                                    <td className="px-3 py-2.5 text-slate-600">
                                      {new Date(e.tanggal).toLocaleDateString("id-ID")}
                                    </td>
                                    <td className="px-3 py-2.5 font-bold text-rose-600">
                                      Rp {e.jumlah.toLocaleString("id-ID")}
                                    </td>
                                    <td className="px-3 py-2.5 max-w-xs">
                                      <p className="font-medium text-slate-800 line-clamp-1">
                                        {e.keterangan || "Biaya perbaikan vendor"}
                                      </p>
                                      <span className="text-[10px] text-slate-400">{e.kategori}</span>
                                    </td>
                                    <td className="px-3 py-2.5">
                                      {e.kamar ? (
                                        <>
                                          <p className="font-medium text-slate-800">
                                            Kamar {e.kamar.nomor}
                                          </p>
                                          <p className="text-[10px] text-slate-400">
                                            {e.kamar.properti?.nama || "Properti"}
                                          </p>
                                        </>
                                      ) : (
                                        <span className="text-slate-400">Umum / Operasional</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter className="border-t pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                    className="mr-auto text-xs font-semibold gap-1.5"
                  >
                    <Printer className="size-3.5" />
                    Cetak Riwayat Vendor
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedVendor(null)}
                  >
                    Tutup
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ── Add Vendor Modal ────────────────────────────────────────── */}
      <Dialog open={addVendorOpen} onOpenChange={setAddVendorOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="size-5 text-teal-600" />
              <span>Daftarkan Rekanan Vendor / Teknisi</span>
            </DialogTitle>
            <DialogDescription>
              Catat database vendor teknisi, spesialisasi AC, pipa, kelistrikan, atau bangunan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm">
            <div className="space-y-1.5">
              <Label className="text-xs">Nama Vendor / Toko / Teknisi *</Label>
              <Input
                placeholder="Contoh: CV Tirta Lancar Jaya / Pak Joko AC"
                value={newVendor.name}
                onChange={(e) => setNewVendor((prev) => ({ ...prev, name: e.target.value }))}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Kategori Spesialisasi</Label>
                <Select
                  value={newVendor.category}
                  onValueChange={(val) => setNewVendor((prev) => ({ ...prev, category: val ?? "General" }))}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VENDOR_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Nomor WhatsApp / HP *</Label>
                <Input
                  placeholder="08123456789"
                  value={newVendor.phone}
                  onChange={(e) => setNewVendor((prev) => ({ ...prev, phone: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Email (Opsional)</Label>
              <Input
                placeholder="vendor@email.com"
                value={newVendor.email || ""}
                onChange={(e) => setNewVendor((prev) => ({ ...prev, email: e.target.value }))}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Alamat Bengkel / Lokasi</Label>
              <Input
                placeholder="Contoh: Jl. Kaliurang Km 5 No. 12"
                value={newVendor.address || ""}
                onChange={(e) => setNewVendor((prev) => ({ ...prev, address: e.target.value }))}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Catatan Layanan / Standar Tarif</Label>
              <Textarea
                rows={2}
                placeholder="Contoh: Cuci AC 75rb, ganti freon 150rb, garansi pengerjaan 1 bulan..."
                value={newVendor.notes || ""}
                onChange={(e) => setNewVendor((prev) => ({ ...prev, notes: e.target.value }))}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddVendorOpen(false)}>
              Batal
            </Button>
            <Button
              size="sm"
              disabled={isPending}
              onClick={handleCreateVendor}
              className="bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-semibold"
            >
              {isPending ? "Menyimpan..." : "Simpan Rekanan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Vendor Modal ───────────────────────────────────────── */}
      <Dialog open={editVendorOpen} onOpenChange={setEditVendorOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="size-5 text-teal-600" />
              <span>Edit Profil Rekanan Vendor</span>
            </DialogTitle>
          </DialogHeader>

          {editingVendor && (
            <div className="space-y-3 py-2 text-sm">
              <div className="space-y-1.5">
                <Label className="text-xs">Nama Vendor / Teknisi *</Label>
                <Input
                  value={editingVendor.name}
                  onChange={(e) => setEditingVendor((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Spesialisasi</Label>
                  <Select
                    value={editingVendor.category}
                    onValueChange={(val) =>
                      setEditingVendor((prev) => (prev ? { ...prev, category: val ?? "General" } : null))
                    }
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VENDOR_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">No. WhatsApp / HP *</Label>
                  <Input
                    value={editingVendor.phone}
                    onChange={(e) => setEditingVendor((prev) => (prev ? { ...prev, phone: e.target.value } : null))}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input
                    value={editingVendor.email}
                    onChange={(e) => setEditingVendor((prev) => (prev ? { ...prev, email: e.target.value } : null))}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Rating Kualitas (1-5)</Label>
                  <Select
                    value={String(editingVendor.rating)}
                    onValueChange={(val) =>
                      setEditingVendor((prev) => (prev ? { ...prev, rating: Number(val) } : null))
                    }
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 4, 3, 2, 1].map((r) => (
                        <SelectItem key={r} value={String(r)}>
                          ★ {r}.0 Bintang
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Alamat Bengkel</Label>
                <Input
                  value={editingVendor.address}
                  onChange={(e) => setEditingVendor((prev) => (prev ? { ...prev, address: e.target.value } : null))}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Catatan &amp; Standar Tarif</Label>
                <Textarea
                  rows={2}
                  value={editingVendor.notes}
                  onChange={(e) => setEditingVendor((prev) => (prev ? { ...prev, notes: e.target.value } : null))}
                  className="text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditVendorOpen(false)}>
              Batal
            </Button>
            <Button
              size="sm"
              disabled={isPending}
              onClick={handleUpdateVendor}
              className="bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-semibold"
            >
              {isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ──────────────────────────────── */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="size-5" />
              <span>Hapus Rekanan Vendor?</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              {vendorToDelete && (
                <>
                  Apakah Anda yakin ingin menghapus rekanan vendor <strong>&quot;{vendorToDelete.name}&quot;</strong>?
                  <br />
                  <br />
                  Tindakan ini aman dan tidak akan menghapus riwayat tiket pemeliharaan atau kwitansi pengeluaran yang sudah selesai. Namun vendor tidak dapat dihapus jika masih ada tiket aktif yang sedang dikerjakan.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteVendor}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {isPending ? "Menghapus..." : "Ya, Hapus Vendor"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
