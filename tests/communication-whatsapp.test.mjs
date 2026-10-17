import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeIndonesianPhone,
  DirectWhatsAppProvider,
  MockMessagingProvider,
  getMessagingProvider,
} from "../lib/communication/provider.ts";
import {
  STANDARD_TEMPLATES,
  renderTemplate,
} from "../lib/communication/templates.ts";

test("WhatsApp Provider - Indonesian phone normalization", () => {
  assert.equal(normalizeIndonesianPhone("081234567890"), "6281234567890");
  assert.equal(normalizeIndonesianPhone("6281234567890"), "6281234567890");
  assert.equal(normalizeIndonesianPhone("+62 812-3456-7890"), "6281234567890");
  assert.equal(normalizeIndonesianPhone("81234567890"), "6281234567890");
});

test("WhatsApp Provider - Template rendering with placeholders", () => {
  const template = "Halo {{nama_penyewa}}, tagihan kamar {{nomor_kamar}} sebesar {{total_tagihan}}.";
  const rendered = renderTemplate(template, {
    nama_penyewa: "Siti Rahma",
    nomor_kamar: "102",
    total_tagihan: "Rp 1.500.000",
  });

  assert.equal(
    rendered,
    "Halo Siti Rahma, tagihan kamar 102 sebesar Rp 1.500.000."
  );
});

test("WhatsApp Provider - Standard collection reminder templates exist", () => {
  assert.ok(STANDARD_TEMPLATES.reminder_h5, "H-5 template should exist");
  assert.ok(STANDARD_TEMPLATES.reminder_h1, "H-1 template should exist");
  assert.ok(STANDARD_TEMPLATES.reminder_due, "Due date template should exist");
  assert.ok(STANDARD_TEMPLATES.overdue_h1, "Overdue escalation template should exist");
  assert.ok(STANDARD_TEMPLATES.receipt_paid, "Receipt paid template should exist");

  const renderedDue = renderTemplate(STANDARD_TEMPLATES.reminder_due.defaultContent, {
    nama_penyewa: "Budi Santoso",
    nomor_kamar: "A1",
    sisa_tagihan: "Rp 1.800.000",
    nomor_tagihan: "INV-2026-10-A1-001",
    jatuh_tempo: "17 Oktober 2026",
  });

  assert.ok(renderedDue.includes("Budi Santoso"));
  assert.ok(renderedDue.includes("Rp 1.800.000"));
  assert.ok(renderedDue.includes("INV-2026-10-A1-001"));
});

test("WhatsApp Provider - Direct wa.me link generation", async () => {
  const provider = new DirectWhatsAppProvider();
  const result = await provider.sendMessage({
    toPhone: "081298765432",
    message: "Halo Budi, tagihan Anda sudah terbit.",
  });

  assert.equal(result.success, true);
  assert.ok(result.directUrl.startsWith("https://wa.me/6281298765432?text="));
  assert.ok(result.directUrl.includes(encodeURIComponent("Halo Budi")));
});

test("WhatsApp Provider - Provider factory", () => {
  const direct = getMessagingProvider("direct");
  assert.equal(direct.name, "direct");

  const mock = getMessagingProvider("mock");
  assert.equal(mock.name, "mock");

  const fonnte = getMessagingProvider("fonnte");
  assert.equal(fonnte.name, "fonnte");
});
