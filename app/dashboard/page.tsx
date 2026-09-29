import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getDbPool } from '@/lib/db';
import PageContainer from '@/components/layout/PageContainer';
import DashboardGuard from '@/components/auth/DashboardGuard';
import Link from 'next/link';
import AcceptInvitationClient from './AcceptInvitationClient';
import type { Metadata } from 'next';
import styles from './dashboard.module.css';

export const metadata: Metadata = { title: 'Dashboard — Dogfood 2026' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  let isParticipant = false;
  let isOrganizer = false;
  let isJudge = false;
  let displayRole = user?.role || 'USER';

  let userEventsCount = 0;
  let userTeamsCount = 0;
  let userSubmissionsCount = 0;
  let userProjects: { id: string; title: string; team_name: string }[] = [];
  let judgingEvents: { id: string; name: string; assigned: number; evaluated: number; remaining: number }[] = [];
  let pendingInvitations: { id: string, team_id: string, team_name: string, event_name: string, inviter_name: string }[] = [];

  if (user) {
    const pool = getDbPool();
    
    // Roles
    const resRoles = await pool.query('SELECT role FROM event_members WHERE user_id = $1', [user.id]);
    const roles = resRoles.rows.map(r => r.role);
    isParticipant = roles.includes('PARTICIPANT');
    isOrganizer = roles.includes('ORGANIZER');
    isJudge = roles.includes('JUDGE');
    
    if (user.role === 'ADMIN') displayRole = 'ADMIN';
    else if (isOrganizer) displayRole = 'Organizer';
    else if (isJudge) displayRole = 'Judge';
    else if (isParticipant) displayRole = 'Participant';

    // Metrics
    const resEvents = await pool.query('SELECT COUNT(DISTINCT event_id) as count FROM event_members WHERE user_id = $1', [user.id]);
    userEventsCount = parseInt(resEvents.rows[0].count, 10);

    const resTeams = await pool.query('SELECT COUNT(DISTINCT team_id) as count FROM team_members WHERE user_id = $1', [user.id]);
    userTeamsCount = parseInt(resTeams.rows[0].count, 10);

    const resSubmissions = await pool.query(`
      SELECT COUNT(s.id) as count 
      FROM submissions s
      JOIN team_members tm ON s.team_id = tm.team_id
      WHERE tm.user_id = $1
    `, [user.id]);
    userSubmissionsCount = parseInt(resSubmissions.rows[0].count, 10);

    // My Events Details
    const resMyEvents = await pool.query(`
      SELECT 
        e.id, e.name, e.status as event_status,
        em.role,
        t.name as team_name, t.id as team_id,
        s.status as submission_status, s.id as submission_id
      FROM event_members em
      JOIN events e ON em.event_id = e.id
      LEFT JOIN team_members tm ON tm.user_id = em.user_id
      LEFT JOIN teams t ON t.id = tm.team_id AND t.event_id = e.id
      LEFT JOIN submissions s ON s.team_id = t.id AND s.event_id = e.id
      WHERE em.user_id = $1
      ORDER BY e.created_at DESC
    `, [user.id]);
    
    // Pass to component
    userEventsCount = resMyEvents.rowCount || 0;
    // @ts-ignore
    userProjects = resMyEvents.rows;

    // Judging Events Metrics
    if (isJudge) {
      const judgeRes = await pool.query(`
        SELECT 
          e.id, e.name, e.status,
          COUNT(ja.id) as assigned,
          SUM(CASE WHEN e_val.status = 'SUBMITTED' THEN 1 ELSE 0 END) as evaluated
        FROM event_members em
        JOIN events e ON em.event_id = e.id
        JOIN judge_profiles jp ON jp.user_id = em.user_id AND jp.event_id = e.id
        LEFT JOIN judge_assignments ja ON ja.judge_id = jp.id
        LEFT JOIN evaluations e_val ON e_val.assignment_id = ja.id
        WHERE em.user_id = $1 AND em.role = 'JUDGE'
        GROUP BY e.id, e.name, e.status
      `, [user.id]);
      
      judgingEvents = judgeRes.rows.map(r => ({
        id: r.id,
        name: r.name,
        assigned: parseInt(r.assigned) || 0,
        evaluated: parseInt(r.evaluated) || 0,
        remaining: (parseInt(r.assigned) || 0) - (parseInt(r.evaluated) || 0)
      }));
    }

    // Pending Invitations
    const pendingRes = await pool.query(`
      SELECT 
        ti.id, ti.team_id, 
        t.name as team_name, 
        e.name as event_name, 
        u.name as inviter_name
      FROM team_invitations ti
      JOIN teams t ON t.id = ti.team_id
      JOIN events e ON e.id = t.event_id
      JOIN users u ON u.id = ti.inviter_id
      WHERE ti.invitee_id = $1 AND ti.status = 'PENDING' AND ti.expires_at > NOW()
    `, [user.id]);
    pendingInvitations = pendingRes.rows as any;
  }

  return (
    <PageContainer size="full">
      <DashboardGuard wasLoggedIn={!!user} />
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.bgCircle1} />
        <div className={styles.bgCircle2} />
        
        <div className={styles.heroContent}>
          <div className={styles.pillBadge}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            DASHBOARD COMMAND CENTER
          </div>
          
          <h1 className={styles.heroTitle}>
            Welcome to <span className={styles.heroTitleHighlight}>Dogfood Platform</span>
          </h1>
          
          <p className={styles.heroSubtitle}>
            Manage your events, join teams, submit projects, and participate in judging all in one place.
          </p>
          
          {user ? (
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 600 }}>
              <p>Welcome back, {user.name}! ({displayRole})</p>
            </div>
          ) : (
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              <p>Please log in to manage your submissions.</p>
            </div>
          )}
          
          <div className={styles.heroActions}>
            <Link href="/events" className={styles.primaryBtn}>
              Explore Events ↓
            </Link>
            
            {(!user || isParticipant) && (
              <Link href="/events" className={styles.secondaryBtn}>
                Submit Project →
              </Link>
            )}
            
            {(user?.role === 'ADMIN' || isOrganizer) && (
              <Link href="/organizer/events" className={styles.secondaryBtn}>
                Manage Events →
              </Link>
            )}
            
            {user && isJudge && !isOrganizer && !isParticipant && (
              <Link href="#judging" className={styles.secondaryBtn}>
                Review Submissions →
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <div className={styles.statNumber}>{userEventsCount}</div>
          <div className={styles.statLabel}>Your Events</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statNumber}>{userTeamsCount}</div>
          <div className={styles.statLabel}>Your Teams</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statNumber}>{userSubmissionsCount}</div>
          <div className={styles.statLabel}>Your Submissions</div>
        </div>
      </div>

      {/* Pending Invitations Section */}
      {pendingInvitations.length > 0 && (
        <section className={styles.projectsSection} style={{ marginTop: '2rem' }}>
          <h2 className={styles.sectionTitle}>
            💌 Pending Invitations
          </h2>
          <p className={styles.sectionSubtitle}>
            You have been invited to join the following teams.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {pendingInvitations.map(inv => (
              <div key={inv.id} style={{ background: 'var(--color-surface)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '1.1rem' }}>{inv.team_name}</strong>
                  <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    Event: {inv.event_name} • Invited by {inv.inviter_name}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <AcceptInvitationClient invitationId={inv.id} action="accept" />
                  <AcceptInvitationClient invitationId={inv.id} action="decline" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* My Events Grid Section */}
      <section className={styles.projectsSection}>
        <h2 className={styles.sectionTitle}>
          🗓 My Events
        </h2>
        <p className={styles.sectionSubtitle}>
          Events you are participating in or organizing.
        </p>
        
        {userProjects.length > 0 ? (
          <div className={styles.projectsGrid}>
            {userProjects.map((project: any) => (
              <div key={project.id} className={styles.projectCard} style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h3 className={styles.projectTitle} style={{ color: 'var(--color-text)', margin: 0 }}>{project.name}</h3>
                
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', padding: '2px 8px', background: 'var(--color-bg-alt)', borderRadius: '12px' }}>Event: {project.event_status}</span>
                  {project.role === 'PARTICIPANT' && <span style={{ fontSize: '12px', padding: '2px 8px', background: 'rgba(0, 200, 0, 0.1)', color: 'var(--color-success)', borderRadius: '12px' }}>✓ Registered</span>}
                  {project.role === 'ORGANIZER' && <span style={{ fontSize: '12px', padding: '2px 8px', background: 'rgba(0, 100, 255, 0.1)', color: 'var(--color-primary)', borderRadius: '12px' }}>Organizer</span>}
                  {project.role === 'JUDGE' && <span style={{ fontSize: '12px', padding: '2px 8px', background: 'rgba(200, 100, 255, 0.1)', color: 'purple', borderRadius: '12px' }}>Judge</span>}
                </div>

                <div style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '8px' }}>
                  {project.team_name ? (
                    <div>Team: <strong>{project.team_name}</strong></div>
                  ) : (
                    project.role === 'PARTICIPANT' && <div>No team yet</div>
                  )}
                  
                  {project.role === 'PARTICIPANT' && (
                    <div style={{ marginTop: '4px' }}>
                      Submission: <strong>{project.submission_status === 'SUBMITTED' ? '✓ Submitted' : project.submission_status === 'DRAFT' ? 'Draft Saved' : 'None'}</strong>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', gap: '8px' }}>
                  <Link href={`/events/${project.id}`} style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'var(--color-primary)', color: 'white', borderRadius: '4px', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}>
                    Open Event
                  </Link>
                  {project.team_id && (
                    <Link href={`/teams/${project.team_id}`} style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'var(--color-bg-alt)', color: 'var(--color-text)', borderRadius: '4px', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}>
                      My Team
                    </Link>
                  )}
                  {project.submission_id && (
                    <Link href={`/submissions/${project.submission_id}`} style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'var(--color-bg-alt)', color: 'var(--color-text)', borderRadius: '4px', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}>
                      View Submission
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>You haven't registered for any events yet.</p>
            <Link href="/events" className={styles.primaryBtn} style={{ marginTop: '16px', display: 'inline-block' }}>
              Browse Events
            </Link>
          </div>
        )}
      </section>

      {/* Judging Section */}
      {isJudge && (
        <section id="judging" className={styles.projectsSection} style={{ marginTop: '3rem' }}>
          <h2 className={styles.sectionTitle}>
            ⚖️ My Judging Events
          </h2>
          <p className={styles.sectionSubtitle}>
            Events where you are assigned to evaluate projects.
          </p>
          
          {judgingEvents.length > 0 ? (
            <div className={styles.projectsGrid}>
              {judgingEvents.map((je: any) => (
                <div key={je.id} className={styles.projectCard} style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h3 className={styles.projectTitle} style={{ color: 'var(--color-text)', margin: 0 }}>{je.name}</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '1rem', fontSize: '14px' }}>
                    <div style={{ background: 'var(--color-bg-alt)', padding: '0.75rem', borderRadius: '4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Assigned</div>
                      <strong style={{ fontSize: '18px' }}>{je.assigned}</strong>
                    </div>
                    <div style={{ background: 'var(--color-bg-alt)', padding: '0.75rem', borderRadius: '4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Completed</div>
                      <strong style={{ fontSize: '18px', color: 'var(--color-success)' }}>{je.evaluated}</strong>
                    </div>
                    <div style={{ background: 'var(--color-bg-alt)', padding: '0.75rem', borderRadius: '4px', textAlign: 'center', gridColumn: 'span 2' }}>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Remaining</div>
                      <strong style={{ fontSize: '18px', color: je.remaining > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>{je.remaining}</strong>
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                    <Link href={`/events/${je.id}/judging`} style={{ display: 'block', textAlign: 'center', padding: '10px', background: 'var(--color-primary)', color: 'white', borderRadius: '4px', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}>
                      Continue Judging
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <p style={{ color: 'var(--color-text-muted)' }}>No judging events available yet.</p>
            </div>
          )}
        </section>
      )}
    </PageContainer>
  );
}
