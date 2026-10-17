import test from "node:test";
import assert from "node:assert/strict";

// ─── 1. Role Normalization Invariants ──────────────────────────────────────────
function normalizeRole(role) {
  const clean = role?.toLowerCase().replace(/[^a-z]/g, "") || "";
  if (clean === "superadmin" || clean === "admin") return "SUPERADMIN";
  if (clean === "owner") return "OWNER";
  if (clean === "staff") return "STAFF";
  if (clean === "tenant") return "TENANT";
  return "UNKNOWN";
}

function resolveDashboardRoute(role) {
  const norm = normalizeRole(role);
  switch (norm) {
    case "SUPERADMIN":
      return "/dashboard/admin";
    case "OWNER":
    case "STAFF":
      return "/dashboard/owner";
    case "TENANT":
      return "/dashboard/tenant";
    default:
      return "/unauthorized";
  }
}

test("Role Architecture - Normalization handles case and hyphen variations", () => {
  assert.equal(normalizeRole("super-admin"), "SUPERADMIN");
  assert.equal(normalizeRole("superadmin"), "SUPERADMIN");
  assert.equal(normalizeRole("SUPERADMIN"), "SUPERADMIN");
  assert.equal(normalizeRole("admin"), "SUPERADMIN");

  assert.equal(normalizeRole("owner"), "OWNER");
  assert.equal(normalizeRole("OWNER"), "OWNER");

  assert.equal(normalizeRole("staff"), "STAFF");
  assert.equal(normalizeRole("STAFF"), "STAFF");

  assert.equal(normalizeRole("tenant"), "TENANT");
  assert.equal(normalizeRole("TENANT"), "TENANT");

  assert.equal(normalizeRole("random_guest"), "UNKNOWN");
});

test("Role Architecture - Route resolution dispatches to correct workspaces", () => {
  assert.equal(resolveDashboardRoute("super-admin"), "/dashboard/admin");
  assert.equal(resolveDashboardRoute("owner"), "/dashboard/owner");
  assert.equal(resolveDashboardRoute("staff"), "/dashboard/owner"); // Staff collaborates in Owner workspace
  assert.equal(resolveDashboardRoute("tenant"), "/dashboard/tenant");
  assert.equal(resolveDashboardRoute("unauthorized_role"), "/unauthorized");
});

// ─── 2. Staff Granular Permissions vs Owner ───────────────────────────────────
const ROLE_PERMISSIONS = {
  owner: ["*"],
  staff: [
    "property.view",
    "unit.view",
    "tenant.view",
    "lease.view",
    "maintenance.*",
  ],
  manager: [
    "property.view",
    "unit.*",
    "tenant.*",
    "lease.*",
    "maintenance.*",
    "reports.view",
  ],
  finance: [
    "invoice.*",
    "payment.*",
    "expense.*",
    "reports.*",
  ],
};

function hasPermission(role, permission) {
  const allowed = ROLE_PERMISSIONS[role] || [];
  if (allowed.includes("*")) return true;
  if (allowed.includes(permission)) return true;

  const [resource] = permission.split(".");
  if (allowed.includes(`${resource}.*`)) return true;

  return false;
}

test("Role Architecture - Staff permission boundaries prevent privilege escalation", () => {
  // Staff can inspect operations and maintenance
  assert.ok(hasPermission("staff", "property.view"));
  assert.ok(hasPermission("staff", "unit.view"));
  assert.ok(hasPermission("staff", "maintenance.update"));
  assert.ok(hasPermission("staff", "maintenance.create"));

  // Staff cannot access sensitive finance, subscriptions, or delete organization
  assert.equal(hasPermission("staff", "organization.delete"), false);
  assert.equal(hasPermission("staff", "subscription.manage"), false);
  assert.equal(hasPermission("staff", "team.manage"), false);
  assert.equal(hasPermission("staff", "invoice.create"), false);

  // Owner has universal access
  assert.ok(hasPermission("owner", "organization.delete"));
  assert.ok(hasPermission("owner", "team.manage"));
  assert.ok(hasPermission("owner", "invoice.create"));
});

// ─── 3. Tenant Resource Scoping Invariants ────────────────────────────────────
test("Role Architecture - Tenant portal strictly verifies ownership", () => {
  const tenantUser = { id: "user-tenant-1", tenantId: "penghuni-1" };
  const targetInvoice = { id: "inv-101", penghuniId: "penghuni-1", balanceDue: 2500000 };
  const otherTenantInvoice = { id: "inv-999", penghuniId: "penghuni-2", balanceDue: 1800000 };

  const canTenantAccessInvoice = (user, inv) => {
    return user.tenantId === inv.penghuniId;
  };

  assert.equal(canTenantAccessInvoice(tenantUser, targetInvoice), true);
  assert.equal(canTenantAccessInvoice(tenantUser, otherTenantInvoice), false);
});
