import { prisma } from "@/lib/db/prisma";
import { requireOrganization } from "@/lib/auth/get-current-user";
import { PemeliharaanClient } from "./pemeliharaan-client";
import { getPemeliharaanList, getVendorList } from "./action";
import { getTeamMembers } from "@/app/dashboard/owner/tim/action";

export default async function PemeliharaanPage() {
  const { user, organization } = await requireOrganization();
  const ownerId = user.id;

  const [items, vendors, propertiList, kamarList, penghuniList, teamMembers, maintenanceExpenses] = await Promise.all([
    getPemeliharaanList(),
    getVendorList(),
    prisma.properti.findMany({
      where: {
        OR: [{ ownerId }, { organizationId: organization.id }],
      },
      select: { id: true, nama: true },
      orderBy: { nama: "asc" },
    }),
    prisma.kamar.findMany({
      where: {
        OR: [{ ownerId }, { organizationId: organization.id }],
      },
      include: {
        properti: { select: { id: true, nama: true } },
        penghuni: {
          where: { status: "aktif" },
          select: { id: true, nama: true, noHp: true },
        },
      },
      orderBy: { nomor: "asc" },
    }),
    prisma.penghuni.findMany({
      where: {
        OR: [{ ownerId }, { organizationId: organization.id }],
        status: "aktif",
      },
      select: { id: true, nama: true, noHp: true, kamarId: true },
      orderBy: { nama: "asc" },
    }),
    getTeamMembers().catch(() => []),
    prisma.transaksi.findMany({
      where: {
        OR: [{ ownerId }, { organizationId: organization.id }],
        jenis: "pengeluaran",
        kategori: { in: ["Pemeliharaan", "Pemeliharaan: AC & Pendingin", "Pemeliharaan: Plumbing & Pompa Air", "Pemeliharaan: Kelistrikan", "Pemeliharaan: Bangunan & Sipil"] },
      },
      include: {
        kamar: {
          include: { properti: { select: { id: true, nama: true } } },
        },
      },
      orderBy: { tanggal: "desc" },
    }),
  ]);

  return (
    <PemeliharaanClient
      initialItems={items as any}
      initialVendors={vendors as any}
      propertiList={propertiList}
      kamarList={kamarList as any}
      penghuniList={penghuniList}
      teamMembers={teamMembers}
      initialExpenses={maintenanceExpenses.map((tx) => ({
        ...tx,
        tanggal: tx.tanggal.toISOString(),
        createdAt: tx.createdAt.toISOString(),
      })) as any}
    />
  );
}


