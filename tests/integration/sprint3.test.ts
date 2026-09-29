/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { getDbPool } from '@/lib/db';
import { POST as registerPost } from '@/app/api/events/[eventId]/register/route';
import { POST as autoAssignPost } from '@/app/api/events/[eventId]/assignments/auto/route';

// Mocks
vi.mock('@/lib/auth', () => ({
  requireUser: vi.fn(),
  requireEventAdmin: vi.fn(),
}));
import { requireUser, requireEventAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

describe('Sprint 3: Registration and Judging Config', () => {
  const testUser1Id = '90000000-0000-0000-0000-000000000001';
  const testJudge1Id = '90000000-0000-0000-0000-000000000002';
  const testJudge2Id = '90000000-0000-0000-0000-000000000003';
  const event1Id = '91111111-1111-1111-1111-111111111111';
  const event2Id = '92222222-2222-2222-2222-222222222222';
  
  let pool: any;
  
  beforeAll(async () => {
    pool = getDbPool();
  });

  afterAll(async () => {
    // Cleanup mock data
    await pool.query("DELETE FROM event_members WHERE event_id IN ($1, $2)", [event1Id, event2Id]);
    await pool.query("DELETE FROM judge_assignments WHERE judge_id IN (SELECT id FROM judge_profiles WHERE event_id = $1)", [event2Id]);
    await pool.query("DELETE FROM judge_profiles WHERE event_id = $1", [event2Id]);
    await pool.query("DELETE FROM submissions WHERE event_id = $1", [event2Id]);
    await pool.query("DELETE FROM teams WHERE event_id = $1", [event2Id]);
    await pool.query("DELETE FROM events WHERE id IN ($1, $2)", [event1Id, event2Id]);
    await pool.query("DELETE FROM users WHERE id IN ($1, $2, $3)", [testUser1Id, testJudge1Id, testJudge2Id]);
    
    await pool.end();
  });

  it('Participant Registration', async () => {
    const user = { id: testUser1Id, role: 'USER' };
    const eventId = event1Id;

    // Mock an event in REGISTRATION state
    await pool.query(`
      INSERT INTO events (id, slug, name, status, start_date, end_date) 
      VALUES ($1, 'test-event-reg', 'Test Event Reg', 'REGISTRATION', NOW() - INTERVAL '1 day', NOW() + INTERVAL '1 day')
      ON CONFLICT (id) DO UPDATE SET status = 'REGISTRATION'
    `, [eventId]);
    
    await pool.query(`INSERT INTO users (id, name, email) VALUES ($1, 'U1', 'u1@test.com') ON CONFLICT DO NOTHING`, [user.id]);

    (requireUser as any).mockResolvedValue({ user, error: null });

    const req = new Request(`http://localhost/api/events/${eventId}/register`, { method: 'POST' });
    const res = await registerPost(req, { params: Promise.resolve({ eventId }) });

    expect(res.status).toBe(201);
    
    // Attempt duplicate
    const res2 = await registerPost(req, { params: Promise.resolve({ eventId }) });
    expect(res2.status).toBe(409);
  });

  it('Organizer Auto Assignment validates required judges', async () => {
    const admin = { id: '00000000-0000-0000-0000-000000000009', role: 'ADMIN' };
    const eventId = event2Id;
    (requireEventAdmin as any).mockResolvedValue({ user: admin, error: null });

    // Event with required_judges = 3
    await pool.query(`
      INSERT INTO events (id, slug, name, status, start_date, end_date, required_judges, judges_per_submission) 
      VALUES ($1, 'test-event-assign', 'Test Event Assign', 'SUBMISSION', NOW() - INTERVAL '1 day', NOW() + INTERVAL '1 day', 3, 2)
      ON CONFLICT (id) DO UPDATE SET required_judges = 3, judges_per_submission = 2
    `, [eventId]);

    // Insert 1 submission
    const teamId = '93333333-3333-3333-3333-333333333333';
    await pool.query(`INSERT INTO teams (id, event_id, name) VALUES ($1, $2, 'Team A') ON CONFLICT DO NOTHING`, [teamId, eventId]);
    await pool.query(`INSERT INTO submissions (id, team_id, event_id, title, status) VALUES ('94444444-4444-4444-4444-444444444444', $1, $2, 'Proj', 'SUBMITTED') ON CONFLICT DO NOTHING`, [teamId, eventId]);

    // Insert 2 judges (less than required_judges=3)
    await pool.query(`INSERT INTO users (id, name, email) VALUES ($1, 'J1', 'j1@x.com') ON CONFLICT DO NOTHING`, [testJudge1Id]);
    await pool.query(`INSERT INTO users (id, name, email) VALUES ($1, 'J2', 'j2@x.com') ON CONFLICT DO NOTHING`, [testJudge2Id]);
    
    await pool.query(`INSERT INTO judge_profiles (id, user_id, event_id) VALUES ('97777777-7777-7777-7777-777777777777', $1, $2) ON CONFLICT DO NOTHING`, [testJudge1Id, eventId]);
    await pool.query(`INSERT INTO judge_profiles (id, user_id, event_id) VALUES ('98888888-8888-8888-8888-888888888888', $1, $2) ON CONFLICT DO NOTHING`, [testJudge2Id, eventId]);

    const req = new Request('http://localhost/api', { 
      method: 'POST',
      body: JSON.stringify({ judgesPerSubmission: 2 })
    });
    const res = await autoAssignPost(req, { params: Promise.resolve({ eventId }) });
    const data = await res.json();
    
    expect(res.status).toBe(400);
    expect(data.error.message).toContain('Not enough judges configured');
  });

});

