const BRANDS = ["Griya Resik", "Urban Stay", "Kostku", "Living Space"];

export default function TrustedBy() {
  return (
    <section className="bg-[#f7faf9] px-6 pb-14 pt-2 sm:px-8 md:px-10">
      <div className="mx-auto max-w-6xl border-t border-[#dbe5e2] pt-8 text-center">
        <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#9ca3af]">Dipercaya oleh pemilik properti di Indonesia</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm font-semibold text-[#6b7280] sm:gap-x-14">
          {BRANDS.map((brand) => (
            <span key={brand}>{brand}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
