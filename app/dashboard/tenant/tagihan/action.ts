"use server";

import { requireTenant } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { billingService } from "@/lib/services/billing.service";

export async function bayarTagihan(formData: FormData) {
  const user = await requireTenant();
  const metode = (formData.get("metode") as string) || "Transfer Bank";
  const invoiceId = formData.get("invoiceId") as string | null;

  const penghuni = await prisma.penghuni.findFirst({
    where: { userId: user.id },
    include: {
      kamar: true,
      leases: { where: { status: "active" }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!penghuni || !penghuni.kamarId || !penghuni.kamar) {
    throw new Error("Kamar tidak ditemukan");
  }

  // 1. Identify specific target invoice or oldest unpaid invoice
  let pendingInvoice = null;
  if (invoiceId) {
    pendingInvoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        penghuniId: penghuni.id,
      },
      include: { lines: true },
    });
  }

  if (!pendingInvoice) {
    pendingInvoice = await prisma.invoice.findFirst({
      where: {
        penghuniId: penghuni.id,
        status: { in: ["issued", "partial", "overdue"] },
        balanceDue: { gt: 0 },
      },
      include: { lines: true },
      orderBy: { dueDate: "asc" },
    });
  }

  // 2. If no invoice exists, generate one for the active lease/room
  if (!pendingInvoice) {
    const activeLease = penghuni.leases[0];
    const organizationId = penghuni.organizationId || penghuni.kamar.organizationId || "default-org";
    const amountToPay = activeLease ? Number(activeLease.rentAmount) : Number(penghuni.kamar.hargaBulanan);

    const today = new Date();
    const period = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const invoiceNumber = `INV-${period}-${penghuni.kamar.nomor}-${Date.now().toString().slice(-4)}`;

    pendingInvoice = await prisma.invoice.create({
      data: {
        organizationId,
        penghuniId: penghuni.id,
        leaseId: activeLease?.id || null,
        invoiceNumber,
        issueDate: today,
        dueDate: new Date(today.getFullYear(), today.getMonth(), 5),
        subtotal: amountToPay,
        total: amountToPay,
        balanceDue: amountToPay,
        status: "issued",
        lines: {
          create: [
            {
              type: "rent",
              description: `Sewa Kamar ${penghuni.kamar.nomor} - Periode ${period}`,
              quantity: 1,
              unitPrice: amountToPay,
              amount: amountToPay,
            },
          ],
        },
      },
      include: { lines: true },
    });
  }

  const amountToPay = Number(pendingInvoice.balanceDue);
  if (amountToPay <= 0) {
    throw new Error("Tagihan ini sudah lunas");
  }

  // 3. Atomically record payment and allocate to invoice
  await billingService.recordPayment({
    organizationId: pendingInvoice.organizationId,
    penghuniId: penghuni.id,
    invoiceId: pendingInvoice.id,
    amount: amountToPay,
    paymentMethod: metode,
    paymentReference: `SIMULASI-${Date.now()}`,
    actorUserId: user.id,
  });

  revalidatePath("/dashboard/tenant");
  revalidatePath("/dashboard/tenant/tagihan");
  revalidatePath("/dashboard/owner/keuangan");
  revalidatePath("/dashboard/owner/kontrak");
  revalidatePath("/dashboard/owner");
  redirect("/dashboard/tenant/tagihan?success=true");
}
