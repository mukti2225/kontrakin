import { ArrowRight, CheckCircle2 } from "lucide-react";
import DirectionalFloatCard from "@/components/ui/DirectionalFloatCard";

const heroImage = "https://www.figma.com/api/mcp/asset/a3cf68c8-2b25-4ae9-81f7-402116aa0e74.png";
const statusIcon = "https://www.figma.com/api/mcp/asset/5ebe4a08-851c-492d-8cda-6e1cf6c8e23f.svg";
const roomIcon = "https://www.figma.com/api/mcp/asset/540af2ed-bf95-4f28-ba88-ebf25afe60f1.svg";

export const Hero = () => {
  const metrics = [
    ["500+", "PEMILIK PROPERTI"],
    ["12K+", "KAMAR DIKELOLA"],
    ["99%", "TINGKAT SEWA"],
    ["24/7", "DUKUNGAN PELANGGAN"],
  ];

  return (
    <section id="beranda" className="relative overflow-hidden border-b border-[#dbe5e2] bg-[#f7faf9]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(0,77,77,0.14),transparent_38%)]" />
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-16 sm:px-8 md:grid-cols-2 md:gap-8 md:px-10 md:py-20">
        <div className="landing-reveal max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#bec9c8]/40 bg-[#e6e9e8] px-4 py-2 text-xs font-medium text-[#1f2937]">
            <span className="size-2 rounded-full bg-[#10b981]" /> Digunakan oleh 500+ Pemilik Properti
          </div>
          <h1 className="mt-7 max-w-[11ch] text-5xl font-extrabold leading-[1.08] tracking-[-0.04em] text-[#1f2937] sm:text-6xl">
            Kelola Kost <span className="text-[#004d4d]">Lebih Cerdas,</span> Bukan Lebih Keras.
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-[#4b5563] sm:text-lg">
            Tinggalkan cara lama. Huni Link menghadirkan solusi modern untuk manajemen properti Anda, dari otomatisasi tagihan hingga pemantauan kamar real-time dalam satu platform elegan.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a href="/register" className="group inline-flex items-center gap-2 rounded-xl bg-[#004d4d] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#003b3b]">
              Mulai Transformasi Sekarang
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a href="#cara" className="inline-flex items-center gap-2 rounded-xl border border-[#bec9c8] bg-white px-5 py-3.5 text-sm font-semibold text-[#1f2937] hover:border-[#004d4d]">
              Lihat Demo Interaktif
            </a>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs text-[#6b7280]">
            <CheckCircle2 className="size-4 text-[#10b981]" /> Siap dipakai dalam hitungan menit
          </div>
        </div>

        <div className="landing-reveal relative mx-auto w-full max-w-xl [animation-delay:180ms]">
          <img src={heroImage} alt="Tampilan dashboard Huni Link" className="landing-float relative z-10 w-full rounded-2xl shadow-[0_24px_50px_rgba(0,77,77,0.18)]" />
          <DirectionalFloatCard className="landing-float landing-float-card absolute left-[-8px] top-[8%] z-20 flex items-center gap-3 rounded-2xl border border-white/30 bg-white/70 p-3 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] backdrop-blur-md hover:shadow-[0_18px_24px_-6px_rgba(0,77,77,0.2)] sm:left-[-24px] sm:p-[17px]">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#10b981]/20 sm:size-12">
              <img src={statusIcon} alt="" className="size-4 sm:size-5" />
            </div>
            <div className="pr-1">
              <p className="text-[11px] leading-4 text-[#4b5563] sm:text-xs">Status Tagihan</p>
              <p className="text-xs font-bold leading-5 text-[#1f2937] sm:text-sm">Lunas (24 Kamar)</p>
            </div>
          </DirectionalFloatCard>
          <DirectionalFloatCard className="landing-float landing-float-card absolute bottom-[8%] right-[-8px] z-20 flex items-center gap-3 rounded-2xl border border-white/30 bg-white/70 px-3 py-3 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] backdrop-blur-md [animation-delay:700ms] hover:shadow-[0_18px_24px_-6px_rgba(0,77,77,0.2)] sm:bottom-[10%] sm:right-[-24px] sm:px-[17px] sm:pb-6 sm:pt-[17px]">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#004d4d]/10">
              <img src={roomIcon} alt="" className="h-2 w-3" />
            </div>
            <div>
              <p className="text-[11px] leading-4 text-[#4b5563] sm:text-xs">Tersedia</p>
              <p className="text-xs font-bold leading-5 text-[#1f2937] sm:text-sm">Kamar A-03</p>
            </div>
          </DirectionalFloatCard>
        </div>
      </div>

      <div className="grid grid-cols-2 bg-white sm:grid-cols-4">
        {metrics.map(([value, label], index) => (
          <div key={label} className="landing-reveal px-6 py-8 text-center transition-colors duration-300 hover:bg-[#f0faf7] last:border-r-0" style={{ animationDelay: `${index * 90}ms` }}>
            <strong className="block text-lg font-bold text-[#004d4d]">{value}</strong>
            <span className="text-[11px] font-medium text-[#6b7280]">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Hero;
