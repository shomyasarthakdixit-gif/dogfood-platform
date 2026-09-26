'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Nav.module.css';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/events', label: 'Events' },
  { href: '/gallery', label: 'Gallery' },
];

export default function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header>
      <nav className={styles.nav} aria-label="Main navigation">
        <div className={styles.inner}>
          <Link href="/" className={styles.brand}>
            Dogfood<span>.</span>dev
          </Link>

          <div className={styles.links} role="list">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                role="listitem"
                className={[
                  styles.link,
                  pathname.startsWith(link.href) ? styles.linkActive : '',
                ].filter(Boolean).join(' ')}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className={styles.actions}>
            <Link href="/submissions/new" className={[styles.link].join(' ')} style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
              Submit project
            </Link>
          </div>

          <button
            className={styles.menuBtn}
            onClick={() => setMobileOpen(o => !o)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18"/>
              </svg>
            )}
          </button>
        </div>
      </nav>
      {mobileOpen && (
        <div className={styles.mobileMenu} role="navigation" aria-label="Mobile navigation">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={styles.mobileLink}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/submissions/new"
            className={styles.mobileLink}
            style={{ color: 'var(--color-accent)', fontWeight: 600 }}
            onClick={() => setMobileOpen(false)}
          >
            Submit project
          </Link>
        </div>
      )}
    </header>
  );
}
