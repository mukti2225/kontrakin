import Link from "next/link";
import { ShieldAlert, ArrowLeft, Home, LogIn } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <ShieldAlert className="size-8" />
        </div>

        <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
          Akses Tidak Diizinkan
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Akun Anda tidak memiliki izin untuk membuka halaman ini, atau sesi Anda telah berakhir.
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-200 transition hover:bg-teal-700 active:scale-[0.98]"
          >
            <Home className="size-4" />
            <span>Kembali ke Dashboard Saya</span>
          </Link>

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
          >
            <LogIn className="size-4" />
            <span>Ganti Akun / Login Ulang</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
