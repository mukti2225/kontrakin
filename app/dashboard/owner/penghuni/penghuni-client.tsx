"use client";

import { useMemo, useState, useTransition } from "react";
import type { Kamar, Penghuni } from "@/lib/generated/prisma/client";
import { Pencil, Plus, Search, Trash2, UserX, MoreVertical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

import { createPenghuni, updatePenghuni, deletePenghuni, nonaktifkanPenghuni, type PenghuniInput } from "./action";

type PenghuniDenganKamar = Penghuni & { kamar: Kamar | null };

interface FormState {
  nama: string;
  noHp: string;
  email: string;
  noKtp: string;
  tanggalMasuk: string;
  catatan: string;
}

interface FormErrors {
  nama?: string;
  noHp?: string;
  tanggalMasuk?: string;
}

const FORM_KOSONG: FormState = {
  nama: "",
  noHp: "",
  email: "",
  noKtp: "",
  tanggalMasuk: new Date().toISOString().slice(0, 10),
  catatan: "",
};

interface PenghuniClientProps {
  initialPenghuni: PenghuniDenganKamar[];
}

export function PenghuniClient({ initialPenghuni }: PenghuniClientProps) {
  const [list, setList] = useState<PenghuniDenganKamar[]>(initialPenghuni);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(FORM_KOSONG);
  const [errors, setErrors] = useState<FormErrors>({});

  const [deleteTarget, setDeleteTarget] = useState<PenghuniDenganKamar | null>(null);
  const [nonaktifTarget, setNonaktifTarget] = useState<PenghuniDenganKamar | null>(null);

  const filtered = useMemo(() => {
    const kata = search.trim().toLowerCase();
    return list.filter((p) => !kata || p.nama.toLowerCase().includes(kata) || p.noHp.includes(kata)).sort((a, b) => a.nama.localeCompare(b.nama));
  }, [list, search]);

  function bukaTambah() {
    setEditingId(null);
    setForm(FORM_KOSONG);
    setErrors({});
    setFormOpen(true);
  }

  function bukaEdit(p: PenghuniDenganKamar) {
    setEditingId(p.id);
    setForm({
      nama: p.nama,
      noHp: p.noHp,
      email: p.email ?? "",
      noKtp: p.noKtp ?? "",
      tanggalMasuk: p.tanggalMasuk.toISOString().slice(0, 10),
      catatan: p.catatan ?? "",
    });
    setErrors({});
    setFormOpen(true);
  }

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!form.nama.trim()) e.nama = "Nama wajib diisi";
    if (!form.noHp.trim()) e.noHp = "No. HP wajib diisi";
    if (!form.tanggalMasuk) e.tanggalMasuk = "Tanggal masuk wajib diisi";
    return e;
  }

  function submit() {
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) {
      toast.error("Lengkapi dulu field yang wajib diisi");
      return;
    }

    const payload: PenghuniInput = {
      nama: form.nama.trim(),
      noHp: form.noHp.trim(),
      email: form.email.trim() || undefined,
      noKtp: form.noKtp.trim() || undefined,
      tanggalMasuk: form.tanggalMasuk,
      catatan: form.catatan.trim() || undefined,
    };

    startTransition(async () => {
      try {
        if (editingId) {
          const updated = await updatePenghuni(editingId, payload);
          setList((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...updated } : p)));
          toast.success(`Data ${payload.nama} berhasil diperbarui`);
        } else {
          const created = await createPenghuni(payload);
          setList((prev) => [...prev, { ...created, kamar: null }]);
          toast.success(`${payload.nama} berhasil didaftarkan`);
        }
        setFormOpen(false);
      } catch {
        toast.error("Gagal menyimpan data. Cek kembali No. KTP (harus unik) jika diisi.");
      }
    });
  }

  function konfirmasiNonaktifkan() {
    if (!nonaktifTarget) return;
    const target = nonaktifTarget;
    startTransition(async () => {
      try {
        await nonaktifkanPenghuni(target.id);
        setList((prev) => prev.map((p) => (p.id === target.id ? { ...p, status: "nonaktif", kamarId: null, kamar: null } : p)));
        toast.success(`${target.nama} ditandai keluar dari kamar`);
      } catch {
        toast.error("Gagal memproses");
      } finally {
        setNonaktifTarget(null);
      }
    });
  }

  function konfirmasiHapus() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      try {
        await deletePenghuni(target.id);
        setList((prev) => prev.filter((p) => p.id !== target.id));
        toast.success(`${target.nama} berhasil dihapus`);
      } catch {
        toast.error("Gagal menghapus data");
      } finally {
        setDeleteTarget(null);
      }
    });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Manajemen Penghuni</h1>
        <p className="text-muted-foreground">Daftarkan penghuni di sini terlebih dahulu, lalu tempatkan ke kamar melalui halaman Kamar.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari nama atau no. HP..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button onClick={bukaTambah} disabled={isPending}>
          <Plus className="mr-2 h-4 w-4" />
          Daftarkan Penghuni
        </Button>
      </div>

      <Card>
        <CardContent className="px-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>No. HP</TableHead>
                <TableHead>Tanggal Masuk</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Kamar</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Belum ada data penghuni.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nama}</TableCell>
                  <TableCell>{p.noHp}</TableCell>
                  <TableCell>{p.tanggalMasuk.toISOString().slice(0, 10)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={p.status === "aktif" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-100"}>
                      {p.status === "aktif" ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell>{p.kamar ? <span className="font-medium">{p.kamar.nomor}</span> : <span className="text-muted-foreground">Belum ditempatkan</span>}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        }
                      ></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => bukaEdit(p)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {p.kamar && (
                          <DropdownMenuItem onClick={() => setNonaktifTarget(p)}>
                            <UserX className="mr-2 h-4 w-4" />
                            Tandai Keluar Kamar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(p)}>
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

      {/* Dialog Tambah/Edit */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Penghuni" : "Daftarkan Penghuni Baru"}</DialogTitle>
            <DialogDescription>{editingId ? "Perbarui data penghuni." : "Isi data penghuni. Penempatan ke kamar dilakukan di halaman Kamar."}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="nama">Nama Lengkap</Label>
              <Input id="nama" value={form.nama} onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))} />
              {errors.nama && <p className="text-sm text-destructive">{errors.nama}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="noHp">No. HP</Label>
                <Input id="noHp" placeholder="08xxxxxxxxxx" value={form.noHp} onChange={(e) => setForm((f) => ({ ...f, noHp: e.target.value }))} />
                {errors.noHp && <p className="text-sm text-destructive">{errors.noHp}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tanggalMasuk">Tanggal Masuk</Label>
                <Input id="tanggalMasuk" type="date" value={form.tanggalMasuk} onChange={(e) => setForm((f) => ({ ...f, tanggalMasuk: e.target.value }))} />
                {errors.tanggalMasuk && <p className="text-sm text-destructive">{errors.tanggalMasuk}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email (opsional)</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="noKtp">No. KTP (opsional)</Label>
                <Input id="noKtp" value={form.noKtp} onChange={(e) => setForm((f) => ({ ...f, noKtp: e.target.value }))} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="catatan">Catatan (opsional)</Label>
              <Textarea id="catatan" value={form.catatan} onChange={(e) => setForm((f) => ({ ...f, catatan: e.target.value }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={isPending}>
              Batal
            </Button>
            <Button onClick={submit} disabled={isPending}>
              {isPending ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Daftarkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Konfirmasi nonaktifkan */}
      <AlertDialog open={!!nonaktifTarget} onOpenChange={(o) => !o && setNonaktifTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tandai {nonaktifTarget?.nama} keluar dari kamar?</AlertDialogTitle>
            <AlertDialogDescription>Penghuni akan dilepas dari kamar {nonaktifTarget?.kamar?.nomor} dan berstatus nonaktif. Data riwayatnya tetap tersimpan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={konfirmasiNonaktifkan} disabled={isPending}>
              {isPending ? "Memproses..." : "Ya, Tandai Keluar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Konfirmasi hapus */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data {deleteTarget?.nama}?</AlertDialogTitle>
            <AlertDialogDescription>Data ini akan dihapus permanen. Kalau penghuni ini masih menghuni kamar, sebaiknya "Tandai Keluar" dulu, bukan langsung hapus.</AlertDialogDescription>
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
