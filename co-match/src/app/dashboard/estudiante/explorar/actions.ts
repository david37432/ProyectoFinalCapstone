'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { computeMatchScore } from '@/lib/matching';

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
    .select('id, status, modality, contract_type, pat_hours_per_week, vacancy_skills(skill_id, weight, is_required)')
    .eq('id', vacancyId)
    .maybeSingle();

  if (vacancyError) return { success: false, error: vacancyError.message };
  if (!vacancy || vacancy.status !== 'publicada') {
    return { success: false, error: 'La vacante no está disponible para postulaciones' };
  }

  const { data: profile } = await supabase
    .from('candidate_profiles')
    .select('id, availability_hours_per_week, preferred_modality, preferred_contract_type, candidate_skills(skill_id, proficiency_level)')
    .eq('user_id', user.id)
    .maybeSingle();

  const matchScore = computeMatchScore(
    {
      skills: (vacancy.vacancy_skills ?? []).map((vs: any) => ({
        skillId: vs.skill_id,
        weight: vs.weight ?? 1,
        isRequired: vs.is_required ?? true,
      })),
      patHoursPerWeek: vacancy.pat_hours_per_week,
      modality: vacancy.modality,
      contractType: vacancy.contract_type,
    },
    {
      skills: ((profile as any)?.candidate_skills ?? []).map((cs: any) => ({
        skillId: cs.skill_id,
        proficiency: cs.proficiency_level,
      })),
      availabilityHoursPerWeek: profile?.availability_hours_per_week ?? null,
      preferredModality: profile?.preferred_modality ?? null,
      preferredContractType: profile?.preferred_contract_type ?? null,
    }
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
