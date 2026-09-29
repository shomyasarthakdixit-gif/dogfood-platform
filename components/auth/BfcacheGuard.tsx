'use client';

import { useEffect } from 'react';

export default function BfcacheGuard() {
  useEffect(() => {
    const handlePageShow = async (event: PageTransitionEvent) => {
      // If the page is restored from bfcache
      if (event.persisted) {
        try {
          const res = await fetch('/api/auth/me', { cache: 'no-store' });
          if (!res.ok) {
            window.location.reload();
          }
        } catch (e) {
          window.location.reload();
        }
      }
    };
    
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);
  
  return null;
}
