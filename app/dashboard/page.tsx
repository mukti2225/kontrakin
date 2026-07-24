import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  switch (user.role) {
    case "super-admin":
      redirect("/dashboard/admin");
    case "owner":
      redirect("/dashboard/owner");
    case "tenant":
      redirect("/dashboard/tenant");
    default:
      redirect("/unauthorized");
  }
}
