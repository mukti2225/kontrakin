"use server";

import { prisma } from "@/lib/db/prisma";
import { requireOrganization } from "@/lib/auth/get-current-user";

export interface MonthlyMetric {
  month: string;
  monthIndex: number;
  revenue: number;
  expenses: number;
  netIncome: number;
}

export interface UnitProfitability {
  kamarId: string;
  nomor: string;
  propertiNama: string;
  tipe: string;
  status: string;
  penghuniNama: string | null;
  revenue: number;
  expenses: number;
  netContribution: number;
}

export interface PortfolioReportResult {
  year: number;
  totalRevenue: number;
  totalExpenses: number;
  netOperatingIncome: number;
  collectionRate: number;
  physicalOccupancy: number;
  totalKamar: number;
  kamarTerisi: number;
  monthlyTrends: MonthlyMetric[];
  unitProfitability: UnitProfitability[];
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

export async function getPortfolioReport(year: number = new Date().getFullYear(), propertyId?: string): Promise<PortfolioReportResult> {
  const { user, organization } = await requireOrganization();

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

  // 1. Fetch Rooms & Properties
  const kamarWhere: any = {
    OR: [{ ownerId: user.id }, { organizationId: organization.id }],
  };
  if (propertyId && propertyId !== "all") {
    kamarWhere.propertiId = propertyId;
  }

  const kamars = await prisma.kamar.findMany({
    where: kamarWhere,
    include: {
      properti: { select: { nama: true } },
      penghuni: { where: { status: "aktif" }, select: { nama: true }, take: 1 },
    },
    orderBy: { nomor: "asc" },
  });

  const kamarIds = kamars.map((k) => k.id);

  // 2. Fetch Transactions for this year
  const transaksiList = await prisma.transaksi.findMany({
    where: {
      OR: [{ ownerId: user.id }, { organizationId: organization.id }],
      tanggal: { gte: startDate, lte: endDate },
      ...(kamarIds.length > 0 ? { OR: [{ kamarId: { in: kamarIds } }, { kamarId: null }] } : {}),
    },
  });

  // 3. Fetch Invoices for this year
  const invoiceList = await prisma.invoice.findMany({
    where: {
      organizationId: organization.id,
      issueDate: { gte: startDate, lte: endDate },
    },
  });

  // Calculate Monthly Trends (12 months)
  const monthlyTrends: MonthlyMetric[] = MONTH_LABELS.map((label, idx) => ({
    month: label,
    monthIndex: idx,
    revenue: 0,
    expenses: 0,
    netIncome: 0,
  }));

  let totalRevenue = 0;
  let totalExpenses = 0;

  for (const t of transaksiList) {
    const m = new Date(t.tanggal).getMonth();
    if (t.jenis === "pemasukan") {
      totalRevenue += t.jumlah;
      monthlyTrends[m].revenue += t.jumlah;
    } else {
      totalExpenses += t.jumlah;
      monthlyTrends[m].expenses += t.jumlah;
    }
  }

  monthlyTrends.forEach((m) => {
    m.netIncome = m.revenue - m.expenses;
  });

  const netOperatingIncome = totalRevenue - totalExpenses;

  // Collection Rate
  const totalBilled = invoiceList.reduce((sum, inv) => sum + Number(inv.total), 0);
  const totalCollected = invoiceList.reduce((sum, inv) => sum + (Number(inv.total) - Number(inv.balanceDue)), 0);
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 100;

  // Occupancy Rate
  const totalKamar = kamars.length;
  const kamarTerisi = kamars.filter((k) => k.status === "terisi").length;
  const physicalOccupancy = totalKamar > 0 ? Math.round((kamarTerisi / totalKamar) * 100) : 0;

  // Unit-Level Contribution
  const unitProfitability: UnitProfitability[] = kamars.map((k) => {
    const roomTx = transaksiList.filter((t) => t.kamarId === k.id);
    const roomRevenue = roomTx
      .filter((t) => t.jenis === "pemasukan")
      .reduce((s, t) => s + t.jumlah, 0);
    const roomExpenses = roomTx
      .filter((t) => t.jenis === "pengeluaran")
      .reduce((s, t) => s + t.jumlah, 0);

    return {
      kamarId: k.id,
      nomor: k.nomor,
      propertiNama: k.properti?.nama || "Kost",
      tipe: k.tipe,
      status: k.status,
      penghuniNama: k.penghuni[0]?.nama || null,
      revenue: roomRevenue,
      expenses: roomExpenses,
      netContribution: roomRevenue - roomExpenses,
    };
  });

  return {
    year,
    totalRevenue,
    totalExpenses,
    netOperatingIncome,
    collectionRate,
    physicalOccupancy,
    totalKamar,
    kamarTerisi,
    monthlyTrends,
    unitProfitability,
  };
}

export async function getExecutiveSummaryAction(
  year: number = new Date().getFullYear(),
  propertyId?: string
) {
  const { user, organization } = await requireOrganization();
  const report = await getPortfolioReport(year, propertyId);

  // Fetch active tenants and their invoices for delinquency scoring
  const tenants = await prisma.penghuni.findMany({
    where: {
      OR: [{ ownerId: user.id }, { organizationId: organization.id }],
      status: "aktif",
    },
    include: {
      kamar: {
        include: { properti: true },
      },
      invoices: {
        orderBy: { dueDate: "desc" },
      },
    },
  });

  const { evaluateTenantCollectionRisk } = await import("@/lib/intelligence/collection-risk");
  const { generateExecutiveSummary } = await import("@/lib/intelligence/portfolio-summary");

  const tenantRiskProfiles = tenants.map((t) => {
    return evaluateTenantCollectionRisk({
      penghuniId: t.id,
      penghuniNama: t.nama,
      penghuniNoHp: t.noHp,
      kamarNomor: t.kamar?.nomor || null,
      propertiNama: t.kamar?.properti?.nama || null,
      invoices: t.invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        total: Number(inv.total),
        balanceDue: Number(inv.balanceDue),
        dueDate: inv.dueDate,
        status: inv.status,
        createdAt: inv.createdAt,
        paidAt: inv.status === "paid" ? inv.updatedAt : null,
      })),
    });
  });

  return generateExecutiveSummary(report, tenantRiskProfiles);
}
