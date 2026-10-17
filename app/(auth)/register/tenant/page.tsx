import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, ArrowRight, Home, LogIn } from "lucide-react";

export const metadata = {
  title: "Akses Akun Tenant — Kontrakin",
  description: "Informasi akses portal tenant dan aktivasi akun penghuni Kontrakin.",
};

export default function DeprecatedTenantRegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm text-center">
        {/* Brand header */}
        <div className="flex items-center justify-center gap-2">
          <Image src="/icon-aja.png" alt="Kontrakin" width={32} height={32} />
          <span className="text-xl font-bold tracking-tight text-slate-900">Kontrakin</span>
        </div>

        {/* Shield Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 ring-8 ring-teal-50/50">
          <ShieldCheck className="h-7 w-7" />
        </div>

        {/* Title & Explanation */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Akses Tenant Diberikan oleh Owner
          </h1>
          <p className="text-sm leading-relaxed text-slate-600">
            Pendaftaran publik untuk penyewa tidak dibuka demi menjaga keamanan data kontrak dan unit kamar Anda. Akun penghuni dibuat dan diaktifkan secara eksklusif oleh Pemilik (Owner) properti.
          </p>
        </div>

        {/* Guided Steps Card */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-left space-y-2.5 text-xs text-slate-600">
          <div className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 font-bold text-teal-800 text-[11px]">
              1
            </span>
            <span>
              Pemilik kos/apartemen mendaftarkan Anda dan mengirimkan <strong>tautan aktivasi</strong> ke nomor WhatsApp atau email Anda.
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 font-bold text-teal-800 text-[11px]">
              2
            </span>
            <span>
              Klik tautan aktivasi tersebut dan masukkan kode OTP untuk langsung mengakses <strong>Tenant Portal</strong> Anda.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Link
            href="/login"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-800 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-900 active:scale-[0.99]"
          >
            <LogIn className="h-4 w-4" />
            Sudah Memiliki Akun? Masuk
          </Link>

          <Link
            href="/"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 active:scale-[0.99]"
          >
            <Home className="h-4 w-4 text-slate-400" />
            Kembali ke Beranda
          </Link>
        </div>

        {/* Owner registration note */}
        <div className="border-t border-slate-100 pt-5 text-xs text-slate-400">
          Apakah Anda pemilik properti kos atau apartemen?{" "}
          <Link href="/register" className="font-semibold text-teal-700 hover:underline">
            Daftar Akun Owner
          </Link>
        </div>
      </div>
    </div>
  );
}
