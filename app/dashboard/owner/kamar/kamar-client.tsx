"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Kamar, Penghuni, Properti } from "@/lib/generated/prisma/client";
import {
  Search,
  Plus,
  Filter,
  Star,
  TrendingUp,
  Minus,
  AlertTriangle,
  MapPin,
  Pencil,
  Receipt,
  UserPlus,
  MessageSquare,
  Bell,
  LayoutGrid,
  List,
  Building2,
  Trash2,
  MoreVertical,
  Wrench,
  Bed,
  Users,
  Download,
} from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DestructiveDialog } from "@/components/ui/destructive-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/ui/data-table-controls";
import {
  FormField,
  CurrencyInput,
  SubmitButton,
  UnsavedChangesDialog,
} from "@/components/form/form-controls";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/utils/export-csv";

import { createKamar, updateKamar, deleteKamar, type KamarInput } from "./action";

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusKamar = "kosong" | "terisi" | "maintenance";
type TipeKamar = "Standard" | "Deluxe" | "VIP";
type KamarDenganPenghuni = Kamar & {
  penghuni: Penghuni[];
  properti: { id: string; nama: string } | null;
};

interface KamarFormState {
  nomor: string;
  lantai: string;
  tipe: TipeKamar;
  hargaBulanan: string;
  status: StatusKamar;
  penghuniId: string;
  propertiId: string;
  catatan: string;
}

interface KamarFormErrors {
  nomor?: string;
  hargaBulanan?: string;
  penghuniId?: string;
}

