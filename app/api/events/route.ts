import { NextResponse } from 'next/server';
import { getEvents } from '@/lib/api/events';

export async function GET() {
  try {
    const events = await getEvents();
    return NextResponse.json({ data: events });
  } catch (error) {
    console.error('GET /api/events error:', error);
    return NextResponse.json(
      { error: 'Failed to load events' },
      { status: 500 }
    );
  }
}
