import { NextResponse } from 'next/server';
import { getSubmissionById, updateSubmission } from '@/lib/api/submissions';
import { z } from 'zod';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const { submissionId } = await params;
  try {
    const submission = await getSubmissionById(submissionId);
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }
    return NextResponse.json({ data: submission });
  } catch (error) {
    console.error('GET /api/submissions/:id error:', error);
    return NextResponse.json({ error: 'Failed to load submission' }, { status: 500 });
  }
}

const UpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  url: z.string().url().optional().or(z.literal('')),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const { submissionId } = await params;
  try {
    const body = await request.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const updated = await updateSubmission(submissionId, parsed.data);
    if (!updated) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }
    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('PATCH /api/submissions/:id error:', error);
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
  }
}
