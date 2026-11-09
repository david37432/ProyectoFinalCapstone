'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseConfig } from '@/lib/supabase/config';
import { normalizeRole, homePathForRole, type ProfileRole } from '@/lib/auth-roles';

export interface LoginResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

export async function loginAction(formData: FormData): Promise<LoginResult> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Correo y contraseña son requeridos' };
  }

  if (!email.endsWith('@unisabana.edu.co')) {
    return { success: false, error: 'El correo debe ser institucional (@unisabana.edu.co)' };
  }

  const { isConfigured, url, publishableKey } = getSupabaseConfig();
  if (!isConfigured || !url || !publishableKey) {
    return { success: false, error: 'La configuración de Supabase no está disponible. Contacta al administrador.' };
  }

  // Crear cliente con cookies para que se persistan correctamente
  const cookieStore = await cookies();
  const supabase = createServerClient(
    url,
    publishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: Parameters<typeof cookieStore.set>[2] }>) {
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

  // Paso A: Autenticación con Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const message = error.message;
    console.error('Error de Supabase Auth:', error);

    if (message.includes('Invalid login credentials') || message.includes('Invalid credentials')) {
      return { success: false, error: 'Correo o contraseña incorrectos.' };
    }
    if (message.includes('Email not confirmed')) {
      return { success: false, error: 'Tu correo aún no ha sido confirmado. Por favor revisa tu bandeja de entrada o desactiva "Confirm email" en Supabase.' };
    }
    if (message.includes('Invalid email or password')) {
      return { success: false, error: 'Correo o contraseña incorrectos.' };
    }

    return { success: false, error: message };
  }

  if (!data.user) {
    return { success: false, error: 'Error al iniciar sesión' };
  }

  // Paso B: Obtención / Creación de Perfil (Resiliente a registros antiguos)
  // En la BD el rol puede venir como 'postulante', 'estudiante', 'reclutador', etc.
  let role: ProfileRole = normalizeRole(data.user.user_metadata?.role);

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profile && !profileError) {
      role = normalizeRole(profile.role);
    } else {
      // Si el perfil no existe (p. ej. el registro no pudo crearlo por RLS), crearlo ahora que hay sesión
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          email: data.user.email || email,
          full_name: data.user.user_metadata?.full_name || '',
          role,
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        });

      if (upsertError) {
        console.warn('Perfil upsert warning (non-blocking):', upsertError.message);
      }
    }
  } catch (err) {
    console.warn('Error consultando profiles, usando metadata:', err);
  }

  // Obtener el role_id correspondiente en la tabla roles
  let roleId: string | null = null;
  if (role === 'dependencia') {
    const { data: roleData } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'dependencia')
      .single();
    roleId = roleData?.id || null;
  } else if (role === 'estudiante') {
    const { data: roleData } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'postulante')
      .single();
    roleId = roleData?.id || null;
  }

  // Actualizar también la tabla users con el role_id correcto
  if (roleId) {
    await supabase
      .from('users')
      .update({ role_id: roleId })
      .eq('id', data.user.id);
  }

  return {
    success: true,
    redirectTo: homePathForRole(role),
  };
}

export async function logoutAction(): Promise<{ success: boolean; error?: string }> {
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
        setAll(cookiesToSet: Array<{ name: string; value: string; options: Parameters<typeof cookieStore.set>[2] }>) {
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

  const { error } = await supabase.auth.signOut();
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}