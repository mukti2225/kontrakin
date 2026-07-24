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
