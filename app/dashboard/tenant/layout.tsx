import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { TenantBottomNav } from "@/components/layout/TenantBottomNav";

const ALLOWED_ROLES = "tenant";

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user || !user.role || user.role !== ALLOWED_ROLES) redirect("/unauthorized");

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 sm:pb-8">
      {children}
      <TenantBottomNav />
    </div>
  );
}

