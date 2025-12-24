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
  connectionTimeoutMillis: 60000,
  idleTimeoutMillis: 30000,
  max: 10,
});

pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

export const db = drizzle(pool, { schema });

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 4,
  baseDelay: number = 2000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err: any) {
      lastError = err;
      const isTimeoutError = err.message?.includes('timeout') || 
                             err.message?.includes('Connection terminated') ||
                             err.code === 'ETIMEDOUT' ||
                             err.code === 'ECONNRESET';
      
      if (!isTimeoutError || attempt === maxRetries) {
        throw err;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Database operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

export async function warmupDatabase(): Promise<void> {
  const startTime = Date.now();
  console.log('Warming up database connection...');
  
  try {
    await withRetry(async () => {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
    }, 5, 3000);
    const duration = Date.now() - startTime;
    console.log(`Database connection warm-up complete (${duration}ms)`);
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`Database warm-up failed after ${duration}ms:`, err);
  }
}
