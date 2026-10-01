'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        router.push('/auth/reset-password');
      } else if (event === 'TOKEN_REFRESHED' && session) {
        router.push('/auth/reset-password');
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4" aria-label="CO-MATCH Home">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-2xl">CM</span>
            </div>
            <span className="font-bold text-2xl text-neutral-900">CO-MATCH</span>
          </Link>
          <div className="w-8 h-8 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center animate-spin">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="text-neutral-600">Procesando enlace de recuperación...</p>
        </div>
      </div>
    </div>
  );
}