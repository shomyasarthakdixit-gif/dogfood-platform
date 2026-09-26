import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { getSubmissionById } from '@/lib/api/submissions';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import SubmissionStatusBadge from '@/components/participant/SubmissionStatusBadge';
import Skeleton from '@/components/ui/Skeleton';
import type { Metadata } from 'next';
import styles from './submission-detail.module.css';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}): Promise<Metadata> {
  const { submissionId } = await params;
  const sub = await getSubmissionById(submissionId);
  return { title: sub ? `${sub.title} — Dogfood 2026` : 'Submission' };
}

async function SubmissionContent({ submissionId }: { submissionId: string }) {
  const submission = await getSubmissionById(submissionId);
  if (!submission) notFound();

  const submitted = new Date(submission.created_at);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <article>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.headerMeta}>
            <SubmissionStatusBadge status={submission.status} />
            {submission.team && (
              <span className={styles.teamLabel}>
                Built by{' '}
                <strong>{submission.team.name}</strong>
              </span>
            )}
          </div>
          <h1 className={styles.title}>{submission.title}</h1>
          <p className={styles.submittedDate}>
            {submission.status === 'SUBMITTED'
              ? `Submitted on ${fmt(submitted)}`
              : `Last updated ${fmt(submitted)}`}
          </p>
        </div>

        <div className={styles.headerActions}>
          {submission.status === 'DRAFT' && (
            <Button as="a" href={`/submissions/${submission.id}/edit`} variant="primary" size="sm">
              Continue editing
            </Button>
          )}
          <Button as="a" href="/gallery" variant="secondary" size="sm">
            View gallery
          </Button>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.mainColumn}>
          {/* About */}
          {submission.description && (
            <Card shadow>
              <div className={styles.cardSection}>
                <h2 className={styles.sectionTitle}>About</h2>
                <p className={styles.descriptionText}>{submission.description}</p>
              </div>
            </Card>
          )}

          {/* Draft warning */}
          {submission.status === 'DRAFT' && (
            <div className={styles.draftWarning}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              This project is a draft and has not been officially submitted.
            </div>
          )}
        </div>

        <aside className={styles.sidebar}>
          {/* Links */}
          <Card shadow padding="md">
            <h2 className={styles.sidebarTitle}>Project links</h2>
            <div className={styles.linksList}>
              {submission.url || submission.repo_url ? (
                <a
                  href={submission.url ?? submission.repo_url ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.linkItem}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                  </svg>
                  View repository
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              ) : (
                <p className={styles.noLinks}>No links provided.</p>
              )}
            </div>
          </Card>

          {/* Team */}
          {submission.team && (
            <Card padding="md" className={styles.teamCard}>
              <h2 className={styles.sidebarTitle}>Team</h2>
              <div className={styles.teamName}>{submission.team.name}</div>
              {submission.team.description && (
                <p className={styles.teamDesc}>{submission.team.description}</p>
              )}
            </Card>
          )}

          {/* Status info */}
          <Card padding="md" className={styles.statusCard}>
            <h2 className={styles.sidebarTitle}>Status</h2>
            <SubmissionStatusBadge status={submission.status} />
          </Card>
        </aside>
      </div>
    </article>
  );
}

export default async function SubmissionDetailPage({
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
            <Skeleton variant="heading" width="60%" />
            <Skeleton variant="text" width="30%" />
            <div style={{ height: 200, background: 'var(--color-surface-inset)', borderRadius: 10 }} />
          </div>
        }
      >
        <SubmissionContent submissionId={submissionId} />
      </Suspense>
    </PageContainer>
  );
}
