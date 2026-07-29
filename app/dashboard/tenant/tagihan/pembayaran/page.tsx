import { requireTenant } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/db/prisma";
import { formatRupiah } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, Wallet, ShieldCheck, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { bayarTagihan } from "../action";

export default async function PembayaranPage() {
  const user = await requireTenant();

  const penghuni = await prisma.penghuni.findFirst({
    where: { userId: user.id },
    include: { kamar: true },
  });

  if (!penghuni || !penghuni.kamarId || !penghuni.kamar) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Kamar Tidak Ditemukan</h2>
        <p className="text-muted-foreground mt-2 mb-6">Anda belum memiliki tagihan atau kamar aktif.</p>
        <Button render={<Link href="/dashboard/tenant/tagihan" />}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </Button>
      </div>
    );
  }

  const kamar = penghuni.kamar;

  const paymentMethods = [
    {
      category: "Transfer Bank",
      icon: <CreditCard className="w-5 h-5 text-blue-500" />,
      options: [
        { id: "Bank BCA", label: "BCA Virtual Account", code: "BCA" },
        { id: "Bank Mandiri", label: "Mandiri Virtual Account", code: "MANDIRI" },
        { id: "Bank BNI", label: "BNI Virtual Account", code: "BNI" },
        { id: "Bank BRI", label: "BRI Virtual Account", code: "BRI" },
      ],
    },
    {
      category: "E-Wallet & QRIS",
      icon: <Wallet className="w-5 h-5 text-green-500" />,
      options: [
        { id: "GoPay", label: "GoPay", code: "GOPAY" },
        { id: "OVO", label: "OVO", code: "OVO" },
        { id: "DANA", label: "DANA", code: "DANA" },
        { id: "ShopeePay", label: "ShopeePay", code: "SHOPEE" },
      ],
    },
  ];

  return (
    <div className="space-y-8 max-w-3xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="rounded-full shrink-0" render={<Link href="/dashboard/tenant/tagihan" />}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Pembayaran Tagihan</h1>
          <p className="text-muted-foreground">Pilih metode pembayaran yang Anda inginkan.</p>
        </div>
      </div>

      <div className="grid gap-8">
        <Card className="bg-linear-to-r from-primary/10 via-primary/5 to-transparent border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Total yang harus dibayar</p>
                <p className="text-4xl font-extrabold text-foreground">{formatRupiah(kamar.hargaBulanan)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30 border-none font-semibold">
                    Kamar {kamar.nomor}
                  </Badge>
                  <span className="text-sm text-muted-foreground">({kamar.tipe})</span>
                </div>
              </div>
              <div className="hidden sm:flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <form action={bayarTagihan} className="space-y-8">
          <div className="space-y-6">
            {paymentMethods.map((group, idx) => (
              <div key={idx} className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                  {group.icon}
                  {group.category}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {group.options.map((opt) => (
                    <label key={opt.id} className="relative cursor-pointer group">
                      <input type="radio" name="metode" value={opt.id} className="peer sr-only" required />
                      <div className="flex items-center justify-between p-4 rounded-xl border-2 border-border/50 bg-card hover:bg-muted/50 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:shadow-sm transition-all duration-200">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full border-2 border-muted-foreground peer-checked:border-primary flex items-center justify-center group-hover:border-primary/50 transition-colors">
                            <div className="w-2 h-2 rounded-full bg-primary scale-0 peer-checked:scale-100 transition-transform" />
                          </div>
                          <span className="font-semibold text-foreground">{opt.label}</span>
                        </div>
                        <span className="text-xs font-bold px-2 py-1 bg-muted rounded text-muted-foreground">{opt.code}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg flex gap-3 border border-blue-100 dark:border-blue-900">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-semibold mb-1">Informasi Pembayaran</p>
              <p>Setelah menekan tombol di bawah, pembayaran akan diproses (simulasi). Sistem akan otomatis mencatat transaksi ini pada riwayat Anda.</p>
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full h-14 text-lg font-bold shadow-lg hover:shadow-xl transition-all">
            Konfirmasi Pembayaran
          </Button>
        </form>
      </div>
    </div>
  );
}
