import { CheckCircle2 } from "lucide-react";

export const Pricing = () => {
  const PLANS = [
    {
      name: "Starter",
      price: "Rp 0",
      period: "/bulan",
      desc: "Untuk pemilik dengan 1 properti kecil.",
      features: ["Hingga 5 kamar", "Tagihan otomatis", "Laporan dasar"],
      highlighted: false,
    },
    {
      name: "Tumbuh",
      price: "Rp 99rb",
      period: "/bulan",
      desc: "Untuk kontrakan atau kos yang mulai berkembang.",
      features: ["Hingga 30 kamar", "Pengingat WhatsApp", "Portal penghuni", "Laporan keuangan lengkap"],
      highlighted: true,
    },
    {
      name: "Bisnis",
      price: "Rp 249rb",
      period: "/bulan",
      desc: "Untuk pengelola dengan banyak properti.",
      features: ["Kamar tanpa batas", "Multi properti", "Multi pengguna tim", "Dukungan prioritas"],
      highlighted: false,
    },
  ];

  return (
    <section id="harga" className="border-y border-[#E5E5E0] bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#0FA37F]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            Harga
          </span>
          <h2 className="mx-auto mt-3 max-w-[24ch] text-[30px] font-semibold tracking-tight text-[#12141B] md:text-[36px]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Harga jujur, sesuai jumlah kamar yang kamu kelola.
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div key={plan.name} className={`flex flex-col rounded-2xl border p-7 ${plan.highlighted ? "border-[#12141B] bg-[#12141B] text-white" : "border-[#E5E5E0] bg-[#FAFAF8] text-[#12141B]"}`}>
              <h3 className="text-[16px] font-semibold">{plan.name}</h3>
              <p className={`mt-1 text-[13px] ${plan.highlighted ? "text-[#9CA0AA]" : "text-[#6B7280]"}`}>{plan.desc}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-[30px] font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {plan.price}
                </span>
                <span className={`text-[13px] ${plan.highlighted ? "text-[#9CA0AA]" : "text-[#8A8E97]"}`}>{plan.period}</span>
              </div>
              <ul className="mt-6 flex flex-1 flex-col gap-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-[13px]">
                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${plan.highlighted ? "text-[#0FA37F]" : "text-[#0FA37F]"}`} />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#coba"
                className={`mt-7 rounded-full px-4 py-2.5 text-center text-[14px] font-medium transition-colors ${plan.highlighted ? "bg-[#0FA37F] text-[#12141B] hover:bg-white" : "bg-[#12141B] text-white hover:bg-[#0FA37F]"}`}
              >
                Pilih {plan.name}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
