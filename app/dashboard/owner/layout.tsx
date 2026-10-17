import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user || !user.role || (user.role !== "owner" && user.role !== "staff")) {
    redirect("/unauthorized");
  }

  return <>{children}</>;
}
