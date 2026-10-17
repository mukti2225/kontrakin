"use client";

import { useState, useTransition } from "react";
import {
  User,
  Shield,
  HelpCircle,
  Home,
  Phone,
  Mail,
  Key,
  Calendar,
  CheckCircle2,
  Save,
  MessageSquare,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/client";
import { updateTenantProfile } from "./action";

export interface TenantProfileDTO {
  user: {
    id: string;
    name: string;
    email: string;
  };
  penghuni?: {
    id: string;
    nama: string;
    noHp: string;
    tanggalMasuk: string;
    status: string;
  } | null;
  kamar?: {
    nomor: string;
    tipe: string;
    propertiNama: string;
    propertiAlamat: string;
    ownerName: string;
    ownerPhone?: string;
  } | null;
}

interface TenantPengaturanClientProps {
  data: TenantProfileDTO;
}

export function TenantPengaturanClient({ data }: TenantPengaturanClientProps) {
  const [activeTab, setActiveTab] = useState<"profil" | "keamanan" | "bantuan">("profil");
  const [isPending, startTransition] = useTransition();

  // Profile Form state
  const [nama, setNama] = useState(data.penghuni?.nama || data.user.name || "");
  const [noHp, setNoHp] = useState(data.penghuni?.noHp || "");

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      toast.error("Nama lengkap tidak boleh kosong");
      return;
    }
    if (!noHp.trim()) {
      toast.error("Nomor WhatsApp wajib diisi");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("nama", nama.trim());
        formData.append("noHp", noHp.trim());
        await updateTenantProfile(formData);
        toast.success("Profil Anda berhasil diperbarui!");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal memperbarui profil");
      }
    });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Masukkan kata sandi saat ini");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Kata sandi baru minimal 8 karakter");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi kata sandi baru tidak cocok");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (res.error) {
        toast.error(res.error.message || "Gagal mengubah kata sandi");
      } else {
        toast.success("Kata sandi berhasil diubah!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      toast.error("Terjadi kesalahan saat memperbarui kata sandi");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleChatOwner = () => {
    const raw = data.kamar?.ownerPhone || "628123456789";
    const clean = raw.replace(/\D/g, "");
    const phone = clean.startsWith("0") ? "62" + clean.slice(1) : clean;
    const text = encodeURIComponent(
      `Halo Pengelola ${data.kamar?.propertiNama || "Kos"}, saya ${nama} dari Kamar ${data.kamar?.nomor || "-"}. Saya ingin menanyakan informasi terkait sewa.`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Pengaturan Akun &amp; Profil
        </h1>
        <p className="text-slate-500 mt-1 text-xs sm:text-sm">
          Kelola informasi identitas penyewa, keamanan kata sandi, dan kontak darurat Anda.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab("profil")}
          className={`flex items-center gap-2 pb-3 pt-1 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap min-h-[44px] ${
            activeTab === "profil"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <User className="size-4" />
          <span>Profil Penyewa</span>
        </button>

        <button
          onClick={() => setActiveTab("keamanan")}
          className={`flex items-center gap-2 pb-3 pt-1 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap min-h-[44px] ${
            activeTab === "keamanan"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Shield className="size-4" />
          <span>Keamanan Kata Sandi</span>
        </button>

        <button
          onClick={() => setActiveTab("bantuan")}
          className={`flex items-center gap-2 pb-3 pt-1 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap min-h-[44px] ${
            activeTab === "bantuan"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <HelpCircle className="size-4" />
          <span>Bantuan &amp; Kontak Pengelola</span>
        </button>
      </div>

      {/* ── Tab Content: Profil ───────────────────────────────────────── */}
      {activeTab === "profil" && (
        <div className="space-y-6">
          <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/75 border-b border-slate-100 p-5">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="size-4 text-emerald-600" />
                Data Pribadi Penyewa
              </CardTitle>
              <CardDescription className="text-xs">
                Perubahan data akan otomatis disinkronkan ke kontrak dan sistem komunikasi pengelola.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleUpdateProfile}>
              <CardContent className="p-5 space-y-4 text-xs">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="nama" className="font-semibold text-slate-700">
                      Nama Lengkap *
                    </Label>
                    <Input
                      id="nama"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      required
                      className="h-11 min-h-[44px] rounded-xl text-xs"
                      placeholder="Nama lengkap Anda"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="noHp" className="font-semibold text-slate-700">
                      Nomor WhatsApp Aktif *
                    </Label>
                    <Input
                      id="noHp"
                      value={noHp}
                      onChange={(e) => setNoHp(e.target.value)}
                      required
                      className="h-11 min-h-[44px] rounded-xl text-xs"
                      placeholder="08xxxxxxxxxx"
                    />
                    <p className="text-[11px] text-slate-400">
                      Digunakan pengelola untuk mengirim pengingat invoice &amp; konfirmasi pemeliharaan.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="font-semibold text-slate-700">
                    Alamat Email (Akun Login)
                  </Label>
                  <Input
                    id="email"
                    value={data.user.email}
                    disabled
                    className="h-11 min-h-[44px] rounded-xl text-xs bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-slate-400">
                    Email ini terikat dengan akun login utama Anda dan tidak dapat diubah sembarangan.
                  </p>
                </div>
              </CardContent>

              <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-4 sm:p-5 flex justify-end">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="h-11 min-h-[44px] text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                >
                  <Save className="size-4" />
                  <span>{isPending ? "Menyimpan..." : "Simpan Perubahan Profil"}</span>
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Unit Info summary card */}
          {data.kamar && (
            <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl p-5 space-y-3">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Home className="size-4 text-emerald-600" />
                Penempatan Unit Kamar Saat Ini
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block font-medium">Unit Kamar</span>
                  <span className="font-bold text-slate-900 mt-0.5 block text-sm">
                    Kamar {data.kamar.nomor}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Tipe Kamar</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {data.kamar.tipe}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Properti</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block truncate">
                    {data.kamar.propertiNama}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Mulai Menempati</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {data.penghuni?.tanggalMasuk
                      ? new Date(data.penghuni.tanggalMasuk).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── Tab Content: Keamanan ─────────────────────────────────────── */}
      {activeTab === "keamanan" && (
        <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/75 border-b border-slate-100 p-5">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lock className="size-4 text-emerald-600" />
              Perbarui Kata Sandi Akun
            </CardTitle>
            <CardDescription className="text-xs">
              Gunakan kombinasi minimal 8 karakter demi keamanan data sewa dan transaksi Anda.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleChangePassword}>
            <CardContent className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="currPass" className="font-semibold text-slate-700">
                  Kata Sandi Saat Ini *
                </Label>
                <Input
                  id="currPass"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="h-11 min-h-[44px] rounded-xl text-xs"
                  placeholder="Masukkan kata sandi lama"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="newPass" className="font-semibold text-slate-700">
                    Kata Sandi Baru *
                  </Label>
                  <Input
                    id="newPass"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="h-11 min-h-[44px] rounded-xl text-xs"
                    placeholder="Minimal 8 karakter"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPass" className="font-semibold text-slate-700">
                    Konfirmasi Kata Sandi Baru *
                  </Label>
                  <Input
                    id="confirmPass"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-11 min-h-[44px] rounded-xl text-xs"
                    placeholder="Ulangi kata sandi baru"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-4 sm:p-5 flex justify-end">
              <Button
                type="submit"
                disabled={isChangingPassword}
                className="h-11 min-h-[44px] text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
              >
                <Key className="size-4" />
                <span>{isChangingPassword ? "Memperbarui..." : "Perbarui Kata Sandi"}</span>
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* ── Tab Content: Bantuan ──────────────────────────────────────── */}
      {activeTab === "bantuan" && (
        <div className="space-y-6 text-xs">
          <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Kontak Langsung Pengelola Kos</h2>
                <p className="text-slate-500 text-xs mt-0.5">
                  {data.kamar?.ownerName || "Pengelola Properti"} • {data.kamar?.propertiNama}
                </p>
              </div>

              <Button
                onClick={handleChatOwner}
                className="h-11 min-h-[44px] text-xs font-bold gap-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs"
              >
                <MessageSquare className="size-4" />
                <span>Chat Pengelola via WhatsApp</span>
              </Button>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Pertanyaan yang Sering Diajukan (FAQ)
              </h3>

              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-1">
                <p className="font-bold text-slate-900">Kapan tagihan sewa bulanan diterbitkan?</p>
                <p className="text-slate-600 leading-relaxed">
                  Tagihan sewa diterbitkan otomatis oleh sistem setiap awal periode sesuai tanggal penagihan kontrak Anda. Anda dapat melihat tagihan aktif di menu Tagihan.
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-1">
                <p className="font-bold text-slate-900">Bagaimana cara mendapatkan kwitansi pembayaran resmi?</p>
                <p className="text-slate-600 leading-relaxed">
                  Setelah tagihan Anda lunas terverifikasi, Anda dapat mengklik tombol &quot;Lihat Kwitansi&quot; pada menu Tagihan kapan saja dan mencetaknya dalam format PDF.
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-1">
                <p className="font-bold text-slate-900">Fasilitas kamar mengalami kerusakan, apa yang harus dilakukan?</p>
                <p className="text-slate-600 leading-relaxed">
                  Buka menu Keluhan dan kirim laporan kerusakan lengkap dengan kategori dan uraian detail. Pengelola akan menugaskan teknisi dan status tiket dapat Anda pantau secara langsung.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
