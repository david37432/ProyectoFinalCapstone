'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export interface StudentProfileInput {
  full_name: string;
  career: string;
  experience: string;
  availability_hours: number | null;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  career: string | null;
  experience: string | null;
  availability_hours: number | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type UpdateProfileResult =
  | { success: true; data: Profile }
  | { success: false; error: string };

export async function updateStudentProfile(payload: StudentProfileInput): Promise<UpdateProfileResult> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'No autenticado' };
  }

  try {
    const profilePayload = {
      id: user.id,
      email: user.email,
      full_name: payload.full_name,
      career: payload.career,
      experience: payload.experience,
      availability_hours: payload.availability_hours,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(profilePayload, {
        onConflict: 'id',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting profile:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return { success: false, error: 'No se pudo guardar el perfil' };
    }

    revalidatePath('/dashboard/estudiante/perfil');
    revalidatePath('/dashboard/estudiante');

    return { success: true, data: data as Profile };
  } catch (err) {
    console.error('Unexpected error updating profile:', err);
    return { success: false, error: 'Error inesperado al actualizar perfil' };
  }
}