'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export default function RemoveMemberClient({ teamId, userId, memberName }: { teamId: string, userId: string, memberName: string }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    if (!confirm(`Are you sure you want to remove ${memberName} from the team?`)) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/members/${userId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || 'Failed to remove member');
      }
      addToast('Member removed', 'success');
      router.refresh();
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleRemove} disabled={loading} style={{ color: 'var(--color-danger)' }}>
      {loading ? 'Removing...' : 'Remove'}
    </Button>
  );
}
