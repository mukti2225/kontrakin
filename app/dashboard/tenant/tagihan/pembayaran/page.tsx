import { requireTenant } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/db/prisma";
import { formatRupiah } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, Wallet, ShieldCheck, Info, CheckCircle2, Receipt, AlertTriangle, Calendar, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import Link from "next/link";
import { bayarTagihan } from "../action";

interface PembayaranPageProps {
  searchParams?: Promise<{ invoiceId?: string }>;
}

export default async function PembayaranPage({ searchParams }: PembayaranPageProps) {
  const user = await requireTenant();
  const params = searchParams ? await searchParams : undefined;
  const targetInvoiceId = params?.invoiceId;

  const penghuni = await prisma.penghuni.findFirst({
    where: { userId: user.id },
    include: {
      kamar: {
        include: { properti: true },
      },
      leases: {
        where: { status: { in: ["active", "expiring"] } },
        orderBy: { startDate: "desc" },
        take: 1,
      },
    },
  });

  if (!penghuni || !penghuni.kamarId || !penghuni.kamar) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Kamar Tidak Ditemukan</h2>
        <p className="text-muted-foreground mt-2 mb-6 text-sm">Anda belum ditempatkan di unit kamar aktif.</p>
        <Button render={<Link href="/dashboard/tenant/tagihan" />}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </Button>
      </div>
    );
  }

  // 1. Find specific invoice or oldest unpaid invoice
  let targetInvoice = null;
  if (targetInvoiceId) {
    targetInvoice = await prisma.invoice.findFirst({
      where: { id: targetInvoiceId, penghuniId: penghuni.id },
      include: { lines: true },
    });
  }

  if (!targetInvoice) {
    targetInvoice = await prisma.invoice.findFirst({
      where: {
        penghuniId: penghuni.id,
        status: { in: ["issued", "partial", "overdue"] },
        balanceDue: { gt: 0 },
      },
      include: { lines: true },
      orderBy: { dueDate: "asc" },
    });
  }

  // 2. If no unpaid invoice is found, display celebration state
  if (!targetInvoice || Number(targetInvoice.balanceDue) <= 0) {
    return (
      <div className="mx-auto max-w-xl p-4 md:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="rounded-full shrink-0" render={<Link href="/dashboard/tenant/tagihan" />}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">Pembayaran Tagihan</h1>
            <p className="text-muted-foreground text-sm">Status tagihan sewa Anda saat ini.</p>
          </div>
        </div>

        <Card className="border border-emerald-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
            <CheckCircle2 className="size-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Seluruh Tagihan Lunas!</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Tidak ada tagihan tertunggak atau pembayaran yang perlu diselesaikan saat ini. Terima kasih telah melakukan pembayaran tepat waktu!
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold"
              render={<Link href="/dashboard/tenant/tagihan" />}
            >
              Lihat Riwayat Kwitansi
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto rounded-xl border-slate-200 text-slate-700 text-sm font-semibold"
              render={<Link href="/dashboard/tenant" />}
            >
              Kembali ke Beranda
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const kamar = penghuni.kamar;
  const balanceDue = Number(targetInvoice.balanceDue);
  const totalInvoice = Number(targetInvoice.total);
  const dueDate = new Date(targetInvoice.dueDate);
  const isOverdue = dueDate < new Date();

  const paymentMethods = [
    {
      category: "Transfer Bank (Virtual Account)",
      icon: <CreditCard className="w-5 h-5 text-emerald-600" />,
      options: [
        { id: "Bank BCA", label: "BCA Virtual Account", code: "BCA" },
        { id: "Bank Mandiri", label: "Mandiri Virtual Account", code: "MANDIRI" },
        { id: "Bank BNI", label: "BNI Virtual Account", code: "BNI" },
        { id: "Bank BRI", label: "BRI Virtual Account", code: "BRI" },
      ],
    },
    {
      category: "E-Wallet & QRIS Instan",
      icon: <Wallet className="w-5 h-5 text-teal-600" />,
      options: [
        { id: "GoPay / QRIS", label: "GoPay / QRIS", code: "QRIS" },
        { id: "OVO", label: "OVO", code: "OVO" },
        { id: "DANA", label: "DANA", code: "DANA" },
        { id: "ShopeePay", label: "ShopeePay", code: "SHOPEE" },
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="rounded-full shrink-0" render={<Link href="/dashboard/tenant/tagihan" />}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">Pembayaran Tagihan</h1>
          <p className="text-muted-foreground text-sm">Pelunasan invoice sewa secara resmi dan terverifikasi.</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Card Informasi Invoice & Total Bayar */}
        <Card className="border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/75 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <Receipt className="size-4 text-emerald-600" />
              <span className="font-mono text-sm font-bold text-slate-900">{targetInvoice.invoiceNumber}</span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500">
                Jatuh Tempo: {dueDate.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
            <div>
              <StatusBadge variant={isOverdue ? "rose" : targetInvoice.status === "partial" ? "amber" : "slate"}>
                {isOverdue ? "Tertunggak" : targetInvoice.status === "partial" ? "Sebagian" : "Belum Lunas"}
              </StatusBadge>
            </div>
          </div>

          <CardContent className="p-6 space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total yang Harus Dibayar</p>
                <p className="text-3xl sm:text-4xl font-extrabold text-emerald-600 tabular-nums tracking-tight mt-1">
                  {formatRupiah(balanceDue)}
                </p>
                {balanceDue < totalInvoice && (
                  <p className="text-xs text-slate-400 mt-1">
                    (Total Invoice: {formatRupiah(totalInvoice)} • Telah dibayar: {formatRupiah(totalInvoice - balanceDue)})
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                    Kamar {kamar.nomor}
                  </span>
                  <span className="text-xs text-slate-500">
                    {kamar.properti?.nama || "Properti"} ({kamar.tipe})
                  </span>
                </div>
              </div>
              <div className="hidden sm:flex items-center justify-center size-14 bg-emerald-50 text-emerald-700 rounded-2xl">
                <ShieldCheck className="size-7" />
              </div>
            </div>

            {/* Rincian Komponen Biaya */}
            {targetInvoice.lines && targetInvoice.lines.length > 0 && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                  Rincian Komponen Tagihan
                </p>
                <div className="divide-y divide-slate-100 text-xs">
                  {targetInvoice.lines.map((l) => (
                    <div key={l.id} className="py-2 flex items-center justify-between">
                      <span className="text-slate-700 font-medium">{l.description}</span>
                      <span className="font-semibold text-slate-900 tabular-nums">{formatRupiah(Number(l.amount))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Pilihan Metode Pembayaran */}
        <form action={bayarTagihan} className="space-y-6">
          <input type="hidden" name="invoiceId" value={targetInvoice.id} />

          <div className="space-y-5">
            {paymentMethods.map((group, idx) => (
              <div key={idx} className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                  {group.icon}
                  {group.category}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {group.options.map((opt) => (
                    <label key={opt.id} className="relative cursor-pointer group">
                      <input type="radio" name="metode" value={opt.id} className="sr-only peer" required />
                      <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 peer-checked:border-emerald-600 peer-checked:bg-emerald-50/30 peer-checked:ring-1 peer-checked:ring-emerald-600 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="size-4 rounded-full border-2 border-slate-300 peer-checked:border-emerald-600 flex items-center justify-center transition-colors">
                            <div className="size-2 rounded-full bg-emerald-600 scale-0 peer-checked:scale-100 transition-transform" />
                          </div>
                          <span className="text-sm font-semibold text-slate-800">{opt.label}</span>
                        </div>
                        <span className="text-[11px] font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                          {opt.code}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 p-4 rounded-xl flex gap-3 border border-slate-200/80">
            <Info className="size-5 text-teal-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600">
              <p className="font-semibold text-slate-800 mb-0.5">Simulasi Pelunasan Terintegrasi</p>
              <p>Pembayaran akan diverifikasi dan dialokasikan secara atomik ke invoice ini. Kwitansi digital akan langsung tersedia di akun Anda.</p>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full h-14 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm active:scale-[0.98] rounded-xl transition-all"
          >
            Konfirmasi &amp; Bayar {formatRupiah(balanceDue)}
          </Button>
        </form>
      </div>
    </div>
  );
}
