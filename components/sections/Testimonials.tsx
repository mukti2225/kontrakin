"use client";

import { Star } from "lucide-react";

export default function Testimonials() {
  const TESTIMONIALS = [
    {
      name: "Agus Priyanto",
      role: "Pemilik Kost Griya Nyaman (38 Kamar, Bandung)",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120&auto=format&fit=crop",
      quote:
        "Dulu setiap awal bulan selalu stres mencocokkan mutasi bank dan kirim WhatsApp penagihan satu per satu. Sejak pakai Huni Link, 95% penghuni bayar tepat waktu via QRIS otomatis.",
    },
    {
      name: "Dian Novita",
      role: "Manajer Urban Paviliun (24 Unit, Yogyakarta)",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=120&auto=format&fit=crop",
      quote:
        "Fitur alokasi deposit dan invoice otomatisnya sangat akurat. Kami tidak pernah lagi berselisih dengan penghuni saat checkout karena semua audit trail tercatat rapi.",
    },
    {
      name: "Hendra Wijaya",
      role: "Pengelola Ruko & Kontrakan (12 Pintu, Jakarta Barat)",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=120&auto=format&fit=crop",
      quote:
        "Tampilan dasbornya sangat bersih dan to the point. Dari ponsel pun saya bisa langsung pantau unit mana yang kosong dan status tagihan yang belum lunas.",
    },
  ];

  return (
    <section className="bg-[#FAFAF9] py-20 sm:py-28 border-t border-neutral-100">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 leading-tight">
            Don't Take Our Word for It
          </h2>
          <p className="mt-3 text-sm sm:text-base text-neutral-500">
            Dengarkan cerita langsung dari para pemilik kos dan pengelola properti yang telah menyederhanakan operasional harian mereka.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((item) => (
            <div
              key={item.name}
              className="flex flex-col justify-between rounded-[28px] border border-neutral-200/80 bg-white p-7 sm:p-8 shadow-xs hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm sm:text-base leading-relaxed text-neutral-700">
                  "{item.quote}"
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-neutral-100 flex items-center gap-3.5">
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="h-10 w-10 rounded-full object-cover shadow-xs"
                />
                <div>
                  <h4 className="text-sm font-bold text-neutral-900">{item.name}</h4>
                  <p className="text-xs text-neutral-400 leading-tight mt-0.5">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
