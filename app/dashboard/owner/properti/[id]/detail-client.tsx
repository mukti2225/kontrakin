"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import type { Kamar, Penghuni, Properti, Pemeliharaan, Transaksi } from "@/lib/generated/prisma/client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DestructiveDialog } from "@/components/ui/destructive-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { exportToCSV } from "@/lib/utils/export-csv";

import {
  ArrowLeft,
  Bed,
  DoorOpen,
  MapPin,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  Wrench,
  Receipt,
  Download,
  Building2,
  TrendingUp,
  ExternalLink,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

import { createUnit, updateUnit, deleteUnit, type UnitInput } from "./actions";

// ─── TYPES ───────────────────────────────────────────────────────────────────

type StatusKamar = "kosong" | "terisi" | "maintenance";
type TipeKamar = "Standard" | "Deluxe" | "VIP";

type KamarDenganPenghuni = Kamar & {
  penghuni: Penghuni[];
  pemeliharaan?: Array<Pemeliharaan & { penghuni?: { nama: string } | null }>;
  transaksi?: Transaksi[];
};

type PropertiDenganKamar = Properti & { kamar: KamarDenganPenghuni[] };

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<StatusKamar, string> = {
  kosong: "Kosong",
  terisi: "Terisi",
  maintenance: "Perbaikan",
};

const STATUS_BADGE_CLASS: Record<StatusKamar, string> = {
  kosong: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  terisi: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  maintenance: "bg-amber-100 text-amber-700 hover:bg-amber-100",
};

const FORM_KOSONG = {
  nomor: "",
  lantai: "1",
  tipe: "Standard" as TipeKamar,
  hargaBulanan: "",
  status: "kosong" as StatusKamar,
  penghuniId: "",
  catatan: "",
};

function formatRupiah(nilai: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(nilai);
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

interface PropertiDetailClientProps {
  properti: PropertiDenganKamar;
  penghuniOptions: Penghuni[];
}

export function PropertiDetailClient({ properti, penghuniOptions }: PropertiDetailClientProps) {
  const [units, setUnits] = useState<KamarDenganPenghuni[]>(properti.kamar);
  const [activeTab, setActiveTab] = useState<"units" | "tenants" | "finance" | "maintenance" | "overview">("units");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusKamar | "semua">("semua");
  const [isPending, startTransition] = useTransition();

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(FORM_KOSONG);
  const [errors, setErrors] = useState<{ nomor?: string; hargaBulanan?: string; penghuniId?: string }>({});

  const [deleteTarget, setDeleteTarget] = useState<KamarDenganPenghuni | null>(null);

  // Penghuni yang tersedia: belum punya kamar, atau sedang di kamar yang diedit
  const opsiPenghuni = useMemo(() => {
    return penghuniOptions.filter((p) => p.kamarId === null || p.kamarId === editingId);
  }, [penghuniOptions, editingId]);

  const selectedPenghuni = opsiPenghuni.find((p) => p.id === form.penghuniId);

  // Active tenants in this property
  const tenantsList = useMemo(() => {
    return units.flatMap((u) =>
      u.penghuni.map((p) => ({
        id: p.id,
        nama: p.nama,
        noHp: p.noHp,
        email: p.email,
        tanggalMasuk: p.tanggalMasuk,
        status: p.status,
        kamarNomor: u.nomor,
        kamarLantai: u.lantai,
        kamarTipe: u.tipe,
        hargaBulanan: u.hargaBulanan,
      }))
    );
  }, [units]);

  // Maintenance tickets in this property
  const maintenanceList = useMemo(() => {
    return units
      .flatMap((u) =>
        (u.pemeliharaan ?? []).map((m) => ({
          ...m,
          kamarNomor: u.nomor,
        }))
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [units]);

  // Financial ledger / transactions in this property
  const transactionsList = useMemo(() => {
    return units
      .flatMap((u) =>
        (u.transaksi ?? []).map((t) => ({
          ...t,
          kamarNomor: u.nomor,
        }))
      )
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [units]);

  // Financial statistics for this property
  const potensiSewaBulanan = useMemo(
    () => units.reduce((acc, u) => acc + u.hargaBulanan, 0),
    [units]
  );
  const realisasiSewaBulanan = useMemo(
    () => units.filter((u) => u.status === "terisi").reduce((acc, u) => acc + u.hargaBulanan, 0),
    [units]
  );
  const potensiHilang = useMemo(
    () => units.filter((u) => u.status === "kosong").reduce((acc, u) => acc + u.hargaBulanan, 0),
    [units]
  );
  const rataRataTarif = useMemo(
    () => (units.length > 0 ? Math.round(potensiSewaBulanan / units.length) : 0),
    [units, potensiSewaBulanan]
  );

  // Filter & sort units
  const filteredUnits = useMemo(() => {
    return units
      .filter((u) => (statusFilter === "semua" ? true : u.status === statusFilter))
      .filter((u) => {
        const kata = search.trim().toLowerCase();
        if (!kata) return true;
        const namaPenghuni = u.penghuni[0]?.nama.toLowerCase() ?? "";
        return u.nomor.toLowerCase().includes(kata) || namaPenghuni.includes(kata);
      })
      .sort((a, b) => a.nomor.localeCompare(b.nomor));
  }, [units, search, statusFilter]);

  // Statistik
  const stats = useMemo(() => {
    const total = units.length;
    const terisi = units.filter((u) => u.status === "terisi").length;
    const kosong = units.filter((u) => u.status === "kosong").length;
    const maintenance = units.filter((u) => u.status === "maintenance").length;
    const okupansi = total === 0 ? 0 : Math.round((terisi / total) * 100);
    return { total, terisi, kosong, maintenance, okupansi };
  }, [units]);

  function handleExportCSV() {
    const headers = ["Nomor Unit", "Lantai", "Tipe", "Harga Bulanan (IDR)", "Status", "Nama Penghuni"];
    const rows = filteredUnits.map((u) => [
      u.nomor,
      u.lantai,
      u.tipe,
      u.hargaBulanan,
      u.status,
      u.penghuni[0]?.nama ?? "-",
    ]);
    exportToCSV(`unit_${properti.nama.replace(/\s+/g, "_")}`, headers, rows);
    toast.success("Daftar unit berhasil diekspor ke file CSV");
  }

  // ── FORM HANDLERS ──────────────────────────────────────────────────────────

  function bukaTambah() {
    setEditingId(null);
    setForm(FORM_KOSONG);
    setErrors({});
    setFormOpen(true);
  }

  function bukaEdit(unit: KamarDenganPenghuni) {
    setEditingId(unit.id);
    setForm({
      nomor: unit.nomor,
      lantai: String(unit.lantai),
      tipe: unit.tipe as TipeKamar,
      hargaBulanan: String(unit.hargaBulanan),
      status: unit.status as StatusKamar,
      penghuniId: unit.penghuni[0]?.id ?? "",
      catatan: unit.catatan ?? "",
    });
    setErrors({});
    setFormOpen(true);
  }

  function validateForm() {
    const e: typeof errors = {};
    if (!form.nomor.trim()) e.nomor = "Nomor unit wajib diisi";
    if (!form.hargaBulanan || Number(form.hargaBulanan) <= 0) e.hargaBulanan = "Harga bulanan harus lebih dari 0";
    if (form.status === "terisi" && !form.penghuniId) e.penghuniId = "Pilih penghuni yang sudah terdaftar";
    return e;
  }

  function submitForm() {
    const validationErrors = validateForm();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Lengkapi dulu field yang wajib diisi");
      return;
    }

    const payload: UnitInput = {
      nomor: form.nomor.trim(),
      lantai: Number(form.lantai) || 1,
      tipe: form.tipe,
      hargaBulanan: Number(form.hargaBulanan),
      status: form.status,
      penghuniId: form.status === "terisi" ? form.penghuniId : null,
      catatan: form.catatan.trim() || undefined,
    };

    startTransition(async () => {
      try {
        if (editingId) {
          const updated = await updateUnit(editingId, properti.id, payload);
          setUnits((prev) => prev.map((u) => (u.id === editingId ? updated : u)));
          toast.success(`Unit ${payload.nomor} berhasil diperbarui`);
        } else {
          const created = await createUnit(properti.id, payload);
          setUnits((prev) => [...prev, created]);
          toast.success(`Unit ${payload.nomor} berhasil ditambahkan`);
        }
        setFormOpen(false);
      } catch {
        toast.error("Gagal menyimpan unit. Pastikan nomor unit belum dipakai di properti ini.");
      }
    });
  }

  function konfirmasiHapus() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      try {
        await deleteUnit(target.id, properti.id);
        setUnits((prev) => prev.filter((u) => u.id !== target.id));
        toast.success(`Unit ${target.nomor} berhasil dihapus`);
      } catch {
        toast.error("Gagal menghapus unit");
      } finally {
        setDeleteTarget(null);
      }
    });
  }

  // ── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb / Back */}
      <div className="flex items-center gap-2">
        <Link href="/dashboard/owner/properti" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8 gap-1.5 px-2")}>
          <ArrowLeft className="w-4 h-4" />
          Properti
        </Link>
        <span className="text-muted-foreground text-sm">/</span>
        <span className="text-sm font-medium truncate">{properti.nama}</span>
      </div>

      {/* Header properti */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border bg-muted/30">
        {properti.foto && <img src={properti.foto} alt={properti.nama} className="w-full sm:w-32 h-32 sm:h-24 object-cover rounded-lg shrink-0" />}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">{properti.nama}</h1>
            <Badge variant="secondary">{properti.tipe}</Badge>
          </div>
          <p className="text-sm text-muted-foreground flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            {properti.alamat}
          </p>
          {properti.fasilitas && <p className="text-xs text-muted-foreground">🏠 {properti.fasilitas}</p>}
        </div>
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Unit</CardTitle>
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Terisi</CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <div className="text-2xl font-bold text-emerald-600">{stats.terisi}</div>
            <p className="text-xs text-muted-foreground">Okupansi {stats.okupansi}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Kosong</CardTitle>
            <Bed className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <div className="text-2xl font-bold text-slate-700">{stats.kosong}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Perbaikan</CardTitle>
            <Wrench className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <div className="text-2xl font-bold text-amber-600">{stats.maintenance}</div>
          </CardContent>
        </Card>
      </div>

      {/* ── Operational Tabs ─────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200">
        <div className="flex flex-wrap gap-1 -mb-px">
          {[
            { id: "units", label: `Daftar Unit (${stats.total})`, icon: DoorOpen },
            { id: "tenants", label: `Penyewa Aktif (${tenantsList.length})`, icon: Users },
            { id: "finance", label: "Keuangan & Yield", icon: Receipt },
            { id: "maintenance", label: `Pemeliharaan (${maintenanceList.length})`, icon: Wrench },
            { id: "overview", label: "Ringkasan Aset", icon: Building2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${
                  isActive
                    ? "border-teal-600 text-teal-800 bg-teal-50/50 rounded-t-xl"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
              >
                <Icon className={`size-4 ${isActive ? "text-teal-600" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TAB 1: UNITS ──────────────────────────────────────────────── */}
      {activeTab === "units" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nomor unit atau penghuni..."
                  className="pl-8 text-xs"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusKamar | "semua")}>
                <SelectTrigger className="w-full sm:w-44 text-xs">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua status</SelectItem>
                  <SelectItem value="kosong">Kosong</SelectItem>
                  <SelectItem value="terisi">Terisi</SelectItem>
                  <SelectItem value="maintenance">Perbaikan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="gap-1.5 border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Download className="size-3.5 text-slate-600" />
                Ekspor CSV
              </Button>
              <Button
                size="sm"
                onClick={bukaTambah}
                disabled={isPending}
                className="gap-1.5 bg-teal-600 text-xs font-semibold text-white shadow-sm hover:bg-teal-700"
              >
                <Plus className="size-3.5" />
                Tambah Unit
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden border-slate-200/80 shadow-xs">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50 text-xs uppercase text-slate-500">
                  <TableRow>
                    <TableHead className="px-5 py-3.5">No. Unit</TableHead>
                    <TableHead className="px-5 py-3.5">Lantai</TableHead>
                    <TableHead className="px-5 py-3.5">Tipe</TableHead>
                    <TableHead className="px-5 py-3.5">Harga / Bulan</TableHead>
                    <TableHead className="px-5 py-3.5">Status</TableHead>
                    <TableHead className="px-5 py-3.5">Penghuni</TableHead>
                    <TableHead className="px-5 py-3.5 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 text-sm">
                  {filteredUnits.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-slate-500">
                        {units.length === 0
                          ? "Belum ada unit. Tambahkan unit pertama untuk properti ini."
                          : "Tidak ada unit yang cocok dengan pencarian/filter."}
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredUnits.map((unit) => (
                    <TableRow key={unit.id} className="hover:bg-slate-50/70 transition-colors">
                      <TableCell className="px-5 py-3.5 font-bold text-slate-900">{unit.nomor}</TableCell>
                      <TableCell className="px-5 py-3.5 text-slate-600">Lantai {unit.lantai}</TableCell>
                      <TableCell className="px-5 py-3.5 text-slate-600">{unit.tipe}</TableCell>
                      <TableCell className="px-5 py-3.5 font-semibold text-slate-900 font-mono">
                        {formatRupiah(unit.hargaBulanan)}
                      </TableCell>
                      <TableCell className="px-5 py-3.5">
                        <StatusBadge
                          variant={unit.status === "terisi" ? "emerald" : unit.status === "maintenance" ? "amber" : "slate"}
                          dot
                        >
                          {STATUS_LABEL[unit.status as StatusKamar]}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-slate-700 font-medium">
                        {unit.penghuni[0]?.nama ?? "—"}
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon" disabled={isPending} className="h-8 w-8 text-slate-400 hover:text-slate-700">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => bukaEdit(unit)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-rose-600 focus:text-rose-600"
                              onClick={() => setDeleteTarget(unit)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB 2: TENANTS ────────────────────────────────────────────── */}
      {activeTab === "tenants" && (
        <Card className="overflow-hidden border-slate-200/80 shadow-xs">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
            <CardTitle className="text-sm font-bold text-slate-800">
              Daftar Penyewa Aktif di {properti.nama}
            </CardTitle>
            <p className="text-xs text-slate-500">
              Total {tenantsList.length} penghuni yang saat ini menempati unit kamar di properti ini.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {tenantsList.length === 0 ? (
              <div className="py-14 text-center">
                <Users className="mx-auto size-10 text-slate-300" />
                <p className="mt-3 text-sm font-bold text-slate-700">Belum Ada Penyewa Aktif</p>
                <p className="mt-1 text-xs text-slate-500">
                  Tempatkan penyewa ke dalam unit kamar kosong melalui tab Daftar Unit.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50 text-xs uppercase text-slate-500">
                  <TableRow>
                    <TableHead className="px-5 py-3.5">Nama Penyewa</TableHead>
                    <TableHead className="px-5 py-3.5">Unit Kamar</TableHead>
                    <TableHead className="px-5 py-3.5">Tipe Kamar</TableHead>
                    <TableHead className="px-5 py-3.5">Tarif Sewa</TableHead>
                    <TableHead className="px-5 py-3.5">Mulai Menghuni</TableHead>
                    <TableHead className="px-5 py-3.5 text-right">Kontak WhatsApp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 text-sm">
                  {tenantsList.map((tenant) => (
                    <TableRow key={tenant.id} className="hover:bg-slate-50/70 transition-colors">
                      <TableCell className="px-5 py-3.5 font-bold text-slate-900">{tenant.nama}</TableCell>
                      <TableCell className="px-5 py-3.5 font-semibold text-teal-700">
                        Kamar {tenant.kamarNomor} (Lt. {tenant.kamarLantai})
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-slate-600">{tenant.kamarTipe}</TableCell>
                      <TableCell className="px-5 py-3.5 font-mono text-slate-900 font-semibold">
                        {formatRupiah(tenant.hargaBulanan)}
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-xs text-slate-500">
                        {new Date(tenant.tanggalMasuk).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-right">
                        <a
                          href={`https://wa.me/${tenant.noHp.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition shadow-2xs"
                        >
                          <MessageSquare className="size-3 text-emerald-600" />
                          <span>{tenant.noHp}</span>
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── TAB 3: FINANCE ────────────────────────────────────────────── */}
      {activeTab === "finance" && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="border-teal-100 bg-teal-50/40">
              <CardHeader className="pb-1 pt-3.5 px-4">
                <CardTitle className="text-xs font-semibold text-teal-800">Potensi Sewa Bulanan</CardTitle>
              </CardHeader>
              <CardContent className="pb-3.5 px-4">
                <div className="text-xl font-black text-teal-950 font-mono">
                  {formatRupiah(potensiSewaBulanan)}
                </div>
                <p className="mt-1 text-[11px] text-teal-700">Jika 100% unit terisi</p>
              </CardContent>
            </Card>

            <Card className="border-emerald-100 bg-emerald-50/40">
              <CardHeader className="pb-1 pt-3.5 px-4">
                <CardTitle className="text-xs font-semibold text-emerald-800">Realisasi Berjalan</CardTitle>
              </CardHeader>
              <CardContent className="pb-3.5 px-4">
                <div className="text-xl font-black text-emerald-950 font-mono">
                  {formatRupiah(realisasiSewaBulanan)}
                </div>
                <p className="mt-1 text-[11px] text-emerald-700">{stats.okupansi}% dari potensi total</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-slate-50/50">
              <CardHeader className="pb-1 pt-3.5 px-4">
                <CardTitle className="text-xs font-semibold text-slate-700">Kapasitas Kosong (Loss)</CardTitle>
              </CardHeader>
              <CardContent className="pb-3.5 px-4">
                <div className="text-xl font-black text-slate-800 font-mono">
                  {formatRupiah(potensiHilang)}
                </div>
                <p className="mt-1 text-[11px] text-slate-500">{stats.kosong} kamar belum tersewa</p>
              </CardContent>
            </Card>

            <Card className="border-indigo-100 bg-indigo-50/40">
              <CardHeader className="pb-1 pt-3.5 px-4">
                <CardTitle className="text-xs font-semibold text-indigo-800">Rata-Rata Tarif Sewa</CardTitle>
              </CardHeader>
              <CardContent className="pb-3.5 px-4">
                <div className="text-xl font-black text-indigo-950 font-mono">
                  {formatRupiah(rataRataTarif)}
                </div>
                <p className="mt-1 text-[11px] text-indigo-700">Per unit kamar / bulan</p>
              </CardContent>
            </Card>
          </div>

          <Card className="overflow-hidden border-slate-200/80 shadow-xs">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
              <CardTitle className="text-sm font-bold text-slate-800">
                Riwayat Transaksi Kas Kamar di {properti.nama}
              </CardTitle>
              <p className="text-xs text-slate-500">
                Arus kas masuk dan pengeluaran yang terhubung langsung dengan unit di gedung ini.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {transactionsList.length === 0 ? (
                <div className="py-12 text-center">
                  <Receipt className="mx-auto size-10 text-slate-300" />
                  <p className="mt-3 text-sm font-bold text-slate-700">Belum Ada Transaksi Kas</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Pencatatan kas sewa atau biaya perbaikan kamar akan tampil di sini.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50 text-xs uppercase text-slate-500">
                    <TableRow>
                      <TableHead className="px-5 py-3.5">Tanggal</TableHead>
                      <TableHead className="px-5 py-3.5">Jenis</TableHead>
                      <TableHead className="px-5 py-3.5">Kategori</TableHead>
                      <TableHead className="px-5 py-3.5">Kamar Terkait</TableHead>
                      <TableHead className="px-5 py-3.5">Keterangan</TableHead>
                      <TableHead className="px-5 py-3.5 text-right">Jumlah</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100 text-sm">
                    {transactionsList.map((t) => (
                      <TableRow key={t.id} className="hover:bg-slate-50/70 transition-colors">
                        <TableCell className="px-5 py-3.5 text-xs text-slate-500">
                          {new Date(t.tanggal).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="px-5 py-3.5">
                          <StatusBadge variant={t.jenis === "pemasukan" ? "emerald" : "rose"}>
                            {t.jenis === "pemasukan" ? "Pemasukan" : "Pengeluaran"}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="px-5 py-3.5 font-medium text-slate-800">{t.kategori}</TableCell>
                        <TableCell className="px-5 py-3.5 font-semibold text-teal-700">Kamar {t.kamarNomor}</TableCell>
                        <TableCell className="px-5 py-3.5 text-slate-500 text-xs">{t.keterangan || "-"}</TableCell>
                        <TableCell className="px-5 py-3.5 text-right font-mono font-bold text-slate-900">
                          {formatRupiah(t.jumlah)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB 4: MAINTENANCE ────────────────────────────────────────── */}
      {activeTab === "maintenance" && (
        <Card className="overflow-hidden border-slate-200/80 shadow-xs">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
            <CardTitle className="text-sm font-bold text-slate-800">
              Laporan Pemeliharaan &amp; Perbaikan di {properti.nama}
            </CardTitle>
            <p className="text-xs text-slate-500">
              Keluhan fasilitas dan penanganan teknisi pada unit-unit properti ini.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {maintenanceList.length === 0 ? (
              <div className="py-14 text-center">
                <CheckCircle2 className="mx-auto size-10 text-emerald-400" />
                <p className="mt-3 text-sm font-bold text-slate-700">Fasilitas Berfungsi Optimal</p>
                <p className="mt-1 text-xs text-slate-500">
                  Tidak ada tiket keluhan atau perbaikan yang dilaporkan pada properti ini.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50 text-xs uppercase text-slate-500">
                  <TableRow>
                    <TableHead className="px-5 py-3.5">Keluhan</TableHead>
                    <TableHead className="px-5 py-3.5">Unit Kamar</TableHead>
                    <TableHead className="px-5 py-3.5">Pelapor</TableHead>
                    <TableHead className="px-5 py-3.5">Prioritas</TableHead>
                    <TableHead className="px-5 py-3.5">Status</TableHead>
                    <TableHead className="px-5 py-3.5 text-right">Tanggal Lapor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 text-sm">
                  {maintenanceList.map((m) => (
                    <TableRow key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      <TableCell className="px-5 py-3.5 font-bold text-slate-900">
                        {m.judul}
                        <p className="text-xs font-normal text-slate-500 line-clamp-1 mt-0.5">{m.deskripsi}</p>
                      </TableCell>
                      <TableCell className="px-5 py-3.5 font-semibold text-teal-700">Kamar {m.kamarNomor}</TableCell>
                      <TableCell className="px-5 py-3.5 text-slate-700">{m.penghuni?.nama ?? "Penghuni"}</TableCell>
                      <TableCell className="px-5 py-3.5">
                        <StatusBadge
                          variant={m.prioritas === "tinggi" ? "rose" : m.prioritas === "sedang" ? "amber" : "slate"}
                        >
                          {m.prioritas}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="px-5 py-3.5">
                        <StatusBadge
                          variant={m.status === "selesai" ? "emerald" : m.status === "diproses" ? "amber" : "rose"}
                          dot
                        >
                          {m.status}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-right text-xs text-slate-500">
                        {new Date(m.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── TAB 5: OVERVIEW ───────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
              <CardTitle className="text-sm font-bold text-slate-800">Profil &amp; Spesifikasi Properti</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3.5 text-sm">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nama Gedung / Aset</span>
                <p className="font-bold text-slate-900 text-base">{properti.nama}</p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Klasifikasi Aset</span>
                <p className="font-semibold text-slate-800 capitalize">{properti.tipe}</p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Alamat Lengkap</span>
                <p className="text-slate-700 leading-relaxed">{properti.alamat}</p>
                {properti.lokasiMaps && (
                  <a
                    href={properti.lokasiMaps}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline"
                  >
                    <span>Buka di Google Maps</span>
                    <ExternalLink className="size-3" />
                  </a>
                )}
              </div>

              {properti.deskripsi && (
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Deskripsi Properti</span>
                  <p className="text-slate-600 leading-relaxed mt-0.5">{properti.deskripsi}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
              <CardTitle className="text-sm font-bold text-slate-800">Fasilitas Bersama &amp; Operasional</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-sm">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fasilitas Properti</span>
                {properti.fasilitas ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {properti.fasilitas.split(/[,;\n]+/).map((f, i) => (
                      <span
                        key={i}
                        className="rounded-lg bg-teal-50 border border-teal-100 px-2.5 py-1 text-xs font-medium text-teal-800"
                      >
                        ✓ {f.trim()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-slate-400 italic">Belum ada rincian fasilitas dicantumkan.</p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ringkasan Okupansi</span>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Persentase Terhuni</span>
                  <span className="font-bold text-teal-700">{stats.okupansi}%</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-teal-600 rounded-full transition-all duration-300"
                    style={{ width: `${stats.okupansi}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dialog Tambah / Edit Unit */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Unit" : "Tambah Unit Baru"}</DialogTitle>
            <DialogDescription>{editingId ? "Perbarui detail unit di bawah ini." : `Tambahkan unit baru ke properti "${properti.nama}".`}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="nomor">Nomor Unit</Label>
                <Input id="nomor" placeholder="Contoh: A-01" value={form.nomor} onChange={(e) => setForm((f) => ({ ...f, nomor: e.target.value }))} />
                {errors.nomor && <p className="text-sm text-destructive">{errors.nomor}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lantai">Lantai</Label>
                <Input id="lantai" type="number" min={1} value={form.lantai} onChange={(e) => setForm((f) => ({ ...f, lantai: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Tipe Unit</Label>
                <Select value={form.tipe} onValueChange={(v) => setForm((f) => ({ ...f, tipe: v as TipeKamar }))}>
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
                <Input id="harga" type="number" min={0} placeholder="850000" value={form.hargaBulanan} onChange={(e) => setForm((f) => ({ ...f, hargaBulanan: e.target.value }))} />
                {errors.hargaBulanan && <p className="text-sm text-destructive">{errors.hargaBulanan}</p>}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as StatusKamar }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kosong">Kosong</SelectItem>
                  <SelectItem value="terisi">Terisi</SelectItem>
                  <SelectItem value="maintenance">Perbaikan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.status === "terisi" && (
              <div className="grid gap-2">
                <Label htmlFor="penghuniId">Nama Penghuni</Label>
                <Select value={form.penghuniId} onValueChange={(v) => setForm((f) => ({ ...f, penghuniId: v ?? "" }))}>
                  <SelectTrigger id="penghuniId">{selectedPenghuni ? <span className="flex-1 truncate">{selectedPenghuni.nama}</span> : <SelectValue placeholder="Pilih penghuni terdaftar" />}</SelectTrigger>
                  <SelectContent>
                    {opsiPenghuni.length === 0 && <div className="px-2 py-3 text-sm text-muted-foreground">Belum ada penghuni tersedia. Daftarkan dulu di halaman Penghuni.</div>}
                    {opsiPenghuni.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nama} — {p.noHp}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.penghuniId && <p className="text-sm text-destructive">{errors.penghuniId}</p>}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="catatan">Catatan (opsional)</Label>
              <Textarea id="catatan" placeholder="Catatan tambahan mengenai unit ini..." value={form.catatan} onChange={(e) => setForm((f) => ({ ...f, catatan: e.target.value }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={isPending}>
              Batal
            </Button>
            <Button onClick={submitForm} disabled={isPending}>
              {isPending ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah Unit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Konfirmasi Hapus Unit (Batch 21: Destructive Confirmation) ──── */}
      <DestructiveDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={konfirmasiHapus}
        title="Hapus Unit Kamar Secara Permanen?"
        entityName={deleteTarget ? `Unit Kamar ${deleteTarget.nomor}` : undefined}
        description="Unit kamar akan dihapus secara permanen. Pastikan tidak ada penghuni aktif sebelum menghapus."
        confirmLabel="Hapus Unit"
        isPending={isPending}
      />
    </div>
  );
}
