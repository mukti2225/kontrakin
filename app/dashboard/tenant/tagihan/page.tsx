import { requireTenant } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/db/prisma";
import { formatRupiah } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Home, Wallet, CheckCircle2, Clock, AlertCircle, ArrowRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";

export default async function TagihanPage() {
  const user = await requireTenant();

  // Ambil data penghuni berdasarkan user login
  const penghuni = await prisma.penghuni.findFirst({
    where: { userId: user.id },
    include: { kamar: true },
  });

  const kamar = penghuni?.kamar;

  if (!penghuni || !kamar) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="p-6 bg-primary/10 rounded-full">
          <Home className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Belum Ada Kamar</h2>
        <p className="text-muted-foreground max-w-125 text-lg">Anda belum ditempatkan di kamar mana pun oleh pemilik kontrakan. Silakan hubungi pemilik kontrakan Anda untuk informasi lebih lanjut.</p>
      </div>
    );
  }

  // Ambil riwayat transaksi (pembayaran)
  const riwayatPembayaran = await prisma.transaksi.findMany({
    where: {
      penghuniId: penghuni.id,
      kamarId: kamar.id,
      kategori: "Sewa Kamar",
    },
    orderBy: {
      tanggal: "desc",
    },
  });

  // Untuk simulasi bulan ini, kita bisa buat tagihan bulan ini
  const bulanIni = new Date();
  const namaBulan = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(bulanIni);

  // Cek apakah sudah bayar bulan ini
  const sudahBayarBulanIni = riwayatPembayaran.some((tx) => {
    const txBulan = tx.tanggal.getMonth();
    const txTahun = tx.tanggal.getFullYear();
    return txBulan === bulanIni.getMonth() && txTahun === bulanIni.getFullYear();
  });

  return (
    <div className="space-y-8 max-w p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-primary to-primary/60">Tagihan & Pembayaran</h1>
        <p className="text-muted-foreground mt-2 text-lg">Kelola tagihan sewa bulanan dan lihat riwayat pembayaran Anda dengan mudah.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Card Informasi Kamar */}
        <Card className="border-primary/10 shadow-lg hover:shadow-xl transition-shadow bg-linear-to-br from-card to-card/50 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 blur-3xl -z-10 rounded-full" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Home className="w-5 h-5 text-primary" />
              </div>
              Informasi Kamar
            </CardTitle>
            <CardDescription>Detail kamar yang Anda tempati saat ini</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-border/50">
              <span className="text-muted-foreground font-medium">Nomor Kamar</span>
              <span className="font-bold text-lg bg-primary/10 px-3 py-1 rounded-md text-primary">{kamar.nomor}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-border/50">
              <span className="text-muted-foreground font-medium">Tipe Kamar</span>
              <Badge variant="secondary" className="px-3 py-1 text-sm font-semibold">
                {kamar.tipe}
              </Badge>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-muted-foreground font-medium">Harga Bulanan</span>
              <span className="font-extrabold text-2xl text-foreground">{formatRupiah(kamar.hargaBulanan)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card Tagihan Bulan Ini */}
        <Card className={`border shadow-lg transition-shadow hover:shadow-xl relative overflow-hidden ${sudahBayarBulanIni ? "border-green-500/50" : "border-orange-500/50"}`}>
          <div className={`absolute -top-10 -right-10 w-48 h-48 blur-3xl -z-10 rounded-full ${sudahBayarBulanIni ? "bg-green-500/15" : "bg-orange-500/15"}`} />
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className={`p-2 rounded-lg ${sudahBayarBulanIni ? "bg-green-500/10" : "bg-orange-500/10"}`}>
                    <FileText className={`w-5 h-5 ${sudahBayarBulanIni ? "text-green-600" : "text-orange-600"}`} />
                  </div>
                  Tagihan Bulan Ini
                </CardTitle>
                <CardDescription className="mt-1 font-medium">Periode {namaBulan}</CardDescription>
              </div>
              <Badge
                variant={sudahBayarBulanIni ? "default" : "destructive"}
                className={`text-sm px-3 py-1 shadow-sm ${sudahBayarBulanIni ? "bg-green-500 hover:bg-green-600 text-white border-none" : "bg-orange-500 hover:bg-orange-600 border-none text-white"}`}
              >
                {sudahBayarBulanIni ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Lunas
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Belum Dibayar
                  </span>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-8 bg-background/50 backdrop-blur-sm rounded-xl border border-border/50 shadow-inner">
                <p className="text-sm text-muted-foreground mb-2 font-medium uppercase tracking-wider">Total Tagihan</p>
                <p className="text-5xl font-extrabold tracking-tight">{formatRupiah(kamar.hargaBulanan)}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            {!sudahBayarBulanIni ? (
              <Button
                className="w-full h-12 text-base font-semibold gap-2 shadow-md hover:shadow-lg transition-all group bg-orange-600 hover:bg-orange-700 text-white border-none"
                render={<Link href="/dashboard/tenant/tagihan/pembayaran" />}
              >
                <Wallet className="w-5 h-5 transition-transform group-hover:scale-110" />
                Bayar Sekarang
                <ArrowRight className="w-4 h-4 ml-auto opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </Button>
            ) : (
              <Button variant="outline" className="w-full h-12 text-base font-semibold gap-2 border-green-500 text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-900/30" disabled>
                <CheckCircle2 className="w-5 h-5" />
                Tagihan Sudah Lunas
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Riwayat Pembayaran */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            Riwayat Pembayaran
          </CardTitle>
          <CardDescription>Daftar transaksi pembayaran sewa kamar Anda sebelumnya.</CardDescription>
        </CardHeader>
        <CardContent>
          {riwayatPembayaran.length > 0 ? (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-semibold">Tanggal</TableHead>
                    <TableHead className="font-semibold">Keterangan</TableHead>
                    <TableHead className="font-semibold">Jumlah</TableHead>
                    <TableHead className="text-right font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riwayatPembayaran.map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium whitespace-nowrap">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(tx.tanggal)}</TableCell>
                      <TableCell className="text-muted-foreground">{tx.keterangan || "Pembayaran Sewa Bulanan"}</TableCell>
                      <TableCell className="font-semibold">{formatRupiah(tx.jumlah)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 gap-1 pr-3">
                          <CheckCircle2 className="w-3 h-3" />
                          Berhasil
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/10 border-dashed">
              <div className="p-4 bg-muted rounded-full mb-4">
                <AlertCircle className="w-8 h-8 text-muted-foreground/70" />
              </div>
              <h3 className="text-lg font-semibold">Belum Ada Riwayat</h3>
              <p className="text-muted-foreground max-w-sm mt-1">Anda belum melakukan pembayaran sewa kamar apa pun sejauh ini.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
