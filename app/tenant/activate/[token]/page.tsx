import Link from "next/link";
import { TenantActivationService } from "@/lib/services/tenant-activation-service";
import { TenantActivateClient } from "./tenant-activate-client";
import { AlertCircle, Clock, CheckCircle2, Building, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function TenantActivationPage({ params }: PageProps) {
  const { token } = await params;
  const validation = await TenantActivationService.validateToken(token);

  if (!validation.isValid || !validation.tenant) {
    const reason = validation.reason || "INVALID";

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-1">
            <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-slate-200 text-slate-700 mb-2">
              <Building className="size-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Kontrakin — Portal Tenant
            </h1>
          </div>

          <Card className="border border-slate-200/90 bg-white shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-5 text-center">
              {reason === "EXPIRED" && (
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 mb-2">
                  <Clock className="size-6" />
                </div>
              )}
              {reason === "USED" && (
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-blue-100 text-blue-700 mb-2">
                  <CheckCircle2 className="size-6" />
                </div>
              )}
              {(reason === "REVOKED" || reason === "INVALID") && (
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-rose-100 text-rose-700 mb-2">
                  <AlertCircle className="size-6" />
                </div>
              )}

              <CardTitle className="text-base font-bold text-slate-900">
                {reason === "EXPIRED" && "Tautan Aktivasi Kedaluwarsa"}
                {reason === "USED" && "Tautan Sudah Digunakan"}
                {reason === "REVOKED" && "Tautan Tidak Berlaku"}
                {reason === "INVALID" && "Tautan Tidak Valid"}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 text-center text-xs text-slate-600 space-y-4">
              {reason === "EXPIRED" && (
                <p className="leading-relaxed">
                  Tautan aktivasi akun ini telah melewati batas masa berlaku 48 jam. Silakan hubungi pemilik atau pengelola kos Anda untuk meminta tautan aktivasi baru.
                </p>
              )}

              {reason === "USED" && (
                <p className="leading-relaxed">
                  Tautan aktivasi ini telah berhasil digunakan sebelumnya. Anda dapat langsung masuk ke akun Tenant Portal menggunakan nomor WhatsApp atau email Anda.
                </p>
              )}

              {reason === "REVOKED" && (
                <p className="leading-relaxed">
                  Tautan aktivasi ini sudah dibatalkan karena pengelola properti telah mengirimkan tautan akses terbaru. Silakan periksa pesan WhatsApp terbaru Anda.
                </p>
              )}

              {reason === "INVALID" && (
                <p className="leading-relaxed">
                  Tautan aktivasi yang Anda tuju tidak valid. Pastikan Anda mengklik atau menyalin seluruh tautan secara lengkap dari pesan WhatsApp yang Anda terima.
                </p>
              )}

              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs min-h-[44px] transition"
                >
                  Masuk ke Halaman Login
                </Link>
              </div>
            </CardContent>

            <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-4 text-center justify-center">
              <p className="text-[11px] text-slate-400">
                Kontrakin • Solusi Operasional Properti Sewa
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return <TenantActivateClient token={token} tenant={validation.tenant} />;
}
