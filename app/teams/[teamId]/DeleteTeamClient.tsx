'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export default function DeleteTeamClient({ teamId, eventId }: { teamId: string, eventId: string }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this team entirely? This action cannot be undone and will delete all submissions.')) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || 'Failed to delete team');
      }
      addToast('Team deleted', 'success');
      router.push(`/events/${eventId}`);
      router.refresh();
    } catch (err: any) {
      addToast(err.message, 'error');
      setLoading(false);
    }
  }

  return (
    <Button variant="secondary" size="md" onClick={handleDelete} disabled={loading} style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }} fullWidth>
      {loading ? 'Deleting...' : 'Delete Team'}
    </Button>
  );
}
