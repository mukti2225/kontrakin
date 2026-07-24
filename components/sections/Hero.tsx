import { ArrowRight } from "lucide-react";

export const Hero = () => {
  type RoomStatus = "lunas" | "jatuh-tempo" | "nunggak";

  const STATUS_STYLES: Record<RoomStatus, { bg: string; text: string; label: string }> = {
    lunas: { bg: "bg-[#E3F5EF]", text: "text-[#0FA37F]", label: "Lunas" },
    "jatuh-tempo": { bg: "bg-[#FDF1DC]", text: "text-[#B87706]", label: "Jatuh tempo" },
    nunggak: { bg: "bg-[#FBE7E6]", text: "text-[#C43D37]", label: "Nunggak" },
  };

  const ROOMS: { code: string; status: RoomStatus }[] = [
    { code: "A1", status: "lunas" },
    { code: "A2", status: "lunas" },
    { code: "A3", status: "jatuh-tempo" },
    { code: "B1", status: "lunas" },
    { code: "B2", status: "nunggak" },
    { code: "B3", status: "lunas" },
  ];

  const RoomStatusCard = ({ code, status }: { code: string; status: RoomStatus }) => {
    const s = STATUS_STYLES[status];
    return (
      <div className={`flex flex-col items-center justify-center rounded-lg ${s.bg} px-3 py-3`}>
        <span className="text-[13px] font-semibold text-[#12141B]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          {code}
        </span>
        <span className={`mt-1 text-[10px] font-medium ${s.text}`}>{s.label}</span>
      </div>
    );
  };

  return (
    <section id="beranda" className="border-b border-[#E5E5E0] bg-[#FAFAF8]">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
        <div>
          <span className="inline-block text-[12px] font-medium uppercase tracking-[0.08em] text-[#0FA37F]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            Untuk pemilik kontrakan &amp; kos
          </span>
          <h1 className="mt-4 max-w-[14ch] text-[40px] font-semibold leading-[1.1] tracking-tight text-[#12141B] md:text-[52px]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Kelola kontrakan, bukan drama telat bayar.
          </h1>
          <p className="mt-5 max-w-[42ch] text-[16px] leading-relaxed text-[#4B4F58]">
            Satu dasbor untuk catat penyewa, kirim tagihan otomatis, dan pantau kamar mana yang sudah lunas — tanpa buku catatan dan chat WhatsApp yang berantakan.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#coba" className="group flex items-center gap-1.5 rounded-full bg-[#12141B] px-5 py-3 text-[14px] font-medium text-[#FAFAF8] transition-colors hover:bg-[#0FA37F]">
              Coba Gratis 14 Hari
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a href="#cara-kerja" className="text-[14px] font-medium text-[#4B4F58] hover:text-[#12141B]">
              Lihat cara kerjanya →
            </a>
          </div>
          <p className="mt-6 text-[13px] text-[#8A8E97]">Tanpa kartu kredit. Bisa dipakai untuk 1 sampai 100+ unit.</p>
        </div>

        {/* Signature widget preview */}
        <div className="relative mx-auto w-full max-w-380px">
          <div className="rounded-2xl border border-[#E5E5E0] bg-white p-5 shadow-[0_20px_50px_-20px_rgba(18,20,27,0.25)]">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-[#12141B]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                Kos Melati — Juli 2026
              </span>
              <span className="text-[11px] text-[#8A8E97]">6 kamar</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {ROOMS.map((room) => (
                <RoomStatusCard key={room.code} {...room} />
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[#E5E5E0] pt-4">
              <span className="text-[12px] text-[#8A8E97]">Total tertagih</span>
              <span className="text-[14px] font-semibold text-[#12141B]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                Rp 9.600.000
              </span>
            </div>
          </div>
          <div className="absolute -bottom-4 -left-4 -z-10 h-full w-full rounded-2xl border-2 border-[#0FA37F]/30" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
