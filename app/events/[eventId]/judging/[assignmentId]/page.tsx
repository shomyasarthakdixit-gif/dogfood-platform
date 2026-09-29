"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { use } from 'react';

export default function JudgingEvaluationPage({ params }: { params: Promise<{ eventId: string, assignmentId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [assignment, setAssignment] = useState<any>(null);
  const [criteria, setCriteria] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [evalStatus, setEvalStatus] = useState<string | null>(null);
  
  useEffect(() => {
    const init = async () => {
      try {
        // start evaluation
        const res = await fetch(`/api/assignments/${resolvedParams.assignmentId}/start`, { method: 'POST' });
        if (!res.ok) {
          throw new Error('Failed to start evaluation.');
        }
        
        // get assignment details
        const assignRes = await fetch(`/api/assignments/${resolvedParams.assignmentId}`);
        if (!assignRes.ok) throw new Error('Failed to load assignment.');
        const assignData = await assignRes.json();
        setAssignment(assignData.assignment);
        setCriteria(assignData.criteria || []);
        setEvalStatus(assignData.evaluationStatus);
        
        if (assignData.existingScores) {
          const initialScores: Record<string, string> = {};
          assignData.existingScores.forEach((s: any) => {
            initialScores[s.criterion_id] = s.score.toString();
          });
          setScores(initialScores);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [resolvedParams.assignmentId]);

  if (loading) return <PageContainer><p>Loading...</p></PageContainer>;
  if (error) return <PageContainer><Card padding="md" className="error-card">{error}</Card></PageContainer>;
  if (!assignment) return <PageContainer><p>Not found</p></PageContainer>;

  const handleScoreChange = (criterionId: string, value: string) => {
    setScores(prev => ({ ...prev, [criterionId]: value }));
  };

  const handleSubmit = async (submit: boolean) => {
    setSubmitting(true);
    try {
      const scoresArray = Object.entries(scores)
        .filter(([_, v]) => v !== '')
        .map(([k, v]) => ({ criterion_id: k, score: parseFloat(v) }));

      const res = await fetch(`/api/assignments/${resolvedParams.assignmentId}/evaluation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores: scoresArray, submit })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to submit evaluation');
      }
      
      router.push(`/events/${resolvedParams.eventId}/judging`);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isSubmitted = evalStatus === 'SUBMITTED';

  return (
    <PageContainer>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Evaluate Submission</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Assignment ID: {resolvedParams.assignmentId}</p>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <Card padding="md">
          <h2>{assignment.submission_title || 'Untitled Submission'}</h2>
          {assignment.team_name && <p><strong>Team:</strong> {assignment.team_name}</p>}
          {assignment.submission_url && <p><strong>URL:</strong> <a href={assignment.submission_url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }}>{assignment.submission_url}</a></p>}
          {assignment.submission_description && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--color-surface-subtle)', borderRadius: '4px' }}>
              <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{assignment.submission_description}</p>
            </div>
          )}
        </Card>
      </div>

      <Card padding="md">
        <h3 style={{ marginBottom: '1.5rem' }}>Rubric</h3>
        {criteria.length === 0 ? (
          <p>No criteria defined for this event.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {criteria.map(c => (
              <div key={c.id} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{c.name}</h4>
                    {c.description && <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{c.description}</p>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Weight: {c.weight}x</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="number" 
                        min="0" 
                        max={c.max_score} 
                        value={scores[c.id] || ''} 
                        onChange={(e) => handleScoreChange(c.id, e.target.value)}
                        disabled={isSubmitted || submitting}
                        style={{ width: '80px', padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                      />
                      <span style={{ color: 'var(--color-text-muted)' }}>/ {c.max_score}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {!isSubmitted && (
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <Button variant="secondary" onClick={() => handleSubmit(false)} disabled={submitting}>
              Save Draft
            </Button>
            <Button variant="primary" onClick={() => handleSubmit(true)} disabled={submitting}>
              Submit Final Scores
            </Button>
          </div>
        )}
        {isSubmitted && (
          <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--color-success-bg)', color: 'var(--color-success-fg)', borderRadius: '4px', fontWeight: 'bold' }}>
            This evaluation has been submitted and can no longer be edited.
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
