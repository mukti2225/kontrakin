// Re-export commonly used model and enum types from the generated Prisma client
export type { Kamar, Penghuni, Properti, Transaksi, Pemeliharaan } from "../generated/prisma/client";
export type { Prisma } from "../generated/prisma/client";
export type { StatusKamar, TipeKamar, StatusPenghuni, TipeProperti } from "../generated/prisma/enums";

export * from "./dto";
