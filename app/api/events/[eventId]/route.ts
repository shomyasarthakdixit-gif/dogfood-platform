import { NextResponse } from 'next/server';
import { getEventById } from '@/lib/api/events';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  try {
    const event = await getEventById(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    return NextResponse.json({ data: event });
  } catch (error) {
    console.error('GET /api/events/:id error:', error);
    return NextResponse.json({ error: 'Failed to load event' }, { status: 500 });
  }
}
