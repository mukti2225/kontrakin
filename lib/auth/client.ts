"use client";

import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL,
  plugins: [adminClient()],
});

export const { signIn, signOut, signUp, useSession, requestPasswordReset } = authClient;

export type RegistrationRole = "owner";

/**
 * Public registration helper strictly provisioning Owner accounts.
 */
export async function signUpOwner(input: { email: string; password: string; name: string }) {
  return signUp.email({
    email: input.email,
    password: input.password,
    name: input.name,
  });
}

/**
 * Backward compatibility wrapper - client-supplied role is ignored by server
 */
export async function signUpWithRegistrationRole(input: {
  email: string;
  password: string;
  name: string;
  registrationRole?: string;
}) {
  return signUpOwner({
    email: input.email,
    password: input.password,
    name: input.name,
  });
}
