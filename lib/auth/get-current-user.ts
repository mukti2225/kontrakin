import { auth } from "./server";
import { headers } from "next/headers";

export type CurrentUser = Awaited<ReturnType<typeof auth.api.getSession>> extends { user: infer U } | null ? U : never;

export async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireSuperadmin() {
  const user = await requireUser();
  const normalizedRole = user.role?.toLowerCase().replace(/[^a-z]/g, "") || "";
  if (normalizedRole !== "superadmin" && normalizedRole !== "admin") {
    throw new Error("FORBIDDEN: hanya untuk superadmin platform");
  }
  return user;
}

export async function requireOwner() {
  const user = await requireUser();
  const normalizedRole = user.role?.toLowerCase().replace(/[^a-z]/g, "") || "";
  if (normalizedRole !== "owner" && normalizedRole !== "staff") {
    throw new Error("FORBIDDEN: hanya untuk owner atau staf workspace");
  }
  return user;
}

export async function requireOwnerId() {
  const user = await requireOwner();
  return user.id;
}

export async function requireTenant() {
  const user = await requireUser();
  const normalizedRole = user.role?.toLowerCase().replace(/[^a-z]/g, "") || "";
  if (normalizedRole !== "tenant") throw new Error("FORBIDDEN: hanya untuk tenant");
  return user;
}

export async function requireWorkspaceAccess(permission?: string) {
  const { user, organization, role } = await requireOrganization();
  if (permission) {
    const { hasPermission } = await import("./organization");
    if (!hasPermission(role, permission)) {
      throw new Error(`FORBIDDEN: Anda tidak memiliki izin untuk '${permission}'`);
    }
  }
  return { user, organization, role };
}

/**
 * Returns current authenticated user and their active organization membership.
 */
export async function requireOrganization() {
  const user = await requireUser();
  const { getOrCreateUserOrganization } = await import("./organization");
  const { organization, role } = await getOrCreateUserOrganization(user.id, user.name);
  return { user, organization, role };
}

/**
 * Requires that the current user has specific granular permission within their active organization.
 */
export async function requirePermission(permission: string) {
  const { user, organization, role } = await requireOrganization();
  const { hasPermission } = await import("./organization");
  if (!hasPermission(role, permission)) {
    throw new Error(`FORBIDDEN: Anda tidak memiliki izin untuk aksi '${permission}'`);
  }
  return { user, organization, role };
}

