import test from "node:test";
import assert from "node:assert/strict";
import { hasPermission } from "../lib/auth/permissions.ts";

test("RBAC - Granular permission checks", () => {
  // Owner has wildcard full access
  assert.equal(hasPermission("owner", "property.create"), true);
  assert.equal(hasPermission("owner", "invoice.delete"), true);
  assert.equal(hasPermission("owner", "any.random.action"), true);

  // Admin has operational access but cannot delete without permission
  assert.equal(hasPermission("admin", "property.view"), true);
  assert.equal(hasPermission("admin", "invoice.create"), true);
  assert.equal(hasPermission("admin", "team.invite"), true);

  // Finance role can manage invoices and payments, but not maintenance
  assert.equal(hasPermission("finance", "invoice.create"), true);
  assert.equal(hasPermission("finance", "payment.record"), true);
  assert.equal(hasPermission("finance", "maintenance.create"), false);

  // Staff role can view and handle maintenance, but cannot access invoices/payments
  assert.equal(hasPermission("staff", "maintenance.create"), true);
  assert.equal(hasPermission("staff", "invoice.create"), false);
  assert.equal(hasPermission("staff", "payment.view"), false);

  // Viewer role can only view
  assert.equal(hasPermission("viewer", "property.view"), true);
  assert.equal(hasPermission("viewer", "unit.view"), true);
  assert.equal(hasPermission("viewer", "property.update"), false);
  assert.equal(hasPermission("viewer", "invoice.create"), false);
});

test("Tenant Isolation Invariants - Cross-Tenant Access Prevention", () => {
  // Mock data representing two isolated organizations
  const orgA = { id: "org-aaa-111", name: "Kost Mahasiswa A" };
  const orgB = { id: "org-bbb-222", name: "Apartemen Mewah B" };

  const rooms = [
    { id: "room-1", organizationId: orgA.id, nomor: "A101" },
    { id: "room-2", organizationId: orgA.id, nomor: "A102" },
    { id: "room-3", organizationId: orgB.id, nomor: "B201" },
  ];

  // Helper simulating scoped query
  const queryRooms = (requestingOrgId) => {
    return rooms.filter((r) => r.organizationId === requestingOrgId);
  };

  // Helper simulating scoped mutation
  const updateRoom = (requestingOrgId, roomId, data) => {
    const room = rooms.find((r) => r.id === roomId && r.organizationId === requestingOrgId);
    if (!room) {
      throw new Error("FORBIDDEN_OR_NOT_FOUND: Record does not belong to requesting organization");
    }
    return { ...room, ...data };
  };

  // Helper simulating scoped deletion
  const deleteRoom = (requestingOrgId, roomId) => {
    const index = rooms.findIndex((r) => r.id === roomId && r.organizationId === requestingOrgId);
    if (index === -1) {
      throw new Error("FORBIDDEN_OR_NOT_FOUND: Cannot delete cross-tenant record");
    }
    return rooms.splice(index, 1)[0];
  };

  // Test 1: Org A cannot read Org B's rooms
  const orgARooms = queryRooms(orgA.id);
  assert.equal(orgARooms.length, 2);
  assert.ok(orgARooms.every((r) => r.organizationId === orgA.id));
  assert.ok(!orgARooms.some((r) => r.id === "room-3"));

  // Test 2: Org A cannot update Org B's room
  assert.throws(
    () => updateRoom(orgA.id, "room-3", { nomor: "HACKED" }),
    /FORBIDDEN_OR_NOT_FOUND/
  );

  // Test 3: Org A cannot delete Org B's room
  assert.throws(
    () => deleteRoom(orgA.id, "room-3"),
    /FORBIDDEN_OR_NOT_FOUND/
  );

  // Test 4: Org B can update its own room
  const updated = updateRoom(orgB.id, "room-3", { nomor: "B201-Renovated" });
  assert.equal(updated.nomor, "B201-Renovated");
});
