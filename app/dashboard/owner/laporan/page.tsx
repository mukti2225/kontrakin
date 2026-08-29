import { getCurrentUser } from "@/lib/auth/get-current-user";
import { pemeliharaanService } from "@/lib/services/pemeliharaan.service";
import { redirect } from "next/navigation";
import { LaporanClient } from "./laporan-client";

export default async function OwnerPemeliharaanPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "owner" && user.role !== "super-admin")) redirect("/unauthorized");

  const ownerId = user.id;
  const pemeliharaanList = await pemeliharaanService.getOwnerPemeliharaan(ownerId);

  return <LaporanClient initialData={pemeliharaanList} />;
}
