"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Kamar, Penghuni, Properti } from "@/lib/generated/prisma/client";
import { FormProperti } from "./form-properti";
import { deleteProperti } from "./actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MapPin, Home, Info, Edit, Trash, Plus, DoorOpen, Users, Bed, Wrench, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Tipe lengkap dengan relasi kamar + penghuni aktif
type KamarDenganPenghuni = Kamar & { penghuni: Penghuni[] };
type PropertiDenganKamar = Properti & { kamar: KamarDenganPenghuni[] };

export function PropertiClient({ data }: { data: PropertiDenganKamar[] }) {
  const [openCreate, setOpenCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<PropertiDenganKamar | null>(null);
  const [isPending, startTransition] = useTransition();

  const konfirmasiHapus = () => {
    if (!deleteTarget) return;

    startTransition(async () => {
      try {
        await deleteProperti(deleteTarget.id);
        toast.success("Properti berhasil dihapus");
        setDeleteTarget(null);
      } catch (error: any) {
        toast.error(error.message || "Gagal menghapus properti");
      }
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* HEADER & TOMBOL TAMBAH */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Manajemen Properti</h1>
          <p className="text-muted-foreground">Kelola semua properti dan unit/kamar Anda di satu tempat.</p>
        </div>
        <Button onClick={() => setOpenCreate(true)}>
          <Plus className="w-4 h-4 mr-2" /> Tambah Properti
        </Button>
        <FormProperti open={openCreate} setOpen={setOpenCreate} />
      </div>

      {/* EMPTY STATE */}
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border rounded-xl border-dashed bg-muted/20">
          <Home className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Belum ada properti</h3>
          <p className="text-muted-foreground text-sm mb-4">Tambahkan properti pertama Anda untuk mulai mengelola unit/kamar.</p>
          <Button onClick={() => setOpenCreate(true)}>Tambah Properti</Button>
        </div>
      ) : (
        /* GRID DAFTAR PROPERTI */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((item) => {
            // Statistik unit per properti
            const totalKamar = item.kamar.length;
            const terisi = item.kamar.filter((k) => k.status === "terisi").length;
            const kosong = item.kamar.filter((k) => k.status === "kosong").length;
            const maintenance = item.kamar.filter((k) => k.status === "maintenance").length;
            const okupansi = totalKamar === 0 ? 0 : Math.round((terisi / totalKamar) * 100);

            return (
              <Card key={item.id} className="flex flex-col py-0 overflow-hidden">
                {/* FOTO */}
                {item.foto ? (
                  <div className="w-full h-44 relative bg-muted overflow-hidden">
                    <img src={item.foto} alt={item.nama} className="object-cover w-full h-full" />
                  </div>
                ) : (
                  <div className="w-full h-44 bg-muted flex items-center justify-center text-muted-foreground">
                    <Home className="w-8 h-8 opacity-20" />
                  </div>
                )}

                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="line-clamp-1 text-base">{item.nama}</CardTitle>
                    <Badge variant="secondary" className="font-normal text-xs shrink-0">
                      {item.tipe}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-start gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span className="line-clamp-2 text-xs">{item.alamat}</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col gap-4 pb-4">
                  {/* STATISTIK UNIT */}
                  <div className="grid grid-cols-4 gap-1 rounded-lg border bg-muted/30 p-2">
                    <div className="flex flex-col items-center gap-0.5">
                      <DoorOpen className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm font-bold">{totalKamar}</span>
                      <span className="text-[10px] text-muted-foreground">Total</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <Users className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-sm font-bold text-blue-600">{terisi}</span>
                      <span className="text-[10px] text-muted-foreground">Terisi</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <Bed className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-sm font-bold text-emerald-600">{kosong}</span>
                      <span className="text-[10px] text-muted-foreground">Kosong</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <Wrench className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-sm font-bold text-amber-600">{maintenance}</span>
                      <span className="text-[10px] text-muted-foreground">Perbaikan</span>
                    </div>
                  </div>

                  {/* PROGRESS OKUPANSI */}
                  {totalKamar > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Tingkat hunian</span>
                        <span className="font-medium text-foreground">{okupansi}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${okupansi}%` }} />
                      </div>
                    </div>
                  )}

                  {item.fasilitas && (
                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{item.fasilitas}</span>
                    </div>
                  )}

                  {/* TOMBOL AKSI */}
                  <div className="flex items-center gap-2 mt-auto pt-2 border-t">
                    {/* Lihat Unit — link ke halaman detail */}
                    <Button variant="default" size="sm" className="flex-1" render={<Link href={`/dashboard/owner/properti/${item.id}`} />}>
                      <DoorOpen className="w-3.5 h-3.5 mr-1.5" />
                      Kelola Unit
                    </Button>

                    <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => setEditingId(item.id)}>
                      <Edit className="w-3.5 h-3.5" />
                    </Button>

                    <FormProperti properti={item} open={editingId === item.id} setOpen={(open) => setEditingId(open ? item.id : null)} />

                    <Button variant="destructive" size="sm" className="h-8 px-2" onClick={() => setDeleteTarget(item)}>
                      <Trash className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ALERT DIALOG KONFIRMASI HAPUS */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus properti "{deleteTarget?.nama}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Properti ini akan dihapus secara permanen. Semua unit/kamar yang terhubung ke properti ini akan kehilangan relasinya (tidak terhapus). Pastikan tidak ada penghuni aktif sebelum melanjutkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                konfirmasiHapus();
              }}
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
