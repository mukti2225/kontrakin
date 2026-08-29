"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
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
} from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
    badge: "bg-white/90 text-slate-800 border-slate-200",
  },
  kosong: {
    label: "KOSONG",
    dot: "bg-slate-400",
    badge: "bg-white/90 text-slate-800 border-slate-200",
  },
  maintenance: {
    label: "MAINTENANCE",
    dot: "bg-amber-500",
    badge: "bg-white/90 text-slate-800 border-slate-200",
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
    <span className="flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
      <span className="size-1.5 rounded-full bg-white" />
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
  const [rooms, setRooms] = useState<KamarDenganPenghuni[]>(initialRooms);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("semua");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isPending, startTransition] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<KamarFormState>(FORM_KOSONG);
  const [errors, setErrors] = useState<KamarFormErrors>({});
  const [deleteTarget, setDeleteTarget] = useState<KamarDenganPenghuni | null>(null);

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
        const kata = search.trim().toLowerCase();
        if (!kata) return true;
        const namaPenghuni = r.penghuni[0]?.nama.toLowerCase() ?? "";
        return r.nomor.toLowerCase().includes(kata) || namaPenghuni.includes(kata);
      })
      .sort((a, b) => a.nomor.localeCompare(b.nomor));
  }, [rooms, search, activeTab, selectedPropertiId]);

  // ── First properti name for the heading ────────────────────────────────────
  const propertiName =
    (selectedPropertiId
      ? propertiOptions.find((p) => p.id === selectedPropertiId)?.nama
      : rooms.find((r) => r.properti)?.properti?.nama) ?? "Manajemen Kamar";

  // ── CRUD ─────────────────────────────────────────────────────────────────────

  function bukaTambahKamar() {
    setEditingId(null);
    setForm(FORM_KOSONG);
    setErrors({});
    setFormOpen(true);
  }

  function bukaEditKamar(room: KamarDenganPenghuni) {
    setEditingId(room.id);
    setForm({
      nomor: room.nomor,
      lantai: String(room.lantai),
      tipe: room.tipe as TipeKamar,
      hargaBulanan: String(room.hargaBulanan),
      status: room.status as StatusKamar,
      penghuniId: room.penghuni[0]?.id ?? "",
      propertiId: room.properti?.id ?? "",
      catatan: room.catatan ?? "",
    });
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
          <button className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50">
            <Filter className="size-3.5" />
            Filter
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

      {/* ── Search bar ────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Cari kamar atau tenant..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition"
        />
      </div>

      {/* ── Room grid ─────────────────────────────────────────────── */}
      {filteredRooms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <Bed className="mx-auto size-10 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">
            Tidak ada kamar yang cocok dengan pencarian / filter.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {filteredRooms.map((room, idx) => (
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
      )}

      {/* ── Load more ─────────────────────────────────────────────── */}
      {filteredRooms.length > 0 && (
        <div className="pt-2 text-center">
          <button className="text-sm font-semibold text-teal-600 hover:underline">
            Muat Lebih Banyak...
          </button>
        </div>
      )}

      {/* ── Dialog Tambah / Edit ──────────────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Kamar" : "Tambah Kamar Baru"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Perbarui detail kamar di bawah ini."
                : "Isi detail kamar yang ingin ditambahkan."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Properti (Opsional)</Label>
              <Select
                value={form.propertiId}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, propertiId: v === "none" ? "" : (v ?? "") }))
                }
              >
                <SelectTrigger id="propertiId">
                  {selectedProperti ? (
                    <span className="flex-1 truncate">{selectedProperti.nama}</span>
                  ) : (
                    <SelectValue placeholder="Pilih Properti terdaftar" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak terhubung ke properti</SelectItem>
                  {propertiOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="nomor">Nomor Kamar</Label>
                <Input
                  id="nomor"
                  placeholder="Contoh: A-01"
                  value={form.nomor}
                  onChange={(e) => setForm((f) => ({ ...f, nomor: e.target.value }))}
                />
                {errors.nomor && <p className="text-sm text-destructive">{errors.nomor}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lantai">Lantai</Label>
                <Input
                  id="lantai"
                  type="number"
                  min={1}
                  value={form.lantai}
                  onChange={(e) => setForm((f) => ({ ...f, lantai: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Tipe Kamar</Label>
                <Select
                  value={form.tipe}
                  onValueChange={(v) => setForm((f) => ({ ...f, tipe: v as TipeKamar }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Deluxe">Deluxe</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="harga">Harga / Bulan (Rp)</Label>
                <Input
                  id="harga"
                  type="number"
                  min={0}
                  placeholder="850000"
                  value={form.hargaBulanan}
                  onChange={(e) => setForm((f) => ({ ...f, hargaBulanan: e.target.value }))}
                />
                {errors.hargaBulanan && (
                  <p className="text-sm text-destructive">{errors.hargaBulanan}</p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as StatusKamar }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kosong">Kosong</SelectItem>
                  <SelectItem value="terisi">Terisi</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.status === "terisi" && (
              <div className="grid gap-2">
                <Label htmlFor="penghuniId">Nama Penghuni</Label>
                <Select
                  value={form.penghuniId}
                  onValueChange={(v) => setForm((f) => ({ ...f, penghuniId: v ?? "" }))}
                >
                  <SelectTrigger id="penghuniId">
                    {selectedPenghuni ? (
                      <span className="flex-1 truncate">
                        {selectedPenghuni.nama} — {selectedPenghuni.noHp}
                      </span>
                    ) : (
                      <SelectValue placeholder="Pilih penghuni terdaftar" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {opsiPenghuni.length === 0 && (
                      <div className="px-2 py-3 text-sm text-muted-foreground">
                        Belum ada penghuni tersedia. Daftarkan dulu di halaman Penghuni.
                      </div>
                    )}
                    {opsiPenghuni.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nama} — {p.noHp}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.penghuniId && (
                  <p className="text-sm text-destructive">{errors.penghuniId}</p>
                )}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="catatan">Catatan (opsional)</Label>
              <Textarea
                id="catatan"
                placeholder="Catatan tambahan, misalnya kondisi kamar"
                value={form.catatan}
                onChange={(e) => setForm((f) => ({ ...f, catatan: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={isPending}>
              Batal
            </Button>
            <Button onClick={submitForm} disabled={isPending}>
              {isPending ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah Kamar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Konfirmasi Hapus ─────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus kamar ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Kamar {deleteTarget?.nomor} akan dihapus secara permanen dan tidak dapat dikembalikan.
              Pastikan tidak ada penghuni aktif sebelum menghapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={konfirmasiHapus}
              disabled={isPending}
            >
              {isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
