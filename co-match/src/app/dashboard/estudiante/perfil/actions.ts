'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export interface StudentProfileInput {
  full_name: string;
  phone: string;
  student_code: string;
  career: string;
  semester: number | null;
  focus: string;
  gpa: number | null;
  availability_hours: number | null;
  skills: string[];
  interests: string[];
  experience: string;
  avatar_url: string | null;
  habilidades?: string[] | string;
  intereses?: string[] | string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone: string;
  student_code: string;
  career: string | null;
  semester: number | null;
  focus: string;
  gpa: number | null;
  availability_hours: number | null;
  skills: string[];
  interests: string[];
  experience: string | null;
  completion: number;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type UpdateProfileResult =
  | { success: true; data: Profile; message: string }
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
    // Log para debugging
    console.log("👉 KEYS RECIBIDAS EN SERVER ACTION:", Object.keys(payload));
    console.log("👉 SKILLS RECIBIDAS:", payload.skills);
    console.log("👉 INTERESTS RECIBIDOS:", payload.interests);

    // Normalizar arrays
    const skillsArray = Array.isArray(payload.skills) ? payload.skills : [];
    const interestsArray = Array.isArray(payload.interests) ? payload.interests : [];

    const profilePayload = {
      id: user.id,
      email: user.email,
      role: 'estudiante',
      full_name: payload.full_name || '',
      phone: payload.phone || '',
      student_code: payload.student_code || '',
      career: payload.career || '',
      semester: payload.semester ? Number(payload.semester) : null,
      focus: payload.focus || '',
      gpa: payload.gpa ? Number(payload.gpa) : null,
      availability_hours: Number(payload.availability_hours || 0),
      skills: skillsArray,
      interests: interestsArray,
      experience: payload.experience || '',
      avatar_url: payload.avatar_url || null,
      updated_at: new Date().toISOString(),
    };

    const { data: savedProfile, error } = await supabase
      .from('profiles')
      .upsert(profilePayload, {
        onConflict: 'id',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ ERROR SUPABASE UPSERT:", error);
      return { success: false, error: error.message };
    }

    console.log("✅ DATO GUARDADO EN SUPABASE (SAVED_PROFILE):", savedProfile);

    revalidatePath('/dashboard/estudiante/perfil', 'page');
    revalidatePath('/dashboard/estudiante/explorar', 'page');

    return { success: true, data: savedProfile as Profile, message: 'Perfil actualizado correctamente' };
  } catch (err) {
    console.error('Unexpected error updating profile:', err);
    return { success: false, error: 'Error inesperado al actualizar perfil' };
  }
}