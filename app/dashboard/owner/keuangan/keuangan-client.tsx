"use client";

import { useMemo, useState, useTransition } from "react";
import type { Kamar, Penghuni, Transaksi } from "@/lib/generated/prisma/client";
import { ArrowDownCircle, ArrowUpCircle, Pencil, Plus, Search, Trash2, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

import { createTransaksi, updateTransaksi, deleteTransaksi, type TransaksiInput } from "./action";

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

const formatRupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

interface KeuanganClientProps {
  transaksi: TransaksiDenganRelasi[];
  kamarList: Kamar[];
  penghuniList: Penghuni[];
}

export function KeuanganClient({ transaksi, kamarList, penghuniList }: KeuanganClientProps) {
  const [list, setList] = useState<TransaksiDenganRelasi[]>(transaksi);
  const [search, setSearch] = useState("");
  const [filterJenis, setFilterJenis] = useState<Jenis | "semua">("semua");
  const [isPending, startTransition] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(formKosong());
  const [errors, setErrors] = useState<FormErrors>({});

  const [deleteTarget, setDeleteTarget] = useState<TransaksiDenganRelasi | null>(null);

  const filtered = useMemo(() => {
    const kata = search.trim().toLowerCase();
    return list
      .filter((t) => filterJenis === "semua" || t.jenis === filterJenis)
      .filter((t) => !kata || t.kategori.toLowerCase().includes(kata) || (t.keterangan ?? "").toLowerCase().includes(kata) || (t.penghuni?.nama ?? "").toLowerCase().includes(kata))
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [list, search, filterJenis]);

  const ringkasan = useMemo(() => {
    const totalPemasukan = list.filter((t) => t.jenis === "pemasukan").reduce((sum, t) => sum + t.jumlah, 0);
    const totalPengeluaran = list.filter((t) => t.jenis === "pengeluaran").reduce((sum, t) => sum + t.jumlah, 0);
    return {
      totalPemasukan,
      totalPengeluaran,
      saldo: totalPemasukan - totalPengeluaran,
    };
  }, [list]);

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
          toast.success("Transaksi berhasil dicatat");
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Keuangan</h1>
        <p className="text-muted-foreground">Semua pemasukan dan pengeluaran kos, termasuk pembayaran sewa yang tercatat otomatis dari halaman Penghuni.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <ArrowUpCircle className="h-8 w-8 text-emerald-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Pemasukan</p>
              <p className="text-lg font-semibold">{formatRupiah.format(ringkasan.totalPemasukan)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <ArrowDownCircle className="h-8 w-8 text-rose-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Pengeluaran</p>
              <p className="text-lg font-semibold">{formatRupiah.format(ringkasan.totalPengeluaran)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Wallet className="h-8 w-8 text-sky-600" />
            <div>
              <p className="text-sm text-muted-foreground">Saldo</p>
              <p className="text-lg font-semibold">{formatRupiah.format(ringkasan.saldo)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari kategori, keterangan, penghuni..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterJenis} onValueChange={(v) => setFilterJenis(v as Jenis | "semua")}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Semua jenis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Jenis</SelectItem>
              <SelectItem value="pemasukan">Pemasukan</SelectItem>
              <SelectItem value="pengeluaran">Pengeluaran</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={bukaTambah} disabled={isPending}>
          <Plus className="mr-2 h-4 w-4" />
          Catat Transaksi
        </Button>
      </div>

      <Card>
        <CardContent className="px-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Terkait</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Belum ada transaksi.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{new Date(t.tanggal).toISOString().slice(0, 10)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={t.jenis === "pemasukan" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-rose-100 text-rose-700 hover:bg-rose-100"}>
                      {t.jenis === "pemasukan" ? "Pemasukan" : "Pengeluaran"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{t.kategori}</TableCell>
                  <TableCell className="text-muted-foreground">{t.penghuni ? `${t.penghuni.nama}${t.kamar ? ` (Kamar ${t.kamar.nomor})` : ""}` : t.kamar ? `Kamar ${t.kamar.nomor}` : "-"}</TableCell>
                  <TableCell className={`text-right font-medium ${t.jenis === "pemasukan" ? "text-emerald-600" : "text-rose-600"}`}>
                    {t.jenis === "pemasukan" ? "+" : "-"}
                    {formatRupiah.format(t.jumlah)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => bukaEdit(t)} disabled={isPending}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(t)} disabled={isPending}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Tambah/Edit Transaksi */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Transaksi" : "Catat Transaksi Baru"}</DialogTitle>
            <DialogDescription>{editingId ? "Perbarui data transaksi." : "Isi data pemasukan atau pengeluaran kos."}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="jenis">Jenis</Label>
                <Select value={form.jenis} onValueChange={(v) => setForm((f) => ({ ...f, jenis: v as Jenis, kategori: "" }))}>
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
                <Select value={form.kategori} onValueChange={(v) => setForm((f) => ({ ...f, kategori: v ?? "" }))}>
                  <SelectTrigger id="kategori">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {kategoriUntuk(form.jenis).map((k) => (
                      <SelectItem key={k} value={k}>
                        {k}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.kategori && <p className="text-sm text-destructive">{errors.kategori}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="jumlah">Jumlah (Rp)</Label>
                <Input id="jumlah" type="number" min={0} placeholder="0" value={form.jumlah} onChange={(e) => setForm((f) => ({ ...f, jumlah: e.target.value }))} />
                {errors.jumlah && <p className="text-sm text-destructive">{errors.jumlah}</p>}
                {form.jumlah && !Number.isNaN(Number(form.jumlah)) && <p className="text-xs text-muted-foreground">{formatRupiah.format(Number(form.jumlah))}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tanggal">Tanggal</Label>
                <Input id="tanggal" type="date" value={form.tanggal} onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))} />
                {errors.tanggal && <p className="text-sm text-destructive">{errors.tanggal}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="kamar">Kamar (opsional)</Label>
                <Select value={form.kamarId || "none"} onValueChange={(v) => setForm((f) => ({ ...f, kamarId: v === "none" ? "" : String(v) }))}>
                  <SelectTrigger id="kamar">
                    <SelectValue placeholder="Tidak terkait kamar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tidak terkait kamar</SelectItem>
                    {kamarList.map((k) => (
                      <SelectItem key={k.id} value={k.id}>
                        Kamar {k.nomor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="penghuni">Penghuni (opsional)</Label>
                <Select value={form.penghuniId || "none"} onValueChange={(v) => setForm((f) => ({ ...f, penghuniId: v === "none" ? "" : String(v) }))}>
                  <SelectTrigger id="penghuni">
                    <SelectValue placeholder="Tidak terkait penghuni" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tidak terkait penghuni</SelectItem>
                    {penghuniList.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="keterangan">Keterangan (opsional)</Label>
              <Textarea id="keterangan" value={form.keterangan} onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={isPending}>
              Batal
            </Button>
            <Button onClick={submit} disabled={isPending}>
              {isPending ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Catat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Konfirmasi hapus */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus transaksi ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Transaksi {deleteTarget?.kategori} sebesar {deleteTarget ? formatRupiah.format(deleteTarget.jumlah) : ""} akan dihapus permanen.
            </AlertDialogDescription>
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
