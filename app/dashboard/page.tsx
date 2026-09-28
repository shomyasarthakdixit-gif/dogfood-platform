import { Suspense } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { getEvents } from '@/lib/api/events';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import type { Metadata } from 'next';
import styles from './dashboard.module.css';

export const metadata: Metadata = { title: 'Dashboard — Dogfood 2026' };

// ─── Auth Notice Banner ────────────────────────────────────────────────────
// Auth is being built in feature/core-backend and will be integrated here
// once merged into main. This banner communicates that to participants.
function AuthNoticeBanner() {
  return (
    <div className={styles.authNotice} role="status">
      <div className={styles.authNoticeIcon} aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      </div>
      <div>
        <p className={styles.authNoticeTitle}>Authentication coming soon</p>
        <p className={styles.authNoticeText}>
          Login &amp; personalized dashboard are being built in a parallel branch.
          The platform data is available below — explore events and the gallery in the meantime.
        </p>
      </div>
    </div>
  );
}

// ─── Dashboard Cards ───────────────────────────────────────────────────────
function NoTeamCard() {
  return (
    <Card shadow className={styles.statusCard}>
      <div className={styles.statusCardIcon} aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-subtle)" strokeWidth="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </div>
      <h2 className={styles.statusCardTitle}>Your Team</h2>
      <p className={styles.statusCardBody}>
        You haven&apos;t joined a team yet.
      </p>
      <p className={styles.statusCardHint}>
        Create a team or accept an invitation to get started.
      </p>
      <div className={styles.statusCardActions}>
        <Button as="a" href="/events" variant="primary" size="sm">
          Browse events
        </Button>
      </div>
    </Card>
  );
}

function NoSubmissionCard() {
  return (
    <Card shadow className={styles.statusCard}>
      <div className={styles.statusCardIcon} aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-subtle)" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      </div>
      <h2 className={styles.statusCardTitle}>Your Submission</h2>
      <p className={styles.statusCardBody}>
        Your team hasn&apos;t submitted a project yet.
      </p>
      <div className={styles.statusCardActions}>
        <Button as="a" href="/submissions/new" variant="primary" size="sm">
          Create submission
        </Button>
      </div>
    </Card>
  );
}

// ─── Event Summary ─────────────────────────────────────────────────────────
async function EventSummary() {
  const events = await getEvents();
  const openEvent = events.find(e => e.status === 'OPEN');
  const featuredEvent = openEvent ?? events[0];

  if (!featuredEvent) return null;

  const start = new Date(featuredEvent.start_date);
  const end = new Date(featuredEvent.end_date);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <Card shadow={false} className={styles.eventSummaryCard}>
      <div className={styles.eventCover} aria-hidden="true" />
      <div className={styles.eventSummaryContent}>
        <div className={styles.eventSummaryHeader}>
          <h2 className={styles.eventSummaryTitle}>
            <a href={`/events/${featuredEvent.id}`} className={styles.eventSummaryLink}>
              {featuredEvent.name}
            </a>
          </h2>
          <Badge
            variant={
              featuredEvent.status === 'OPEN'
                ? 'success'
                : featuredEvent.status === 'UPCOMING'
                ? 'info'
                : 'default'
            }
            dot
          >
            {featuredEvent.status === 'OPEN'
              ? 'Open'
              : featuredEvent.status === 'UPCOMING'
              ? 'Upcoming'
              : 'Closed'}
          </Badge>
        </div>

        {featuredEvent.description && (
          <p className={styles.eventSummaryDesc}>{featuredEvent.description}</p>
        )}

        <div className={styles.eventSummaryDates}>
          <div className={styles.dateBlock}>
            <span className={styles.dateLabel}>Starts</span>
            <span className={styles.dateValue}>{fmt(start)}</span>
          </div>
          <div className={styles.dateDivider} aria-hidden="true">→</div>
          <div className={styles.dateBlock}>
            <span className={styles.dateLabel}>Ends</span>
            <span className={styles.dateValue}>{fmt(end)}</span>
          </div>
        </div>

        {featuredEvent.tracks && featuredEvent.tracks.length > 0 && (
          <div className={styles.trackList}>
            {featuredEvent.tracks.map(t => (
              <span key={t.id} className={styles.trackPill}>{t.name}</span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Quick Actions ─────────────────────────────────────────────────────────
function QuickActions() {
  const actions = [
    {
      href: '/events',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      label: 'Browse Events',
      desc: 'Find and join hackathon events',
    },
    {
      href: '/gallery',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      ),
      label: 'Project Gallery',
      desc: 'Explore submitted projects',
    },
    {
      href: '/submissions/new',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      ),
      label: 'Submit Project',
      desc: 'Create a new project submission',
    },
  ];

  return (
    <section aria-labelledby="quickactions-heading">
      <h2 id="quickactions-heading" className={styles.sectionTitle}>
        Quick actions
      </h2>
      <div className={styles.quickActionsGrid}>
        {actions.map(a => (
          <a key={a.href} href={a.href} className={styles.quickActionCard}>
            <div className={styles.quickActionIcon} aria-hidden="true">
              {a.icon}
            </div>
            <div>
              <div className={styles.quickActionLabel}>{a.label}</div>
              <div className={styles.quickActionDesc}>{a.desc}</div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <Skeleton variant="heading" width="50%" />
      <Skeleton variant="text" width="30%" />
      {[1, 2, 3].map(i => (
        <div key={i} style={{ height: 160, background: 'var(--color-surface-inset)', borderRadius: 10 }} />
      ))}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  return (
    <PageContainer>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Dashboard</h1>
        <p className={styles.pageSubtitle}>
          Welcome to Dogfood 2026. Here&apos;s what&apos;s happening.
        </p>
      </div>

      <AuthNoticeBanner />

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          {/* Status cards: these will be driven by real session data once auth merges */}
          <div className={styles.statusGrid}>
            <NoTeamCard />
            <NoSubmissionCard />
          </div>

          <Suspense fallback={<DashboardSkeleton />}>
            <EventSummary />
          </Suspense>
        </div>

        <aside className={styles.sidebar}>
          <QuickActions />
        </aside>
      </div>
    </PageContainer>
  );
}
