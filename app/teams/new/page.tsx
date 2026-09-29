import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getEventById } from '@/lib/api/events';
import PageContainer from '@/components/layout/PageContainer';
import NewTeamClient from './NewTeamClient';

export default async function NewTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const { eventId } = await searchParams;
  if (!eventId) {
    notFound();
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?callbackUrl=/teams/new?eventId=${eventId}`);
  }

  const event = await getEventById(eventId);
  if (!event) {
    notFound();
  }

  return (
    <PageContainer>
      <div style={{ maxWidth: '600px', margin: '0 auto', paddingTop: 'var(--space-8)' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Create a Team</h1>
        <p style={{ color: 'var(--color-text-light)', marginBottom: '32px' }}>
          Form a new team for <strong>{event.name}</strong>. As the creator, you will be the team leader.
        </p>
        <NewTeamClient eventId={eventId} userId={user.id} />
      </div>
    </PageContainer>
  );
}
