import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireTeamLeader } from '@/lib/auth';
import { teamUpdateSchema } from '@/lib/validation/teams';

export async function GET(_req: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const teamId = (await params).teamId;
  const pool = getDbPool();
  const res = await pool.query('SELECT * FROM teams WHERE id = $1', [teamId]);
  if (res.rowCount === 0) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Team not found' } }, { status: 404 });
  return NextResponse.json({ team: res.rows[0] });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const teamId = (await params).teamId;
  const { error } = await requireTeamLeader(teamId);
  if (error) return error;

  try {
    const body = await req.json();
    const result = teamUpdateSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: result.error.issues[0].message } }, { status: 400 });

    const pool = getDbPool();
    const updates = Object.entries(result.data).map(([k, _v], i) => `${k} = $${i+2}`);
    if (updates.length === 0) return NextResponse.json({ status: 'ok' });

    const query = `UPDATE teams SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`;
    const res = await pool.query(query, [teamId, ...Object.values(result.data)]);
    
    return NextResponse.json({ team: res.rows[0] });
  } catch (err: unknown) {
    console.error(err);
    if (err && typeof err === 'object' && 'code' in err && (err as any).code === '23505') {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Team name already exists' } }, { status: 400 });
    }
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } }, { status: 500 });
  }
}
