"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log runtime error for observability
    console.error("Dashboard runtime error captured:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-lg rounded-3xl border border-rose-200/80 bg-white p-8 shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 mb-4 shadow-xs">
          <AlertTriangle className="size-7" />
        </div>

        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Gagal Memuat Modul Dashboard
        </h2>

        <p className="mt-2 text-xs text-slate-500 leading-relaxed sm:text-sm">
          Terjadi kendala teknis tak terduga saat memproses data pada tampilan ini. Data Anda aman
          dan tidak terpengaruh oleh kendala ini.
        </p>

        {error.message && (
          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-left">
            <p className="font-mono text-xs text-rose-700 break-words font-medium">
              {error.message}
            </p>
            {error.digest && (
              <p className="mt-1 font-mono text-[10px] text-slate-400">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <Button
            type="button"
            onClick={() => reset()}
            className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs"
          >
            <RefreshCw className="mr-1.5 size-3.5" />
            Muat Ulang Halaman
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => (window.location.href = "/dashboard/owner")}
            className="rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Home className="mr-1.5 size-3.5 text-slate-500" />
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    </div>
  );
}
