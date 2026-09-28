import { expect, test, describe, afterAll, beforeAll, vi, beforeEach } from 'vitest';
import { getDbPool } from '@/lib/db';
import { POST as createEvent } from '@/app/api/events/route';
import { POST as createTrack } from '@/app/api/events/[eventId]/tracks/route';
import { POST as createTeam } from '@/app/api/events/[eventId]/teams/route';
import { POST as createInvitation } from '@/app/api/teams/[teamId]/invitations/route';
import { POST as acceptInvitation } from '@/app/api/invitations/[token]/accept/route';
import { POST as createSubmission } from '@/app/api/events/[eventId]/submissions/route';
import { PATCH as editSubmission } from '@/app/api/submissions/[submissionId]/route';
import { POST as submitSubmission } from '@/app/api/submissions/[submissionId]/submit/route';
import { createSession } from '@/lib/auth';

const mockCookies = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => mockCookies)
}));

describe('Sprint 2: Events, Teams, Submissions', () => {
  const pool = getDbPool();
  let adminId: string;
  let part1Id: string;
  let part2Id: string;
  let eventId: string;
  let teamId: string;
  let submissionId: string;
  let invitationToken: string;

  beforeAll(async () => {
    adminId = (await pool.query("INSERT INTO users (email, name, role) VALUES ('admin@sprint2.com', 'Admin', 'ADMIN') RETURNING id")).rows[0].id;
    part1Id = (await pool.query("INSERT INTO users (email, name, role) VALUES ('part1@sprint2.com', 'Part 1', 'USER') RETURNING id")).rows[0].id;
    part2Id = (await pool.query("INSERT INTO users (email, name, role) VALUES ('part2@sprint2.com', 'Part 2', 'USER') RETURNING id")).rows[0].id;
  });

  afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email LIKE '%sprint2.com'");
    await pool.end();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function mockSession(userId: string) {
    await createSession(userId);
    const lastCall = mockCookies.set.mock.calls[mockCookies.set.mock.calls.length - 1];
    const rawToken = lastCall[1];
    mockCookies.get.mockReturnValue({ value: rawToken });
  }

  async function makeReq(body: Record<string, unknown> | null) {
    return new Request('http://localhost', {
      method: body ? 'POST' : 'GET',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  test('Create Event (Admin)', async () => {
    await mockSession(adminId);
    const req = await makeReq({
      name: 'Sprint 2 Event',
      slug: 'sprint2-event-' + Date.now(),
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 86400000).toISOString(),
      submission_end: new Date(Date.now() + 86400000).toISOString(),
      status: 'SUBMISSION'
    });
    const res = await createEvent(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    eventId = data.event.id;
    expect(eventId).toBeDefined();

    // Make users participants
    await pool.query("INSERT INTO event_members (event_id, user_id, role) VALUES ($1, $2, 'PARTICIPANT')", [eventId, part1Id]);
    await pool.query("INSERT INTO event_members (event_id, user_id, role) VALUES ($1, $2, 'PARTICIPANT')", [eventId, part2Id]);
  });

  test('Create Track', async () => {
    await mockSession(adminId);
    const req = await makeReq({ name: 'Web Track' });
    const res = await createTrack(req, { params: Promise.resolve({ eventId }) });
    expect(res.status).toBe(200);
  });

  test('Create Team (Participant 1)', async () => {
    await mockSession(part1Id);
    const req = await makeReq({ name: 'Team Sprint 2' });
    const res = await createTeam(req, { params: Promise.resolve({ eventId }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    teamId = data.team.id;
    expect(teamId).toBeDefined();
  });

  test('Create Team (Participant 1 again) - fails duplicate', async () => {
    await mockSession(part1Id);
    const req = await makeReq({ name: 'Another Team' });
    const res = await createTeam(req, { params: Promise.resolve({ eventId }) });
    expect(res.status).toBe(400); // ALREADY_MEMBER
  });

  test('Create Invitation', async () => {
    await mockSession(part1Id); // part 1 is LEADER
    const req = await makeReq({ expires_in_hours: 24 });
    const res = await createInvitation(req, { params: Promise.resolve({ teamId }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    invitationToken = data.raw_token;
    expect(invitationToken).toBeDefined();
  });

  test('Accept Invitation (Participant 2)', async () => {
    await mockSession(part2Id);
    const req = await makeReq({});
    const res = await acceptInvitation(req, { params: Promise.resolve({ token: invitationToken }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.team_id).toBe(teamId);
  });

  test('Create Submission (Participant 1)', async () => {
    await mockSession(part1Id);
    const req = await makeReq({ title: 'My Cool Project', url: 'https://example.com' });
    const res = await createSubmission(req, { params: Promise.resolve({ eventId }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    submissionId = data.submission.id;
    expect(submissionId).toBeDefined();
  });

  test('Edit Submission (Participant 2 - Team Member)', async () => {
    await mockSession(part2Id);
        // Since PATCH, makeReq doesn't map perfectly if we rely on METHOD, but our mock Req just sets body.
    const customReq = new Request('http://localhost', { method: 'PATCH', body: JSON.stringify({ description: 'Updated description' }) });
    const res = await editSubmission(customReq, { params: Promise.resolve({ submissionId }) });
    expect(res.status).toBe(200);
  });

  test('Finalize Submission', async () => {
    await mockSession(part1Id);
    const req = await makeReq({});
    const res = await submitSubmission(req, { params: Promise.resolve({ submissionId }) });
    expect(res.status).toBe(200);
  });

  test('Edit Submission fails after finalized', async () => {
    await mockSession(part1Id);
    const customReq = new Request('http://localhost', { method: 'PATCH', body: JSON.stringify({ description: 'Fail' }) });
    const res = await editSubmission(customReq, { params: Promise.resolve({ submissionId }) });
    expect(res.status).toBe(403);
  });
});
