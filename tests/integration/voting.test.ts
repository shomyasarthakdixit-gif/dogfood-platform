import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest';
import { getDbPool } from '../../lib/db';
import { POST as castVote } from '../../app/api/events/[eventId]/votes/route';
import { GET as getStatusEndpoint } from '../../app/api/events/[eventId]/votes/status/route';
import { POST as postComment, GET as getComments } from '../../app/api/submissions/[submissionId]/comments/route';
import { GET as getGallery } from '../../app/api/events/[eventId]/gallery/route';
import { GET as getResults } from '../../app/api/events/[eventId]/results/route';
import { GET as getNormalizedResults } from '../../app/api/events/[eventId]/results/normalized/route';

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
let userId1 = '';
let userId2 = '';

let eventVotingId = '';
let eventFutureId = '';
let team1Id = '';
let sub1Id = '';
let subDraftId = '';
let subFutureId = '';

async function mockSession(userId: string | null) {
  if (!userId) {
    mockCookies.get.mockReturnValue(undefined);
    return;
  }
  const token = 'test-token-' + userId;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  await pool.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
  await pool.query('INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + interval \'1 hour\')', [userId, hashedToken]);
  mockCookies.get.mockImplementation((name: string) => (name === 'dogfood_session' ? { value: token } : undefined));
}

async function makeReq(body?: Record<string, unknown> | null, headers: Record<string, string> = {}) {
  const url = `http://localhost:3000/api/test`;
  return new Request(url, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined
  });
}

