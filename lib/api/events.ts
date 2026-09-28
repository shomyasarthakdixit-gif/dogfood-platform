import { query } from '@/lib/db';
import { Event, Track, Prize } from '@/lib/types';
import { mockEvents } from './mockData';

const USE_MOCK = true; // Temporary override for UI preview

export async function getEvents(): Promise<Event[]> {
  if (USE_MOCK) return mockEvents;
  const result = await query(`
    SELECT id, slug, name, description, start_date, end_date, created_at
    FROM events
    ORDER BY created_at DESC
  `);
  return result.rows.map(rowToEvent);
}

export async function getEventById(id: string): Promise<Event | null> {
  if (USE_MOCK) return mockEvents.find(e => e.id === id) || mockEvents[0];
  const result = await query(
    `SELECT id, slug, name, description, start_date, end_date, created_at FROM events WHERE id = $1`,
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
    `SELECT id, slug, name, description, start_date, end_date, created_at FROM events WHERE slug = $1`,
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
    created_at: row.created_at as string,
    status,
  };
}
