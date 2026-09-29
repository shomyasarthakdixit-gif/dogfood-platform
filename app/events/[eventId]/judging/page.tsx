import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import PageContainer from '@/components/layout/PageContainer';
import { requireUser } from '@/lib/auth';
import { getDbPool } from '@/lib/db';
import Card from '@/components/ui/Card';

export default async function JudgingDashboardPage({
  params
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const { user } = await requireUser();
  if (!user) {
    redirect('/login');
  }

  const pool = getDbPool();

  // Check if user is a judge for this event
  const judgeRes = await pool.query('SELECT id FROM judge_profiles WHERE user_id = $1 AND event_id = $2', [user.id, eventId]);
  if (judgeRes.rowCount === 0) {
    return <PageContainer><Card padding="md">You are not a judge for this event.</Card></PageContainer>;
  }

  // Get assignments
  const assignRes = await pool.query(`
    SELECT ja.id as assignment_id, ja.status, s.id as submission_id, s.title, s.description, t.name as team_name
    FROM judge_assignments ja
    JOIN submissions s ON ja.submission_id = s.id
    JOIN judge_profiles jp ON ja.judge_id = jp.id
    LEFT JOIN teams t ON s.team_id = t.id
    WHERE jp.user_id = $1 AND jp.event_id = $2
  `, [user.id, eventId]);

  const assignments = assignRes.rows;

  return (
    <PageContainer>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Review Submissions</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Select a submission to evaluate.</p>
      </div>

      {assignments.length === 0 ? (
        <Card padding="md">
          <p>No submissions have been assigned to you yet. If the submission window has ended, please ask the organizer to trigger auto-assignment.</p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {assignments.map(a => (
            <Card key={a.assignment_id} padding="md">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 4px 0' }}>{a.title}</h3>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    Team: {a.team_name}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '0.8rem',
                    background: a.status === 'COMPLETED' ? 'rgba(0,200,0,0.1)' : 'var(--color-surface-subtle)',
                    color: a.status === 'COMPLETED' ? 'var(--color-success)' : 'var(--color-text)'
                  }}>
                    {a.status === 'COMPLETED' ? '✓ Evaluated' : 'Pending'}
                  </span>
                  <Link 
                    href={`/submissions/${a.submission_id}`} 
                    style={{ padding: '8px 16px', background: 'var(--color-bg-alt)', borderRadius: '4px', textDecoration: 'none', fontWeight: 500 }}
                  >
                    View Submission
                  </Link>
                  <Link 
                    href={`/events/${eventId}/judging/${a.assignment_id}`} 
                    style={{ padding: '8px 16px', background: 'var(--color-primary)', color: 'white', borderRadius: '4px', textDecoration: 'none', fontWeight: 500 }}
                  >
                    {a.status === 'COMPLETED' ? 'Edit Evaluation' : 'Evaluate'}
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
