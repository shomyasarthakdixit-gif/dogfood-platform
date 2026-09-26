import { query } from '@/lib/db';
import { Submission } from '@/lib/types';
import { mockSubmissions } from './mockData';

const USE_MOCK = true;

export async function getSubmissionsByEvent(eventId: string): Promise<Submission[]> {
  if (USE_MOCK) return mockSubmissions.filter(s => s.event_id === eventId);
  const result = await query(
    `SELECT s.id, s.team_id, s.event_id, s.title, s.description, s.url, s.status, s.created_at,
            t.name as team_name
     FROM submissions s
     JOIN teams t ON t.id = s.team_id
     WHERE s.event_id = $1
     ORDER BY s.created_at DESC`,
    [eventId]
  );
  return result.rows.map(rowToSubmission);
}

export async function getSubmissionById(id: string): Promise<Submission | null> {
  if (USE_MOCK) return mockSubmissions.find(s => s.id === id) || null;
  const result = await query(
    `SELECT s.id, s.team_id, s.event_id, s.title, s.description, s.url, s.status, s.created_at,
            t.name as team_name, t.description as team_description
     FROM submissions s
     JOIN teams t ON t.id = s.team_id
     WHERE s.id = $1`,
    [id]
  );
  if (result.rows.length === 0) return null;
  return rowToSubmission(result.rows[0]);
}

export async function getSubmissionByTeam(teamId: string, eventId: string): Promise<Submission | null> {
  if (USE_MOCK) return mockSubmissions.find(s => s.team_id === teamId && s.event_id === eventId) || null;
  const result = await query(
    `SELECT s.id, s.team_id, s.event_id, s.title, s.description, s.url, s.status, s.created_at
     FROM submissions s WHERE s.team_id = $1 AND s.event_id = $2 LIMIT 1`,
    [teamId, eventId]
  );
  if (result.rows.length === 0) return null;
  return getSubmissionById(result.rows[0].id);
}

export async function createSubmission(
  teamId: string,
  eventId: string,
  data: { title: string; description?: string; url?: string }
): Promise<Submission> {
  const result = await query(
    `INSERT INTO submissions (team_id, event_id, title, description, url, status)
     VALUES ($1, $2, $3, $4, $5, 'DRAFT') RETURNING *`,
    [teamId, eventId, data.title, data.description ?? null, data.url ?? null]
  );
  return rowToSubmission(result.rows[0]);
}

export async function updateSubmission(
  id: string,
  data: { title?: string; description?: string; url?: string }
): Promise<Submission | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  if (data.title !== undefined) { updates.push(`title = $${idx++}`); values.push(data.title); }
  if (data.description !== undefined) { updates.push(`description = $${idx++}`); values.push(data.description); }
  if (data.url !== undefined) { updates.push(`url = $${idx++}`); values.push(data.url); }
  if (updates.length === 0) return getSubmissionById(id);
  values.push(id);
  const result = await query(
    `UPDATE submissions SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  if (result.rows.length === 0) return null;
  return rowToSubmission(result.rows[0]);
}

export async function submitSubmission(id: string): Promise<Submission | null> {
  const result = await query(
    `UPDATE submissions SET status = 'SUBMITTED' WHERE id = $1 AND status = 'DRAFT' RETURNING *`,
    [id]
  );
  if (result.rows.length === 0) return null;
  return rowToSubmission(result.rows[0]);
}

function rowToSubmission(row: Record<string, unknown>): Submission {
  return {
    id: row.id as string,
    team_id: row.team_id as string,
    event_id: row.event_id as string,
    title: row.title as string,
    description: row.description as string | null,
    url: row.url as string | null,
    repo_url: row.url as string | null,
    status: row.status as Submission['status'],
    created_at: row.created_at as string,
    team: row.team_name
      ? {
          id: row.team_id as string,
          event_id: row.event_id as string,
          name: row.team_name as string,
          description: row.team_description as string | null,
          created_at: row.created_at as string,
        }
      : undefined,
  };
}
