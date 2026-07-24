"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, LayoutDashboard, BedDouble, Users, Receipt, FileText, Settings, LogOut, MessageSquare, Activity } from "lucide-react";

import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail } from "@/components/ui/sidebar";
import { signOut } from "@/lib/auth/client";

const ownerNavItems = [
  { title: "Ringkasan", url: "/dashboard/owner", icon: LayoutDashboard },
  { title: "Kamar", url: "/dashboard/owner/kamar", icon: BedDouble },
  { title: "Penyewa", url: "/dashboard/owner/penyewa", icon: Users },
  { title: "Pembayaran", url: "/dashboard/owner/pembayaran", icon: Receipt },
  { title: "Kontrak", url: "/dashboard/owner/kontrak", icon: FileText },
];

const tenantNavItems = [
  { title: "Ringkasan", url: "/dashboard/tenant", icon: LayoutDashboard },
  { title: "Tagihan Saya", url: "/dashboard/tenant/tagihan", icon: Receipt },
  { title: "Lapor Keluhan", url: "/dashboard/tenant/keluhan", icon: MessageSquare },
  { title: "Kontrak", url: "/dashboard/tenant/kontrak", icon: FileText },
];

const superAdminNavItems = [
  { title: "Ringkasan", url: "/dashboard/admin", icon: LayoutDashboard },
  { title: "Daftar Pemilik Kos", url: "/dashboard/admin/users", icon: Users },
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
    roleTitle = "Penyewa";
    basePath = "/dashboard/tenant";
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href={basePath} />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-teal-700 text-white">
                <Building2 className="size-4" />
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-semibold">Kontrakin</span>
                <span className="truncate text-xs text-sidebar-foreground/70">Portal {roleTitle}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu utama</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {currentNavItems.map((item) => {
                const isActive = item.url === basePath ? pathname === item.url : pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton isActive={isActive} tooltip={item.title} render={<Link href={item.url} />}>
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu className="space-y-1">
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Pengaturan" render={<Link href={`${basePath}/pengaturan`} />}>
              <Settings />
              <span>Pengaturan</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Keluar" onClick={handleLogout}>
              <LogOut />
              <span>Keluar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
