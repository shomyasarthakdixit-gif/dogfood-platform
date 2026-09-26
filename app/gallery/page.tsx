import { Suspense } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { getSubmissionsByEvent } from '@/lib/api/submissions';
import { getEvents } from '@/lib/api/events';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import type { Submission } from '@/lib/types';
import type { Metadata } from 'next';
import styles from './gallery.module.css';
import GalleryClient from './GalleryClient';

export const metadata: Metadata = {
  title: 'Project Gallery — Dogfood 2026',
  description: 'Explore projects built by participants of Dogfood 2026.',
};

async function fetchGalleryProjects(): Promise<Submission[]> {
  const events = await getEvents();
  const allSubs = await Promise.all(events.map(e => getSubmissionsByEvent(e.id)));
  return allSubs.flat().filter(s => s.status === 'SUBMITTED');
}

function ProjectCardSkeleton() {
  return (
    <div className={styles.skeletonCard}>
      <Skeleton variant="heading" width="70%" />
      <Skeleton variant="text" width="40%" />
      <Skeleton variant="text" />
      <Skeleton variant="text" width="80%" />
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
        <Skeleton width="60px" height="22px" />
        <Skeleton width="80px" height="22px" />
      </div>
    </div>
  );
}

async function GalleryData() {
  const projects = await fetchGalleryProjects();

  if (projects.length === 0) {
    return (
      <EmptyState
        title="No projects yet"
        description="Projects will appear here once participants submit their work."
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        }
      />
    );
  }

  return <GalleryClient projects={projects} />;
}

export default function GalleryPage() {
  return (
    <PageContainer>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Project Gallery</h1>
          <p className={styles.subtitle}>
            Explore projects built by participants of Dogfood 2026.
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div>
            <div className={styles.filterBarSkeleton}>
              <Skeleton width="240px" height="36px" />
              <Skeleton width="120px" height="36px" />
            </div>
            <div className={styles.grid}>
              {[1, 2, 3, 4, 5, 6].map(i => <ProjectCardSkeleton key={i} />)}
            </div>
          </div>
        }
      >
        <GalleryData />
      </Suspense>
    </PageContainer>
  );
}
