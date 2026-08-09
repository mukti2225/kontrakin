"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, LayoutDashboard, BedDouble, Users, Receipt, FileText, Settings, LogOut, MessageSquare, Activity } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, SidebarTrigger } from "@/components/ui/sidebar";
import { signOut } from "@/lib/auth/client";

const ownerNavItems = [
  { title: "Dashboard", url: "/dashboard/owner", icon: LayoutDashboard },
  { title: "Manajemen Properti", url: "/dashboard/owner/properti", icon: Building2 },
  { title: "Manajemen Unit", url: "/dashboard/owner/kamar", icon: BedDouble },
  { title: "Daftar Penghuni", url: "/dashboard/owner/penghuni", icon: Users },
  { title: "Keuangan dan Tagihan", url: "/dashboard/owner/keuangan", icon: Receipt },
  { title: "Pemeliharaan", url: "/dashboard/owner/pemeliharaan", icon: Receipt },
];

const tenantNavItems = [
  { title: "Dashboard", url: "/dashboard/tenant", icon: LayoutDashboard },
  { title: "Tagihan Saya", url: "/dashboard/tenant/tagihan", icon: Receipt },
  { title: "Kontrak & Aturan", url: "/dashboard/tenant/kontrak", icon: FileText },
  { title: "Lapor Keluhan", url: "/dashboard/tenant/keluhan", icon: MessageSquare },
];

const superAdminNavItems = [
  { title: "Dashboard", url: "/dashboard/admin", icon: LayoutDashboard },
  { title: "Daftar Pemilik Kos", url: "/dashboard/admin/users", icon: Users },
  { title: "Paket dan Berlangganan", url: "/dashboard/admin/paket", icon: Users },
  { title: "Log Sistem", url: "/dashboard/admin/logs", icon: Activity },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  let currentNavItems = ownerNavItems;
  let roleTitle = "Pemilik Kos";
  let basePath = "/dashboard/owner";

  const isSuperAdmin = pathname.startsWith("/dashboard/admin");
  const isTenant = pathname.startsWith("/dashboard/tenant");
  const isOwner = pathname.startsWith("/dashboard/owner") || (!isSuperAdmin && !isTenant);

  if (isSuperAdmin) {
    currentNavItems = superAdminNavItems;
    roleTitle = "Super Admin";
    basePath = "/dashboard/admin";
  } else if (isTenant) {
    currentNavItems = tenantNavItems;
    roleTitle = "Penghuni";
    basePath = "/dashboard/tenant";
  }

  return (
    <Sidebar collapsible="icon" className="border-none">
      <div className="flex h-full w-full flex-col bg-linear-to-b from-teal-500 via-teal-600 to-teal-800 text-white shadow-xl md:rounded-r-[10px]">
        {/* Logo */}
        <SidebarHeader className="py-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href={basePath} className="flex flex-1 items-center gap-2 rounded-md text-white">
                <div className="flex aspect-square size-9 shrink-0 items-center justify-center rounded-md bg-yellow-400 text-teal-900 shadow-sm">
                  <Building2 className="size-5 transition-opacity group-data-[collapsible=icon]:group-hover/logo:opacity-0" />
                </div>
                <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate text-lg font-bold tracking-tight">
                    Huni<span className="text-yellow-300">Link</span>
                  </span>
                  <span className="truncate text-xs text-white/70">Portal {roleTitle}</span>
                </div>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* Nav */}
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="px-2 text-xs font-medium uppercase tracking-wider text-white/50 group-data-[collapsible=icon]:hidden">Menu utama</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1.5">
                {currentNavItems.map((item) => {
                  const isActive = item.url === basePath ? pathname === item.url : pathname.startsWith(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.title}
                        render={<Link href={item.url} />}
                        className={[
                          "h-11 rounded-xl px-3 text-sm font-medium",
                          "transition-[background-color,color,box-shadow] duration-300 ease-out",
                          "text-white/80 hover:bg-white/10 hover:text-white",
                          "data-[active=true]:bg-white data-[active=true]:text-teal-700 data-[active=true]:shadow-md data-[active=true]:hover:bg-white data-[active=true]:hover:text-teal-700",
                        ].join(" ")}
                      >
                        <item.icon className="size-4.5" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className="pb-4">
          <SidebarMenu className="space-y-1.5">
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Pengaturan"
                render={<Link href={`${basePath}/pengaturan`} />}
                className="h-11 rounded-xl px-3 text-sm font-medium text-white/80 transition-colors duration-300 ease-out hover:bg-white/10 hover:text-white"
              >
                <Settings className="size-4.5" />
                <span>Pengaturan</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Keluar" onClick={handleLogout} className="h-11 rounded-xl px-3 text-sm font-semibold text-red-500 transition-colors duration-300 ease-out hover:bg-white/10 hover:text-red-500">
                <LogOut className="size-4.5" />
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
