"use client";

import { useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import DirectionalFloatCard from "@/components/ui/DirectionalFloatCard";

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const FAQS = [
    {
      number: "01.",
      question: "Apakah Huni Link cocok untuk kost skala kecil hingga ratusan kamar?",
      answer:
        "Tentu. Huni Link dirancang fleksibel dari kost 5 pintu milik perorangan, paviliun keluarga, hingga manajemen properti dengan ratusan unit di berbagai lokasi.",
    },
    {
      number: "02.",
      question: "Bagaimana cara kerja pengingat tagihan otomatis WhatsApp?",
      answer:
        "Sistem mengirimkan invoice digital dan link pembayaran secara terjadwal langsung ke nomor WhatsApp penghuni tanpa Anda harus mengetik atau mengirim pesan satu per satu.",
    },
    {
      number: "03.",
      question: "Metode pembayaran apa saja yang bisa diterima dari penyewa?",
      answer:
        "Penghuni dapat membayar menggunakan QRIS (semua e-wallet dan m-banking), Virtual Account BCA, Mandiri, BRI, BNI, Permata, hingga transfer bank manual dengan bukti bayar.",
    },
    {
      number: "04.",
      question: "Bisakah saya menambahkan penjaga atau manajer dengan akses terbatas?",
      answer:
        "Bisa. Anda dapat mengatur peran pengguna (Owner, Manager, Staf Lapangan). Staf lapangan hanya bisa melihat data kamar dan mencatat keluhan tanpa melihat data laporan keuangan sensitif.",
    },
    {
      number: "05.",
      question: "Bagaimana jika saya ingin memindahkan data penghuni lama dari Excel?",
      answer:
        "Tersedia fitur import Excel pintar. Anda cukup mengunggah file spreadsheet daftar kamar dan penghuni, sistem kami akan memetakan kolom secara otomatis.",
    },
  ];

  return (
    <section id="faq" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        {/* Section Header with right side link */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-16">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 leading-tight">
              Kontrol Semua Tagihan & Pelajari <br />
              Kemudahan Huni Link
            </h2>
          </div>
          <a
            href="#faq"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-800 hover:text-[#0FA37F] transition-colors"
          >
            <span>Lihat Semua FAQ</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Content: Left Photo with badge + Right Numbered Accordion */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-start">
          {/* Left: Photo Card with floating income badge */}
          <div className="lg:col-span-5 relative">
            <div className="relative overflow-hidden rounded-[28px] aspect-4/3 bg-neutral-100 shadow-md">
              <img
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=800&auto=format&fit=crop"
                alt="Property team discussing"
                className="h-full w-full object-cover object-center"
              />
            </div>

            {/* Floating Income Badge matching reference ($1,096.30 / Rp 12.096.300) */}
            <DirectionalFloatCard className="landing-float absolute -bottom-5 right-4 sm:right-8 z-20 rounded-2xl border border-neutral-200/80 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-md">
              <span className="text-[10px] font-medium text-neutral-400">Rata-rata Pendapatan Harian</span>
              <p className="text-base font-bold text-neutral-900">Rp 1.096.300 / hari</p>
              <span className="text-[10px] font-semibold text-emerald-600">+18% efisiensi operasional</span>
            </DirectionalFloatCard>
          </div>

          {/* Right: Numbered FAQ Accordion matching reference 01 to 05 */}
          <div className="lg:col-span-7 divide-y divide-neutral-200/80 border-t border-neutral-200/80">
            {FAQS.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div key={faq.number} className="py-5">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                    className="flex w-full items-start justify-between text-left gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-sm font-semibold text-neutral-400 shrink-0">
                        {faq.number}
                      </span>
                      <span className="text-base font-bold text-neutral-900 hover:text-emerald-700 transition-colors">
                        {faq.question}
                      </span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-200 mt-1 ${
                        isOpen ? "rotate-180 text-emerald-600" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="mt-3 pl-9 pr-6 text-sm leading-relaxed text-neutral-500">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
