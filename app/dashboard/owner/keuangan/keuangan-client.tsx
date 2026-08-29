"use client";

import { useMemo, useState, useTransition } from "react";
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

import { createTransaksi, updateTransaksi, deleteTransaksi, type TransaksiInput } from "./action";

// ─── Types ────────────────────────────────────────────────────────────────────

type TransaksiDenganRelasi = Transaksi & { kamar: Kamar | null; penghuni: Penghuni | null };
type Jenis = "pemasukan" | "pengeluaran";

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

// ─── Status config ────────────────────────────────────────────────────────────
// In a real billing system these would come from a dedicated Tagihan model.
// Here we derive "tagihan" status from transaksi.kategori and jenis.

type TagihanStatus = "lunas" | "menunggu_validasi" | "tunggakan" | "belum_bayar";
type PeriodeTagihan = "Bulanan" | "Tahunan (Cicil)";

function getTagihanStatus(t: TransaksiDenganRelasi): TagihanStatus {
  if (t.jenis === "pemasukan" && t.kategori === "Sewa Kamar") return "lunas";
  if (t.jenis === "pemasukan") return "menunggu_validasi";
  return "belum_bayar";
}

function getPeriode(t: TransaksiDenganRelasi): PeriodeTagihan {
  return t.keterangan?.toLowerCase().includes("tahunan") ? "Tahunan (Cicil)" : "Bulanan";
}

