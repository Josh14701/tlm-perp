/**
 * Run database migrations against Supabase Postgres.
 * Usage: npx tsx scripts/migrate.ts
 * Requires DATABASE_URL env var.
 */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  console.log("[migrate] Connecting to database...");
  const client = postgres(url, { ssl: "require", max: 1, prepare: false });
  const db = drizzle(client);

  console.log("[migrate] Running migrations...");
  await migrate(db, { migrationsFolder: "./migrations" });

  console.log("[migrate] Migrations complete!");
  await client.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("[migrate] Migration failed:", err);
  process.exit(1);
});
