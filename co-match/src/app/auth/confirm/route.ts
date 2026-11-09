import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { getSupabaseConfig } from '@/lib/supabase/config';
import { homePathForRole, normalizeRole } from '@/lib/auth-roles';
import { profileFieldsFromRegistration } from '@/lib/profile';

/**
 * Destino del enlace del correo de confirmación de cuenta.
 * Soporta el flujo PKCE (?code=) y el de token_hash (?token_hash=&type=).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  const fail = (reason: string) =>
    NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(reason)}`);

  const { isConfigured, url, publishableKey } = getSupabaseConfig();
  if (!isConfigured || !url || !publishableKey) return fail('config');

  const cookieStore = await cookies();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      },
    },
  });

  let authError: { message: string } | null = null;
  if (code) {
    ({ error: authError } = await supabase.auth.exchangeCodeForSession(code));
  } else if (tokenHash && type) {
    ({ error: authError } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash }));
  } else {
    return fail('enlace_invalido');
  }
  if (authError) return fail('enlace_expirado');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail('sin_sesion');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const role = normalizeRole(profile?.role ?? user.user_metadata?.role);

  if (!profile) {
    await supabase.from('profiles').upsert(
      { id: user.id, email: user.email, ...profileFieldsFromRegistration(user.user_metadata), role },
      { onConflict: 'id' },
    );
  }

  return NextResponse.redirect(`${origin}${homePathForRole(role)}`);
}