const STATUS_CONFIG: Record<TagihanStatus, { label: string; dot: string; badge: string }> = {
  lunas: {
    label: "Lunas",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  menunggu_validasi: {
    label: "Menunggu Validasi",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  tunggakan: {
    label: "Tunggakan",
    dot: "bg-rose-500",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
  },
  belum_bayar: {
    label: "Belum Bayar",
    dot: "bg-slate-400",
    badge: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface KeuanganClientProps {
  transaksi: TransaksiDenganRelasi[];
  kamarList: Kamar[];
  penghuniList: Penghuni[];
}

// ─── Pagination config ────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

// ─── Main component ───────────────────────────────────────────────────────────

export function KeuanganClient({ transaksi, kamarList, penghuniList }: KeuanganClientProps) {
  const [list, setList] = useState<TransaksiDenganRelasi[]>(transaksi);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(formKosong());
  const [errors, setErrors] = useState<FormErrors>({});
  const [deleteTarget, setDeleteTarget] = useState<TransaksiDenganRelasi | null>(null);

  // ── Current month ─────────────────────────────────────────────────────────
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const periodeLabel = `${MONTH_NAMES[currentMonth]} ${currentYear}`;

  const isThisMonth = (d: Date | string) => {
    const date = new Date(d);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const thisMonth = list.filter((t) => isThisMonth(t.tanggal));
    const totalTagihan = thisMonth
      .filter((t) => t.jenis === "pemasukan")
      .reduce((s, t) => s + t.jumlah, 0);

    const lunas = thisMonth.filter((t) => t.jenis === "pemasukan" && t.kategori === "Sewa Kamar").length;
    const totalKamar = kamarList.length;
    const menunggu = thisMonth.filter((t) => t.jenis === "pemasukan" && t.kategori !== "Sewa Kamar").length;
    const tunggakan = penghuniList.length - lunas > 0 ? penghuniList.length - lunas : 0;
    const totalTunggakan = thisMonth
      .filter((t) => getTagihanStatus(t) === "tunggakan")
      .reduce((s, t) => s + t.jumlah, 0);

    return { totalTagihan, lunas, totalKamar, menunggu, tunggakan, totalTunggakan };
  }, [list, kamarList, penghuniList]);

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── CRUD ──────────────────────────────────────────────────────────────────

  function kategoriUntuk(jenis: Jenis) {
    return jenis === "pemasukan" ? KATEGORI_PEMASUKAN : KATEGORI_PENGELUARAN;
  }

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

  function submit() {
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
          toast.success("Tagihan berhasil dicatat");
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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">

      {/* ── Section header ───────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Ringkasan Bulan Ini</h1>
          <p className="mt-0.5 text-sm text-slate-500">Periode {periodeLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Month selector (UI only) */}
          <button className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50">
            <Calendar className="size-3.5" />
            {MONTH_NAMES[currentMonth].slice(0, 3)} {currentYear}
            <ChevronRight className="size-3 text-slate-400" />
          </button>
          <button className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50">
            <Download className="size-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Tagihan — teal */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 p-5 shadow-sm shadow-teal-200/60">
          <button className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30">
            <ChevronRight className="size-3.5" />
          </button>
          <p className="text-sm font-medium text-white/80">Total Tagihan</p>
          <p className="mt-2 text-3xl font-bold text-white">
            {formatRupiahShort(stats.totalTagihan)}
          </p>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold text-white">
              <TrendingUp className="size-3" />
              +5.2% dari bulan lalu
            </span>
          </div>
        </div>

        {/* Lunas */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-500">Lunas</p>
            <CheckCircle2 className="size-5 text-emerald-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-800">{stats.lunas}</p>
          <p className="mt-0.5 text-xs text-slate-500">/ {stats.totalKamar} Kamar</p>
          {/* Progress bar */}
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${stats.totalKamar > 0 ? (stats.lunas / stats.totalKamar) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Menunggu Validasi */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-500">Menunggu Validasi</p>
            <Clock className="size-5 text-amber-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-800">{stats.menunggu}</p>
          {stats.menunggu > 0 && (
            <p className="mt-2 text-xs font-semibold text-amber-600">Perlu dicek hari ini</p>
          )}
        </div>

        {/* Tunggakan */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-500">Tunggakan</p>
            <AlertTriangle className="size-5 text-rose-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-rose-600">{stats.tunggakan}</p>
          <p className="mt-0.5 text-xs text-slate-500">Penghuni</p>
          {stats.totalTunggakan > 0 && (
            <p className="mt-2 text-xs font-medium text-rose-600">
              Total: {formatRupiah(stats.totalTunggakan)}
            </p>
          )}
        </div>
      </div>

      {/* ── Daftar Tagihan ───────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {/* Table header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-800">Daftar Tagihan</h2>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative hidden sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari penghuni atau kamar..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-56 rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition"
              />
            </div>
            {/* Filter icon */}
            <button className="flex size-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50">
              <SlidersHorizontal className="size-3.5" />
            </button>
            {/* Buat Tagihan */}
            <button
              onClick={bukaTambah}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 active:scale-[0.98] disabled:opacity-60"
            >
              <Plus className="size-3.5" />
              <span className="hidden sm:inline">Buat Tagihan</span>
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="relative px-4 py-2 sm:hidden">
          <Search className="pointer-events-none absolute left-7 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari penghuni atau kamar..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-sm placeholder:text-slate-400 focus:border-teal-400 focus:outline-none transition"
          />
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-x-4 border-b border-slate-100 bg-slate-50/60 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 max-sm:hidden">
          <span>Kamar / Penghuni</span>
          <span>Nominal</span>
          <span>Jatuh Tempo</span>
          <span>Status</span>
          <span className="text-right">Aksi</span>
        </div>

        {/* Rows */}
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <FileText className="size-10 text-slate-300" />
            <p className="text-sm text-slate-500">
              {search ? "Tidak ada tagihan yang cocok." : "Belum ada transaksi tercatat."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {paginated.map((t) => {
              const status = getTagihanStatus(t);
              const cfg = STATUS_CONFIG[status];
              const isTunggakan = status === "tunggakan";
              const isMenunggu = status === "menunggu_validasi";
              const isLunas = status === "lunas";
              const isBelum = status === "belum_bayar";
              const isOverdue = new Date(t.tanggal) < now && !isLunas;

              return (
                <li
                  key={t.id}
                  className="grid grid-cols-1 gap-3 px-5 py-4 transition hover:bg-slate-50/70 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] sm:items-center"
                >
                  {/* Kamar / Penghuni */}
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600">
                      {t.kamar?.nomor ?? "—"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {t.penghuni?.nama ?? t.kategori}
                      </p>
                      <p className="text-xs text-slate-500">{getPeriode(t)}</p>
                    </div>
                  </div>

                  {/* Nominal */}
                  <div className="sm:block">
                    <span className="text-sm font-semibold text-slate-700">
                      {formatRupiah(t.jumlah)}
                    </span>
                    {isTunggakan && (
                      <p className="text-xs font-semibold text-rose-600">
                        Tunggakan: {formatRupiah(t.jumlah)}
                      </p>
                    )}
                  </div>

                  {/* Jatuh Tempo */}
                  <div>
                    <span
                      className={`text-sm font-medium ${
                        isOverdue && !isLunas ? "text-rose-600" : "text-slate-700"
                      }`}
                    >
                      {formatTanggal(t.tanggal)}
                      {isOverdue && !isLunas && (
                        <span className="ml-1 text-xs">⊘</span>
                      )}
                    </span>
                  </div>

                  {/* Status badge */}
                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.badge}`}
                    >
                      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Aksi */}
                  <div className="flex items-center justify-end gap-2">
                    {isMenunggu && (
                      <button className="rounded-xl bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700">
                        Cek &amp; Validasi
                      </button>
                    )}
                    {isTunggakan && (
                      <>
                        <button className="flex size-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50">
                          <MessageSquare className="size-3.5" />
                        </button>
                        <button className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                          Ingatkan
                        </button>
                      </>
                    )}
                    {isLunas && (
                      <div className="flex size-8 items-center justify-center text-slate-400">
                        <FileText className="size-3.5" />
                      </div>
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
                        <DropdownMenuItem onClick={() => bukaEdit(t)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(t)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
          <p className="text-xs text-slate-500">
            Menampilkan {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–
            {Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length} data
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex size-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, idx, arr) => (
                <span key={p}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="px-1 text-xs text-slate-400">…</span>
                  )}
                  <button
                    onClick={() => setPage(p)}
                    className={`flex size-7 items-center justify-center rounded-lg text-xs font-medium transition ${
                      p === page
                        ? "bg-teal-600 text-white shadow-sm"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex size-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Dialog Tambah/Edit ────────────────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Transaksi" : "Buat Tagihan Baru"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Perbarui data transaksi." : "Isi data pemasukan atau pengeluaran kos."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="jenis">Jenis</Label>
                <Select
                  value={form.jenis}
                  onValueChange={(v) => setForm((f) => ({ ...f, jenis: v as Jenis, kategori: "" }))}
                >
                  <SelectTrigger id="jenis">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pemasukan">Pemasukan</SelectItem>
                    <SelectItem value="pengeluaran">Pengeluaran</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="kategori">Kategori</Label>
                <Select
                  value={form.kategori}
                  onValueChange={(v) => setForm((f) => ({ ...f, kategori: v ?? "" }))}
                >
                  <SelectTrigger id="kategori">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {kategoriUntuk(form.jenis).map((k) => (
                      <SelectItem key={k} value={k}>{k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.kategori && <p className="text-sm text-destructive">{errors.kategori}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="jumlah">Jumlah (Rp)</Label>
                <Input
                  id="jumlah"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.jumlah}
                  onChange={(e) => setForm((f) => ({ ...f, jumlah: e.target.value }))}
                />
                {errors.jumlah && <p className="text-sm text-destructive">{errors.jumlah}</p>}
                {form.jumlah && !Number.isNaN(Number(form.jumlah)) && (
                  <p className="text-xs text-muted-foreground">{formatRupiah(Number(form.jumlah))}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tanggal">Tanggal</Label>
                <Input
                  id="tanggal"
                  type="date"
                  value={form.tanggal}
                  onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))}
                />
                {errors.tanggal && <p className="text-sm text-destructive">{errors.tanggal}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="kamar">Kamar (opsional)</Label>
                <Select
                  value={form.kamarId || "none"}
                  onValueChange={(v) => setForm((f) => ({ ...f, kamarId: v === "none" ? "" : String(v) }))}
                >
                  <SelectTrigger id="kamar">
                    <SelectValue placeholder="Tidak terkait kamar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tidak terkait kamar</SelectItem>
                    {kamarList.map((k) => (
                      <SelectItem key={k.id} value={k.id}>Kamar {k.nomor}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="penghuni">Penghuni (opsional)</Label>
                <Select
                  value={form.penghuniId || "none"}
                  onValueChange={(v) => setForm((f) => ({ ...f, penghuniId: v === "none" ? "" : String(v) }))}
                >
                  <SelectTrigger id="penghuni">
                    <SelectValue placeholder="Tidak terkait penghuni" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tidak terkait penghuni</SelectItem>
                    {penghuniList.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="keterangan">Keterangan (opsional)</Label>
              <Textarea
                id="keterangan"
                value={form.keterangan}
                onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={isPending}>
              Batal
            </Button>
            <Button onClick={submit} disabled={isPending}>
              {isPending ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Buat Tagihan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Konfirmasi Hapus ──────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus transaksi ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Transaksi {deleteTarget?.kategori} sebesar{" "}
              {deleteTarget ? formatRupiah(deleteTarget.jumlah) : ""} akan dihapus permanen.
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
