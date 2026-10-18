"use client";

import { Zap, Globe, MessageSquare, Check, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import Image from "next/image";

export default function Features() {
  return (
    <section id="fitur" className="bg-[#FAFAF9] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 leading-tight">
            Integrasi Lengkap untuk Kontrol <br />
            Pembayaran & Operasional
          </h2>
          <p className="mt-4 text-base text-neutral-500">
            Satu ekosistem operasional yang menyederhanakan pencatatan sewa, penagihan rutin, hingga rekonsiliasi finansial properti Anda.
          </p>
        </div>

        {/* 3 Top Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="group rounded-[28px] border border-neutral-200/80 bg-white p-8 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-800 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="mt-8 text-xl font-bold tracking-tight text-neutral-900">
              Percepat Arus Kas & Transaksi
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-neutral-500">
              Proses pencatatan sewa real-time tanpa rekonsiliasi manual. Terima notifikasi instan saat penyewa melunasi tagihan kamar.
            </p>
          </div>

          {/* Card 2: Special middle card with soft green gradient wash background, matching reference! */}
          <div className="group relative overflow-hidden rounded-[28px] border border-emerald-200/70 bg-gradient-to-b from-[#e8f7f2] via-[#e2f5ee] to-[#d6f2e7] p-8 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-xs">
              <Globe className="h-5 w-5" />
            </div>
            <h3 className="mt-8 text-xl font-bold tracking-tight text-neutral-900">
              Jangkauan Multi-Properti
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">
              Kelola puluhan kost, paviliun, ruko, dan apartemen dari satu platform tersentralisasi dengan kontrol hak akses staf yang fleksibel.
            </p>
          </div>

          {/* Card 3 */}
          <div className="group rounded-[28px] border border-neutral-200/80 bg-white p-8 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-800 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h3 className="mt-8 text-xl font-bold tracking-tight text-neutral-900">
              Pengingat Otomatis WhatsApp
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-neutral-500">
              Invoice dan pengingat jatuh tempo otomatis terkirim langsung ke nomor WhatsApp penyewa lengkap dengan rincian dan barcode QRIS.
            </p>
          </div>
        </div>

        {/* Bottom Split Feature Cards */}
        <div id="integrasi" className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left card with lifestyle photo & badge */}
          <div className="relative overflow-hidden rounded-[28px] border border-neutral-200/80 bg-neutral-900 lg:col-span-5 min-h-[360px] group">
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop"
              alt="Property Manager"
              className="absolute inset-0 h-full w-full object-cover object-center opacity-85 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/20 to-transparent" />

            <div className="relative z-10 flex h-full flex-col justify-between p-8">
              <span className="self-start rounded-full bg-white/90 px-3.5 py-1 text-xs font-semibold text-neutral-900 shadow-sm backdrop-blur-md">
                Masa depan sewa properti
              </span>
              <div>
                <p className="text-xl font-bold text-white leading-snug">
                  "Huni Link memangkas 90% waktu saya untuk menagih sewa dan mengecek mutasi bank setiap bulan."
                </p>
                <p className="mt-2 text-xs text-neutral-300">
                  Rini Sulistyo — Pengelola 3 Kost Eksklusif (Jakarta Selatan)
                </p>
              </div>
            </div>
          </div>

          {/* Right card: Preparing your future / Operational Peace */}
          <div className="rounded-[28px] border border-neutral-200/80 bg-white p-8 lg:p-10 lg:col-span-7 flex flex-col justify-between shadow-sm">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3.5 py-1 text-xs font-semibold text-neutral-700 mb-4">
                <Sparkles className="h-3.5 w-3.5 text-[#0FA37F]" />
                Operasional Tanpa Hambatan
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                Pencatatan Finansial Akurat & Bebas Selisih
              </h3>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-neutral-500">
                Huni Link menggunakan sistem alokasi pembayaran bertingkat. Mendukung pembayaran sebagian, pelunasan bertahap, uang jaminan (deposit), hingga pengembalian saldo secara terstruktur.
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="flex items-center gap-2.5 text-sm text-neutral-700">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shrink-0">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                  <span>Alokasi pembayaran multi-invoice</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-neutral-700">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shrink-0">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                  <span>Isolasi data organisasi multi-tenant</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-neutral-700">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shrink-0">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                  <span>Audit trail riwayat transaksi lengkap</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-neutral-700">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shrink-0">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                  <span>Dukungan cetak kuitansi resmi PDF</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-neutral-100 flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-400">
                Dapat diakses melalui Desktop, Tablet, dan Smartphone
              </span>
              <a
                href="/register"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-900 hover:text-[#0FA37F] transition-colors"
              >
                <span>Coba Sekarang</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
