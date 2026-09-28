import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { commentSchema } from '@/lib/validation/submissions';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { logAudit } from '@/lib/security/audit';

export async function POST(req: Request, { params }: { params: Promise<{ submissionId: string }> }) {
  try {
    const { submissionId } = await params;
    const { user, error } = await requireUser();
    if (error) return error;

    const { allowed } = await checkRateLimit('comment', user.id, 20, 60000); // 20 comments per minute
    if (!allowed) {
      return NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Too many requests.' } }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const parseRes = commentSchema.safeParse(body);
    if (!parseRes.success) {
      return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Invalid payload.', details: parseRes.error.issues } }, { status: 400 });
    }

    const pool = getDbPool();
    // Validate submission is public
    const subRes = await pool.query(`
      SELECT s.id, e.status as event_status
      FROM submissions s
      JOIN events e ON s.event_id = e.id
      WHERE s.id = $1 AND s.status = 'SUBMITTED'
    `, [submissionId]);

    if (subRes.rowCount === 0) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Submission not found or not eligible for comments.' } }, { status: 404 });
    }

    // Optional: Only allow comments during specific event statuses, like VOTING or RESULTS, or just generally if it's SUBMITTED. Let's just allow if the event is not DRAFT.
    const evStatus = subRes.rows[0].event_status;
    if (evStatus === 'DRAFT') {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Event is not public.' } }, { status: 403 });
    }

    const insertRes = await pool.query(`
      INSERT INTO comments (user_id, submission_id, content)
      VALUES ($1, $2, $3)
      RETURNING id, content, created_at
    `, [user.id, submissionId, parseRes.data.content]);

    await logAudit('COMMENT_CREATED', 'submissions', submissionId, { contentId: insertRes.rows[0].id }, user.id);

    return NextResponse.json({ comment: insertRes.rows[0] }, { status: 201 });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to post comment.' } }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ submissionId: string }> }) {
  try {
    const { submissionId } = await params;
    const pool = getDbPool();

    // Verify submission is public
    const subRes = await pool.query(`
      SELECT s.id, e.status as event_status
      FROM submissions s
      JOIN events e ON s.event_id = e.id
      WHERE s.id = $1 AND s.status = 'SUBMITTED'
    `, [submissionId]);

    if (subRes.rowCount === 0) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Submission not found or not public.' } }, { status: 404 });
    }

    const commentsRes = await pool.query(`
      SELECT c.id, c.content, c.created_at, u.name as author_name
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.submission_id = $1
      ORDER BY c.created_at DESC
      LIMIT 100
    `, [submissionId]);

    return NextResponse.json({ comments: commentsRes.rows });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve comments.' } }, { status: 500 });
  }
}
