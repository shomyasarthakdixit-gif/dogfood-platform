import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest';
import { getDbPool } from '../../lib/db';
import { calculateNormalizedResults } from '../../lib/judging/normalization';
import { POST as createJudge, GET as getJudges } from '../../app/api/events/[eventId]/judges/route';
import { POST as autoAssign } from '../../app/api/events/[eventId]/assignments/auto/route';
import { POST as startEval } from '../../app/api/assignments/[assignmentId]/start/route';
import { POST as saveEval } from '../../app/api/assignments/[assignmentId]/evaluation/route';
import { GET as getResults } from '../../app/api/events/[eventId]/results/normalized/route';

import crypto from 'crypto';

const mockCookies = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => mockCookies)
}));

const pool = getDbPool();

let adminId = '';
let organizerId = '';
let judge1Id = '';
let judge2Id = '';
let participantId = '';

let eventId = '';
let team1Id = '';
let sub1Id = '';
let team2Id = '';
let sub2Id = '';

let rubricId = '';
let crit1Id = '';
let crit2Id = '';

// Helper to mock session cookie
async function mockSession(userId: string) {
  const token = 'test-token';
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  await pool.query('DELETE FROM sessions WHERE token_hash = $1', [hashedToken]);
  await pool.query('INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + interval \'1 hour\')', [userId, hashedToken]);
  
  mockCookies.get.mockImplementation((name: string) => (name === 'dogfood_session' ? { value: token } : undefined));
}

