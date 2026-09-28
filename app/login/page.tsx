import type { Metadata } from 'next';
import LoginClient from './LoginClient';

export const metadata: Metadata = { title: 'Login — Dogfood 2026' };

export default function LoginPage() {
  return <LoginClient />;
}
