export type OrganizationRole = "owner" | "admin" | "manager" | "finance" | "staff" | "viewer";

// Granular permissions map
export const ROLE_PERMISSIONS: Record<OrganizationRole, string[]> = {
  owner: ["*"], // Full access
  admin: [
    "property.*",
    "unit.*",
    "tenant.*",
    "lease.*",
    "invoice.*",
    "payment.*",
    "maintenance.*",
    "vendor.*",
    "reports.*",
    "team.view",
    "team.invite",
  ],
  manager: [
    "property.view",
    "property.update",
    "unit.*",
    "tenant.*",
    "lease.*",
    "invoice.view",
    "invoice.create",
    "payment.view",
    "maintenance.*",
    "vendor.*",
    "reports.view",
  ],
  finance: [
    "property.view",
    "unit.view",
    "tenant.view",
    "lease.view",
    "invoice.*",
    "payment.*",
    "expense.*",
    "reports.*",
  ],
  staff: [
    "property.view",
    "unit.view",
    "tenant.view",
    "lease.view",
    "maintenance.*",
  ],
  viewer: [
    "property.view",
    "unit.view",
    "tenant.view",
    "reports.view",
  ],
};

export function hasPermission(role: string, permission: string): boolean {
  const allowedPermissions = ROLE_PERMISSIONS[role as OrganizationRole] || [];
  if (allowedPermissions.includes("*")) return true;
  if (allowedPermissions.includes(permission)) return true;

  // Check wildcards like "property.*"
  const [resource] = permission.split(".");
  if (allowedPermissions.includes(`${resource}.*`)) return true;

  return false;
}
