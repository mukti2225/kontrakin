import { prisma } from "../db/prisma";
import { logAuditEvent } from "../audit/audit-logger";

export * from "./permissions";
import { OrganizationRole } from "./permissions";

/**
 * Retrieves the user's active organization.
 * If the user has no organization yet (e.g. existing user before migration),
 * this automatically provisions a default organization and associates existing entities.
 */
export async function getOrCreateUserOrganization(userId: string, userName?: string) {
  // Check if user already belongs to an organization
  const membership = await prisma.organizationUser.findFirst({
    where: { userId },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  if (membership) {
    return {
      organization: membership.organization,
      role: membership.role as OrganizationRole,
    };
  }

  // Provision default organization for this user
  const orgName = userName ? `${userName}'s Workspace` : "My Rental Workspace";
  const organization = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: orgName,
        users: {
          create: {
            userId,
            role: "owner",
          },
        },
      },
    });

    // Backfill any existing unassociated resources owned by this user
    await tx.properti.updateMany({
      where: { ownerId: userId, organizationId: null },
      data: { organizationId: org.id },
    });

    await tx.kamar.updateMany({
      where: { ownerId: userId, organizationId: null },
      data: { organizationId: org.id },
    });

    await tx.penghuni.updateMany({
      where: { ownerId: userId, organizationId: null },
      data: { organizationId: org.id },
    });

    await tx.transaksi.updateMany({
      where: { ownerId: userId, organizationId: null },
      data: { organizationId: org.id },
    });

    await tx.pemeliharaan.updateMany({
      where: { ownerId: userId, organizationId: null },
      data: { organizationId: org.id },
    });

    return org;
  });

  await logAuditEvent({
    organizationId: organization.id,
    actorUserId: userId,
    action: "organization.created_default",
    entityType: "Organization",
    entityId: organization.id,
    afterData: { name: organization.name },
  });

  return {
    organization,
    role: "owner" as OrganizationRole,
  };
}
