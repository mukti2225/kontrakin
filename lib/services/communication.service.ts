import { prisma } from "@/lib/db/prisma";
import { logAuditEvent } from "@/lib/audit/audit-logger";
import { formatRupiah } from "@/lib/utils";
import {
  getMessagingProvider,
  normalizeIndonesianPhone,
  type SendMessageResult,
} from "@/lib/communication/provider";
import {
  STANDARD_TEMPLATES,
  renderTemplate,
} from "@/lib/communication/templates";

export interface SendMessageOptions {
  organizationId: string;
  penghuniId?: string;
  recipientPhone: string;
  recipientName?: string;
  templateId?: string;
  customMessage?: string;
  variables?: Record<string, string>;
  providerName?: "direct" | "fonnte" | "mock";
  actorUserId?: string;
}

export class CommunicationService {
  /**
   * Prepares and dispatches a message via the configured MessagingProvider.
   * Records a complete communication trail in the database for auditability.
   */
  async sendMessage(options: SendMessageOptions): Promise<SendMessageResult & { communicationId: string }> {
    const {
      organizationId,
      penghuniId,
      recipientPhone,
      recipientName,
      templateId,
      customMessage,
      variables = {},
      providerName = "direct",
      actorUserId,
    } = options;

    let finalMessage = customMessage || "";

    if (templateId && STANDARD_TEMPLATES[templateId]) {
      const tpl = STANDARD_TEMPLATES[templateId];
      finalMessage = renderTemplate(tpl.defaultContent, variables);
    }

    if (!finalMessage.trim()) {
      throw new Error("Isi pesan tidak boleh kosong");
    }

    const provider = getMessagingProvider(providerName);
    const normalizedPhone = normalizeIndonesianPhone(recipientPhone);

    const sendResult = await provider.sendMessage({
      toPhone: normalizedPhone,
      recipientName,
      message: finalMessage,
      metadata: { templateId, variables },
    });

    // Record Communication in database
    const comm = await prisma.communication.create({
      data: {
        organizationId,
        penghuniId: penghuniId || null,
        channel: "whatsapp",
        templateId: templateId || null,
        recipientPhone: normalizedPhone,
        recipientName: recipientName || null,
        message: finalMessage,
        status: sendResult.success ? "sent" : "failed",
        provider: provider.name,
        providerMessageId: sendResult.providerMessageId || null,
        metadata: variables as any,
      },
    });

    // Audit log
    await logAuditEvent({
      organizationId,
      actorUserId: actorUserId || null,
      action: "communication.whatsapp_sent",
      entityType: "Communication",
      entityId: comm.id,
      afterData: {
        recipientPhone: normalizedPhone,
        templateId,
        provider: provider.name,
      },
    });

    return {
      ...sendResult,
      communicationId: comm.id,
    };
  }

  /**
   * Builds an automated WhatsApp invoice reminder link or dispatch payload
   * for an existing invoice.
   */
  async createInvoiceReminder(
    invoiceId: string,
    organizationId: string,
    reminderType: "reminder_h5" | "reminder_h1" | "reminder_due" | "overdue_h1" = "reminder_due",
    actorUserId?: string
  ) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        penghuni: true,
        lease: {
          include: {
            kamar: { include: { properti: true } },
          },
        },
      },
    });

    if (!invoice || invoice.organizationId !== organizationId) {
      throw new Error("Invoice tidak ditemukan");
    }

    if (!invoice.penghuni?.noHp) {
      throw new Error("Nomor HP penyewa belum tercatat");
    }

    const dueDateObj = new Date(invoice.dueDate);
    const dueDateFormatted = `${dueDateObj.getDate()} ${dueDateObj.toLocaleString("id-ID", {
      month: "short",
    })} ${dueDateObj.getFullYear()}`;

    const variables: Record<string, string> = {
      nama_penyewa: invoice.penghuni.nama,
      nama_properti: invoice.lease?.kamar?.properti?.nama || "Kost",
      nomor_kamar: invoice.lease?.kamar?.nomor || "-",
      total_tagihan: formatRupiah(Number(invoice.total)),
      sisa_tagihan: formatRupiah(Number(invoice.balanceDue)),
      nomor_tagihan: invoice.invoiceNumber,
      jatuh_tempo: dueDateFormatted,
    };

    return this.sendMessage({
      organizationId,
      penghuniId: invoice.penghuniId,
      recipientPhone: invoice.penghuni.noHp,
      recipientName: invoice.penghuni.nama,
      templateId: reminderType,
      variables,
      providerName: "direct",
      actorUserId,
    });
  }
}

export const communicationService = new CommunicationService();
