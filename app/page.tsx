import Link from 'next/link';
import Button from '@/components/ui/Button';
import styles from './home.module.css';

export const metadata = {
  title: 'HackForge 2026',
  description: 'Hack. Code. Disrupt.',
};

export default function HomePage() {
  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        {/* We can add a simple SVG circuit background here in the future if needed, but keeping it clean for now */}
        <div className={styles.heroBackground} aria-hidden="true" />
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <h1 className={styles.title}>
              Build your own <br />
              dolor sit amet, <br />
              <span className={styles.titleHighlight}>& now together.</span>
            </h1>
            <p className={styles.description}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod incididunt ut labore et dolore magna aliqua.
            </p>
            <div className={styles.actions}>
              <Button as="a" href="/events" className={styles.btnPrimary} size="lg">
                Learn more
              </Button>
              <Button as="a" href="/gallery" className={styles.btnSecondary} size="lg">
                Learn more
              </Button>
            </div>
          </div>
          
          <div className={styles.heroGraphic}>
            <img src="/hero-graphic.png" alt="3D Isometric Network" className={styles.heroImage} />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.stats}>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <div className={styles.statValue}>48 Hours</div>
            <div className={styles.statLabel}>Continuous Coding</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>$50k+</div>
            <div className={styles.statLabel}>Cash & Prizes</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>1200+</div>
            <div className={styles.statLabel}>Innovators Participating</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>12</div>
            <div className={styles.statLabel}>Tracks & Challenges<br/>(AI, Web3, etc)</div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className={styles.howItWorks}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>How It Works</h2>
        </div>
        <div className={styles.stepsGrid}>
          <div className={styles.stepItem}>
            <div className={styles.stepHeader}>
              1.
              <div className={styles.stepIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <line x1="19" y1="8" x2="19" y2="14"></line>
                  <line x1="22" y1="11" x2="16" y2="11"></line>
                </svg>
              </div>
            </div>
            <h3 className={styles.stepTitle}>Register & Form a Team</h3>
            <p className={styles.stepDesc}>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do dolore magna aliqua.</p>
          </div>
          <div className={styles.stepItem}>
            <div className={styles.stepHeader}>
              2.
              <div className={styles.stepIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18h6"></path>
                  <path d="M10 22h4"></path>
                  <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 12 3a4.65 4.65 0 0 0-4.5 4.5c0 1.25.5 2.4 1.41 3.25.76.76 1.23 1.52 1.41 2.5"></path>
                </svg>
              </div>
            </div>
            <h3 className={styles.stepTitle}>Choose Your Track & Ideate</h3>
            <p className={styles.stepDesc}>Create across resources, collaborate with peers, a project.</p>
          </div>
          <div className={styles.stepItem}>
            <div className={styles.stepHeader}>
              3.
              <div className={styles.stepIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6"></polyline>
                  <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
              </div>
            </div>
            <h3 className={styles.stepTitle}>Build & Innovate</h3>
            <p className={styles.stepDesc}>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed find collaborators.</p>
          </div>
          <div className={styles.stepItem}>
            <div className={styles.stepHeader}>
              4.
              <div className={styles.stepIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                  <path d="M4 22h16"></path>
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                </svg>
              </div>
            </div>
            <h3 className={styles.stepTitle}>Submit & Win</h3>
            <p className={styles.stepDesc}>Lorem ipsum & footprint & resources, est innovative development projects.</p>
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className={styles.successStories}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Past Success Stories</h2>
        </div>
        <div className={styles.storiesGrid}>
          
          <div className={styles.storyCard}>
            <div className={styles.storyImageWrap}>
              <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80" alt="EcoLink UI" className={styles.storyImage} />
            </div>
            <div className={styles.storyContent}>
              <h3 className={styles.storyTitle}>Winner: EcoLink<br/>(Environmental Track)</h3>
              <p className={styles.storyDesc}>Smart city optimizer (HackForge 2025)</p>
              <Link href="/gallery/ecolink" className={styles.storyLink}>
                View in gallery ↗
              </Link>
            </div>
          </div>

          <div className={styles.storyCard}>
            <div className={styles.storyImageWrap}>
              <img src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=600&q=80" alt="HealthSphere UI" className={styles.storyImage} />
            </div>
            <div className={styles.storyContent}>
              <h3 className={styles.storyTitle}>Winner: HealthSphere<br/>(Telehealth Track)</h3>
              <p className={styles.storyDesc}>AI patient diagnostics app (HackForge 2025)</p>
              <Link href="/gallery/healthsphere" className={styles.storyLink}>
                View in gallery ↗
              </Link>
            </div>
          </div>

          <div className={styles.storyCard}>
            <div className={styles.storyImageWrap}>
              <img src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80" alt="ChainGuard UI" className={styles.storyImage} />
            </div>
            <div className={styles.storyContent}>
              <h3 className={styles.storyTitle}>Winner: ChainGuard<br/>(Blockchain Security Track)</h3>
              <p className={styles.storyDesc}>Decentralized panel (HackForge 2025)</p>
              <Link href="/gallery/chainguard" className={styles.storyLink}>
                View in gallery ↗
              </Link>
            </div>
          </div>

          <div className={styles.storyCard}>
            <div className={styles.storyImageWrap}>
              <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80" alt="QuantumSim UI" className={styles.storyImage} />
            </div>
            <div className={styles.storyContent}>
              <h3 className={styles.storyTitle}>Winner: QuantumSim<br/>(Quantum Track)</h3>
              <p className={styles.storyDesc}>Quantum data visualizer (HackForge 2025)</p>
              <Link href="/gallery/quantumsim" className={styles.storyLink}>
                View in gallery ↗
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <h2 className={styles.sectionTitle}>Are You Ready to Code?</h2>
        <p className={styles.sectionSubtitle} style={{ marginBottom: 'var(--space-8)' }}>
          Access resources, collaborate with peers, and get to development.
        </p>
        <Button as="a" href="/register" className={styles.btnPrimary} size="lg">
          Register Now
        </Button>
      </section>

      {/* Sponsors Section (Moved to above footer) */}
      <section className={styles.sponsors}>
        <div className={styles.sectionHeader} style={{ marginBottom: 'var(--space-8)' }}>
          <h2 className={styles.sectionTitle}>Our Valued Sponsors</h2>
        </div>
        <div className={styles.sponsorsGrid}>
          <div className={styles.sponsorLogo}>
            <svg width="120" height="28" viewBox="0 0 120 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="12" height="12" fill="#F25022"/>
              <rect x="14" width="12" height="12" fill="#7FBA00"/>
              <rect y="14" width="12" height="12" fill="#00A4EF"/>
              <rect x="14" y="14" width="12" height="12" fill="#FFB900"/>
              <text x="34" y="20" fill="currentColor" fontSize="18" fontWeight="600" fontFamily="sans-serif">Microsoft</text>
            </svg>
          </div>
          <div className={styles.sponsorLogo}>
            <svg width="150" height="28" viewBox="0 0 150 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.7 13.5H4.2C1.9 13.5 0 11.6 0 9.3C0 7 1.9 5.1 4.2 5.1H5.4C6.5 2.1 9.4 0 12.8 0C17.1 0 20.6 3.5 20.6 7.8V13.5H13.7Z" fill="#4285F4"/>
              <text x="28" y="20" fill="currentColor" fontSize="18" fontWeight="600" fontFamily="sans-serif">Google Cloud</text>
            </svg>
          </div>
          <div className={styles.sponsorLogo}>
            <svg width="60" height="28" viewBox="0 0 60 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <text x="0" y="20" fill="currentColor" fontSize="22" fontWeight="700" fontFamily="sans-serif">aws</text>
              <path d="M0 24 Q 15 32 30 24" stroke="#FF9900" strokeWidth="3" fill="none" strokeLinecap="round" />
            </svg>
          </div>
          <div className={styles.sponsorLogo}>
            <svg width="110" height="28" viewBox="0 0 110 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M14 0C6.27 0 0 6.27 0 14C0 20.18 4.01 25.43 9.57 27.27C10.27 27.4 10.53 26.97 10.53 26.6C10.53 26.27 10.52 25.4 10.52 24.23C6.63 25.07 5.81 22.35 5.81 22.35C5.17 20.73 4.26 20.3 4.26 20.3C2.99 19.43 4.36 19.45 4.36 19.45C5.76 19.55 6.5 20.9 6.5 20.9C7.75 23.03 9.77 22.42 10.58 22.06C10.7 21.14 11.07 20.53 11.49 20.18C8.38 19.83 5.12 18.63 5.12 13.27C5.12 11.74 5.67 10.5 6.56 9.53C6.42 9.17 5.94 7.74 6.7 5.78C6.7 5.78 7.87 5.4 10.51 7.2C11.62 6.89 12.82 6.73 14 6.72C15.18 6.73 16.38 6.89 17.49 7.2C20.12 5.4 21.29 5.78 21.29 5.78C22.06 7.74 21.59 9.17 21.45 9.53C22.34 10.5 22.88 11.74 22.88 13.27C22.88 18.65 19.6 19.82 16.48 20.16C17 20.61 17.47 21.5 17.47 22.89C17.47 24.89 17.45 26.5 17.45 26.6C17.45 26.98 17.7 27.42 18.44 27.27C23.99 25.42 28 20.18 28 14C28 6.27 21.73 0 14 0Z" fill="currentColor"/>
              <text x="36" y="20" fill="currentColor" fontSize="20" fontWeight="600" fontFamily="sans-serif">GitHub</text>
            </svg>
          </div>
          <div className={styles.sponsorLogo}>
            <svg width="120" height="28" viewBox="0 0 120 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 14 L7 0 L14 14 Z" fill="#632CA6"/>
              <path d="M14 14 L21 0 L28 14 Z" fill="#632CA6"/>
              <text x="36" y="20" fill="currentColor" fontSize="20" fontWeight="700" fontFamily="sans-serif">Datadog</text>
            </svg>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerCol}>
            <h4>Event Info</h4>
            <Link href="/dates">Dates</Link>
            <Link href="/schedule">Schedule</Link>
            <Link href="/rules">Rules</Link>
          </div>
          <div className={styles.footerCol}>
            <h4>Community</h4>
            <Link href="/discord">Discord</Link>
            <Link href="/mentors">Mentors</Link>
            <Link href="/forums">Forums</Link>
          </div>
          <div className={styles.footerCol}>
            <h4>Resources</h4>
            <Link href="/tools">Tools</Link>
            <Link href="/docs">Docs</Link>
            <Link href="/workshops">Workshops</Link>
          </div>
          <div className={styles.footerCol}>
            <h4>Legal</h4>
            <Link href="/tos">TOS</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/conduct">Conduct</Link>
          </div>
          <div className={styles.footerCol} style={{ alignItems: 'flex-end' }}>
            <div className={styles.footerSocial}>
              {/* Twitter */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
              {/* LinkedIn */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              {/* GitHub */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span>HACKFORGE 2026</span>
          <span>© HackForge 2026</span>
        </div>
      </footer>
    </div>
  );
}
