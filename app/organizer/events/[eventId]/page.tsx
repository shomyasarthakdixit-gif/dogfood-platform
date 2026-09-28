'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/PageContainer';
import Button from '@/components/ui/Button';

import { use } from 'react';

interface EventData {
  id: string;
  name: string;
  slug: string;
  status: string;
  start_date: string;
  end_date: string;
  registration_start?: string;
  registration_end?: string;
  submission_start?: string;
  submission_end?: string;
  judging_start?: string;
  judging_end?: string;
  voting_start?: string;
  voting_end?: string;
}

interface TrackData {
  id: string;
  name: string;
  description: string;
}

interface PrizeData {
  id: string;
  name: string;
  description: string;
  amount: string;
  track_id: string | null;
}

export default function ManageEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const eventId = unwrappedParams.eventId;
  
  const [event, setEvent] = useState<EventData | null>(null);
  const [tracks, setTracks] = useState<TrackData[]>([]);
  const [prizes, setPrizes] = useState<PrizeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Forms states
  const [saving, setSaving] = useState(false);
  const [trackName, setTrackName] = useState('');
  const [trackDesc, setTrackDesc] = useState('');
  
  const [prizeName, setPrizeName] = useState('');
  const [prizeDesc, setPrizeDesc] = useState('');
  const [prizeAmount, setPrizeAmount] = useState('');
  const [prizeTrackId, setPrizeTrackId] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [evRes, trRes, prRes] = await Promise.all([
          fetch(`/api/events/${eventId}`),
          fetch(`/api/events/${eventId}/tracks`),
          fetch(`/api/events/${eventId}/prizes`),
        ]);
        
        const evData = await evRes.json();
        if (!evRes.ok) throw new Error(evData.error?.message || 'Failed to load event');
        setEvent(evData.event);

        const trData = await trRes.json();
        setTracks(trData.tracks || []);

        const prData = await prRes.json();
        setPrizes(prData.prizes || []);
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

  const refreshData = async () => {
    try {
      const [evRes, trRes, prRes] = await Promise.all([
        fetch(`/api/events/${eventId}`),
        fetch(`/api/events/${eventId}/tracks`),
        fetch(`/api/events/${eventId}/prizes`),
      ]);
      
      const evData = await evRes.json();
      if (evRes.ok) setEvent(evData.event);

      const trData = await trRes.json();
      setTracks(trData.tracks || []);

      const prData = await prRes.json();
      setPrizes(prData.prizes || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const updates: Record<string, string> = {};
    formData.forEach((val, key) => {
      if (val && typeof val === 'string') updates[key] = key.includes('date') || key.includes('start') || key.includes('end') ? new Date(val).toISOString() : val;
    });

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Update failed');
      }
      await refreshData();
      alert('Event updated successfully');
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trackName, description: trackDesc }),
      });
      if (!res.ok) throw new Error('Failed to add track');
      setTrackName('');
      setTrackDesc('');
      await refreshData();
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddPrize = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}/prizes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: prizeName, 
          description: prizeDesc, 
          amount: prizeAmount,
          track_id: prizeTrackId || null
        }),
      });
      if (!res.ok) throw new Error('Failed to add prize');
      setPrizeName('');
      setPrizeDesc('');
      setPrizeAmount('');
      setPrizeTrackId('');
      await refreshData();
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to delete');
      }
      router.push('/organizer/events');
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    }
  };

  if (loading) return <PageContainer>Loading...</PageContainer>;
  if (error) return <PageContainer>Error: {error}</PageContainer>;
  if (!event) return <PageContainer>Event not found</PageContainer>;

  const formatForInput = (iso?: string) => iso ? new Date(iso).toISOString().slice(0, 16) : '';

  return (
    <PageContainer>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Manage: {event.name}</h1>
        {event.status === 'DRAFT' && (
          <Button variant="secondary" onClick={handleDeleteEvent} style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}>
            Delete Event
          </Button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Left Column: Event Details & Lifecycle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ padding: '1.5rem', background: 'var(--color-bg-card)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Lifecycle & Dates</h2>
            <form onSubmit={handleUpdateEvent} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Status</label>
                <select name="status" defaultValue={event.status} style={{ width: '100%', padding: '0.75rem', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'var(--color-text)' }}>
                  <option value="DRAFT">DRAFT</option>
                  <option value="REGISTRATION">REGISTRATION</option>
                  <option value="SUBMISSION">SUBMISSION</option>
                  <option value="JUDGING">JUDGING</option>
                  <option value="VOTING">VOTING</option>
                  <option value="RESULTS">RESULTS</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Start Date</label>
                  <input name="start_date" type="datetime-local" defaultValue={formatForInput(event.start_date)} style={{ width: '100%', padding: '0.5rem', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'var(--color-text)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>End Date</label>
                  <input name="end_date" type="datetime-local" defaultValue={formatForInput(event.end_date)} style={{ width: '100%', padding: '0.5rem', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'var(--color-text)' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Registration Start</label>
                  <input name="registration_start" type="datetime-local" defaultValue={formatForInput(event.registration_start)} style={{ width: '100%', padding: '0.5rem', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'var(--color-text)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Registration End</label>
                  <input name="registration_end" type="datetime-local" defaultValue={formatForInput(event.registration_end)} style={{ width: '100%', padding: '0.5rem', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'var(--color-text)' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Submission Start</label>
                  <input name="submission_start" type="datetime-local" defaultValue={formatForInput(event.submission_start)} style={{ width: '100%', padding: '0.5rem', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'var(--color-text)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Submission End</label>
                  <input name="submission_end" type="datetime-local" defaultValue={formatForInput(event.submission_end)} style={{ width: '100%', padding: '0.5rem', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'var(--color-text)' }} />
                </div>
              </div>

              <Button type="submit" variant="primary" disabled={saving || event.status === 'ARCHIVED'}>
                Save Updates
              </Button>
            </form>
          </div>

        </div>

        {/* Right Column: Tracks & Prizes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ padding: '1.5rem', background: 'var(--color-bg-card)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Tracks</h2>
            {tracks.length > 0 ? (
              <ul style={{ marginBottom: '1rem', listStyle: 'none', padding: 0 }}>
                {tracks.map(t => (
                  <li key={t.id} style={{ padding: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>
                    <strong>{t.name}</strong> <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{t.description}</span>
                  </li>
                ))}
              </ul>
            ) : <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>No tracks added yet.</p>}
            
            <form onSubmit={handleAddTrack} style={{ display: 'grid', gap: '0.5rem' }}>
              <input value={trackName} onChange={e => setTrackName(e.target.value)} placeholder="Track Name" required style={{ width: '100%', padding: '0.5rem', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'var(--color-text)' }} />
              <input value={trackDesc} onChange={e => setTrackDesc(e.target.value)} placeholder="Description" style={{ width: '100%', padding: '0.5rem', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'var(--color-text)' }} />
              <Button type="submit" variant="secondary" disabled={saving || event.status === 'ARCHIVED'}>Add Track</Button>
            </form>
          </div>

          <div style={{ padding: '1.5rem', background: 'var(--color-bg-card)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Prizes</h2>
            {prizes.length > 0 ? (
              <ul style={{ marginBottom: '1rem', listStyle: 'none', padding: 0 }}>
                {prizes.map(p => (
                  <li key={p.id} style={{ padding: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>
                    <strong>{p.name}</strong> - {p.amount} <br/>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{p.description}</span>
                  </li>
                ))}
              </ul>
            ) : <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>No prizes added yet.</p>}
            
            <form onSubmit={handleAddPrize} style={{ display: 'grid', gap: '0.5rem' }}>
              <input value={prizeName} onChange={e => setPrizeName(e.target.value)} placeholder="Prize Name" required style={{ width: '100%', padding: '0.5rem', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'var(--color-text)' }} />
              <input value={prizeAmount} onChange={e => setPrizeAmount(e.target.value)} placeholder="Amount (e.g. $10,000)" style={{ width: '100%', padding: '0.5rem', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'var(--color-text)' }} />
              <input value={prizeDesc} onChange={e => setPrizeDesc(e.target.value)} placeholder="Description" style={{ width: '100%', padding: '0.5rem', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'var(--color-text)' }} />
              <select value={prizeTrackId} onChange={e => setPrizeTrackId(e.target.value)} style={{ width: '100%', padding: '0.5rem', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'var(--color-text)' }}>
                <option value="">-- Optional: Select Track --</option>
                {tracks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <Button type="submit" variant="secondary" disabled={saving || event.status === 'ARCHIVED'}>Add Prize</Button>
            </form>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}
