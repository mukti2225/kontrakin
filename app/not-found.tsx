import Link from "next/link";
import { Compass, Home, ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-sm">
        {/* Visual Badge */}
        <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-teal-50 text-teal-600 border border-teal-100 shadow-xs">
          <Compass className="size-8 animate-pulse" />
        </div>

        <p className="mt-5 font-mono text-xs font-bold uppercase tracking-widest text-teal-600">
          Galat 404
        </p>

        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Halaman Tidak Ditemukan
        </h1>

        <p className="mt-2.5 text-xs text-slate-500 leading-relaxed sm:text-sm">
          Alamat yang Anda tuju mungkin salah ketik, sudah dipindahkan, atau telah dinonaktifkan dari sistem Kontrakin.
        </p>

        <div className="mt-8 flex flex-col gap-2.5">
          <Link
            href="/dashboard/owner"
            className={cn(
              buttonVariants({ variant: "default" }),
              "w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-xs"
            )}
          >
            <Home className="mr-1.5 size-4" />
            Kembali ke Dashboard
          </Link>

          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
            )}
          >
            <ArrowLeft className="mr-1.5 size-4" />
            Ke Halaman Utama
          </Link>
        </div>

        <p className="mt-6 text-[11px] text-slate-400">
          Butuh bantuan operasional? Hubungi administrator atau pengelola properti Anda.
        </p>
      </div>
    </div>
  );
}
