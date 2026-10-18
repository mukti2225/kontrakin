import crypto from "node:crypto";
import { prisma } from "../db/prisma.ts";
import { getMessagingProvider, normalizeIndonesianPhone } from "../communication/provider.ts";
import { renderTemplate, STANDARD_TEMPLATES } from "../communication/templates.ts";
import { logAuditEvent } from "../audit/audit-logger.ts";
import { hashPassword } from "better-auth/crypto";

export interface SendPortalAccessParams {
  penghuniId: string;
  organizationId: string;
  actorUserId?: string;
  channel?: "whatsapp" | "email";
  originUrl?: string;
}

export interface SendPortalAccessResult {
  success: boolean;
  channel: string;
  expiresAt: Date;
  directUrl?: string;
  recipientPhone: string;
}

export interface ValidateTokenResult {
  isValid: boolean;
  reason?: "INVALID" | "EXPIRED" | "USED" | "REVOKED";
  tenant?: {
    id: string;
    nama: string;
    maskedPhone: string;
    maskedEmail: string | null;
    kamarNomor: string;
    propertiNama: string;
    organizationName: string;
    expiresAt: Date;
  };
}

export interface VerifyOtpResult {
  success: boolean;
  userId: string;
  sessionToken: string;
  sessionExpiresAt: Date;
  tenantName: string;
  penghuniId: string;
}

/**
 * SHA-256 hashing for tokens and OTPs
 */
export function hashSecret(secret: string): string {
  return crypto.createHash("sha256").update(secret.trim()).digest("hex");
}

/**
 * Generates cryptographically secure alphanumeric token (64 hex characters)
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Generates 6-digit numeric OTP code
 */
export function generateNumericOtp(): string {
  return Math.floor(100000 + crypto.randomInt(900000)).toString();
}

/**
 * Mask Indonesian phone number: 081234567890 -> 0812••••••90
 */
export function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 6) return phone;
  const prefix = digits.slice(0, 4);
  const suffix = digits.slice(-2);
  const stars = "•".repeat(Math.max(4, digits.length - 6));
  return `${prefix}${stars}${suffix}`;
}

/**
 * Mask email: budi.santoso@gmail.com -> b••••••o@gmail.com
 */
export function maskEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2) return email;
  const [name, domain] = parts;
  if (name.length <= 2) return `${name[0]}•@${domain}`;
  const first = name[0];
  const last = name[name.length - 1];
  const stars = "•".repeat(Math.max(3, name.length - 2));
  return `${first}${stars}${last}@${domain}`;
}

/**
 * Core Domain Service: Tenant Portal Activation Engine
 */
export class TenantActivationService {
  /**
   * Generates a single-use token and sends the activation link to the tenant
   */
  static async sendPortalAccess(params: SendPortalAccessParams): Promise<SendPortalAccessResult> {
    const { penghuniId, organizationId, actorUserId, channel = "whatsapp" } = params;

    const tenant = await prisma.penghuni.findUnique({
      where: { id: penghuniId },
      include: {
        kamar: {
          include: { properti: true },
        },
        organization: true,
      },
    });

    if (!tenant || (tenant.organizationId !== organizationId && tenant.ownerId !== actorUserId)) {
      throw new Error("Penyewa tidak ditemukan atau tidak berada dalam organisasi Anda");
    }

    if (!tenant.noHp) {
      throw new Error("Penyewa tidak memiliki nomor kontak / WhatsApp terdaftar");
    }

    const rawToken = generateSecureToken();
    const tokenHash = hashSecret(rawToken);
    const ttlHours = 48;
    const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000);

