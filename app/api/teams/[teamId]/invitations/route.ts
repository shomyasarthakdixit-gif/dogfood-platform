import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { z } from 'zod';
import crypto from 'crypto';

const InviteSchema = z.object({
  invitedByUserId: z.string().uuid(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  try {
    const body = await request.json();
    const parsed = InviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Generate secure invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await query(
      `INSERT INTO team_invitations (team_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [teamId, tokenHash, expiresAt.toISOString()]
    );

    // Return the plain token (caller shares this link)
    return NextResponse.json({
      data: {
        token,
        expiresAt: expiresAt.toISOString(),
        inviteUrl: `/invitations/${token}`,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/teams/:id/invitations error:', error);
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
  }
}
