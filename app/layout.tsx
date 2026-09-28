import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/layout/Nav';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'Dogfood 2026 — Hackathon Platform',
  description:
    'An open-source, self-hostable hackathon submission and judging platform.',
};

import { getCurrentUser } from '@/lib/auth';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <Nav isLoggedIn={!!user} />
          {children}
          <footer
            style={{
              borderTop: '1px solid var(--color-border)',
              padding: 'var(--space-6) var(--space-6)',
              textAlign: 'center',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-muted)',
              marginTop: 'auto',
            }}
          >
            <p>Dogfood 2026 &mdash; &copy; 2026 Dogfood by BeyondQ</p>
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
