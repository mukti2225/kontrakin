import test from "node:test";
import assert from "node:assert/strict";

test("Operations & Maintenance - Status progression and SLA rules", () => {
  const allowedTransitions = {
    menunggu: ["diproses", "selesai"],
    diproses: ["selesai", "menunggu"],
    selesai: ["diproses"], // Re-open if problem persists
  };

  function canTransition(current, next) {
    return allowedTransitions[current]?.includes(next) ?? false;
  }

  assert.equal(canTransition("menunggu", "diproses"), true);
  assert.equal(canTransition("diproses", "selesai"), true);
  assert.equal(canTransition("selesai", "menunggu"), false);
  assert.equal(canTransition("selesai", "diproses"), true); // re-opened
});

test("Operations & Maintenance - Vendor category matching", () => {
  const vendors = [
    { id: "v1", name: "Pak Budi AC", category: "AC" },
    { id: "v2", name: "Pak Slamet Pipa", category: "Plumbing" },
    { id: "v3", name: "Joko Listrik", category: "Electrical" },
  ];

  function findSuitableVendors(category) {
    return vendors.filter(
      (v) => v.category.toLowerCase() === category.toLowerCase()
    );
  }

  const acVendors = findSuitableVendors("AC");
  assert.equal(acVendors.length, 1);
  assert.equal(acVendors[0].name, "Pak Budi AC");

  const plumbingVendors = findSuitableVendors("Plumbing");
  assert.equal(plumbingVendors.length, 1);
  assert.equal(plumbingVendors[0].id, "v2");
});

test("Action Center - Priority operational triage calculation", () => {
  const mockNow = new Date("2026-10-17T00:00:00Z");
  const in30Days = new Date(mockNow.getTime() + 30 * 24 * 60 * 60 * 1000);

  const mockInvoices = [
    { id: "inv-1", dueDate: new Date("2026-10-05T00:00:00Z"), balanceDue: 1500000 }, // overdue
    { id: "inv-2", dueDate: new Date("2026-10-10T00:00:00Z"), balanceDue: 500000 },  // overdue
    { id: "inv-3", dueDate: new Date("2026-10-25T00:00:00Z"), balanceDue: 2000000 }, // future
    { id: "inv-4", dueDate: new Date("2026-10-01T00:00:00Z"), balanceDue: 0 },       // paid
  ];

  const mockLeases = [
    { id: "l-1", endDate: new Date("2026-10-30T00:00:00Z"), status: "active" }, // expiring
    { id: "l-2", endDate: new Date("2026-11-10T00:00:00Z"), status: "active" }, // expiring
    { id: "l-3", endDate: new Date("2027-05-01T00:00:00Z"), status: "active" }, // far
  ];

  // 1. Overdue calculation
  const overdue = mockInvoices.filter(
    (inv) => inv.dueDate < mockNow && inv.balanceDue > 0
  );
  const totalTunggakan = overdue.reduce((sum, inv) => sum + inv.balanceDue, 0);

  assert.equal(overdue.length, 2);
  assert.equal(totalTunggakan, 2000000);

  // 2. Expiring lease calculation
  const expiring = mockLeases.filter(
    (l) => l.status === "active" && l.endDate >= mockNow && l.endDate <= in30Days
  );

  assert.equal(expiring.length, 2);
});

test("Standardized Badging - Domain status token mapping invariants", () => {
  const domainStatusRules = {
    emerald: ["aktif", "active", "lunas", "paid", "selesai", "completed", "terisi", "occupied", "sent"],
    amber: ["diproses", "in_progress", "sebagian", "partial", "segera_berakhir", "sedang", "medium", "perbaikan", "maintenance"],
    rose: ["tertunggak", "overdue", "menunggu", "pending", "tinggi", "high", "darurat", "emergency", "kritis"],
    slate: ["kosong", "vacant", "berhenti", "terminated", "nonaktif", "inactive", "draf", "draft", "rendah", "low"],
  };

  function getVariant(status) {
    const s = status.toLowerCase().trim();
    for (const [variant, terms] of Object.entries(domainStatusRules)) {
      if (terms.includes(s)) return variant;
    }
    return "blue";
  }

  // Verifications
  assert.equal(getVariant("lunas"), "emerald");
  assert.equal(getVariant("terisi"), "emerald");
  assert.equal(getVariant("selesai"), "emerald");
  assert.equal(getVariant("aktif"), "emerald");

  assert.equal(getVariant("sebagian"), "amber");
  assert.equal(getVariant("diproses"), "amber");
  assert.equal(getVariant("segera_berakhir"), "amber");
  assert.equal(getVariant("perbaikan"), "amber");

  assert.equal(getVariant("tertunggak"), "rose");
  assert.equal(getVariant("menunggu"), "rose");
  assert.equal(getVariant("tinggi"), "rose");
  assert.equal(getVariant("kritis"), "rose");

  assert.equal(getVariant("kosong"), "slate");
  assert.equal(getVariant("berhenti"), "slate");
  assert.equal(getVariant("nonaktif"), "slate");
  assert.equal(getVariant("rendah"), "slate");
});
