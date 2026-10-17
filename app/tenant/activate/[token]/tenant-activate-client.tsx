"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Building,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  Clock,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { requestOtpAction, verifyOtpAndLoginAction } from "./action";

interface TenantActivateClientProps {
  token: string;
  tenant: {
    id: string;
    nama: string;
    maskedPhone: string;
    maskedEmail: string | null;
    kamarNomor: string;
    propertiNama: string;
    organizationName: string;
    expiresAt: Date;
  };
}

export function TenantActivateClient({ token, tenant }: TenantActivateClientProps) {
  const router = useRouter();
  const [step, setStep] = useState<"READY" | "OTP_SENT" | "SUCCESS">("READY");
  const [otpCode, setOtpCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [devMockOtp, setDevMockOtp] = useState<string | null>(null);

  // Countdown timer for OTP resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Request OTP handler
  function handleRequestOtp() {
    setErrorMsg("");
    startTransition(async () => {
      try {
        const res = await requestOtpAction(token);
        setStep("OTP_SENT");
        setCooldown(res.cooldownSeconds || 60);
        if (res.mockOtp) {
          setDevMockOtp(res.mockOtp);
        }
        toast.success(`Kode OTP telah dikirimkan ke WhatsApp ${tenant.maskedPhone}`);
      } catch (err: any) {
        setErrorMsg(err.message || "Gagal mengirimkan kode OTP");
        toast.error(err.message || "Gagal meminta OTP");
      }
    });
  }

  // Verify OTP & Login handler
  function handleVerifyOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setErrorMsg("Masukkan 6 digit kode OTP yang dikirimkan.");
      return;
    }

    if (password && password.length < 6) {
      setErrorMsg("Password minimal 6 karakter jika ingin membuat password.");
      return;
    }

    setErrorMsg("");
    startTransition(async () => {
      try {
        const res = await verifyOtpAndLoginAction({
          rawToken: token,
          otpCode: otpCode.trim(),
          password: password.trim() || undefined,
        });

        setStep("SUCCESS");
        toast.success(`Selamat datang, ${res.tenantName}! Akun Anda telah aktif.`);

        // Redirect after brief celebration
        setTimeout(() => {
          router.push(res.redirectUrl);
          router.refresh();
        }, 1200);
      } catch (err: any) {
        setErrorMsg(err.message || "Verifikasi kode OTP gagal.");
        toast.error(err.message || "Verifikasi gagal");
      }
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm shadow-emerald-200">
            <Building className="size-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Kontrakin — Portal Tenant
          </h1>
          <p className="text-xs text-slate-500">
            Aktivasi Mandiri Akses Sewa, Kontrak &amp; Tagihan Digital
          </p>
        </div>

        {/* Main Card */}
        <Card className="border border-slate-200/90 bg-white shadow-sm rounded-2xl overflow-hidden">
          {/* Card Header & Property Context */}
          <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Unit Sewa Anda
                </p>
                <CardTitle className="text-base font-bold text-slate-900">
                  {tenant.propertiNama}
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-slate-600">
                  Kamar / Unit: <span className="text-emerald-700 font-bold">{tenant.kamarNomor}</span>
                </CardDescription>
              </div>
              <div className="size-10 rounded-xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center font-bold text-sm">
                {tenant.nama
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-5">
            {errorMsg && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="size-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* STEP 1: WELCOME & REQUEST OTP */}
            {step === "READY" && (
              <div className="space-y-4">
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                    <span>Verifikasi Identitas Penyewa</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    Halo, {tenant.nama}!
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Pengelola properti telah mendaftarkan Anda. Untuk melindungi privasi dan data sewa Anda, kami akan mengirimkan kode OTP satu kali ke nomor WhatsApp Anda:
                  </p>
                  <div className="pt-1 flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      {tenant.maskedPhone}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleRequestOtp}
                  disabled={isPending}
                  className="w-full h-12 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-xs transition"
                >
                  {isPending ? (
                    <RefreshCw className="mr-2 size-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 size-4" />
                  )}
                  {isPending ? "Mengirim Kode OTP..." : "Kirim Kode OTP via WhatsApp"}
                </Button>
              </div>
            )}

            {/* STEP 2: ENTER OTP & OPTIONAL PASSWORD */}
            {step === "OTP_SENT" && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2 text-center pb-1">
                  <p className="text-xs text-slate-500">
                    Masukkan 6 digit kode OTP yang dikirimkan ke:
                  </p>
                  <p className="font-mono text-sm font-bold text-slate-800">
                    {tenant.maskedPhone}
                  </p>
                  {devMockOtp && (
                    <div className="text-[11px] font-mono text-emerald-700 bg-emerald-50 p-1.5 rounded-lg border border-emerald-200 inline-block">
                      Kode OTP (Dev Mode): <strong>{devMockOtp}</strong>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="otp" className="text-xs font-semibold text-slate-700">
                    Kode Verifikasi OTP *
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="h-12 min-h-[44px] text-center font-mono text-2xl tracking-[0.35em] font-extrabold rounded-xl border-slate-300 focus:border-emerald-600 focus:ring-emerald-600/20"
                    autoFocus
                  />
                  <p className="text-[11px] text-slate-400 text-center">
                    Kode berlaku selama 5 menit.
                  </p>
                </div>

                {/* Optional Password Field */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                      Buat Password Login (Opsional)
                    </Label>
                    <span className="text-[10px] text-slate-400">Minimal 6 karakter</span>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Password untuk login nanti"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-10 text-xs rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Bila diisi, Anda dapat login menggunakan nomor HP/email dan password ini.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isPending || otpCode.length !== 6}
                  className="w-full h-12 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-xs transition"
                >
                  {isPending ? (
                    <RefreshCw className="mr-2 size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 size-4" />
                  )}
                  {isPending ? "Memverifikasi..." : "Verifikasi & Buka Portal"}
                </Button>

                {/* Resend OTP Button */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    disabled={cooldown > 0 || isPending}
                    onClick={handleRequestOtp}
                    className="text-xs font-semibold text-emerald-700 hover:underline disabled:opacity-50 disabled:no-underline"
                  >
                    {cooldown > 0 ? (
                      <span className="inline-flex items-center gap-1 text-slate-400">
                        <Clock className="size-3" /> Kirim ulang kode dalam {cooldown}s
                      </span>
                    ) : (
                      "Tidak menerima kode? Kirim ulang"
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: SUCCESS STATE */}
            {step === "SUCCESS" && (
              <div className="py-6 text-center space-y-3 animate-in zoom-in-95 duration-300">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="size-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Aktivasi Berhasil!
                </h3>
                <p className="text-xs text-slate-600 max-w-xs mx-auto">
                  Akun Anda telah terhubung dengan unit <strong>Kamar {tenant.kamarNomor}</strong> di {tenant.propertiNama}.
                </p>
                <div className="pt-2 flex items-center justify-center gap-2 text-xs text-emerald-700 font-semibold">
                  <RefreshCw className="size-3.5 animate-spin" />
                  <span>Membuka Tenant Portal Anda...</span>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="bg-slate-50/60 border-t border-slate-100 p-4 text-center justify-center">
            <p className="text-[11px] text-slate-400">
              Butuh bantuan? Hubungi pengelola {tenant.organizationName}.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
