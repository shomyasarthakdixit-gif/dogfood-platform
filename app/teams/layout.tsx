import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import BfcacheGuard from '@/components/auth/BfcacheGuard';

export default async function TeamsLayout({ children }: { children: React.ReactNode }) {
  const { user, error } = await requireUser();
  if (error || !user) {
    redirect('/login');
  }

  return (
    <>
      <BfcacheGuard />
      {children}
    </>
  );
}
