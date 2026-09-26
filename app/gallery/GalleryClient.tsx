'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Submission } from '@/lib/types';
import styles from './gallery.module.css';

interface GalleryClientProps {
  projects: Submission[];
}

function ProjectCard({ project }: { project: Submission }) {
  const teamName = project.team?.name ?? 'Unknown team';
  return (
    <article className={styles.card}>
      <div className={styles.cardBody}>
        <div className={styles.cardHeader}>
          <h2 className={styles.projectTitle}>
            <Link href={`/gallery/${project.id}`} className={styles.projectTitleLink}>
              {project.title}
            </Link>
          </h2>
          <span className={styles.teamName}>{teamName}</span>
        </div>

        {project.description && (
          <p className={styles.projectDescription}>
            {project.description.length > 160
              ? project.description.slice(0, 160) + '…'
              : project.description}
          </p>
        )}
      </div>

      <div className={styles.cardFooter}>
        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.repoLink}
            onClick={e => e.stopPropagation()}
            aria-label={`View repository for ${project.title}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
            </svg>
            Repository
          </a>
        )}

        <Link href={`/gallery/${project.id}`} className={styles.viewLink}>
          View project →
        </Link>
      </div>
    </article>
  );
}

export default function GalleryClient({ projects }: GalleryClientProps) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'latest' | 'alpha'>('latest');

  const filtered = useMemo(() => {
    let result = [...projects];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        p =>
          p.title.toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q) ||
          (p.team?.name ?? '').toLowerCase().includes(q)
      );
    }
    if (sort === 'alpha') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      result.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    return result;
  }, [projects, search, sort]);

  return (
    <div>
      {/* Filter bar */}
      <div className={styles.filterBar} role="search">
        <div className={styles.searchWrapper}>
          <svg
            className={styles.searchIcon}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search projects…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search projects"
          />
        </div>

        <select
          className={styles.sortSelect}
          value={sort}
          onChange={e => setSort(e.target.value as 'latest' | 'alpha')}
          aria-label="Sort projects"
        >
          <option value="latest">Latest</option>
          <option value="alpha">A–Z</option>
        </select>
      </div>

      {/* Results count */}
      <p className={styles.resultCount} aria-live="polite">
        {filtered.length === projects.length
          ? `${projects.length} project${projects.length !== 1 ? 's' : ''}`
          : `${filtered.length} of ${projects.length} projects`}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className={styles.noResults}>
          <p>No projects match &ldquo;{search}&rdquo;.</p>
          <button
            className={styles.clearSearch}
            onClick={() => setSearch('')}
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
