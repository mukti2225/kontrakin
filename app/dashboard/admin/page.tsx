import { getPlatformStats } from "./action";
import { AdminClient } from "./admin-client";

export default async function AdminPage() {
  const stats = await getPlatformStats();
  return <AdminClient stats={stats} />;
}
