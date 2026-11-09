'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { getSupabaseConfig } from '@/lib/supabase/config';
import { toProfileRole, homePathForRole } from '@/lib/auth-roles';
import { siteUrlFrom } from '@/lib/site-url';

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  document_number: string;
  phone: string;
  role: 'postulante' | 'reclutador';
}

export interface RegisterResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
  /** true si Supabase exige confirmar el correo antes de iniciar sesión */
  needsEmailConfirmation?: boolean;
}

async function getSiteUrl(): Promise<string> {
  const h = await headers();
  return siteUrlFrom({
    envUrl: process.env.NEXT_PUBLIC_SITE_URL,
    vercelHost: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    origin: h.get('origin'),
    host: h.get('x-forwarded-host') ?? h.get('host'),
    proto: h.get('x-forwarded-proto'),
  });
}

/** Traduce errores comunes de Supabase Auth a mensajes claros. */
function friendlySignUpError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('rate limit')) {
    return 'Se enviaron demasiados correos de confirmación. Espera unos minutos e inténtalo de nuevo.';
  }
  if (m.includes('already registered')) return 'Este correo ya está registrado';
  if (m.includes('error sending') || m.includes('smtp')) {
    return 'No se pudo enviar el correo de confirmación. Contacta al administrador.';
  }
  return message;
}

export async function registerAction(payload: RegisterPayload): Promise<RegisterResult> {
  const { isConfigured, url, publishableKey } = getSupabaseConfig();
  if (!isConfigured || !url || !publishableKey) {
    return { success: false, error: 'La configuración de Supabase no está disponible. Contacta al administrador.' };
  }

  // Validaciones
  if (!payload.email || !payload.password || !payload.full_name) {
    return { success: false, error: 'Todos los campos son requeridos' };
  }

  if (payload.password.length < 8) {
    return { success: false, error: 'La contraseña debe tener al menos 8 caracteres' };
  }

  const email = payload.email.trim().toLowerCase();
  if (!email.endsWith('@unisabana.edu.co')) {
    return { success: false, error: 'El correo debe ser institucional (@unisabana.edu.co)' };
  }

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(url, publishableKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Ignorar errores en Server Actions
          }
        },
      },
    });

    // 1. Crear usuario en Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password: payload.password,
      options: {
        // Al confirmar el correo, Supabase vuelve a /auth/confirm (ver confirm/route.ts)
        emailRedirectTo: `${await getSiteUrl()}/auth/confirm`,
        data: {
          full_name: payload.full_name.trim(),
          // El formulario pide el código estudiantil en el campo document_number
          student_code: payload.document_number?.trim() ?? '',
          phone: payload.phone?.trim() ?? '',
          role: payload.role,
        },
      },
    });

    if (signUpError) {
      return { success: false, error: friendlySignUpError(signUpError.message) };
    }

    if (!data.user) {
      return { success: false, error: 'Error al crear la cuenta' };
    }

    if (data.user.identities?.length === 0) {
      return { success: false, error: 'Este correo ya está registrado' };
    }

    const roleForProfile = toProfileRole(payload.role);

    // Si "Confirm email" está activo en Supabase no hay sesión todavía:
    // el perfil se crea al confirmar (/auth/confirm) o en el primer login.
    if (!data.session) {
      return { success: true, needsEmailConfirmation: true };
    }

    // Insertar o actualizar explícitamente la tabla profiles
    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: data.user.id,
        email: data.user.email,
        full_name: payload.full_name.trim(),
        phone: payload.phone?.trim() ?? '',
        student_code: payload.document_number?.trim() ?? '',
        role: roleForProfile,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id', ignoreDuplicates: false },
    );

    if (profileError) {
      console.warn('Profile upsert warning (non-blocking):', profileError.message);
    }

    return { success: true, redirectTo: homePathForRole(roleForProfile) };
  } catch (err) {
    console.error('Unexpected error during registration:', err);
    return { success: false, error: 'Error inesperado al registrar usuario' };
  }
}
