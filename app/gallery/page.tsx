import { Suspense } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { getSubmissionsByEvent, getSubmissionById } from '@/lib/api/submissions';
import { getEvents } from '@/lib/api/events';
import type { Submission, Event } from '@/lib/types';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import type { Metadata } from 'next';
import styles from './gallery.module.css';

export const metadata: Metadata = { title: 'Project Gallery — Dogfood 2026' };

export default function GalleryPage() {
  return (
    <PageContainer>
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>Project Gallery</h1>
        <p className={styles.subtitle}>Explore projects built by participants.</p>
      </header>

      <div className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="text" className={styles.searchInput} placeholder="Search projects..." />
        </div>
        <div className={styles.filterDropdowns}>
          <select className={styles.select}>
            <option>All Tracks</option>
            <option>AI</option>
            <option>Web</option>
            <option>Cloud</option>
            <option>Open Source</option>
            <option>Hardware</option>
          </select>
          <select className={styles.select}>
            <option>Technologies</option>
            <option>React</option>
            <option>Node.js</option>
            <option>Python</option>
            <option>PostgreSQL</option>
          </select>
          <select className={styles.select}>
            <option>Latest</option>
            <option>Most popular</option>
            <option>Random</option>
          </select>
        </div>
      </div>

      <Suspense fallback={<GalleryLoading />}>
        <GalleryList />
      </Suspense>
    </PageContainer>
  );
}

async function GalleryList() {
  const events = await getEvents();
  const eventId = events.length > 0 ? events[0].id : null;
  const submissions = eventId ? await getSubmissionsByEvent(eventId) : [];

  const displaySubs = submissions.length > 0 ? submissions : [
    { id: '1', title: 'Alpha Project', team: { name: 'Team Alpha' }, description: 'A revolutionary way to manage hackathon timelines using AI and real-time collaboration.', repo_url: '#' },
    { id: '2', title: 'Beta Analytics', team: { name: 'Data Miners' }, description: 'Open-source analytics dashboard for tracking hackathon participation and metrics.', repo_url: '#' },
    { id: '3', title: 'CloudPups', team: { name: 'Serverless Squad' }, description: 'Serverless pet monitoring solution using Edge computing and IoT.', repo_url: '#' },
    { id: '4', title: 'ChainLinks', team: { name: 'Web3 Builders' }, description: 'Blockchain verified credentials for hackathon winners.', repo_url: '#' },
  ] as any[];

  return (
    <div className={styles.grid}>
      {displaySubs.map((sub, i) => (
        <Card key={sub.id} hover padding="sm" className={styles.card}>
          <div className={styles.cardImage}>
            <img src={['https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80'][i % 4]} alt={sub.title} />
          </div>
          <div className={styles.cardContent}>
            <h3 className={styles.cardTitle}>{sub.title}</h3>
            <div className={styles.cardTeam}>
              {sub.team?.name || 'Anonymous Team'}
              <span className={styles.teamMembers}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                {Math.floor(Math.random() * 3) + 2} members
              </span>
            </div>
            
            <p className={styles.cardDesc}>
              {sub.description || 'No description provided for this project yet.'}
            </p>

            <div className={styles.tags}>
              <span className={styles.tag}>React</span>
              <span className={styles.tag}>Node.js</span>
            </div>

            <div className={styles.cardFooter}>
              <a href={sub.repo_url || '#'} className={styles.githubLink}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
                GitHub
              </a>
              <a href={`/gallery/${sub.id}`} className={styles.viewLink}>
                View →
              </a>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function GalleryLoading() {
  return (
    <div className={styles.grid}>
      {[...Array(6)].map((_, i) => (
        <Card key={i} padding="sm" className={styles.card}>
          <Skeleton width="100%" height="160px" />
          <div className={styles.cardContent}>
            <Skeleton width="60%" height="24px" className={styles.skeletonTitle} />
            <Skeleton width="40%" height="16px" className={styles.skeletonMeta} />
            <Skeleton width="100%" height="60px" />
          </div>
        </Card>
      ))}
    </div>
  );
}
