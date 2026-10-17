import { prisma } from "@/lib/db/prisma";
import { requireOrganization } from "@/lib/auth/get-current-user";
import { KeuanganClient } from "./keuangan-client";
import { getInvoiceList, getPaymentList } from "./action";

export default async function KeuanganPage() {
  const { user, organization } = await requireOrganization();
  const ownerId = user.id;

  const [
    transaksi,
    kamarList,
    penghuniList,
    invoices,
    propertiList,
    payments,
    vendorList,
    pemeliharaanList,
  ] = await Promise.all([
    prisma.transaksi.findMany({
      where: {
        OR: [{ ownerId }, { organizationId: organization.id }],
      },
      include: {
        kamar: {
          include: { properti: { select: { id: true, nama: true } } },
        },
        penghuni: true,
      },
      orderBy: { tanggal: "desc" },
    }),
    prisma.kamar.findMany({
      where: {
        OR: [{ ownerId }, { organizationId: organization.id }],
      },
      include: {
        properti: { select: { id: true, nama: true } },
      },
      orderBy: { nomor: "asc" },
    }),
    prisma.penghuni.findMany({
      where: {
        OR: [{ ownerId }, { organizationId: organization.id }],
        status: "aktif",
      },
      orderBy: { nama: "asc" },
    }),
    getInvoiceList(),
    prisma.properti.findMany({
      where: {
        OR: [{ ownerId }, { organizationId: organization.id }],
      },
      select: { id: true, nama: true },
      orderBy: { nama: "asc" },
    }),
    getPaymentList(),
    prisma.vendor.findMany({
      where: { organizationId: organization.id },
      orderBy: { name: "asc" },
    }),
    prisma.pemeliharaan.findMany({
      where: { organizationId: organization.id },
      select: {
        id: true,
        judul: true,
        status: true,
        kategori: true,
        kamarId: true,
        penghuniId: true,
        vendorId: true,
        kamar: {
          select: {
            id: true,
            nomor: true,
            properti: { select: { id: true, nama: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return (
    <KeuanganClient
      transaksi={transaksi}
      kamarList={kamarList}
      penghuniList={penghuniList}
      initialInvoices={invoices}
      propertiList={propertiList}
      initialPayments={payments}
      vendorList={vendorList}
      pemeliharaanList={pemeliharaanList}
    />
  );
}

