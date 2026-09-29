import { Pool } from 'pg';

export async function teardown() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query("DELETE FROM events WHERE slug != 'dogfood-2026'");
  } finally {
    await pool.end();
  }
}
