import { requireTenant } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/db/prisma";
import { Home } from "lucide-react";
import { TagihanClient, type InvoiceDTO } from "./tagihan-client";

interface TagihanPageProps {
  searchParams?: Promise<{ success?: string }>;
}

export default async function TagihanPage({ searchParams }: TagihanPageProps) {
  const user = await requireTenant();
  const params = searchParams ? await searchParams : undefined;
  const isSuccess = params?.success === "true";

  // Ambil data penghuni berdasarkan user login
  const penghuni = await prisma.penghuni.findFirst({
    where: { userId: user.id },
    include: {
      kamar: {
        include: {
          properti: true,
          owner: { select: { name: true } },
        },
      },
      leases: {
        where: { status: { in: ["active", "expiring"] } },
        orderBy: { startDate: "desc" },
        take: 1,
      },
    },
  });

  const kamar = penghuni?.kamar;

  if (!penghuni || !kamar) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 p-8 text-center animate-in fade-in zoom-in duration-300">
        <div className="p-5 bg-slate-100 rounded-full text-slate-500">
          <Home className="size-10" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Belum Ada Kamar</h2>
        <p className="text-slate-500 max-w-md text-sm">
          Anda belum ditempatkan di unit kamar aktif oleh pengelola kos. Silakan hubungi pemilik kontrakan Anda untuk informasi lebih lanjut.
        </p>
      </div>
    );
  }

  // Ambil seluruh invoice riil penghuni ini
  const rawInvoices = await prisma.invoice.findMany({
    where: { penghuniId: penghuni.id },
    include: {
      lines: true,
      allocations: {
        include: { payment: true },
        take: 1,
      },
    },
    orderBy: { dueDate: "desc" },
  });

  const invoices: InvoiceDTO[] = rawInvoices.map((inv) => {
    const primaryPayment = inv.allocations[0]?.payment;
    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      issueDate: inv.issueDate.toISOString(),
      dueDate: inv.dueDate.toISOString(),
      subtotal: Number(inv.subtotal),
      total: Number(inv.total),
      balanceDue: Number(inv.balanceDue),
      status: inv.status,
      updatedAt: inv.updatedAt.toISOString(),
      lines: inv.lines.map((l) => ({
        id: l.id,
        description: l.description,
        amount: Number(l.amount),
      })),
      payment: primaryPayment
        ? {
            method: primaryPayment.paymentMethod,
            reference: primaryPayment.paymentReference || primaryPayment.id,
            paidAt: primaryPayment.paidAt.toISOString(),
          }
        : undefined,
    };
  });

  return (
    <TagihanClient
      penghuni={{
        id: penghuni.id,
        nama: penghuni.nama,
        noHp: penghuni.noHp,
        email: penghuni.email,
      }}
      kamar={{
        nomor: kamar.nomor,
        tipe: kamar.tipe,
        hargaBulanan: Number(penghuni.leases[0]?.rentAmount || kamar.hargaBulanan),
        propertiNama: kamar.properti?.nama || "Properti Kontrakin",
        propertiAlamat: kamar.properti?.alamat || "-",
        ownerName: kamar.owner?.name || "Pengelola",
      }}
      invoices={invoices}
      initialSuccess={isSuccess}
    />
  );
}
