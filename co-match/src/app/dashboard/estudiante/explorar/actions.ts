'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { computeMatchScore, candidateFromProfiles, skillKey } from '@/lib/matching';
import { opportunityPhase, parseSkillList, newApplicationRow, canWithdraw } from '@/lib/data/model';

export interface ApplicationActionResult {
  success: boolean;
  error?: string;
  matchScore?: number;
}

/** El estudiante se postula ("Me interesa") a una necesidad publicada. */
export async function applyToVacancyAction(vacancyId: string): Promise<ApplicationActionResult> {
  if (!vacancyId) return { success: false, error: 'Necesidad inválida' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Debes iniciar sesión' };

  const { data: opportunity, error: oppError } = await supabase
    .from('opportunities')
    .select('id, status, required_skills, weekly_hours')
    .eq('id', vacancyId)
    .maybeSingle();

  if (oppError) return { success: false, error: oppError.message };
  if (!opportunity || opportunityPhase(opportunity.status) !== 'published') {
    return { success: false, error: 'La necesidad no está disponible para postulaciones' };
  }

  const { data: studentProfile } = await supabase
    .from('profiles')
    .select('skills, availability_hours')
    .eq('id', user.id)
    .maybeSingle();

  const matchScore = computeMatchScore(
    {
      skills: parseSkillList(opportunity.required_skills).map((n) => ({ skillId: skillKey(n) })),
      patHoursPerWeek: opportunity.weekly_hours,
    },
    candidateFromProfiles(studentProfile)
  );

  const { error } = await supabase.from('applications').insert(newApplicationRow(vacancyId, user.id, matchScore));

  if (error) {
    // 23505 = ya existía la postulación (si hay índice único)
    if (error.code === '23505') return { success: true, matchScore };
    return { success: false, error: `No se pudo registrar la postulación: ${error.message}` };
  }

  revalidatePath('/dashboard/estudiante/explorar');
  revalidatePath('/dashboard/estudiante/mis-apps');
  return { success: true, matchScore };
}

/** El estudiante retira su postulación (solo si la dependencia aún no respondió). */
export async function withdrawApplicationAction(vacancyId: string): Promise<ApplicationActionResult> {
  if (!vacancyId) return { success: false, error: 'Necesidad inválida' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Debes iniciar sesión' };

  const { data: apps, error: readError } = await supabase
    .from('applications')
    .select('id, dependency_status, is_match')
    .eq('opportunity_id', vacancyId)
    .eq('student_id', user.id);

  if (readError) return { success: false, error: readError.message };
  if (!apps || apps.length === 0) return { success: true };
  if (!apps.every(canWithdraw)) {
    return { success: false, error: 'La dependencia ya respondió tu postulación; no se puede retirar' };
  }

  const { error } = await supabase
    .from('applications')
    .delete()
    .in('id', apps.map((a: { id: string }) => a.id));

  if (error) return { success: false, error: `No se pudo retirar la postulación: ${error.message}` };

  revalidatePath('/dashboard/estudiante/explorar');
  revalidatePath('/dashboard/estudiante/mis-apps');
  return { success: true };
}
