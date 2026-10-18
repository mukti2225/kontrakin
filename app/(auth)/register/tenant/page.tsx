import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Home, LogIn } from "lucide-react";

export const metadata = {
  title: "Akses Akun Tenant — Huni Link",
  description: "Informasi akses portal tenant dan aktivasi akun penghuni Huni Link.",
};

export default function DeprecatedTenantRegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAF9] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-7 rounded-3xl border border-neutral-200/80 bg-white p-8 sm:p-10 shadow-lg text-center">
        {/* Brand header */}
        <div className="flex items-center justify-center gap-2.5">
          <Image src="/icon-aja.png" alt="Huni Link" width={30} height={30} className="rounded-md" />
          <span className="text-xl font-bold tracking-tight text-neutral-900">
            Huni<span className="text-[#0FA37F]">Link.</span>
          </span>
        </div>

        {/* Shield Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#0FA37F] ring-8 ring-emerald-50/50">
          <ShieldCheck className="h-7 w-7" />
        </div>

        {/* Title & Explanation */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Akses Tenant Diberikan oleh Owner
          </h1>
          <p className="text-sm leading-relaxed text-neutral-500">
            Pendaftaran publik untuk penyewa tidak dibuka demi menjaga keamanan data kontrak dan unit kamar Anda. Akun penghuni dibuat dan diaktifkan secara eksklusif oleh Pemilik (Owner) properti.
          </p>
        </div>

        {/* Guided Steps Card */}
        <div className="rounded-2xl border border-neutral-100 bg-neutral-50/80 p-4 text-left space-y-3 text-xs text-neutral-600">
          <div className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800 text-[11px]">
              1
            </span>
            <span>
              Pemilik kos/apartemen mendaftarkan Anda dan mengirimkan <strong>tautan aktivasi</strong> ke nomor WhatsApp atau email Anda.
            </span>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800 text-[11px]">
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
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0FA37F] active:scale-[0.99]"
          >
            <LogIn className="h-4 w-4" />
            Sudah Memiliki Akun? Masuk
          </Link>

          <Link
            href="/"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 active:scale-[0.99]"
          >
            <Home className="h-4 w-4 text-neutral-400" />
            Kembali ke Beranda
          </Link>
        </div>

        {/* Owner registration note */}
        <div className="border-t border-neutral-100 pt-5 text-xs text-neutral-400">
          Apakah Anda pemilik properti kos atau apartemen?{" "}
          <Link href="/register" className="font-semibold text-neutral-900 hover:text-[#0FA37F] transition-colors underline underline-offset-2">
            Daftar Akun Owner
          </Link>
        </div>
      </div>
    </div>
  );
}
