// Re-export commonly used model and enum types from the generated Prisma client
export type {
  Kamar,
  Penghuni,
  Properti,
  Transaksi,
  Pemeliharaan,
  Organization,
  OrganizationUser,
  AuditLog,
  Lease,
  LeaseCharge,
  Invoice,
  InvoiceLine,
  Payment,
  PaymentAllocation,
  Vendor,
} from "../generated/prisma/client";
export type { Prisma } from "../generated/prisma/client";
export type { StatusKamar, TipeKamar, StatusPenghuni, TipeProperti, StatusPemeliharaan, Prioritas } from "../generated/prisma/enums";

export * from "./dto";

