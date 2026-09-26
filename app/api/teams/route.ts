import { NextResponse } from 'next/server';
import { createTeam } from '@/lib/api/teams';
import { z } from 'zod';

const CreateTeamSchema = z.object({
  eventId: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = CreateTeamSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { eventId, userId, name, description } = parsed.data;
    const team = await createTeam(eventId, userId, name, description);
    return NextResponse.json({ data: team }, { status: 201 });
  } catch (error) {
    console.error('POST /api/teams error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to create team';
    // Unique constraint = duplicate team name in event
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json(
        { error: 'A team with this name already exists in this event' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}
