import { NextResponse } from 'next/server';
import { getSubmissionsByEvent } from '@/lib/api/submissions';
import { getEvents } from '@/lib/api/events';

export async function GET() {
  try {
    // Fetch all events, then all submitted projects across events
    const events = await getEvents();
    const allSubmissions = await Promise.all(
      events.map(e => getSubmissionsByEvent(e.id))
    );
    const gallery = allSubmissions
      .flat()
      .filter(s => s.status === 'SUBMITTED');
    return NextResponse.json({ data: gallery });
  } catch (error) {
    console.error('GET /api/gallery error:', error);
    return NextResponse.json({ error: 'Failed to load gallery' }, { status: 500 });
  }
}
