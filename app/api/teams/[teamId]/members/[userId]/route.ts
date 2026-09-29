import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireTeamLeader } from '@/lib/auth';

export async function DELETE(req: Request, { params }: { params: Promise<{ teamId: string, userId: string }> }) {
  const { teamId, userId } = await params;
  
  // Must be LEADER of the team
  const { user, error } = await requireTeamLeader(teamId);
  if (error) return error;

  // Cannot remove yourself via this endpoint (should delete team or transfer ownership)
  if (user!.id === userId) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Cannot remove yourself from the team' } }, { status: 403 });
  }

  try {
    const pool = getDbPool();
    const res = await pool.query('DELETE FROM team_members WHERE team_id = $1 AND user_id = $2 RETURNING id', [teamId, userId]);
    
    if (res.rowCount === 0) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Member not found in team' } }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } }, { status: 500 });
  }
}
