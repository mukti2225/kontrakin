export const HowItWorks = () => {
  const STEPS = [
    {
      n: "01",
      title: "Tambahkan properti & kamar",
      desc: "Masukkan nama properti, jumlah kamar, dan harga sewa masing-masing unit.",
    },
    {
      n: "02",
      title: "Undang penyewa",
      desc: "Kirim tautan undangan ke penyewa agar mereka bisa lihat tagihan sendiri.",
    },
    {
      n: "03",
      title: "Tagihan jalan otomatis",
      desc: "Sistem menagih, mengingatkan, dan mencatat pembayaran tanpa kamu pantau manual.",
    },
  ];

  return (
    <section id="cara" className="border-y border-[#E5E5E0] bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#0FA37F]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          Cara kerja
        </span>
        <h2 className="mt-3 max-w-[30ch] text-[30px] font-semibold tracking-tight text-[#12141B] md:text-[36px]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Tiga langkah, langsung jalan hari itu juga.
        </h2>

        <div className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.n} className="relative pl-0">
              <span className="text-[13px] font-medium text-[#0FA37F]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {step.n}
              </span>
              <h3 className="mt-3 text-[17px] font-semibold text-[#12141B]">{step.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
