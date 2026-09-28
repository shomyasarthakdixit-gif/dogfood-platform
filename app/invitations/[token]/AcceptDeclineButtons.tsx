'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import styles from './invitation.module.css';

interface AcceptDeclineButtonsProps {
  token: string;
  teamId: string;
}

type State = 'idle' | 'accepting' | 'accepted' | 'error';

export default function AcceptDeclineButtons({ token, teamId }: AcceptDeclineButtonsProps) {
  const [state, setState] = useState<State>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const { addToast } = useToast();
  const router = useRouter();

  async function handleAccept() {
    setState('accepting');
    try {
      const res = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // TODO: replace placeholder with real session user ID once auth merges
        body: JSON.stringify({ userId: '00000000-0000-0000-0000-000000000000' }),
      });
      const data = await res.json();

      if (res.status === 409) {
        setState('error');
        setErrorMsg('You are already a member of this team.');
        addToast('You are already a member of this team.', 'warning');
        return;
      }
      if (!res.ok) {
        setState('error');
        setErrorMsg(data.error ?? 'Failed to accept invitation.');
        addToast(data.error ?? 'Failed to accept invitation.', 'error');
        return;
      }

      setState('accepted');
      addToast('Welcome to the team! Redirecting…', 'success');
      setTimeout(() => router.push(`/teams/${teamId}`), 1500);
    } catch {
      setState('error');
      setErrorMsg('Something went wrong. Please try again.');
      addToast('Something went wrong. Please try again.', 'error');
    }
  }

  if (state === 'accepted') {
    return (
      <div className={styles.successState} role="status">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 16 9"/>
        </svg>
        <span>You joined the team! Redirecting to team page…</span>
      </div>
    );
  }

  return (
    <div className={styles.actions}>
      {state === 'error' && (
        <div className={styles.errorInline} role="alert">{errorMsg}</div>
      )}
      <Button
        variant="primary"
        size="lg"
        loading={state === 'accepting'}
        onClick={handleAccept}
        fullWidth
      >
        Accept Invitation
      </Button>
      <Button
        as="a"
        href="/events"
        variant="ghost"
        size="md"
        fullWidth
      >
        Decline
      </Button>
    </div>
  );
}
