"use client";

import { useState } from "react";
import { ChevronDown, ShieldCheck, Sparkles, TrendingUp, Users } from "lucide-react";

export default function AiBusinessModel() {
  const [openIndex, setOpenIndex] = useState(0);

  const ACCORDION_ITEMS = [
    {
      title: "AI Deteksi Dini Risiko Keterlambatan Sewa",
      content:
        "Algoritma machine learning Huni Link menganalisis pola bayar historis, kebiasaan komunikasi, dan riwayat tenggat waktu untuk mendeteksi potensi tunggakan sebelum tanggal jatuh tempo.",
    },
    {
      title: "Otomatisasi Penagihan & Eskalasi Bertahap",
      content:
        "Sistem cerdas mengirimkan pengingat sopan H-3, hari H, hingga notifikasi denda otomatis dengan tautan pembayaran instan tanpa perlu Anda menagih manual.",
    },
    {
      title: "Keamanan Finansial & Isolasi Data Multi-Tenant",
      content:
        "Setiap data properti, nomor rekening, transaksi, dan data pribadi penghuni dienkripsi serta dipisahkan secara ketat dengan standar keamanan perbankan.",
    },
  ];

  return (
    <section id="otomatisasi" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Title & Accordion */}
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-800 mb-4 border border-emerald-100">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              Intelligence & Automation
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 leading-tight">
              Check our Business Model build with AI
            </h2>
            <p className="mt-3 text-sm sm:text-base text-neutral-500">
              Operasikan portofolio properti Anda dengan bantuan kecerdasan buatan yang mengantisipasi tunggakan dan menyusun laporan otomatis.
            </p>

            {/* Accordion */}
            <div className="mt-8 divide-y divide-neutral-200/80 border-y border-neutral-200/80">
              {ACCORDION_ITEMS.map((item, index) => {
                const isOpen = openIndex === index;
                return (
                  <div key={item.title} className="py-4">
                    <button
                      type="button"
                      onClick={() => setOpenIndex(isOpen ? -1 : index)}
                      className="flex w-full items-center justify-between text-left text-base font-bold text-neutral-900 hover:text-emerald-700 transition-colors"
                    >
                      <span>{item.title}</span>
                      <ChevronDown
                        className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-emerald-600" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <p className="mt-3 text-sm leading-relaxed text-neutral-500">
                        {item.content}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: AI Dashboard Preview Card matching reference */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="w-full max-w-xl rounded-3xl border border-neutral-200/90 bg-[#FBFBFB] p-6 sm:p-8 shadow-sm">
              {/* Card Header stats */}
              <div className="flex items-center justify-between pb-6 border-b border-neutral-200/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xs border border-neutral-200/60 text-neutral-700">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-neutral-400">Total Penghuni</span>
                    <p className="text-base font-bold text-neutral-900">321 Penghuni Aktif</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>8.5% Okupansi Naik</span>
                </div>
              </div>

              {/* Center Visualization: Donut / Radial Gauge */}
              <div className="py-8 flex flex-col sm:flex-row items-center justify-around gap-6">
                <div className="relative flex items-center justify-center">
                  {/* SVG Donut Circle */}
                  <svg className="h-44 w-44 -rotate-90 transform" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="48"
                      stroke="#f1f5f9"
                      strokeWidth="14"
                      fill="transparent"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="48"
                      stroke="#10b981"
                      strokeWidth="14"
                      strokeDasharray="301.6"
                      strokeDashoffset="60.3"
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-bold text-neutral-900">80%</span>
                    <span className="text-[11px] font-semibold text-neutral-500">Tepat Waktu</span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="space-y-3 w-full sm:w-auto">
                  <div className="flex items-center justify-between sm:justify-start gap-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#10b981]" />
                      <span className="text-xs font-medium text-neutral-700">Bayar Tepat Waktu</span>
                    </div>
                    <span className="text-xs font-bold text-neutral-900">80%</span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-start gap-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                      <span className="text-xs font-medium text-neutral-700">Tenggat Waktu</span>
                    </div>
                    <span className="text-xs font-bold text-neutral-900">14%</span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-start gap-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                      <span className="text-xs font-medium text-neutral-700">Tunggakan Kritis</span>
                    </div>
                    <span className="text-xs font-bold text-neutral-900">6%</span>
                  </div>
                </div>
              </div>

              {/* Bottom mini chart */}
              <div className="pt-4 border-t border-neutral-200/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-neutral-800">Tren Koleksi Sewa Bulanan</span>
                  <span className="text-[11px] text-emerald-600 font-semibold">+18.2% vs kuartal lalu</span>
                </div>
                <div className="h-16 w-full">
                  <svg viewBox="0 0 300 50" className="h-full w-full">
                    <path
                      d="M0,40 Q50,15 100,28 T200,20 T300,5"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M0,40 Q50,15 100,28 T200,20 T300,5 L300,50 L0,50 Z"
                      fill="rgba(16,185,129,0.08)"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
