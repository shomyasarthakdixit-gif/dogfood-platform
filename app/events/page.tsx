import { Suspense } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { getEvents } from '@/lib/api/events';
import type { Event } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import type { Metadata } from 'next';
import styles from './events.module.css';

export const metadata: Metadata = { title: 'Events — Dogfood 2026' };

function getImageForEventId(id: string) {
  const customImages: Record<string, string> = {
    'evt-1': 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80', // coding
    'evt-2': 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=600&q=80', // green city
    'evt-3': 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=80', // AI/Tech
    'evt-4': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80', // Legacy
  };
  return customImages[id] || customImages['evt-1'];
}

function eventStatusVariant(status: Event['status']): 'success' | 'info' | 'default' {
  if (status === 'OPEN') return 'success';
  if (status === 'UPCOMING') return 'info';
  return 'default';
}

function EventCard({ event }: { event: Event }) {
  const start = new Date(event.start_date);
  const end = new Date(event.end_date);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <Card shadow={false} className={styles.eventCard}>
      <div 
        className={styles.eventCover} 
        style={{ backgroundImage: `url('${getImageForEventId(event.id)}')` }} 
      />
      <div className={styles.eventContent}>
        <div className={styles.eventCardHeader}>
          <div>
            <h2 className={styles.eventName}>{event.name}</h2>
            {event.description && (
              <p className={styles.eventDescription}>{event.description}</p>
            )}
          </div>
          <Badge
            variant={eventStatusVariant(event.status)}
            dot
          >
            {event.status === 'OPEN'
              ? 'Open'
              : event.status === 'UPCOMING'
              ? 'Upcoming'
              : 'Closed'}
          </Badge>
        </div>

        <div className={styles.eventMeta}>
          <span className={styles.metaItem}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {fmt(start)} &ndash; {fmt(end)}
          </span>

          {event.tracks && event.tracks.length > 0 && (
            <span className={styles.metaItem}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M4 6h16M4 10h16M4 14h8" />
              </svg>
              {event.tracks.length} track{event.tracks.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {event.tracks && event.tracks.length > 0 && (
          <div className={styles.trackList}>
            {event.tracks.map(t => (
              <span key={t.id} className={styles.trackPill}>
                {t.name}
              </span>
            ))}
          </div>
        )}

        <div className={styles.eventCardFooter}>
          <Button
            as="a"
            href={`/events/${event.id}`}
            variant={event.status === 'OPEN' ? 'primary' : 'secondary'}
            size="sm"
            fullWidth
          >
            {event.status === 'OPEN' ? 'View event →' : 'View details →'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function EventCardSkeleton() {
  return (
    <Card shadow>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <Skeleton variant="heading" width="60%" />
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="50%" />
          </div>
          <Skeleton width="72px" height="22px" />
        </div>
        <Skeleton variant="text" width="200px" />
        <Skeleton width="100px" height="32px" />
      </div>
    </Card>
  );
}

async function EventsList() {
  const events = await getEvents();

  if (events.length === 0) {
    return (
      <EmptyState
        title="No events available"
        description="Check back later for upcoming hackathons."
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        }
      />
    );
  }

  return (
    <div className={styles.grid}>
      {events.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}

export default function EventsPage() {
  return (
    <PageContainer>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Hackathons</h1>
          <p className={styles.subtitle}>
            Find and join open hackathon events.
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className={styles.grid}>
            <EventCardSkeleton />
            <EventCardSkeleton />
          </div>
        }
      >
        <EventsList />
      </Suspense>
    </PageContainer>
  );
}
