import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { getCurrentUser, hashToken } from '@/lib/auth';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { logAudit } from '@/lib/security/audit';

export async function POST(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params;
    const body = await req.json().catch(() => ({}));
    const { submissionId, voterToken } = body;

    if (!submissionId) {
      return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'submissionId is required.' } }, { status: 400 });
    }

    const user = await getCurrentUser();
    
    let hashedToken: string | null = null;
    let userId: string | null = null;
    let limitId = req.headers.get('x-forwarded-for') || 'unknown-ip';

    if (user) {
      userId = user.id;
      limitId = userId || 'unknown-user';
    } else if (voterToken) {
      hashedToken = hashToken(voterToken);
      limitId = hashedToken;
    } else {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Must be logged in or provide voterToken.' } }, { status: 401 });
    }

    const { allowed } = await checkRateLimit('vote', limitId, 10, 60000);
    if (!allowed) {
      return NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Too many requests.' } }, { status: 429 });
    }

    const pool = getDbPool();

    // 1. Validate event and voting window
    const evRes = await pool.query('SELECT status, voting_start, voting_end FROM events WHERE id = $1', [eventId]);
    if (evRes.rowCount === 0) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Event not found.' } }, { status: 404 });
    }
    const ev = evRes.rows[0];
    const now = new Date();

    if (!ev.voting_start || new Date(ev.voting_start) > now) {
      return NextResponse.json({ error: { code: 'VOTING_NOT_STARTED', message: 'Voting has not started yet.' } }, { status: 403 });
    }
    if (!ev.voting_end || new Date(ev.voting_end) < now) {
      return NextResponse.json({ error: { code: 'VOTING_CLOSED', message: 'Voting has ended.' } }, { status: 403 });
    }

    // 2. Validate submission
    const subRes = await pool.query('SELECT id, status, event_id FROM submissions WHERE id = $1', [submissionId]);
    if (subRes.rowCount === 0) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Submission not found.' } }, { status: 404 });
    }
    const sub = subRes.rows[0];
    if (sub.event_id !== eventId) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Submission does not belong to this event.' } }, { status: 403 });
    }
    if (sub.status !== 'SUBMITTED') {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Submission is not publicly eligible for voting.' } }, { status: 403 });
    }

    // 3. Insert Vote
    let insertRes;
    try {
      insertRes = await pool.query(`
        INSERT INTO votes (user_id, voter_token_hash, submission_id)
        VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [userId, hashedToken, submissionId]);
    } catch (err: unknown) {
      console.error(err);
      return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to record vote.' } }, { status: 500 });
    }

    if (insertRes.rowCount === 0) {
      return NextResponse.json({ error: { code: 'ALREADY_VOTED', message: 'You have already voted for this submission.' } }, { status: 409 });
    }

    // 4. Audit Log
    await logAudit('VOTE_CREATED', 'submissions', submissionId, {
      eventId,
      actorType: userId ? 'USER' : 'ANONYMOUS'
    }, userId);

    return NextResponse.json({ success: true, message: 'Vote recorded successfully.' }, { status: 201 });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to process request.' } }, { status: 500 });
  }
}
