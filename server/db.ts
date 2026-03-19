import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required. Set it in your environment variables.");
}

const connectionString = process.env.DATABASE_URL;

// Use prepare: false for Supabase connection pooler (Supavisor) compatibility
const client = postgres(connectionString, {
  ssl: "require",
  max: 10,
  prepare: false,
});

export const db = drizzle(client, { schema });
