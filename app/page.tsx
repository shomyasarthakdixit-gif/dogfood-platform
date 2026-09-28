import Link from 'next/link';
import Button from '@/components/ui/Button';
import CountUp from '@/components/ui/CountUp';
import styles from './home.module.css';
import ParticleWave from '@/components/ui/ParticleWave';

export const metadata = {
  title: 'HackForge 2026',
  description: 'Hack. Code. Disrupt.',
};

export default function HomePage() {
  return (
    <div className={styles.page}>
<svg width="0" height="0" style={{ position: 'absolute' }}>
  <defs>
    <mask id="bento-mask" maskContentUnits="objectBoundingBox">
      <rect x="0.3416" y="0" width="0.6583" height="1" rx="0.06" ry="0.06" fill="white" />
      <rect x="0" y="0.3416" width="1" height="0.6583" rx="0.06" ry="0.06" fill="white" />
      <rect x="0.3166" y="0.3416" width="0.025" height="0.3166" fill="black" />
      <rect x="0.6583" y="0" width="0.025" height="1" fill="black" />
      <rect x="0.3416" y="0.3166" width="0.6583" height="0.025" fill="black" />
      <rect x="0" y="0.6583" width="1" height="0.025" fill="black" />
    </mask>
  </defs>
</svg>

      

{/* Hero Section */}
      <section className={styles.hero}>
        {/* Background Image Overlay */}
        <div className={styles.heroBgWrapper}>
          <img src="/hero-graphic.png" className={styles.heroBgImg} alt="" />
          <div className={styles.heroOverlay} />
          <ParticleWave />
        </div>

        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>Dogfood 2026</h1>
          <p className={styles.heroSubtitle}>The World's #1 Open-Source Hackathon Platform</p>
          
          <Button as="a" href="/login" variant="primary" size="lg" style={{ borderRadius: '999px', fontSize: '1.125rem', padding: '16px 40px', boxShadow: '0 10px 25px rgba(124, 58, 237, 0.3)' }}>
            Join Now
          </Button>
        </div>

        <div className={styles.floatingStatsWrapper}>
          <div className={styles.floatingStatsInner}>
            <div className={styles.statCardNew}>
              <div className={styles.statIconWrapper}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div className={styles.statTitleNew}>Active Builders</div>
              <div className={styles.statValueNew}>2,538</div>
              <div className={styles.statChartMock} />
            </div>

            <div className={styles.statCardNew}>
              <div className={styles.statIconWrapper}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              </div>
              <div className={styles.statTitleNew}>Projects Submitted</div>
              <div className={styles.statValueNew}>1,878</div>
              <div className={styles.statBarMock}>
                <div style={{height: '40%'}}/><div style={{height: '60%'}}/><div style={{height: '80%'}}/><div style={{height: '50%'}}/><div style={{height: '100%'}}/>
              </div>
            </div>

            <div className={styles.statCardNew}>
              <div className={styles.statIconWrapper}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div className={styles.statTitleNew}>Time Remaining</div>
              <div className={styles.statValueNew}>25.23h</div>
              <div className={styles.statChartMock} />
            </div>

            <div className={styles.statCardNew}>
              <div className={styles.statIconWrapper}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <div className={styles.statTitleNew}>Total Prize Pool</div>
              <div className={styles.statValueNew}>$75.83k</div>
              <div className={styles.statChartMock} />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className={styles.howItWorks} >
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>How Dogfood works</h2>
        </div>
        <div className={styles.stepsGrid}>
          <div className={styles.stepItem}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '12px', color: 'var(--color-text-muted)' }}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
            <div className={styles.stepHeader}>01 — Join</div>
            <p>Register for an event and find your team.</p>
          </div>
          <div className={styles.stepItem}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '12px', color: 'var(--color-accent)' }}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            <div className={styles.stepHeader}>02 — Build</div>
            <p>Turn an idea into a working project.</p>
          </div>
          <div className={styles.stepItem}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '12px', color: 'var(--color-accent)' }}><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
            <div className={styles.stepHeader}>03 — Submit</div>
            <p>Submit your project before the deadline.</p>
          </div>
          <div className={styles.stepItem}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '12px', color: 'var(--color-accent)' }}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            <div className={styles.stepHeader}>04 — Showcase</div>
            <p>Get discovered in the public project gallery.</p>
          </div>
        </div>
      </section>

      {/* Tracks Section */}
      <section className={styles.howItWorks} >
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Explore the tracks</h2>
        </div>
        <div className={styles.stepsGrid}>
          <div className={styles.stepItem} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px', color: 'var(--color-secondary)' }}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>AI & Agents</h3>
            <p>Build intelligent systems.</p>
          </div>
          <div className={styles.stepItem} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px', color: 'var(--color-secondary)' }}><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
            <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>Web & Platforms</h3>
            <p>Build products people can use.</p>
          </div>
          <div className={styles.stepItem} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px', color: 'var(--color-secondary)' }}><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>FinTech</h3>
            <p>Reimagine financial technology.</p>
          </div>
          <div className={styles.stepItem} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px', color: 'var(--color-secondary)' }}><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
            <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>Sustainability</h3>
            <p>Build for a better future.</p>
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section className={styles.howItWorks} >
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>See what builders are shipping</h2>
        </div>
        <div className={styles.storiesGrid} style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className={styles.storyCard}>
            <div className={styles.storyImageWrap} style={{ height: '160px', overflow: 'hidden' }}><img src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Project Thumbnail" /></div>
            <div className={styles.storyContent}>
              <h3 className={styles.storyTitle}>HealthSphere</h3>
              <p className={styles.storyDesc}>AI patient diagnostics app</p>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', background: 'var(--color-accent-light)', color: 'var(--color-accent)', padding: '2px 8px', borderRadius: '12px' }}>#AI</span>
                <span style={{ fontSize: '12px', background: 'var(--color-accent-light)', color: 'var(--color-accent)', padding: '2px 8px', borderRadius: '12px' }}>#React</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>Team Alpha</span>
                <Link href="/gallery/1" className={styles.storyLink}>View →</Link>
              </div>
            </div>
          </div>
          <div className={styles.storyCard}>
            <div className={styles.storyImageWrap} style={{ height: '160px', overflow: 'hidden' }}><img src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Project Thumbnail" /></div>
            <div className={styles.storyContent}>
              <h3 className={styles.storyTitle}>ChainGuard</h3>
              <p className={styles.storyDesc}>Decentralized security panel</p>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', background: 'var(--color-accent-light)', color: 'var(--color-accent)', padding: '2px 8px', borderRadius: '12px' }}>#Web3</span>
                <span style={{ fontSize: '12px', background: 'var(--color-accent-light)', color: 'var(--color-accent)', padding: '2px 8px', borderRadius: '12px' }}>#Rust</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>Blocksmiths</span>
                <Link href="/gallery/2" className={styles.storyLink}>View →</Link>
              </div>
            </div>
          </div>
          <div className={styles.storyCard}>
            <div className={styles.storyImageWrap} style={{ height: '160px', overflow: 'hidden' }}><img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Project Thumbnail" /></div>
            <div className={styles.storyContent}>
              <h3 className={styles.storyTitle}>EcoTrack</h3>
              <p className={styles.storyDesc}>Carbon footprint visualizer</p>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', background: 'var(--color-accent-light)', color: 'var(--color-accent)', padding: '2px 8px', borderRadius: '12px' }}>#GreenTech</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>EcoDevs</span>
                <Link href="/gallery/3" className={styles.storyLink}>View →</Link>
              </div>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 'var(--space-8)' }}>
          <Button as="a" href="/gallery" variant="secondary" size="lg">Explore all projects →</Button>
        </div>
      </section>

      {/* Event Timeline Section */}
      <section className={styles.howItWorks} >
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Dogfood 2026</h2>
        </div>
        <div className={styles.stepsGrid}>
          <div className={styles.stepItem} style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-success)', marginBottom: '8px' }}>● REGISTRATION</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>OPEN</div>
          </div>
          <div className={styles.stepItem} style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '8px' }}>BUILD TIME</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>48 HOURS</div>
          </div>
          <div className={styles.stepItem} style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-success)', marginBottom: '8px' }}>● SUBMISSIONS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>OPEN</div>
          </div>
          <div className={styles.stepItem} style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-error)', marginBottom: '8px' }}>DEADLINE</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>OCT 18, 2026</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <h2 className={styles.sectionTitle}>Ready to build?</h2>
        <p className={styles.sectionSubtitle} style={{ marginBottom: 'var(--space-8)' }}>
          Join the ultimate open-source hackathon platform.
        </p>
        <Button as="a" href="/login" className={styles.btnPrimary} size="lg">
          Join Dogfood 2026
        </Button>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.sponsors} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-8)', marginBottom: 'var(--space-8)' }}>

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
      
        </div>
        <div className={styles.footerInner}>
          <div className={styles.footerCol}>
            <h4>DOGFOOD.DEV</h4>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '8px' }}>Build. Ship. Showcase.</p>
          </div>
          <div className={styles.footerCol}>
            <h4>Platform</h4>
            <Link href="/events">Events</Link>
            <Link href="/gallery">Gallery</Link>
            <Link href="/leaderboard">Leaderboard</Link>
          </div>
          <div className={styles.footerCol}>
            <h4>Community</h4>
            <Link href="/github">GitHub</Link>
            <Link href="/discord">Discord</Link>
            <Link href="/x">X</Link>
          </div>
          <div className={styles.footerCol}>
            <h4>Resources</h4>
            <Link href="/docs">Documentation</Link>
            <Link href="/faq">FAQs</Link>
            <Link href="/conduct">Code of Conduct</Link>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span>Dogfood 2026 &mdash; &copy; 2026 Dogfood by BeyondQ</span>
          <span>Open-source hackathon platform</span>
        </div>
      </footer>
    </div>
  );
}
