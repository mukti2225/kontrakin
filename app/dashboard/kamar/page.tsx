import { getDashboardData } from "@/lib/services/dashboard";

export default async function DashboardPage() {
  const data = await getDashboardData();
  return (
    <div className="flex min-h-svh flex-col">
      <main className="flex-1 space-y-6 p-4 sm:p-6">
        <h1 className="text-2xl font-bold">Kamar Page</h1>
      </main>
    </div>
  );
}
