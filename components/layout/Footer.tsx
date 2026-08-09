import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const FOOTER_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/contact", label: "Contact Us" },
] as const;

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h3 className="mb-4 text-lg font-bold text-white">HuniLink</h3>
            <p className="text-sm text-gray-400">Solusi digital terbaik untuk mengembangkan bisnis dan teknologi masa depan Anda.</p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Links</h4>
            <ul className="space-y-2 text-sm">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Newsletter</h4>
            <p className="mb-3 text-sm text-gray-400">Dapatkan berita dan update terbaru.</p>
            <form className="flex gap-2">
              <Input type="email" placeholder="Email kamu" className="border-gray-700 bg-gray-800 text-white placeholder:text-gray-500" />
              <Button type="submit" size="sm">
                Kirim
              </Button>
            </form>
          </div>
        </div>

        <Separator className="my-8 bg-gray-800" />

        <div className="text-center text-xs text-gray-500">&copy; {new Date().getFullYear()} HuniLink. All rights reserved.</div>
      </div>
    </footer>
  );
}
