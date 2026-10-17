import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect } from "next/navigation";
import { getOrCreateKodeUndangan } from "./action";
import { PengaturanClient } from "./pengaturan-client";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const kode = await getOrCreateKodeUndangan();

  return (
    <PengaturanClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }}
      kode={kode}
    />
  );
}
