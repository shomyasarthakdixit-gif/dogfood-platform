import { expect, test, describe, afterAll } from 'vitest'
import { getDbPool } from '@/lib/db'

describe('Database Integration', () => {
  const pool = getDbPool();

  afterAll(async () => {
    await pool.end();
  });

  test('can connect to database', async () => {
    const res = await pool.query('SELECT 1 as result');
    expect(res.rows[0].result).toBe(1);
  });

  test('global users have only platform roles', async () => {
    const res = await pool.query('SELECT DISTINCT role FROM users');
    const roles = res.rows.map(r => r.role);
    expect(roles).toContain('USER');
    expect(roles).not.toContain('JUDGE');
    expect(roles).not.toContain('ORGANIZER');
  });

  test('event members can have event-specific roles', async () => {
    const res = await pool.query('SELECT DISTINCT role FROM event_members');
    const roles = res.rows.map(r => r.role);
    expect(roles).toContain('ORGANIZER');
    expect(roles).toContain('JUDGE');
    expect(roles).toContain('PARTICIPANT');
  });

  test('a user can hold different event-level roles across events', async () => {
    // This is structurally allowed by the UNIQUE (event_id, user_id) constraint
    // which does not restrict the user_id globally.
    const userRes = await pool.query('SELECT id FROM users LIMIT 1');
    const userId = userRes.rows[0].id;

    const event1Res = await pool.query("INSERT INTO events (slug, name, start_date, end_date) VALUES ('event1', 'E1', NOW(), NOW()) RETURNING id");
    const event2Res = await pool.query("INSERT INTO events (slug, name, start_date, end_date) VALUES ('event2', 'E2', NOW(), NOW()) RETURNING id");
    
    await pool.query("INSERT INTO event_members (event_id, user_id, role) VALUES ($1, $2, 'JUDGE')", [event1Res.rows[0].id, userId]);
    await pool.query("INSERT INTO event_members (event_id, user_id, role) VALUES ($1, $2, 'PARTICIPANT')", [event2Res.rows[0].id, userId]);
    
    const check = await pool.query('SELECT event_id, role FROM event_members WHERE user_id = $1 AND event_id IN ($2, $3)', [userId, event1Res.rows[0].id, event2Res.rows[0].id]);
    expect(check.rows.length).toBe(2);
  });

  test('votes table handles constraints correctly', async () => {
    const userRes = await pool.query('SELECT id FROM users LIMIT 1');
    const userId = userRes.rows[0].id;
    const subRes = await pool.query('SELECT id FROM submissions LIMIT 1');
    const subId = subRes.rows[0].id;

    // 1. Authenticated vote
    await pool.query('INSERT INTO votes (user_id, submission_id) VALUES ($1, $2)', [userId, subId]);
    
    // 2. Authenticated vote uniqueness
    await expect(pool.query('INSERT INTO votes (user_id, submission_id) VALUES ($1, $2)', [userId, subId])).rejects.toThrow();

    // 3. Anonymous vote
    const token = 'anonymous_token_xyz';
    await pool.query('INSERT INTO votes (voter_token_hash, submission_id) VALUES ($1, $2)', [token, subId]);

    // 4. Anonymous vote uniqueness
    await expect(pool.query('INSERT INTO votes (voter_token_hash, submission_id) VALUES ($1, $2)', [token, subId])).rejects.toThrow();

    // 5. Cannot exist without either user or token
    await expect(pool.query('INSERT INTO votes (submission_id) VALUES ($1)', [subId])).rejects.toThrow();
    
    // 6. Cannot exist with BOTH user and token
    await expect(pool.query('INSERT INTO votes (user_id, voter_token_hash, submission_id) VALUES ($1, $2, $3)', [userId, token, subId])).rejects.toThrow();
  });

  test('seed contains 3 judges, 3 teams, and 3 submissions', async () => {
    const eventRes = await pool.query("SELECT id FROM events WHERE slug = 'dogfood-2026'");
    const eventId = eventRes.rows[0].id;

    const judgeRes = await pool.query("SELECT count(*) FROM event_members WHERE event_id = $1 AND role = 'JUDGE'", [eventId]);
    expect(parseInt(judgeRes.rows[0].count)).toBe(3);

    const teamRes = await pool.query("SELECT count(*) FROM teams WHERE event_id = $1", [eventId]);
    expect(parseInt(teamRes.rows[0].count)).toBe(3);

    const subRes = await pool.query("SELECT count(*) FROM submissions WHERE event_id = $1", [eventId]);
    expect(parseInt(subRes.rows[0].count)).toBe(3);
  });

  test('judge/submission relationships are queryable', async () => {
    const res = await pool.query(`
      SELECT jp.user_id, count(ja.id) as assigned_count
      FROM judge_profiles jp
      JOIN judge_assignments ja ON jp.id = ja.judge_id
      GROUP BY jp.user_id
    `);
    
    expect(res.rows.length).toBeGreaterThan(0);
    // Based on our seed, judges have 2 assignments each
    expect(parseInt(res.rows[0].assigned_count)).toBe(2);
  });
})
