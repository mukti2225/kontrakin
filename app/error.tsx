"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root application error captured:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-rose-200/80 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 mb-4 shadow-xs">
          <AlertCircle className="size-7" />
        </div>

        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Terjadi Kendala Teknis
        </h1>

        <p className="mt-2 text-xs text-slate-500 leading-relaxed sm:text-sm">
          Aplikasi mengalami kegagalan proses tak terduga. Silakan coba muat ulang komponen ini
          atau kembali ke halaman utama.
        </p>

        {error.digest && (
          <p className="mt-3 font-mono text-[11px] text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
            Error ID: {error.digest}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2.5">
          <Button
            type="button"
            onClick={() => reset()}
            className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-xs"
          >
            <RefreshCw className="mr-1.5 size-4" />
            Coba Muat Ulang
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => (window.location.href = "/")}
            className="w-full rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
          >
            <ArrowLeft className="mr-1.5 size-4" />
            Ke Halaman Utama
          </Button>
        </div>
      </div>
    </div>
  );
}
