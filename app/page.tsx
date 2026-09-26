import { redirect } from 'next/navigation';

/**
 * Root route — redirects to the events page.
 * The home page serves as the public entry point for the platform.
 */
export default function Home() {
  redirect('/events');
}
