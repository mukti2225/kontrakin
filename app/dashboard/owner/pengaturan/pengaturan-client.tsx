"use client";

import { useState, useTransition } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, Check, User, Shield, KeyRound, Sparkles } from "lucide-react";
import { updateProfileName } from "./action";

interface PengaturanClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    role?: string | null;
  };
  kode: string;
}

export function PengaturanClient({ user, kode }: PengaturanClientProps) {
  const [name, setName] = useState(user.name);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(kode);
      setCopied(true);
      toast.success("Kode undangan berhasil disalin!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin kode");
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama lengkap tidak boleh kosong");
      return;
    }

    startTransition(async () => {
      try {
        await updateProfileName(name);
        toast.success("Profil berhasil diperbarui!");
      } catch (err: any) {
        toast.error(err.message || "Gagal memperbarui profil");
      }
    });
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pengaturan Akun</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Kelola profil pengguna, kredensial, dan preferensi portal workspace Anda.
        </p>
      </div>

      <Tabs defaultValue="profil" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="profil" className="rounded-lg text-xs font-semibold px-4 py-2">
            Profil Pengguna
          </TabsTrigger>
          <TabsTrigger value="preferensi" className="rounded-lg text-xs font-semibold px-4 py-2">
            Akses Portal Tenant
          </TabsTrigger>
          <TabsTrigger value="keamanan" className="rounded-lg text-xs font-semibold px-4 py-2">
            Keamanan
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Profil */}
        <TabsContent value="profil">
          <Card className="border border-slate-200/80 bg-white shadow-xs">
            <form onSubmit={handleSaveProfile}>
              <CardHeader>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <User className="size-4 text-emerald-600" />
                  Informasi Profil
                </CardTitle>
                <CardDescription className="text-xs">
                  Perbarui nama lengkap yang ditampilkan pada kwitansi, kontrak, dan pesan komunikasi ke penyewa.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold text-slate-700">Nama Lengkap</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="max-w-md text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-700">Alamat Email</Label>
                  <Input
                    id="email"
                    value={user.email}
                    disabled
                    className="max-w-md text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-slate-400">
                    Email terhubung dengan kredensial autentikasi utama sistem.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="border-t border-slate-100 pt-4">
                <Button
                  type="submit"
                  disabled={isPending || name === user.name}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs"
                >
                  {isPending ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Tab 2: Akses Portal Tenant */}
        <TabsContent value="preferensi">
          <Card className="border border-slate-200/80 bg-white shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="size-4 text-emerald-600" />
                Akses Portal Tenant (Frictionless Onboarding)
              </CardTitle>
              <CardDescription className="text-xs">
                Sistem Kontrakin kini menggunakan <strong>Tautan Akses Aman &amp; OTP WhatsApp</strong> langsung tanpa mewajibkan penyewa menyalin kode undangan manual.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-2 text-xs">
                <p className="font-bold text-emerald-950">✨ Alur Onboarding Otomatis:</p>
                <ol className="list-decimal list-inside space-y-1 text-emerald-800 text-[11px] leading-relaxed">
                  <li>Buat data penyewa di menu <strong>Data Penyewa</strong> atau buat <strong>Kontrak Sewa</strong>.</li>
                  <li>Sistem akan langsung mengirimkan tautan aktivasi mandiri ke nomor WhatsApp penyewa.</li>
                  <li>Penyewa cukup mengklik tautan, memasukkan kode OTP 6-digit, dan langsung masuk ke Portal Tenant.</li>
                </ol>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <p className="text-xs font-semibold text-slate-700">
                  Kode Undangan Workspace Anda (Kompatibilitas Metode Manual):
                </p>
                <div className="flex items-center gap-3">
                  <div className="font-mono text-xl font-extrabold tracking-widest text-slate-800 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                    {kode}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyCode}
                    className="gap-1.5 text-xs font-semibold rounded-xl border-slate-200"
                  >
                    {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                    {copied ? "Tersalin!" : "Salin Kode"}
                  </Button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Gunakan kode ini hanya jika penyewa mendaftar akun secara manual sebelum Anda menempatkannya ke kamar.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Keamanan */}
        <TabsContent value="keamanan">
          <Card className="border border-slate-200/80 bg-white shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="size-4 text-emerald-600" />
                Keamanan &amp; Autentikasi
              </CardTitle>
              <CardDescription className="text-xs">
                Informasi keamanan akun dan manajemen kata sandi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-slate-600">
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="flex items-center gap-2 text-slate-800 font-semibold mb-1">
                  <Shield className="size-4 text-emerald-600" />
                  Sesi Login Terverifikasi
                </div>
                <p>Akun Anda terlindungi dengan standar keamanan session Better-Auth dengan enkripsi token.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
