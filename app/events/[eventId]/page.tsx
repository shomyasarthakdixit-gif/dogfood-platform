import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { unstable_noStore as noStore } from 'next/cache';
import PageContainer from '@/components/layout/PageContainer';
import { getEventById, getTop10Projects } from '@/lib/api/events';
import { getCurrentUser } from '@/lib/auth';
import { getDbPool } from '@/lib/db';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import JoinEventButton from '@/components/ui/JoinEventButton';
import type { Event, Track, Prize } from '@/lib/types';
import type { Metadata } from 'next';
import styles from './event-detail.module.css';

export const dynamic = 'force-dynamic';

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

async function Top10Projects({ eventId }: { eventId: string }) {
  const projects = await getTop10Projects(eventId);
  if (projects.length === 0) return null;

  return (
    <section aria-labelledby="top10-heading" style={{ marginTop: 'var(--space-8)' }}>
      <h2 id="top10-heading" className={styles.sectionTitle}>
        Top 10 Projects
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {projects.map((p, i) => (
          <Card key={p.id}>
            <div style={{ padding: 'var(--space-4)', display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-primary)', width: '40px', textAlign: 'center' }}>
                #{i + 1}
              </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{p.title}</h3>
              <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-light)' }}>
                {p.team.name} {p.track && ` • ${p.track.name}`}
              </p>
              {p.description && (
                <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
                  {p.description}
                </p>
              )}
            </div>
            {p.url && (
              <Button as="a" href={p.url} variant="secondary" size="sm" target="_blank" rel="noopener noreferrer">
                View Project
              </Button>
            )}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
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

function ParticipantTimelineState({ userSubmission, isRegistered }: { userSubmission: any, isRegistered: boolean }) {
  if (!isRegistered) {
    return (
      <div className={styles.timelineItem} style={{ marginTop: '16px' }}>
        <div className={styles.timelineDot} style={{ background: 'transparent', border: '2px solid var(--color-border)' }} aria-hidden="true" />
        <div className={styles.timelineContent}>
          <span className={styles.timelineLabel} style={{ color: 'var(--color-text-light)' }}>○ Not registered</span>
        </div>
      </div>
    );
  }
  if (!userSubmission) {
    return (
      <div className={styles.timelineItem} style={{ marginTop: '16px' }}>
        <div className={styles.timelineDot} style={{ background: 'transparent', border: '2px solid var(--color-border)' }} aria-hidden="true" />
        <div className={styles.timelineContent}>
          <span className={styles.timelineLabel} style={{ color: 'var(--color-text-light)' }}>○ Submission pending</span>
        </div>
      </div>
    );
  }
  if (userSubmission.status === 'SUBMITTED') {
    return (
      <div className={styles.timelineItem} style={{ marginTop: '16px' }}>
        <div className={[styles.timelineDot, styles.done].join(' ')} aria-hidden="true" />
        <div className={styles.timelineContent}>
          <span className={styles.timelineLabel}>✓ Submission completed</span>
          {userSubmission.submitted_at && (
            <span className={styles.timelineDate}>{new Date(userSubmission.submitted_at).toLocaleString()}</span>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className={styles.timelineItem} style={{ marginTop: '16px' }}>
      <div className={styles.timelineDot} style={{ background: 'var(--color-warning)' }} aria-hidden="true" />
      <div className={styles.timelineContent}>
        <span className={styles.timelineLabel} style={{ color: 'var(--color-warning)' }}>• Submission draft saved</span>
      </div>
    </div>
  );
}

function TrackCard({ track }: { track: Track }) {
  return (
    <div className={styles.trackCard}>
      <h3 className={styles.trackName}>{track.name}</h3>
      {track.description && (
        <p className={styles.trackDescription}>{track.description}</p>
      )}
    </div>
  );
}

function PrizeCard({ prize }: { prize: Prize }) {
  return (
    <div className={styles.prizeCard}>
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
    </div>
  );
}

function StatusBanner({ event, userRole, userSubmission, isRegistered }: { event: Event, userRole: string | null, userSubmission: any, isRegistered: boolean }) {
  if (event.lifecycle_status === 'REGISTRATION') {
    let message = userRole === 'ORGANIZER'
      ? 'Registration is currently open.'
      : isRegistered
        ? '✓ You are registered for this event.'
        : 'Registration is open. Register to participate.';
        
    return (
      <div className={styles.bannerOpen}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        {message}
      </div>
    );
  }
  
  if (event.status === 'OPEN' || event.lifecycle_status === 'SUBMISSION') {
    let message = userRole === 'ORGANIZER'
      ? 'Submissions are currently open.'
      : 'Submissions are currently open.';
      
    if (userRole !== 'ORGANIZER' && userRole !== 'JUDGE' && isRegistered) {
      if (!userSubmission) {
        message = 'Submissions are currently open. Submit your project before the deadline.';
      } else if (userSubmission.status === 'SUBMITTED') {
        message = 'Your team has successfully submitted this project.';
      } else if (userSubmission.status === 'DRAFT' && userSubmission.submitted_at) {
        message = 'Your submission has been withdrawn. You can edit and resubmit before the deadline.';
      } else if (userSubmission.status === 'DRAFT') {
        message = 'You have a saved draft. Complete and submit it before the deadline.';
      }
    }

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
        {message}
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

function getImageForEventId(id: string) {
  const customImages: Record<string, string> = {
    'evt-1': 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    'evt-2': 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80',
    'evt-3': 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80',
    'evt-4': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
  };
  return customImages[id] || customImages['evt-1'];
}

async function EventDetail({ eventId }: { eventId: string }) {
  noStore();
  const event = await getEventById(eventId);
  if (!event) notFound();

  const user = await getCurrentUser();
  let userRole = null;
  let userTeam = null;
  let userSubmission = null;
  
  let isRegistered = false;

  if (user) {
    if (user.role === 'ADMIN') {
      userRole = 'ORGANIZER';
    } else {
      const pool = getDbPool();
      const res = await pool.query('SELECT role FROM event_members WHERE event_id = $1 AND user_id = $2', [event.id, user.id]);
      if (res.rowCount !== null && res.rowCount > 0) {
        userRole = res.rows[0].role;
        if (userRole === 'PARTICIPANT') isRegistered = true;
      }
      
      if (isRegistered) {
        const teamRes = await pool.query(`
          SELECT t.id FROM teams t
          JOIN team_members tm ON t.id = tm.team_id
          WHERE t.event_id = $1 AND tm.user_id = $2
        `, [event.id, user.id]);
        if (teamRes.rowCount !== null && teamRes.rowCount > 0) {
          userTeam = teamRes.rows[0];
          const subRes = await pool.query(`
            SELECT id, status, submitted_at FROM submissions WHERE team_id = $1 AND event_id = $2 LIMIT 1
          `, [userTeam.id, event.id]);
          if (subRes.rowCount !== null && subRes.rowCount > 0) {
            userSubmission = subRes.rows[0];
          }
        }
      }
    }
  }

  return (
    <article>
      {/* Cover Image */}
      <div className={styles.coverWrapper}>
        <img 
          src={getImageForEventId(eventId)} 
          alt={event.name} 
          className={styles.coverImage} 
        />
        <div className={styles.coverOverlay} aria-hidden="true" />
      </div>

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
          </div>
        )}
      </div>

      <StatusBanner event={event} userRole={userRole} userSubmission={userSubmission} isRegistered={isRegistered} />

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

          {/* Top 10 Projects */}
          {(event.lifecycle_status === 'RESULTS' || event.lifecycle_status === 'ARCHIVED') && (
            <Suspense fallback={<div>Loading top projects...</div>}>
              <Top10Projects eventId={event.id} />
            </Suspense>
          )}
        </div>

        {/* Sidebar: Timeline */}
        <aside className={styles.sidebar}>
          <div className={[styles.sidebarCard, styles.timelineCard].join(' ')}>
            <h2 className={styles.sidebarTitle}>Timeline</h2>
            <EventTimeline event={event} />
            {(!userRole || userRole === 'PARTICIPANT') && (
              <div style={{ marginTop: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                <h3 className={styles.sidebarTitle} style={{ fontSize: '14px', marginBottom: '8px' }}>Your Status</h3>
                <ParticipantTimelineState userSubmission={userSubmission} isRegistered={isRegistered} />
              </div>
            )}
          </div>

          <div className={[styles.sidebarCard, styles.linksCard].join(' ')}>
            <h2 className={styles.sidebarTitle}>Quick actions</h2>
            <div className={styles.quickLinks}>
              <Button as="a" href="/dashboard" variant="secondary" fullWidth size="md">
                My Dashboard
              </Button>
              {(!userRole && !isRegistered) && ['REGISTRATION', 'TEAM_FORMATION', 'SUBMISSION'].includes(event.lifecycle_status || '') && (
                <JoinEventButton eventId={event.id} />
              )}
              {isRegistered && (
                <>
                  <div style={{ padding: '8px', background: 'var(--color-surface)', borderRadius: '4px', textAlign: 'center', marginBottom: '8px', border: '1px solid var(--color-success)' }}>
                    <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>✓ Registered</span>
                  </div>
                  
                  {(!userTeam) ? (
                    <Button as="a" href={`/teams/new?eventId=${event.id}`} variant="primary" fullWidth size="md">
                      Create Team
                    </Button>
                  ) : (
                    <Button as="a" href={`/teams/${userTeam.id}`} variant="secondary" fullWidth size="md">
                      My Team
                    </Button>
                  )}

                  {!userSubmission && userTeam && (
                    <div style={{ marginTop: 'var(--space-2)' }}>
                      <Button as="a" href={`/submissions/new?eventId=${event.id}`} variant="primary" fullWidth size="md">
                        Submit a project
                      </Button>
                    </div>
                  )}
                  {userSubmission && userSubmission.status === 'DRAFT' && (
                    <div style={{ marginTop: 'var(--space-2)' }}>
                      <Button as="a" href={`/submissions/new?eventId=${event.id}`} variant="primary" fullWidth size="md">
                        {userSubmission.submitted_at ? 'Submit project' : 'Continue submission'}
                      </Button>
                    </div>
                  )}
                  {userSubmission && (
                    <>
                      {userSubmission.status === 'DRAFT' && (
                        <div style={{ marginTop: 'var(--space-2)' }}>
                          <Button as="a" href={`/submissions/${userSubmission.id}`} variant="secondary" fullWidth size="md">
                            View submission
                          </Button>
                        </div>
                      )}
                      {userSubmission.status === 'SUBMITTED' && (
                        <>
                          <div style={{ marginTop: 'var(--space-2)' }}>
                            <Button as="a" href={`/submissions/${userSubmission.id}`} variant="secondary" fullWidth size="md">
                              View submission
                            </Button>
                          </div>
                          <div style={{ marginTop: 'var(--space-2)' }}>
                            <Button as="a" href={`/submissions/new?eventId=${event.id}`} variant="primary" fullWidth size="md">
                              Edit submission
                            </Button>
                          </div>
                          <div style={{ marginTop: 'var(--space-2)' }}>
                            <form method="POST" action={`/api/submissions/${userSubmission.id}/withdraw-form`}>
                              <input type="hidden" name="eventId" value={event.id} />
                              <Button type="submit" variant="secondary" fullWidth size="md" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>
                                Withdraw submission
                              </Button>
                            </form>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
              {(userRole === 'ORGANIZER') && (
                <Button as="a" href={`/organizer/events/${event.id}`} variant="primary" fullWidth size="md">
                  Manage Event
                </Button>
              )}
            </div>
          </div>
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
