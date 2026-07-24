import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-slate-50">{children}</SidebarInset>
    </SidebarProvider>
  );
}

// return (
//   <div className="flex min-h-svh flex-col">
//     <SiteHeader title="Dashboard" subtitle="Selamat datang di dashboard Anda" />
//     <main className="flex-1 space-y-6 p-4 sm:p-6">
//       {/* <StatCards stats={data.stats} />
//       <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
//         <RevenueChart data={data.pendapatanBulanan} />
//         <OccupancyChart data={data.okupansiBulanan} />
//       </div>
//       <RoomStatus data={data.kamar} />
//       <RecentPayments data={data.pembayaranTerbaru} /> */}
//     </main>
//   </div>
// );
