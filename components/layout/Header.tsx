"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth/client";

const NAV_ITEMS = [
  { href: "#fitur", label: "Fitur" },
  { href: "#integrasi", label: "Integrasi" },
  { href: "#otomatisasi", label: "Automasi AI" },
  { href: "#keunggulan", label: "Keunggulan" },
  { href: "#faq", label: "FAQ" },
] as const;

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data: session, isPending } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200/70 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6 sm:px-8">
        <div className="flex items-center gap-2.5">
          <Image src="/icon-aja.png" alt="Huni Link" width={28} height={28} className="rounded-md" />
          <Link href="/" className="shrink-0 text-xl font-bold tracking-tight text-neutral-900">
            Huni<span className="text-[#0FA37F]">Link.</span>
          </Link>
        </div>

        {/* Desktop nav */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="gap-1">
            {NAV_ITEMS.map((item) => (
              <NavigationMenuItem key={item.href}>
                <NavigationMenuLink
                  render={<Link href={item.href} />}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "h-9 rounded-full bg-transparent px-4 text-[13px] font-medium text-neutral-600 hover:bg-neutral-100/80 hover:text-neutral-950 focus-visible:ring-[#0FA37F]/40",
                    pathname === item.href && "font-semibold text-neutral-950",
                  )}
                >
                  {item.label}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 md:flex">
          {isPending ? (
            <div className="h-9 w-20 animate-pulse bg-muted rounded-full"></div>
          ) : session ? (
            <div className="flex items-center gap-4">
              <span className="text-xs font-medium text-neutral-600">Hai, {session.user.name}</span>
              <Button render={<Link href="/dashboard" />} nativeButton={false} className="rounded-full bg-neutral-900 text-xs px-4 h-9 hover:bg-[#0FA37F]">
                Dashboard
              </Button>
            </div>
          ) : (
            <>
              <Button variant="ghost" className="text-[13px] font-medium text-neutral-700 hover:bg-neutral-100 rounded-full px-4" render={<Link href="/login" />} nativeButton={false}>
                Masuk
              </Button>
              <Button className="h-9 rounded-full bg-neutral-900 px-5 text-[13px] font-medium text-white shadow-sm hover:bg-[#0FA37F] transition-colors" render={<Link href="/register" />} nativeButton={false}>
                Mulai Gratis
              </Button>
            </>
          )}
        </div>

        {/* Mobile */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Buka menu" aria-expanded={open} className="text-[#12141B] hover:bg-[#EAF6F1] md:hidden" />}>
            <Menu className="h-6 w-6" />
          </SheetTrigger>

          <SheetContent side="right" className="border-[#E5E5E0] bg-[#FAFAF8]">
            <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>

            <nav className="mt-8 flex flex-col gap-4 p-6">
              {NAV_ITEMS.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={cn("text-base text-[#4B4F58]", pathname === item.href && "font-semibold text-[#12141B]")}>
                  {item.label}
                </Link>
              ))}

              <div className="mt-6 flex flex-col gap-2">
                {isPending ? (
                  <div className="h-9 w-full animate-pulse bg-muted rounded-md"></div>
                ) : session ? (
                  <>
                    <div className="text-sm font-medium mb-2">Hai, {session.user.name}</div>
                    <Button render={<Link href="/dashboard" onClick={() => setOpen(false)} />} nativeButton={false}>
                      Dashboard
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="rounded-full border-[#E5E5E0]" render={<Link href="/login" onClick={() => setOpen(false)} />} nativeButton={false}>
                      Masuk
                    </Button>
                    <Button className="rounded-full bg-[#12141B] text-[#FAFAF8] hover:bg-[#0FA37F]" render={<Link href="/register" onClick={() => setOpen(false)} />} nativeButton={false}>
                      Mulai Gratis
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
