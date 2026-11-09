'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSupabaseConfig } from '@/lib/supabase/config';
import { toProfileRole, homePathForRole } from '@/lib/auth-roles';

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

export async function registerAction(payload: RegisterPayload): Promise<RegisterResult> {
  const { isConfigured, url, publishableKey } = getSupabaseConfig();
  if (!isConfigured || !url || !publishableKey) {
    return { success: false, error: 'La configuración de Supabase no está disponible. Contacta al administrador.' };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    url,
    publishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignorar errores en Server Actions
          }
        },
      },
    }
  );

  // Validaciones
  if (!payload.email || !payload.password || !payload.full_name) {
    return { success: false, error: 'Todos los campos son requeridos' };
  }

  if (payload.password.length < 8) {
    return { success: false, error: 'La contraseña debe tener al menos 8 caracteres' };
  }

  if (!payload.email.endsWith('@unisabana.edu.co')) {
    return { success: false, error: 'El correo debe ser institucional (@unisabana.edu.co)' };
  }

  try {
    const supabase = createServerClient(
      url,
      publishableKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignorar errores en Server Actions
            }
          },
        },
      }
    );

    // 1. Crear usuario en Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          full_name: payload.full_name,
          document_number: '',
          phone: '',
role: payload.role,
},
      },
    });

    if (signUpError) {
      return { success: false, error: signUpError.message };
    }

    if (!data.user) {
      return { success: false, error: 'Error al crear la cuenta' };
    }

    if (data.user.identities?.length === 0) {
      return { success: false, error: 'Este correo ya está registrado' };
    }

    const roleForProfile = toProfileRole(payload.role);

    // Si "Confirm email" está activo en Supabase no hay sesión todavía:
    // el perfil se crea en el primer login (loginAction) y no se puede entrar al dashboard.
    if (!data.session) {
      return { success: true, needsEmailConfirmation: true };
    }

    // Insertar o actualizar explícitamente la tabla profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: data.user.id,
        email: data.user.email,
        full_name: payload.full_name,
        role: roleForProfile,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      });

    if (profileError) {
      console.warn('Profile upsert warning (non-blocking):', profileError.message);
    }

    // Determinar redirección según el rol
    const redirectTo = homePathForRole(roleForProfile);

    return { success: true, redirectTo };

  } catch (err) {
    console.error('Unexpected error during registration:', err);
    return { success: false, error: 'Error inesperado al registrar usuario' };
  }
}