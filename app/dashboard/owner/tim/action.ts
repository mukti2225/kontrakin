"use server";

import { prisma } from "@/lib/db/prisma";
import { requireOrganization, requireOwner } from "@/lib/auth/get-current-user";
import { logAuditEvent } from "@/lib/audit/audit-logger";
import { ROLE_PERMISSIONS, type OrganizationRole } from "@/lib/auth/permissions";
import { revalidatePath } from "next/cache";

export interface TeamMemberDTO {
  id: string; // organizationUser id
  userId: string;
  name: string;
  email: string;
  role: OrganizationRole;
  status: "aktif" | "diundang";
  joinedAt: string;
  permissionsCount: number;
}

export async function getTeamMembers(): Promise<TeamMemberDTO[]> {
  const { organization } = await requireOrganization();

  const members = await prisma.organizationUser.findMany({
    where: { organizationId: organization.id },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return members.map((m) => {
    const roleKey = (m.role as OrganizationRole) || "staff";
    const perms = ROLE_PERMISSIONS[roleKey] || [];
    const permissionsCount = perms.includes("*") ? 20 : perms.length;

    return {
      id: m.id,
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: roleKey,
      status: "aktif",
      joinedAt: m.createdAt.toISOString(),
      permissionsCount,
    };
  });
}

export async function addStaffMember(input: {
  name: string;
  email: string;
  role: OrganizationRole;
}) {
  const { user, organization, role: callerRole } = await requireOrganization();

  // Authorization check: only owner or admin can invite staff
  if (callerRole !== "owner" && callerRole !== "admin" && user.role !== "owner") {
    throw new Error("Hanya Pemilik (Owner) atau Admin yang memiliki izin mengundang anggota tim baru");
  }

  // Prevent non-owners from inviting an Owner
  if (input.role === "owner" && callerRole !== "owner" && user.role !== "owner") {
    throw new Error("Hanya Owner yang dapat mengangkat anggota menjadi Owner baru");
  }

  const cleanEmail = input.email.trim().toLowerCase();
  const cleanName = input.name.trim();

  if (!cleanEmail || !cleanName) {
    throw new Error("Nama dan email anggota staf wajib diisi");
  }

  // Find or create User record
  let targetUser = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (!targetUser) {
    targetUser = await prisma.user.create({
      data: {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: cleanName,
        email: cleanEmail,
        role: "staff",
        registrationRole: "staff",
      },
    });
  }

  // Check if already in this organization
  const existingMembership = await prisma.organizationUser.findUnique({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: targetUser.id,
      },
    },
  });

  if (existingMembership) {
    throw new Error("Pengguna dengan email ini sudah terdaftar sebagai anggota tim dalam organisasi ini");
  }

  const membership = await prisma.organizationUser.create({
    data: {
      organizationId: organization.id,
      userId: targetUser.id,
      role: input.role,
    },
    include: { user: true },
  });

  await logAuditEvent({
    organizationId: organization.id,
    actorUserId: user.id,
    action: "team.member_added",
    entityType: "OrganizationUser",
    entityId: membership.id,
    afterData: {
      targetUserId: targetUser.id,
      email: cleanEmail,
      role: input.role,
    },
  });

  revalidatePath("/dashboard/owner/tim");
  return membership;
}

export async function updateStaffRole(membershipId: string, newRole: OrganizationRole) {
  const { user, organization, role: callerRole } = await requireOrganization();

  if (callerRole !== "owner" && callerRole !== "admin" && user.role !== "owner") {
    throw new Error("Hanya Pemilik (Owner) atau Admin yang berhak mengubah peran anggota tim");
  }

  const membership = await prisma.organizationUser.findUnique({
    where: { id: membershipId },
    include: { user: true },
  });

  if (!membership || membership.organizationId !== organization.id) {
    throw new Error("Anggota tidak ditemukan dalam organisasi ini");
  }

  // Prevent accidental lockout: cannot demote the sole remaining owner
  if (membership.role === "owner" && newRole !== "owner") {
    const ownerCount = await prisma.organizationUser.count({
      where: { organizationId: organization.id, role: "owner" },
    });
    if (ownerCount <= 1) {
      throw new Error("Organisasi harus memiliki setidaknya satu Pemilik (Owner). Anda tidak dapat mengubah peran Owner terakhir.");
    }
  }

  const updated = await prisma.organizationUser.update({
    where: { id: membershipId },
    data: { role: newRole },
    include: { user: true },
  });

  await logAuditEvent({
    organizationId: organization.id,
    actorUserId: user.id,
    action: "team.role_updated",
    entityType: "OrganizationUser",
    entityId: membershipId,
    beforeData: { role: membership.role },
    afterData: { role: newRole },
  });

  revalidatePath("/dashboard/owner/tim");
  return updated;
}

export async function removeStaffMember(membershipId: string) {
  const { user, organization, role } = await requireOrganization();
  if (role !== "owner" && role !== "admin" && user.role !== "owner") {
    throw new Error("Hanya pemilik akun (Owner) atau Admin yang dapat menghapus anggota tim");
  }

  const membership = await prisma.organizationUser.findUnique({
    where: { id: membershipId },
    include: { user: true },
  });

  if (!membership || membership.organizationId !== organization.id) {
    throw new Error("Anggota tidak ditemukan dalam organisasi ini");
  }

  // Prevent accidental lockout: cannot delete self if current user is owner
  if (membership.role === "owner" && membership.userId === user.id) {
    throw new Error("Anda tidak dapat menghapus akun Anda sendiri sebagai Owner utama demi keamanan akun");
  }

  // Prevent deleting the sole owner of the organization
  if (membership.role === "owner") {
    const ownerCount = await prisma.organizationUser.count({
      where: { organizationId: organization.id, role: "owner" },
    });
    if (ownerCount <= 1) {
      throw new Error("Tidak dapat menghapus Pemilik (Owner) satu-satunya dalam organisasi");
    }
  }

  await prisma.organizationUser.delete({
    where: { id: membershipId },
  });

  await logAuditEvent({
    organizationId: organization.id,
    actorUserId: user.id,
    action: "team.member_removed",
    entityType: "OrganizationUser",
    entityId: membershipId,
    beforeData: {
      removedUserId: membership.userId,
      email: membership.user.email,
      role: membership.role,
    },
  });

  revalidatePath("/dashboard/owner/tim");
  return { success: true };
}
