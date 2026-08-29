"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  DoorOpen,
  Receipt,
  MessageSquare,
  FileText,
  Settings,
  HelpCircle,
  LogOut,
  LayoutDashboard,
  Users,
  Activity,
  Download,
  Smartphone,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { signOut } from "@/lib/auth/client";

// ─── Nav definitions ──────────────────────────────────────────────────────────

const ownerMenuItems = [
  { title: "Beranda", url: "/dashboard/owner", icon: Home },
  { title: "Properti & Kamar", url: "/dashboard/owner/properti", icon: DoorOpen },
  { title: "Tagihan", url: "/dashboard/owner/keuangan", icon: Receipt },
  { title: "Pesan", url: "/dashboard/owner/pesan", icon: MessageSquare },
  { title: "Laporan", url: "/dashboard/owner/laporan", icon: FileText },
];

const ownerGeneralItems = [
  { title: "Pengaturan", url: "/dashboard/owner/pengaturan", icon: Settings },
  { title: "Bantuan", url: "/dashboard/owner/bantuan", icon: HelpCircle },
];

const tenantMenuItems = [
  { title: "Beranda", url: "/dashboard/tenant", icon: Home },
  { title: "Tagihan Saya", url: "/dashboard/tenant/tagihan", icon: Receipt },
  { title: "Kontrak & Aturan", url: "/dashboard/tenant/kontrak", icon: FileText },
  { title: "Lapor Keluhan", url: "/dashboard/tenant/keluhan", icon: MessageSquare },
];

const tenantGeneralItems = [
  { title: "Pengaturan", url: "/dashboard/tenant/pengaturan", icon: Settings },
  { title: "Bantuan", url: "/dashboard/tenant/bantuan", icon: HelpCircle },
];

const adminMenuItems = [
  { title: "Dashboard", url: "/dashboard/admin", icon: LayoutDashboard },
  { title: "Daftar Pemilik Kos", url: "/dashboard/admin/users", icon: Users },
  { title: "Paket & Berlangganan", url: "/dashboard/admin/paket", icon: Receipt },
  { title: "Log Sistem", url: "/dashboard/admin/logs", icon: Activity },
];

const adminGeneralItems = [
  { title: "Pengaturan", url: "/dashboard/admin/pengaturan", icon: Settings },
];

// ─── Nav item component ───────────────────────────────────────────────────────

function NavItem({
  item,
  basePath,
  pathname,
}: {
  item: { title: string; url: string; icon: React.ElementType };
  basePath: string;
  pathname: string;
}) {
  const isActive =
    item.url === basePath ? pathname === item.url : pathname.startsWith(item.url);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        tooltip={item.title}
        render={<Link href={item.url} />}
        className={[
          "h-10 rounded-xl px-3 text-sm font-medium",
          "transition-[background-color,color] duration-200 ease-out",
          "text-white/75 hover:bg-white/10 hover:text-white",
          "data-[active=true]:bg-white data-[active=true]:text-teal-700 data-[active=true]:shadow-sm",
          "data-[active=true]:hover:bg-white data-[active=true]:hover:text-teal-700",
        ].join(" ")}
      >
        <item.icon className="size-4" />
        <span>{item.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

// ─── Main sidebar ─────────────────────────────────────────────────────────────

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const isSuperAdmin = pathname.startsWith("/dashboard/admin");
  const isTenant = pathname.startsWith("/dashboard/tenant");

  let menuItems = ownerMenuItems;
  let generalItems = ownerGeneralItems;
  let basePath = "/dashboard/owner";
  let roleTitle = "Pemilik Kos";

  if (isSuperAdmin) {
    menuItems = adminMenuItems;
    generalItems = adminGeneralItems;
    basePath = "/dashboard/admin";
    roleTitle = "Super Admin";
  } else if (isTenant) {
    menuItems = tenantMenuItems;
    generalItems = tenantGeneralItems;
    basePath = "/dashboard/tenant";
    roleTitle = "Penghuni";
  }

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <Sidebar collapsible="icon" className="border-none">
      <div className="flex h-full w-full flex-col bg-gradient-to-b from-teal-500 via-teal-600 to-teal-800 text-white shadow-xl md:rounded-r-[10px]">

        {/* ── Logo ────────────────────────────────────────────────── */}
        <SidebarHeader className="px-4 py-5">
          <Link href={basePath} className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white">
              <Image
                src="/icon-aja.png"
                alt="Kontrakin"
                width={20}
                height={20}
                className="drop-shadow-sm"
              />
            </div>
            <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
              <span className="text-base font-bold tracking-tight text-white">
                Huni<span className="text-yellow-300">Link</span>
              </span>
              <span className="text-[11px] text-white/60">Portal {roleTitle}</span>
            </div>
          </Link>
        </SidebarHeader>

        {/* ── Nav ─────────────────────────────────────────────────── */}
        <SidebarContent className="px-2">
          {/* MENU section */}
          <SidebarGroup>
            <SidebarGroupLabel className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/40 group-data-[collapsible=icon]:hidden">
              Menu
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {menuItems.map((item) => (
                  <NavItem key={item.url} item={item} basePath={basePath} pathname={pathname} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* GENERAL section */}
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/40 group-data-[collapsible=icon]:hidden">
              General
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {generalItems.map((item) => (
                  <NavItem key={item.url} item={item} basePath={basePath} pathname={pathname} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <SidebarFooter className="px-3 pb-4 pt-2">
          {/* Download Mobile App card */}
          <div className="mb-3 overflow-hidden rounded-2xl bg-white/10 p-3 ring-1 ring-white/10 group-data-[collapsible=icon]:hidden">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-white/15">
                <Smartphone className="size-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white">Download our Mobile App</p>
                <p className="text-[10px] text-white/50">Manage anywhere</p>
              </div>
            </div>
            <button className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-teal-900/60 py-1.5 text-xs font-medium text-white transition hover:bg-teal-900/80">
              <Download className="size-3" />
              Download
            </button>
          </div>

          {/* Logout */}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Keluar"
                onClick={handleLogout}
                className="h-10 rounded-xl px-3 text-sm font-semibold text-red-300 transition-colors hover:bg-white/10 hover:text-red-300"
              >
                <LogOut className="size-4" />
                <span>Keluar</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </div>
      <SidebarRail />
    </Sidebar>
  );
}
