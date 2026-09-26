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
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generateInviteLink() {
    setLoading(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Note: once auth is available, include the current userId
        body: JSON.stringify({ invitedByUserId: '00000000-0000-0000-0000-000000000000' }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error ?? 'Failed to create invitation', 'error');
        return;
      }
      const url = `${window.location.origin}${data.data.inviteUrl}`;
      setInviteLink(url);
      addToast('Invitation link created! Share it with your teammate.', 'success');
    } catch {
      addToast('Failed to create invitation. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      addToast('Invitation link copied to clipboard.', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('Could not copy to clipboard.', 'error');
    }
  }

  return (
    <Card shadow padding="md">
      <h2 className={styles.sidebarTitle}>Invite a teammate</h2>
      <p className={styles.inviteDesc}>
        Generate a secure invitation link and share it with anyone you want to add to this team.
      </p>

      {inviteLink ? (
        <div className={styles.inviteLinkSection}>
          <input
            className={styles.inviteLinkInput}
            value={inviteLink}
            readOnly
            aria-label="Invitation link"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={copyToClipboard}
          >
            {copied ? '✓ Copied' : 'Copy link'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setInviteLink(null); setCopied(false); }}
          >
            Generate new
          </Button>
        </div>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          loading={loading}
          onClick={generateInviteLink}
          fullWidth
        >
          Generate invite link
        </Button>
      )}

      <p className={styles.inviteNote}>
        Invitation links expire in 7 days and can only be used once.
      </p>
    </Card>
  );
}
