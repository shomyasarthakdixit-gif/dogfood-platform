import { expect, test, describe, afterAll, beforeAll, vi, beforeEach } from 'vitest';
import { getDbPool } from '@/lib/db';
import { GET as getGallery } from '@/app/api/events/[eventId]/gallery/route';
import { POST as createEvent } from '@/app/api/events/route';
import { POST as createTeam } from '@/app/api/events/[eventId]/teams/route';
import { POST as createSubmission } from '@/app/api/events/[eventId]/submissions/route';
import { POST as submitSubmission } from '@/app/api/submissions/[submissionId]/submit/route';
import { createSession } from '@/lib/auth';

const mockCookies = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };
vi.mock('next/headers', () => ({ cookies: vi.fn(async () => mockCookies) }));

describe('Sprint 2.5: Top 10 Projects Gallery', () => {
  const pool = getDbPool();
  let adminId: string, part1Id: string;
  let submissionEventId: string, resultsEventId: string;
  let sub1Id: string;

  beforeAll(async () => {
    adminId = (await pool.query("INSERT INTO users (email, name, role) VALUES ('admin@gallery.com', 'Admin', 'ADMIN') RETURNING id")).rows[0].id;
    part1Id = (await pool.query("INSERT INTO users (email, name, role) VALUES ('part1@gallery.com', 'Part1', 'USER') RETURNING id")).rows[0].id;
  });

  afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email LIKE '%gallery.com'");
    await pool.end();
  });

  beforeEach(() => { vi.clearAllMocks(); });

  async function mockSession(userId: string) {
    await createSession(userId);
    const lastCall = mockCookies.set.mock.calls[mockCookies.set.mock.calls.length - 1];
    mockCookies.get.mockReturnValue({ value: lastCall[1] });
  }

  async function makeReq(body?: Record<string, unknown> | null, urlParams?: string) {
    return new Request(`http://localhost${urlParams ? '?' + urlParams : ''}`, {
      method: body ? 'POST' : 'GET',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  test('Setup Events & Submissions', async () => {
    await mockSession(adminId);
    let res = await createEvent(await makeReq({
      name: 'Submission Event', slug: 'sub-event-' + Date.now(),
      start_date: new Date().toISOString(), end_date: new Date(Date.now() + 86400000).toISOString(),
      submission_end: new Date(Date.now() + 86400000).toISOString(),
      status: 'SUBMISSION'
    }));
    submissionEventId = (await res.json()).event.id;

    res = await createEvent(await makeReq({
      name: 'Results Event', slug: 'results-event-' + Date.now(),
      start_date: new Date().toISOString(), end_date: new Date(Date.now() + 86400000).toISOString(),
      status: 'RESULTS'
    }));
    resultsEventId = (await res.json()).event.id;

    await pool.query("INSERT INTO event_members (event_id, user_id, role) VALUES ($1, $2, 'PARTICIPANT')", [resultsEventId, part1Id]);

    // Part 1 -> Team 1 -> Sub 1 (Submitted)
    await mockSession(part1Id);
    const teamRes = await createTeam(await makeReq({ name: 'Team Alpha' }), { params: Promise.resolve({ eventId: resultsEventId }) });
    const team1Id = (await teamRes.json()).team.id;

    const subRes = await createSubmission(await makeReq({ title: 'Robot Alpha', description: 'Best robot' }), { params: Promise.resolve({ eventId: resultsEventId }) });
    sub1Id = (await subRes.json()).submission.id;
    await submitSubmission(await makeReq({}), { params: Promise.resolve({ submissionId: sub1Id }) });

    // Give it an evaluation score
    await mockSession(adminId);
    const jpRes = await pool.query("INSERT INTO judge_profiles (user_id, event_id) VALUES ($1, $2) RETURNING id", [adminId, resultsEventId]);
    const jaRes = await pool.query("INSERT INTO judge_assignments (judge_id, submission_id) VALUES ($1, $2) RETURNING id", [jpRes.rows[0].id, sub1Id]);
    await pool.query("INSERT INTO evaluations (assignment_id, total_score, status) VALUES ($1, 95, 'SUBMITTED')", [jaRes.rows[0].id]);
  });

  test('Top 10 hidden before RESULTS (e.g. SUBMISSION status)', async () => {
    mockCookies.get.mockReturnValue(undefined); // No auth
    const req = await makeReq();
    const res = await getGallery(req, { params: Promise.resolve({ eventId: submissionEventId }) });
    expect(res.status).toBe(403);
  });

  test('Top 10 visible after RESULTS', async () => {
    mockCookies.get.mockReturnValue(undefined); // No auth
    const req = await makeReq();
    const res = await getGallery(req, { params: Promise.resolve({ eventId: resultsEventId }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    
    expect(data.items.length).toBe(1); // Only sub1
    expect(data.items[0].id).toBe(sub1Id);
    expect(data.items[0].team.name).toBe('Team Alpha');
    expect(data.items[0].rank).toBeDefined();
  });

  test('ARCHIVED event keeps Top 10 visible', async () => {
    await pool.query("UPDATE events SET status = 'ARCHIVED' WHERE id = $1", [resultsEventId]);
    mockCookies.get.mockReturnValue(undefined); // No auth
    const req = await makeReq();
    const res = await getGallery(req, { params: Promise.resolve({ eventId: resultsEventId }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items.length).toBe(1);
    
    // Put back to results for future if needed
    await pool.query("UPDATE events SET status = 'RESULTS' WHERE id = $1", [resultsEventId]);
  });

  test('Top 10 response does not expose private information', async () => {
    mockCookies.get.mockReturnValue(undefined); // No auth
    const req = await makeReq();
    const res = await getGallery(req, { params: Promise.resolve({ eventId: resultsEventId }) });
    const data = await res.json();
    
    const item = data.items[0];
    expect(item).not.toHaveProperty('total_score');
    expect(item).not.toHaveProperty('evaluations');
    expect(item).not.toHaveProperty('judge_id');
  });
});

