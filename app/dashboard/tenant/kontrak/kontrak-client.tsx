"use client";

import { useState, useTransition } from "react";
import {
  FileText,
  ShieldCheck,
  Calendar,
  CreditCard,
  Building,
  UserCheck,
  Printer,
  X,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "sonner";
import { formatRupiah } from "@/lib/utils";
import { gabungDenganKode, type GabungInput } from "./action";

interface StatusGabung {
  id: string;
  nama: string;
  noHp: string;
  status: string;
  owner: { name: string };
  kamar: {
    nomor: string;
    tipe: string;
    properti?: {
      nama: string;
      alamat: string;
    } | null;
  } | null;
  activeLease?: {
    id: string;
    nomorKontrak: string | null;
    startDate: Date | string;
    endDate: Date | string;
    rentAmount: number;
    depositAmount: number;
    billingDay: number;
    status: string;
    notes?: string | null;
    charges?: Array<{
      id: string;
      type: string;
      name?: string;
      description?: string;
      amount: number;
    }>;
  } | null;
}

interface GabungClientProps {
  statusAwal: StatusGabung | null;
}

export function GabungClient({ statusAwal }: GabungClientProps) {
  const [status, setStatus] = useState<StatusGabung | null>(statusAwal);
  const [form, setForm] = useState({
    kodeUndangan: "",
    noHp: "",
    tanggalMasuk: new Date().toISOString().slice(0, 10),
  });
  const [isPending, startTransition] = useTransition();
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  // When tenant is already assigned / has active lease
  if (status) {
    const activeLease = status.activeLease;
    const kamar = status.kamar;
    const properti = kamar?.properti;

    const startDateStr = activeLease
      ? new Date(activeLease.startDate).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "-";

    const endDateStr = activeLease
      ? new Date(activeLease.endDate).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "-";

    return (
      <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6 md:p-8 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Kontrak &amp; Aturan Sewa
            </h1>
            <p className="text-slate-500 mt-1 text-xs sm:text-sm">
              Informasi legal perjanjian sewa kamar, deposit jaminan, dan tata tertib properti.
            </p>
          </div>

          {activeLease && (
            <Button
              onClick={() => setShowDocumentModal(true)}
              className="h-10 min-h-[40px] text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs active:scale-[0.98]"
            >
              <FileCheck className="size-4" />
              <span>Lihat &amp; Cetak Surat Perjanjian</span>
            </Button>
          )}
        </div>

        {/* Primary Lease Card */}
        <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/75 border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="size-5 text-emerald-600" />
                  Perjanjian Sewa Kamar
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Pengelola: <span className="font-semibold text-slate-800">{status.owner.name}</span>
                  {properti && ` • ${properti.nama}`}
                </CardDescription>
              </div>

              <StatusBadge
                variant={activeLease ? "emerald" : "amber"}
                dot
              >
                {activeLease ? "Kontrak Aktif Terverifikasi" : "Menunggu Penempatan"}
              </StatusBadge>
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-6">
            {/* Grid 4 Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Unit Kamar</span>
                <p className="text-base font-extrabold text-slate-900 mt-0.5">
                  {kamar ? `Kamar ${kamar.nomor}` : "-"}
                </p>
                <p className="text-xs text-slate-500">{kamar?.tipe || "Standard"}</p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Tarif Bulanan</span>
                <p className="text-base font-extrabold text-emerald-700 mt-0.5">
                  {activeLease ? formatRupiah(activeLease.rentAmount) : "-"}
                </p>
                <p className="text-xs text-slate-500">per bulan</p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Uang Deposit</span>
                <p className="text-base font-extrabold text-slate-900 mt-0.5">
                  {activeLease ? formatRupiah(activeLease.depositAmount) : "-"}
                </p>
                <p className="text-xs text-slate-500">Jaminan tersimpan</p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Jatuh Tempo</span>
                <p className="text-base font-extrabold text-slate-900 mt-0.5">
                  {activeLease ? `Tgl ${activeLease.billingDay}` : "-"}
                </p>
                <p className="text-xs text-slate-500">tiap bulan</p>
              </div>
            </div>

            {/* Details Table */}
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white text-xs">
              <div className="p-3.5 flex justify-between items-center">
                <span className="text-slate-500 font-medium">Nomor Kontrak Resmi</span>
                <span className="font-mono font-bold text-slate-800">
                  {activeLease?.nomorKontrak || "KTR-SYSTEM-01"}
                </span>
              </div>

              <div className="p-3.5 flex justify-between items-center">
                <span className="text-slate-500 font-medium">Periode Masa Sewa</span>
                <span className="font-semibold text-slate-800">
                  {startDateStr} — {endDateStr}
                </span>
              </div>

              <div className="p-3.5 flex justify-between items-center">
                <span className="text-slate-500 font-medium">Nama Penyewa Terdaftar</span>
                <span className="font-bold text-slate-900">{status.nama}</span>
              </div>

              <div className="p-3.5 flex justify-between items-center">
                <span className="text-slate-500 font-medium">Nomor Telepon / WhatsApp</span>
                <span className="font-medium text-slate-700">{status.noHp}</span>
              </div>
            </div>

            {/* Additional Recurring Charges if any */}
            {activeLease?.charges && activeLease.charges.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Komponen Biaya Tambahan Rutin
                </h3>
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/40 text-xs">
                  {activeLease.charges.map((ch) => (
                    <div key={ch.id} className="p-3 flex justify-between items-center">
                      <span className="text-slate-700 font-medium">{ch.description || ch.name || "Biaya Tambahan"}</span>
                      <span className="font-bold text-slate-900 tabular-nums">
                        {formatRupiah(ch.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Property Rules & Room Notes */}
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-900">
                <AlertCircle className="size-4 shrink-0 text-amber-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Tata Tertib &amp; Ketentuan Kamar
                </h3>
              </div>
              <p className="text-xs text-amber-950/90 leading-relaxed">
                {activeLease?.notes ||
                  "1. Menjaga kebersihan bersama di area kamar dan lorong. 2. Tamu dilarang menginap tanpa konfirmasi ke pengelola. 3. Pembayaran sewa dilakukan tepat waktu sebelum tanggal jatuh tempo. 4. Dilarang merusak instalasi listrik atau membawa perangkat berdaya tinggi tanpa izin."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ── Official Printable Contract Agreement Modal ─────────────── */}
        {showDocumentModal && activeLease && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-3 sm:p-4 backdrop-blur-xs">
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
              {/* Header Action Bar (Hidden on print) */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 backdrop-blur-xs px-5 py-3.5 print:hidden">
                <div className="flex items-center gap-2">
                  <FileCheck className="size-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Surat Perjanjian Sewa Kamar (Resmi)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => window.print()}
                    className="h-9 min-h-[36px] text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                  >
                    <Printer className="size-3.5" />
                    <span>Cetak Dokumen</span>
                  </Button>
                  <button
                    onClick={() => setShowDocumentModal(false)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                    aria-label="Tutup Dokumen"
                  >
                    <X className="size-4.5" />
                  </button>
                </div>
              </div>

              {/* Printable Document Sheet */}
              <div className="p-6 sm:p-10 space-y-6 text-slate-900 text-xs leading-relaxed print:p-0">
                <div className="text-center border-b-2 border-slate-800 pb-4">
                  <h2 className="text-base sm:text-lg font-black tracking-tight uppercase">
                    SURAT PERJANJIAN SEWA MENYEWA KAMAR
                  </h2>
                  <p className="font-mono text-xs font-bold text-slate-600 mt-1">
                    NOMOR: {activeLease.nomorKontrak || "KTR/2026/001"}
                  </p>
                </div>

                <p>
                  Pada hari ini, telah dibuat dan disepakati perjanjian sewa menyewa kamar antara pihak-pihak di bawah ini:
                </p>

                {/* Parties */}
                <div className="space-y-3 pl-2">
                  <div>
                    <span className="font-bold text-slate-900 block">1. PIHAK PERTAMA (PENGELOLA / PEMILIK):</span>
                    <span className="text-slate-700 block ml-4">Nama: {status.owner.name}</span>
                    <span className="text-slate-700 block ml-4">
                      Properti: {properti?.nama || "Kost Kontrakin"} ({properti?.alamat || "-"})
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-900 block">2. PIHAK KEDUA (PENYEWA):</span>
                    <span className="text-slate-700 block ml-4">Nama: {status.nama}</span>
                    <span className="text-slate-700 block ml-4">No. HP/WhatsApp: {status.noHp}</span>
                    <span className="text-slate-700 block ml-4">Unit Kamar: Kamar {kamar?.nomor || "-"}</span>
                  </div>
                </div>

                {/* Clauses */}
                <div className="space-y-4 pt-2">
                  <div>
                    <h3 className="font-bold text-slate-900 uppercase">Pasal 1 — Objek Sewa &amp; Jangka Waktu</h3>
                    <p className="text-slate-700 mt-1">
                      PIHAK PERTAMA menyewakan kepada PIHAK KEDUA satu unit kamar nomor{" "}
                      <strong>{kamar?.nomor}</strong> tipe {kamar?.tipe} terhitung sejak tanggal{" "}
                      <strong>{startDateStr}</strong> sampai dengan <strong>{endDateStr}</strong>.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 uppercase">Pasal 2 — Tarif Sewa &amp; Uang Jaminan (Deposit)</h3>
                    <p className="text-slate-700 mt-1">
                      Tarif sewa bulanan disepakati sebesar <strong>{formatRupiah(activeLease.rentAmount)}</strong> per
                      bulan, yang wajib dibayarkan sebelum tanggal <strong>{activeLease.billingDay}</strong> setiap bulannya.
                      PIHAK KEDUA telah menyetorkan uang jaminan (deposit) sebesar{" "}
                      <strong>{formatRupiah(activeLease.depositAmount)}</strong> yang akan dikembalikan pada akhir masa sewa
                      setelah diperhitungkan dengan kondisi fisik kamar dan tagihan tertunggak jika ada.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 uppercase">Pasal 3 — Kewajiban &amp; Tata Tertib</h3>
                    <p className="text-slate-700 mt-1">
                      PIHAK KEDUA wajib menjaga ketertiban, kebersihan, dan keselamatan bersama, tidak menyalahgunakan kamar
                      untuk aktivitas ilegal, serta tidak memindahtangankan sewa kepada pihak lain tanpa persetujuan tertulis
                      PIHAK PERTAMA.
                    </p>
                  </div>
                </div>

                {/* Signatures */}
                <div className="pt-8 border-t border-slate-200 grid grid-cols-2 text-center text-xs">
                  <div className="space-y-12">
                    <p className="font-bold text-slate-800">PIHAK PERTAMA<br />(Pengelola)</p>
                    <p className="font-bold text-slate-900 underline">{status.owner.name}</p>
                  </div>
                  <div className="space-y-12">
                    <p className="font-bold text-slate-800">PIHAK KEDUA<br />(Penyewa)</p>
                    <p className="font-bold text-slate-900 underline">{status.nama}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Tenant Not Yet Joined with Code
  function submit() {
    if (!form.kodeUndangan.trim() || !form.noHp.trim()) {
      toast.error("Lengkapi kode undangan dan nomor WhatsApp Anda");
      return;
    }

    startTransition(async () => {
      try {
        await gabungDenganKode(form as GabungInput);
        toast.success("Berhasil terhubung! Pengelola akan segera menempatkan Anda ke kamar aktif.");
        window.location.reload();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal bergabung ke properti");
      }
    });
  }

  const [showLegacyForm, setShowLegacyForm] = useState(false);

  return (
    <div className="max-w-md mx-auto space-y-4 p-4 sm:p-6 animate-in fade-in duration-300">
      <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/75 border-b border-slate-100 p-5 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 mb-2">
            <Building className="size-6" />
          </div>
          <CardTitle className="text-base font-bold text-slate-900">
            Akses Portal Tenant Belum Terhubung
          </CardTitle>
          <CardDescription className="text-xs">
            Akun Anda belum dikaitkan dengan unit kamar atau kontrak sewa aktif.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 space-y-4 text-xs">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 space-y-2">
            <p className="font-semibold text-emerald-950">
              💡 Cara Menghubungkan Akun:
            </p>
            <p className="text-emerald-800 leading-relaxed text-[11px]">
              Kini pengelola properti Anda dapat langsung menambahkan nomor WhatsApp Anda ke unit kamar dan mengirimkan tautan aktivasi instan tanpa perlu kode undangan manual.
            </p>
            <p className="text-emerald-800 leading-relaxed text-[11px]">
              Silakan hubungi pengelola kos/kontrakan Anda agar mereka mengirimkan akses portal ke nomor WhatsApp Anda.
            </p>
          </div>

          {/* Legacy Invitation Code fallback */}
          <div className="pt-2 border-t border-slate-100">
            {!showLegacyForm ? (
              <button
                type="button"
                onClick={() => setShowLegacyForm(true)}
                className="text-[11px] text-slate-500 hover:text-emerald-700 font-semibold underline text-center w-full"
              >
                Punya kode undangan manual dari pengelola? Klik di sini
              </button>
            ) : (
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <Label htmlFor="kode" className="font-semibold text-slate-700 text-[11px]">
                    Kode Undangan Properti
                  </Label>
                  <Input
                    id="kode"
                    placeholder="Contoh: 7F3K9QRT"
                    value={form.kodeUndangan}
                    onChange={(e) => setForm((f) => ({ ...f, kodeUndangan: e.target.value.toUpperCase() }))}
                    className="h-10 rounded-xl uppercase tracking-widest font-mono text-center text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="noHp" className="font-semibold text-slate-700 text-[11px]">
                    Nomor WhatsApp
                  </Label>
                  <Input
                    id="noHp"
                    placeholder="08xxxxxxxxxx"
                    value={form.noHp}
                    onChange={(e) => setForm((f) => ({ ...f, noHp: e.target.value }))}
                    className="h-10 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="tanggalMasuk" className="font-semibold text-slate-700 text-[11px]">
                    Tanggal Mulai Masuk
                  </Label>
                  <Input
                    id="tanggalMasuk"
                    type="date"
                    value={form.tanggalMasuk}
                    onChange={(e) => setForm((f) => ({ ...f, tanggalMasuk: e.target.value }))}
                    className="h-10 rounded-xl text-xs"
                  />
                </div>

                <Button
                  onClick={submit}
                  disabled={isPending}
                  className="w-full h-10 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs text-xs gap-1.5"
                >
                  <CheckCircle2 className="size-3.5" />
                  <span>{isPending ? "Menghubungkan..." : "Hubungkan dengan Kode"}</span>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
