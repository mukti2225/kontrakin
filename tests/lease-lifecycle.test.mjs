import test from "node:test";
import assert from "node:assert/strict";

test("Lease Lifecycle & Room Assignment Invariants", () => {
  // Scenario: Owner assigns Tenant T1 to Room K101 under formal Lease
  const room = {
    id: "kamar-101",
    nomor: "101",
    status: "kosong",
    hargaBulanan: 1800000,
  };

  const tenant = {
    id: "penghuni-001",
    nama: "Andi Pratama",
    kamarId: null,
    status: "aktif",
  };

  // 1. Create Lease
  const createLease = (r, t, startDate, endDate, rentAmount, depositAmount) => {
    assert.equal(r.status, "kosong", "Cannot lease a room that is not vacant");
    assert.ok(endDate > startDate, "End date must be after start date");

    const lease = {
      id: "lease-001",
      penghuniId: t.id,
      kamarId: r.id,
      nomorKontrak: "KTR-2026-001",
      startDate,
      endDate,
      rentAmount,
      depositAmount,
      status: "active",
    };

    // Mutate room and tenant state
    r.status = "terisi";
    t.kamarId = r.id;

    return lease;
  };

  const now = new Date();
  const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  const lease = createLease(room, tenant, now, oneYearLater, 1800000, 1800000);

  assert.equal(lease.status, "active");
  assert.equal(room.status, "terisi");
  assert.equal(tenant.kamarId, room.id);
  assert.equal(lease.depositAmount, 1800000);

  // 2. Terminate Lease
  const terminateLease = (l, r, t) => {
    assert.equal(l.status, "active", "Can only terminate an active lease");
    l.status = "terminated";
    r.status = "kosong"; // Room is vacated
    t.kamarId = null;
    t.status = "nonaktif";
  };

  terminateLease(lease, room, tenant);

  assert.equal(lease.status, "terminated");
  assert.equal(room.status, "kosong");
  assert.equal(tenant.kamarId, null);
  assert.equal(tenant.status, "nonaktif");
});
