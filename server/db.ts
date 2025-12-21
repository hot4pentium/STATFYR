import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import fs from "fs";

const { Pool } = pg;

function getDatabaseUrl(): string {
  // For published apps, check /tmp/replitdb first
  try {
    if (fs.existsSync('/tmp/replitdb')) {
      const dbUrl = fs.readFileSync('/tmp/replitdb', 'utf-8').trim();
      if (dbUrl) {
        console.log('Using database URL from /tmp/replitdb');
        return dbUrl;
      }
    }
  } catch (e) {
    // Fall through to environment variable
  }
  
  // Fall back to environment variable
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
  console.log('Using database URL from environment variable');
  return process.env.DATABASE_URL;
}

const databaseUrl = getDatabaseUrl();
export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle(pool, { schema });
