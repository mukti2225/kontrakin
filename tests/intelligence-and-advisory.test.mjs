import test from "node:test";
import assert from "node:assert/strict";

// ─── Maintenance Triage Assistant Test ──────────────────────────────────────────
const CATEGORY_KEYWORDS = {
  ac: ["ac", "freon", "dingin", "filter", "bocor ac", "remote", "kompresor", "kipas ac", "panas", "udara"],
  plumbing: ["pipa", "kran", "wastafel", "toilet", "wc", "mampet", "bocor", "saluran", "air meluap", "toren", "keran", "shower", "got", "bocor pipa"],
  kelistrikan: ["listrik", "mcb", "sekring", "lampu", "saklar", "stopkontak", "konslet", "mati lampu", "tegangan", "percikan", "korslet", "kabel"],
  kebersihan: ["sampah", "kotor", "lumut", "kecoa", "tikus", "bau", "kebersihan", "bangkai", "jamur", "debu"],
  sipil: ["pintu", "kunci", "jendela", "cat", "plafon", "genteng", "retak", "bocor atap", "engsel", "lantai", "keramik", "tembok", "grendel", "kasa"],
  lainnya: [],
};

const HIGH_PRIORITY_TRIGGERS = [
  "meluap", "banjir", "bocor deras", "air membanjiri", "konslet", "percikan", "kebakaran", "asap",
  "mcb turun terus", "plafon runtuh", "genteng jebol", "kunci patah di dalam", "pintu tidak bisa dibuka",
  "tidak bisa terkunci", "terkunci di dalam", "wc mampet total", "bau bangkai", "bau gas",
];

function triageComplaint(input) {
  const combinedText = `${input.judul} ${input.deskripsi}`.toLowerCase();
  const categoryScores = { ac: 0, plumbing: 0, kelistrikan: 0, kebersihan: 0, sipil: 0, lainnya: 0 };

  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const word of words) {
      if (combinedText.includes(word)) {
        categoryScores[cat] += 1;
      }
    }
  }

  let maxScore = 0;
  let detectedCategory = "lainnya";
  for (const [cat, score] of Object.entries(categoryScores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedCategory = cat;
    }
  }

  let isHigh = false;
  for (const trigger of HIGH_PRIORITY_TRIGGERS) {
    if (combinedText.includes(trigger)) {
      isHigh = true;
      break;
    }
  }

  const priority = isHigh ? "tinggi" : "sedang";
  const urgencyScore = isHigh ? 90 : 50;

  return {
    category: detectedCategory,
    priority,
    urgencyScore,
    suggestedVendor: detectedCategory,
  };
}

test("Maintenance Triage - Emergency water flooding triage", () => {
  const result = triageComplaint({
    judul: "Pipa wastafel pecah",
    deskripsi: "Pipa saluran wastafel lepas dan air banjir meluap membasahi seluruh kamar tidur",
  });

  assert.equal(result.category, "plumbing");
  assert.equal(result.priority, "tinggi");
  assert.ok(result.urgencyScore >= 80);
  assert.equal(result.suggestedVendor, "plumbing");
});

test("Maintenance Triage - Electrical hazard triage", () => {
  const result = triageComplaint({
    judul: "Stopkontak korslet",
    deskripsi: "Ada percikan api keluar dari saklar kamar mandi dan mcb turun terus",
  });

  assert.equal(result.category, "kelistrikan");
  assert.equal(result.priority, "tinggi");
  assert.equal(result.suggestedVendor, "kelistrikan");
});

test("Maintenance Triage - Standard AC maintenance request", () => {
  const result = triageComplaint({
    judul: "AC tidak dingin",
    deskripsi: "Unit AC menyala tapi hanya keluar angin biasa dan remote baterainya habis",
  });

  assert.equal(result.category, "ac");
  assert.equal(result.priority, "sedang");
  assert.equal(result.suggestedVendor, "ac");
});

// ─── Collection Delinquency Risk Forecasting Test ─────────────────────────────
function evaluateRisk(invoices, referenceDate = new Date("2026-10-17T00:00:00Z")) {
  const refTime = referenceDate.getTime();
  let overdueCount = 0;
  let maxOverdueDays = 0;
  let totalOutstanding = 0;

  for (const inv of invoices) {
    const dueTime = new Date(inv.dueDate).getTime();
    const balance = Number(inv.balanceDue);
    totalOutstanding += balance;

    if (balance > 0 && refTime > dueTime) {
      overdueCount++;
      const days = Math.floor((refTime - dueTime) / (1000 * 60 * 60 * 24));
      if (days > maxOverdueDays) maxOverdueDays = days;
    }
  }

  let score = 10;
  if (maxOverdueDays >= 14) score += 55;
  else if (maxOverdueDays >= 7) score += 40;
  else if (maxOverdueDays > 0) score += 25;

  if (overdueCount > 1) score += 15;
  if (totalOutstanding > 0) score += 10;

  const finalScore = Math.min(100, score);
  let riskLevel = "low";
  if (finalScore >= 70) riskLevel = "high";
  else if (finalScore >= 35) riskLevel = "medium";

  return { riskScore: finalScore, riskLevel, overdueCount, maxOverdueDays };
}

test("Collection Risk - Diligent tenant evaluated as Low Risk", () => {
  const invoices = [
    { dueDate: "2026-09-01T00:00:00Z", balanceDue: 0, status: "paid" },
    { dueDate: "2026-10-01T00:00:00Z", balanceDue: 0, status: "paid" },
  ];

  const profile = evaluateRisk(invoices);
  assert.equal(profile.riskLevel, "low");
  assert.ok(profile.riskScore < 30);
  assert.equal(profile.overdueCount, 0);
});

test("Collection Risk - Severe overdue tenant evaluated as High Risk", () => {
  const invoices = [
    { dueDate: "2026-09-15T00:00:00Z", balanceDue: 2500000, status: "overdue" }, // 32 days overdue
    { dueDate: "2026-10-01T00:00:00Z", balanceDue: 2500000, status: "overdue" }, // 16 days overdue
  ];

  const profile = evaluateRisk(invoices);
  assert.equal(profile.riskLevel, "high");
  assert.ok(profile.riskScore >= 70);
  assert.equal(profile.overdueCount, 2);
  assert.ok(profile.maxOverdueDays > 14);
});

// ─── Executive Summary & Loss-making Room Detection Test ─────────────────────
test("Portfolio Intelligence - Detection of loss-making rooms", () => {
  const unitProfitability = [
    { nomor: "101", revenue: 2000000, expenses: 300000, netContribution: 1700000 },
    { nomor: "102", revenue: 1500000, expenses: 2200000, netContribution: -700000 }, // Loss due to major repair
    { nomor: "103", revenue: 0, expenses: 100000, netContribution: -100000 }, // Vacant unit standing fee
  ];

  const lossUnits = unitProfitability.filter((u) => u.netContribution < 0);
  assert.equal(lossUnits.length, 2);
  assert.equal(lossUnits[0].nomor, "102");
  assert.equal(lossUnits[0].netContribution, -700000);
});
