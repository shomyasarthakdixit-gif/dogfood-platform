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
        
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [resolvedParams.assignmentId]);

  if (loading) return <PageContainer><p>Loading...</p></PageContainer>;
  if (error) return <PageContainer><Card padding="md" style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}>{error}</Card></PageContainer>;
  if (!assignment) return <PageContainer><p>Not found</p></PageContainer>;

  const handleSubmit = async (submit: boolean) => {
    setSubmitting(true);
    try {
      // In a real app we would gather scores from inputs. 
      // For now we'll just submit an empty/dummy score if no criteria, or auto-max score.
      const res = await fetch(`/api/assignments/${resolvedParams.assignmentId}/evaluation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores: [], submit })
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

  return (
    <PageContainer>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Evaluate Submission</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Assignment ID: {resolvedParams.assignmentId}</p>
      </div>

      <Card padding="md">
        <h2>{assignment.submission_id}</h2>
        <p>This is a simplified evaluation page. In a full implementation, you would see the rubric criteria here and input scores.</p>
        
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <Button variant="secondary" onClick={() => handleSubmit(false)} disabled={submitting}>
            Save Draft
          </Button>
          <Button variant="primary" onClick={() => handleSubmit(true)} disabled={submitting}>
            Submit Final Scores
          </Button>
        </div>
      </Card>
    </PageContainer>
  );
}
