import { SiteHeader } from "@/components/layout/SiteHeader";
import { StatCards } from "@/components/dashboard/StatCards";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { OccupancyChart } from "@/components/dashboard/OccupancyChart";
import { RoomStatus } from "@/components/dashboard/RoomStatus";
import { RecentPayments } from "@/components/dashboard/RecentPayments";
import { getDashboardData } from "@/lib/services/dashboard";

export default async function DashboardPage() {
  const data = await getDashboardData();
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader title="Dashboard" subtitle="Selamat datang di dashboard Anda" />
      <main className="flex-1 space-y-6 p-4 sm:p-6">
        <StatCards stats={data.stats} />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <RevenueChart data={data.pendapatanBulanan} />
          <OccupancyChart data={data.okupansiBulanan} />
        </div>
        <RoomStatus data={data.kamar} />
        <RecentPayments data={data.pembayaranTerbaru} />
      </main>
    </div>
  );
}
