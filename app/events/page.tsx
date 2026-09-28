import { Suspense } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { getEvents } from '@/lib/api/events';
import type { Event } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import type { Metadata } from 'next';
import styles from './events.module.css';

export const metadata: Metadata = { title: 'Hackathons — Dogfood 2026' };
export const dynamic = 'force-dynamic';

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
    <PageContainer size="full">
      {/* Eco-themed Hero Header */}
      <header className={styles.heroHeader}>
        {/* Eco Motifs */}
        <svg className={styles.ecoMotif1} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="rgba(34, 197, 94, 0.15)" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.1,-46.3C90.4,-33.5,96.1,-18,94.9,-3.1C93.7,11.9,85.6,26.4,75.4,39.1C65.2,51.8,53,62.8,39.4,71.6C25.8,80.4,10.8,87,-4.8,88.4C-20.4,89.8,-35.3,86,-47.9,77.3C-60.5,68.6,-70.7,55,-78.3,40.1C-85.9,25.2,-90.9,9,-89.9,-6.7C-88.9,-22.4,-81.9,-37.6,-71.4,-49.2C-60.9,-60.8,-46.9,-68.8,-32.8,-76C-18.7,-83.2,-4.5,-89.6,9.5,-86.3C23.5,-83,30.5,-83.6,44.7,-76.4Z" transform="translate(100 100)" />
        </svg>
        <svg className={styles.ecoMotif2} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="rgba(20, 184, 166, 0.15)" d="M51.5,-73.4C64.9,-63.9,72.6,-46.8,77.8,-29.4C83,-12,85.7,5.6,80.3,20.8C74.9,36,61.4,48.7,46.5,57.7C31.6,66.7,15.8,72,-0.2,72.3C-16.2,72.6,-32.4,67.9,-46.7,58.7C-61,49.5,-73.4,35.8,-79.6,19.6C-85.8,3.4,-85.8,-15.3,-78.6,-31.2C-71.4,-47,-67,-60,-55.8,-69.5C-44.6,-79,-26.6,-85,-8.4,-82.1C9.8,-79.2,29.6,-77.4,51.5,-73.4Z" transform="translate(100 100)" />
        </svg>

        <div className={styles.heroInner}>
          <h1 className={styles.pageTitle}>Hackathons</h1>
          <p className={styles.subtitle}>Discover open hackathons and build the future.</p>
          
          {/* Search & Filters */}
          <div className={styles.filterSection}>
            <div className={styles.searchBar}>
              <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input type="text" className={styles.searchInput} placeholder="Search events..." />
            </div>

            <div className={styles.categoryFilters}>
              <button className={`${styles.filterPill} ${styles.filterPillActive}`}>All Events</button>
              <button className={styles.filterPill}>AI & ML</button>
              <button className={styles.filterPill}>Web Dev</button>
              <button className={styles.filterPill}>Sustainability</button>
            </div>

            <div className={styles.sortContainer}>
              <select className={styles.sortSelect}>
                <option>Sort: Soonest</option>
                <option>Sort: Newest</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <div className={styles.mainContainer}>
        <Suspense fallback={<EventsLoading />}>
          <EventsList />
        </Suspense>

        {/* Testimonial Section */}
        <section className={styles.testimonialSection}>
          <div className={styles.testimonialInner}>
            <div className={styles.quoteIcon}>&quot;</div>
            <p className={styles.testimonialText}>
              Dogfood 2025 helped me land my dream job! The community and the projects we built were world-class.
            </p>
            <div className={styles.testimonialAuthor}>
              <div className={styles.authorAvatar}>S</div>
              <div>
                <div className={styles.authorName}>Sarah Jenkins</div>
                <div className={styles.authorRole}>Frontend Developer at TechNova</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}

async function EventsList() {
  const events = await getEvents();
  const displayEvents = events && events.length > 0 ? events : [
    { id: 'evt-1', slug: 'dogfood-2026', name: 'Dogfood 2026', description: 'The premier hackathon for the Dogfood 2026 platform. Build amazing things with our new technology stack.', start_date: '2026-09-27T00:00:00Z', end_date: '2026-09-30T00:00:00Z', status: 'OPEN' },
    { id: 'evt-2', slug: 'winter-innovators', name: 'Dogfood Winter Innovators', description: 'Warm up your coding skills. A 48-hour sprint to build sustainable, eco-friendly tech solutions.', start_date: '2026-10-28T00:00:00Z', end_date: '2026-10-30T00:00:00Z', status: 'UPCOMING' },
    { id: 'evt-3', slug: 'ai-challenge', name: 'Global AI Challenge', description: 'Push the boundaries of artificial intelligence. Build agents, train models, and create the future.', start_date: '2026-11-27T00:00:00Z', end_date: '2026-12-04T00:00:00Z', status: 'UPCOMING' },
  ] as Event[];

  return (
    <div className={styles.grid}>
      {displayEvents.map((evt, i) => {
        const isFlagship = i === 0;
        const daysUntil = Math.max(1, ((i * 7 + 3) % 15) + 1);

        return (
          <Card key={evt.id} hover padding="sm" className={styles.card}>
            <div className={styles.cardImageWrap}>
              <img src={getImageForEventId(evt.id)} alt={evt.name} className={styles.cardImage} />
              <div className={styles.cardBadgesRow}>
                <StatusBadge status={evt.status} />
                {isFlagship && <span className={styles.flagshipBadge}>Flagship</span>}
              </div>
              <button className={styles.bookmarkBtn} aria-label="Save event">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </button>
            </div>

            <div className={styles.cardBody}>
              <h3 className={styles.cardTitle}>{evt.name}</h3>
              
              <div className={styles.cardMeta}>
                <div className={styles.metaRow}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span>{new Date(evt.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(evt.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                <div className={styles.metaRow}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span>Online · 2 Tracks</span>
                </div>
              </div>

              {evt.status === 'UPCOMING' && (
                <div className={styles.countdown}>
                  Starts in {daysUntil} days
                </div>
              )}

              <p className={styles.cardDesc}>
                {evt.description ? evt.description.slice(0, 80) + '...' : 'Build amazing things with our new technology stack.'}
              </p>

              <div className={styles.tags}>
                <span className={styles.tag}>{i % 2 === 0 ? 'AI Innovation' : 'Web Dev'}</span>
                <span className={styles.tag}>Core Platform</span>
              </div>
            </div>

            <div className={styles.cardFooter}>
              <div className={styles.socialActions}>
                <button className={styles.iconBtn} aria-label="Share to Twitter"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg></button>
                <button className={styles.iconBtn} aria-label="Add to Calendar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg></button>
              </div>
              <Button as="a" href={`/events/${evt.slug}`} variant="secondary" className={styles.viewBtn}>
                View Event
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function EventsLoading() {
  return (
    <div className={styles.grid}>
      {[...Array(6)].map((_, i) => (
        <Card key={i} padding="sm" className={styles.card}>
          <Skeleton width="100%" height="160px" />
          <div className={styles.cardBody}>
            <Skeleton width="60%" height="24px" className={styles.skeletonTitle} />
            <Skeleton width="40%" height="16px" className={styles.skeletonMeta} />
            <Skeleton width="100%" height="60px" />
          </div>
        </Card>
      ))}
    </div>
  );
}
