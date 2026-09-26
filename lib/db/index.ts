import { Pool } from 'pg';

// Create a single pool instance to be reused across requests
let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return pool;
}

export async function query(text: string, params?: unknown[]) {
  const dbPool = getDbPool();
  
  try {
    const res = await dbPool.query(text, params);
    // Log in development or based on config, omitted here for brevity
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}
