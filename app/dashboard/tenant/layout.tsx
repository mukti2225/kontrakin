import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { SiteHeader } from "@/components/layout/SiteHeader";

const ALLOWED_ROLES = "tenant";

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user || !user.role || user.role !== ALLOWED_ROLES) redirect("/unauthorized");

  return (
    <>
      <SiteHeader subtitle="Selamat datang di dashboard Anda" />
      {children}
    </>
  );
}
