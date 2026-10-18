"use client";

import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, User, Mail, Lock, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { signUpOwner } from "@/lib/auth/client";
import { useRouter } from "next/navigation";

// ─── Reusable styled input with leading icon ──────────────────────────────────
function IconInput({
  id,
  type,
  placeholder,
  value,
  onChange,
  required,
  icon: Icon,
  trailing,
}: {
  id: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  icon: React.ElementType;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="relative flex items-center">
      <Icon className="pointer-events-none absolute left-3.5 h-4 w-4 text-neutral-400" />
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-xl border border-neutral-200 bg-neutral-50/60 py-3 pl-10 pr-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-[#0FA37F] focus:outline-none focus:ring-2 focus:ring-[#0FA37F]/20 transition"
      />
      {trailing && <div className="absolute right-3.5">{trailing}</div>}
    </div>
  );
}

// ─── Main Register Page ────────────────────────────────────────────────────────
export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!agreedToTerms) {
      setError("Harap setujui Syarat & Ketentuan terlebih dahulu.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Kata sandi dan Konfirmasi Kata Sandi tidak cocok.");
      return;
    }

    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }

    setLoading(true);

    try {
      const { error: signUpError } = await signUpOwner({
        email,
        password,
        name,
      });

      if (signUpError) {
        setError(signUpError.message || "Gagal membuat akun. Silakan coba lagi.");
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
      {/* ── LEFT PANEL: High-Resolution Architectural Visual Showcase ── */}
      <section className="relative hidden w-1/2 overflow-hidden bg-neutral-900 lg:flex lg:flex-col lg:justify-between p-12">
        {/* Real High-Resolution Property Exterior / Architecture */}
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1400&auto=format&fit=crop"
          alt="Arsitektur Properti Huni Link"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-70"
        />

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/45 to-neutral-950/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/60 to-transparent" />

        {/* Top Header Brand */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Image src="/icon-aja.png" alt="Huni Link" width={32} height={32} className="rounded-lg shadow-md" />
            <span className="text-2xl font-bold tracking-tight text-white">
              Huni<span className="text-[#0FA37F]">Link.</span>
            </span>
          </Link>
        </div>

        {/* Bottom Glassmorphic Card */}
        <div className="relative z-10 max-w-lg space-y-6">
          <div className="rounded-3xl border border-white/15 bg-white/10 p-7 shadow-2xl backdrop-blur-md text-white">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-400/30 mb-3">
              <ShieldCheck className="h-3.5 w-3.5" />
              Sistem Operasional Rental Properti
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold leading-tight text-white">
              Kelola Kos & Properti Lebih Rapi, Cepat, dan Menguntungkan
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-200">
              Bergabung bersama ratusan pemilik dan manajer properti di Indonesia yang telah meninggalkan pencatatan manual dan beralih ke Huni Link.
            </p>

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
                Dipercaya <strong className="text-white font-bold">500+ Pemilik Properti</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-neutral-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Tanpa Biaya Tersembunyi
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Siap Pakai 5 Menit
            </span>
          </div>
        </div>
      </section>

      {/* ── RIGHT PANEL: Registration Form ── */}
      <section className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 overflow-y-auto">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Brand Link */}
          <div className="mb-6 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image src="/icon-aja.png" alt="Huni Link" width={30} height={30} className="rounded-md" />
              <span className="text-xl font-bold tracking-tight text-neutral-900">
                Huni<span className="text-[#0FA37F]">Link.</span>
              </span>
            </Link>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
              Daftar Akun Pemilik (Owner)
            </h1>
            <p className="mt-1.5 text-sm text-neutral-500">
              Buat workspace Anda dan mulai kelola kamar kos, unit kontrakan, dan keuangan hari ini.
            </p>
          </div>

          {/* Tenant Notice Box */}
          <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs text-neutral-700">
            <p className="font-bold text-neutral-900">Penyewa (Tenant)?</p>
            <p className="mt-0.5 leading-relaxed text-neutral-600">
              Akses Tenant Portal diberikan via link aktivasi WhatsApp oleh pemilik properti. Jika sudah punya akses, silakan{" "}
              <Link href="/login" className="font-semibold text-neutral-900 underline underline-offset-2 hover:text-[#0FA37F]">
                Masuk di sini
              </Link>.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Nama Lengkap */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-neutral-700">
                Nama Lengkap
              </label>
              <IconInput
                id="name"
                type="text"
                placeholder="Nama Anda atau Nama Usaha"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                icon={User}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-neutral-700">
                Alamat Email
              </label>
              <IconInput
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                icon={Mail}
              />
            </div>

            {/* Kata Sandi */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-neutral-700">
                Kata Sandi
              </label>
              <IconInput
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimal 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                icon={Lock}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-neutral-400 hover:text-neutral-700 transition"
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  >
                    {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                }
              />
            </div>

            {/* Konfirmasi Kata Sandi */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-neutral-700">
                Konfirmasi Kata Sandi
              </label>
              <IconInput
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Ulangi kata sandi"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                icon={Lock}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="text-neutral-400 hover:text-neutral-700 transition"
                    aria-label="Toggle konfirmasi kata sandi"
                  >
                    {showConfirmPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                }
              />
            </div>

            {/* Terms Checkbox */}
            <label className="flex cursor-pointer items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 cursor-pointer rounded border-neutral-300 text-[#0FA37F] accent-[#0FA37F]"
              />
              <span className="text-xs text-neutral-600 leading-normal">
                Saya menyetujui{" "}
                <Link href="/terms" className="font-semibold text-neutral-900 underline underline-offset-2 hover:text-[#0FA37F]">
                  Syarat &amp; Ketentuan
                </Link>{" "}
                serta{" "}
                <Link href="/privacy" className="font-semibold text-neutral-900 underline underline-offset-2 hover:text-[#0FA37F]">
                  Kebijakan Privasi
                </Link>{" "}
                Huni Link.
              </span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-3 w-full rounded-xl bg-neutral-900 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0FA37F] active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? "Membuat Akun..." : "Daftar Gratis Sekarang"}
            </button>
          </form>

          {/* Login Link */}
          <p className="mt-7 text-center text-sm text-neutral-500">
            Sudah memiliki akun?{" "}
            <Link href="/login" className="font-semibold text-neutral-900 hover:text-[#0FA37F] transition-colors underline underline-offset-4">
              Masuk di sini
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
