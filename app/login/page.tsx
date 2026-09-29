import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import LoginClient from './LoginClient';

export const metadata: Metadata = { title: 'Login — Dogfood 2026' };
export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const { user } = await requireUser();
  if (user) {
    redirect('/dashboard');
  }

  return <LoginClient />;
}
