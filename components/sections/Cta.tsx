"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function Cta() {
  return (
    <section id="cta" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <div className="relative overflow-hidden rounded-[36px] bg-neutral-900 px-8 py-16 sm:px-16 sm:py-20 text-center text-white shadow-xl">
          {/* Subtle radiant ambient glow inside card */}
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full opacity-30 blur-3xl"
            style={{
              background: "radial-gradient(circle, #10b981 0%, transparent 70%)",
            }}
          />
          <div
            className="pointer-events-none absolute -left-20 -bottom-20 h-96 w-96 rounded-full opacity-20 blur-3xl"
            style={{
              background: "radial-gradient(circle, #34d399 0%, transparent 70%)",
            }}
          />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              Siap Mengubah Cara Anda Mengelola Properti?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-neutral-300">
              Daftar dalam 2 menit. Mulai kelola unit, catat transaksi sewa, dan kirim tagihan WhatsApp otomatis secara gratis bersama Huni Link.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className="rounded-full bg-[#0FA37F] px-8 py-4 text-sm font-bold text-white shadow-sm hover:bg-[#0c8265] transition-all duration-200"
              >
                Mulai Uji Coba Gratis
              </Link>
              <Link
                href="#fitur"
                className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-800/80 px-6 py-4 text-sm font-semibold text-neutral-200 hover:bg-neutral-800 transition-all duration-200"
              >
                <span>Pelajari Selengkapnya</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Tanpa Kartu Kredit</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Setup Cepat 5 Menit</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Bebas Batalkan Kapan Saja</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
