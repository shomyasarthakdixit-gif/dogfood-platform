import { NextResponse } from 'next/server';
import { getTeamById } from '@/lib/api/teams';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  try {
    const team = await getTeamById(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }
    return NextResponse.json({ data: team });
  } catch (error) {
    console.error('GET /api/teams/:id error:', error);
    return NextResponse.json({ error: 'Failed to load team' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  try {
    const body = await request.json();
    const { query } = await import('@/lib/db');
    const { name, description } = body as { name?: string; description?: string };
    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    if (name !== undefined) { updates.push(`name = $${idx++}`); values.push(name); }
    if (description !== undefined) { updates.push(`description = $${idx++}`); values.push(description); }
    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }
    values.push(teamId);
    const result = await query(
      `UPDATE teams SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }
    return NextResponse.json({ data: result.rows[0] });
  } catch (error) {
    console.error('PATCH /api/teams/:id error:', error);
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });
  }
}
