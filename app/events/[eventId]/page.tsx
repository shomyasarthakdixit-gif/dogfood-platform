import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { getEventById } from '@/lib/api/events';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import type { Event, Track, Prize } from '@/lib/types';
import type { Metadata } from 'next';
import styles from './event-detail.module.css';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>;
}): Promise<Metadata> {
  const { eventId } = await params;
  const event = await getEventById(eventId);
  return {
    title: event ? `${event.name} — Dogfood 2026` : 'Event not found',
  };
}

function EventTimeline({ event }: { event: Event }) {
  const now = new Date();
  const start = new Date(event.start_date);
  const end = new Date(event.end_date);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

  const phases = [
    { label: 'Registration Opens', date: start, done: now >= start },
    {
      label: 'Team Formation',
      date: new Date(start.getTime() + 12 * 60 * 60 * 1000),
      done: now >= new Date(start.getTime() + 12 * 60 * 60 * 1000),
    },
    { label: 'Submission Deadline', date: end, done: now >= end },
    {
      label: 'Judging',
      date: new Date(end.getTime() + 24 * 60 * 60 * 1000),
      done: now >= new Date(end.getTime() + 24 * 60 * 60 * 1000),
    },
    {
      label: 'Results',
      date: new Date(end.getTime() + 48 * 60 * 60 * 1000),
      done: now >= new Date(end.getTime() + 48 * 60 * 60 * 1000),
    },
  ];

  return (
    <div className={styles.timeline} aria-label="Event timeline">
      {phases.map((phase, i) => (
        <div key={i} className={styles.timelineItem}>
          <div
            className={[styles.timelineDot, phase.done ? styles.done : '']
              .filter(Boolean)
              .join(' ')}
            aria-hidden="true"
          />
          <div className={styles.timelineContent}>
            <span className={styles.timelineLabel}>{phase.label}</span>
            <span className={styles.timelineDate}>{fmt(phase.date)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TrackCard({ track }: { track: Track }) {
  return (
    <Card shadow className={styles.trackCard}>
      <h3 className={styles.trackName}>{track.name}</h3>
      {track.description && (
        <p className={styles.trackDescription}>{track.description}</p>
      )}
    </Card>
  );
}

function PrizeCard({ prize }: { prize: Prize }) {
  return (
    <Card className={styles.prizeCard}>
      <div className={styles.prizeHeader}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-warning)"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="8" r="7" />
          <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
        </svg>
        <h3 className={styles.prizeName}>{prize.name}</h3>
      </div>
      {prize.amount && (
        <div className={styles.prizeAmount}>{prize.amount}</div>
      )}
      {prize.description && (
        <p className={styles.prizeDescription}>{prize.description}</p>
      )}
    </Card>
  );
}

function StatusBanner({ event }: { event: Event }) {
  if (event.status === 'OPEN') {
    return (
      <div className={styles.bannerOpen}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        Submissions are currently open. Join this event and submit your project.
      </div>
    );
  }
  if (event.status === 'UPCOMING') {
    return (
      <div className={styles.bannerUpcoming}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        This event hasn&apos;t started yet. Check back on the start date.
      </div>
    );
  }
  return (
    <div className={styles.bannerClosed}>
      This event is closed. Submissions are no longer accepted.
    </div>
  );
}

async function EventDetail({ eventId }: { eventId: string }) {
  const event = await getEventById(eventId);
  if (!event) notFound();

  return (
    <article>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerMeta}>
          <Badge
            variant={
              event.status === 'OPEN'
                ? 'success'
                : event.status === 'UPCOMING'
                ? 'info'
                : 'default'
            }
            dot
          >
            {event.status === 'OPEN'
              ? 'Open'
              : event.status === 'UPCOMING'
              ? 'Upcoming'
              : 'Closed'}
          </Badge>
          <span className={styles.headerDate}>
            {new Date(event.start_date).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>
        <h1 className={styles.title}>{event.name}</h1>
        {event.description && (
          <p className={styles.description}>{event.description}</p>
        )}
        {event.status === 'OPEN' && (
          <div className={styles.headerActions}>
            <Button
              as="a"
              href="/dashboard"
              variant="primary"
              size="lg"
            >
              Go to Dashboard →
            </Button>
            <Button
              as="a"
              href="/gallery"
              variant="secondary"
              size="lg"
            >
              View Gallery
            </Button>
          </div>
        )}
      </div>

      <StatusBanner event={event} />

      <div className={styles.body}>
        {/* Main column */}
        <div className={styles.mainColumn}>
          {/* Tracks */}
          {event.tracks && event.tracks.length > 0 && (
            <section aria-labelledby="tracks-heading">
              <h2 id="tracks-heading" className={styles.sectionTitle}>
                Tracks
              </h2>
              <div className={styles.tracksGrid}>
                {event.tracks.map(t => (
                  <TrackCard key={t.id} track={t} />
                ))}
              </div>
            </section>
          )}

          {/* Prizes */}
          {event.prizes && event.prizes.length > 0 && (
            <section aria-labelledby="prizes-heading">
              <h2 id="prizes-heading" className={styles.sectionTitle}>
                Prizes
              </h2>
              <div className={styles.prizesGrid}>
                {event.prizes.map(p => (
                  <PrizeCard key={p.id} prize={p} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar: Timeline */}
        <aside className={styles.sidebar}>
          <Card shadow padding="md">
            <h2 className={styles.sidebarTitle}>Timeline</h2>
            <EventTimeline event={event} />
          </Card>

          <Card padding="md" className={styles.linksCard}>
            <h2 className={styles.sidebarTitle}>Quick actions</h2>
            <div className={styles.quickLinks}>
              <Button as="a" href="/dashboard" variant="secondary" fullWidth size="sm">
                My Dashboard
              </Button>
              <Button as="a" href="/gallery" variant="secondary" fullWidth size="sm">
                Project Gallery
              </Button>
              <Button as="a" href="/submissions/new" variant="ghost" fullWidth size="sm">
                Submit a project
              </Button>
            </div>
          </Card>
        </aside>
      </div>
    </article>
  );
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return (
    <PageContainer>
      <Suspense fallback={<EventDetailSkeleton />}>
        <EventDetail eventId={eventId} />
      </Suspense>
    </PageContainer>
  );
}

function EventDetailSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <div style={{ width: 72, height: 22, borderRadius: 999, background: 'var(--color-border)', animation: 'shimmer 1.5s infinite' }} />
        </div>
        <div style={{ height: 40, width: '60%', background: 'var(--color-border)', borderRadius: 6, animation: 'shimmer 1.5s infinite' }} />
        <div style={{ height: 20, width: '80%', background: 'var(--color-border)', borderRadius: 6 }} />
      </div>
    </div>
  );
}
