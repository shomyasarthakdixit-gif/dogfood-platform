import { expect, test, describe, afterAll, beforeAll, vi, beforeEach } from 'vitest';
import { getDbPool } from '@/lib/db';
import { GET as getGallery } from '@/app/api/events/[eventId]/gallery/route';
import { GET as getPublicSubmission } from '@/app/api/submissions/[submissionId]/public/route';
import { POST as createEvent } from '@/app/api/events/route';
import { POST as createTrack } from '@/app/api/events/[eventId]/tracks/route';
import { POST as createTeam } from '@/app/api/events/[eventId]/teams/route';
import { POST as createSubmission } from '@/app/api/events/[eventId]/submissions/route';
import { POST as submitSubmission } from '@/app/api/submissions/[submissionId]/submit/route';
import { createSession } from '@/lib/auth';

const mockCookies = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };
vi.mock('next/headers', () => ({ cookies: vi.fn(async () => mockCookies) }));

describe('Sprint 2.5: Public Gallery', () => {
  const pool = getDbPool();
  let adminId: string, part1Id: string, part2Id: string;
  let eventId: string, hiddenEventId: string;
  let track1Id: string, track2Id: string;
  let sub1Id: string, sub2Id: string;

  beforeAll(async () => {
    adminId = (await pool.query("INSERT INTO users (email, name, role) VALUES ('admin@gallery.com', 'Admin', 'ADMIN') RETURNING id")).rows[0].id;
    part1Id = (await pool.query("INSERT INTO users (email, name, role) VALUES ('part1@gallery.com', 'Part1', 'USER') RETURNING id")).rows[0].id;
    part2Id = (await pool.query("INSERT INTO users (email, name, role) VALUES ('part2@gallery.com', 'Part2', 'USER') RETURNING id")).rows[0].id;
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
      name: 'Gallery Event', slug: 'gallery-event-' + Date.now(),
      start_date: new Date().toISOString(), end_date: new Date(Date.now() + 86400000).toISOString(),
      submission_end: new Date(Date.now() + 86400000).toISOString(),
      status: 'SUBMISSION'
    }));
    eventId = (await res.json()).event.id;

    res = await createEvent(await makeReq({
      name: 'Hidden Event', slug: 'hidden-event-' + Date.now(),
      start_date: new Date().toISOString(), end_date: new Date(Date.now() + 86400000).toISOString(),
      status: 'DRAFT'
    }));
    hiddenEventId = (await res.json()).event.id;

    await pool.query("INSERT INTO event_members (event_id, user_id, role) VALUES ($1, $2, 'PARTICIPANT')", [eventId, part1Id]);
    await pool.query("INSERT INTO event_members (event_id, user_id, role) VALUES ($1, $2, 'PARTICIPANT')", [eventId, part2Id]);

    // Create tracks
    let trackRes = await createTrack(await makeReq({ name: 'Track 1' }), { params: Promise.resolve({ eventId }) });
    track1Id = (await trackRes.json()).track.id;

    trackRes = await createTrack(await makeReq({ name: 'Track 2' }), { params: Promise.resolve({ eventId }) });
    track2Id = (await trackRes.json()).track.id;

    // Part 1 -> Team 1 -> Sub 1 (Submitted)
    await mockSession(part1Id);
    let teamRes = await createTeam(await makeReq({ name: 'Team Alpha' }), { params: Promise.resolve({ eventId }) });
    const team1Id = (await teamRes.json()).team.id;

    let subRes = await createSubmission(await makeReq({ title: 'Robot Alpha', description: 'Best robot', track_id: track1Id }), { params: Promise.resolve({ eventId }) });
    sub1Id = (await subRes.json()).submission.id;
    await submitSubmission(await makeReq({}), { params: Promise.resolve({ submissionId: sub1Id }) });

    // Part 2 -> Team 2 -> Sub 2 (Draft)
    await mockSession(part2Id);
    teamRes = await createTeam(await makeReq({ name: 'Team Beta' }), { params: Promise.resolve({ eventId }) });
    const team2Id = (await teamRes.json()).team.id;

    subRes = await createSubmission(await makeReq({ title: 'Robot Beta', description: 'Second robot', track_id: track2Id }), { params: Promise.resolve({ eventId }) });
    sub2Id = (await subRes.json()).submission.id;
  });

  test('Public gallery accessible and excludes drafts', async () => {
    mockCookies.get.mockReturnValue(undefined); // No auth
    const req = await makeReq();
    const res = await getGallery(req, { params: Promise.resolve({ eventId }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    
    expect(data.items.length).toBe(1); // Only sub1 (SUBMITTED)
    expect(data.items[0].id).toBe(sub1Id);
    expect(data.items[0].track.id).toBe(track1Id);
    expect(data.items[0].team.name).toBe('Team Alpha');
  });

  test('Public gallery prevents access to hidden events', async () => {
    mockCookies.get.mockReturnValue(undefined);
    const req = await makeReq();
    const res = await getGallery(req, { params: Promise.resolve({ eventId: hiddenEventId }) });
    expect(res.status).toBe(403);
  });

  test('Public detail view allows submitted', async () => {
    const req = await makeReq();
    const res = await getPublicSubmission(req, { params: Promise.resolve({ submissionId: sub1Id }) });
    expect(res.status).toBe(200);
  });

  test('Public detail view blocks draft', async () => {
    const req = await makeReq();
    const res = await getPublicSubmission(req, { params: Promise.resolve({ submissionId: sub2Id }) });
    expect(res.status).toBe(404);
  });

  test('Gallery search', async () => {
    const req = await makeReq(null, 'q=Robot');
    const res = await getGallery(req, { params: Promise.resolve({ eventId }) });
    expect(res.status).toBe(200);
    expect((await res.json()).items.length).toBe(1);
  });

  test('Gallery search no match', async () => {
    const req = await makeReq(null, 'q=xyz');
    const res = await getGallery(req, { params: Promise.resolve({ eventId }) });
    expect((await res.json()).items.length).toBe(0);
  });

  test('Gallery filter by track', async () => {
    const req = await makeReq(null, `trackId=${track1Id}`);
    const res = await getGallery(req, { params: Promise.resolve({ eventId }) });
    expect((await res.json()).items.length).toBe(1);
    
    const req2 = await makeReq(null, `trackId=${track2Id}`);
    const res2 = await getGallery(req2, { params: Promise.resolve({ eventId }) });
    expect((await res2.json()).items.length).toBe(0); // Beta is draft!
  });
});
