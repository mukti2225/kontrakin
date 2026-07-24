"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
});

export const { signIn, signOut, signUp, useSession, requestPasswordReset } = authClient;

export type RegistrationRole = "tenant" | "owner";

export async function signUpWithRegistrationRole(input: { email: string; password: string; name: string; registrationRole: RegistrationRole }) {
  return signUp.email({
    email: input.email,
    password: input.password,
    name: input.name,

    fetchOptions: {
      body: {
        registrationRole: input.registrationRole,
      },
    },
  });
}
