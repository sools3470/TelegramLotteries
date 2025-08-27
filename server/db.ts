import pkg from 'pg';
const { Pool } = pkg as unknown as typeof import('pg');
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("sslmode=") ? undefined : { rejectUnauthorized: false },
});
export const db = drizzle(pool, { schema });
