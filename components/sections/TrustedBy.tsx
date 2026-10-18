"use client";

export default function TrustedBy() {
  const BRANDS = [
    {
      name: "Spotify",
      logo: (
        <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.627.627 0 0 1-.86.208c-2.355-1.439-5.32-1.764-8.812-.966a.627.627 0 1 1-.28-1.222c3.822-.874 7.1-.508 9.744 1.12a.627.627 0 0 1 .208.86zm1.227-2.73a.784.784 0 0 1-1.079.258c-2.695-1.656-6.804-2.134-9.992-1.166a.784.784 0 1 1-.453-1.5c3.64-1.104 8.188-.57 11.266 1.329a.784.784 0 0 1 .258 1.079zm.105-2.836C14.69 8.924 9.385 8.745 6.305 9.68a.94.94 0 0 1-.555-1.797c3.535-1.073 9.404-.863 13.23 1.408a.942.942 0 0 1-.362 1.767z" />
        </svg>
      ),
      label: "Spotify",
    },
    {
      name: "airbnb",
      logo: (
        <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
          <path d="M12 2a4.42 4.42 0 0 0-4.4 4.47c0 2.87 2.45 6.07 4.4 8.7 1.95-2.63 4.4-5.83 4.4-8.7A4.42 4.42 0 0 0 12 2zm0 6a1.5 1.5 0 1 1 1.5-1.5A1.5 1.5 0 0 1 12 8z" />
          <path d="M12 22C7.3 22 2 17.5 2 12a9.92 9.92 0 0 1 2.3-6.3l1.5 1.3A7.92 7.92 0 0 0 4 12c0 4.2 4.5 8 8 8s8-3.8 8-8a7.92 7.92 0 0 0-1.8-5l1.5-1.3A9.92 9.92 0 0 1 22 12c0 5.5-5.3 10-10 10z" />
        </svg>
      ),
      label: "airbnb",
    },
    {
      name: "slack",
      logo: (
        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
          <path d="M6 15a2 2 0 0 1-2-2 2 2 0 0 1 2-2h2v2a2 2 0 0 1-2 2zm1 0a2 2 0 0 1 2-2 2 2 0 0 1 2 2v5a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-5zm2-7a2 2 0 0 1-2-2 2 2 0 0 1 2-2 2 2 0 0 1 2 2v2H9zm0 1a2 2 0 0 1 2-2 2 2 0 0 1 2 2v2H9V9zm7-2a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-2V9a2 2 0 0 1 2-2zm-1 0a2 2 0 0 1-2 2 2 2 0 0 1-2-2V2a2 2 0 0 1 2-2 2 2 0 0 1 2 2v5zm-2 7a2 2 0 0 1 2 2 2 2 0 0 1-2 2 2 2 0 0 1-2-2v-2h2zm0-1a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-2h4v2z" />
        </svg>
      ),
      label: "slack",
    },
    {
      name: "stripe",
      logo: null,
      label: "stripe",
      customClass: "font-bold text-xl tracking-tight lowercase",
    },
    {
      name: "Airwallex",
      logo: (
        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
          <path d="M3 17l4-9h4l-4 9H3zm7 0l4-9h4l-4 9h-4zm7 0l4-9h3l-4 9h-3z" />
        </svg>
      ),
      label: "Airwallex",
    },
    {
      name: "Booking.com",
      logo: null,
      label: "Booking.com",
      customClass: "font-bold text-lg tracking-tight",
    },
    {
      name: "BCA",
      logo: null,
      label: "BCA",
      customClass: "font-bold text-lg tracking-wider",
    },
    {
      name: "QRIS",
      logo: null,
      label: "QRIS",
      customClass: "font-bold text-lg tracking-widest",
    },
    {
      name: "Midtrans",
      logo: null,
      label: "midtrans",
      customClass: "font-bold text-lg tracking-tight lowercase",
    },
  ];

  // Duplicate for smooth seamless loop
  const LOOPED_BRANDS = [...BRANDS, ...BRANDS];

  return (
    <section className="relative overflow-hidden border-y border-neutral-100 bg-white py-8 sm:py-10">
      {/* Edge gradient masks for seamless fade out */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 sm:w-40 bg-gradient-to-r from-white via-white/80 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 sm:w-40 bg-gradient-to-l from-white via-white/80 to-transparent" />

      {/* Marquee Wrapper with flat logos */}
      <div className="flex w-full overflow-hidden select-none">
        <div className="animate-infinite-scroll flex items-center gap-12 sm:gap-16">
          {LOOPED_BRANDS.map((brand, index) => (
            <div
              key={`${brand.name}-${index}`}
              className="flex items-center gap-2.5 text-neutral-400 hover:text-neutral-900 transition-colors duration-200 shrink-0 cursor-default"
            >
              {brand.logo && (
                <span className="shrink-0 transition-transform duration-200 group-hover:scale-105">
                  {brand.logo}
                </span>
              )}
              <span
                className={
                  brand.customClass ||
                  "text-lg sm:text-xl font-bold tracking-tight"
                }
              >
                {brand.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
