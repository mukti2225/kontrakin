import Link from "next/link";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200/80 bg-white text-neutral-600">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          {/* Brand info */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-2.5">
              <Image src="/icon-aja.png" alt="Huni Link" width={28} height={28} className="rounded-md" />
              <span className="text-xl font-bold tracking-tight text-neutral-900">
                Huni<span className="text-[#0FA37F]">Link.</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-500">
              Sistem Operasi Manajemen Sewa Properti modern untuk pemilik kos, apartemen, ruko, dan kontrakan di Indonesia.
            </p>
            <p className="mt-4 text-xs text-neutral-400">
              Dibuat dengan standar keamanan data multi-tenant dan transparansi finansial.
            </p>
          </div>

          {/* Links 1 */}
          <div className="md:col-span-2 md:col-start-7">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">Produk</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="#fitur" className="hover:text-emerald-700 transition-colors">
                  Fitur Utama
                </Link>
              </li>
              <li>
                <Link href="#integrasi" className="hover:text-emerald-700 transition-colors">
                  Integrasi Pembayaran
                </Link>
              </li>
              <li>
                <Link href="#otomatisasi" className="hover:text-emerald-700 transition-colors">
                  Automasi AI
                </Link>
              </li>
              <li>
                <Link href="#keunggulan" className="hover:text-emerald-700 transition-colors">
                  Statistik & Metrik
                </Link>
              </li>
            </ul>
          </div>

          {/* Links 2 */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">Solusi</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <span className="text-neutral-500">Kost & Kamar Sewa</span>
              </li>
              <li>
                <span className="text-neutral-500">Kontrakan & Paviliun</span>
              </li>
              <li>
                <span className="text-neutral-500">Ruko & Komersial</span>
              </li>
              <li>
                <span className="text-neutral-500">Multi-Cabang Properti</span>
              </li>
            </ul>
          </div>

          {/* Links 3 */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">Bantuan</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="#faq" className="hover:text-emerald-700 transition-colors">
                  Tanya Jawab (FAQ)
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-emerald-700 transition-colors">
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-emerald-700 transition-colors">
                  Syarat & Ketentuan
                </Link>
              </li>
              <li>
                <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer" className="text-emerald-700 font-medium hover:underline">
                  Kontak WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-10 bg-neutral-200/80" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          <p>&copy; {new Date().getFullYear()} Huni Link. Seluruh hak cipta dilindungi undang-undang.</p>
          <div className="flex items-center gap-6">
            <span>Indonesia • IDR (Rp)</span>
            <span>Asia/Jakarta</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
