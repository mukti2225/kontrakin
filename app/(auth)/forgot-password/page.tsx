"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/auth/client";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const { data, error: forgotError } = await requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });

      if (forgotError) {
        setError(forgotError.message || "Gagal mengirim link reset password.");
      } else {
        setSuccess("Tautan reset kata sandi telah dikirim ke email Anda. Silakan periksa kotak masuk atau spam.");
      }
    } catch {
      setError("Terjadi kesalahan pada server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAF9] px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-neutral-200/80 bg-white p-8 sm:p-10 shadow-lg">
        {/* Brand header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Image src="/icon-aja.png" alt="Huni Link" width={32} height={32} className="rounded-md" />
            <span className="text-xl font-bold tracking-tight text-neutral-900">
              Huni<span className="text-[#0FA37F]">Link.</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Lupa Kata Sandi?
          </h1>
          <p className="mt-2 text-sm text-neutral-500 max-w-xs">
            Masukkan alamat email yang terdaftar untuk menerima petunjuk pemulihan akun.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleForgot} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
              Alamat Email
            </Label>
            <div className="relative flex items-center">
              <Mail className="pointer-events-none absolute left-3.5 h-4 w-4 text-neutral-400" />
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl border-neutral-200 bg-neutral-50/60 pl-10 pr-4 text-sm transition focus:bg-white focus-visible:border-[#0FA37F] focus-visible:ring-[#0FA37F]/20"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="h-12 w-full rounded-xl bg-neutral-900 text-sm font-semibold text-white shadow-sm hover:bg-[#0FA37F] transition-all duration-200 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Mengirim Tautan..." : "Kirim Tautan Reset"}
          </Button>
        </form>

        {/* Back to Login link */}
        <div className="mt-7 pt-6 border-t border-neutral-100 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Halaman Masuk</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
