'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import Link from 'next/link';
import PageContainer from '@/components/layout/PageContainer';
import Button from '@/components/ui/Button';

interface Participant {
  id: string;
  name: string;
  email: string;
  registration_date: string;
  team_name: string | null;
  submission_status: string | null;
}

export default function ManageParticipantsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const unwrappedParams = use(params);
  const eventId = unwrappedParams.eventId;
  
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(`/api/events/${eventId}/participants`)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error.message);
        setParticipants(data.participants || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) return <PageContainer>Loading participants...</PageContainer>;
  if (error) return <PageContainer>Error: {error}</PageContainer>;

  const filtered = participants.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    (p.team_name && p.team_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <PageContainer>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <Link href={`/organizer/events/${eventId}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', marginBottom: '0.5rem', display: 'inline-block' }}>
            ← Back to Event
          </Link>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Manage Participants</h1>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <input 
          type="text" 
          placeholder="Search by name, email or team..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', maxWidth: '400px', padding: '0.75rem', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'var(--color-text)' }}
        />
      </div>

      <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--color-bg-alt)', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Name</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Email</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Registered Date</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Team</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Submission</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '1rem' }}>{p.name}</td>
                <td style={{ padding: '1rem' }}>{p.email}</td>
                <td style={{ padding: '1rem' }}>{new Date(p.registration_date).toLocaleDateString()}</td>
                <td style={{ padding: '1rem' }}>{p.team_name || <span style={{ color: 'var(--color-text-muted)' }}>No team</span>}</td>
                <td style={{ padding: '1rem' }}>
                  {p.submission_status === 'SUBMITTED' ? (
                    <span style={{ color: 'var(--color-success)' }}>✓ Submitted</span>
                  ) : p.submission_status === 'DRAFT' ? (
                    <span style={{ color: 'var(--color-warning)' }}>Draft</span>
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)' }}>None</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No participants found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
}
