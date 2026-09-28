import Link from 'next/link';
import PageContainer from '@/components/layout/PageContainer';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { getSubmissionById } from '@/lib/api/submissions';
import styles from './detail.module.css';

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  // We'll mock the data for now if it doesn't exist in the DB, 
  // since this is a UI overhaul
  const id = params.id;
  
  return (
    <PageContainer size="md">
      <Link href="/gallery" className={styles.backLink}>
        ← Back to Gallery
      </Link>

      <div className={styles.coverImage}>
        <img src={['https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80'][(parseInt(id) - 1) % 3]} alt="Project Cover" />
      </div>

      <div className={styles.header}>
        <h1 className={styles.title}>Project {id === '1' ? 'Alpha' : 'Beta Analytics'}</h1>
        <p className={styles.team}>Team Builders • 4 members</p>
        <p className={styles.shortDesc}>
          A revolutionary way to manage hackathon timelines using AI and real-time collaboration.
        </p>
      </div>

      <div className={styles.actions}>
        <Button as="a" href="#" variant="secondary" className={styles.actionBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
          View GitHub
        </Button>
        <Button as="a" href="#" variant="primary" className={styles.actionBtn}>
          Live Demo
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
        </Button>
      </div>

      <hr className={styles.divider} />

      <div className={styles.content}>
        <section className={styles.section}>
          <h2>About the project</h2>
          <p>
            This project aims to solve the core issues developers face when collaborating remotely 
            during intensive 48-hour sprints. By integrating AI-driven insights directly into the 
            development workflow, teams can identify bottlenecks before they happen.
          </p>
          <p>
            We built this using a modern stack designed for speed and reliability, allowing us 
            to ship features significantly faster than traditional monolithic architectures.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Tech Stack</h2>
          <div className={styles.tags}>
            <Badge variant="default">React</Badge>
            <Badge variant="default">Node.js</Badge>
            <Badge variant="default">PostgreSQL</Badge>
            <Badge variant="default">TypeScript</Badge>
            <Badge variant="default">TailwindCSS</Badge>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Team</h2>
          <div className={styles.teamList}>
            {[1, 2, 3, 4].map(member => (
              <div key={member} className={styles.member}>
                <div className={styles.avatar}>U{member}</div>
                <span>Team Member {member}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
