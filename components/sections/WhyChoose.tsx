import { BarChart3, ShieldCheck, Sparkles } from "lucide-react";

const REASONS = [
  { icon: Sparkles, title: "Otomatisasi Penuh", description: "Lupakan pencatatan manual. Sistem kami mengelola tagihan, pengingat, dan laporan secara otomatis." },
  { icon: ShieldCheck, title: "Keamanan Data Terjamin", description: "Data properti dan penghuni Anda disimpan aman dengan sistem yang dirancang untuk kebutuhan profesional." },
  { icon: BarChart3, title: "Akses Dimana Saja", description: "Pantau dan kelola properti Anda dari laptop atau ponsel kapan pun dan di mana pun." },
];

export default function WhyChoose() {
  return (
    <section className="bg-[#eef3f2] px-6 py-16 sm:px-8 md:px-10 md:py-20">
      <div className="mx-auto max-w-6xl text-center">
        <h2 className="text-3xl font-bold text-[#1f2937] sm:text-4xl">Kenapa Memilih Huni Link?</h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#6b7280]">Dibangun khusus untuk memenuhi kebutuhan pemilik kost modern dengan fokus pada kemudahan, keamanan, dan efisiensi.</p>
        <div className="mt-10 grid gap-3 text-left md:grid-cols-3">
          {REASONS.map(({ icon: Icon, title, description }, index) => (
            <article
              key={title}
              className={`landing-reveal group rounded-lg border border-[#dbe5e2] p-5 transition duration-300 hover:-translate-y-2 hover:shadow-[0_16px_30px_rgba(0,77,77,0.12)] ${index === 1 ? "bg-[#006060] text-white" : "bg-[#f8fbfa]"}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`flex size-8 items-center justify-center rounded-md transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 ${index === 1 ? "bg-white/15" : "bg-[#d8f3ec]"}`}>
                <Icon className={`size-4 ${index === 1 ? "text-white" : "text-[#007f78]"}`} />
              </div>
              <h3 className={`mt-4 text-base font-bold ${index === 1 ? "text-white" : "text-[#1f2937]"}`}>{title}</h3>
              <p className={`mt-2 text-sm leading-6 ${index === 1 ? "text-white/75" : "text-[#6b7280]"}`}>{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
