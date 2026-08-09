"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth/client";

const NAV_ITEMS = [
  { href: "/", label: "Beranda" },
  { href: "#fitur", label: "Fitur" },
  { href: "#harga", label: "Langganan" },
  { href: "#cta", label: "Kontak" },
] as const;

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data: session, isPending } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold shrink-0">
          HuniLink
        </Link>

        {/* Desktop nav */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="gap-1">
            {NAV_ITEMS.map((item) => (
              <NavigationMenuItem key={item.href}>
                <NavigationMenuLink render={<Link href={item.href} />} className={cn(navigationMenuTriggerStyle(), "bg-transparent", pathname === item.href && "text-primary font-semibold")}>
                  {item.label}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 md:flex">
          {isPending ? (
            <div className="h-9 w-20 animate-pulse bg-muted rounded-md"></div>
          ) : session ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Hai, {session.user.name}</span>
              <Button render={<Link href="/dashboard" />} nativeButton={false}>
                Dashboard
              </Button>
            </div>
          ) : (
            <>
              <Button variant="ghost" render={<Link href="/login" />} nativeButton={false}>
                Login
              </Button>
              <Button render={<Link href="/register" />} nativeButton={false}>
                Coba Trial
              </Button>
            </>
          )}
        </div>

        {/* Mobile */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Buka menu" className="md:hidden" />}>
            <Menu className="h-6 w-6" />
          </SheetTrigger>

          <SheetContent side="right">
            <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>

            <nav className="mt-8 flex flex-col gap-4 p-6">
              {NAV_ITEMS.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={cn("text-base", pathname === item.href && "text-primary font-semibold")}>
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
                    <Button variant="outline" render={<Link href="/login" onClick={() => setOpen(false)} />} nativeButton={false}>
                      Login
                    </Button>
                    <Button render={<Link href="/register" onClick={() => setOpen(false)} />} nativeButton={false}>
                      Coba Trial
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
