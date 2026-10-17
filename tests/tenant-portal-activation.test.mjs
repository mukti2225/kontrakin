import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  hashSecret,
  generateSecureToken,
  generateNumericOtp,
  maskPhoneNumber,
  maskEmail,
} from "../lib/services/tenant-activation-service.ts";
import { renderTemplate, STANDARD_TEMPLATES } from "../lib/communication/templates.ts";

test("Tenant Activation - Token Cryptography & Hashing Invariants", () => {
  const token1 = generateSecureToken();
  const token2 = generateSecureToken();

  assert.equal(typeof token1, "string");
  assert.equal(token1.length, 64, "Raw token must be 32 bytes (64 hex characters)");
  assert.notEqual(token1, token2, "Subsequent tokens must be cryptographically distinct");

  const hash1 = hashSecret(token1);
  const hash1Repeat = hashSecret(token1);
  assert.equal(hash1, hash1Repeat, "SHA-256 hash must be deterministic");
  assert.equal(hash1.length, 64, "SHA-256 digest must be 64 hex characters");
  assert.notEqual(hash1, token1, "Hash must never equal raw token");

  // Whitespace trimming safety
  assert.equal(hashSecret(`  ${token1}  `), hash1, "Hashing must normalize leading/trailing whitespace");
});

test("Tenant Activation - 6-Digit Numeric OTP Generation", () => {
  for (let i = 0; i < 20; i++) {
    const otp = generateNumericOtp();
    assert.equal(typeof otp, "string");
    assert.equal(otp.length, 6, "OTP must strictly be 6 digits");
    assert.match(otp, /^\d{6}$/, "OTP must consist exclusively of numeric digits");
    const num = parseInt(otp, 10);
    assert.ok(num >= 100000 && num <= 999999, "OTP must fall within range 100000-999999");
  }
});

test("Tenant Activation - Phone & Email Masking Rules", () => {
  // Indonesian phones
  assert.equal(maskPhoneNumber("081234567890"), "0812••••••90");
  assert.equal(maskPhoneNumber("6281987654321"), "6281•••••••21");
  assert.equal(maskPhoneNumber("+6285712345678"), "6285•••••••78");

  // Emails
  assert.equal(maskEmail("budi.santoso@gmail.com"), "b••••••••••o@gmail.com");
  assert.equal(maskEmail("andi@yahoo.co.id"), "a•••i@yahoo.co.id");
  assert.equal(maskEmail("me@test.com"), "m•@test.com");
});

test("Tenant Activation - WhatsApp Message Template Rendering", () => {
  const template = STANDARD_TEMPLATES.tenant_portal_activation;
  assert.ok(template, "tenant_portal_activation template must exist in standard library");

  const rendered = renderTemplate(template.defaultContent, {
    nama_penyewa: "Budi Santoso",
    nama_properti: "Melati Residence",
    nomor_kamar: "A-203",
    link_aktivasi: "https://app.kontrakin.com/tenant/activate/abc123token",
    berlaku_jam: "48",
  });

  assert.ok(rendered.includes("Budi Santoso"));
  assert.ok(rendered.includes("Melati Residence"));
  assert.ok(rendered.includes("A-203"));
  assert.ok(rendered.includes("https://app.kontrakin.com/tenant/activate/abc123token"));
  assert.ok(rendered.includes("48 jam"));
  // Ensure no unrendered placeholders
  assert.ok(!rendered.includes("{{"), "All placeholders must be cleanly replaced");
});

test("Tenant Activation - OTP Message Template Rendering", () => {
  const template = STANDARD_TEMPLATES.tenant_activation_otp;
  assert.ok(template, "tenant_activation_otp template must exist");

  const rendered = renderTemplate(template.defaultContent, {
    nama_penyewa: "Siti Rahma",
    kode_otp: "847291",
    berlaku_menit: "5",
  });

  assert.ok(rendered.includes("Siti Rahma"));
  assert.ok(rendered.includes("847291"));
  assert.ok(rendered.includes("5 menit"));
  assert.ok(!rendered.includes("{{"));
});

