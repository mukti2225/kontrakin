import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (user?.role !== "super-admin") redirect("/unauthorized");

  return (
    <>
      <SiteHeader subtitle="Selamat datang di dashboard Anda" />
      {children}
    </>
  );
}
