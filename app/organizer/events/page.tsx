import { getCurrentUser } from '@/lib/auth';
import { getDbPool } from '@/lib/db';
import PageContainer from '@/components/layout/PageContainer';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import DeleteEventButton from '@/components/ui/DeleteEventButton';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Manage Events — Organizer' };

export default async function OrganizerEventsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const pool = getDbPool();
  let events = [];
  
  if (user.role === 'ADMIN') {
    const res = await pool.query('SELECT * FROM events ORDER BY created_at DESC');
    events = res.rows;
  } else {
    const res = await pool.query(`
      SELECT e.* FROM events e
      JOIN event_members em ON e.id = em.event_id
      WHERE em.user_id = $1 AND em.role = 'ORGANIZER'
      ORDER BY e.created_at DESC
    `, [user.id]);
    events = res.rows;
  }

  if (events.length === 0 && user.role !== 'ADMIN') {
    return (
      <PageContainer>
        <h1>Manage Events</h1>
        <p>You are not an organizer for any events.</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Manage Events</h1>
        <Button as="a" href="/organizer/events/new" variant="primary">
          + Create Event
        </Button>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {events.map((evt) => (
          <div key={evt.id} style={{ padding: '1.5rem', background: 'var(--color-bg-card)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{evt.name}</h2>
                <div style={{ display: 'flex', gap: '1rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  <span>Status: <strong style={{color: 'var(--color-text)'}}>{evt.status}</strong></span>
                  <span>Slug: {evt.slug}</span>
                  <span>{new Date(evt.start_date).toLocaleDateString()} - {new Date(evt.end_date).toLocaleDateString()}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <DeleteEventButton eventId={evt.id} />
                <Link href={`/organizer/events/${evt.id}`} style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', color: 'var(--color-text)', borderRadius: '4px', textDecoration: 'none', border: '1px solid var(--color-border)' }}>
                  Manage →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
