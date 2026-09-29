'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import styles from './team.module.css';

interface InviteSectionProps {
  teamId: string;
}

export default function InviteSection({ teamId }: InviteSectionProps) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error?.message || 'Failed to send invitation', 'error');
        return;
      }
      addToast('Invitation sent successfully!', 'success');
      setEmail('');
      // Ideally, refresh pending invitations list here or rely on router.refresh() from parent
    } catch {
      addToast('Failed to send invitation. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card shadow padding="md">
      <h2 className={styles.sidebarTitle}>Invite a teammate</h2>
      <p className={styles.inviteDesc}>
        Invite a registered participant to your team using their email address.
      </p>

      <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
        <input
          type="email"
          placeholder="Participant's email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)', width: '100%', background: 'var(--color-surface)' }}
        />
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          loading={loading}
          fullWidth
        >
          Send Invite
        </Button>
      </form>
      <p className={styles.inviteNote} style={{ marginTop: '12px' }}>
        The user must be registered for this event. Invitations expire in 48 hours.
      </p>
    </Card>
  );
}
