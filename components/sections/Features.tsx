import { Building2, DoorOpen, LineChart, MessageCircleMore, Receipt, Users } from "lucide-react";

export const Features = () => {
  const FEATURES = [
    {
      icon: Receipt,
      title: "Tagihan Otomatis",
      desc: "Tagihan sewa terbit sendiri tiap bulan sesuai tanggal jatuh tempo masing-masing penyewa.",
    },
    {
      icon: MessageCircleMore,
      title: "Pengingat WhatsApp",
      desc: "Kirim pengingat pembayaran otomatis lewat WhatsApp, tanpa perlu chat satu-satu.",
    },
    {
      icon: LineChart,
      title: "Laporan Keuangan",
      desc: "Lihat pemasukan, tunggakan, dan arus kas per properti dalam satu grafik yang jelas.",
    },
    {
      icon: Building2,
      title: "Multi Properti",
      desc: "Kelola beberapa kontrakan atau kos sekaligus dari satu akun yang sama.",
    },
    {
      icon: DoorOpen,
      title: "Manajemen Kamar",
      desc: "Catat status tiap kamar — terisi, kosong, atau dalam proses booking — secara real-time.",
    },
    {
      icon: Users,
      title: "Portal Penyewa",
      desc: "Penyewa bisa cek tagihan dan riwayat pembayaran sendiri lewat tautan pribadi.",
    },
  ];

  return (
    <section id="fitur" className="bg-[#FAFAF8] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-[48ch]">
          <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#0FA37F]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            Fitur
          </span>
          <h2 className="mt-3 text-[30px] font-semibold tracking-tight text-[#12141B] md:text-[36px]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Semua yang dibutuhkan, tanpa fitur yang bikin bingung.
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#E5E5E0] bg-[#E5E5E0] sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-[#FAFAF8] p-7 transition-colors hover:bg-white">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E3F5EF]">
                <Icon className="h-5 w-5 text-[#0FA37F]" />
              </div>
              <h3 className="mt-4 text-[15px] font-semibold text-[#12141B]">{title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
