import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { readFileSync, existsSync } from "fs";

const { Pool } = pg;

function getDatabaseUrl(): string {
  // For published apps, Replit stores the production database URL in /tmp/replitdb
  const replitDbPath = '/tmp/replitdb';
  
  if (existsSync(replitDbPath)) {
    try {
      const url = readFileSync(replitDbPath, 'utf-8').trim();
      if (url) {
        console.log('Using production database from /tmp/replitdb');
        return url;
      }
    } catch (err) {
      console.error('Error reading /tmp/replitdb:', err);
    }
  }
  
  // Fall back to environment variable for development
  if (process.env.DATABASE_URL) {
    console.log('Using database from DATABASE_URL environment variable');
    return process.env.DATABASE_URL;
  }
  
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const databaseUrl = getDatabaseUrl();

export const pool = new Pool({ 
  connectionString: databaseUrl,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

export const db = drizzle(pool, { schema });
