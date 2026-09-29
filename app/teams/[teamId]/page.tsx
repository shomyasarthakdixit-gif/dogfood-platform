import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { getTeamById } from '@/lib/api/teams';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import { getDbPool } from '@/lib/db';
import type { TeamMember } from '@/lib/types';
import type { Metadata } from 'next';
import { getCurrentUser } from '@/lib/auth';
import styles from './team.module.css';
import InviteSection from './InviteSection';
import RemoveMemberClient from './RemoveMemberClient';
import DeleteTeamClient from './DeleteTeamClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string }>;
}): Promise<Metadata> {
  const { teamId } = await params;
  const team = await getTeamById(teamId);
  return { title: team ? `${team.name} — Dogfood 2026` : 'Team not found' };
}

function MemberCard({ member, isCurrentUserLeader, currentUserId, teamId }: { member: TeamMember, isCurrentUserLeader: boolean, currentUserId: string | undefined, teamId: string }) {
  const name = member.user?.name ?? 'Unknown';
  const isSelf = member.user_id === currentUserId;
  
  return (
    <div className={styles.memberCard}>
      <Avatar name={name} size="md" />
      <div className={styles.memberInfo}>
        <span className={styles.memberName}>{name}</span>
        {member.user?.email && (
          <span className={styles.memberEmail}>{member.user.email}</span>
        )}
      </div>
      {isCurrentUserLeader && !isSelf && member.role !== 'LEADER' && (
        <RemoveMemberClient teamId={teamId} userId={member.user_id} memberName={name} />
      )}
      <Badge variant={member.role === 'LEADER' ? 'info' : 'default'}>
        {member.role === 'LEADER' ? 'Team Leader' : 'Member'}
      </Badge>
    </div>
  );
}

async function TeamContent({ teamId }: { teamId: string }) {
  const team = await getTeamById(teamId);
  if (!team) notFound();

  const user = await getCurrentUser();
  const currentUserId = user?.id;
  const isCurrentUserLeader = team.members?.some(m => m.user_id === currentUserId && m.role === 'LEADER') ?? false;

  const leader = team.members?.find(m => m.role === 'LEADER');
  const memberCount = team.members?.length ?? 0;

  const pool = getDbPool();
  const invRes = await pool.query(`
    SELECT ti.id, ti.status, ti.expires_at, u.email as invitee_email
    FROM team_invitations ti
    JOIN users u ON u.id = ti.invitee_id
    WHERE ti.team_id = $1 AND ti.status = 'PENDING'
  `, [teamId]);
  const pendingInvitations = invRes.rows;

  return (
    <article>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.headerMeta}>
            <Badge variant="default">Team</Badge>
            <span className={styles.memberCount}>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
          </div>
          <h1 className={styles.teamName}>{team.name}</h1>
          {team.description && (
            <p className={styles.teamDescription}>{team.description}</p>
          )}
        </div>
        <div className={styles.headerActions}>
          <Button as="a" href="/dashboard" variant="secondary" size="sm">
            ← Dashboard
          </Button>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Members */}
        <div className={styles.mainColumn}>
          <Card shadow>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Team Members</h2>
            </div>

            {!team.members || team.members.length === 0 ? (
              <EmptyState
                title="No members yet"
                description="Invite people to join this team."
              />
            ) : (
              <div className={styles.memberList}>
                {team.members.map(m => (
                  <MemberCard key={m.id} member={m} isCurrentUserLeader={isCurrentUserLeader} currentUserId={currentUserId} teamId={team.id} />
                ))}
              </div>
            )}
          </Card>

          {/* Submission status */}
          <Card shadow className={styles.submissionCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Submission</h2>
            </div>
            <div className={styles.submissionPlaceholder}>
              <p className={styles.submissionText}>
                Your team hasn&apos;t created a submission yet.
              </p>
              <Button as="a" href={`/submissions/new?eventId=${team.event_id}`} variant="primary" size="sm">
                Create submission
              </Button>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          {/* Invite section — client component */}
          {isCurrentUserLeader && (
            <InviteSection teamId={team.id} />
          )}

          {pendingInvitations.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <Card padding="md">
                <h2 className={styles.sidebarTitle}>Pending Invitations</h2>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {pendingInvitations.map(inv => (
                    <li key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                      <span style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inv.invitee_email}</span>
                      <Badge variant="warning">Pending</Badge>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          )}

          {/* Team info */}
          <Card padding="md" className={styles.infoCard}>
            <h2 className={styles.sidebarTitle}>Team info</h2>
            <dl className={styles.infoList}>
              <div className={styles.infoItem}>
                <dt>Leader</dt>
                <dd>{leader?.user?.name ?? '—'}</dd>
              </div>
              <div className={styles.infoItem}>
                <dt>Members</dt>
                <dd>{memberCount}</dd>
              </div>
            </dl>
          </Card>
          
          {isCurrentUserLeader && (
            <div style={{ marginTop: '16px' }}>
              <DeleteTeamClient teamId={team.id} eventId={team.event_id} />
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  return (
    <PageContainer>
      <Suspense
        fallback={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Skeleton variant="heading" width="40%" />
            <Skeleton variant="text" width="60%" />
            <div style={{ height: 200, background: 'var(--color-surface-inset)', borderRadius: 10 }} />
          </div>
        }
      >
        <TeamContent teamId={teamId} />
      </Suspense>
    </PageContainer>
  );
}
