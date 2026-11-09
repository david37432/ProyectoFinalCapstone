'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { computeMatchScore, candidateFromProfiles, vacancySkillsFromRows } from '@/lib/matching';

export interface ApplicationActionResult {
  success: boolean;
  error?: string;
  matchScore?: number;
}

/** El estudiante se postula ("Me interesa") a una vacante publicada. */
export async function applyToVacancyAction(vacancyId: string): Promise<ApplicationActionResult> {
  if (!vacancyId) return { success: false, error: 'Vacante inválida' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Debes iniciar sesión' };

  const { data: vacancy, error: vacancyError } = await supabase
    .from('vacancies')
    .select('id, status, modality, contract_type, pat_hours_per_week, vacancy_skills(skill_id, weight, is_required, skills(name))')
    .eq('id', vacancyId)
    .maybeSingle();

  if (vacancyError) return { success: false, error: vacancyError.message };
  if (!vacancy || vacancy.status !== 'publicada') {
    return { success: false, error: 'La vacante no está disponible para postulaciones' };
  }

  // Habilidades y horas del perfil del estudiante (tabla profiles)
  const { data: studentProfile } = await supabase
    .from('profiles')
    .select('skills, availability_hours')
    .eq('id', user.id)
    .maybeSingle();

  // Datos opcionales: nivel de dominio y preferencias (candidate_profiles)
  const { data: candidateProfile } = await supabase
    .from('candidate_profiles')
    .select('availability_hours_per_week, preferred_modality, preferred_contract_type, candidate_skills(proficiency_level, skills(name))')
    .eq('user_id', user.id)
    .maybeSingle();

  const matchScore = computeMatchScore(
    {
      skills: vacancySkillsFromRows(vacancy.vacancy_skills as any),
      patHoursPerWeek: vacancy.pat_hours_per_week,
      modality: vacancy.modality,
      contractType: vacancy.contract_type,
    },
    candidateFromProfiles(studentProfile as any, candidateProfile as any)
  );

  const { error } = await supabase.from('applications').insert({
    vacancy_id: vacancyId,
    candidate_id: user.id,
    status: 'recibida',
    match_score: matchScore,
  });

  if (error) {
    // 23505 = violación de UNIQUE(vacancy_id, candidate_id): ya estaba postulado
    if (error.code === '23505') return { success: true, matchScore };
    return { success: false, error: `No se pudo registrar la postulación: ${error.message}` };
  }

  revalidatePath('/dashboard/estudiante/explorar');
  revalidatePath('/dashboard/estudiante/mis-apps');
  return { success: true, matchScore };
}

/** El estudiante retira su postulación (solo si aún no ha sido revisada). */
export async function withdrawApplicationAction(vacancyId: string): Promise<ApplicationActionResult> {
  if (!vacancyId) return { success: false, error: 'Vacante inválida' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Debes iniciar sesión' };

  const { data, error } = await supabase
    .from('applications')
    .delete()
    .eq('vacancy_id', vacancyId)
    .eq('candidate_id', user.id)
    .eq('status', 'recibida')
    .select('id');

  if (error) return { success: false, error: `No se pudo retirar la postulación: ${error.message}` };
  if (!data || data.length === 0) {
    return { success: false, error: 'La postulación ya está en revisión y no se puede retirar' };
  }

  revalidatePath('/dashboard/estudiante/explorar');
  revalidatePath('/dashboard/estudiante/mis-apps');
  return { success: true };
}
