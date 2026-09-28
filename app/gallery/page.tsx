import { Suspense } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import Link from 'next/link';
import type { Metadata } from 'next';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Skeleton from '@/components/ui/Skeleton';
import styles from './gallery.module.css';

export const metadata: Metadata = { title: 'Project Gallery — Dogfood 2026' };

const MOCK_PROJECTS = [
  {
    id: '1',
    title: 'EcoLink',
    team: 'Green Engineers',
    desc: 'Smart city optimizer that reduces energy consumption by 30%.',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    tags: ['React', 'Python', 'AWS'],
    members: ['Alice', 'Bob', 'Charlie'],
    github: '#',
    demo: '#',
    likes: 342,
    award: '🏆 Sustainability Award',
    featured: true,
  },
  {
    id: '2',
    title: 'Alpha Project',
    team: 'Team Alpha',
    desc: 'A revolutionary new way to build software using AI agents.',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
    tags: ['Next.js', 'TypeScript'],
    members: ['Dave', 'Eve'],
    github: '#',
    demo: '#',
    likes: 210,
    award: '🥇 Overall Winner',
    featured: true,
  },
  {
    id: '3',
    title: 'Neural Predictor',
    team: 'Data Miners',
    desc: 'Advanced ML model for predicting supply chain disruptions.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    tags: ['Python', 'TensorFlow'],
    members: ['Frank'],
    github: '#',
    demo: null,
    likes: 128,
    award: null,
    featured: false,
  },
  {
    id: '4',
    title: 'HealthSphere',
    team: 'MedTech Innovators',
    desc: 'AI patient diagnostics app that connects with wearable devices.',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
    tags: ['React Native', 'Node.js'],
    members: ['Grace', 'Heidi', 'Ivan'],
    github: '#',
    demo: '#',
    likes: 95,
    award: '🥈 Runner-up',
    featured: false,
  },
  {
    id: '5',
    title: 'ChainGuard',
    team: 'Crypto Sec',
    desc: 'Blockchain analytics tool to prevent fraudulent transactions.',
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80',
    tags: ['Solidity', 'Vue'],
    members: ['Judy', 'Mallory'],
    github: '#',
    demo: null,
    likes: 67,
    award: null,
    featured: false,
  },
  {
    id: '6',
    title: 'QuantumSim',
    team: 'Q-Bits',
    desc: 'Browser-based quantum computing simulator for education.',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
    tags: ['C++', 'WASM', 'React'],
    members: ['Nina'],
    github: '#',
    demo: '#',
    likes: 42,
    award: '💡 Most Innovative',
    featured: false,
  },
];