const FORM_KOSONG: KamarFormState = {
  nomor: "",
  lantai: "1",
  tipe: "Standard",
  hargaBulanan: "",
  status: "kosong",
  penghuniId: "",
  propertiId: "",
  catatan: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRupiah(nilai: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(nilai);
}

const STATUS_CONFIG: Record<StatusKamar, { label: string; dot: string; badge: string }> = {
  terisi: {
    label: "TERISI",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  kosong: {
    label: "KOSONG",
    dot: "bg-slate-400",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
  },
  maintenance: {
    label: "PERBAIKAN",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
  },
};

// Tunggakan indicator — in a real app this would come from Transaksi data.
// We mark a room as having "tunggakan" if it has a penghuni but catatan contains "tunggak" or similar.
function hasTunggakan(room: KamarDenganPenghuni) {
  return room.catatan?.toLowerCase().includes("tunggak") ?? false;
}

// ─── Room photo placeholder (uses gradient + room number as visual) ────────────

const ROOM_GRADIENTS = [
  "from-teal-400 to-teal-600",
  "from-slate-400 to-slate-600",
  "from-amber-400 to-amber-600",
  "from-blue-400 to-blue-600",
];

function RoomPlaceholder({ nomor, index }: { nomor: string; index: number }) {
  const gradient = ROOM_GRADIENTS[index % ROOM_GRADIENTS.length];
  return (
    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradient}`}>
      <div className="text-center text-white/60">
        <Bed className="mx-auto size-10 opacity-40" />
      </div>
    </div>
  );
}

// ─── Status badge for tunggakan ───────────────────────────────────────────────

function TunggakanBadge() {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700 shadow-xs">
      <span className="size-1.5 rounded-full bg-rose-500" />
      TUNGGAKAN
    </span>
  );
}

// ─── Tipe badge (pill below image) ───────────────────────────────────────────

const TIPE_STYLE: Record<TipeKamar, string> = {
  Standard: "bg-slate-100 text-slate-600 border-slate-200",
  Deluxe: "bg-amber-50 text-amber-700 border-amber-200",
  VIP: "bg-purple-50 text-purple-700 border-purple-200",
};

// ─── Individual room card ────────────────────────────────────────────────────

function RoomCard({
  room,
  index,
  isPending,
  onEdit,
  onDelete,
}: {
  room: KamarDenganPenghuni;
  index: number;
  isPending: boolean;
  onEdit: (room: KamarDenganPenghuni) => void;
  onDelete: (room: KamarDenganPenghuni) => void;
}) {
  const status = room.status as StatusKamar;
  const tipe = room.tipe as TipeKamar;
  const penghuni = room.penghuni[0];
  const tunggakan = hasTunggakan(room);
  const isTerisi = status === "terisi";
  const isKosong = status === "kosong";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md">
      {/* ── Image area ──────────────────────────────────────────── */}
      <div className="relative h-44">
        <RoomPlaceholder nomor={room.nomor} index={index} />

        {/* Status badge top-right */}
        <div className="absolute right-3 top-3">
          {tunggakan ? (
            <TunggakanBadge />
          ) : (
            <span
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-sm ${STATUS_CONFIG[status].badge}`}
            >
              <span className={`size-1.5 rounded-full ${STATUS_CONFIG[status].dot}`} />
              {STATUS_CONFIG[status].label}
            </span>
          )}
        </div>

        {/* Room number badge bottom-left */}
        <div className="absolute bottom-3 left-3">
          <span className="rounded-xl bg-teal-600 px-3 py-1 text-sm font-bold text-white shadow">
            {room.nomor}
          </span>
        </div>
      </div>

      {/* ── Card body ────────────────────────────────────────────── */}
      <div className="p-4">
        {/* Tipe badge */}
        <span
          className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TIPE_STYLE[tipe]}`}
        >
          {tipe}
        </span>

        {/* Tenant name or placeholder */}
        <p className={`mt-2 text-base font-bold ${isTerisi ? "text-slate-800" : "text-slate-400"}`}>
          {penghuni?.nama ?? "Belum disewa"}
        </p>

        {/* Details */}
        <div className="mt-2 space-y-1 text-sm text-slate-500">
          <div className="flex items-baseline gap-1">
            <span>Harga:</span>
            <span className="font-semibold text-slate-700">
              {formatRupiah(room.hargaBulanan)}
              <span className="text-xs font-normal text-slate-400">/bln</span>
            </span>
          </div>

          {isTerisi && penghuni && (
            <div className="flex items-baseline gap-1">
              <span>Jatuh Tempo:</span>
              <span className="font-medium text-slate-700">
                {/* In production this would come from Transaksi */}
                —
              </span>
            </div>
          )}

          {isKosong && (
            <div className="flex items-center gap-1">
              <span>Kondisi:</span>
              <span className="font-semibold text-emerald-600">Siap Huni</span>
            </div>
          )}

          {tunggakan && (
            <p className="mt-1 text-xs font-semibold text-rose-600">
              Tunggakan: perlu tindakan segera
            </p>
          )}
        </div>

        {/* ── Action buttons ──────────────────────────────────────── */}
        <div className="mt-4 flex gap-2">
          {tunggakan ? (
            <>
              <button
                disabled={isPending}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <MessageSquare className="size-3.5" />
                Chat
              </button>
              <button
                disabled={isPending}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-500 py-2 text-xs font-semibold text-white shadow-sm shadow-rose-200 transition hover:bg-rose-600 disabled:opacity-50"
              >
                <Bell className="size-3.5" />
                Ingatkan
              </button>
            </>
          ) : isKosong ? (
            <>
              <button
                onClick={() => onEdit(room)}
                disabled={isPending}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <Pencil className="size-3.5" />
                Edit
              </button>
              <button
                disabled={isPending}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-teal-600 py-2 text-xs font-semibold text-white shadow-sm shadow-teal-200 transition hover:bg-teal-700 disabled:opacity-50"
              >
                <UserPlus className="size-3.5" />
                Tambah
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onEdit(room)}
                disabled={isPending}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <Pencil className="size-3.5" />
                Edit
              </button>
              <button
                disabled={isPending}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 py-2 text-xs font-semibold text-teal-700 transition hover:bg-teal-100 disabled:opacity-50"
              >
                <Receipt className="size-3.5" />
                Tagih
              </button>
            </>
          )}

          {/* 3-dot menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  disabled={isPending}
                  className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <MoreVertical className="size-3.5" />
                </button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(room)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(room)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface KamarClientProps {
  initialRooms: KamarDenganPenghuni[];
  penghuniOptions: Penghuni[];
  propertiOptions: { id: string; nama: string }[];
  selectedPropertiId?: string | null;
}

export function KamarClient({ initialRooms, penghuniOptions, propertiOptions, selectedPropertiId }: KamarClientProps) {
  const searchParams = useSearchParams();
  const initialStatus = searchParams?.get("status") || "semua";

  const [rooms, setRooms] = useState<KamarDenganPenghuni[]>(initialRooms);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("semua");
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isPending, startTransition] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<KamarFormState>(FORM_KOSONG);
  const [errors, setErrors] = useState<KamarFormErrors>({});
  const [deleteTarget, setDeleteTarget] = useState<KamarDenganPenghuni | null>(null);

  // ── Form UX: Dirty State & Unsaved Changes Guard (Batch 20) ──────────────────
  const [initialFormSnapshot, setInitialFormSnapshot] = useState<string>(JSON.stringify(FORM_KOSONG));
  const [dirtyConfirmOpen, setDirtyConfirmOpen] = useState(false);

  const isDirty = useMemo(() => {
    return JSON.stringify(form) !== initialFormSnapshot;
  }, [form, initialFormSnapshot]);

  function handleRequestClose() {
    if (isDirty) {
      setDirtyConfirmOpen(true);
    } else {
      setFormOpen(false);
    }
  }

  // ── Derived ─────────────────────────────────────────────────────────────────

  const opsiPenghuni = useMemo(
    () => penghuniOptions.filter((p) => p.kamarId === null || p.kamarId === editingId),
    [penghuniOptions, editingId]
  );
  const selectedPenghuni = opsiPenghuni.find((p) => p.id === form.penghuniId);
  const selectedProperti = propertiOptions.find((p) => p.id === form.propertiId);

  const ringkasan = useMemo(() => {
    const total = rooms.length;
    const terisi = rooms.filter((r) => r.status === "terisi").length;
    const kosong = rooms.filter((r) => r.status === "kosong").length;
    const tunggakan = rooms.filter((r) => hasTunggakan(r)).length;
    const okupansi = total === 0 ? 0 : Math.round((terisi / total) * 100);
    return { total, terisi, kosong, tunggakan, okupansi };
  }, [rooms]);

  // Available floors for tab
  const floors = useMemo(() => {
    const set = new Set(rooms.map((r) => r.lantai));
    return Array.from(set).sort((a, b) => a - b);
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    return rooms
      .filter((r) => {
        // Filter by selected properti (from parent dropdown)
        if (selectedPropertiId) return r.propertiId === selectedPropertiId;
        return true;
      })
      .filter((r) => {
        if (activeTab === "semua") return true;
        return r.lantai === Number(activeTab);
      })
      .filter((r) => {
        if (statusFilter === "semua") return true;
        if (statusFilter === "tunggakan") return hasTunggakan(r);
        return r.status === statusFilter;
      })
      .filter((r) => {
        const kata = search.trim().toLowerCase();
        if (!kata) return true;
        const namaPenghuni = r.penghuni[0]?.nama.toLowerCase() ?? "";
        return r.nomor.toLowerCase().includes(kata) || namaPenghuni.includes(kata);
      })
      .sort((a, b) => a.nomor.localeCompare(b.nomor));
  }, [rooms, search, activeTab, statusFilter, selectedPropertiId]);

  // ── Pagination (Batch 19) ──────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeTab, statusFilter, selectedPropertiId]);

  const paginatedRooms = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRooms.slice(start, start + pageSize);
  }, [filteredRooms, currentPage, pageSize]);

  // ── First properti name for the heading ────────────────────────────────────
  const propertiName =
    (selectedPropertiId
      ? propertiOptions.find((p) => p.id === selectedPropertiId)?.nama
      : rooms.find((r) => r.properti)?.properti?.nama) ?? "Manajemen Kamar";

  function handleExportCSV() {
    const headers = [
      "Nomor Kamar",
      "Lantai",
      "Tipe",
      "Harga Bulanan",
      "Status",
      "Nama Penyewa",
      "Properti",
    ];
    const rows = filteredRooms.map((r) => [
      r.nomor,
      r.lantai,
      r.tipe,
      r.hargaBulanan,
      r.status,
      r.penghuni[0]?.nama || "Kosong",
      r.properti?.nama || "-",
    ]);
    exportToCSV("daftar_kamar", headers, rows);
    toast.success("Daftar kamar berhasil diekspor ke CSV");
  }

  function bukaTambahKamar() {
    setEditingId(null);
    const defaultForm: KamarFormState = {
      ...FORM_KOSONG,
      propertiId: selectedPropertiId || propertiOptions[0]?.id || "",
    };
    setForm(defaultForm);
    setInitialFormSnapshot(JSON.stringify(defaultForm));
    setErrors({});
    setFormOpen(true);
  }

  function bukaEditKamar(room: KamarDenganPenghuni) {
    setEditingId(room.id);
    const editForm: KamarFormState = {
      nomor: room.nomor,
      lantai: String(room.lantai),
      tipe: room.tipe as TipeKamar,
      hargaBulanan: String(room.hargaBulanan),
      status: room.status as StatusKamar,
      penghuniId: room.penghuni[0]?.id ?? "",
      propertiId: room.properti?.id ?? "",
      catatan: room.catatan ?? "",
    };
    setForm(editForm);
    setInitialFormSnapshot(JSON.stringify(editForm));
    setErrors({});
    setFormOpen(true);
  }

  function validateForm(): KamarFormErrors {
    const newErrors: KamarFormErrors = {};
    if (!form.nomor.trim()) newErrors.nomor = "Nomor kamar wajib diisi";
    if (!form.hargaBulanan || Number(form.hargaBulanan) <= 0) {
      newErrors.hargaBulanan = "Harga bulanan harus lebih dari 0";
    }
    if (form.status === "terisi" && !form.penghuniId) {
      newErrors.penghuniId = "Pilih penghuni yang sudah terdaftar";
    }
    return newErrors;
  }

  function submitForm() {
    const validationErrors = validateForm();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Lengkapi dulu field yang wajib diisi");
      return;
    }

    const payload: KamarInput = {
      nomor: form.nomor.trim(),
      lantai: Number(form.lantai) || 1,
      tipe: form.tipe,
      hargaBulanan: Number(form.hargaBulanan),
      status: form.status,
      penghuniId: form.status === "terisi" ? form.penghuniId : null,
      propertiId: form.propertiId || null,
      catatan: form.catatan.trim() || undefined,
    };

    startTransition(async () => {
      try {
        if (editingId) {
          const updated = await updateKamar(editingId, payload);
          setRooms((prev) => prev.map((r) => (r.id === editingId ? updated : r)));
          toast.success(`Kamar ${payload.nomor} berhasil diperbarui`);
        } else {
          const created = await createKamar(payload);
          setRooms((prev) => [...prev, created]);
          toast.success(`Kamar ${payload.nomor} berhasil ditambahkan`);
        }
        setFormOpen(false);
      } catch {
        toast.error("Gagal menyimpan data kamar. Pastikan nomor kamar belum dipakai.");
      }
    });
  }

  function konfirmasiHapus() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      try {
        await deleteKamar(target.id);
        setRooms((prev) => prev.filter((r) => r.id !== target.id));
        toast.success(`Kamar ${target.nomor} berhasil dihapus`);
      } catch {
        toast.error("Gagal menghapus kamar");
      } finally {
        setDeleteTarget(null);
      }
    });
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">

      {/* ── Page heading ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            {propertiName}
            <button className="rounded-full p-0.5 text-slate-400 hover:text-slate-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </button>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            <span className="font-medium text-teal-600">Manajemen Kamar</span>
            {" / "}
            Kelola status, penyewa, dan informasi kamar kost Anda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            <Download className="size-3.5" />
            Ekspor CSV
          </button>
          <button
            onClick={bukaTambahKamar}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-teal-200 transition hover:bg-teal-700 active:scale-[0.98] disabled:opacity-60"
          >
            <Plus className="size-4" />
            Tambah Kamar
          </button>
        </div>
      </div>

      {/* ── Stat cards ────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Kamar — teal highlight */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 p-5 shadow-sm shadow-teal-200/60">
          <Star className="absolute right-4 top-4 size-10 stroke-[1] text-white/20" />
          <p className="text-sm font-medium text-white/80">Total Kamar</p>
          <p className="mt-2 text-4xl font-bold text-white">{ringkasan.total}</p>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-white/70">
            <MapPin className="size-3" />
            {propertiName}
          </div>
        </div>

        {/* Terisi */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-500">Terisi</p>
            <TrendingUp className="size-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-4xl font-bold text-slate-800">{ringkasan.terisi}</p>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              <TrendingUp className="size-3" />
              +2 dari bulan lalu
            </span>
          </div>
        </div>

        {/* Kosong */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-500">Kosong</p>
            <Minus className="size-4 text-slate-400" />
          </div>
          <p className="mt-2 text-4xl font-bold text-slate-800">{ringkasan.kosong}</p>
          <p className="mt-3 text-xs text-slate-500">Stabil</p>
        </div>

        {/* Tunggakan */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-500">Tunggakan</p>
            <AlertTriangle className="size-4 text-rose-500" />
          </div>
          <p className="mt-2 text-4xl font-bold text-slate-800">{ringkasan.tunggakan}</p>
          {ringkasan.tunggakan > 0 && (
            <p className="mt-3 text-xs font-semibold text-rose-600">Perlu tindakan</p>
          )}
        </div>
      </div>

      {/* ── Tabs + view toggle ────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        {/* Tab pills */}
        <div className="flex items-center gap-1">
          {["semua", ...floors.map(String)].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                activeTab === tab
                  ? "border-b-2 border-teal-600 text-teal-700"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab === "semua" ? "Semua Kamar" : `Lantai ${tab}`}
            </button>
          ))}
        </div>

        {/* Grid/List toggle */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded-lg p-1.5 transition ${viewMode === "grid" ? "bg-slate-100 text-slate-700" : "text-slate-400 hover:text-slate-600"}`}
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-lg p-1.5 transition ${viewMode === "list" ? "bg-slate-100 text-slate-700" : "text-slate-400 hover:text-slate-600"}`}
          >
            <List className="size-4" />
          </button>
        </div>
      </div>

      {/* ── Search & Status Filters ──────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kamar atau tenant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1">
          {[
            { id: "semua", label: `Semua (${ringkasan.total})` },
            { id: "terisi", label: `Terisi (${ringkasan.terisi})` },
            { id: "kosong", label: `Kosong (${ringkasan.kosong})` },
            { id: "tunggakan", label: `Tunggakan (${ringkasan.tunggakan})` },
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
      </div>

      {/* ── Room grid ─────────────────────────────────────────────── */}
      {filteredRooms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 p-12 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Bed className="size-6" />
          </div>
          {rooms.length === 0 ? (
            <>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 mb-3">
                <span>Langkah 2 dari 5 Setup Portofolio</span>
              </div>
              <h3 className="mt-2 text-base font-semibold text-slate-800">Belum ada unit kamar</h3>
              <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-500">
                Tambahkan unit kamar pertama untuk mulai mengelola status ketersediaan, harga sewa bulanan, dan penetapan penghuni.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <Button
                  onClick={bukaTambahKamar}
                  className="rounded-xl bg-teal-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-teal-700"
                >
                  <Plus className="mr-1.5 size-4" />
                  Tambah Kamar Pertama
                </Button>
                <Link
                  href="/dashboard/owner"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Panduan Setup
                </Link>
              </div>
            </>
          ) : (
            <>
              <h3 className="mt-4 text-base font-semibold text-slate-800">Tidak ada kamar yang cocok</h3>
              <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-500">
                Tidak ada unit kamar yang sesuai dengan kata kunci pencarian atau filter lantai Anda.
              </p>
              <div className="mt-5">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setActiveTab("semua");
                  }}
                  className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Reset Filter &amp; Pencarian
                </Button>
              </div>
            </>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {paginatedRooms.map((room, idx) => (
            <RoomCard
              key={room.id}
              room={room}
              index={idx}
              isPending={isPending}
              onEdit={bukaEditKamar}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          {/* Mobile Cards (Hidden on md+) */}
          <div className="md:hidden divide-y divide-slate-100">
            {paginatedRooms.map((room) => {
              const cfg = STATUS_CONFIG[room.status as StatusKamar] || STATUS_CONFIG.kosong;
              const tunggakan = hasTunggakan(room);
              const penyewa = room.penghuni[0];
              return (
                <div
                  key={room.id}
                  onClick={() => bukaEditKamar(room)}
                  className="p-4 hover:bg-slate-50/70 transition-colors cursor-pointer active:bg-slate-100"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">Kamar {room.nomor}</span>
                      <span className="ml-2 text-xs text-slate-500 font-medium">Lantai {room.lantai} • {room.tipe}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {tunggakan && <TunggakanBadge />}
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${cfg.badge}`}>
                        <span className={`size-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                    <span className="text-slate-500">{penyewa ? `Penyewa: ${penyewa.nama}` : "Belum ada penyewa"}</span>
                    <span className="font-bold text-slate-900">{formatRupiah(room.hargaBulanan)}/bln</span>
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-1.5 pt-2 border-t border-slate-50" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => bukaEditKamar(room)}
                      className="h-7 px-2.5 text-xs rounded-lg border-slate-200"
                    >
                      <Pencil className="mr-1 size-3 text-slate-500" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(room)}
                      className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table with Sticky Header (Hidden on < md) */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs border-b border-slate-100">
                <TableRow>
                  <TableHead className="px-5 py-3 text-xs font-bold text-slate-600">Nomor Kamar</TableHead>
                  <TableHead className="px-5 py-3 text-xs font-bold text-slate-600">Lantai &amp; Tipe</TableHead>
                  <TableHead className="px-5 py-3 text-xs font-bold text-slate-600">Tarif / Bulan</TableHead>
                  <TableHead className="px-5 py-3 text-xs font-bold text-slate-600">Status</TableHead>
                  <TableHead className="px-5 py-3 text-xs font-bold text-slate-600">Penyewa Aktif</TableHead>
                  <TableHead className="px-5 py-3 text-xs font-bold text-slate-600">Properti</TableHead>
                  <TableHead className="px-5 py-3 text-xs font-bold text-slate-600 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                {paginatedRooms.map((room) => {
                  const cfg = STATUS_CONFIG[room.status as StatusKamar] || STATUS_CONFIG.kosong;
                  const tunggakan = hasTunggakan(room);
                  const penyewa = room.penghuni[0];
                  return (
                    <TableRow
                      key={room.id}
                      onClick={() => bukaEditKamar(room)}
                      className="cursor-pointer hover:bg-slate-50/80 transition-colors group"
                    >
                      <TableCell className="px-5 py-3.5 font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                        Kamar {room.nomor}
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-xs text-slate-600">
                        Lantai {room.lantai} • <span className="font-medium text-slate-700">{room.tipe}</span>
                      </TableCell>
                      <TableCell className="px-5 py-3.5 font-bold text-slate-900 text-sm">
                        {formatRupiah(room.hargaBulanan)}
                        <span className="text-[10px] font-normal text-slate-400">/bln</span>
                      </TableCell>
                      <TableCell className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${cfg.badge}`}>
                            <span className={`size-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                          {tunggakan && <TunggakanBadge />}
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-xs text-slate-700">
                        {penyewa ? (
                          <div>
                            <span className="font-semibold text-slate-900">{penyewa.nama}</span>
                            {penyewa.noHp && <div className="text-[11px] font-mono text-slate-400">+{penyewa.noHp}</div>}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Belum terisi</span>
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-xs text-slate-500">
                        {room.properti?.nama || "Kost Utama"}
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => bukaEditKamar(room)}
                            className="h-8 rounded-xl border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Pencil className="mr-1 size-3 text-slate-500" />
                            Edit
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button variant="ghost" size="icon" className="size-8 rounded-xl text-slate-500">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              }
                            />
                            <DropdownMenuContent align="end" className="rounded-xl">
                              <DropdownMenuItem onClick={() => bukaEditKamar(room)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Kamar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteTarget(room)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus Kamar
                              </DropdownMenuItem>
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
        </div>
      )}

      {/* ── Table Pagination Bar ──────────────────────────────────── */}
      {filteredRooms.length > 0 && (
        <div className="p-4 rounded-2xl border border-slate-100 bg-white shadow-xs">
          <DataTablePagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={filteredRooms.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            pageSizeOptions={[8, 12, 24, 48]}
            itemLabel="kamar"
          />
        </div>
      )}

      {/* ── Dialog Tambah / Edit (Batch 20 Form Standardization) ──── */}
      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) handleRequestClose();
          else setFormOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Unit Kamar" : "Tambah Kamar Baru"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Perbarui spesifikasi dan tarif sewa unit kamar di bawah ini."
                : "Tentukan nomor kamar, tarif bulanan, dan properti yang sesuai."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Properti */}
            <FormField
              label="Properti"
              description="Hubungkan unit ini dengan bangunan properti atau cabang kos"
            >
              {({ id }) => (
                <Select
                  value={form.propertiId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, propertiId: v === "none" ? "" : (v ?? "") }))
                  }
                >
                  <SelectTrigger id={id} className="rounded-xl">
                    {selectedProperti ? (
                      <span className="flex-1 truncate">{selectedProperti.nama}</span>
                    ) : (
                      <SelectValue placeholder="Pilih properti terdaftar" />
                    )}
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none">Tidak terhubung ke properti spesifik</SelectItem>
                    {propertiOptions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>

            {/* Nomor & Lantai */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Nomor Kamar" required error={errors.nomor}>
                {({ id, "aria-invalid": ariaInvalid }) => (
                  <Input
                    id={id}
                    placeholder="Contoh: A-01"
                    value={form.nomor}
                    onChange={(e) => setForm((f) => ({ ...f, nomor: e.target.value }))}
                    className={`rounded-xl ${ariaInvalid ? "border-rose-300 focus:border-rose-400" : ""}`}
                  />
                )}
              </FormField>

              <FormField label="Lantai" required>
                {({ id }) => (
                  <Input
                    id={id}
                    type="number"
                    min={1}
                    value={form.lantai}
                    onChange={(e) => setForm((f) => ({ ...f, lantai: e.target.value }))}
                    className="rounded-xl"
                  />
                )}
              </FormField>
            </div>

            {/* Tipe & Tarif Bulanan */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Tipe Kamar" required>
                {() => (
                  <Select
                    value={form.tipe}
                    onValueChange={(v) => setForm((f) => ({ ...f, tipe: v as TipeKamar }))}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Standard">Standard</SelectItem>
                      <SelectItem value="Deluxe">Deluxe</SelectItem>
                      <SelectItem value="VIP">VIP</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </FormField>

              <FormField
                label="Tarif / Bulan"
                required
                error={errors.hargaBulanan}
              >
                {({ id, "aria-invalid": ariaInvalid }) => (
                  <CurrencyInput
                    id={id}
                    value={form.hargaBulanan}
                    onChange={(val) => setForm((f) => ({ ...f, hargaBulanan: String(val) }))}
                    hasError={ariaInvalid}
                    placeholder="850.000"
                  />
                )}
              </FormField>
            </div>

            {/* Status Kamar */}
            <FormField label="Status Ketersediaan" required>
              {() => (
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v as StatusKamar }))}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="kosong">Kosong (Siap Disewa)</SelectItem>
                    <SelectItem value="terisi">Terisi (Ada Penghuni)</SelectItem>
                    <SelectItem value="maintenance">Dalam Perbaikan (Maintenance)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </FormField>

            {/* Penghuni (Bila Status Terisi) */}
            {form.status === "terisi" && (
              <FormField
                label="Penghuni Terdaftar"
                required
                error={errors.penghuniId}
                description="Pilih penyewa yang menempati kamar ini"
              >
                {({ id }) => (
                  <Select
                    value={form.penghuniId}
                    onValueChange={(v) => setForm((f) => ({ ...f, penghuniId: v ?? "" }))}
                  >
                    <SelectTrigger id={id} className="rounded-xl">
                      {selectedPenghuni ? (
                        <span className="flex-1 truncate">
                          {selectedPenghuni.nama} — {selectedPenghuni.noHp}
                        </span>
                      ) : (
                        <SelectValue placeholder="Pilih penghuni terdaftar" />
                      )}
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {opsiPenghuni.length === 0 && (
                        <div className="px-3 py-2 text-xs text-slate-500">
                          Belum ada data penghuni kosong. Daftarkan di menu Penghuni.
                        </div>
                      )}
                      {opsiPenghuni.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nama} — {p.noHp}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormField>
            )}

            {/* Catatan */}
            <FormField
              label="Catatan Kamar"
              description="Inventaris fasilitas, token listrik, atau catatan kondisi"
            >
              {({ id }) => (
                <Textarea
                  id={id}
                  placeholder="Contoh: AC sharp 0.5 PK, meteran listrik 24391..."
                  value={form.catatan}
                  onChange={(e) => setForm((f) => ({ ...f, catatan: e.target.value }))}
                  className="rounded-xl text-xs"
                />
              )}
            </FormField>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={handleRequestClose}
              disabled={isPending}
              className="rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Batal
            </Button>
            <SubmitButton
              onClick={submitForm}
              isPending={isPending}
              loadingText="Menyimpan..."
              className="text-xs"
            >
              {editingId ? "Simpan Perubahan" : "Tambah Kamar"}
            </SubmitButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dirty Form Warning Dialog (Batch 20) ──────────────────── */}
      <UnsavedChangesDialog
        open={dirtyConfirmOpen}
        onOpenChange={setDirtyConfirmOpen}
        onConfirmDiscard={() => {
          setDirtyConfirmOpen(false);
          setFormOpen(false);
        }}
      />

      {/* ── Konfirmasi Hapus (Batch 21: Destructive Confirmation) ──── */}
      <DestructiveDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={konfirmasiHapus}
        title="Hapus Kamar Secara Permanen?"
        entityName={deleteTarget ? `Kamar ${deleteTarget.nomor}` : undefined}
        description="Unit kamar akan dihapus secara permanen dari properti. Pastikan tidak ada penghuni aktif sebelum menghapus."
        confirmLabel="Hapus Kamar"
        isPending={isPending}
      />
    </div>
  );
}