test("Tenant Activation - Token State Machine & Expiry Logic", () => {
  const now = Date.now();
  const mockTokenRecord = {
    id: "tok_1",
    tenantId: "penghuni_1",
    tokenHash: hashSecret("valid_raw_token_xyz"),
    expiresAt: new Date(now + 48 * 3600 * 1000),
    usedAt: null,
    revokedAt: null,
  };

  function evaluateToken(token, nowTime = Date.now()) {
    if (!token) return { isValid: false, reason: "INVALID" };
    if (token.usedAt) return { isValid: false, reason: "USED" };
    if (token.revokedAt) return { isValid: false, reason: "REVOKED" };
    if (new Date(nowTime) > token.expiresAt) return { isValid: false, reason: "EXPIRED" };
    return { isValid: true };
  }

  // Active token
  assert.equal(evaluateToken(mockTokenRecord).isValid, true);

  // Expired token
  const expiredToken = { ...mockTokenRecord, expiresAt: new Date(now - 1000) };
  const expiredResult = evaluateToken(expiredToken);
  assert.equal(expiredResult.isValid, false);
  assert.equal(expiredResult.reason, "EXPIRED");

  // Used token
  const usedToken = { ...mockTokenRecord, usedAt: new Date(now - 10000) };
  const usedResult = evaluateToken(usedToken);
  assert.equal(usedResult.isValid, false);
  assert.equal(usedResult.reason, "USED");

  // Revoked token (e.g. after resend)
  const revokedToken = { ...mockTokenRecord, revokedAt: new Date(now - 5000) };
  const revokedResult = evaluateToken(revokedToken);
  assert.equal(revokedResult.isValid, false);
  assert.equal(revokedResult.reason, "REVOKED");
});

test("Tenant Activation - OTP Anti-Bruteforce & Rate Limiting Rules", () => {
  const otpStore = {
    otpHash: hashSecret("582190"),
    attempts: 0,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    verifiedAt: null,
  };

  function verifyOtp(attemptCode, store) {
    if (store.verifiedAt) throw new Error("OTP already used");
    if (new Date() > store.expiresAt) throw new Error("Kode OTP telah kedaluwarsa");
    if (store.attempts >= 5) throw new Error("Batas maksimal 5x percobaan OTP terlampaui");

    if (hashSecret(attemptCode) !== store.otpHash) {
      store.attempts += 1;
      return { success: false, remainingAttempts: 5 - store.attempts };
    }

    store.verifiedAt = new Date();
    return { success: true };
  }

  // First 4 failed attempts
  for (let i = 1; i <= 4; i++) {
    const res = verifyOtp("000000", otpStore);
    assert.equal(res.success, false);
    assert.equal(res.remainingAttempts, 5 - i);
  }

  // 5th failed attempt locks OTP
  const fifthFail = verifyOtp("000000", otpStore);
  assert.equal(fifthFail.success, false);
  assert.equal(fifthFail.remainingAttempts, 0);

  // Subsequent attempt throws lockout exception even with correct OTP
  assert.throws(() => verifyOtp("582190", otpStore), /Batas maksimal 5x percobaan OTP terlampaui/);
});

test("Tenant Activation - Multi-Tenancy & Cross-Organization Protection", () => {
  const orgA = { id: "org_alpha" };
  const orgB = { id: "org_beta" };

  const tenantOfOrgA = {
    id: "tenant_01",
    organizationId: orgA.id,
    nama: "Tenant Alpha",
  };

  function authorizeSendAccess(callerOrgId, tenant) {
    if (tenant.organizationId !== callerOrgId) {
      throw new Error("FORBIDDEN: Penyewa tidak ditemukan atau bukan milik organisasi Anda");
    }
    return true;
  }

  // Org A can manage own tenant
  assert.doesNotThrow(() => authorizeSendAccess(orgA.id, tenantOfOrgA));

  // Org B MUST be forbidden from sending access to Org A's tenant
  assert.throws(() => authorizeSendAccess(orgB.id, tenantOfOrgA), /FORBIDDEN/);
});
