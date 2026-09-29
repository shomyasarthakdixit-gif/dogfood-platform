import { expect, test, describe, afterAll, beforeAll, vi, beforeEach } from 'vitest';
import { getDbPool } from '@/lib/db';
import { POST as createEvent } from '@/app/api/events/route';
import { POST as createTrack } from '@/app/api/events/[eventId]/tracks/route';
import { POST as createTeam } from '@/app/api/events/[eventId]/teams/route';
import { POST as createInvitation } from '@/app/api/teams/[teamId]/invitations/route';
import { POST as acceptInvitation } from '@/app/api/invitations/[invitationId]/route';
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
  let invitationId: string;

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
    const req = await makeReq({ email: 'part2@sprint2.com' });
    const res = await createInvitation(req, { params: Promise.resolve({ teamId }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    invitationId = data.invitation.id;
    expect(invitationId).toBeDefined();
  });

  test('Accept Invitation (Participant 2)', async () => {
    await mockSession(part2Id);
    const req = await makeReq({});
    const res = await acceptInvitation(req, { params: Promise.resolve({ invitationId }) });
    expect(res.status).toBe(200);
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

  test('Edit Submission succeeds after finalized before deadline', async () => {
    await mockSession(part1Id);
    const customReq = new Request('http://localhost', { method: 'PATCH', body: JSON.stringify({ description: 'Success' }) });
    const res = await editSubmission(customReq, { params: Promise.resolve({ submissionId }) });
    expect(res.status).toBe(200);
  });

  test('Withdraw Submission (Admin) - fails, not in team', async () => {
    await mockSession(adminId);
    const { POST: withdrawSubmission } = await import('@/app/api/submissions/[submissionId]/withdraw/route');
    const customReq = new Request('http://localhost', { method: 'POST' });
    const res = await withdrawSubmission(customReq, { params: Promise.resolve({ submissionId }) });
    expect(res.status).toBe(403);
  });

  test('Withdraw Submission (Participant 2) - succeeds', async () => {
    await mockSession(part2Id);
    const { POST: withdrawSubmission } = await import('@/app/api/submissions/[submissionId]/withdraw/route');
    const customReq = new Request('http://localhost', { method: 'POST' });
    const res = await withdrawSubmission(customReq, { params: Promise.resolve({ submissionId }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.submission.status).toBe('DRAFT');
    
    // Check audit log
    const auditRes = await pool.query('SELECT * FROM audit_logs WHERE action = $1 AND entity_id = $2', ['SUBMISSION_WITHDRAWN', submissionId]);
    expect(auditRes.rowCount).toBe(1);
  });

  test('Withdraw Submission - fails if already DRAFT', async () => {
    await mockSession(part1Id);
    const { POST: withdrawSubmission } = await import('@/app/api/submissions/[submissionId]/withdraw/route');
    const customReq = new Request('http://localhost', { method: 'POST' });
    const res = await withdrawSubmission(customReq, { params: Promise.resolve({ submissionId }) });
    expect(res.status).toBe(409); // INVALID_STATE
  });

  test('Finalize Submission again (after withdraw)', async () => {
    await mockSession(part1Id);
    const req = await makeReq({});
    const res = await submitSubmission(req, { params: Promise.resolve({ submissionId }) });
    expect(res.status).toBe(200);
  });

  test('Withdraw fails after deadline', async () => {
    // Manually update the event submission_end to be in the past
    await pool.query('UPDATE events SET submission_end = $1 WHERE id = $2', [new Date(Date.now() - 86400000).toISOString(), eventId]);
    await mockSession(part1Id);
    const { POST: withdrawSubmission } = await import('@/app/api/submissions/[submissionId]/withdraw/route');
    const customReq = new Request('http://localhost', { method: 'POST' });
    const res = await withdrawSubmission(customReq, { params: Promise.resolve({ submissionId }) });
    expect(res.status).toBe(403); // SUBMISSION_DEADLINE_PASSED
  });

  test('Edit Submission fails after deadline', async () => {
    await mockSession(part1Id);
    const customReq = new Request('http://localhost', { method: 'PATCH', body: JSON.stringify({ description: 'Fail' }) });
    const res = await editSubmission(customReq, { params: Promise.resolve({ submissionId }) });
    expect(res.status).toBe(400); // SUBMISSION_DEADLINE_PASSED
  });
});
