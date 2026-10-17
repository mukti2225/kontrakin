export interface TriageInput {
  judul: string;
  deskripsi: string;
  foto?: string | null;
}

export type TriageCategory = "ac" | "plumbing" | "kelistrikan" | "kebersihan" | "sipil" | "lainnya";
export type TriagePriority = "tinggi" | "sedang" | "rendah";

export interface TriageResult {
  category: TriageCategory;
  categoryLabel: string;
  priority: TriagePriority;
  priorityLabel: string;
  recommendedSla: string;
  mitigationAdvice: string;
  suggestedVendorCategory: string;
  urgencyScore: number; // 0 - 100
  confidenceScore: number; // 0 - 100
  detectedKeywords: string[];
}

const CATEGORY_KEYWORDS: Record<TriageCategory, string[]> = {
  ac: ["ac", "freon", "dingin", "filter", "bocor ac", "remote", "kompresor", "kipas ac", "panas", "udara"],
  plumbing: ["pipa", "kran", "wastafel", "toilet", "wc", "mampet", "bocor", "saluran", "air meluap", "toren", "keran", "shower", "got", "bocor pipa"],
  kelistrikan: ["listrik", "mcb", "sekring", "lampu", "saklar", "stopkontak", "konslet", "mati lampu", "tegangan", "percikan", "korslet", "kabel"],
  kebersihan: ["sampah", "kotor", "lumut", "kecoa", "tikus", "bau", "kebersihan", "bangkai", "jamur", "debu"],
  sipil: ["pintu", "kunci", "jendela", "cat", "plafon", "genteng", "retak", "bocor atap", "engsel", "lantai", "keramik", "tembok", "grendel", "kasa"],
  lainnya: [],
};

const HIGH_PRIORITY_TRIGGERS = [
  "meluap",
  "banjir",
  "bocor deras",
  "air membanjiri",
  "konslet",
  "percikan",
  "kebakaran",
  "asap",
  "mcb turun terus",
  "plafon runtuh",
  "genteng jebol",
  "kunci patah di dalam",
  "pintu tidak bisa dibuka",
  "tidak bisa terkunci",
  "terkunci di dalam",
  "wc mampet total",
  "bau bangkai",
  "bau gas",
];

const LOW_PRIORITY_TRIGGERS = [
  "cat mengelupas",
  "cat kusam",
  "gagang pintu longgar",
  "baut kendur",
  "lampu lorong mati",
  "debu",
  "gorden lepas",
  "kotoran ringan",
  "kurang rapi",
];

/**
 * Deterministic & explainable maintenance triage assistant.
 * Analyzes tenant complaints, classifies domain categories, evaluates physical safety & property risk,
 * and yields actionable SLA and mitigation instructions.
 */
