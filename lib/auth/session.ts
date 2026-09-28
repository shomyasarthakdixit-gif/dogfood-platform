import { Session } from '@/lib/types';

/**
 * Get the current session from the request cookies.
 * Returns null when no auth system is present yet.
 *
 * TODO: Replace this stub with real session lookup once
 * feature/core-backend auth is merged into main.
 */
export async function getSession(): Promise<Session | null> {
  // Auth system integration point.
  // When core-backend auth is merged, implement cookie-based session lookup here.
  return null;
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}
