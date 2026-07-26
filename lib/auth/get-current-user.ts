import { auth } from "./server";
import { headers } from "next/headers";

export type CurrentUser = Awaited<ReturnType<typeof auth.api.getSession>> extends { user: infer U } | null ? U : never;

export async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireOwner() {
  const user = await requireUser();
  if (user.role !== "owner") {
    throw new Error("FORBIDDEN: hanya untuk owner");
  }
  return user;
}

export async function requireOwnerId() {
  const user = await requireOwner();
  return user.id;
}

export async function requireTenant() {
  const user = await requireUser();
  // tenant tidak wajib dicek role ketat kalau kamu izinkan owner juga bisa jadi tenant di properti lain,
  // tapi kalau mau ketat aktifkan baris berikut:
  if (user.role !== "tenant") throw new Error("FORBIDDEN: hanya untuk tenant");
  return user;
}
