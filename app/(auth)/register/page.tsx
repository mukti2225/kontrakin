"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  Globe,
  Apple,
} from "lucide-react";
import { useState } from "react";
import { signUpWithRegistrationRole, type RegistrationRole } from "@/lib/auth/client";
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
      <Icon className="pointer-events-none absolute left-3 h-4 w-4 text-gray-400" />
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1a6b5a] focus:outline-none focus:ring-2 focus:ring-[#1a6b5a]/20 transition"
      />
      {trailing && (
        <div className="absolute right-3">{trailing}</div>
      )}
    </div>
  );
}

// ─── Avatar stack placeholder ─────────────────────────────────────────────────
function AvatarStack() {
  const colors = ["bg-emerald-400", "bg-teal-500", "bg-cyan-400"];
  return (
    <div className="flex -space-x-2">
      {colors.map((c, i) => (
        <span
          key={i}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/60 ${c} text-xs font-bold text-white`}
        >
          {String.fromCharCode(65 + i)}
        </span>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [registrationRole, setRegistrationRole] = useState<RegistrationRole>("tenant");
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
      setError("Password dan Confirm Password tidak cocok.");
      return;
    }

    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    setLoading(true);

    try {
      const { error: signUpError } = await signUpWithRegistrationRole({
        email,
        password,
        name,
        registrationRole,
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
      {/* ── LEFT PANEL: decorative hero ───────────────────────────── */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden rounded-r-3xl">
        {/* Teal-to-dark gradient background simulating property image */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d4f42] via-[#1a7a65] to-[#0a3530]" />

        {/* Subtle grid / texture overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(255,255,255,.15) 39px,rgba(255,255,255,.15) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(255,255,255,.15) 39px,rgba(255,255,255,.15) 40px)",
          }}
        />

        {/* Decorative blurred circles simulating bokeh/building */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 h-72 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-40 right-8 h-48 w-48 rounded-full bg-emerald-400/20 blur-2xl" />
        <div className="absolute bottom-10 left-8 h-32 w-32 rounded-full bg-teal-300/20 blur-2xl" />

        {/* Building silhouette decoration */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 flex gap-2 opacity-20">
          {[60, 100, 140, 100, 60].map((h, i) => (
            <div
              key={i}
              className="w-6 rounded-t-sm bg-white"
              style={{ height: `${h}px` }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 p-8">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <Image src="/icon-aja.png" alt="Kontrakin" width={28} height={28} className="drop-shadow" />
            <span className="text-lg font-semibold text-white">Kontrakin</span>
          </div>
        </div>

        <div className="relative z-10 px-10 pb-4">
          <h2 className="text-3xl font-bold leading-tight text-white">
            Mulai Kelola Properti
            <br />
            Anda
            <br />
            dengan Lebih Mudah
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Bergabunglah dengan ribuan pemilik properti yang telah
            mempercayakan manajemen kos dan apartemen mereka kepada Kontrakin.
            Terintegrasi, aman, dan efisien.
          </p>
        </div>

        {/* Footer trust badge */}
        <div className="relative z-10 flex items-center gap-3 px-10 py-8">
          <AvatarStack />
          <p className="text-sm text-white/80">
            Dipercaya oleh <strong className="text-white">5.000+</strong> pemilik properti
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL: form ──────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 sm:px-12">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <Image src="/icon-aja.png" alt="Kontrakin" width={28} height={28} />
            <span className="text-lg font-semibold text-[#1a6b5a]">Kontrakin</span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-gray-900">Daftar Akun Baru</h1>
          <p className="mt-1 text-sm text-gray-500">
            Lengkapi data diri Anda untuk memulai perjalanan mengelola properti dengan cerdas.
          </p>

          {/* Role switcher */}
          <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
            {(["tenant", "owner"] as RegistrationRole[]).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setRegistrationRole(role)}
                className={`rounded-lg py-2 text-sm font-medium transition-all ${
                  registrationRole === role
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {role === "tenant" ? "Penghuni" : "Pemilik Kost"}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-gray-400">
            {registrationRole === "tenant"
              ? "Akun akan dibuat sebagai penghuni kontrakan."
              : "Akun akan dibuat sebagai pemilik kost dan diberi akses sesuai peran."}
          </p>

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} className="mt-5 space-y-4">
            {/* Nama */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nama Lengkap
              </label>
              <IconInput
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                icon={User}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
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

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
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
                    className="text-gray-400 hover:text-gray-600 transition"
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  >
                    {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                }
              />
              <p className="text-xs text-gray-400">Gunakan kombinasi huruf, angka, dan simbol.</p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Konfirmasi Kata Sandi
              </label>
              <IconInput
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Ulangi kata sandi"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                icon={Lock}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-gray-400 hover:text-gray-600 transition"
                    aria-label="Toggle konfirmasi kata sandi"
                  >
                    {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                }
              />
            </div>

            {/* Terms checkbox */}
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 cursor-pointer rounded border-gray-300 accent-[#1a6b5a]"
              />
              <span className="text-sm text-gray-600">
                Saya setuju dengan{" "}
                <Link href="/terms" className="font-medium text-[#1a6b5a] underline underline-offset-2">
                  Syarat &amp; Ketentuan
                </Link>{" "}
                dan{" "}
                <Link href="/privacy" className="font-medium text-[#1a6b5a] underline underline-offset-2">
                  Kebijakan Privasi.
                </Link>
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-lg bg-[#1a6b5a] py-3 text-sm font-semibold text-white transition hover:bg-[#155a4a] active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? "Memproses..." : "Daftar Sekarang"}
            </button>
          </form>

          {/* Login link */}
          <p className="mt-5 text-center text-sm text-gray-500">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-semibold text-[#1a6b5a] hover:underline">
              Masuk
            </Link>
          </p>

          {/* Divider */}
          <div className="relative my-5 flex items-center">
            <div className="flex-1 border-t border-gray-200" />
            <span className="mx-3 text-xs text-gray-400">Atau daftar dengan</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          {/* Social buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-[0.98]"
            >
              <Globe className="h-4 w-4 text-[#4285F4]" />
              Google
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-[0.98]"
            >
              <Apple className="h-4 w-4 text-gray-900" />
              Apple
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
