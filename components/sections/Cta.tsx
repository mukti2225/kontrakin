import { ArrowRight } from "lucide-react";

export const Cta = () => {
  return (
    <section id="cta" className="bg-[#006060] px-6 py-16 sm:px-8 md:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">Siap Mengoptimalkan Properti Anda?</h2>
        <p className="mx-auto mt-4 max-w-[46ch] text-sm leading-6 text-white/75">Bergabung dengan ribuan pemilik properti yang telah meningkatkan efisiensi dan keuntungan bersama Huni Link.</p>
        <a
          href="/register"
          className="group relative mt-7 inline-flex items-center gap-2 overflow-hidden rounded-md bg-white px-5 py-3 text-sm font-bold text-[#006060] shadow-sm transition duration-300 hover:-translate-y-1 hover:bg-[#e6f7f2] hover:shadow-lg"
        >
          <span className="absolute inset-y-0 left-0 w-1/3 -translate-x-[180%] skew-x-[-18deg] bg-white/60 transition-transform duration-700 group-hover:translate-x-[480%]" />
          Daftar Gratis Sekarang
          <ArrowRight className="size-3.5" />
        </a>
      </div>
    </section>
  );
};

export default Cta;
