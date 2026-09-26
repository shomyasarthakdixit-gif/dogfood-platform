import { query } from '@/lib/db';
import { Team, TeamMember, User } from '@/lib/types';

export async function getTeamById(teamId: string): Promise<Team | null> {
  const result = await query(
    `SELECT id, event_id, name, description, created_at FROM teams WHERE id = $1`,
    [teamId]
  );
  if (result.rows.length === 0) return null;
  const team = result.rows[0] as Team;
  team.members = await getTeamMembers(teamId);
  return team;
}

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const result = await query(
    `SELECT tm.id, tm.team_id, tm.user_id, tm.role, tm.created_at,
            u.id as u_id, u.name as u_name, u.email as u_email, u.role as u_role, u.created_at as u_created_at
     FROM team_members tm
     JOIN users u ON u.id = tm.user_id
     WHERE tm.team_id = $1
     ORDER BY tm.role DESC, tm.created_at ASC`,
    [teamId]
  );
  return result.rows.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    team_id: row.team_id as string,
    user_id: row.user_id as string,
    role: row.role as TeamMember['role'],
    created_at: row.created_at as string,
    user: {
      id: row.u_id as string,
      name: row.u_name as string,
      email: row.u_email as string,
      role: row.u_role as User['role'],
      created_at: row.u_created_at as string,
    },
  }));
}

export async function createTeam(
  eventId: string,
  userId: string,
  name: string,
  description?: string
): Promise<Team> {
  const client = await (await import('@/lib/db')).getDbPool().connect();
  try {
    await client.query('BEGIN');
    const teamRes = await client.query(
      `INSERT INTO teams (event_id, name, description) VALUES ($1, $2, $3) RETURNING *`,
      [eventId, name, description ?? null]
    );
    const team = teamRes.rows[0] as Team;
    await client.query(
      `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'LEADER')`,
      [team.id, userId]
    );
    await client.query('COMMIT');
    return team;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getTeamByUserAndEvent(
  userId: string,
  eventId: string
): Promise<Team | null> {
  const result = await query(
    `SELECT t.id, t.event_id, t.name, t.description, t.created_at
     FROM teams t
     JOIN team_members tm ON tm.team_id = t.id
     WHERE tm.user_id = $1 AND t.event_id = $2
     LIMIT 1`,
    [userId, eventId]
  );
  if (result.rows.length === 0) return null;
  return getTeamById(result.rows[0].id);
}
