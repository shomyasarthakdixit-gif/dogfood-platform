import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function GET() {
  try {
    const pool = getDbPool();
    
    // Test the database connection
    await pool.query('SELECT 1');
    
    return NextResponse.json(
      { status: 'ok', database: 'ok' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { status: 'error', database: 'error' },
      { status: 503 }
    );
  }
}
