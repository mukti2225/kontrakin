import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  const normalizedRole = user.role?.toLowerCase().replace(/[^a-z]/g, "") || "";

  if (normalizedRole === "superadmin" || normalizedRole === "admin") {
    redirect("/dashboard/admin");
  } else if (normalizedRole === "owner" || normalizedRole === "staff") {
    redirect("/dashboard/owner");
  } else if (normalizedRole === "tenant") {
    redirect("/dashboard/tenant");
  } else {
    redirect("/unauthorized");
  }
}
