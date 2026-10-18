"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, TrendingUp } from "lucide-react";
import DirectionalFloatCard from "@/components/ui/DirectionalFloatCard";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-10 pb-16 sm:pt-14 sm:pb-24">
      {/* Radiant ambient glow in upper-right quadrant matching reference */}
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-[580px] w-[580px] rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(110, 231, 183, 0.45) 0%, rgba(52, 211, 153, 0.25) 40%, rgba(16, 185, 129, 0.05) 70%, transparent 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute right-1/4 top-1/3 h-[420px] w-[420px] rounded-full opacity-40 blur-2xl"
        style={{
          background: "radial-gradient(circle, rgba(167, 243, 208, 0.4) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Headline, CTAs, Social Proof */}
          <div className="lg:col-span-6 xl:col-span-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 leading-[1.15]">
              Reimagine rental,
              <br />
              <span className="text-neutral-900 font-bold">Simple solutions</span>
            </h1>

            <p className="mt-6 max-w-lg text-base sm:text-lg leading-relaxed text-neutral-500">
              Otomatisasi tagihan sewa, pantau pengeluaran properti secara real-time, dan capai efisiensi operasional kos terbaik Anda bersama Huni Link.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <Link
                href="/register"
                className="rounded-xl bg-neutral-900 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0FA37F] transition-all duration-200"
              >
                Mulai Gratis
              </Link>
              <Link
                href="#fitur"
                className="group flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-5 py-3.5 text-sm font-semibold text-neutral-800 hover:border-neutral-400 hover:bg-neutral-50 transition-all duration-200"
              >
                <span>Pelajari Fitur</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 text-neutral-600" />
              </Link>
            </div>

            {/* Social Proof */}
            <div className="mt-12 pt-6 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="flex -space-x-3 overflow-hidden">
                <img
                  className="inline-block h-10 w-10 rounded-full ring-2 ring-white object-cover shadow-sm"
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop"
                  alt="Owner 1"
                />
                <img
                  className="inline-block h-10 w-10 rounded-full ring-2 ring-white object-cover shadow-sm"
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120&auto=format&fit=crop"
                  alt="Owner 2"
                />
                <img
                  className="inline-block h-10 w-10 rounded-full ring-2 ring-white object-cover shadow-sm"
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=120&auto=format&fit=crop"
                  alt="Owner 3"
                />
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight text-neutral-900">50k+ Transaksi</p>
                <p className="text-xs text-neutral-500 max-w-xs leading-normal">
                  Dipercaya 500+ pemilik kos & apartemen untuk operasional sewa harian bersama Huni Link.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Phone Mockup with floating cards */}
          <div className="relative flex justify-center lg:col-span-6 xl:col-span-6 lg:justify-end">
            <div className="relative w-full max-w-[340px] sm:max-w-[370px]">
              {/* Floating Card Top-Right: Total Income */}
              <DirectionalFloatCard className="landing-float absolute -right-6 top-16 z-20 hidden sm:flex flex-col rounded-2xl border border-neutral-200/80 bg-white/95 p-3.5 shadow-xl backdrop-blur-md">
                <span className="text-[11px] font-medium text-neutral-400">Total Pemasukan</span>
                <span className="text-sm font-bold text-neutral-900">Rp 23.643.000</span>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                  <TrendingUp className="h-3 w-3" />
                  <span>+12.8% bln ini</span>
                </div>
              </DirectionalFloatCard>

              {/* Floating Card Left: Summary / Staking */}
              <DirectionalFloatCard className="landing-float absolute -left-8 top-44 z-20 hidden sm:flex flex-col rounded-2xl border border-neutral-200/80 bg-white/95 p-3.5 shadow-xl backdrop-blur-md">
                <span className="text-[11px] font-medium text-neutral-400">Tingkat Koleksi Sewa</span>
                <span className="text-sm font-bold text-neutral-900">98.4% (Lancar)</span>
                <div className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-neutral-100">
                  <div className="h-full w-[98%] rounded-full bg-[#0FA37F]" />
                </div>
              </DirectionalFloatCard>

              {/* Phone Mockup Frame */}
              <div className="relative mx-auto rounded-[46px] border-[10px] border-neutral-900 bg-neutral-900 p-2 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)]">
                {/* Phone screen container */}
                <div className="relative overflow-hidden rounded-[36px] bg-white pb-6 pt-3 px-4 text-neutral-900 min-h-[560px]">
                  {/* Dynamic Island */}
                  <div className="mx-auto mb-4 h-5 w-24 rounded-full bg-neutral-900 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-neutral-800 ml-auto mr-2" />
                  </div>

                  {/* Top Header Card */}
                  <div className="rounded-2xl bg-neutral-50 p-4 border border-neutral-100/80">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[11px] text-neutral-500 font-medium">Total Pendapatan Tahun Ini</p>
                        <p className="text-lg font-bold text-neutral-900">Rp 492.500.000</p>
                      </div>
                      <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 border border-emerald-200/50">
                        <span>+14.93%</span>
                      </div>
                    </div>

                    {/* Smooth SVG Area Line Chart */}
                    <div className="mt-3 h-16 w-full">
                      <svg viewBox="0 0 240 60" className="h-full w-full overflow-visible">
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M0,45 C40,48 60,25 100,32 C140,38 170,12 210,18 C225,20 235,10 240,8 L240,60 L0,60 Z"
                          fill="url(#chartGradient)"
                        />
                        <path
                          d="M0,45 C40,48 60,25 100,32 C140,38 170,12 210,18 C225,20 235,10 240,8"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        <circle cx="210" cy="18" r="4" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-neutral-50 px-3.5 py-2.5 border border-neutral-100">
                    <div>
                      <p className="text-[10px] text-neutral-400">Pemasukan Bulan Ini</p>
                      <p className="text-xs font-bold text-neutral-800">Rp 38.640.000</p>
                    </div>
                    <span className="rounded-md bg-emerald-100/70 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                      94% Terkumpul
                    </span>
                  </div>

                  {/* Transaction History */}
                  <div className="mt-5">
                    <div className="flex items-center justify-between mb-2.5">
                      <h4 className="text-xs font-bold text-neutral-900">Riwayat Pembayaran</h4>
                      <span className="text-[10px] text-[#0FA37F] font-semibold cursor-pointer">Lihat Semua</span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between rounded-xl p-2 hover:bg-neutral-50 transition">
                        <div className="flex items-center gap-2.5">
                          <img
                            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop"
                            alt="Tenant"
                            className="h-8 w-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-xs font-semibold text-neutral-900">Steffan Hussain</p>
                            <p className="text-[10px] text-neutral-400">Kamar A-102 • QRIS</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-emerald-600">+Rp 2.500.000</span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl p-2 hover:bg-neutral-50 transition">
                        <div className="flex items-center gap-2.5">
                          <img
                            src="https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=100&auto=format&fit=crop"
                            alt="Tenant"
                            className="h-8 w-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-xs font-semibold text-neutral-900">Siti Rahmawati</p>
                            <p className="text-[10px] text-neutral-400">Unit B-05 • VA Mandiri</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-emerald-600">+Rp 3.800.000</span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl p-2 hover:bg-neutral-50 transition">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-[11px]">
                            DP
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-neutral-900">Deposit Sewa Baru</p>
                            <p className="text-[10px] text-neutral-400">Paviliun No. 3 • BCA</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-emerald-600">+Rp 1.500.000</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
