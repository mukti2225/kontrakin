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
        defaultValue: "owner",
        input: false, // Disallow client from supplying registrationRole via public signup
      },
      kodeUndangan: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Public signup is strictly reserved for Owner.
          // Staff are invited by Owner, Tenants are activated by Owner via secure activation links,
          // and Superadmins are provisioned internally.
          // Unconditionally force 'owner' role to prevent client role injection or escalation.
          return {
            data: {
              ...user,
              role: "owner",
              registrationRole: "owner",
            },
          };
        },
      },
    },
  },

  plugins: [
    admin({
      defaultRole: "owner",
      adminRoles: ["super-admin"],
      roles,
    }),
  ],
});
