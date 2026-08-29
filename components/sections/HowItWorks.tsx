export const HowItWorks = () => {
  const STEPS = [
    {
      n: "1",
      title: "Daftar & Atur Properti",
      desc: "Buat akun, masukkan detail properti, dan mulai kelola unit Anda.",
    },
    {
      n: "2",
      title: "Sistem Bekerja Otomatis",
      desc: "Biarkan Huni Link menagihkan dan mencatat pembayaran secara otomatis.",
    },
    {
      n: "3",
      title: "Pantau Pertumbuhan",
      desc: "Lihat laporan keuangan dan performa properti kapan pun Anda membutuhkannya.",
    },
  ];

  return (
    <section id="cara" className="bg-[#f7faf9] px-6 py-16 sm:px-8 md:px-10 md:py-20">
      <div className="mx-auto max-w-6xl text-center">
        <h2 className="text-3xl font-bold text-[#1f2937] sm:text-4xl">Cara Kerja yang Sederhana</h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#6b7280]">Tidak perlu rumit untuk mendapatkan manajemen properti yang lebih baik.</p>
        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <div key={step.n} className="landing-reveal group relative px-3" style={{ animationDelay: `${index * 110}ms` }}>
              <span className="mx-auto flex size-8 items-center justify-center rounded-full bg-[#006060] text-xs font-bold text-white transition duration-300 group-hover:scale-110 group-hover:shadow-[0_0_0_7px_rgba(0,96,96,0.12)]">
                {step.n}
              </span>
              <h3 className="mt-4 text-base font-bold text-[#1f2937]">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#6b7280]">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
