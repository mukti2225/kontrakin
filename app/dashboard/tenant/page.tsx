import { getTenantDashboardData } from "./action";
import { TenantClient } from "./tenant-client";

export default async function TenantDashboardPage() {
  const data = await getTenantDashboardData();
  return <TenantClient data={data} />;
}
