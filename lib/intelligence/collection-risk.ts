export interface InvoiceHistoryItem {
  id: string;
  invoiceNumber: string;
  total: number;
  balanceDue: number;
  dueDate: Date | string;
  status: string; // draft, issued, partial, paid, overdue, cancelled
  createdAt: Date | string;
  paidAt?: Date | string | null;
}

export interface CollectionRiskEvaluationInput {
  penghuniId: string;
  penghuniNama: string;
  penghuniNoHp: string;
  kamarNomor?: string | null;
  propertiNama?: string | null;
  invoices: InvoiceHistoryItem[];
}

export type RiskLevel = "low" | "medium" | "high";

export interface CollectionRiskProfile {
  penghuniId: string;
  penghuniNama: string;
  penghuniNoHp: string;
  kamarNomor: string;
  propertiNama: string;
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  riskLevelLabel: string;
  totalInvoiced: number;
  totalOutstanding: number;
  overdueInvoicesCount: number;
  maxDaysOverdue: number;
  averagePaymentDelayDays: number;
  riskFactors: string[];
  recommendedAction: string;
  suggestedTemplateKey: "reminder_h5" | "reminder_h1" | "reminder_due" | "overdue_h1" | "receipt_paid";
}

/**
 * Evaluates tenant delinquency and collection risk based on verified invoice and payment timelines.
 * Strictly non-destructive, explainable, and production-safe.
 */
export function evaluateTenantCollectionRisk(
  input: CollectionRiskEvaluationInput,
  referenceDate: Date = new Date()
): CollectionRiskProfile {
  const refTime = referenceDate.getTime();
  let totalInvoiced = 0;
  let totalOutstanding = 0;
  let overdueCount = 0;
  let maxOverdueDays = 0;
  const paymentDelays: number[] = [];
  const riskFactors: string[] = [];

  for (const inv of input.invoices) {
    if (inv.status === "cancelled") continue;

    const total = Number(inv.total);
    const balance = Number(inv.balanceDue);
    const dueTime = new Date(inv.dueDate).getTime();

    totalInvoiced += total;
    totalOutstanding += balance;

    // Check overdue status
    if (balance > 0 && refTime > dueTime) {
      overdueCount++;
      const daysOverdue = Math.max(0, Math.floor((refTime - dueTime) / (1000 * 60 * 60 * 24)));
      if (daysOverdue > maxOverdueDays) {
        maxOverdueDays = daysOverdue;
      }
    }

    // Check historical payment timeliness if paid
    if (inv.paidAt) {
      const paidTime = new Date(inv.paidAt).getTime();
      const delayDays = Math.floor((paidTime - dueTime) / (1000 * 60 * 60 * 24));
      paymentDelays.push(delayDays);
    }
  }

  const averageDelay =
    paymentDelays.length > 0
      ? Math.round((paymentDelays.reduce((sum, d) => sum + d, 0) / paymentDelays.length) * 10) / 10
      : 0;

  // Calculate score (0 to 100)
  let score = 10;

  if (maxOverdueDays >= 14) {
    score += 55;
    riskFactors.push(`Tunggakan aktif telah melewati jatuh tempo lebih dari 14 hari (${maxOverdueDays} hari).`);
  } else if (maxOverdueDays >= 7) {
    score += 40;
    riskFactors.push(`Tunggakan aktif melewati jatuh tempo selama ${maxOverdueDays} hari.`);
  } else if (maxOverdueDays > 0) {
    score += 25;
    riskFactors.push(`Terdapat tagihan tertunggak baru (${maxOverdueDays} hari lewat tempo).`);
  }

  if (overdueCount > 1) {
    score += 15;
    riskFactors.push(`Terdapat akumulasi ${overdueCount} tagihan yang belum terselesaikan.`);
  }

  if (totalOutstanding > 0) {
    score += 10;
  }

  if (averageDelay > 3) {
    score += 15;
    riskFactors.push(`Pola pembayaran historis cenderung terlambat rata-rata ${averageDelay} hari.`);
  } else if (averageDelay < -2 && overdueCount === 0) {
    score = Math.max(0, score - 10);
    riskFactors.push("Penyewa memiliki riwayat membayar lebih awal sebelum jatuh tempo.");
  }

  if (riskFactors.length === 0) {
    riskFactors.push("Riwayat pembayaran lancar dan tidak ada tunggakan aktif.");
  }

  // Constrain 0 - 100
  const finalScore = Math.min(100, Math.max(0, score));

  let riskLevel: RiskLevel = "low";
  let riskLevelLabel = "Rendah (Aman & Disiplin)";
  let recommendedAction = "Pertahankan komunikasi berkala dan kirimkan kwitansi otomatis saat lunas.";
  let suggestedTemplateKey: CollectionRiskProfile["suggestedTemplateKey"] = "receipt_paid";

  if (finalScore >= 70) {
    riskLevel = "high";
    riskLevelLabel = "Tinggi (Kritis / Potensi Macet)";
    recommendedAction = "Eskalasi segera melalui pesan WhatsApp resmi peringatan tunggakan. Pertimbangkan untuk tidak memperpanjang kontrak sewa.";
    suggestedTemplateKey = "overdue_h1";
  } else if (finalScore >= 35) {
    riskLevel = "medium";
    riskLevelLabel = "Sedang (Perlu Perhatian)";
    recommendedAction = "Kirimkan pengingat ramah H-1 atau pada Hari H jatuh tempo untuk mencegah akumulasi denda.";
    suggestedTemplateKey = maxOverdueDays > 0 ? "overdue_h1" : "reminder_due";
  }

  return {
    penghuniId: input.penghuniId,
    penghuniNama: input.penghuniNama,
    penghuniNoHp: input.penghuniNoHp,
    kamarNomor: input.kamarNomor || "-",
    propertiNama: input.propertiNama || "-",
    riskScore: finalScore,
    riskLevel,
    riskLevelLabel,
    totalInvoiced,
    totalOutstanding,
    overdueInvoicesCount: overdueCount,
    maxDaysOverdue: maxOverdueDays,
    averagePaymentDelayDays: averageDelay,
    riskFactors,
    recommendedAction,
    suggestedTemplateKey,
  };
}
