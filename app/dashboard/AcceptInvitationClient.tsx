/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export default function AcceptInvitationClient({ invitationId, action }: { invitationId: string, action: 'accept' | 'decline' }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleAction() {
    setLoading(true);
    try {
      const res = await fetch(`/api/invitations/${invitationId}`, {
        method: action === 'accept' ? 'POST' : 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || `Failed to ${action} invitation`);
      }
      addToast(`Invitation ${action === 'accept' ? 'accepted' : 'declined'}`, 'success');
      router.refresh();
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button 
      variant={action === 'accept' ? 'primary' : 'secondary'} 
      size="sm" 
      onClick={handleAction} 
      disabled={loading}
      style={action === 'decline' ? { color: 'var(--color-danger)', borderColor: 'var(--color-danger)' } : {}}
    >
      {loading ? '...' : action === 'accept' ? 'Accept' : 'Decline'}
    </Button>
  );
}

