import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/db/prisma";
import { pemeliharaanService } from "@/lib/services/pemeliharaan.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { submitKeluhan } from "./action";
import { redirect } from "next/navigation";

export default async function TenantKeluhanPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "tenant") redirect("/unauthorized");

  const penghuni = await prisma.penghuni.findFirst({
    where: { userId: user.id, status: "aktif" },
    select: { id: true, ownerId: true, kamarId: true },
  });

  const penghuniId = penghuni?.id ?? "";
  const ownerId = penghuni?.ownerId ?? "";
  const kamarId = penghuni?.kamarId ?? "";

  const keluhanList = penghuniId ? await pemeliharaanService.getTenantKeluhan(penghuniId) : [];

  const statusColor = {
    menunggu: "bg-amber-100 text-amber-800",
    diproses: "bg-blue-100 text-blue-800",
    selesai: "bg-teal-100 text-teal-800",
  };

  const prioritasColor = {
    rendah: "text-slate-500",
    sedang: "text-amber-500",
    tinggi: "text-rose-500",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Keluhan & Pemeliharaan</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Pengajuan Baru */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Buat Laporan Baru</CardTitle>
              <CardDescription>Sampaikan keluhan terkait fasilitas kamar atau properti.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={submitKeluhan} className="space-y-4">
                <input type="hidden" name="penghuniId" value={penghuniId} />
                <input type="hidden" name="ownerId" value={ownerId} />
                <input type="hidden" name="kamarId" value={kamarId} />

                <div className="space-y-2">
                  <Label htmlFor="judul">Judul Keluhan</Label>
                  <Input id="judul" name="judul" required placeholder="Contoh: AC Bocor" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kategori">Kategori</Label>
                  <select
                    id="kategori"
                    name="kategori"
                    required
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Pilih Kategori</option>
                    <option value="Listrik">Listrik</option>
                    <option value="Air & Ledeng">Air & Ledeng</option>
                    <option value="Bangunan">Kerusakan Bangunan</option>
                    <option value="Fasilitas">Fasilitas Kamar</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prioritas">Tingkat Prioritas</Label>
                  <select
                    id="prioritas"
                    name="prioritas"
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                  >
                    <option value="sedang">Sedang (Biasa)</option>
                    <option value="tinggi">Tinggi (Mendesak)</option>
                    <option value="rendah">Rendah (Tidak Mendesak)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deskripsi">Deskripsi Detail</Label>
                  <Textarea id="deskripsi" name="deskripsi" required placeholder="Jelaskan masalah secara detail agar mudah ditindaklanjuti..." rows={4} />
                </div>

                <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                  Kirim Laporan
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Daftar Keluhan */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">Riwayat Keluhan Anda</h2>

          {keluhanList.length === 0 ? (
            <div className="p-8 text-center border rounded-lg border-dashed text-slate-500 bg-slate-50">Belum ada riwayat keluhan.</div>
          ) : (
            keluhanList.map((keluhan) => (
              <Card key={keluhan.id} className="overflow-hidden">
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 justify-between items-start">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{keluhan.judul}</h3>
                      <Badge variant="outline" className={statusColor[keluhan.status]}>
                        {keluhan.status.charAt(0).toUpperCase() + keluhan.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">{keluhan.deskripsi}</p>
                    <div className="flex items-center gap-3 pt-2 text-xs text-slate-500 font-medium">
                      <span>{keluhan.kategori}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span className={prioritasColor[keluhan.prioritas]}>Prioritas: {keluhan.prioritas.charAt(0).toUpperCase() + keluhan.prioritas.slice(1)}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span>{new Date(keluhan.tanggalDibuat).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
