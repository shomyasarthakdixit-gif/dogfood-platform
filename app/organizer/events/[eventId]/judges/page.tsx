'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import Link from 'next/link';
import PageContainer from '@/components/layout/PageContainer';
import Button from '@/components/ui/Button';

interface Judge {
  id: string;
  user_id: string;
  name: string;
  email: string;
  background: string | null;
  created_at: string;
}

interface EventMetrics {
  judges: number;
  assignments: number;
}

export default function ManageJudgesPage({ params }: { params: Promise<{ eventId: string }> }) {
  const unwrappedParams = use(params);
  const eventId = unwrappedParams.eventId;

  const [eventData, setEventData] = useState<any>(null);
  const [metrics, setMetrics] = useState<EventMetrics | null>(null);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [newJudgeUserId, setNewJudgeUserId] = useState('');
  const [newJudgeBackground, setNewJudgeBackground] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  
  // For selecting a user to add as judge
  const [allUsers, setAllUsers] = useState<{id: string, name: string, email: string}[]>([]);
  const [userSearch, setUserSearch] = useState('');

  const refreshData = async () => {
    try {
      const [evRes, judgesRes, usersRes] = await Promise.all([
        fetch(`/api/events/${eventId}`),
        fetch(`/api/events/${eventId}/judges`),
        fetch(`/api/admin/users`) // Assume this or something similar exists to fetch users. If not, we can search by exact ID. Wait, I'll assume we can search by email or use an existing endpoint, but the safest is fetching from a users endpoint if available.
        // Actually, since I don't know if /api/admin/users exists and works for organizers, let's just use a text input for user ID to keep it simple, or I can create a search API.
      ]);
      const evData = await evRes.json();
      setEventData(evData.event);
      setMetrics(evData.metrics);

      const judgesData = await judgesRes.json();
      setJudges(judgesData.judges || []);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [eventId]);

  const handleAddJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const res = await fetch(`/api/events/${eventId}/judges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: newJudgeUserId, background: newJudgeBackground }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to add judge');
      }
      setNewJudgeUserId('');
      setNewJudgeBackground('');
      await refreshData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveJudge = async (judgeId: string) => {
    if (!confirm('Are you sure you want to remove this judge?')) return;
    try {
      const res = await fetch(`/api/events/${eventId}/judges/${judgeId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to remove judge');
      }
      await refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleGenerateAssignments = async () => {
    if (!confirm('This will assign submissions to judges. Continue?')) return;
    setIsAssigning(true);
    try {
      const res = await fetch(`/api/events/${eventId}/assignments/auto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ judgesPerSubmission: eventData.judges_per_submission }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to generate assignments');
      }
      const data = await res.json();
      alert(`Successfully generated ${data.count} assignments!`);
      await refreshData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  if (loading) return <PageContainer>Loading judges...</PageContainer>;
  if (error) return <PageContainer>Error: {error}</PageContainer>;

  const requiredJudges = eventData?.required_judges || 0;
  const configuredJudges = judges.length;
  const isReady = configuredJudges >= requiredJudges;

  return (
    <PageContainer>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <Link href={`/organizer/events/${eventId}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', marginBottom: '0.5rem', display: 'inline-block' }}>
            ← Back to Event
          </Link>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Judge Management</h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem', background: 'var(--color-bg-card)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>JUDGING CONFIGURATION</h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Required judges:</span>
            <strong>{requiredJudges}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Configured judges:</span>
            <strong>{configuredJudges}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Judges per submission:</span>
            <strong>{eventData?.judges_per_submission || 1}</strong>
          </div>

          <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '4px', background: isReady ? 'rgba(0,200,0,0.1)' : 'rgba(255,165,0,0.1)', color: isReady ? 'var(--color-success)' : 'var(--color-warning)', border: `1px solid ${isReady ? 'var(--color-success)' : 'var(--color-warning)'}` }}>
            {isReady ? '✓ Ready for judging' : `⚠ ${requiredJudges - configuredJudges} more judges required before judging can begin.`}
          </div>

          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span>Assignments complete:</span>
              <strong>{metrics?.assignments || 0}</strong>
            </div>
            
            <Button 
              onClick={handleGenerateAssignments} 
              variant="primary" 
              fullWidth 
              disabled={!isReady || isAssigning || eventData.status === 'ARCHIVED'}
            >
              {isAssigning ? 'Generating...' : 'Generate Assignments'}
            </Button>
          </div>
        </div>

        <div style={{ padding: '1.5rem', background: 'var(--color-bg-card)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Add Judge</h2>
          <form onSubmit={handleAddJudge} style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>User ID</label>
              <input 
                type="text" 
                value={newJudgeUserId} 
                onChange={(e) => setNewJudgeUserId(e.target.value)} 
                placeholder="UUID of the user" 
                required 
                style={{ width: '100%', padding: '0.5rem', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'var(--color-text)' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Background / Expertise (Optional)</label>
              <textarea 
                value={newJudgeBackground} 
                onChange={(e) => setNewJudgeBackground(e.target.value)} 
                placeholder="Senior Engineer at..." 
                style={{ width: '100%', padding: '0.5rem', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'var(--color-text)', minHeight: '80px' }} 
              />
            </div>
            <Button type="submit" variant="secondary" disabled={isAdding || eventData.status === 'ARCHIVED'}>
              {isAdding ? 'Adding...' : 'Add as Judge'}
            </Button>
          </form>
        </div>
      </div>

      <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--color-bg-alt)', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Name</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Email</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Background</th>
              <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {judges.map(judge => (
              <tr key={judge.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '1rem' }}>{judge.name}</td>
                <td style={{ padding: '1rem' }}>{judge.email}</td>
                <td style={{ padding: '1rem' }}>{judge.background || <span style={{ color: 'var(--color-text-muted)' }}>-</span>}</td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <Button 
                    onClick={() => handleRemoveJudge(judge.id)} 
                    variant="secondary" 
                    size="sm"
                    style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
                    disabled={eventData.status === 'ARCHIVED'}
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
            {judges.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No judges added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
}
