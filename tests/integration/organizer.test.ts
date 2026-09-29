import { expect, test, describe, afterAll, beforeAll, vi, beforeEach } from 'vitest'
import { getDbPool } from '@/lib/db'
import { createSession } from '@/lib/auth'

const mockCookies = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => mockCookies)
}))

// Import the route handlers directly for testing
import { POST as createEvent } from '@/app/api/events/route'
import { PATCH as updateEvent, DELETE as deleteEvent } from '@/app/api/events/[eventId]/route'

describe('Organizer Management and Lifecycle Safeguards', () => {
  const pool = getDbPool();
  let adminId: string;
  let organizerId: string;
  let participantId: string;
  let eventDraftId: string;
  let eventActiveId: string;
  let eventArchivedId: string;
  
  beforeAll(async () => {
    // Cleanup any aborted previous runs
    await pool.query("DELETE FROM users WHERE email LIKE '%_org@test.com'");
    await pool.query("DELETE FROM events WHERE slug IN ('draft-evt', 'active-evt', 'archived-evt', 'new-evt', 'temp-delete-evt', 'date-test')");

    // Setup test users
    const r1 = await pool.query("INSERT INTO users (email, name, role) VALUES ('admin_org@test.com', 'A', 'ADMIN') RETURNING id");
    adminId = r1.rows[0].id;
    
    const r2 = await pool.query("INSERT INTO users (email, name, role) VALUES ('org_org@test.com', 'O', 'USER') RETURNING id");
    organizerId = r2.rows[0].id;
    
    const r3 = await pool.query("INSERT INTO users (email, name, role) VALUES ('part_org@test.com', 'P', 'USER') RETURNING id");
    participantId = r3.rows[0].id;
    
    // Setup events
    const e1 = await pool.query("INSERT INTO events (slug, name, status, start_date, end_date) VALUES ('draft-evt', 'Draft', 'DRAFT', NOW(), NOW() + interval '1 day') RETURNING id");
    eventDraftId = e1.rows[0].id;
    
    const e2 = await pool.query("INSERT INTO events (slug, name, status, start_date, end_date) VALUES ('active-evt', 'Active', 'REGISTRATION', NOW(), NOW() + interval '1 day') RETURNING id");
    eventActiveId = e2.rows[0].id;

    const e3 = await pool.query("INSERT INTO events (slug, name, status, start_date, end_date) VALUES ('archived-evt', 'Archived', 'ARCHIVED', NOW(), NOW() + interval '1 day') RETURNING id");
    eventArchivedId = e3.rows[0].id;
    
    // Setup roles
    await pool.query("INSERT INTO event_members (event_id, user_id, role) VALUES ($1, $2, 'ORGANIZER')", [eventDraftId, organizerId]);
    await pool.query("INSERT INTO event_members (event_id, user_id, role) VALUES ($1, $2, 'ORGANIZER')", [eventActiveId, organizerId]);
    await pool.query("INSERT INTO event_members (event_id, user_id, role) VALUES ($1, $2, 'ORGANIZER')", [eventArchivedId, organizerId]);
    
    await pool.query("INSERT INTO event_members (event_id, user_id, role) VALUES ($1, $2, 'PARTICIPANT')", [eventDraftId, participantId]);
  });

  afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email LIKE '%_org@test.com'");
    await pool.query("DELETE FROM events WHERE slug IN ('draft-evt', 'active-evt', 'archived-evt', 'new-evt', 'temp-delete-evt', 'date-test')");
    await pool.end();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function mockUserSession(id: string) {
    await createSession(id);
    const rawToken = mockCookies.set.mock.calls[0][1];
    mockCookies.get.mockReturnValue({ value: rawToken });
  }

  test('POST /api/events requires ADMIN or ORGANIZER', async () => {
    await mockUserSession(participantId); // Normal user (not an organizer)
    const req = new Request('http://localhost/api/events', {
      method: 'POST',
      body: JSON.stringify({ slug: 'new-evt', name: 'New', start_date: new Date().toISOString(), end_date: new Date(Date.now() + 86400000).toISOString() })
    });
    const res = await createEvent(req);
    expect(res.status).toBe(403);
  });

  test('PATCH /api/events/[eventId] participant gets 403', async () => {
    await mockUserSession(participantId);
    const req = new Request(`http://localhost/api/events/${eventDraftId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Hacked' })
    });
    const res = await updateEvent(req, { params: Promise.resolve({ eventId: eventDraftId }) });
    expect(res.status).toBe(403);
  });

  test('PATCH /api/events/[eventId] organizer can edit DRAFT event', async () => {
    await mockUserSession(organizerId);
    const req = new Request(`http://localhost/api/events/${eventDraftId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated Draft' })
    });
    const res = await updateEvent(req, { params: Promise.resolve({ eventId: eventDraftId }) });
    expect(res.status).toBe(200);
  });

  test('DELETE /api/events/[eventId] organizer can delete DRAFT event', async () => {
    await mockUserSession(organizerId);
    const req = new Request(`http://localhost/api/events/${eventDraftId}`, { method: 'DELETE' });
    const res = await deleteEvent(req, { params: Promise.resolve({ eventId: eventDraftId }) });
    expect(res.status).toBe(200);
  });

  test('DELETE /api/events/[eventId] organizer CAN delete REGISTRATION event', async () => {
    await mockUserSession(organizerId);
    // Create a disposable event for this test so we don't break subsequent tests
    const e2 = await pool.query("INSERT INTO events (slug, name, status, start_date, end_date) VALUES ('temp-delete-evt', 'Temp', 'REGISTRATION', NOW(), NOW() + interval '1 day') RETURNING id");
    const tempId = e2.rows[0].id;
    await pool.query("INSERT INTO event_members (event_id, user_id, role) VALUES ($1, $2, 'ORGANIZER')", [tempId, organizerId]);
    
    const req = new Request(`http://localhost/api/events/${tempId}`, { method: 'DELETE' });
    const res = await deleteEvent(req, { params: Promise.resolve({ eventId: tempId }) });
    expect(res.status).toBe(200); // Because we allowed deletion of any event
  });

  test('PATCH /api/events/[eventId] organizer CANNOT edit ARCHIVED event', async () => {
    await mockUserSession(organizerId);
    const req = new Request(`http://localhost/api/events/${eventArchivedId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Zombie Event' })
    });
    const res = await updateEvent(req, { params: Promise.resolve({ eventId: eventArchivedId }) });
    expect(res.status).toBe(400); // Bad Request (lifecycle protection)
  });

  test('PATCH /api/events/[eventId] rejects skipped transitions (DRAFT -> RESULTS)', async () => {
    await mockUserSession(organizerId);
    const req = new Request(`http://localhost/api/events/${eventActiveId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'RESULTS' }) // current is REGISTRATION
    });
    const res = await updateEvent(req, { params: Promise.resolve({ eventId: eventActiveId }) });
    expect(res.status).toBe(400);
  });

  test('PATCH /api/events/[eventId] rejects backward transitions', async () => {
    await mockUserSession(organizerId);
    const req = new Request(`http://localhost/api/events/${eventActiveId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'DRAFT' }) // current is REGISTRATION
    });
    const res = await updateEvent(req, { params: Promise.resolve({ eventId: eventActiveId }) });
    expect(res.status).toBe(400);
  });

  test('PATCH /api/events/[eventId] allows valid sequential forward transitions', async () => {
    await mockUserSession(organizerId);
    
    // REGISTRATION -> SUBMISSION
    let req = new Request(`http://localhost/api/events/${eventActiveId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'SUBMISSION' })
    });
    let res = await updateEvent(req, { params: Promise.resolve({ eventId: eventActiveId }) });
    expect(res.status).toBe(200);

    // SUBMISSION -> JUDGING
    req = new Request(`http://localhost/api/events/${eventActiveId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'JUDGING' })
    });
    res = await updateEvent(req, { params: Promise.resolve({ eventId: eventActiveId }) });
    expect(res.status).toBe(200);

    // JUDGING -> VOTING
    req = new Request(`http://localhost/api/events/${eventActiveId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'VOTING' })
    });
    res = await updateEvent(req, { params: Promise.resolve({ eventId: eventActiveId }) });
    expect(res.status).toBe(200);
    
    // VOTING -> RESULTS
    req = new Request(`http://localhost/api/events/${eventActiveId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'RESULTS' })
    });
    res = await updateEvent(req, { params: Promise.resolve({ eventId: eventActiveId }) });
    expect(res.status).toBe(200);
    
    // RESULTS -> ARCHIVED
    req = new Request(`http://localhost/api/events/${eventActiveId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'ARCHIVED' })
    });
    res = await updateEvent(req, { params: Promise.resolve({ eventId: eventActiveId }) });
    expect(res.status).toBe(200);
  });

  test('PATCH /api/events/[eventId] rejects invalid status values', async () => {
    await mockUserSession(organizerId);
    const req = new Request(`http://localhost/api/events/${eventActiveId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'HACKED' })
    });
    const res = await updateEvent(req, { params: Promise.resolve({ eventId: eventActiveId }) });
    expect(res.status).toBe(400);
  });

  test('PATCH /api/events/[eventId] date validation rejects contradictory dates', async () => {
    await mockUserSession(organizerId);
    const id = (await pool.query("INSERT INTO events (slug, name, status, start_date, end_date) VALUES ('date-test', 'Date Test', 'DRAFT', NOW(), NOW() + interval '10 days') RETURNING id")).rows[0].id;
    await pool.query("INSERT INTO event_members (event_id, user_id, role) VALUES ($1, $2, 'ORGANIZER')", [id, organizerId]);

    // registration_start > registration_end
    let req = new Request(`http://localhost/api/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ 
        registration_start: new Date(Date.now() + 86400000).toISOString(),
        registration_end: new Date(Date.now()).toISOString()
      })
    });
    let res = await updateEvent(req, { params: Promise.resolve({ eventId: id }) });
    expect(res.status).toBe(400);

    // submission_start < registration_end
    req = new Request(`http://localhost/api/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ 
        registration_end: new Date(Date.now() + 86400000).toISOString(),
        submission_start: new Date(Date.now()).toISOString()
      })
    });
    res = await updateEvent(req, { params: Promise.resolve({ eventId: id }) });
    expect(res.status).toBe(400);
  });
})
