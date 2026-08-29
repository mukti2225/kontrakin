"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import type { Kamar, Penghuni, Properti } from "@/lib/generated/prisma/client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { ArrowLeft, Bed, DoorOpen, MapPin, MoreVertical, Pencil, Plus, Search, Trash2, Users, Wrench } from "lucide-react";

import { createUnit, updateUnit, deleteUnit, type UnitInput } from "./actions";

// ─── TYPES ───────────────────────────────────────────────────────────────────

type StatusKamar = "kosong" | "terisi" | "maintenance";
type TipeKamar = "Standard" | "Deluxe" | "VIP";
type KamarDenganPenghuni = Kamar & { penghuni: Penghuni[] };
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
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <div className="text-2xl font-bold text-blue-600">{stats.terisi}</div>
            <p className="text-xs text-muted-foreground">Okupansi {stats.okupansi}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Kosong</CardTitle>
            <Bed className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <div className="text-2xl font-bold text-emerald-600">{stats.kosong}</div>
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

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari nomor unit atau penghuni..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusKamar | "semua")}>
            <SelectTrigger className="w-full sm:w-44">
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
        <Button onClick={bukaTambah} disabled={isPending}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Unit
        </Button>
      </div>

      {/* Tabel unit */}
      <Card>
        <CardContent className="px-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Unit</TableHead>
                <TableHead>Lantai</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Harga / Bulan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Penghuni</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUnits.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    {units.length === 0 ? "Belum ada unit. Tambahkan unit pertama untuk properti ini." : "Tidak ada unit yang cocok dengan pencarian/filter."}
                  </TableCell>
                </TableRow>
              )}
              {filteredUnits.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell className="font-medium">{unit.nomor}</TableCell>
                  <TableCell>{unit.lantai}</TableCell>
                  <TableCell>{unit.tipe}</TableCell>
                  <TableCell>{formatRupiah(unit.hargaBulanan)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={STATUS_BADGE_CLASS[unit.status as StatusKamar]}>
                      {STATUS_LABEL[unit.status as StatusKamar]}
                    </Badge>
                  </TableCell>
                  <TableCell>{unit.penghuni[0]?.nama ?? "—"}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon" disabled={isPending}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        }
                      ></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => bukaEdit(unit)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(unit)}>
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

      {/* Konfirmasi Hapus */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus unit ini?</AlertDialogTitle>
            <AlertDialogDescription>Unit {deleteTarget?.nomor} akan dihapus secara permanen. Pastikan tidak ada penghuni aktif sebelum menghapus.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={konfirmasiHapus} disabled={isPending}>
              {isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
