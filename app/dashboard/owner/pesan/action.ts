"use server";

import { prisma } from "@/lib/db/prisma";
import { requireOrganization } from "@/lib/auth/get-current-user";
import { communicationService } from "@/lib/services/communication.service";
import { revalidatePath } from "next/cache";

export async function getCommunicationHistory() {
  const { organization } = await requireOrganization();

  const history = await prisma.communication.findMany({
    where: { organizationId: organization.id },
    include: {
      penghuni: { select: { id: true, nama: true, noHp: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return history.map((h) => ({
    ...h,
    metadata: h.metadata as any,
    sentAt: h.sentAt.toISOString(),
    createdAt: h.createdAt.toISOString(),
  }));
}

export async function getTenantRecipients() {
  const { user, organization } = await requireOrganization();

  const tenants = await prisma.penghuni.findMany({
    where: {
      OR: [{ ownerId: user.id }, { organizationId: organization.id }],
      status: "aktif",
    },
    include: {
      kamar: {
        include: { properti: { select: { nama: true } } },
      },
      invoices: {
        where: { balanceDue: { gt: 0 } },
        orderBy: { dueDate: "asc" },
        take: 1,
      },
    },
    orderBy: { nama: "asc" },
  });

  return tenants.map((t) => ({
    id: t.id,
    nama: t.nama,
    noHp: t.noHp,
    kamarNomor: t.kamar?.nomor || "-",
    propertiNama: t.kamar?.properti?.nama || "Kost",
    unpaidInvoice: t.invoices[0]
      ? {
          id: t.invoices[0].id,
          invoiceNumber: t.invoices[0].invoiceNumber,
          balanceDue: Number(t.invoices[0].balanceDue),
          dueDate: t.invoices[0].dueDate.toISOString(),
        }
      : null,
  }));
}

export interface SendMessageInput {
  penghuniId?: string;
  recipientPhone: string;
  recipientName?: string;
  templateId?: string;
  customMessage?: string;
  variables?: Record<string, string>;
  providerName?: "direct" | "fonnte" | "mock";
}

export async function sendMessageAction(input: SendMessageInput) {
  const { user, organization } = await requireOrganization();

  const result = await communicationService.sendMessage({
    ...input,
    organizationId: organization.id,
    actorUserId: user.id,
  });

  revalidatePath("/dashboard/owner/pesan");
  return result;
}

export async function sendInvoiceReminderAction(
  invoiceId: string,
  reminderType: "reminder_h5" | "reminder_h1" | "reminder_due" | "overdue_h1"
) {
  const { user, organization } = await requireOrganization();

  const result = await communicationService.createInvoiceReminder(
    invoiceId,
    organization.id,
    reminderType,
    user.id
  );

  revalidatePath("/dashboard/owner/pesan");
  revalidatePath("/dashboard/owner/keuangan");
  return result;
}

export async function retryMessageAction(communicationId: string) {
  const { user, organization } = await requireOrganization();

  const comm = await prisma.communication.findUnique({
    where: { id: communicationId },
  });

  if (!comm || comm.organizationId !== organization.id) {
    throw new Error("Pesan tidak ditemukan atau bukan milik organisasi Anda");
  }

  // Attempt re-send via communicationService
  const sendResult = await communicationService.sendMessage({
    organizationId: organization.id,
    penghuniId: comm.penghuniId || undefined,
    recipientPhone: comm.recipientPhone,
    recipientName: comm.recipientName || undefined,
    templateId: comm.templateId || undefined,
    customMessage: comm.message,
    providerName: (comm.provider as any) || "direct",
    actorUserId: user.id,
  });

  revalidatePath("/dashboard/owner/pesan");
  return sendResult;
}

