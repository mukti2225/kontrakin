"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { Kamar, Penghuni } from "@/lib/generated/prisma/client";
import { Bed, DoorOpen, MoreVertical, Pencil, Plus, Search, Trash2, Users, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

import { createKamar, updateKamar, deleteKamar, type KamarInput } from "./action";

// ---------------------------------------------------------------------------
// Tipe data
// ---------------------------------------------------------------------------

type StatusKamar = "kosong" | "terisi" | "maintenance";
type TipeKamar = "Standard" | "Deluxe" | "VIP";
type KamarDenganPenghuni = Kamar & { penghuni: Penghuni[] };

interface KamarFormState {
  nomor: string;
  lantai: string;
  tipe: TipeKamar;
  hargaBulanan: string;
  status: StatusKamar;
  penghuniId: string;
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
  catatan: "",
};

const STATUS_LABEL: Record<StatusKamar, string> = {
  kosong: "Kosong",
  terisi: "Terisi",
  maintenance: "Maintenance",
};

const STATUS_BADGE_CLASS: Record<StatusKamar, string> = {
  kosong: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  terisi: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  maintenance: "bg-amber-100 text-amber-700 hover:bg-amber-100",
};

function formatRupiah(nilai: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(nilai);
}

// ---------------------------------------------------------------------------
// Komponen
// ---------------------------------------------------------------------------

interface KamarClientProps {
  initialRooms: KamarDenganPenghuni[];
  penghuniOptions: Penghuni[];
}

export function KamarClient({ initialRooms, penghuniOptions }: KamarClientProps) {
  const [rooms, setRooms] = useState<KamarDenganPenghuni[]>(initialRooms);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusKamar | "semua">("semua");
  const [isPending, startTransition] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<KamarFormState>(FORM_KOSONG);
  const [errors, setErrors] = useState<KamarFormErrors>({});

  const [deleteTarget, setDeleteTarget] = useState<KamarDenganPenghuni | null>(null);

  const opsiPenghuni = useMemo(() => {
    return penghuniOptions.filter((p) => p.kamarId === null || p.kamarId === editingId);
  }, [penghuniOptions, editingId]);

  const selectedPenghuni = opsiPenghuni.find((p) => p.id === form.penghuniId);

  const filteredRooms = useMemo(() => {
    return rooms
      .filter((room) => (statusFilter === "semua" ? true : room.status === statusFilter))
      .filter((room) => {
        const kata = search.trim().toLowerCase();
        if (!kata) return true;
        const namaPenghuni = room.penghuni[0]?.nama.toLowerCase() ?? "";
        return room.nomor.toLowerCase().includes(kata) || namaPenghuni.includes(kata);
      })
      .sort((a, b) => a.nomor.localeCompare(b.nomor));
  }, [rooms, search, statusFilter]);

  const ringkasan = useMemo(() => {
    const total = rooms.length;
    const terisi = rooms.filter((r) => r.status === "terisi").length;
    const kosong = rooms.filter((r) => r.status === "kosong").length;
    const maintenance = rooms.filter((r) => r.status === "maintenance").length;
    const okupansi = total === 0 ? 0 : Math.round((terisi / total) * 100);
    return { total, terisi, kosong, maintenance, okupansi };
  }, [rooms]);

  // -------------------------------------------------------------------------
  // Alur CRUD
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Manajemen Kamar</h1>
        <p className="text-muted-foreground">Kelola data kamar, status hunian, dan penempatan penghuni.</p>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Kamar</CardTitle>
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ringkasan.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Terisi</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ringkasan.terisi}</div>
            <p className="text-xs text-muted-foreground">Okupansi {ringkasan.okupansi}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Kosong</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ringkasan.kosong}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ringkasan.maintenance}</div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari nomor kamar atau penghuni..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusKamar | "semua")}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua status</SelectItem>
              <SelectItem value="kosong">Kosong</SelectItem>
              <SelectItem value="terisi">Terisi</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={bukaTambahKamar} disabled={isPending}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Kamar
        </Button>
      </div>

      {/* Tabel kamar */}
      <Card>
        <CardContent className="px-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomor</TableHead>
                <TableHead>Lantai</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Harga / Bulan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Penghuni</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRooms.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Tidak ada kamar yang cocok dengan pencarian/filter.
                  </TableCell>
                </TableRow>
              )}
              {filteredRooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium">
                    <Link href={`/dashboard/owner/kamar/${room.id}`} className="hover:underline">
                      {room.nomor}
                    </Link>
                  </TableCell>
                  <TableCell>{room.lantai}</TableCell>
                  <TableCell>{room.tipe}</TableCell>
                  <TableCell>{formatRupiah(room.hargaBulanan)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={STATUS_BADGE_CLASS[room.status as StatusKamar]}>
                      {STATUS_LABEL[room.status as StatusKamar]}
                    </Badge>
                  </TableCell>
                  <TableCell>{room.penghuni[0]?.nama ?? "—"}</TableCell>
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
                        <DropdownMenuItem onClick={() => bukaEditKamar(room)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(room)}>
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

      {/* Dialog Tambah / Edit */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Kamar" : "Tambah Kamar Baru"}</DialogTitle>
            <DialogDescription>{editingId ? "Perbarui detail kamar di bawah ini." : "Isi detail kamar yang ingin ditambahkan."}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="nomor">Nomor Kamar</Label>
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
                <Label>Tipe Kamar</Label>
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
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.status === "terisi" && (
              <div className="grid gap-2">
                <Label htmlFor="penghuniId">Nama Penghuni</Label>
                <Select value={form.penghuniId} onValueChange={(v) => setForm((f) => ({ ...f, penghuniId: v ?? "" }))}>
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
              <Textarea id="catatan" placeholder="Catatan tambahan, misalnya kondisi kamar" value={form.catatan} onChange={(e) => setForm((f) => ({ ...f, catatan: e.target.value }))} />
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

      {/* Konfirmasi Hapus */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus kamar ini?</AlertDialogTitle>
            <AlertDialogDescription>Kamar {deleteTarget?.nomor} akan dihapus secara permanen dan tidak dapat dikembalikan. Pastikan tidak ada penghuni aktif sebelum menghapus.</AlertDialogDescription>
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
