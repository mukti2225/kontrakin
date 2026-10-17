"use client";

import { useState } from "react";
import {
  Wrench,
  AlertCircle,
  Clock,
  CheckCircle2,
  Send,
  MessageSquare,
  HelpCircle,
  Filter,
  Flame,
  Droplet,
  Zap,
  Building,
  Key,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { submitKeluhan } from "./action";

export interface TenantKeluhanDTO {
  id: string;
  judul: string;
  deskripsi: string;
  kategori: string;
  prioritas: "rendah" | "sedang" | "tinggi";
  status: "menunggu" | "diproses" | "selesai";
  tanggalDibuat: string;
  kamarNomor?: string;
}

interface TenantKeluhanClientProps {
  penghuniId: string;
  ownerId: string;
  kamarId: string;
  ownerPhone?: string;
  keluhanList: TenantKeluhanDTO[];
}

export function TenantKeluhanClient({
  penghuniId,
  ownerId,
  kamarId,
  ownerPhone = "628123456789",
  keluhanList,
}: TenantKeluhanClientProps) {
  const [filterStatus, setFilterStatus] = useState<"semua" | "menunggu" | "diproses" | "selesai">("semua");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredList = keluhanList.filter((k) => {
    if (filterStatus === "semua") return true;
    return k.status === filterStatus;
  });

  const handleUrgentWhatsApp = () => {
    const clean = ownerPhone.replace(/\D/g, "");
    const phone = clean.startsWith("0") ? "62" + clean.slice(1) : clean;
    const text = encodeURIComponent(
      `Halo Pengelola, saya memerlukan bantuan DARURAT/MENDESAK terkait fasilitas kamar. Mohon segera direspons.`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  };

  const getCategoryIcon = (kat: string) => {
    switch (kat) {
      case "Listrik":
        return <Zap className="size-4 text-amber-500" />;
      case "Air & Ledeng":
        return <Droplet className="size-4 text-blue-500" />;
      case "Bangunan":
        return <Building className="size-4 text-slate-500" />;
      case "Fasilitas":
        return <Key className="size-4 text-emerald-500" />;
      default:
        return <Wrench className="size-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 md:p-8 animate-in fade-in duration-300">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Keluhan &amp; Pemeliharaan Fasilitas
          </h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">
            Laporkan kendala fasilitas kamar atau properti. Pantau status penanganan teknisi secara transparan.
          </p>
        </div>

        {/* Emergency WhatsApp Quick Contact */}
        <Button
          variant="outline"
          onClick={handleUrgentWhatsApp}
          className="h-10 min-h-[40px] text-xs font-bold gap-1.5 border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100 rounded-xl"
        >
          <Flame className="size-4 text-rose-600" />
          <span>Keadaan Darurat? Hubungi WA</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Left Column: Form Pengajuan Baru (4 cols) ───────────────── */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/75 border-b border-slate-100 p-5">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="size-4 text-emerald-600" />
                Buat Laporan Keluhan Baru
              </CardTitle>
              <CardDescription className="text-xs">
                Sampaikan detail kerusakan agar pengelola segera menugaskan teknisi.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5">
              <form
                action={async (formData) => {
                  setIsSubmitting(true);
                  try {
                    await submitKeluhan(formData);
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className="space-y-4 text-xs"
              >
                <input type="hidden" name="penghuniId" value={penghuniId} />
                <input type="hidden" name="ownerId" value={ownerId} />
                <input type="hidden" name="kamarId" value={kamarId} />

                <div className="space-y-1.5">
                  <Label htmlFor="judul" className="font-semibold text-slate-700 text-xs">
                    Judul Masalah / Kerusakan *
                  </Label>
                  <Input
                    id="judul"
                    name="judul"
                    required
                    placeholder="Misal: Kran Wastafel Bocor, AC Tidak Dingin"
                    className="h-11 min-h-[44px] rounded-xl text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="kategori" className="font-semibold text-slate-700 text-xs">
                      Kategori Fasilitas *
                    </Label>
                    <select
                      id="kategori"
                      name="kategori"
                      required
                      className="flex h-11 min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    >
                      <option value="">Pilih Kategori</option>
                      <option value="Air & Ledeng">Air &amp; Ledeng</option>
                      <option value="Listrik">Listrik &amp; Lampu</option>
                      <option value="Bangunan">Dinding / Pintu / Atap</option>
                      <option value="Fasilitas">Perabot / Kasur / AC</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="prioritas" className="font-semibold text-slate-700 text-xs">
                      Tingkat Urgensi *
                    </Label>
                    <select
                      id="prioritas"
                      name="prioritas"
                      className="flex h-11 min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    >
                      <option value="sedang">Sedang (Standar)</option>
                      <option value="tinggi">Tinggi (Mendesak)</option>
                      <option value="rendah">Rendah (Dapat Menunggu)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="deskripsi" className="font-semibold text-slate-700 text-xs">
                    Uraian Detail Masalah *
                  </Label>
                  <Textarea
                    id="deskripsi"
                    name="deskripsi"
                    required
                    placeholder="Jelaskan kondisi kerusakan, sejak kapan terjadi, dan lokasi spesifik di dalam kamar..."
                    rows={4}
                    className="rounded-xl text-xs"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 min-h-[48px] rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs active:scale-[0.98] transition text-xs gap-2"
                >
                  <Send className="size-4" />
                  <span>{isSubmitting ? "Mengirim Laporan..." : "Kirim Laporan Kerusakan"}</span>
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column: Riwayat & Status Timeline (7 cols) ───────── */}
        <div className="lg:col-span-7 space-y-4">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
              <Filter className="size-3.5" />
              Filter:
            </span>
            {(["semua", "menunggu", "diproses", "selesai"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl font-semibold capitalize transition min-h-[36px] ${
                  filterStatus === st
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {st === "semua" ? `Semua (${keluhanList.length})` : st}
              </button>
            ))}
          </div>

          {filteredList.length === 0 ? (
            <Card className="border border-dashed border-slate-200 bg-white p-8 text-center rounded-2xl">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                <CheckCircle2 className="size-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Tidak Ada Laporan</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {filterStatus === "semua"
                  ? "Belum ada laporan keluhan yang diajukan. Semua fasilitas kamar dalam kondisi baik!"
                  : `Tidak ada tiket keluhan dengan status ${filterStatus}.`}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredList.map((ticket) => {
                const stepMenunggu = true;
                const stepDiproses = ticket.status === "diproses" || ticket.status === "selesai";
                const stepSelesai = ticket.status === "selesai";

                return (
                  <Card
                    key={ticket.id}
                    className="border border-slate-200/80 bg-white rounded-2xl shadow-xs overflow-hidden"
                  >
                    <div className="p-4 sm:p-5 space-y-4">
                      {/* Top Header Ticket */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900">{ticket.judul}</span>
                            <StatusBadge
                              variant={
                                ticket.status === "selesai"
                                  ? "emerald"
                                  : ticket.status === "diproses"
                                  ? "amber"
                                  : "rose"
                              }
                              dot
                            >
                              {ticket.status === "selesai"
                                ? "Selesai Diperbaiki"
                                : ticket.status === "diproses"
                                ? "Sedang Dikerjakan"
                                : "Menunggu Peninjauan"}
                            </StatusBadge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                              {getCategoryIcon(ticket.kategori)}
                              {ticket.kategori}
                            </span>
                            <span>•</span>
                            <span
                              className={`font-semibold ${
                                ticket.prioritas === "tinggi"
                                  ? "text-rose-600"
                                  : ticket.prioritas === "sedang"
                                  ? "text-amber-600"
                                  : "text-slate-500"
                              }`}
                            >
                              Prioritas: {ticket.prioritas}
                            </span>
                          </div>
                        </div>

                        <span className="text-[11px] font-mono text-slate-400 shrink-0">
                          {new Date(ticket.tanggalDibuat).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                        {ticket.deskripsi}
                      </p>

                      {/* ── Status Lifecycle Timeline ────────────────── */}
                      <div className="pt-2 border-t border-slate-100">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                          Linimasa Progres Penanganan
                        </p>

                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          {/* Step 1: Laporan Masuk */}
                          <div className="flex flex-col items-center">
                            <div
                              className={`size-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                stepMenunggu ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              <CheckCircle2 className="size-4" />
                            </div>
                            <span className="text-[11px] font-bold text-slate-800 mt-1">Diterima</span>
                            <span className="text-[10px] text-slate-400">Laporan Tercatat</span>
                          </div>

                          {/* Step 2: Sedang Diproses */}
                          <div className="flex flex-col items-center">
                            <div
                              className={`size-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                stepDiproses
                                  ? "bg-amber-500 text-white"
                                  : "bg-slate-100 text-slate-400 border border-slate-200"
                              }`}
                            >
                              <Clock className="size-4" />
                            </div>
                            <span
                              className={`text-[11px] font-bold mt-1 ${
                                stepDiproses ? "text-amber-800" : "text-slate-400"
                              }`}
                            >
                              Diproses
                            </span>
                            <span className="text-[10px] text-slate-400">Teknisi Bertugas</span>
                          </div>

                          {/* Step 3: Selesai */}
                          <div className="flex flex-col items-center">
                            <div
                              className={`size-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                stepSelesai
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-100 text-slate-400 border border-slate-200"
                              }`}
                            >
                              <CheckCircle2 className="size-4" />
                            </div>
                            <span
                              className={`text-[11px] font-bold mt-1 ${
                                stepSelesai ? "text-emerald-800" : "text-slate-400"
                              }`}
                            >
                              Selesai
                            </span>
                            <span className="text-[10px] text-slate-400">Terverifikasi</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
