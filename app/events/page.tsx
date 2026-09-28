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

export const metadata: Metadata = { title: 'Hackathons — Dogfood 2026' };

function getImageForEventId(id: string) {
  const customImages: Record<string, string> = {
    'evt-1': 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80',
    'evt-2': 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=600&q=80',
    'evt-3': 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=80',
    'evt-4': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
  };
  return customImages[id] || customImages['evt-1'];
}

function StatusBadge({ status }: { status: Event['status'] }) {
  if (status === 'OPEN') return <Badge variant="success" className={styles.badgeCompact}>🟢 Open</Badge>;
  if (status === 'UPCOMING') return <Badge variant="info" className={styles.badgeCompact}>🔵 Upcoming</Badge>;
  return <Badge variant="default" className={styles.badgeCompact}>⚪ Closed</Badge>;
}

export default function EventsPage() {
  return (
    <PageContainer>
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>Hackathons</h1>
        <p className={styles.subtitle}>Find and join open hackathon events.</p>
      </header>

      <div className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="text" className={styles.searchInput} placeholder="Search events..." />
        </div>
        <div className={styles.filterDropdowns}>
          <select className={styles.select}>
            <option>Status: All</option>
            <option>Open</option>
            <option>Upcoming</option>
            <option>Closed</option>
          </select>
          <select className={styles.select}>
            <option>Track: All</option>
            <option>AI</option>
            <option>Web</option>
            <option>Cloud</option>
            <option>Open Source</option>
          </select>
          <select className={styles.select}>
            <option>Sort: Soonest</option>
            <option>Latest</option>
            <option>Most popular</option>
          </select>
        </div>
      </div>

      <Suspense fallback={<EventsLoading />}>
        <EventsList />
      </Suspense>
    </PageContainer>
  );
}

async function EventsList() {
  const events = await getEvents();
  if (!events || events.length === 0) {
    return <EmptyState title="No events found" description="There are currently no active hackathons." />;
  }

  return (
    <div className={styles.grid}>
      {events.map(evt => (
        <Card key={evt.id} hover padding="sm" className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>{evt.name}</h3>
            <StatusBadge status={evt.status} />
          </div>
          
          <div className={styles.cardMeta}>
            <span className={styles.metaItem}>
              {new Date(evt.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(evt.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className={styles.metaItem}>Online · 2 Tracks</span>
          </div>

          <div className={styles.cardOrganizer}>
            Hosted by <strong>Dogfood.dev</strong>
          </div>

          <p className={styles.cardDesc}>
            {evt.description ? evt.description.slice(0, 80) + '...' : 'Build amazing things with our new technology stack.'}
          </p>

          <div className={styles.tags}>
            <span className={styles.tag}>Core Platform</span>
            <span className={styles.tag}>AI Innovation</span>
          </div>

          <div className={styles.cardFooter}>
            <Button as="a" href={`/events/${evt.slug}`} variant="secondary" fullWidth className={styles.viewBtn}>
              View event →
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function EventsLoading() {
  return (
    <div className={styles.grid}>
      {[...Array(6)].map((_, i) => (
        <Card key={i} padding="sm" className={styles.card}>
          <Skeleton width="60%" height="24px" className={styles.skeletonTitle} />
          <Skeleton width="40%" height="16px" className={styles.skeletonMeta} />
          <Skeleton width="100%" height="60px" />
        </Card>
      ))}
    </div>
  );
}
