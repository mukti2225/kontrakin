import { BarChart3, MessageCircleMore, Receipt } from "lucide-react";

export const Features = () => {
  const FEATURES = [
    {
      icon: Receipt,
      title: "Tagihan & Pembayaran Otomatis",
      desc: "Terima pengingat dan catat pembayaran tanpa perlu mengejar penyewa satu per satu.",
    },
    {
      icon: MessageCircleMore,
      title: "Manajemen Penghuni Real-time",
      desc: "Data penghuni dan status kamar selalu terbarui dalam satu dasbor yang mudah dipahami.",
    },
    {
      icon: MessageCircleMore,
      title: "Komunikasi Langsung & Terintegrasi",
      desc: "Jaga komunikasi tetap rapi dengan fitur yang terhubung langsung ke kebutuhan penghuni.",
    },
    {
      icon: BarChart3,
      title: "Laporan Keuangan Komprehensif",
      desc: "Pantau pemasukan dan performa properti dengan laporan yang akurat dan mudah dibaca.",
    },
  ];

  return (
    <section id="fitur" className="bg-[#f7faf9] px-6 py-16 sm:px-8 md:px-10 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[#1f2937] sm:text-4xl">Fitur Unggulan</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#6b7280]">Solusi lengkap untuk manajemen properti yang efisien dan tanpa hambatan.</p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, desc }, index) => (
            <div
              key={title}
              className="landing-reveal group min-h-40 rounded-lg border border-[#e1e9e7] bg-[#f8fbfa] p-5 transition duration-300 hover:-translate-y-2 hover:border-[#8ccfc1] hover:bg-white hover:shadow-[0_16px_30px_rgba(0,77,77,0.1)]"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div className="flex size-8 items-center justify-center rounded-md bg-[#d8f3ec] transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                <Icon className="size-4 text-[#007f78]" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#1f2937]">{title}</h3>
              <p className="mt-2 text-sm leading-5 text-[#6b7280]">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
