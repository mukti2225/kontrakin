import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins/admin";
import { createAccessControl } from "better-auth/plugins/access";
import { prisma } from "@/lib/db/prisma";

const ac = createAccessControl({
  user: ["create", "list", "set-role", "ban", "impersonate", "impersonate-admins", "delete", "set-password", "set-email", "get", "update"],
  session: ["list", "revoke", "delete"],
});

const roles = {
  "super-admin": ac.newRole({
    user: ["create", "list", "set-role", "ban", "impersonate", "impersonate-admins", "delete", "set-password", "set-email", "get", "update"],
    session: ["list", "revoke", "delete"],
  }),
  owner: ac.newRole({
    user: ["list", "get", "update"],
    session: ["list", "revoke"],
  }),
  tenant: ac.newRole({}),
};

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      console.log(`Reset password ${user.email}: ${url}`);
    },
  },

  user: {
    additionalFields: {
      registrationRole: {
        type: "string",
        required: false,
        defaultValue: "tenant",
        input: true,
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const role = user.registrationRole === "owner" ? "owner" : "tenant";
          return { data: { ...user, role } };
        },
      },
    },
  },

  plugins: [
    admin({
      defaultRole: "tenant",
      adminRoles: ["super-admin"],
      roles,
    }),
  ],
});
