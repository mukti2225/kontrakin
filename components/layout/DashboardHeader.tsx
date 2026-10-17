"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  ChevronRight,
  Building,
  User,
  ShieldCheck,
  Bell,
  Search,
} from "lucide-react";
import { GlobalCommandPalette } from "./GlobalCommandPalette";

const ROUTE_TITLES: Record<string, string> = {
  "/dashboard/admin": "Platform Console",
  "/dashboard/admin/users": "Pengguna Platform",
  "/dashboard/admin/paket": "Paket & Berlangganan",
  "/dashboard/admin/logs": "Log Sistem",
  "/dashboard/owner": "Ringkasan Operasional",
  "/dashboard/owner/properti": "Properti & Kamar",
  "/dashboard/owner/penghuni": "Penyewa",
  "/dashboard/owner/kontrak": "Kontrak Sewa",
  "/dashboard/owner/keuangan": "Keuangan & Tagihan",
  "/dashboard/owner/pemeliharaan": "Pemeliharaan & Vendor",
  "/dashboard/owner/pesan": "Komunikasi & WhatsApp",
  "/dashboard/owner/laporan": "Laporan & AI Advisory",
  "/dashboard/owner/tim": "Tim & Staf Operasional",
  "/dashboard/owner/pengaturan": "Pengaturan Akun",
  "/dashboard/tenant": "Beranda Penyewa",
  "/dashboard/tenant/tagihan": "Tagihan & Pembayaran",
  "/dashboard/tenant/kontrak": "Kontrak & Aturan",
  "/dashboard/tenant/keluhan": "Lapor Keluhan",
  "/dashboard/tenant/pengaturan": "Pengaturan Akun",
};

interface DashboardHeaderProps {
  user: {
    name: string;
    email: string;
    role?: string | null;
  };
  organizationName?: string;
}

export function DashboardHeader({ user, organizationName }: DashboardHeaderProps) {
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Find longest matching title
  let currentTitle = "Dashboard";
  for (const [route, title] of Object.entries(ROUTE_TITLES)) {
    if (pathname === route || pathname.startsWith(route + "/")) {
      currentTitle = title;
    }
  }

  const roleBadge = (user.role || "user").toUpperCase();
  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase(); 

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-6">
        {/* ── Left: Hamburger Toggle & Breadcrumb ─────────────────────── */}
        <div className="flex items-center gap-3">
          <SidebarTrigger className="text-slate-600 hover:bg-slate-100 hover:text-slate-900" />
          <div className="hidden h-4 w-px bg-slate-200 sm:block" />

          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-800">{currentTitle}</span>
            {organizationName && (
              <span className="hidden items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 md:inline-flex">
                <Building className="size-3 text-slate-400" />
                {organizationName}
              </span>
            )}
          </div>
        </div>

        {/* ── Center: Search Trigger (Cmd+K) ─────────────────────────── */}
        <div className="mx-4 hidden max-w-xs flex-1 sm:block">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/75 px-3 py-1.5 text-xs text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <Search className="size-3.5 text-slate-400" />
              <span>Cari navigasi atau aksi...</span>
            </div>
            <kbd className="flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 shadow-2xs">
              <span className="text-[11px]">⌘</span>K
            </kbd>
          </button>
        </div>

        {/* ── Right: User Profile & Role Pill ────────────────────────── */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 sm:hidden"
            aria-label="Cari navigasi"
          >
            <Search className="size-4" />
          </button>

          <div className="hidden text-right sm:block">
            <p className="text-xs font-bold leading-tight text-slate-900">{user.name}</p>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-700">
              {roleBadge}
            </span>
          </div>

          <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-teal-800 text-xs font-bold text-white shadow-xs">
            {initials}
          </div>
        </div>
      </header>

      <GlobalCommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  );
}
