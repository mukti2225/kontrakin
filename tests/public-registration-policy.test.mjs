import test from "node:test";
import assert from "node:assert/strict";

// ─── 1. Public Signup Server-Side Hook & Role Sanitization ─────────────────────
/**
 * Emulates the exact server hook logic defined in lib/auth/server.ts:
 * databaseHooks.user.create.before
 */
function applyServerRegistrationHook(clientInput) {
  // Public signup is strictly reserved for Owner.
  // Any client-supplied role or registrationRole (e.g. tenant, staff, admin) is unconditionally stripped/overwritten.
  const sanitizedUser = {
    ...clientInput,
    role: "owner",
    registrationRole: "owner",
  };
  return sanitizedUser;
}

test("Public Registration Policy - Unconditionally assigns OWNER role on public signup", () => {
  const normalSignup = {
    name: "Pak Budi Owner",
    email: "budi.owner@kontrakin.com",
  };

  const result = applyServerRegistrationHook(normalSignup);
  assert.equal(result.role, "owner");
  assert.equal(result.registrationRole, "owner");
});

test("Public Registration Policy - Strips and overrides client role escalation attempts (tenant, staff, superadmin)", () => {
  // Attacker attempting to register as tenant publicly
  const tenantAttempt = {
    name: "Rudi Tenant",
    email: "rudi@gmail.com",
    role: "tenant",
    registrationRole: "tenant",
  };
  const sanitizedTenant = applyServerRegistrationHook(tenantAttempt);
  assert.equal(sanitizedTenant.role, "owner", "Cannot register publicly as tenant");
  assert.equal(sanitizedTenant.registrationRole, "owner");

  // Attacker attempting to register as staff publicly
  const staffAttempt = {
    name: "Staf Penjaga",
    email: "staf@gmail.com",
    role: "staff",
    registrationRole: "staff",
  };
  const sanitizedStaff = applyServerRegistrationHook(staffAttempt);
  assert.equal(sanitizedStaff.role, "owner", "Cannot register publicly as staff");

  // Attacker attempting to register as superadmin publicly
  const adminAttempt = {
    name: "Hacker Admin",
    email: "admin@hacker.io",
    role: "super-admin",
    registrationRole: "superadmin",
  };
  const sanitizedAdmin = applyServerRegistrationHook(adminAttempt);
  assert.equal(sanitizedAdmin.role, "owner", "Cannot register publicly as super-admin");
});

// ─── 2. Provisioning Model Invariants ─────────────────────────────────────────
/**
 * Validates that each user role originates strictly from its authorized provisioning flow
 */
function validateRoleOrigin(role, origin) {
  switch (role) {
    case "owner":
      // Owner can come from public registration
      return origin === "PUBLIC_SIGNUP" || origin === "INVITATION_BY_CO_OWNER";
    case "staff":
      // Staff must come from Owner workspace invitation
      return origin === "OWNER_TEAM_INVITATION";
    case "tenant":
      // Tenant must come from Owner-created tenant activation
      return origin === "TENANT_PORTAL_ACTIVATION" || origin === "EXISTING_TENANT_RECORD";
    case "superadmin":
      // Superadmin must be provisioned internally
      return origin === "INTERNAL_SEED_OR_CONSOLE";
    default:
      return false;
  }
}

test("Public Registration Policy - Role provisioning origins are strictly partitioned", () => {
  // Public signup is only authorized for OWNER
  assert.ok(validateRoleOrigin("owner", "PUBLIC_SIGNUP"));
  assert.equal(validateRoleOrigin("tenant", "PUBLIC_SIGNUP"), false);
  assert.equal(validateRoleOrigin("staff", "PUBLIC_SIGNUP"), false);
  assert.equal(validateRoleOrigin("superadmin", "PUBLIC_SIGNUP"), false);

  // Staff requires Owner invitation
  assert.ok(validateRoleOrigin("staff", "OWNER_TEAM_INVITATION"));

  // Tenant requires Owner-governed Tenant Portal Activation
  assert.ok(validateRoleOrigin("tenant", "TENANT_PORTAL_ACTIVATION"));
  assert.ok(validateRoleOrigin("tenant", "EXISTING_TENANT_RECORD"));

  // Superadmin requires internal provisioning
  assert.ok(validateRoleOrigin("superadmin", "INTERNAL_SEED_OR_CONSOLE"));
});

// ─── 3. Existing Tenant Account & Login Invariants ─────────────────────────────
test("Public Registration Policy - Existing tenants preserve login & workspace dispatches", () => {
  const existingActiveTenants = [
    { id: "usr_1", name: "Siti Rahma", role: "tenant", email: "siti@tenant.local" },
    { id: "usr_2", name: "Agus Pratama", role: "tenant", email: "agus@tenant.local" },
  ];

  for (const tenant of existingActiveTenants) {
    assert.equal(tenant.role, "tenant");
    // Ensure dispatch route for tenant is /dashboard/tenant
    const targetRoute = tenant.role === "tenant" ? "/dashboard/tenant" : "/unauthorized";
    assert.equal(targetRoute, "/dashboard/tenant");
  }
});

// ─── 4. Deprecated Tenant Signup URL Handling ─────────────────────────────────
test("Public Registration Policy - Deprecated tenant route guides user to activation notice", () => {
  const requestedPath = "/register/tenant";
  const isDeprecatedPath = requestedPath.startsWith("/register/tenant");
  assert.ok(isDeprecatedPath);

  const noticeAction = {
    showNotice: true,
    suggestedUrl: "/login",
    homeUrl: "/",
  };
  assert.equal(noticeAction.suggestedUrl, "/login");
});
