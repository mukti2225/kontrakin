"use server";

import { prisma } from "@/lib/db/prisma";
import { requireTenant } from "@/lib/auth/get-current-user";

export interface TenantDashboardDTO {
  isAssigned: boolean;
  tenantName: string;
  tenantPhone: string;
  tenantEmail: string;
  unit?: {
    id: string;
    nomor: string;
    tipe: string;
    propertiNama: string;
    propertiAlamat: string;
    hargaBulanan: number;
  };
  activeLease?: {
    id: string;
    nomorKontrak: string | null;
    startDate: string;
    endDate: string;
    rentAmount: number;
    depositAmount: number;
    billingDay: number;
    status: string;
  };
  currentBill?: {
    id: string;
    invoiceNumber: string;
    balanceDue: number;
    total: number;
    dueDate: string;
    isOverdue: boolean;
  };
  recentPayments: Array<{
    id: string;
    invoiceNumber: string;
    amount: number;
    paidAt: string;
    status: string;
  }>;
  recentMaintenance: Array<{
    id: string;
    judul: string;
    status: string;
    prioritas: string;
    kategori: string;
    createdAt: string;
  }>;
  ownerContact?: {
    name: string;
    phone: string;
  };
}

export async function getTenantDashboardData(): Promise<TenantDashboardDTO> {
  const user = await requireTenant();

  // Find tenant record linked to this user account
  const tenant = await prisma.penghuni.findFirst({
    where: {
      OR: [
        { userId: user.id },
        { email: user.email },
      ],
    },
    include: {
      kamar: {
        include: {
          properti: true,
          owner: { select: { name: true, email: true } },
        },
      },
      leases: {
        where: { status: { in: ["active", "expiring"] } },
        orderBy: { startDate: "desc" },
        take: 1,
      },
      invoices: {
        orderBy: { dueDate: "asc" },
      },
      pemeliharaan: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!tenant || !tenant.kamar) {
    return {
      isAssigned: false,
      tenantName: user.name,
      tenantPhone: "-",
      tenantEmail: user.email,
      recentPayments: [],
      recentMaintenance: [],
    };
  }

  // Active lease
  const activeLease = tenant.leases[0];

  // Identify oldest unpaid invoice
  const unpaidInvoices = tenant.invoices.filter((inv) => Number(inv.balanceDue) > 0);
  const now = new Date();
  let currentBill: TenantDashboardDTO["currentBill"] = undefined;

  if (unpaidInvoices.length > 0) {
    const primaryUnpaid = unpaidInvoices[0];
    const dueTime = new Date(primaryUnpaid.dueDate).getTime();
    currentBill = {
      id: primaryUnpaid.id,
      invoiceNumber: primaryUnpaid.invoiceNumber,
      balanceDue: Number(primaryUnpaid.balanceDue),
      total: Number(primaryUnpaid.total),
      dueDate: primaryUnpaid.dueDate.toISOString(),
      isOverdue: now.getTime() > dueTime,
    };
  }

  // Recent paid invoices
  const paidInvoices = tenant.invoices
    .filter((inv) => inv.status === "paid")
    .slice(0, 5)
    .map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      amount: Number(inv.total),
      paidAt: inv.updatedAt.toISOString(),
      status: "Lunas",
    }));

  // Recent maintenance tickets
  const recentMaintenance = tenant.pemeliharaan.map((p) => ({
    id: p.id,
    judul: p.judul,
    status: p.status,
    prioritas: p.prioritas,
    kategori: p.kategori,
    createdAt: p.createdAt.toISOString(),
  }));

  return {
    isAssigned: true,
    tenantName: tenant.nama,
    tenantPhone: tenant.noHp,
    tenantEmail: tenant.email || user.email,
    unit: {
      id: tenant.kamar.id,
      nomor: tenant.kamar.nomor,
      tipe: tenant.kamar.tipe,
      propertiNama: tenant.kamar.properti?.nama || "Kost",
      propertiAlamat: tenant.kamar.properti?.alamat || "-",
      hargaBulanan: tenant.kamar.hargaBulanan,
    },
    activeLease: activeLease
      ? {
          id: activeLease.id,
          nomorKontrak: activeLease.nomorKontrak,
          startDate: activeLease.startDate.toISOString(),
          endDate: activeLease.endDate.toISOString(),
          rentAmount: Number(activeLease.rentAmount),
          depositAmount: Number(activeLease.depositAmount),
          billingDay: activeLease.billingDay,
          status: activeLease.status,
        }
      : undefined,
    currentBill,
    recentPayments: paidInvoices,
    recentMaintenance,
    ownerContact: {
      name: tenant.kamar.owner?.name || "Pengelola",
      phone: "-",
    },
  };
}
