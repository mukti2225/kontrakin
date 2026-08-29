"use client";

import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL,
  plugins: [adminClient()],
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
