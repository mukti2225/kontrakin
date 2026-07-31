"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Properti } from "@/lib/generated/prisma/client";
import { createProperti, updateProperti } from "./actions";
import { toast } from "sonner";
import { Upload, X, Loader2, ImagePlus } from "lucide-react";

interface FormPropertiProps {
  properti?: Properti;
  open: boolean;
  setOpen: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function FormProperti({ properti, open, setOpen, trigger }: FormPropertiProps) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(properti?.foto || null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      if (properti) {
        await updateProperti(properti.id, formData);
        toast.success("Properti berhasil diperbarui");
      } else {
        await createProperti(formData);
        toast.success("Properti berhasil ditambahkan");
      }
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    }
  }

  function handleRemovePhoto() {
    setPreview(null);
    const fileInput = document.getElementById("foto") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="space-y-1.5 pb-2 border-b">
          <DialogTitle className="text-xl font-semibold">{properti ? "Edit Properti" : "Tambah Properti Baru"}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">{properti ? "Perbarui detail informasi dan foto properti Anda di bawah ini." : "Lengkapi informasi properti yang ingin Anda tambahkan ke sistem."}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* --- KOLOM KIRI: INFORMASI UTAMA --- */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nama" className="text-xs font-medium">
                  Nama Properti <span className="text-destructive">*</span>
                </Label>
                <Input id="nama" name="nama" defaultValue={properti?.nama} required placeholder="Contoh: Kost Putri Melati" className="h-9" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tipe" className="text-xs font-medium">
                  Tipe Properti <span className="text-destructive">*</span>
                </Label>
                <Select name="tipe" defaultValue={properti?.tipe || "Kost"} required>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Pilih Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kost">Kost</SelectItem>
                    <SelectItem value="Kontrakan">Kontrakan</SelectItem>
                    <SelectItem value="Ruko">Ruko</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="alamat" className="text-xs font-medium">
                  Alamat Lengkap <span className="text-destructive">*</span>
                </Label>
                <Textarea id="alamat" name="alamat" defaultValue={properti?.alamat} required rows={3} placeholder="Jl. Contoh No. 123, Kelurahan, Kecamatan..." className="resize-none text-sm" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lokasiMaps" className="text-xs font-medium">
                  Link Google Maps <span className="text-muted-foreground font-normal">(Opsional)</span>
                </Label>
                <Input id="lokasiMaps" name="lokasiMaps" defaultValue={properti?.lokasiMaps || ""} type="url" placeholder="https://maps.google.com/..." className="h-9" />
              </div>
            </div>

            {/* --- KOLOM KANAN: FASILITAS, DESKRIPSI & FOTO --- */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fasilitas" className="text-xs font-medium">
                  Fasilitas
                </Label>
                <Input id="fasilitas" name="fasilitas" defaultValue={properti?.fasilitas || ""} placeholder="AC, WiFi, Parkir Motor, Dapur..." className="h-9" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="deskripsi" className="text-xs font-medium">
                  Deskripsi Tambahan
                </Label>
                <Textarea id="deskripsi" name="deskripsi" defaultValue={properti?.deskripsi || ""} rows={3} placeholder="Catatan atau keterangan lain terkait properti..." className="resize-none text-sm" />
              </div>

              {/* AREA UPLOAD & PREVIEW FOTO */}
              <div className="space-y-1.5">
                <Label htmlFor="foto" className="text-xs font-medium">
                  Foto Properti
                </Label>

                {preview ? (
                  <div className="relative w-full h-36 rounded-lg overflow-hidden border border-border bg-muted group">
                    <img src={preview} alt="Preview Properti" className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button type="button" variant="destructive" size="sm" className="h-8 px-3 text-xs shadow-md" onClick={handleRemovePhoto}>
                        <X className="w-3.5 h-3.5 mr-1" /> Hapus Foto
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="foto"
                    className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40 transition-all group"
                  >
                    <div className="p-2 rounded-full bg-background border shadow-xs mb-2 group-hover:scale-105 transition-transform">
                      <ImagePlus className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <span className="text-xs font-medium text-foreground">Klik untuk upload foto</span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">PNG, JPG, atau WEBP (Maks. 5MB)</span>
                  </label>
                )}

                <Input id="foto" name="foto" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>
            </div>
          </div>

          {/* --- FOOTER & ACTION BUTTONS --- */}
          <DialogFooter className="border-t pt-4 flex-row justify-end gap-2 sm:space-x-0">
            {properti?.foto && !preview && <input type="hidden" name="removeFoto" value="true" />}
            <Button type="button" variant="outline" size="sm" className="h-9" onClick={() => setOpen(false)} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" size="sm" className="h-9 px-4" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              {loading ? "Menyimpan..." : properti ? "Simpan Perubahan" : "Tambah Properti"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
