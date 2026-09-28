import { getDbPool } from '@/lib/db';

/**
 * Validates if an action by a specific identifier is within the allowed rate limit.
 * Implements a simple fixed-window rate limit backed by PostgreSQL.
 * 
 * @param action - Action being performed (e.g., 'vote', 'comment')
 * @param identifier - Unique identifier for the actor (e.g., user ID, IP hash)
 * @param limit - Maximum number of allowed actions within the window
 * @param windowMs - Time window in milliseconds
 * @returns { allowed: boolean, remaining: number }
 */
export async function checkRateLimit(
  action: string, 
  identifier: string, 
  limit: number, 
  windowMs: number
): Promise<{ allowed: boolean; remaining: number }> {
  const pool = getDbPool();
  const key = `${action}:${identifier}`;
  
  // Clean up 1% of the time to avoid table bloat
  if (Math.random() < 0.01) {
    pool.query('DELETE FROM rate_limits WHERE expires_at < NOW()').catch(() => {});
  }

  // Calculate new expiration time
  const expiresAt = new Date(Date.now() + windowMs);

  const res = await pool.query(`
    INSERT INTO rate_limits (key, points, expires_at)
    VALUES ($1, 1, $2)
    ON CONFLICT (key) DO UPDATE
    SET 
      points = CASE WHEN rate_limits.expires_at < NOW() THEN 1 ELSE rate_limits.points + 1 END,
      expires_at = CASE WHEN rate_limits.expires_at < NOW() THEN $2 ELSE rate_limits.expires_at END
    RETURNING points
  `, [key, expiresAt]);

  const points = res.rows[0].points;
  const remaining = Math.max(0, limit - points);

  return {
    allowed: points <= limit,
    remaining
  };
}
