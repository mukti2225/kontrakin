import "dotenv/config";
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { hashPassword } from "better-auth/crypto";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const superAdminEmail = process.env.SUPER_ADMIN_EMAIL ?? "superadmin@kontrakin.com";
const superAdminName = process.env.SUPER_ADMIN_NAME ?? "Super Admin";
const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD ?? "superadmin123";

const client = new Client({ connectionString: databaseUrl });

async function main() {
  await client.connect();

  const passwordHash = await hashPassword(superAdminPassword);
  const userId = randomUUID();
  const accountId = randomUUID();
  const now = new Date();

  await client.query("BEGIN");

  try {
    await client.query('DELETE FROM "account" WHERE "providerId" = $1 AND "userId" IN (SELECT "id" FROM "user" WHERE "email" = $2)', ["credential", superAdminEmail]);
    await client.query('DELETE FROM "session" WHERE "userId" IN (SELECT "id" FROM "user" WHERE "email" = $1)', [superAdminEmail]);
    await client.query('DELETE FROM "user" WHERE "email" = $1', [superAdminEmail]);

    await client.query(
      'INSERT INTO "user" ("id", "name", "email", "role", "registrationRole", "banned", "banReason", "banExpires", "emailVerified", "image", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
      [userId, superAdminName, superAdminEmail, "super-admin", "tenant", false, null, null, true, null, now, now],
    );

    await client.query('INSERT INTO "account" ("id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7)', [accountId, userId, "credential", userId, passwordHash, now, now]);

    await client.query("COMMIT");

    console.log(`Seeded super-admin: ${superAdminEmail}`);
    console.log(`Temporary password: ${superAdminPassword}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
