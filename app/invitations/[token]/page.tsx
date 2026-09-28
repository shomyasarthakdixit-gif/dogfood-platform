import { Suspense } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import type { Metadata } from 'next';
import styles from './invitation.module.css';
import AcceptDeclineButtons from './AcceptDeclineButtons';

export const metadata: Metadata = { title: 'Team Invitation — Dogfood 2026' };

interface InvitationData {
  id: string;
  teamId: string;
  teamName: string;
  teamDescription: string | null;
  eventId: string;
  expiresAt: string;
  expired: boolean;
}

async function fetchInvitation(token: string): Promise<InvitationData | null> {
  // Server-side fetch — call the API Route handler directly
  // In production this would be a direct DB call, but using the Route Handler
  // keeps the data-access pattern consistent and testable.
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  try {
    const res = await fetch(`${baseUrl}/api/invitations/${token}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

function ExpiredBanner() {
  return (
    <div className={styles.banner} data-variant="error">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
      </svg>
      <span>This invitation has expired. Ask the team leader to generate a new one.</span>
    </div>
  );
}

function InvalidBanner() {
  return (
    <div className={styles.banner} data-variant="error">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
      </svg>
      <span>This invitation link is invalid or no longer available.</span>
    </div>
  );
}

async function InvitationContent({ token }: { token: string }) {
  const invitation = await fetchInvitation(token);

  if (!invitation) {
    return (
      <div className={styles.wrapper}>
        <Card shadow padding="lg" className={styles.card}>
          <InvalidBanner />
          <div className={styles.backAction}>
            <Button as="a" href="/events" variant="secondary">
              Browse events
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (invitation.expired) {
    return (
      <div className={styles.wrapper}>
        <Card shadow padding="lg" className={styles.card}>
          <ExpiredBanner />
          <div className={styles.backAction}>
            <Button as="a" href="/events" variant="secondary">
              Browse events
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const expiresDate = new Date(invitation.expiresAt);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className={styles.wrapper}>
      <Card shadow padding="lg" className={styles.card}>
        <div className={styles.iconWrap} aria-hidden="true">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>

        <p className={styles.eyebrow}>You&apos;ve been invited to join</p>
        <h1 className={styles.teamName}>{invitation.teamName}</h1>
        {invitation.teamDescription && (
          <p className={styles.teamDesc}>{invitation.teamDescription}</p>
        )}

        <div className={styles.meta}>
          <Badge variant="info">
            Expires {fmt(expiresDate)}
          </Badge>
        </div>

        {/* Client component for accept/decline */}
        <AcceptDeclineButtons token={token} teamId={invitation.teamId} />
      </Card>
    </div>
  );
}

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <PageContainer size="sm">
      <Suspense
        fallback={
          <div className={styles.wrapper}>
            <Card shadow padding="lg" className={styles.card}>
              <Skeleton height="40px" width="40px" variant="avatar" />
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="heading" width="70%" />
              <Skeleton variant="text" width="50%" />
            </Card>
          </div>
        }
      >
        <InvitationContent token={token} />
      </Suspense>
    </PageContainer>
  );
}
