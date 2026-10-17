"use client";

import { useState, useTransition } from "react";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Shield,
  Search,
  Lock,
  Edit3,
  X,
  CreditCard,
  Building,
  Wrench,
  Receipt,
  MessageSquare,
  Sliders,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  addStaffMember,
  updateStaffRole,
  removeStaffMember,
  type TeamMemberDTO,
} from "./action";
import type { OrganizationRole } from "@/lib/auth/permissions";

interface TimClientProps {
  initialMembers: TeamMemberDTO[];
}

export function TimClient({ initialMembers }: TimClientProps) {
  const [members, setMembers] = useState<TeamMemberDTO[]>(initialMembers);
  const [activeTab, setActiveTab] = useState<"members" | "matrix">("members");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("semua");

  // Invite modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrganizationRole>("staff");

  // Edit role modal state
  const [editingMember, setEditingMember] = useState<TeamMemberDTO | null>(null);
  const [editRole, setEditRole] = useState<OrganizationRole>("staff");

  // Delete modal state
  const [deletingMember, setDeletingMember] = useState<TeamMemberDTO | null>(null);

  const [isPending, startTransition] = useTransition();

  // Filtered members list
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "semua" ? true : m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const ownersCount = members.filter((m) => m.role === "owner").length;
  const adminManagerCount = members.filter((m) => m.role === "admin" || m.role === "manager").length;
  const financeCount = members.filter((m) => m.role === "finance").length;
  const staffViewerCount = members.filter((m) => m.role === "staff" || m.role === "viewer").length;

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Nama dan email wajib diisi");
      return;
    }

    startTransition(async () => {
      try {
        const newMember = await addStaffMember({ name, email, role: inviteRole });
        setMembers((prev) => [
          ...prev,
          {
            id: newMember.id,
            userId: newMember.userId,
            name: newMember.user.name,
            email: newMember.user.email,
            role: newMember.role as OrganizationRole,
            status: "aktif",
            joinedAt: newMember.createdAt.toISOString(),
            permissionsCount: inviteRole === "owner" ? 20 : inviteRole === "admin" ? 15 : 8,
          },
        ]);
        toast.success(`Berhasil menambahkan ${name} sebagai ${inviteRole}`);
        setIsAddOpen(false);
        setName("");
        setEmail("");
        setInviteRole("staff");
      } catch (err: any) {
        toast.error(err.message || "Gagal menambahkan anggota tim");
      }
    });
  };

  const handleOpenEditRole = (member: TeamMemberDTO) => {
    setEditingMember(member);
    setEditRole(member.role);
  };

  const handleSaveEditRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    startTransition(async () => {
      try {
        await updateStaffRole(editingMember.id, editRole);
        setMembers((prev) =>
          prev.map((m) => (m.id === editingMember.id ? { ...m, role: editRole } : m))
        );
        toast.success(`Peran ${editingMember.name} berhasil diubah menjadi ${editRole}`);
        setEditingMember(null);
      } catch (err: any) {
        toast.error(err.message || "Gagal memperbarui peran anggota");
      }
    });
  };

  const handleConfirmRemove = () => {
    if (!deletingMember) return;

    startTransition(async () => {
      try {
        await removeStaffMember(deletingMember.id);
        setMembers((prev) => prev.filter((m) => m.id !== deletingMember.id));
        toast.success(`Akses ${deletingMember.name} telah berhasil dicabut.`);
        setDeletingMember(null);
      } catch (err: any) {
        toast.error(err.message || "Gagal mencabut akses anggota");
      }
    });
  };

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-0.5 text-xs font-bold text-teal-800 border border-teal-200">
              <Users className="size-3.5 text-teal-600" />
              Owner &amp; Team Workspace
            </span>
            <span className="text-xs text-slate-500 font-medium">Manajemen Otorisasi &amp; Delegasi</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Tim Operasional &amp; Hak Akses Staf
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola delegasi operasional properti kepada tim lapangan dan keuangan dengan batasan akses yang terisolasi aman.
          </p>
        </div>

        <div>
          <Button
            onClick={() => setIsAddOpen(true)}
            className="h-11 min-h-[44px] gap-2 bg-emerald-600 hover:bg-emerald-700 font-bold text-white rounded-xl shadow-xs active:scale-[0.98] text-xs"
          >
            <UserPlus className="size-4" />
            <span>Tambah Anggota Staf</span>
          </Button>
        </div>
      </div>

      {/* ── 4 KPI Action Center Cards ───────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Tim</p>
            <div className="flex size-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Users className="size-4.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{members.length}</p>
          <p className="mt-1 text-[11px] text-slate-400">Pengguna terafiliasi workspace</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pemilik Utama (Owner)</p>
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="size-4.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-700">{ownersCount}</p>
          <p className="mt-1 text-[11px] text-emerald-600 font-medium">Akses tak terbatas &amp; terlindungi</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Manajer &amp; Admin</p>
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Briefcase className="size-4.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-blue-700">{adminManagerCount}</p>
          <p className="mt-1 text-[11px] text-slate-400">Pengelola kontrak &amp; kamar</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Keuangan &amp; Lapangan</p>
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <CreditCard className="size-4.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-700">{financeCount + staffViewerCount}</p>
          <p className="mt-1 text-[11px] text-slate-400">
            {financeCount} Keuangan • {staffViewerCount} Staf Lapangan
          </p>
        </div>
      </div>

      {/* ── Tab Switcher ────────────────────────────────────────────── */}
      <div className="flex rounded-2xl border border-slate-200 bg-slate-100 p-1 text-xs font-bold">
        <button
          onClick={() => setActiveTab("members")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 px-3 min-h-[40px] transition-all ${
            activeTab === "members"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Users className="size-4 text-emerald-600" />
          <span>Daftar Anggota Tim ({members.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("matrix")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 px-3 min-h-[40px] transition-all ${
            activeTab === "matrix"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Sliders className="size-4 text-teal-600" />
          <span>Matriks Izin &amp; Batasan Akses Fitur</span>
        </button>
      </div>

      {/* ── TAB 1: Daftar Anggota Tim ─────────────────────────────────── */}
      {activeTab === "members" && (
        <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/75 border-b border-slate-100 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Daftar Staf &amp; Pengguna Aktif
              </CardTitle>
              <CardDescription className="text-xs">
                Anggota yang memiliki kredensial resmi untuk mengakses modul operasional properti ini.
              </CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Role filter */}
              <div className="flex items-center gap-1 rounded-xl bg-slate-200/60 p-1 text-xs">
                {(["semua", "owner", "manager", "finance", "staff"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-2.5 py-1 rounded-lg font-bold capitalize transition ${
                      roleFilter === r
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {r === "semua" ? "Semua" : r}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Cari nama / email anggota..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full sm:w-56 pl-9 text-xs rounded-xl"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5">Nama &amp; Email Anggota</th>
                    <th className="px-5 py-3.5 text-center">Peran (Role)</th>
                    <th className="px-5 py-3.5 text-center">Cakupan Izin</th>
                    <th className="px-5 py-3.5 text-center">Bergabung</th>
                    <th className="px-5 py-3.5 text-right">Aksi &amp; Keamanan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-xs text-slate-400">
                        Tidak ada anggota tim yang cocok dengan kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((m) => {
                      const isOwner = m.role === "owner";
                      const isManager = m.role === "manager";
                      const isFinance = m.role === "finance";
                      const isStaff = m.role === "staff";

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-black uppercase ${
                                  isOwner
                                    ? "bg-emerald-100 text-emerald-800"
                                    : isFinance
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {m.name.slice(0, 2)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-sm">{m.name}</p>
                                <p className="text-[11px] text-slate-500 font-mono">{m.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-center">
                            <StatusBadge
                              variant={
                                isOwner
                                  ? "emerald"
                                  : isManager
                                  ? "blue"
                                  : isFinance
                                  ? "amber"
                                  : "slate"
                              }
                              dot
                            >
                              {m.role.toUpperCase()}
                            </StatusBadge>
                          </td>

                          <td className="px-5 py-4 text-center">
                            <span className="font-bold text-slate-800">
                              {isOwner ? "Akses Penuh (Full)" : `${m.permissionsCount} Fitur Diizinkan`}
                            </span>
                            <p className="text-[10px] text-slate-400">
                              {isOwner ? "Semua Modul Terbuka" : "Dibatasi Sesuai Role"}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-center text-slate-500">
                            {new Date(m.joinedAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>

                          <td className="px-5 py-4 text-right">
                            {isOwner ? (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 font-semibold text-[11px]">
                                <Lock className="size-3 text-slate-400" />
                                <span>Pemilik Utama (Terkunci)</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenEditRole(m)}
                                  className="h-8 text-xs font-semibold gap-1 rounded-xl border-slate-200 hover:bg-slate-50"
                                >
                                  <Edit3 className="size-3 text-slate-600" />
                                  <span>Ubah Peran</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setDeletingMember(m)}
                                  className="h-8 text-xs font-semibold gap-1 text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl"
                                >
                                  <Trash2 className="size-3" />
                                  <span>Hapus</span>
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── TAB 2: Matriks Izin & Batasan Akses Fitur ────────────────── */}
      {activeTab === "matrix" && (
        <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl overflow-hidden space-y-4">
          <CardHeader className="bg-slate-50/75 border-b border-slate-100 p-5">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="size-4 text-teal-600" />
              Matriks Hak Akses &amp; Pembatasan Fitur Peran
            </CardTitle>
            <CardDescription className="text-xs">
              Rincian kapabilitas yang diberikan kepada masing-masing peran staf dalam sistem operasional rental.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5">Modul &amp; Kapabilitas Fitur</th>
                    <th className="px-4 py-3.5 text-center font-bold text-emerald-800">Owner</th>
                    <th className="px-4 py-3.5 text-center font-bold text-slate-700">Admin</th>
                    <th className="px-4 py-3.5 text-center font-bold text-blue-700">Manager</th>
                    <th className="px-4 py-3.5 text-center font-bold text-amber-700">Finance</th>
                    <th className="px-4 py-3.5 text-center font-bold text-slate-600">Staff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Row 1: Properti & Kamar */}
                  <tr className="hover:bg-slate-50/60">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">Properti &amp; Kamar</p>
                      <p className="text-[11px] text-slate-400">Tambah gedung, edit tarif kamar, dan status kosong/terisi</p>
                    </td>
                    <td className="px-4 py-3.5 text-center text-emerald-600 font-bold">Penuh</td>
                    <td className="px-4 py-3.5 text-center text-emerald-600 font-bold">Penuh</td>
                    <td className="px-4 py-3.5 text-center text-blue-600 font-medium">Edit Kamar</td>
                    <td className="px-4 py-3.5 text-center text-slate-400">Lihat Saja</td>
                    <td className="px-4 py-3.5 text-center text-slate-400">Lihat Saja</td>
                  </tr>

                  {/* Row 2: Penyewa & Kontrak */}
                  <tr className="hover:bg-slate-50/60">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">Penyewa &amp; Kontrak Sewa</p>
                      <p className="text-[11px] text-slate-400">Input data penyewa, aktivasi sewa, perpanjangan masa sewa</p>
                    </td>
                    <td className="px-4 py-3.5 text-center text-emerald-600 font-bold">Penuh</td>
                    <td className="px-4 py-3.5 text-center text-emerald-600 font-bold">Penuh</td>
                    <td className="px-4 py-3.5 text-center text-blue-600 font-medium">Penuh</td>
                    <td className="px-4 py-3.5 text-center text-slate-400">Lihat Saja</td>
                    <td className="px-4 py-3.5 text-center text-slate-400">Lihat Saja</td>
                  </tr>

                  {/* Row 3: Keuangan, Tagihan & Kwitansi */}
                  <tr className="hover:bg-slate-50/60">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">Keuangan, Invoice &amp; Kwitansi</p>
                      <p className="text-[11px] text-slate-400">Penerbitan tagihan sewa, verifikasi pembayaran, &amp; cetak kwitansi</p>
                    </td>
                    <td className="px-4 py-3.5 text-center text-emerald-600 font-bold">Penuh</td>
                    <td className="px-4 py-3.5 text-center text-emerald-600 font-bold">Penuh</td>
                    <td className="px-4 py-3.5 text-center text-blue-600 font-medium">Buat Invoice</td>
                    <td className="px-4 py-3.5 text-center text-emerald-600 font-bold">Penuh</td>
                    <td className="px-4 py-3.5 text-center text-rose-500 font-bold">Dibatasi</td>
                  </tr>

                  {/* Row 4: Pengeluaran Kas & Rekonsiliasi */}
                  <tr className="hover:bg-slate-50/60">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">Buku Kas &amp; Pengeluaran Operasional</p>
                      <p className="text-[11px] text-slate-400">Pencatatan pengeluaran, deteksi kebocoran kas, dan laba rugi</p>
                    </td>
                    <td className="px-4 py-3.5 text-center text-emerald-600 font-bold">Penuh</td>
                    <td className="px-4 py-3.5 text-center text-emerald-600 font-bold">Penuh</td>
                    <td className="px-4 py-3.5 text-center text-slate-400">Lihat Saja</td>
                    <td className="px-4 py-3.5 text-center text-emerald-600 font-bold">Penuh</td>
                    <td className="px-4 py-3.5 text-center text-rose-500 font-bold">Dibatasi</td>
                  </tr>

                  {/* Row 5: Pemeliharaan & Vendor */}
                  <tr className="hover:bg-slate-50/60">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">Pemeliharaan &amp; Rekanan Vendor</p>
                      <p className="text-[11px] text-slate-400">Lapor keluhan, penugasan teknisi, SPK, dan direktori vendor</p>
                    </td>
                    <td className="px-4 py-3.5 text-center text-emerald-600 font-bold">Penuh</td>
                    <td className="px-4 py-3.5 text-center text-emerald-600 font-bold">Penuh</td>
                    <td className="px-4 py-3.5 text-center text-blue-600 font-medium">Penuh</td>
                    <td className="px-4 py-3.5 text-center text-slate-400">Lihat Saja</td>
                    <td className="px-4 py-3.5 text-center text-emerald-600 font-bold">Update Tiket</td>
                  </tr>

                  {/* Row 6: Tim & Pengaturan Workspace */}
                  <tr className="hover:bg-slate-50/60 bg-slate-50/40">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">Manajemen Tim &amp; Hak Akses</p>
                      <p className="text-[11px] text-slate-400">Mengundang staf, mengubah peran anggota, dan langganan paket</p>
                    </td>
                    <td className="px-4 py-3.5 text-center text-emerald-600 font-bold">Penuh</td>
                    <td className="px-4 py-3.5 text-center text-slate-700 font-medium">Undang Staf</td>
                    <td className="px-4 py-3.5 text-center text-rose-500 font-bold">Dibatasi</td>
                    <td className="px-4 py-3.5 text-center text-rose-500 font-bold">Dibatasi</td>
                    <td className="px-4 py-3.5 text-center text-rose-500 font-bold">Dibatasi</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Security Guarantee Banner */}
            <div className="p-4 bg-teal-50 border-t border-teal-100 flex items-start gap-3">
              <ShieldCheck className="size-5 text-teal-700 shrink-0 mt-0.5" />
              <div className="text-xs text-teal-950">
                <p className="font-bold text-teal-900">Jaminan Keamanan Berbasis Otorisasi Server (RBAC)</p>
                <p className="mt-0.5 leading-relaxed">
                  Semua pembatasan hak akses di atas dieksekusi secara ketat pada server action backend melalui fungsi verifikasi otorisasi organisasi. Sistem tidak mengandalkan penyembunyian antarmuka (UI hiding) sebagai pagar keamanan data Anda.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Dialog 1: Tambah Anggota Staf Baru ────────────────────────── */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <form onSubmit={handleAddMember}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="size-4 text-emerald-600" />
                Undang Anggota Tim Baru
              </DialogTitle>
              <DialogDescription className="text-xs">
                Berikan akses operasional dengan peran dan batasan yang terukur.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Nama Lengkap Staf *</label>
                <Input
                  placeholder="Misal: Budi Santoso"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Alamat Email Login *</label>
                <Input
                  type="email"
                  placeholder="budi@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Pilih Peran / Level Akses *</label>
                <Select value={inviteRole} onValueChange={(val) => setInviteRole((val as any) || "staff")}>
                  <SelectTrigger className="h-10 text-xs rounded-xl">
                    <SelectValue placeholder="Pilih Peran" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl text-xs">
                    <SelectItem value="staff">Staff (Operasional Lapangan &amp; Pemeliharaan)</SelectItem>
                    <SelectItem value="manager">Manager (Pengelola Kamar &amp; Kontrak)</SelectItem>
                    <SelectItem value="finance">Finance (Verifikasi Tagihan &amp; Kas)</SelectItem>
                    <SelectItem value="admin">Admin (Asisten Pemilik &amp; Manajemen Penuh)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                disabled={isPending}
                className="h-10 text-xs font-semibold rounded-xl"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="h-10 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
              >
                {isPending ? "Menyimpan..." : "Tambahkan Staf"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog 2: Ubah Peran Anggota Staf ─────────────────────────── */}
      {editingMember && (
        <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
          <DialogContent className="sm:max-w-md rounded-3xl p-6">
            <form onSubmit={handleSaveEditRole}>
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Edit3 className="size-4 text-teal-600" />
                  Ubah Peran Anggota Tim
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Perbarui wewenang akses untuk <span className="font-bold text-slate-800">{editingMember.name}</span>.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4 text-xs">
                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Anggota Terpilih</span>
                  <p className="font-bold text-slate-800 text-sm">{editingMember.name}</p>
                  <p className="text-slate-500 font-mono text-[11px]">{editingMember.email}</p>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Peran Baru</label>
                  <Select value={editRole} onValueChange={(val) => setEditRole((val as any) || "staff")}>
                    <SelectTrigger className="h-10 text-xs rounded-xl">
                      <SelectValue placeholder="Pilih Peran Baru" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl text-xs">
                      <SelectItem value="staff">Staff (Operasional Lapangan &amp; Pemeliharaan)</SelectItem>
                      <SelectItem value="manager">Manager (Pengelola Kamar &amp; Kontrak)</SelectItem>
                      <SelectItem value="finance">Finance (Verifikasi Tagihan &amp; Kas)</SelectItem>
                      <SelectItem value="admin">Admin (Manajemen Operasional Penuh)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingMember(null)}
                  disabled={isPending}
                  className="h-10 text-xs font-semibold rounded-xl"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="h-10 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs"
                >
                  {isPending ? "Menyimpan..." : "Simpan Perubahan Peran"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Dialog 3: Konfirmasi Hapus Anggota Tim ────────────────────── */}
      {deletingMember && (
        <Dialog open={!!deletingMember} onOpenChange={() => setDeletingMember(null)}>
          <DialogContent className="sm:max-w-md rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-rose-950 flex items-center gap-2">
                <AlertCircle className="size-4 text-rose-600" />
                Cabut Akses Anggota Tim?
              </DialogTitle>
              <DialogDescription className="text-xs">
                Apakah Anda yakin ingin mencabut akses <span className="font-bold text-slate-900">{deletingMember.name}</span> ({deletingMember.email}) dari tim workspace ini?
              </DialogDescription>
            </DialogHeader>

            <div className="py-2 text-xs text-slate-600 bg-rose-50/70 p-3.5 rounded-xl border border-rose-200">
              <p className="font-semibold text-rose-900 mb-1">Konsekuensi:</p>
              <p className="leading-relaxed">
                Pengguna ini tidak akan dapat lagi melihat data properti, kamar, penyewa, atau catatan keuangan organisasi Anda. Tindakan ini akan dicatat dalam audit log.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeletingMember(null)}
                disabled={isPending}
                className="h-10 text-xs font-semibold rounded-xl"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleConfirmRemove}
                disabled={isPending}
                className="h-10 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs"
              >
                {isPending ? "Menghapus..." : "Ya, Cabut Akses"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
