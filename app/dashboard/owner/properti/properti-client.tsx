"use client";

import { useState } from "react";
import { Properti } from "@/lib/generated/prisma/client";
import { FormProperti } from "./form-properti";
import { deleteProperti } from "./actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Home, Info, Edit, Trash, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function PropertiClient({ data }: { data: Properti[] }) {
  const [openCreate, setOpenCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus properti ini?")) {
      try {
        await deleteProperti(id);
        toast.success("Properti berhasil dihapus");
      } catch (error: any) {
        toast.error(error.message || "Gagal menghapus properti");
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* HEADER & TOMBOL TAMBAH */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Manajemen Properti</h1>
          <p className="text-muted-foreground">Kelola semua properti Anda di satu tempat.</p>
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
          <p className="text-muted-foreground text-sm mb-4">Tambahkan properti pertama Anda untuk mulai mengelola.</p>
          <Button onClick={() => setOpenCreate(true)}>Tambah Properti</Button>
        </div>
      ) : (
        /* GRID DAFTAR PROPERTI */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((item) => (
            <Card key={item.id} className="flex flex-col py-0">
              {item.foto ? (
                <div className="w-full h-48 relative bg-muted overflow-hidden rounded-t-xl">
                  <img src={item.foto} alt={item.nama} className="object-cover w-full h-full" />
                </div>
              ) : (
                <div className="w-full h-48 bg-muted flex items-center justify-center text-muted-foreground rounded-t-xl">
                  <Home className="w-8 h-8 opacity-20" />
                </div>
              )}

              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="line-clamp-1">{item.nama}</CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <Badge variant="secondary" className="font-normal text-xs">
                      {item.tipe}
                    </Badge>
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-3 pb-6 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{item.alamat}</span>
                  </div>

                  {item.fasilitas && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Info className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{item.fasilitas}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4 mt-auto border-t">
                  <Button variant="outline" size="sm" onClick={() => setEditingId(item.id)}>
                    <Edit className="w-4 h-4 mr-1" /> Edit
                  </Button>

                  <FormProperti properti={item} open={editingId === item.id} setOpen={(open) => setEditingId(open ? item.id : null)} />

                  <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                    <Trash className="w-4 h-4 mr-1" /> Hapus
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
