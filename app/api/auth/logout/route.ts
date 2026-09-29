/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteSession } from '@/lib/auth';

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get('dogfood_session')?.value;
  
  if (token) {
    await deleteSession(token);
  }
  cookieStore.delete('dogfood_session');
  
  return NextResponse.json({ status: 'ok' });
}

