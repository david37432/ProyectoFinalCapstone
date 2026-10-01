'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

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

  // Crear cliente con cookies para que se persistan correctamente
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: any }>) {
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
  let role = 'estudiante';

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();

    // Si el perfil no existe o hay error, crearlo automáticamente
    if (profileError || !profile) {
      const roleFromMetadata = data.user.user_metadata?.role;

      if (roleFromMetadata === 'reclutador' || roleFromMetadata === 'dependencia') {
        role = 'dependencia';
      } else if (roleFromMetadata === 'administrador' || roleFromMetadata === 'admin') {
        role = 'dependencia';
      }

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
    } else {
      // Perfil existe, usar su rol
      role = profile.role;
    }
  } catch (err) {
    // Manejo tolerante a fallos: si falla la tabla profiles (ej. cache de esquema)
    console.warn('Error consultando profiles, usando metadata:', err);
    const roleFromMetadata = data.user.user_metadata?.role;
    if (roleFromMetadata === 'reclutador' || roleFromMetadata === 'dependencia') {
      role = 'dependencia';
    } else if (roleFromMetadata === 'administrador' || roleFromMetadata === 'admin') {
      role = 'dependencia';
    }
  }

  // Paso C: Redirección por Rol - usar redirect() para forzar commit de cookies
  if (role === 'estudiante') {
    redirect('/dashboard/estudiante/explorar');
  } else {
    redirect('/dashboard/dependencia');
  }
}

export async function logoutAction(): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: any }>) {
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