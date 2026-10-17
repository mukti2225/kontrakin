import { requireTenant } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/db/prisma";
import { TenantPengaturanClient, type TenantProfileDTO } from "./pengaturan-client";

export default async function TenantSettingsPage() {
  const user = await requireTenant();

  const penghuni = await prisma.penghuni.findFirst({
    where: {
      OR: [
        { userId: user.id },
        { email: user.email },
      ],
    },
    include: {
      kamar: {
        include: {
          properti: true,
          owner: { select: { name: true, email: true } },
        },
      },
    },
  });

  const profileData: TenantProfileDTO = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    penghuni: penghuni
      ? {
          id: penghuni.id,
          nama: penghuni.nama,
          noHp: penghuni.noHp,
          tanggalMasuk: penghuni.tanggalMasuk.toISOString(),
          status: penghuni.status,
        }
      : null,
    kamar: penghuni?.kamar
      ? {
          nomor: penghuni.kamar.nomor,
          tipe: penghuni.kamar.tipe,
          propertiNama: penghuni.kamar.properti?.nama || "Kost Kontrakin",
          propertiAlamat: penghuni.kamar.properti?.alamat || "-",
          ownerName: penghuni.kamar.owner?.name || "Pengelola",
          ownerPhone: "628123456789",
        }
      : null,
  };

  return <TenantPengaturanClient data={profileData} />;
}