    // Atomically revoke prior unused tokens and create new active token
    await prisma.$transaction(async (tx) => {
      // 1. Revoke any pending active tokens for this tenant
      await tx.tenantActivationToken.updateMany({
        where: {
          tenantId: penghuniId,
          usedAt: null,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      // 2. Create the new activation token
      await tx.tenantActivationToken.create({
        data: {
          tenantId: penghuniId,
          organizationId: tenant.organizationId || organizationId,
          tokenHash,
          phone: tenant.noHp,
          email: tenant.email,
          channel,
          expiresAt,
        },
      });

      // 3. Update tenant access state
      await tx.penghuni.update({
        where: { id: penghuniId },
        data: {
          portalAccessStatus: "INVITE_SENT",
        },
      });
    });

    // 4. Construct activation URL
    const baseUrl =
      params.originUrl ||
      process.env.BETTER_AUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";
    const activationUrl = `${baseUrl.replace(/\/$/, "")}/tenant/activate/${rawToken}`;

    // 5. Render message
    const propertyName = tenant.kamar?.properti?.nama || tenant.organization?.name || "Properti Sewa";
    const roomNumber = tenant.kamar?.nomor || "Unit";

    const renderedMessage = renderTemplate(STANDARD_TEMPLATES.tenant_portal_activation.defaultContent, {
      nama_penyewa: tenant.nama,
      nama_properti: propertyName,
      nomor_kamar: roomNumber,
      link_aktivasi: activationUrl,
      berlaku_jam: String(ttlHours),
    });

    // 6. Dispatch message via configured MessagingProvider
    const provider = getMessagingProvider();
    const sendResult = await provider.sendMessage({
      toPhone: tenant.noHp,
      recipientName: tenant.nama,
      message: renderedMessage,
      metadata: {
        category: "tenant_activation",
        penghuniId,
        channel,
      },
    });

    console.log("[TenantActivationService] Portal access generated:", {
      penghuniId,
      nama: tenant.nama,
      noHp: tenant.noHp,
      activationUrl,
      directUrl: sendResult.directUrl,
      provider: sendResult.provider,
    });

    // 7. Record communication history
    await prisma.communication.create({
      data: {
        organizationId: tenant.organizationId || organizationId,
        penghuniId,
        channel,
        templateId: "tenant_portal_activation",
        recipientPhone: tenant.noHp,
        recipientName: tenant.nama,
        subject: "Akses Portal Tenant",
        message: renderedMessage,
        status: sendResult.success ? "sent" : "failed",
        provider: sendResult.provider,
        providerMessageId: sendResult.providerMessageId,
      },
    });

    // 8. Log audit trail
    await logAuditEvent({
      organizationId: tenant.organizationId || organizationId,
      actorUserId: actorUserId || null,
      action: "tenant.portal_access_sent",
      entityType: "Penghuni",
      entityId: penghuniId,
      afterData: {
        channel,
        phone: maskPhoneNumber(tenant.noHp),
        expiresAt: expiresAt.toISOString(),
      },
    });

    return {
      success: true,
      channel,
      expiresAt,
      directUrl: sendResult.directUrl,
      recipientPhone: tenant.noHp,
    };
  }

  /**
   * Resends portal access, explicitly revoking previous tokens
   */
  static async resendPortalAccess(params: SendPortalAccessParams): Promise<SendPortalAccessResult> {
    const result = await this.sendPortalAccess(params);
    await logAuditEvent({
      organizationId: params.organizationId,
      actorUserId: params.actorUserId || null,
      action: "tenant.portal_access_resent",
      entityType: "Penghuni",
      entityId: params.penghuniId,
      afterData: {
        channel: params.channel || "whatsapp",
      },
    });
    return result;
  }

  /**
   * Disables tenant portal access without deleting any operational data
   */
  static async disablePortalAccess(penghuniId: string, organizationId: string, actorUserId?: string) {
    const tenant = await prisma.penghuni.findUnique({
      where: { id: penghuniId },
    });

    if (!tenant || (tenant.organizationId !== organizationId && tenant.ownerId !== actorUserId)) {
      throw new Error("Penyewa tidak ditemukan atau bukan milik organisasi Anda");
    }

    await prisma.$transaction(async (tx) => {
      // 1. Mark status DISABLED on tenant
      await tx.penghuni.update({
        where: { id: penghuniId },
        data: { portalAccessStatus: "DISABLED" },
      });

      // 2. Mark tenant_user relationship as disabled
      await tx.tenantUser.updateMany({
        where: { tenantId: penghuniId },
        data: { status: "disabled" },
      });

      // 3. Revoke any pending tokens
      await tx.tenantActivationToken.updateMany({
        where: {
          tenantId: penghuniId,
          usedAt: null,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    });

    await logAuditEvent({
      organizationId,
      actorUserId: actorUserId || null,
      action: "tenant.portal_access_disabled",
      entityType: "Penghuni",
      entityId: penghuniId,
      afterData: { portalAccessStatus: "DISABLED" },
    });

    return { success: true };
  }

  /**
   * Validates raw activation token safely without exposing private information
   */
  static async validateToken(rawToken: string): Promise<ValidateTokenResult> {
    if (!rawToken || typeof rawToken !== "string" || rawToken.trim().length < 16) {
      return { isValid: false, reason: "INVALID" };
    }

    const tokenHash = hashSecret(rawToken);
    const record = await prisma.tenantActivationToken.findUnique({
      where: { tokenHash },
      include: {
        penghuni: {
          include: {
            kamar: {
              include: { properti: true },
            },
          },
        },
        organization: true,
      },
    });

    if (!record) {
      return { isValid: false, reason: "INVALID" };
    }

    if (record.usedAt) {
      return { isValid: false, reason: "USED" };
    }

    if (record.revokedAt) {
      return { isValid: false, reason: "REVOKED" };
    }

    if (new Date() > record.expiresAt) {
      return { isValid: false, reason: "EXPIRED" };
    }

    // Mark status as ACTIVATION_PENDING if currently INVITE_SENT
    if (record.penghuni.portalAccessStatus === "INVITE_SENT") {
      await prisma.penghuni.update({
        where: { id: record.tenantId },
        data: { portalAccessStatus: "ACTIVATION_PENDING" },
      });
    }

    return {
      isValid: true,
      tenant: {
        id: record.penghuni.id,
        nama: record.penghuni.nama,
        maskedPhone: maskPhoneNumber(record.penghuni.noHp),
        maskedEmail: record.penghuni.email ? maskEmail(record.penghuni.email) : null,
        kamarNomor: record.penghuni.kamar?.nomor || "Unit",
        propertiNama: record.penghuni.kamar?.properti?.nama || record.organization.name || "Kost & Kontrakan",
        organizationName: record.organization.name,
        expiresAt: record.expiresAt,
      },
    };
  }

  /**
   * Requests 6-digit OTP code sent to tenant's verified phone/email
   */
  static async requestOtp(rawToken: string): Promise<{ success: boolean; maskedPhone: string; cooldownSeconds: number; mockOtp?: string }> {
    const validation = await this.validateToken(rawToken);
    if (!validation.isValid || !validation.tenant) {
      throw new Error("Link aktivasi tidak valid atau telah kedaluwarsa.");
    }

    const tokenHash = hashSecret(rawToken);
    const tokenRecord = await prisma.tenantActivationToken.findUniqueOrThrow({
      where: { tokenHash },
      include: { penghuni: true },
    });

    // Rate limiting: 60 seconds between OTP requests
    const lastOtp = await prisma.tenantOtp.findFirst({
      where: { tokenId: tokenRecord.id },
      orderBy: { createdAt: "desc" },
    });

    const now = Date.now();
    if (lastOtp) {
      const elapsed = Math.floor((now - new Date(lastOtp.createdAt).getTime()) / 1000);
      if (elapsed < 60) {
        const remaining = 60 - elapsed;
        throw new Error(`Mohon tunggu ${remaining} detik sebelum meminta kode OTP kembali.`);
      }
    }

    const otpCode = generateNumericOtp();
    const otpHash = hashSecret(otpCode);
    const expiresAt = new Date(now + 5 * 60 * 1000); // 5 minutes TTL

    // Save OTP record
    await prisma.tenantOtp.create({
      data: {
        tokenId: tokenRecord.id,
        identifier: tokenRecord.phone || tokenRecord.penghuni.noHp,
        otpHash,
        expiresAt,
        attempts: 0,
      },
    });

    // Render & dispatch OTP message
    const renderedOtpMessage = renderTemplate(STANDARD_TEMPLATES.tenant_activation_otp.defaultContent, {
      nama_penyewa: tokenRecord.penghuni.nama,
      kode_otp: otpCode,
      berlaku_menit: "5",
    });

    const provider = getMessagingProvider();
    await provider.sendMessage({
      toPhone: tokenRecord.phone || tokenRecord.penghuni.noHp,
      recipientName: tokenRecord.penghuni.nama,
      message: renderedOtpMessage,
      metadata: {
        category: "activation_otp",
        tenantId: tokenRecord.tenantId,
      },
    });

    return {
      success: true,
      maskedPhone: maskPhoneNumber(tokenRecord.phone || tokenRecord.penghuni.noHp),
      cooldownSeconds: 60,
      // Expose OTP only in development or mock mode for friction-free local testing
      mockOtp: process.env.NODE_ENV !== "production" ? otpCode : undefined,
    };
  }

  /**
   * Verifies OTP, provisions or links User account, marks token used, and generates session
   */
  static async verifyOtpAndActivate(params: {
    rawToken: string;
    otpCode: string;
    password?: string;
  }): Promise<VerifyOtpResult> {
    const { rawToken, otpCode, password } = params;

    const validation = await this.validateToken(rawToken);
    if (!validation.isValid || !validation.tenant) {
      throw new Error("Link aktivasi tidak valid atau telah kedaluwarsa.");
    }

    const tokenHash = hashSecret(rawToken);
    const tokenRecord = await prisma.tenantActivationToken.findUniqueOrThrow({
      where: { tokenHash },
      include: {
        penghuni: true,
        organization: true,
      },
    });

    const activeOtp = await prisma.tenantOtp.findFirst({
      where: {
        tokenId: tokenRecord.id,
        verifiedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!activeOtp || new Date() > activeOtp.expiresAt) {
      throw new Error("Kode OTP telah kedaluwarsa. Silakan minta kode OTP baru.");
    }

    if (activeOtp.attempts >= 5) {
      throw new Error("Batas maksimal 5x percobaan OTP terlampaui. Silakan minta kode OTP baru.");
    }

    const inputHash = hashSecret(otpCode);
    if (inputHash !== activeOtp.otpHash) {
      await prisma.tenantOtp.update({
        where: { id: activeOtp.id },
        data: { attempts: { increment: 1 } },
      });
      const remaining = 5 - (activeOtp.attempts + 1);
      throw new Error(`Kode OTP salah. Sisa kesempatan: ${Math.max(0, remaining)} kali.`);
    }

    // Mark OTP verified
    await prisma.tenantOtp.update({
      where: { id: activeOtp.id },
      data: { verifiedAt: new Date() },
    });

    const tenant = tokenRecord.penghuni;
    const normalizedPhone = normalizeIndonesianPhone(tenant.noHp);
    const emailCandidate =
      tenant.email?.trim().toLowerCase() ||
      `${normalizedPhone}@tenant.kontrakin.local`;

    // Perform atomic user creation / linking and token consummation
    const { user, sessionToken, sessionExpiresAt } = await prisma.$transaction(async (tx) => {
      // 1. Locate existing User by email or phone
      let targetUser = await tx.user.findFirst({
        where: {
          OR: [
            { id: tenant.userId ?? undefined },
            { email: emailCandidate },
          ],
        },
      });

      // 2. If no user exists, provision new User account
      if (!targetUser) {
        const userId = `usr_${crypto.randomBytes(12).toString("hex")}`;
        targetUser = await tx.user.create({
          data: {
            id: userId,
            name: tenant.nama,
            email: emailCandidate,
            role: "tenant",
            registrationRole: "tenant",
            emailVerified: true,
          },
        });

        // Set password if provided
        if (password && password.length >= 6) {
          const hashedPassword = await hashPassword(password);
          await tx.account.create({
            data: {
              id: `acc_${crypto.randomBytes(12).toString("hex")}`,
              accountId: targetUser.id,
              providerId: "credential",
              userId: targetUser.id,
              password: hashedPassword,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
      } else {
        // If user exists and password is provided and they don't have an account credential, create or update it
        if (password && password.length >= 6) {
          const existingAcc = await tx.account.findFirst({
            where: { userId: targetUser.id, providerId: "credential" },
          });
          const hashedPassword = await hashPassword(password);
          if (existingAcc) {
            await tx.account.update({
              where: { id: existingAcc.id },
              data: { password: hashedPassword, updatedAt: new Date() },
            });
          } else {
            await tx.account.create({
              data: {
                id: `acc_${crypto.randomBytes(12).toString("hex")}`,
                accountId: targetUser.id,
                providerId: "credential",
                userId: targetUser.id,
                password: hashedPassword,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            });
          }
        }
      }

      // 3. Establish TenantUser relationship
      await tx.tenantUser.upsert({
        where: {
          tenantId_userId: {
            tenantId: tenant.id,
            userId: targetUser.id,
          },
        },
        create: {
          tenantId: tenant.id,
          userId: targetUser.id,
          status: "active",
        },
        update: {
          status: "active",
        },
      });

      // 4. Update Penghuni record
      await tx.penghuni.update({
        where: { id: tenant.id },
        data: {
          userId: targetUser.id,
          portalAccessStatus: "ACTIVE",
          portalActivatedAt: new Date(),
          lastPortalAccessAt: new Date(),
        },
      });

      // 5. Mark activation token used
      await tx.tenantActivationToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: new Date() },
      });

      // 6. Generate authenticated Session
      const sessionToken = crypto.randomBytes(32).toString("hex");
      const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000); // 30 days
      await tx.session.create({
        data: {
          id: `ses_${crypto.randomBytes(12).toString("hex")}`,
          userId: targetUser.id,
          token: sessionToken,
          expiresAt: sessionExpiresAt,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return { user: targetUser, sessionToken, sessionExpiresAt };
    });

    // 7. Audit activation event
    await logAuditEvent({
      organizationId: tokenRecord.organizationId,
      actorUserId: user.id,
      action: "tenant.portal_activated",
      entityType: "Penghuni",
      entityId: tenant.id,
      afterData: {
        userId: user.id,
        nama: tenant.nama,
        activatedAt: new Date().toISOString(),
      },
    });

    return {
      success: true,
      userId: user.id,
      sessionToken,
      sessionExpiresAt,
      tenantName: tenant.nama,
      penghuniId: tenant.id,
    };
  }
}
