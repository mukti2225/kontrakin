import { prisma } from "@/lib/db/prisma";
import { requireOwner } from "@/lib/auth/get-current-user";
import { KeuanganClient } from "./keuangan-client";

export default async function KeuanganPage() {
  const user = await requireOwner();
  const ownerId = user.id;

  const [transaksi, kamarList, penghuniList] = await Promise.all([
    prisma.transaksi.findMany({
      where: { ownerId },
      include: { kamar: true, penghuni: true },
      orderBy: { tanggal: "desc" },
    }),
    prisma.kamar.findMany({ where: { ownerId }, orderBy: { nomor: "asc" } }),
    prisma.penghuni.findMany({
      where: { ownerId, status: "aktif" },
      orderBy: { nama: "asc" },
    }),
  ]);

  return <KeuanganClient transaksi={transaksi} kamarList={kamarList} penghuniList={penghuniList} />;
}
