import { ArrowRight } from "lucide-react";

export const Cta = () => {
  return (
    <section id="cta" className="bg-[#12141B] py-20">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-[28px] font-semibold tracking-tight text-white md:text-[34px]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Mulai kelola kontrakanmu hari ini juga.
        </h2>
        <p className="mx-auto mt-4 max-w-[42ch] text-[15px] leading-relaxed text-[#9CA0AA]">Gratis 14 hari, tanpa kartu kredit. Aktif dalam 5 menit.</p>
        <a href="#" className="mt-7 inline-flex items-center gap-1.5 rounded-full bg-[#0FA37F] px-6 py-3 text-[14px] font-medium text-[#12141B] transition-transform hover:scale-[1.03]">
          Coba Gratis Sekarang
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </section>
  );
};

export default Cta;