describe('Sprint 4: Voting & Security', () => {
  beforeAll(async () => {
    // Clear old test data
    await pool.query("DELETE FROM users WHERE email LIKE '%@voting.test'");
    await pool.query("DELETE FROM rate_limits");

    const createU = async (email: string, role: string) => {
      const res = await pool.query("INSERT INTO users (email, name, role, password_hash) VALUES ($1, $2, $3, 'hash') RETURNING id", [email, email, role]);
      return res.rows[0].id;
    };

    adminId = await createU('admin@voting.test', 'ADMIN');
    userId1 = await createU('user1@voting.test', 'USER');
    userId2 = await createU('user2@voting.test', 'USER');

    const evV = await pool.query(`
      INSERT INTO events (slug, name, start_date, end_date, status, voting_start, voting_end) 
      VALUES ($1, 'Voting Event', NOW(), NOW() + interval '1 day', 'VOTING', NOW() - interval '1 hour', NOW() + interval '1 day') RETURNING id
    `, ['voting-event-' + Date.now()]);
    eventVotingId = evV.rows[0].id;

    const evF = await pool.query(`
      INSERT INTO events (slug, name, start_date, end_date, status, voting_start, voting_end) 
      VALUES ($1, 'Future Event', NOW(), NOW() + interval '1 day', 'SUBMISSION', NOW() + interval '1 day', NOW() + interval '2 days') RETURNING id
    `, ['future-event-' + Date.now()]);
    eventFutureId = evF.rows[0].id;

    const t1 = await pool.query("INSERT INTO teams (event_id, name) VALUES ($1, 'Team 1') RETURNING id", [eventVotingId]);
    team1Id = t1.rows[0].id;
    
    const s1 = await pool.query("INSERT INTO submissions (event_id, team_id, title, status) VALUES ($1, $2, 'Sub 1', 'SUBMITTED') RETURNING id", [eventVotingId, team1Id]);
    sub1Id = s1.rows[0].id;
    
    const tDraft = await pool.query("INSERT INTO teams (event_id, name) VALUES ($1, 'Team Draft') RETURNING id", [eventVotingId]);
    const s2 = await pool.query("INSERT INTO submissions (event_id, team_id, title, status) VALUES ($1, $2, 'Sub Draft', 'DRAFT') RETURNING id", [eventVotingId, tDraft.rows[0].id]);
    subDraftId = s2.rows[0].id;

    const tf = await pool.query("INSERT INTO teams (event_id, name) VALUES ($1, 'Team F') RETURNING id", [eventFutureId]);
    const sf = await pool.query("INSERT INTO submissions (event_id, team_id, title, status) VALUES ($1, $2, 'Sub F', 'SUBMITTED') RETURNING id", [eventFutureId, tf.rows[0].id]);
    subFutureId = sf.rows[0].id;
  });

  afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email LIKE '%@voting.test'");
  });

  test('VOTING 1 & 3 & 10 & 24: Authenticated vote, duplicate prevention, rate limit, audit', async () => {
    await mockSession(userId1);
    
    const req = await makeReq({ submissionId: sub1Id });
    const res = await castVote(req, { params: Promise.resolve({ eventId: eventVotingId }) });
    expect(res.status).toBe(201);

    // Duplicate vote
    const reqDup = await makeReq({ submissionId: sub1Id });
    const resDup = await castVote(reqDup, { params: Promise.resolve({ eventId: eventVotingId }) });
    expect(resDup.status).toBe(409); // ALREADY_VOTED

    // Audit log
    const auditRes = await pool.query("SELECT * FROM audit_logs WHERE action = 'VOTE_CREATED' AND entity_id = $1", [sub1Id]);
    expect(auditRes.rowCount).toBeGreaterThan(0);
    expect(auditRes.rows[0].details.actorType).toBe('USER');

    // Rate limit check
    // We will spam 10 more votes for different submissions to trigger rate limit (limit is 10 per min)
    for (let i=0; i<10; i++) {
      const ts = await pool.query("INSERT INTO teams (event_id, name) VALUES ($1, $2) RETURNING id", [eventVotingId, 'Spam Team ' + i]);
      const s = await pool.query("INSERT INTO submissions (event_id, team_id, title, status) VALUES ($1, $2, 'Spam Sub', 'SUBMITTED') RETURNING id", [eventVotingId, ts.rows[0].id]);
      await castVote(await makeReq({ submissionId: s.rows[0].id }), { params: Promise.resolve({ eventId: eventVotingId }) });
    }
    const rL = await castVote(await makeReq({ submissionId: sub1Id }), { params: Promise.resolve({ eventId: eventVotingId }) });
    expect(rL.status).toBe(429); // RATE_LIMITED
  });

  test('VOTING 2 & 4: Anonymous vote with token, duplicate prevented', async () => {
    await mockSession(null);
    const token = 'anonymous-token-123';
    
    const req = await makeReq({ submissionId: sub1Id, voterToken: token }, { 'x-forwarded-for': '1.2.3.4' });
    const res = await castVote(req, { params: Promise.resolve({ eventId: eventVotingId }) });
    expect(res.status).toBe(201);

    // Duplicate anonymous vote
    const reqDup = await makeReq({ submissionId: sub1Id, voterToken: token }, { 'x-forwarded-for': '1.2.3.4' });
    const resDup = await castVote(reqDup, { params: Promise.resolve({ eventId: eventVotingId }) });
    expect(resDup.status).toBe(409);
  });

  test('VOTING 5: Voting before start rejected', async () => {
    await mockSession(userId2);
    const req = await makeReq({ submissionId: subFutureId });
    const res = await castVote(req, { params: Promise.resolve({ eventId: eventFutureId }) });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error.code).toBe('VOTING_NOT_STARTED');
  });

  test('VOTING 8 & 9: Invalid/Draft submissions rejected', async () => {
    await mockSession(userId2);
    // Draft
    const req1 = await makeReq({ submissionId: subDraftId });
    const res1 = await castVote(req1, { params: Promise.resolve({ eventId: eventVotingId }) });
    expect(res1.status).toBe(403);

    // Cross event (submission from future event voted on in voting event)
    const req2 = await makeReq({ submissionId: subFutureId });
    const res2 = await castVote(req2, { params: Promise.resolve({ eventId: eventVotingId }) });
    expect(res2.status).toBe(403);
  });

  test('COMMENTS 17 & 18 & 23 & 25: Valid comment, XSS escaped, audit created, empty rejected', async () => {
    await mockSession(userId1);

    // Empty
    const rE = await postComment(await makeReq({ content: '' }), { params: Promise.resolve({ submissionId: sub1Id }) });
    expect(rE.status).toBe(400);

    // XSS
    const rX = await postComment(await makeReq({ content: '<script>alert(1)</script>' }), { params: Promise.resolve({ submissionId: sub1Id }) });
    expect(rX.status).toBe(201);
    const dX = await rX.json();
    expect(dX.comment.content).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');

    // Audit
    const auditRes = await pool.query("SELECT * FROM audit_logs WHERE action = 'COMMENT_CREATED' AND entity_id = $1", [sub1Id]);
    expect(auditRes.rowCount).toBeGreaterThan(0);
  });

  test('RESULT PROTECTION 13-15: Active voting hides results', async () => {
    await mockSession(userId1); // Normal user
    const req = await makeReq();
    const res = await getResults(req, { params: Promise.resolve({ eventId: eventVotingId }) });
    expect(res.status).toBe(403);

    const resNorm = await getNormalizedResults(req, { params: Promise.resolve({ eventId: eventVotingId }) });
    expect(resNorm.status).toBe(403);
  });


});
