"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, ShieldAlert, WifiOff, Home } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  errorId?: string;
  onRetry?: () => void | Promise<void>;
  retryLabel?: string;
  backHref?: string;
  backLabel?: string;
  className?: string;
}

export function ErrorState({
  title = "Gagal Memuat Data Operasional",
  message = "Terjadi kendala saat berkomunikasi dengan server. Silakan coba kembali beberapa saat lagi.",
  errorId,
  onRetry,
  retryLabel = "Coba Lagi",
  backHref = "/dashboard/owner",
  backLabel = "Kembali ke Beranda",
  className = "",
}: ErrorStateProps) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    if (!onRetry || retrying) return;
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-rose-100 bg-rose-50/30 p-8 text-center sm:p-12 ${className}`}
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-100/80 text-rose-600 shadow-xs mb-4">
        <AlertCircle className="size-7" />
      </div>

      <h3 className="text-base font-bold text-slate-900 sm:text-lg">{title}</h3>
      <p className="mt-1.5 max-w-md text-xs text-slate-600 leading-relaxed sm:text-sm">
        {message}
      </p>

      {errorId && (
        <p className="mt-2 font-mono text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
          Kode Diagnostik: {errorId}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
        {onRetry && (
          <Button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs"
          >
            <RefreshCw className={`mr-1.5 size-3.5 ${retrying ? "animate-spin" : ""}`} />
            {retrying ? "Mencoba Ulang..." : retryLabel}
          </Button>
        )}

        {backHref && (
          <Link
            href={backHref}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            )}
          >
            <Home className="mr-1.5 size-3.5 text-slate-500" />
            {backLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

export function PermissionDeniedState({
  featureName = "Fitur Ini",
  requiredRole = "Owner / Manajer",
  className = "",
}: {
  featureName?: string;
  requiredRole?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-amber-200/80 bg-amber-50/40 p-8 text-center sm:p-10 ${className}`}
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-xs mb-4">
        <ShieldAlert className="size-7" />
      </div>

      <h3 className="text-base font-bold text-slate-900 sm:text-lg">
        Akses Terbatas — {featureName}
      </h3>
      <p className="mt-1.5 max-w-md text-xs text-slate-600 leading-relaxed sm:text-sm">
        Akun Anda tidak memiliki hak akses untuk mengubah atau meninjau modul ini. Hak akses ini
        hanya tersedia untuk peran <strong className="text-slate-800">{requiredRole}</strong>.
      </p>

      <div className="mt-5">
        <Link
          href="/dashboard/owner"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          )}
        >
          <Home className="mr-1.5 size-3.5 text-slate-500" />
          Kembali ke Dashboard Utama
        </Link>
      </div>
    </div>
  );
}

export function NetworkErrorState({
  onRetry,
  className = "",
}: {
  onRetry?: () => void | Promise<void>;
  className?: string;
}) {
  return (
    <ErrorState
      title="Koneksi Terputus"
      message="Gagal terhubung ke jaringan internet atau server tidak dapat dijangkau. Periksa koneksi internet Anda lalu coba kembali."
      retryLabel="Hubungkan Ulang"
      onRetry={onRetry}
      className={className}
    />
  );
}
