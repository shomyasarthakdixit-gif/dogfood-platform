import { Suspense } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import Link from 'next/link';
import type { Metadata } from 'next';
import styles from './dashboard.module.css';

export const metadata: Metadata = { title: 'Dashboard — Dogfood 2026' };

export default function DashboardPage() {
  return (
    <PageContainer size="full">
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.bgCircle1} />
        <div className={styles.bgCircle2} />
        
        <div className={styles.heroContent}>
          <div className={styles.pillBadge}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            DASHBOARD GUIDE
          </div>
          
          <h1 className={styles.heroTitle}>
            Dashboard <span className={styles.heroTitleHighlight}>Command Center</span>
          </h1>
          
          <p className={styles.heroSubtitle}>
            Proper team coordination is the first step toward a winning project. Discover 
            upcoming events, manage your submissions — and build the future.
          </p>
          
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            <p>Authentication coming soon (Demo environment).</p>
          </div>
          
          <div className={styles.heroActions}>
            <Link href="/login" className={styles.primaryBtn}>
              Explore Events ↓
            </Link>
            <Link href="/login" className={styles.secondaryBtn}>
              Submit Project →
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <div className={styles.statNumber}>12</div>
          <div className={styles.statLabel}>Registered Events</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statNumber}>60%</div>
          <div className={styles.statLabel}>Submission Completion</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statNumber}>21</div>
          <div className={styles.statLabel}>Active Team Members</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statNumber}>Daily</div>
          <div className={styles.statLabel}>Mentor Standups</div>
        </div>
      </div>

      {/* Projects Grid Section */}
      <section className={styles.projectsSection}>
        <h2 className={styles.sectionTitle}>
          🗂 Know Your Active Projects
        </h2>
        <p className={styles.sectionSubtitle}>
          Each project, each track — handled seamlessly to push boundaries.
        </p>
        
        <div className={styles.projectsGrid}>
          <div className={styles.projectCard}>
            <img src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80" alt="Web Dev Project" className={styles.projectImage} />
            <div className={styles.projectTag}>
              <span style={{width: 8, height: 8, borderRadius: '50%', background: '#a78bfa'}} />
              WEB TRACK
            </div>
            <div className={styles.projectOverlay}>
              <h3 className={styles.projectTitle}>Alpha Application</h3>
              <div className={styles.projectTeam}>Team Builders</div>
            </div>
          </div>

          <div className={styles.projectCard}>
            <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80" alt="Data Project" className={styles.projectImage} />
            <div className={styles.projectTag}>
              <span style={{width: 8, height: 8, borderRadius: '50%', background: '#f59e0b'}} />
              AI TRACK
            </div>
            <div className={styles.projectOverlay}>
              <h3 className={styles.projectTitle}>Neural Predictor</h3>
              <div className={styles.projectTeam}>Data Miners</div>
            </div>
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
