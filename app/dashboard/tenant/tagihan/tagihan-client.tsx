"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Receipt,
  Home,
  Wallet,
  CheckCircle2,
  Clock,
  ArrowRight,
  Printer,
  X,
  ShieldCheck,
  Calendar,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatRupiah } from "@/lib/utils";

export interface InvoiceLineDTO {
  id: string;
  description: string;
  amount: number;
}

export interface InvoiceDTO {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  total: number;
  balanceDue: number;
  status: string;
  updatedAt: string;
  lines: InvoiceLineDTO[];
  payment?: {
    method: string;
    reference: string;
    paidAt: string;
  };
}

export interface TenantTagihanProps {
  penghuni: {
    id: string;
    nama: string;
    noHp: string;
    email: string | null;
  };
  kamar: {
    nomor: string;
    tipe: string;
    hargaBulanan: number;
    propertiNama: string;
    propertiAlamat: string;
    ownerName: string;
  };
  invoices: InvoiceDTO[];
  initialSuccess?: boolean;
}

export function TagihanClient({
  penghuni,
  kamar,
  invoices,
  initialSuccess = false,
}: TenantTagihanProps) {
  const [showSuccessBanner, setShowSuccessBanner] = useState(initialSuccess);
  const [selectedReceipt, setSelectedReceipt] = useState<InvoiceDTO | null>(
    initialSuccess && invoices.length > 0 && invoices[0].balanceDue === 0
      ? invoices[0]
      : null
  );

  const now = new Date();
  const unpaidInvoice = invoices.find((inv) => Number(inv.balanceDue) > 0);
  const isOverdue = unpaidInvoice ? new Date(unpaidInvoice.dueDate) < now : false;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 md:p-8 animate-in fade-in duration-300">
      {/* ── Success Celebration Banner (After Successful Payment) ─────── */}
      {showSuccessBanner && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50/90 p-4 sm:p-5 text-emerald-950 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <CheckCircle2 className="size-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-900">Pembayaran Berhasil Diverifikasi!</h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                Alokasi pembayaran telah dicatat atomik. Kwitansi resmi pelunasan telah siap Anda unduh atau cetak.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {invoices.length > 0 && invoices[0].balanceDue === 0 && (
              <Button
                size="sm"
                onClick={() => setSelectedReceipt(invoices[0])}
                className="w-full sm:w-auto min-h-[40px] text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl gap-1.5"
              >
                <Receipt className="size-3.5" />
                <span>Buka Kwitansi</span>
              </Button>
            )}
            <button
              onClick={() => setShowSuccessBanner(false)}
              className="text-emerald-700 hover:text-emerald-900 p-2 rounded-lg hover:bg-emerald-100 transition"
              aria-label="Tutup notifikasi"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Tagihan &amp; Pembayaran Sewa
        </h1>
        <p className="text-slate-500 mt-1 text-xs sm:text-sm">
          Kelola invoice bulanan, lakukan pembayaran aman, dan unduh kwitansi resmi sewa Anda.
        </p>
      </div>

      {/* ── Overview Cards Grid ─────────────────────────────────────── */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        {/* Unit & Property Info Card */}
        <Card className="border border-slate-200/80 bg-white shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Home className="size-4 text-emerald-600" />
              Informasi Kamar &amp; Sewa
            </CardTitle>
            <CardDescription className="text-xs">Detail unit yang Anda tempati saat ini</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-1">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Unit Kamar</span>
              <span className="font-bold text-sm bg-slate-100 px-2.5 py-0.5 rounded-lg text-slate-800">
                Kamar {kamar.nomor}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Properti &amp; Tipe</span>
              <span className="text-xs font-semibold text-slate-700">
                {kamar.propertiNama} ({kamar.tipe})
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs text-slate-500 font-medium">Tarif Sewa Kamar</span>
              <span className="font-extrabold text-lg text-slate-900 tabular-nums">
                {formatRupiah(kamar.hargaBulanan)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Current Active Bill Card */}
        <Card
          className={`border shadow-xs ${
            unpaidInvoice ? "border-amber-200/80 bg-white" : "border-emerald-200/80 bg-emerald-50/20"
          }`}
        >
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <Receipt className={`size-4 ${unpaidInvoice ? "text-amber-600" : "text-emerald-600"}`} />
                  Tagihan Aktif
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {unpaidInvoice ? `Invoice #${unpaidInvoice.invoiceNumber}` : "Status pembayaran terkini"}
                </CardDescription>
              </div>
              <StatusBadge
                variant={
                  !unpaidInvoice
                    ? "emerald"
                    : isOverdue
                    ? "rose"
                    : unpaidInvoice.status === "partial"
                    ? "amber"
                    : "slate"
                }
              >
                {!unpaidInvoice
                  ? "Lunas"
                  : isOverdue
                  ? "Tertunggak"
                  : unpaidInvoice.status === "partial"
                  ? "Sebagian"
                  : "Belum Lunas"}
              </StatusBadge>
            </div>
          </CardHeader>

          <CardContent className="pt-1">
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-center">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                {unpaidInvoice ? "Sisa yang Harus Dibayar" : "Sisa Tagihan"}
              </p>
              <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
                {unpaidInvoice ? formatRupiah(unpaidInvoice.balanceDue) : "Rp 0"}
              </p>
              {unpaidInvoice && (
                <p className="text-xs text-slate-500 mt-1">
                  Jatuh tempo:{" "}
                  <span className="font-bold text-slate-800">
                    {new Date(unpaidInvoice.dueDate).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="pt-0">
            {unpaidInvoice ? (
              <Button
                className="w-full h-12 text-sm font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs active:scale-[0.98]"
                render={<Link href={`/dashboard/tenant/tagihan/pembayaran?invoiceId=${unpaidInvoice.id}`} />}
              >
                <Wallet className="size-4" />
                Bayar Tagihan Sekarang
                <ArrowRight className="size-4 ml-auto" />
              </Button>
            ) : (
              <div className="w-full flex items-center justify-center gap-2 py-3 text-xs font-semibold text-emerald-800 bg-emerald-50 rounded-xl border border-emerald-200">
                <CheckCircle2 className="size-4 text-emerald-600" />
                Semua tagihan sewa Anda telah lunas!
              </div>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* ── Invoices & Receipts List / Table ─────────────────────────── */}
      <Card className="border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <CardHeader className="border-b border-slate-100 px-4 sm:px-6 py-4">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="size-4 text-emerald-600" />
            Riwayat Tagihan &amp; Kwitansi Pelunasan
          </CardTitle>
          <CardDescription className="text-xs">
            Daftar seluruh invoice yang diterbitkan dan kwitansi resmi yang dapat Anda unduh kapan saja.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {invoices.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {invoices.map((inv) => {
                const due = new Date(inv.dueDate);
                const invOverdue = due < now && inv.balanceDue > 0;
                const isFullyPaid = inv.balanceDue === 0;

                return (
                  <div
                    key={inv.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs sm:text-sm font-bold text-slate-900">
                          #{inv.invoiceNumber}
                        </span>
                        <StatusBadge
                          variant={
                            isFullyPaid
                              ? "emerald"
                              : invOverdue
                              ? "rose"
                              : inv.status === "partial"
                              ? "amber"
                              : "slate"
                          }
                          dot
                        >
                          {isFullyPaid
                            ? "Lunas"
                            : invOverdue
                            ? "Tertunggak"
                            : inv.status === "partial"
                            ? "Sebagian"
                            : "Belum Bayar"}
                        </StatusBadge>
                      </div>

                      <p className="text-xs text-slate-500">
                        {inv.lines.map((l) => l.description).join(", ") || "Sewa Kamar"}
                      </p>

                      <p className="text-[11px] text-slate-400">
                        Jatuh Tempo:{" "}
                        {due.toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-left sm:text-right">
                        <p className="text-xs font-medium text-slate-400">Total Tagihan</p>
                        <p className="text-sm font-extrabold text-slate-900 tabular-nums">
                          {formatRupiah(inv.total)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {isFullyPaid ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedReceipt(inv)}
                            className="min-h-[38px] text-xs font-semibold gap-1.5 border-emerald-200 text-emerald-800 bg-emerald-50/50 hover:bg-emerald-100 rounded-xl"
                          >
                            <Receipt className="size-3.5" />
                            <span>Lihat Kwitansi</span>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="min-h-[38px] text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                            render={<Link href={`/dashboard/tenant/tagihan/pembayaran?invoiceId=${inv.id}`} />}
                          >
                            Bayar Sekarang
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center p-6">
              <div className="p-3 bg-slate-100 rounded-full mb-3 text-slate-400">
                <Receipt className="size-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">Belum Ada Tagihan</h3>
              <p className="text-slate-500 text-xs max-w-sm mt-1">
                Pengelola kos belum menerbitkan tagihan invoice untuk akun Anda.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Official Printable Digital Receipt Modal ─────────────────── */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            {/* Action Bar (Hidden on print) */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 backdrop-blur-xs px-5 py-3 print:hidden">
              <div className="flex items-center gap-2">
                <FileCheck className="size-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800">Kwitansi Resmi Pelunasan Sewa</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handlePrint}
                  className="h-9 min-h-[36px] text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                >
                  <Printer className="size-3.5" />
                  <span>Cetak (PDF)</span>
                </Button>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                  aria-label="Tutup Kwitansi"
                >
                  <X className="size-4.5" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Paper Container */}
            <div className="p-6 sm:p-8 space-y-6 text-slate-900 print:p-0">
              {/* Receipt Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xl tracking-tight text-emerald-800">KONTRAKIN</span>
                    <span className="text-xs text-slate-400 font-medium">| Property OS</span>
                  </div>
                  <h2 className="mt-2 text-lg font-extrabold text-slate-900 tracking-tight">
                    KWITANSI PELUNASAN RESMI
                  </h2>
                  <p className="font-mono text-xs font-bold text-slate-600">
                    KWT/{selectedReceipt.invoiceNumber}
                  </p>
                </div>

                {/* Stempel LUNAS / DIGITAL SEAL */}
                <div className="rounded-xl border-2 border-emerald-600 bg-emerald-50 px-3 py-1.5 text-center rotate-[-4deg] shadow-xs">
                  <span className="block text-xs font-black text-emerald-700 tracking-widest uppercase">
                    LUNAS
                  </span>
                  <span className="block text-[9px] font-bold text-emerald-600 uppercase tracking-tighter">
                    VERIFIED SYSTEM
                  </span>
                </div>
              </div>

              {/* Tenant & Room Metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Telah Diterima Dari</p>
                  <p className="font-bold text-slate-900 mt-0.5 text-sm">{penghuni.nama}</p>
                  <p className="text-slate-600">{penghuni.noHp}</p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Unit Kamar / Properti</p>
                  <p className="font-bold text-slate-900 mt-0.5 text-sm">Kamar {kamar.nomor}</p>
                  <p className="text-slate-600">{kamar.propertiNama}</p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Tanggal Pembayaran</p>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {new Date(selectedReceipt.updatedAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Metode Pembayaran</p>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {selectedReceipt.payment?.method || "Transfer Bank / QRIS Terverifikasi"}
                  </p>
                </div>
              </div>

              {/* Rincian Komponen Pembayaran */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Rincian Komponen Tagihan
                </p>
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden text-xs">
                  {selectedReceipt.lines.map((l) => (
                    <div key={l.id} className="p-3 flex justify-between items-center bg-white">
                      <span className="font-medium text-slate-800">{l.description}</span>
                      <span className="font-bold text-slate-900 tabular-nums">
                        {formatRupiah(l.amount)}
                      </span>
                    </div>
                  ))}

                  <div className="p-3 bg-slate-50 flex justify-between items-center font-bold text-slate-900">
                    <span>Total Pembayaran</span>
                    <span className="text-base text-emerald-700 tabular-nums">
                      {formatRupiah(selectedReceipt.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Notice & Signature placeholder */}
              <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 space-y-4">
                <p className="text-[11px] leading-relaxed italic">
                  * Dokumen kwitansi ini merupakan bukti pembayaran sah yang dikeluarkan secara elektronik melalui sistem Kontrakin. Tidak memerlukan tanda tangan basah fisik.
                </p>

                <div className="flex justify-between items-end pt-2">
                  <div>
                    <p className="text-[11px] text-slate-400">Manajemen Pengelola:</p>
                    <p className="font-bold text-slate-800 text-xs mt-0.5">{kamar.ownerName || "Pengelola Properti"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-slate-400">Status Validasi:</p>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 text-xs">
                      <ShieldCheck className="size-3.5" />
                      Tercatat di Buku Kas
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
