import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/db/prisma";
import { pemeliharaanService } from "@/lib/services/pemeliharaan.service";
import { redirect } from "next/navigation";
import { TenantKeluhanClient, type TenantKeluhanDTO } from "./keluhan-client";

export default async function TenantKeluhanPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "tenant") redirect("/unauthorized");

  const penghuni = await prisma.penghuni.findFirst({
    where: {
      OR: [
        { userId: user.id },
        { email: user.email },
      ],
      status: "aktif",
    },
    include: {
      kamar: {
        include: {
          owner: { select: { name: true, email: true } },
        },
      },
    },
  });

  const penghuniId = penghuni?.id ?? "";
  const ownerId = penghuni?.ownerId ?? "";
  const kamarId = penghuni?.kamarId ?? "";

  const rawKeluhan = penghuniId ? await pemeliharaanService.getTenantKeluhan(penghuniId) : [];

  const keluhanList: TenantKeluhanDTO[] = rawKeluhan.map((k) => ({
    id: k.id,
    judul: k.judul,
    deskripsi: k.deskripsi,
    kategori: k.kategori,
    prioritas: (k.prioritas as any) || "sedang",
    status: (k.status as any) || "menunggu",
    tanggalDibuat: typeof k.tanggalDibuat === "string" ? k.tanggalDibuat : new Date(k.tanggalDibuat).toISOString(),
    kamarNomor: penghuni?.kamar?.nomor,
  }));

  return (
    <TenantKeluhanClient
      penghuniId={penghuniId}
      ownerId={ownerId}
      kamarId={kamarId}
      ownerPhone="628123456789"
      keluhanList={keluhanList}
    />
  );
}
