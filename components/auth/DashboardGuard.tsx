'use client';

import { useEffect } from 'react';

export default function DashboardGuard({ wasLoggedIn }: { wasLoggedIn: boolean }) {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        const isLoggedIn = res.ok;
        if (isLoggedIn !== wasLoggedIn) {
          window.location.reload();
        }
      } catch (e) {
        // Ignore network errors
      }
    };

    // Check on mount (handles Next.js client router cache restores)
    checkAuth();

    // Check on BFCache restore (handles browser Back/Forward cache)
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        checkAuth();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [wasLoggedIn]);

  return null;
}
