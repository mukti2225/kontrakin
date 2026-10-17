export interface MessageTemplate {
  id: string;
  name: string;
  description: string;
  category: "reminder" | "receipt" | "announcement" | "maintenance";
  defaultContent: string;
  placeholders: string[];
}

export const STANDARD_TEMPLATES: Record<string, MessageTemplate> = {
  reminder_h5: {
    id: "reminder_h5",
    name: "Pengingat H-5 (Ramah)",
    description: "Dikirim 5 hari sebelum jatuh tempo untuk informasi awal pembayaran.",
    category: "reminder",
    defaultContent: `Halo Kak *{{nama_penyewa}}*,\n\nIni pengingat ramah bahwa tagihan sewa *{{nama_properti}}* (Kamar *{{nomor_kamar}}*) periode ini sebesar *{{total_tagihan}}* akan jatuh tempo pada *{{jatuh_tempo}}*.\n\nPembayaran dapat ditransfer via rekening pengelola. Mohon konfirmasi jika sudah melakukan transfer ya.\n\nTerima kasih dan semoga harinya menyenangkan! 🙏`,
    placeholders: [
      "nama_penyewa",
      "nama_properti",
      "nomor_kamar",
      "total_tagihan",
      "jatuh_tempo",
    ],
  },
  reminder_h1: {
    id: "reminder_h1",
    name: "Pengingat H-1 (Besok Jatuh Tempo)",
    description: "Dikirim 1 hari sebelum batas waktu pembayaran sewa.",
    category: "reminder",
    defaultContent: `Halo Kak *{{nama_penyewa}}*,\n\nTagihan sewa Kamar *{{nomor_kamar}}* sebesar *{{total_tagihan}}* akan jatuh tempo *BESOK* (*{{jatuh_tempo}}*).\n\nMohon lakukan pembayaran tepat waktu untuk kenyamanan bersama. Jika sudah transfer, abaikan pesan ini ya.\n\nTerima kasih! 🙏`,
    placeholders: [
      "nama_penyewa",
      "nomor_kamar",
      "total_tagihan",
      "jatuh_tempo",
    ],
  },
  reminder_due: {
    id: "reminder_due",
    name: "Pengingat Hari H (Jatuh Tempo)",
    description: "Dikirim pada tanggal jatuh tempo tagihan sewa.",
    category: "reminder",
    defaultContent: `Halo Kak *{{nama_penyewa}}*,\n\nTagihan sewa Kamar *{{nomor_kamar}}* jatuh tempo *HARI INI* (*{{jatuh_tempo}}*).\n\nSisa tagihan: *{{sisa_tagihan}}* (No. Invoice: {{nomor_tagihan}}).\n\nSilakan segera lakukan transfer dan kirimkan bukti pembayaran. Terima kasih atas kerja samanya! 🙏`,
    placeholders: [
      "nama_penyewa",
      "nomor_kamar",
      "sisa_tagihan",
      "nomor_tagihan",
      "jatuh_tempo",
    ],
  },
  overdue_h1: {
    id: "overdue_h1",
    name: "Tagihan Lewat Jatuh Tempo (Tertunggak)",
    description: "Peringatan saat tagihan telah melewati batas waktu.",
    category: "reminder",
    defaultContent: `⚠️ *PEMBERITAHUAN TUNGGAKAN SEWA*\n\nHalo Kak *{{nama_penyewa}}*,\n\nTagihan sewa Kamar *{{nomor_kamar}}* telah *MELEWATI JATUH TEMPO* sejak {{jatuh_tempo}}.\n\nTotal tunggakan yang belum diselesaikan: *{{sisa_tagihan}}*.\n\nMohon segera melunasi pembayaran hari ini untuk menghindari penyesuaian operasional atau denda keterlambatan. Terima kasih.`,
    placeholders: [
      "nama_penyewa",
      "nomor_kamar",
      "sisa_tagihan",
      "jatuh_tempo",
    ],
  },
  receipt_paid: {
    id: "receipt_paid",
    name: "Kwitansi Pelunasan Sewa",
    description: "Kwitansi otomatis setelah pembayaran diterima dan diverifikasi.",
    category: "receipt",
    defaultContent: `✅ *BUKTI PEMBAYARAN SEWA (LUNAS)*\n\nTerima kasih Kak *{{nama_penyewa}}*!\n\nPembayaran sewa Kamar *{{nomor_kamar}}* sebesar *{{nominal_bayar}}* untuk tagihan *{{nomor_tagihan}}* telah kami terima dan diverifikasi.\n\nStatus Tagihan: *LUNAS*\nTanggal: {{tanggal_bayar}}\n\nSemoga nyaman tinggal bersama kami! 🙏`,
    placeholders: [
      "nama_penyewa",
      "nomor_kamar",
      "nominal_bayar",
      "nomor_tagihan",
      "tanggal_bayar",
    ],
  },
  announcement: {
    id: "announcement",
    name: "Pengumuman Penghuni (Broadcast)",
    description: "Pesan broadcast terkait fasilitas, kebersihan, atau informasi kos.",
    category: "announcement",
    defaultContent: `📢 *PENGUMUMAN PENGHUNI {{nama_properti}}*\n\nHalo seluruh rekan penghuni,\n\n{{isi_pengumuman}}\n\nDemikian informasi ini disampaikan. Terima kasih atas perhatian dan kerja samanya! 🙏\n- Pengelola {{nama_properti}}`,
    placeholders: [
      "nama_properti",
      "isi_pengumuman",
    ],
  },
  tenant_portal_activation: {
    id: "tenant_portal_activation",
    name: "Undangan Aktivasi Tenant Portal",
    description: "Tautan aman untuk mengaktifkan akun penyewa tanpa kode undangan manual.",
    category: "announcement",
    defaultContent: `Halo Kak *{{nama_penyewa}}*,\n\nAnda telah terdaftar sebagai penghuni di *{{nama_properti}}* (Kamar *{{nomor_kamar}}*).\n\nUntuk melihat kontrak sewa, tagihan bulanan, kwitansi pembayaran, dan mengajukan laporan pemeliharaan, silakan aktifkan akun Akses Portal Tenant Anda melalui link resmi berikut:\n\n🔗 {{link_aktivasi}}\n\nLink ini bersifat rahasia dan berlaku selama {{berlaku_jam}} jam. Jangan bagikan link ini kepada siapapun.\n\nTerima kasih! 🙏\n- Pengelola {{nama_properti}}`,
    placeholders: [
      "nama_penyewa",
      "nama_properti",
      "nomor_kamar",
      "link_aktivasi",
      "berlaku_jam",
    ],
  },
  tenant_activation_otp: {
    id: "tenant_activation_otp",
    name: "Kode OTP Aktivasi Portal",
    description: "Kode verifikasi satu kali untuk memverifikasi nomor kontak penyewa.",
    category: "announcement",
    defaultContent: `🔐 *KODE VERIFIKASI AKSES PORTAL (OTP)*\n\nHalo Kak *{{nama_penyewa}}*,\n\nKode OTP verifikasi akun Tenant Portal Anda adalah:\n*{{kode_otp}}*\n\nKode ini berlaku selama {{berlaku_menit}} menit. JANGAN bagikan kode ini kepada pihak manapun termasuk pihak pengelola.`,
    placeholders: [
      "nama_penyewa",
      "kode_otp",
      "berlaku_menit",
    ],
  },
};

/**
 * Replaces placeholders in template string with variable values:
 * e.g. "Halo {{nama_penyewa}}" -> "Halo Budi"
 */
export function renderTemplate(
  templateContent: string,
  variables: Record<string, string>
): string {
  let result = templateContent;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    result = result.replace(regex, value ?? "");
  }
  return result;
}
