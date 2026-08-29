"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
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
        setError(signInError.message || "Gagal masuk. Periksa kembali email dan password Anda.");
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
    <main className="min-h-screen bg-[#f7f9fc]">
      <div className="flex min-h-screen">
        <section className="relative hidden min-h-screen w-1/2 overflow-hidden bg-[#f1f4f3] lg:block">
          <img src="https://www.figma.com/api/mcp/asset/cc3d5184-2bef-4111-b68d-5281b0351fc9.png" alt="Interior properti Huni Link" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#004d4d]/80 via-[#004d4d]/35 to-[#004d4d]/20" />
          <Link href="/" className="absolute left-8 top-8 z-10 flex items-center gap-2 text-2xl font-bold text-white">
            <span className="flex size-10 items-center justify-center rounded-xl bg-white text-[#006060] shadow-md">▦</span>
            Huni Link
          </Link>
          <div className="absolute bottom-12 left-12 z-10 max-w-md text-white">
            <h2 className="text-3xl font-bold leading-10">Kelola Properti Anda dengan Mudah</h2>
            <p className="mt-4 text-base leading-6 text-white/90">Huni Link memberikan solusi komprehensif untuk manajemen kost dan apartemen modern.</p>
          </div>
        </section>

        <section className="flex w-full items-center justify-center bg-white px-6 py-12 lg:w-1/2 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-3xl font-bold leading-10 text-[#181c1c]">Selamat Datang Kembali</h1>
              <p className="mt-2 text-sm text-[#3e4948]">Silakan masukkan detail akun Anda untuk melanjutkan.</p>
            </div>

            {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700">{error}</div>}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium tracking-wide text-[#181c1c]">
                  Alamat Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 rounded-xl border-[#bec9c8] bg-[#f7faf9] px-4 text-sm placeholder:text-[#bec9c8] focus-visible:border-[#004d4d] focus-visible:ring-[#004d4d]/20"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="password" className="text-xs font-medium tracking-wide text-[#181c1c]">
                    Password
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 rounded-xl border-[#bec9c8] bg-[#f7faf9] px-4 pr-11 text-sm placeholder:text-[#bec9c8] focus-visible:border-[#004d4d] focus-visible:ring-[#004d4d]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#87918f] hover:text-[#004d4d]"
                  >
                    {showPassword ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </button>
                </div>
                <Link href="/forgot-password" className="text-xs font-medium tracking-wide text-[#004d4d] hover:underline">
                  Lupa Password?
                </Link>
              </div>

              <label className="flex items-center gap-2 text-sm text-[#3e4948]">
                <input type="checkbox" className="size-4 rounded border-[#bec9c8] accent-[#004d4d]" /> Ingat saya
              </label>
              <Button type="submit" className="h-11 w-full rounded-xl bg-[#004d4d] text-base font-semibold text-white shadow-sm hover:bg-[#003b3b]" disabled={loading}>
                {loading ? "Memproses..." : "Masuk"}
              </Button>
            </form>

            <div className="my-7 flex items-center gap-3 text-sm text-[#3e4948]">
              <span className="h-px flex-1 bg-[#bec9c8]/50" />
              <span>Atau lanjutkan dengan</span>
              <span className="h-px flex-1 bg-[#bec9c8]/50" />
            </div>
            <button type="button" className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#bec9c8] bg-white text-sm text-[#181c1c] shadow-sm transition hover:border-[#004d4d] hover:bg-[#f7faf9]">
              <span className="font-bold text-[#4285f4]">G</span> Google
            </button>
            <p className="mt-6 text-center text-sm text-[#3e4948]">
              Belum punya akun?{" "}
              <Link href="/register" className="font-medium text-[#004d4d] hover:underline">
                Daftar Sekarang
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
