import { NextResponse } from 'next/server';
import { createSubmission } from '@/lib/api/submissions';
import { z } from 'zod';

const CreateSubmissionSchema = z.object({
  teamId: z.string().uuid(),
  eventId: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(2000).optional(),
  url: z.string().url().optional().or(z.literal('')),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = CreateSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { teamId, eventId, title, description, url } = parsed.data;
    const submission = await createSubmission(teamId, eventId, {
      title,
      description,
      url: url || undefined,
    });
    return NextResponse.json({ data: submission }, { status: 201 });
  } catch (error) {
    console.error('POST /api/submissions error:', error);
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json(
        { error: 'This team already has a submission for this event' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 });
  }
}
