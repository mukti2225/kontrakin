"use client";

import DirectionalFloatCard from "@/components/ui/DirectionalFloatCard";

export default function DigitalExperience() {
  return (
    <section id="keunggulan" className="bg-[#FAFAF9] py-20 sm:py-28 border-t border-neutral-100">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Big Stats Numbers */}
          <div className="lg:col-span-5 space-y-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Digital Experience
              </span>
              <p className="mt-2 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900">
                500+
              </p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500 max-w-sm">
                Mitra pemilik kos, kontrakan, dan manajemen properti mempercayakan operasional hariannya bersama kami.
              </p>
            </div>

            <div className="pt-6 border-t border-neutral-200/70">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Total Transaksi
              </span>
              <p className="mt-2 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900">
                14 M+
              </p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500 max-w-sm">
                Volume pembayaran sewa dan transaksi operasional yang tercatat rapi, transparan, dan bebas selisih.
              </p>
            </div>

            <div className="pt-6 border-t border-neutral-200/70">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Unit Terkelola
              </span>
              <p className="mt-2 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900">
                15 K+
              </p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500 max-w-sm">
                Unit kamar kos, paviliun, dan kontrakan aktif di berbagai kota besar di seluruh Indonesia.
              </p>
            </div>
          </div>

          {/* Right Column: Photo + Floating Card User UI */}
          <div className="lg:col-span-7 relative flex justify-center">
            <div className="relative w-full max-w-lg">
              {/* Main Photo with rounded corners */}
              <div className="relative overflow-hidden rounded-[32px] shadow-lg aspect-4/3 bg-neutral-100">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop"
                  alt="Young property owner"
                  className="h-full w-full object-cover object-center"
                />
              </div>

              {/* Floating UI Card at bottom right, matching reference mockup */}
              <DirectionalFloatCard className="landing-float absolute -bottom-8 -left-4 sm:left-6 z-20 rounded-2xl border border-neutral-200/80 bg-white/95 p-4 sm:p-5 shadow-2xl backdrop-blur-md max-w-xs sm:max-w-sm w-full">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-neutral-800">Distribusi Okupansi Unit</span>
                  <span className="text-[10px] rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                    Live Status
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Mini Donut */}
                  <div className="relative flex shrink-0 items-center justify-center">
                    <svg className="h-16 w-16 -rotate-90 transform" viewBox="0 0 40 40">
                      <circle cx="20" cy="20" r="16" stroke="#f1f5f9" strokeWidth="5" fill="transparent" />
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        stroke="#0FA37F"
                        strokeWidth="5"
                        strokeDasharray="100.5"
                        strokeDashoffset="14"
                        fill="transparent"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-[11px] font-bold text-neutral-800">86%</span>
                  </div>

                  {/* Legend list */}
                  <div className="space-y-1 text-[11px]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-[#0FA37F]" />
                        <span className="text-neutral-600">Unit Terisi</span>
                      </div>
                      <span className="font-bold text-neutral-900">86.4%</span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        <span className="text-neutral-600">Jatuh Tempo</span>
                      </div>
                      <span className="font-bold text-neutral-900">10.2%</span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-neutral-300" />
                        <span className="text-neutral-600">Siap Huni</span>
                      </div>
                      <span className="font-bold text-neutral-900">3.4%</span>
                    </div>
                  </div>
                </div>
              </DirectionalFloatCard>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
