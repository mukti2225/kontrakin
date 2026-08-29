import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const FOOTER_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/contact", label: "Contact Us" },
] as const;

export default function Footer() {
  return (
    <footer className="border-t border-[#dbe5e2] bg-[#e9efed] text-[#6b7280]">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h3 className="mb-4 text-base font-bold text-[#006060]">Huni Link</h3>
            <p className="max-w-[30ch] text-[10px] leading-4">Solusi manajemen properti modern untuk pemilik kost dan kontrakan.</p>
          </div>

          <div>
            <h4 className="mb-4 text-[10px] font-bold uppercase tracking-wider text-[#1f2937]">Produk</h4>
            <ul className="space-y-2 text-[10px]">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-[#006060]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-[10px] font-bold uppercase tracking-wider text-[#1f2937]">Dukungan</h4>
            <p className="mb-3 text-[10px]">Bantuan dan keamanan data.</p>
            <form className="flex gap-2">
              <span className="text-[10px]">Hubungi kami</span>
            </form>
          </div>
        </div>

        <Separator className="my-8 bg-[#d2dcda]" />

        <div className="text-xs text-[#8a9491]">&copy; {new Date().getFullYear()} Huni Link. Hak Cipta Dilindungi Undang-Undang.</div>
      </div>
    </footer>
  );
}
