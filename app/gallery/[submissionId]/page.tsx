import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { getSubmissionById } from '@/lib/api/submissions';
import { getTeamMembers } from '@/lib/api/teams';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Skeleton from '@/components/ui/Skeleton';
import type { Metadata } from 'next';
import styles from './gallery-detail.module.css';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}): Promise<Metadata> {
  const { submissionId } = await params;
  const sub = await getSubmissionById(submissionId);
  return {
    title: sub ? `${sub.title} — Gallery — Dogfood 2026` : 'Project',
    description: sub?.description ?? undefined,
  };
}

// Voting integration point — Teammate 3 will implement the voting backend.
// This section is intentionally left as a placeholder.
function VotingPlaceholder({ submissionId }: { submissionId: string }) {
  return (
    <div className={styles.votingSection} aria-labelledby="voting-heading">
      <h2 id="voting-heading" className={styles.sidebarTitle}>Community Votes</h2>
      <div className={styles.votingPlaceholder}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-text-subtle)"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
          <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
        </svg>
        <p className={styles.votingPlaceholderText}>
          Voting is coming soon.
        </p>
        {/* Integration point for Teammate 3 */}
        {/* data-submission-id kept for easy hook-up */}
        <div
          data-component="voting-widget"
          data-submission-id={submissionId}
          style={{ display: 'none' }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

async function GalleryDetailContent({ submissionId }: { submissionId: string }) {
  const submission = await getSubmissionById(submissionId);
  if (!submission || submission.status !== 'SUBMITTED') notFound();

  // Fetch team members for public display
  const members = await getTeamMembers(submission.team_id).catch(() => []);

  const submitted = new Date(submission.created_at);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <article>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
        <a href="/gallery" className={styles.breadcrumbLink}>Gallery</a>
        <span aria-hidden="true"> / </span>
        <span className={styles.breadcrumbCurrent}>{submission.title}</span>
      </nav>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{submission.title}</h1>
          <p className={styles.subtitle}>
            Built by <strong>{submission.team?.name ?? 'Unknown team'}</strong>
            {' '}&middot;{' '}
            <time dateTime={submission.created_at}>{fmt(submitted)}</time>
          </p>
        </div>

        <div className={styles.headerActions}>
          {(submission.url ?? submission.repo_url) && (
            <Button
              as="a"
              href={(submission.url ?? submission.repo_url)!}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              size="sm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
              </svg>
              View repository
            </Button>
          )}
          <Button as="a" href="/gallery" variant="ghost" size="sm">
            ← Back to gallery
          </Button>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.mainColumn}>
          {/* Description */}
          {submission.description && (
            <Card shadow>
              <div className={styles.cardSection}>
                <h2 className={styles.sectionTitle}>About</h2>
                <p className={styles.descriptionText}>{submission.description}</p>
              </div>
            </Card>
          )}

          {/* Team members — only names, no emails for public view */}
          {members.length > 0 && (
            <Card shadow>
              <div className={styles.cardSection}>
                <h2 className={styles.sectionTitle}>Team Members</h2>
                <div className={styles.memberList}>
                  {members.map(m => (
                    <div key={m.id} className={styles.memberItem}>
                      <Avatar name={m.user?.name ?? 'Unknown'} size="sm" />
                      <div>
                        <span className={styles.memberName}>
                          {m.user?.name ?? 'Unknown'}
                        </span>
                        {m.role === 'LEADER' && (
                          <Badge variant="info" className={styles.roleBadge}>
                            Leader
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>

        <aside className={styles.sidebar}>
          {/* Voting integration point */}
          <Card shadow padding="md">
            <VotingPlaceholder submissionId={submissionId} />
          </Card>

          {/* Team info */}
          {submission.team && (
            <Card padding="md" className={styles.teamCard}>
              <h2 className={styles.sidebarTitle}>Team</h2>
              <div className={styles.teamName}>{submission.team.name}</div>
              {submission.team.description && (
                <p className={styles.teamDesc}>{submission.team.description}</p>
              )}
            </Card>
          )}

          {/* Submission date */}
          <Card padding="md" className={styles.metaCard}>
            <h2 className={styles.sidebarTitle}>Submitted</h2>
            <time className={styles.metaDate} dateTime={submission.created_at}>
              {fmt(submitted)}
            </time>
          </Card>
        </aside>
      </div>
    </article>
  );
}

export default async function GalleryDetailPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  return (
    <PageContainer>
      <Suspense
        fallback={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Skeleton variant="text" width="200px" />
            <Skeleton variant="heading" width="60%" />
            <Skeleton variant="text" width="30%" />
            <div style={{ height: 200, background: 'var(--color-surface-inset)', borderRadius: 10 }} />
          </div>
        }
      >
        <GalleryDetailContent submissionId={submissionId} />
      </Suspense>
    </PageContainer>
  );
}
