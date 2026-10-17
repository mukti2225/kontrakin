import type { PortfolioReportResult } from "@/app/dashboard/owner/laporan/action";
import type { CollectionRiskProfile } from "./collection-risk";
import { formatRupiah } from "@/lib/utils";

export interface ExecutiveSummaryReport {
  generatedAt: string;
  year: number;
  headline: string;
  financialHealth: {
    totalRevenueFormatted: string;
    totalExpensesFormatted: string;
    noiFormatted: string;
    operatingMargin: number; // percentage
    collectionRate: number; // percentage
    economicOccupancyRate: number; // percentage
  };
  operationalHighlights: string[];
  lossMakingUnits: Array<{
    nomor: string;
    propertiNama: string;
    penghuniNama?: string | null;
    revenueFormatted: string;
    expensesFormatted: string;
    netLossFormatted: string;
  }>;
  delinquencyWatchlist: CollectionRiskProfile[];
  strategicRecommendations: string[];
}

/**
 * Generates an executive natural-language portfolio summary and operational advisory
 * based strictly on verified portfolio financials, unit contributions, and tenant behaviors.
 */
export function generateExecutiveSummary(
  report: PortfolioReportResult,
  tenantRiskProfiles: CollectionRiskProfile[] = []
): ExecutiveSummaryReport {
  const operatingMargin =
    report.totalRevenue > 0
      ? Math.round((report.netOperatingIncome / report.totalRevenue) * 100)
      : 0;

  // Identify loss-making units
  const lossUnits = report.unitProfitability
    .filter((u) => u.netContribution < 0)
    .map((u) => ({
      nomor: u.nomor,
      propertiNama: u.propertiNama,
      penghuniNama: u.penghuniNama,
      revenueFormatted: formatRupiah(u.revenue),
      expensesFormatted: formatRupiah(u.expenses),
      netLossFormatted: formatRupiah(Math.abs(u.netContribution)),
    }));

  // Identify high-risk tenants
  const highRiskTenants = tenantRiskProfiles.filter((p) => p.riskLevel === "high" || p.riskLevel === "medium");

  const highlights: string[] = [];

  // Revenue & NOI highlight
  if (report.netOperatingIncome > 0) {
    highlights.push(
      `Portofolio mencatatkan Net Operating Income (NOI) positif sebesar ${formatRupiah(
        report.netOperatingIncome
      )} dengan margin operasional ${operatingMargin}%.`
    );
  } else {
    highlights.push(
      `Perhatian: Net Operating Income tercatat negatif sebesar ${formatRupiah(
        Math.abs(report.netOperatingIncome)
      )}, pengeluaran melampaui pendapatan sewa periode berjalan.`
    );
  }

  // Occupancy & Collection highlight
  highlights.push(
    `Tingkat okupansi fisik tercatat ${report.physicalOccupancy}% (${report.kamarTerisi} dari ${report.totalKamar} kamar terisi) dengan efisiensi penagihan sewa sebesar ${report.collectionRate}%.`
  );

  // Recommendations
  const recommendations: string[] = [];

  if (lossUnits.length > 0) {
    recommendations.push(
      `Terdapat ${lossUnits.length} kamar dengan kontribusi margin negatif akibat tingginya biaya perbaikan/operasional. Evaluasi vendor pemeliharaan atau sesuaikan tarif sewa pada kamar tersebut.`
    );
  } else {
    recommendations.push("Seluruh kamar yang beroperasi memberikan kontribusi kas positif bagi portofolio.");
  }

  if (highRiskTenants.length > 0) {
    const highCount = highRiskTenants.filter((t) => t.riskLevel === "high").length;
    recommendations.push(
      `Terdapat ${highCount} penyewa dalam pantauan risiko tinggi penagihan. Disarankan untuk segera mengirimkan eskalasi pesan WhatsApp resmi dan mengunci deposit sebagai jaminan.`
    );
  } else {
    recommendations.push("Kolektibilitas tagihan penyewa berada dalam kondisi prima tanpa indikasi gagal bayar kritis.");
  }

  if (report.totalKamar - report.kamarTerisi > 0) {
    const vacantCount = report.totalKamar - report.kamarTerisi;
    recommendations.push(
      `Maksimalkan potensi pendapatan dengan mempromosikan ${vacantCount} kamar yang saat ini berstatus kosong.`
    );
  }

  let headline = "Portofolio Rental Berkinerja Stabil";
  if (operatingMargin < 20 || lossUnits.length > 2) {
    headline = "Perlu Optimalisasi Biaya Operasional & Penagihan";
  } else if (report.collectionRate >= 95 && report.physicalOccupancy >= 90) {
    headline = "Kinerja Portofolio Prima (High Performing)";
  }

  return {
    generatedAt: new Date().toISOString(),
    year: report.year,
    headline,
    financialHealth: {
      totalRevenueFormatted: formatRupiah(report.totalRevenue),
      totalExpensesFormatted: formatRupiah(report.totalExpenses),
      noiFormatted: formatRupiah(report.netOperatingIncome),
      operatingMargin,
      collectionRate: report.collectionRate,
      economicOccupancyRate: report.physicalOccupancy,
    },
    operationalHighlights: highlights,
    lossMakingUnits: lossUnits,
    delinquencyWatchlist: highRiskTenants,
    strategicRecommendations: recommendations,
  };
}
