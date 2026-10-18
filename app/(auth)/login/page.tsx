"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Eye, EyeOff, CheckCircle2, ShieldCheck, ArrowRight, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: signInError } = await signIn.email({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message || "Gagal masuk. Periksa kembali email dan kata sandi Anda.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan pada server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* ── LEFT PANEL: High Quality Architectural Visual Showcase ── */}
      <section className="relative hidden w-1/2 overflow-hidden bg-neutral-900 lg:flex lg:flex-col lg:justify-between p-12">
        {/* High-Resolution Modern Rental Property Interior */}
        <img
          src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1400&auto=format&fit=crop"
          alt="Interior Properti Huni Link"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-70"
        />

        {/* Elegant Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-neutral-950/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/60 to-transparent" />

        {/* Top Header: Brand */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Image src="/icon-aja.png" alt="Huni Link" width={32} height={32} className="rounded-lg shadow-md" />
            <span className="text-2xl font-bold tracking-tight text-white">
              Huni<span className="text-[#0FA37F]">Link.</span>
            </span>
          </Link>
        </div>

        {/* Bottom Glassmorphic Overlay Card */}
        <div className="relative z-10 max-w-lg space-y-6">
          <div className="rounded-3xl border border-white/15 bg-white/10 p-7 shadow-2xl backdrop-blur-md text-white">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-400/30 mb-3">
              <ShieldCheck className="h-3.5 w-3.5" />
              Rental Property Operating System
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold leading-tight text-white">
              Satu Platform untuk Seluruh Operasional Properti Anda
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-200">
              Otomatisasi tagihan sewa bulanan, pantau okupansi kamar secara real-time, dan kelola keuangan kos atau apartemen dengan tenang dan transparan.
            </p>

            {/* Social proof badge inside card */}
            <div className="mt-6 pt-5 border-t border-white/15 flex items-center justify-between">
              <div className="flex -space-x-2.5">
                <img
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-neutral-900 object-cover"
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop"
                  alt="Owner"
                />
                <img
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-neutral-900 object-cover"
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120&auto=format&fit=crop"
                  alt="Owner"
                />
                <img
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-neutral-900 object-cover"
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=120&auto=format&fit=crop"
                  alt="Owner"
                />
              </div>
              <span className="text-xs font-medium text-neutral-300">
                Dipercaya <strong className="text-white font-bold">500+ Pemilik Kos</strong> di Indonesia
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-neutral-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> WhatsApp Billing Otomatis
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Multi-Tenant Secured
            </span>
          </div>
        </div>
      </section>

      {/* ── RIGHT PANEL: Clean Modern Login Form ── */}
      <section className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Brand Link */}
          <div className="mb-8 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image src="/icon-aja.png" alt="Huni Link" width={30} height={30} className="rounded-md" />
              <span className="text-xl font-bold tracking-tight text-neutral-900">
                Huni<span className="text-[#0FA37F]">Link.</span>
              </span>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
              Masuk ke Akun Anda
            </h1>
            <p className="mt-2 text-sm text-neutral-500">
              Kelola properti, unit sewa, dan pantau keuangan kos Anda secara langsung.
            </p>
          </div>

          {/* Error Message Alert */}
          {error && (
            <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
                  Kata Sandi
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-[#0FA37F] hover:text-[#0b7e61] transition-colors"
                >
                  Lupa Kata Sandi?
                </Link>
              </div>
              <div className="relative flex items-center">
                <Lock className="pointer-events-none absolute left-3.5 h-4 w-4 text-neutral-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 rounded-xl border-neutral-200 bg-neutral-50/60 pl-10 pr-11 text-sm transition focus:bg-white focus-visible:border-[#0FA37F] focus-visible:ring-[#0FA37F]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute right-3.5 text-neutral-400 hover:text-neutral-700 transition"
                >
                  {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 text-xs text-neutral-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-neutral-300 text-[#0FA37F] accent-[#0FA37F] focus:ring-[#0FA37F]/20"
                />
                <span>Ingat saya di perangkat ini</span>
              </label>
            </div>

            <Button
              type="submit"
              className="h-12 w-full rounded-xl bg-neutral-900 text-sm font-semibold text-white shadow-sm hover:bg-[#0FA37F] transition-all duration-200 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Memproses..." : "Masuk ke Dashboard"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-7 flex items-center">
            <div className="flex-1 border-t border-neutral-200" />
            <span className="mx-3 text-xs text-neutral-400">Atau masuk sebagai</span>
            <div className="flex-1 border-t border-neutral-200" />
          </div>

          {/* Tenant Notice Box */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs text-neutral-700">
            <p className="font-bold text-neutral-900">Penyewa (Tenant)?</p>
            <p className="mt-1 leading-relaxed text-neutral-600">
              Akses portal penyewa dikirimkan melalui link aktivasi resmi oleh pemilik kost via WhatsApp atau email.
            </p>
          </div>

          {/* Register Link */}
          <p className="mt-8 text-center text-sm text-neutral-500">
            Belum memiliki akun Owner?{" "}
            <Link href="/register" className="font-semibold text-neutral-900 hover:text-[#0FA37F] transition-colors underline underline-offset-4">
              Daftar Gratis Sekarang
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
