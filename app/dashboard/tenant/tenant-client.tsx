"use client";

import Link from "next/link";
import {
  Home,
  Receipt,
  FileText,
  Wrench,
  AlertCircle,
  CheckCircle2,
  Calendar,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  Clock,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatRupiah } from "@/lib/utils";
import type { TenantDashboardDTO } from "./action";

interface TenantClientProps {
  data: TenantDashboardDTO;
}

export function TenantClient({ data }: TenantClientProps) {
  if (!data.isAssigned) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <AlertCircle className="size-8" />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          Selamat Datang, {data.tenantName}!
        </h1>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          Akun Anda saat ini belum ditautkan ke kamar atau properti aktif.
          Silakan hubungi pemilik / pengelola kos Anda dan sampaikan alamat email ini:{" "}
          <span className="font-semibold text-slate-800">{data.tenantEmail}</span> untuk mengaktifkan kontrak sewa Anda.
        </p>
      </div>
    );
  }

  const { unit, activeLease, currentBill, recentPayments, recentMaintenance } = data;

  const handleChatPengelola = () => {
    const cleanPhone = (data.ownerContact?.phone || "").replace(/\D/g, "");
    const phone = cleanPhone ? (cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone) : "628123456789";
    const text = encodeURIComponent(
      `Halo Pengelola ${unit?.propertiNama || "Kos"}, saya ${data.tenantName} dari Kamar ${unit?.nomor || "-"}. Saya ingin bertanya mengenai informasi sewa.`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 pb-24 sm:pb-8 sm:px-6">
      {/* ── Mobile-first Welcome & Unit Banner ──────────────────────── */}
      <div className="rounded-3xl border border-emerald-950/20 bg-emerald-900 p-6 text-white shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-800/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-200 border border-emerald-700/50">
                <Home className="size-3" />
                Penyewa Aktif
              </span>
              <span className="text-xs font-medium text-emerald-200">
                Kamar {unit?.nomor} ({unit?.tipe})
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Halo, {data.tenantName}
            </h1>
            <p className="text-xs text-emerald-200/90 mt-1 flex items-center gap-1">
              <span>{unit?.propertiNama}</span>
              <span>•</span>
              <span className="truncate">{unit?.propertiAlamat}</span>
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-xs text-left sm:text-right border border-white/10">
            <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-200">Tarif Sewa</p>
            <p className="text-2xl font-black text-white">{formatRupiah(unit?.hargaBulanan || 0)}</p>
            <p className="text-[11px] text-emerald-200/80">per bulan</p>
          </div>
        </div>
      </div>

      {/* ── Primary Hero Action: Current Bill ───────────────────────── */}
      {currentBill ? (
        <div
          className={`rounded-3xl border p-5 sm:p-6 shadow-xs transition-all ${
            currentBill.isOverdue
              ? "border-rose-200 bg-rose-50/70"
              : "border-amber-200 bg-amber-50/60"
          }`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <StatusBadge
                  variant={currentBill.isOverdue ? "rose" : "amber"}
                  icon={currentBill.isOverdue ? "alert" : "clock"}
                >
                  {currentBill.isOverdue ? "Tagihan Melewati Jatuh Tempo" : "Tagihan Menunggu Pembayaran"}
                </StatusBadge>
                <span className="text-xs font-mono font-medium text-slate-500">#{currentBill.invoiceNumber}</span>
              </div>
              <p className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                {formatRupiah(currentBill.balanceDue)}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Jatuh Tempo:{" "}
                <span className="font-bold text-slate-900">
                  {new Date(currentBill.dueDate).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </p>
            </div>

            <div className="w-full sm:w-auto">
              <Link href="/dashboard/tenant/tagihan">
                <Button className="w-full sm:w-auto h-12 min-h-[48px] gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 shadow-sm active:scale-[0.98]">
                  <CreditCard className="size-4.5" />
                  <span>Bayar Sekarang</span>
                  <ArrowRight className="size-4.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="size-6" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-emerald-950">Semua Tagihan Lunas!</h2>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Tidak ada tagihan tertunggak saat ini. Pembayaran sewa Anda tercatat tertib.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/tenant/tagihan"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-50 active:scale-[0.98] min-h-[44px]"
            >
              <Receipt className="size-4" />
              <span>Lihat Kwitansi</span>
            </Link>
          </div>
        </div>
      )}

      {/* ── Quick Actions Grid (Touch-friendly 4-grid) ─────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/dashboard/tenant/tagihan"
          className="flex min-h-[88px] flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-3.5 text-center shadow-xs hover:border-emerald-300 hover:bg-emerald-50/20 active:scale-[0.98] transition-all"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Receipt className="size-5" />
          </div>
          <span className="mt-2 text-xs font-bold text-slate-800">Tagihan & Kwitansi</span>
        </Link>

        <Link
          href="/dashboard/tenant/keluhan"
          className="flex min-h-[88px] flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-3.5 text-center shadow-xs hover:border-amber-300 hover:bg-amber-50/20 active:scale-[0.98] transition-all"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Wrench className="size-5" />
          </div>
          <span className="mt-2 text-xs font-bold text-slate-800">Lapor Kerusakan</span>
        </Link>

        <Link
          href="/dashboard/tenant/kontrak"
          className="flex min-h-[88px] flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-3.5 text-center shadow-xs hover:border-blue-300 hover:bg-blue-50/20 active:scale-[0.98] transition-all"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FileText className="size-5" />
          </div>
          <span className="mt-2 text-xs font-bold text-slate-800">Kontrak Sewa</span>
        </Link>

        <button
          onClick={handleChatPengelola}
          className="flex min-h-[88px] flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-3.5 text-center shadow-xs hover:border-teal-300 hover:bg-teal-50/20 active:scale-[0.98] transition-all"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <MessageSquare className="size-5" />
          </div>
          <span className="mt-2 text-xs font-bold text-slate-800">Chat Pengelola</span>
        </button>
      </div>

      {/* ── Lease & Unit Info ───────────────────────────────────────── */}
      {activeLease && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Ringkasan Kontrak Sewa</h2>
            </div>
            <StatusBadge variant="emerald" dot>
              {activeLease.status === "active" ? "Aktif" : activeLease.status}
            </StatusBadge>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3 text-xs">
            <div>
              <p className="text-slate-400 font-medium">Periode Sewa</p>
              <p className="mt-1 font-semibold text-slate-800">
                {new Date(activeLease.startDate).toLocaleDateString("id-ID", {
                  month: "short",
                  year: "numeric",
                })}{" "}
                -{" "}
                {new Date(activeLease.endDate).toLocaleDateString("id-ID", {
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>

            <div>
              <p className="text-slate-400 font-medium">Uang Jaminan (Deposit)</p>
              <p className="mt-1 font-semibold text-slate-800">
                {formatRupiah(activeLease.depositAmount)}
              </p>
            </div>

            <div>
              <p className="text-slate-400 font-medium">Jatuh Tempo Pembayaran</p>
              <p className="mt-1 font-semibold text-slate-800">
                Setiap tanggal {activeLease.billingDay} tiap bulan
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Maintenance & Complaints Status ─────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900">Status Laporan Keluhan &amp; Perbaikan</h2>
          <Link
            href="/dashboard/tenant/keluhan"
            className="inline-flex min-h-[38px] items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 active:scale-[0.98] transition"
          >
            <span>Lapor Baru</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {recentMaintenance.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">
            Belum ada laporan keluhan yang diajukan. Fasilitas kamar dalam kondisi prima!
          </p>
        ) : (
          <div className="mt-3 divide-y divide-slate-100">
            {recentMaintenance.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-xs font-bold text-slate-900">{p.judul}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Kategori: {p.kategori} •{" "}
                    {new Date(p.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
                <div>
                  <StatusBadge
                    variant={p.status === "selesai" ? "emerald" : p.status === "diproses" ? "amber" : "rose"}
                    dot
                  >
                    {p.status}
                  </StatusBadge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Recent Payments ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900">Riwayat Pembayaran Terakhir</h2>
          <Link
            href="/dashboard/tenant/tagihan"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>Semua Riwayat</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>

        {recentPayments.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">
            Belum ada riwayat pembayaran yang tercatat.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-slate-100">
            {recentPayments.map((pay) => (
              <div key={pay.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-xs font-bold text-slate-900">Tagihan #{pay.invoiceNumber}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Dibayar pada{" "}
                    {new Date(pay.paidAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-emerald-600">{formatRupiah(pay.amount)}</p>
                  <StatusBadge variant="emerald" className="mt-0.5 text-[10px] py-0 px-1.5 font-bold">
                    Lunas
                  </StatusBadge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Help / Contact Property Manager ───────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <MessageSquare className="size-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">Perlu Bantuan Pengelola?</p>
            <p className="text-[11px] text-slate-500">
              Hubungi pengelola via WhatsApp untuk pertanyaan sewa, aturan kos, atau koordinasi fasilitas.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleChatPengelola}
          className="w-full sm:w-auto min-h-[44px] gap-1.5 border-emerald-200 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 shrink-0 active:scale-[0.98]"
        >
          <MessageSquare className="size-4" />
          <span>Chat Pengelola</span>
        </Button>
      </div>
    </div>
  );
}
