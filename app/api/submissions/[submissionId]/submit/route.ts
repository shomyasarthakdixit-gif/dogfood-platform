import { NextResponse } from 'next/server';
import { submitSubmission } from '@/lib/api/submissions';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const { submissionId } = await params;
  try {
    const submission = await submitSubmission(submissionId);
    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found or already submitted' },
        { status: 409 }
      );
    }
    return NextResponse.json({ data: submission });
  } catch (error) {
    console.error('POST /api/submissions/:id/submit error:', error);
    return NextResponse.json({ error: 'Failed to submit project' }, { status: 500 });
  }
}
