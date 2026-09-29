import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import RegisterClient from './RegisterClient';

export const metadata: Metadata = { title: 'Register — Dogfood 2026' };
export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  const { user } = await requireUser();
  if (user) {
    redirect('/dashboard');
  }

  return <RegisterClient />;
}