async function makeReq(body?: Record<string, unknown> | null, urlParams?: string) {
  const url = `http://localhost:3000/api/test${urlParams ? '?' + urlParams : ''}`;
  return new Request(url, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
}

describe('Sprint 3: Judging Engine', () => {
  beforeAll(async () => {
    await pool.query("DELETE FROM users WHERE email LIKE '%@judging.test'");
    
    // Create users
    const createU = async (email: string, role: string) => {
      const res = await pool.query("INSERT INTO users (email, name, role, password_hash) VALUES ($1, $2, $3, 'hash') RETURNING id", [email, email, role]);
      return res.rows[0].id;
    };

    adminId = await createU('admin@judging.test', 'ADMIN');
    organizerId = await createU('org@judging.test', 'USER');
    judge1Id = await createU('judge1@judging.test', 'USER');
    judge2Id = await createU('judge2@judging.test', 'USER');
    participantId = await createU('part@judging.test', 'USER');

    // Create event
    const ev = await pool.query("INSERT INTO events (slug, name, start_date, end_date, status) VALUES ($1, 'Judging Event', NOW(), NOW(), 'SUBMISSION') RETURNING id", ['judging-event-' + Date.now()]);
    eventId = ev.rows[0].id;
    
    await pool.query("INSERT INTO event_members (event_id, user_id, role) VALUES ($1, $2, 'ORGANIZER')", [eventId, organizerId]);
    await pool.query("INSERT INTO event_members (event_id, user_id, role) VALUES ($1, $2, 'PARTICIPANT')", [eventId, participantId]);
    
    // Create teams and submissions
    const t1 = await pool.query("INSERT INTO teams (event_id, name) VALUES ($1, 'Team 1') RETURNING id", [eventId]);
    team1Id = t1.rows[0].id;
    await pool.query("INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'LEADER')", [team1Id, participantId]);
    
    const s1 = await pool.query("INSERT INTO submissions (event_id, team_id, title, status) VALUES ($1, $2, 'Sub 1', 'SUBMITTED') RETURNING id", [eventId, team1Id]);
    sub1Id = s1.rows[0].id;
    
    const t2 = await pool.query("INSERT INTO teams (event_id, name) VALUES ($1, 'Team 2') RETURNING id", [eventId]);
    team2Id = t2.rows[0].id;
    const s2 = await pool.query("INSERT INTO submissions (event_id, team_id, title, status) VALUES ($1, $2, 'Sub 2', 'SUBMITTED') RETURNING id", [eventId, team2Id]);
    sub2Id = s2.rows[0].id;

    // Create Rubric and Criteria
    const rub = await pool.query("INSERT INTO rubrics (event_id, name) VALUES ($1, 'Test Rubric') RETURNING id", [eventId]);
    rubricId = rub.rows[0].id;
    
    const c1 = await pool.query("INSERT INTO rubric_criteria (rubric_id, name, max_score, weight) VALUES ($1, 'Crit 1', 10, 1) RETURNING id", [rubricId]);
    crit1Id = c1.rows[0].id;
    
    const c2 = await pool.query("INSERT INTO rubric_criteria (rubric_id, name, max_score, weight) VALUES ($1, 'Crit 2', 5, 2) RETURNING id", [rubricId]);
    crit2Id = c2.rows[0].id;
  });

  afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email LIKE '%@judging.test'");
  });

  test('Judge Management', async () => {
    await mockSession(organizerId);
    
    // Create Judge 1
    const req = await makeReq({ user_id: judge1Id, background: 'Dev' });
    const res = await createJudge(req, { params: Promise.resolve({ eventId }) });
    if (res.status !== 201) {
      console.log(await res.text());
    }
    expect(res.status).toBe(201);
    
    // Create Judge 2
    const req2 = await makeReq({ user_id: judge2Id });
    await createJudge(req2, { params: Promise.resolve({ eventId }) });

    // Verify role assigned
    const roleCheck = await pool.query("SELECT role FROM event_members WHERE user_id = $1 AND event_id = $2", [judge1Id, eventId]);
    expect(roleCheck.rows[0].role).toBe('JUDGE');
  });

  test('Auto Assignment', async () => {
    await mockSession(organizerId);
    
    const req = await makeReq({ judgesPerSubmission: 2 });
    const res = await autoAssign(req, { params: Promise.resolve({ eventId }) });
    if (res.status !== 201) {
      console.log(await res.text());
    }
    expect(res.status).toBe(201);
    
    const data = await res.json();
    expect(data.count).toBe(4); // 2 subs * 2 judges
  });

  test('Evaluation Lifecycle', async () => {
    // Need to find assignment for Judge 1 to Sub 1
    const assignCheck = await pool.query("SELECT ja.id FROM judge_assignments ja JOIN judge_profiles jp ON ja.judge_id = jp.id WHERE jp.user_id = $1 AND ja.submission_id = $2", [judge1Id, sub1Id]);
    const assignmentId = assignCheck.rows[0].id;

    await mockSession(judge1Id);
    
    // Start Evaluation
    const reqStart = await makeReq({});
    const resStart = await startEval(reqStart, { params: Promise.resolve({ assignmentId }) });
    expect(resStart.status).toBe(201);

    // Save Draft
    const reqDraft = await makeReq({ scores: [{ criterion_id: crit1Id, score: 8 }], submit: false });
    const resDraft = await saveEval(reqDraft, { params: Promise.resolve({ assignmentId }) });
    expect(resDraft.status).toBe(200);

    // Submit complete evaluation
    const reqSubmit = await makeReq({ scores: [{ criterion_id: crit1Id, score: 9 }, { criterion_id: crit2Id, score: 4 }], submit: true });
    const resSubmit = await saveEval(reqSubmit, { params: Promise.resolve({ assignmentId }) });
    expect(resSubmit.status).toBe(200);

    // Calculate expected score:
    // Crit 1: (9/10)*1 = 0.9
    // Crit 2: (4/5)*2 = 1.6
    // Total: (2.5 / 3) * 100 = 83.33333333333334
    const data = await resSubmit.json();
    expect(data.status).toBe('SUBMITTED');
    expect(data.total_score).toBeCloseTo(83.33, 1);
  });

  test('Normalization Math (Standalone)', () => {
    const evals = [
      { judge_id: 'j1', submission_id: 's1', total_score: 90 },
      { judge_id: 'j1', submission_id: 's2', total_score: 80 },
      { judge_id: 'j2', submission_id: 's1', total_score: 50 },
      { judge_id: 'j2', submission_id: 's2', total_score: 40 },
    ];
    // j1 mean = 85, stdDev = 7.07
    // j2 mean = 45, stdDev = 7.07
    // s1 norm sum = ((90 - 85)/7.07) + ((50 - 45)/7.07) = 0.707 + 0.707 = 1.414. Avg = 0.707
    // s2 norm sum = ((80 - 85)/7.07) + ((40 - 45)/7.07) = -0.707 - 0.707 = -1.414. Avg = -0.707
    // Final user score: 50 + 15 * Z
    // s1 = 50 + 15(0.707) = 60.6
    // s2 = 50 + 15(-0.707) = 39.39

    const results = calculateNormalizedResults(evals);
    expect(results[0].submission_id).toBe('s1');
    expect(results[1].submission_id).toBe('s2');
    expect(results[0].normalizedScore).toBeGreaterThan(results[1].normalizedScore);
  });
});
