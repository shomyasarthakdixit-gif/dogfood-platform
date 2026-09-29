'use client';
import Button from './Button';
import { useRouter } from 'next/navigation';

export default function DeleteEventButton({ eventId }: { eventId: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to delete');
      }
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Failed to delete event');
      }
    }
  };

  return (
    <Button variant="secondary" onClick={handleDelete} style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)', padding: '0.5rem 1rem' }}>
      Delete
    </Button>
  );
}