export function triageMaintenanceTicket(input: TriageInput): TriageResult {
  const combinedText = `${input.judul} ${input.deskripsi}`.toLowerCase();

  // 1. Keyword detection and category scoring
  const categoryScores: Record<TriageCategory, number> = {
    ac: 0,
    plumbing: 0,
    kelistrikan: 0,
    kebersihan: 0,
    sipil: 0,
    lainnya: 0,
  };

  const detectedKeywords: string[] = [];

  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS) as [TriageCategory, string[]][]) {
    for (const word of words) {
      if (combinedText.includes(word)) {
        categoryScores[cat] += 1;
        detectedKeywords.push(word);
      }
    }
  }

  // Determine highest scoring category
  let maxScore = 0;
  let detectedCategory: TriageCategory = "lainnya";

  for (const [cat, score] of Object.entries(categoryScores) as [TriageCategory, number][]) {
    if (score > maxScore) {
      maxScore = score;
      detectedCategory = cat;
    }
  }

  // 2. Priority & Urgency Scoring
  let isHigh = false;
  let isLow = false;

  for (const trigger of HIGH_PRIORITY_TRIGGERS) {
    if (combinedText.includes(trigger)) {
      isHigh = true;
      break;
    }
  }

  if (!isHigh) {
    for (const trigger of LOW_PRIORITY_TRIGGERS) {
      if (combinedText.includes(trigger)) {
        isLow = true;
        break;
      }
    }
  }

  let priority: TriagePriority = "sedang";
  let urgencyScore = 50;

  if (isHigh) {
    priority = "tinggi";
    urgencyScore = 90;
  } else if (isLow) {
    priority = "rendah";
    urgencyScore = 25;
  } else {
    // Category default priorities if no strong trigger word
    if (detectedCategory === "kelistrikan" || detectedCategory === "plumbing") {
      priority = "tinggi";
      urgencyScore = 75;
    } else if (detectedCategory === "ac") {
      priority = "sedang";
      urgencyScore = 60;
    } else if (detectedCategory === "kebersihan" || detectedCategory === "sipil") {
      priority = "sedang";
      urgencyScore = 40;
    }
  }

  // 3. Recommended SLA & Mitigation Advice
  let recommendedSla = "Maksimal 24 Jam";
  let mitigationAdvice = "Koordinasikan inspeksi unit bersama staf properti.";

  switch (detectedCategory) {
    case "plumbing":
      if (priority === "tinggi") {
        recommendedSla = "Maksimal 2–4 Jam (Bahaya Banjir & Kerusakan Plafon)";
        mitigationAdvice = "Segera tutup stop-valve / kran utama instalasi pipa untuk menghentikan aliran air sebelum merembes ke unit lain.";
      } else {
        recommendedSla = "Maksimal 12–24 Jam";
        mitigationAdvice = "Letakkan ember penampung di bawah titik tetesan pipa sementara teknisi ditugaskan.";
      }
      break;

    case "kelistrikan":
      recommendedSla = "Maksimal 2–4 Jam (Risiko Kebakaran & Korsleting Listrik)";
      mitigationAdvice = "Segera turunkan tuas MCB utama kamar penyewa dan jangan menyentuh stop kontak atau kabel yang bermasalah.";
      break;

    case "ac":
      recommendedSla = "Maksimal 24 Jam (Kenyamanan Penyewa)";
      mitigationAdvice = "Matikan unit pendingin AC agar kompresor outdoor tidak overheat atau korslet karena kehabisan pelumas/freon.";
      break;

    case "sipil":
      if (priority === "tinggi") {
        recommendedSla = "Maksimal 2 Jam (Keamanan Akses Penyewa)";
        mitigationAdvice = "Gunakan kunci master darurat staf pengelola atau berikan unit transit sementara jika pintu terkunci rapat.";
      } else {
        recommendedSla = "Maksimal 48 Jam";
        mitigationAdvice = "Jadwalkan tukang pertukangan saat jam kerja untuk inspeksi struktural.";
      }
      break;

    case "kebersihan":
      recommendedSla = "Maksimal 24 Jam";
      mitigationAdvice = "Lakukan pembersihan intensif dan sanitasi area komunal/kamar mandi.";
      break;

    default:
      recommendedSla = "Maksimal 48 Jam";
      mitigationAdvice = "Hubungi penyewa untuk klarifikasi detail kendala teknis.";
  }

  const categoryLabels: Record<TriageCategory, string> = {
    ac: "Air Conditioner (AC)",
    plumbing: "Plumbing & Sanitasi Air",
    kelistrikan: "Kelistrikan & Daya",
    kebersihan: "Kebersihan & Sanitasi",
    sipil: "Sipil, Pintu & Struktural",
    lainnya: "Umum & Fasilitas Lain",
  };

  const priorityLabels: Record<TriagePriority, string> = {
    tinggi: "Tinggi / Darurat",
    sedang: "Sedang / Standar",
    rendah: "Rendah / Rutin",
  };

  const confidenceScore = maxScore > 0 ? Math.min(100, 60 + maxScore * 15) : 40;

  return {
    category: detectedCategory,
    categoryLabel: categoryLabels[detectedCategory],
    priority,
    priorityLabel: priorityLabels[priority],
    recommendedSla,
    mitigationAdvice,
    suggestedVendorCategory: detectedCategory,
    urgencyScore,
    confidenceScore,
    detectedKeywords: Array.from(new Set(detectedKeywords)),
  };
}