export default function GalleryPage() {
  return (
    <PageContainer size="full">
      <header className={styles.heroHeader}>
        {/* Eco Motifs */}
        <svg className={styles.ecoMotif1} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="rgba(167, 139, 250, 0.15)" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.1,-46.3C90.4,-33.5,96.1,-18,94.9,-3.1C93.7,11.9,85.6,26.4,75.4,39.1C65.2,51.8,53,62.8,39.4,71.6C25.8,80.4,10.8,87,-4.8,88.4C-20.4,89.8,-35.3,86,-47.9,77.3C-60.5,68.6,-70.7,55,-78.3,40.1C-85.9,25.2,-90.9,9,-89.9,-6.7C-88.9,-22.4,-81.9,-37.6,-71.4,-49.2C-60.9,-60.8,-46.9,-68.8,-32.8,-76C-18.7,-83.2,-4.5,-89.6,9.5,-86.3C23.5,-83,30.5,-83.6,44.7,-76.4Z" transform="translate(100 100)" />
        </svg>
        <svg className={styles.ecoMotif2} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="rgba(139, 92, 246, 0.15)" d="M51.5,-73.4C64.9,-63.9,72.6,-46.8,77.8,-29.4C83,-12,85.7,5.6,80.3,20.8C74.9,36,61.4,48.7,46.5,57.7C31.6,66.7,15.8,72,-0.2,72.3C-16.2,72.6,-32.4,67.9,-46.7,58.7C-61,49.5,-73.4,35.8,-79.6,19.6C-85.8,3.4,-85.8,-15.3,-78.6,-31.2C-71.4,-47,-67,-60,-55.8,-69.5C-44.6,-79,-26.6,-85,-8.4,-82.1C9.8,-79.2,29.6,-77.4,51.5,-73.4Z" transform="translate(100 100)" />
        </svg>

        <div className={styles.heroInner}>
          
        <h1 className={styles.pageTitle}>Project Gallery</h1>
        <p className={styles.pageSubtitle}>
          Explore award-winning projects built by participants across the globe.
        </p>

        <div className={styles.filterSection}>
          <div className={styles.searchBar}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input type="text" className={styles.searchInput} placeholder="Search projects by name, team, or tech..." />
          </div>

          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Outcome:</span>
              <button className={`${styles.pillBtn} ${styles.pillBtnActive}`}>All</button>
              <button className={styles.pillBtn}>🏆 Winners</button>
              <button className={styles.pillBtn}>🥈 Runner-ups</button>
              <button className={styles.pillBtn}>In Progress</button>
            </div>
            
            <div className={styles.sortGroup}>
              <span className={styles.filterLabel}>Sort by:</span>
              <select className={styles.sortSelect}>
                <option>Most Liked</option>
                <option>Most Viewed</option>
                <option>Latest</option>
              </select>
            </div>
          </div>
        </div>
      
        </div>
      </header>

      <div className={styles.mainContainer}>
      <main className={styles.main}>
        {/* Featured Section */}
        <section className={styles.featuredSection}>
          <h2 className={styles.sectionTitle}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            Featured Highlights
          </h2>
          <div className={styles.featuredGrid}>
            {MOCK_PROJECTS.filter(p => p.featured).map(p => (
              <ProjectCard key={p.id} project={p} isFeatured />
            ))}
          </div>
        </section>

        {/* All Projects */}
        <section className={styles.allProjectsSection}>
          <h2 className={styles.sectionTitle}>All Submissions</h2>
          <div className={styles.grid}>
            {MOCK_PROJECTS.filter(p => !p.featured).map(p => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </section>
      </main>
      </div>
    </PageContainer>
  );
}

function ProjectCard({ project, isFeatured = false }: { project: any, isFeatured?: boolean }) {
  return (
    <Card hover className={`${styles.card} ${isFeatured ? styles.featuredCard : ''}`}>
      <div className={styles.cardImageWrap}>
        <img src={project.image} alt={project.title} className={styles.cardImage} />
        {project.award && (
          <div className={styles.awardBadge}>
            {project.award}
          </div>
        )}
        <button className={styles.likeBtn} aria-label="Like project">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          <span className={styles.likeCount}>{project.likes}</span>
        </button>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.cardTitle}>{project.title}</h3>
            <p className={styles.cardTeam}>By {project.team}</p>
          </div>
          <div className={styles.avatarGroup}>
            {project.members.map((m: string, i: number) => (
              <div key={i} className={styles.avatarWrapper} style={{ zIndex: 10 - i }}>
                <Avatar name={m} size="sm" />
              </div>
            ))}
          </div>
        </div>

        <p className={styles.cardDesc}>{project.desc}</p>

        <div className={styles.techStack}>
          {project.tags.map((tag: string) => (
            <span key={tag} className={styles.techBadge}>
              <span className={styles.techDot} />
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.actionLinks}>
          <a href={project.github} className={styles.iconLink}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
            Code
          </a>
          {project.demo && (
            <a href={project.demo} className={`${styles.iconLink} ${styles.demoLink}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Live Demo
            </a>
          )}
        </div>
        <Link href={`/gallery/${project.id}`} className={styles.viewBtn}>
          Details →
        </Link>
      </div>
    </Card>
  );
}
