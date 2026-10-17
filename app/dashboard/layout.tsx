import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let organizationName: string | undefined;
  if (user.role === "owner" || user.role === "staff") {
    try {
      const { getOrCreateUserOrganization } = await import("@/lib/auth/organization");
      const { organization } = await getOrCreateUserOrganization(user.id, user.name);
      organizationName = organization.name;
    } catch {
      // Graceful fallback
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-slate-50 flex flex-col min-h-screen">
        <DashboardHeader user={user} organizationName={organizationName} />
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
