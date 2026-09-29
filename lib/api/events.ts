import { query } from '@/lib/db';
import { Event, Track, Prize } from '@/lib/types';
import { mockEvents } from './mockData';

const USE_MOCK = false; // Temporary override for UI preview

export async function getEvents(): Promise<Event[]> {
  if (USE_MOCK) return mockEvents;
  const result = await query(`
    SELECT id, slug, name, description, start_date, end_date, created_at, status, registration_start, registration_end, submission_start, submission_end, required_judges, judges_per_submission
    FROM events
    ORDER BY created_at DESC
  `);
  return result.rows.map(rowToEvent);
}

export async function getEventById(id: string): Promise<Event | null> {
  if (USE_MOCK) return mockEvents.find(e => e.id === id) || mockEvents[0];
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return getEventBySlug(id);
  }
  const result = await query(
    `SELECT id, slug, name, description, start_date, end_date, created_at, status, registration_start, registration_end, submission_start, submission_end, required_judges, judges_per_submission FROM events WHERE id = $1`,
    [id]
  );
  if (result.rows.length === 0) return null;
  const event = rowToEvent(result.rows[0]);
  const [tracks, prizes] = await Promise.all([
    getEventTracks(id),
    getEventPrizes(id),
  ]);
  return { ...event, tracks, prizes };
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  if (USE_MOCK) return mockEvents.find(e => e.slug === slug) || mockEvents[0];
  const result = await query(
    `SELECT id, slug, name, description, start_date, end_date, created_at, status, registration_start, registration_end, submission_start, submission_end, required_judges, judges_per_submission FROM events WHERE slug = $1`,
    [slug]
  );
  if (result.rows.length === 0) return null;
  return getEventById(result.rows[0].id);
}

export async function getEventTracks(eventId: string): Promise<Track[]> {
  if (USE_MOCK) return mockEvents[0].tracks ?? [];
  const result = await query(
    `SELECT id, event_id, name, description, created_at FROM tracks WHERE event_id = $1 ORDER BY created_at ASC`,
    [eventId]
  );
  return result.rows;
}

export async function getEventPrizes(eventId: string): Promise<Prize[]> {
  if (USE_MOCK) return mockEvents[0].prizes ?? [];
  const result = await query(
    `SELECT id, event_id, track_id, name, description, amount, created_at FROM prizes WHERE event_id = $1 ORDER BY created_at ASC`,
    [eventId]
  );
  return result.rows;
}

function rowToEvent(row: Record<string, unknown>): Event {
  const now = new Date();
  const start = new Date(row.start_date as string);
  const end = new Date(row.end_date as string);
  let status: Event['status'];
  if (now < start) status = 'UPCOMING';
  else if (now > end) status = 'CLOSED';
  else status = 'OPEN';
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    description: row.description as string | null,
    start_date: row.start_date as string,
    end_date: row.end_date as string,
    registration_start: row.registration_start as string | undefined,
    registration_end: row.registration_end as string | undefined,
    submission_start: row.submission_start as string | undefined,
    submission_end: row.submission_end as string | undefined,
    required_judges: row.required_judges as number | undefined,
    judges_per_submission: row.judges_per_submission as number | undefined,
    created_at: row.created_at as string,
    status,
    lifecycle_status: row.status as string,
  };
}

export async function getTop10Projects(eventId: string) {
  const evalsRes = await query(`
    SELECT e.total_score, ja.judge_id, ja.submission_id 
    FROM evaluations e
    JOIN judge_assignments ja ON e.assignment_id = ja.id
    JOIN submissions s ON ja.submission_id = s.id
    WHERE s.event_id = $1 AND e.status = 'SUBMITTED'
  `, [eventId]);

  const { calculateNormalizedResults } = await import('@/lib/judging/normalization');
  const results = calculateNormalizedResults(evalsRes.rows);

  const top10 = results.sort((a, b) => (a.rank || 0) - (b.rank || 0)).slice(0, 10);
  if (top10.length === 0) return [];

  const submissionIds = top10.map(r => r.submission_id);
  const subRes = await query(`
    SELECT s.id, s.title, s.description, s.url, s.submitted_at, 
           t.name as team_name, tr.id as track_id, tr.name as track_name
    FROM submissions s
    JOIN teams t ON s.team_id = t.id
    LEFT JOIN tracks tr ON s.track_id = tr.id
    WHERE s.id = ANY($1::uuid[])
  `, [submissionIds]);

  const subMap = new Map(subRes.rows.map(s => [s.id, s]));
  return top10.map(r => {
    const row = subMap.get(r.submission_id);
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      url: row.url,
      team: { name: row.team_name },
      track: row.track_id ? { id: row.track_id, name: row.track_name } : null,
      submittedAt: row.submitted_at,
      rank: r.rank
    };
  });
}
