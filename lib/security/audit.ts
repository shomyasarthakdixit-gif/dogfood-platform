import { getDbPool } from '@/lib/db';

export async function logAudit(
  action: string,
  entityType: string,
  entityId: string,
  details: Record<string, unknown> = {},
  userId: string | null = null
) {
  const pool = getDbPool();
  try {
    await pool.query(
      'INSERT INTO audit_logs (action, entity_type, entity_id, details, user_id) VALUES ($1, $2, $3, $4, $5)',
      [action, entityType, entityId, details, userId]
    );
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
