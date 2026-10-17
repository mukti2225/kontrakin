"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Receipt,
  Wrench,
  FileText,
  User,
} from "lucide-react";

export function TenantBottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Beranda",
      href: "/dashboard/tenant",
      icon: Home,
      isActive: pathname === "/dashboard/tenant",
    },
    {
      label: "Tagihan",
      href: "/dashboard/tenant/tagihan",
      icon: Receipt,
      isActive: pathname.startsWith("/dashboard/tenant/tagihan"),
    },
    {
      label: "Keluhan",
      href: "/dashboard/tenant/keluhan",
      icon: Wrench,
      isActive: pathname.startsWith("/dashboard/tenant/keluhan"),
    },
    {
      label: "Kontrak",
      href: "/dashboard/tenant/kontrak",
      icon: FileText,
      isActive: pathname.startsWith("/dashboard/tenant/kontrak"),
    },
    {
      label: "Profil",
      href: "/dashboard/tenant/pengaturan",
      icon: User,
      isActive: pathname.startsWith("/dashboard/tenant/pengaturan"),
    },
  ];

  return (
    <nav
      aria-label="Navigasi Bawah Tenant"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/90 bg-white/95 backdrop-blur-md px-2 py-1.5 sm:hidden shadow-lg print:hidden"
    >
      <div className="flex items-center justify-around gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center rounded-xl py-1 text-center transition-all min-h-[48px] active:scale-95 ${
                item.isActive
                  ? "text-emerald-700 font-bold bg-emerald-50/80"
                  : "text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon
                className={`size-5 transition-transform ${
                  item.isActive ? "text-emerald-600 scale-110" : "text-slate-500"
                }`}
              />
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
