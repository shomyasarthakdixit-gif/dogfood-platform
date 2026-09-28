import { expect, test, describe, afterAll, beforeAll, vi, beforeEach } from 'vitest'
import { getDbPool } from '@/lib/db'
import { requirePlatformAdmin, requireEventRole, createSession } from '@/lib/auth'

const mockCookies = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => mockCookies)
}))

describe('RBAC Authorization', () => {
  const pool = getDbPool();
  let adminId: string;
  let userId: string;
  let event1Id: string;
  let event2Id: string;
  
  beforeAll(async () => {
    // Setup test users and events
    const r1 = await pool.query("INSERT INTO users (email, name, role) VALUES ('admin_rbac@test.com', 'A', 'ADMIN') RETURNING id");
    adminId = r1.rows[0].id;
    
    const r2 = await pool.query("INSERT INTO users (email, name, role) VALUES ('user_rbac@test.com', 'U', 'USER') RETURNING id");
    userId = r2.rows[0].id;
    
    const e1 = await pool.query("INSERT INTO events (slug, name, start_date, end_date) VALUES ('rbac-e1', 'E1', NOW(), NOW()) RETURNING id");
    event1Id = e1.rows[0].id;
    
    const e2 = await pool.query("INSERT INTO events (slug, name, start_date, end_date) VALUES ('rbac-e2', 'E2', NOW(), NOW()) RETURNING id");
    event2Id = e2.rows[0].id;
    
    await pool.query("INSERT INTO event_members (event_id, user_id, role) VALUES ($1, $2, 'ORGANIZER')", [event1Id, userId]);
    await pool.query("INSERT INTO event_members (event_id, user_id, role) VALUES ($1, $2, 'JUDGE')", [event2Id, userId]);
  });

  afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email LIKE '%_rbac@test.com'");
    await pool.query("DELETE FROM events WHERE slug LIKE 'rbac-%'");
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

  test('Global RBAC: ADMIN access granted', async () => {
    await mockUserSession(adminId);
    const { user, error } = await requirePlatformAdmin();
    expect(error).toBeNull();
    expect(user?.role).toBe('ADMIN');
  });

  test('Global RBAC: USER denied admin-only access', async () => {
    await mockUserSession(userId);
    const { user, error } = await requirePlatformAdmin();
    expect(user).toBeNull();
    expect(error).toBeDefined();
    expect(error?.status).toBe(403);
  });

  test('Event RBAC: correct event role accepted', async () => {
    await mockUserSession(userId);
    const { eventRole, error } = await requireEventRole(event1Id, 'ORGANIZER');
    expect(error).toBeNull();
    expect(eventRole).toBe('ORGANIZER');
  });

  test('Event RBAC: wrong event role denied', async () => {
    await mockUserSession(userId);
    const { error } = await requireEventRole(event1Id, 'JUDGE');
    expect(error?.status).toBe(403);
  });

  test('Event RBAC: cross-event role isolation', async () => {
    await mockUserSession(userId);
    // User is ORGANIZER in E1, JUDGE in E2.
    
    // Request ORGANIZER in E2 should fail
    const res2 = await requireEventRole(event2Id, 'ORGANIZER');
    expect(res2.error?.status).toBe(403);
    
    // Request JUDGE in E2 should succeed
    const res3 = await requireEventRole(event2Id, 'JUDGE');
    expect(res3.error).toBeNull();
  });
})
