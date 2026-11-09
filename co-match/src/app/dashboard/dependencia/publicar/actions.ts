'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  candidateFromProfiles,
  skillKey,
  rankCandidates,
  validateVacancyForm,
  type MatchCandidate,
  type VacancyFormInput,
} from '@/lib/matching';
import { OPPORTUNITY_STATUS } from '@/lib/data/model';
import { normalizeRole } from '@/lib/auth-roles';

export interface MatchedCandidate {
  userId: string;
  fullName: string;
  score: number;
  matchedSkills: string[];
}

export interface PublishVacancyResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  vacancyId?: string;
  candidates?: MatchedCandidate[];
}

/**
 * Publica una necesidad en la tabla `opportunities` y devuelve los
 * estudiantes más compatibles. Queda PUBLICADA de inmediato para que los
 * estudiantes la vean en Explorar (aún no existe la pantalla de revisión PAT;
 * cuando exista, cambiar a OPPORTUNITY_STATUS.PENDING).
 */
export async function publishVacancyAction(input: VacancyFormInput): Promise<PublishVacancyResult> {
  const validation = validateVacancyForm(input);
  if (!validation.ok) {
    return { success: false, error: 'Revisa los campos del formulario', fieldErrors: validation.errors };
  }
  const form = validation.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Debes iniciar sesión para publicar una necesidad' };

  const { data: opportunity, error } = await supabase
    .from('opportunities')
    .insert({
      dependency_id: user.id,
      title: form.title,
      description: form.description,
      area: form.department,
      required_skills: form.skills,
      weekly_hours: form.weeklyHours,
      duration_months: form.durationMonths,
      status: OPPORTUNITY_STATUS.PUBLISHED,
      logged_hours: 0,
    })
    .select('id')
    .single();

  if (error || !opportunity) {
    return { success: false, error: `No se pudo publicar la necesidad: ${error?.message ?? 'error desconocido'}` };
  }

  const candidates = await findMatchingCandidates(supabase, {
    skillNames: form.skills,
    weeklyHours: form.weeklyHours,
  });

  revalidatePath('/dashboard/dependencia');
  revalidatePath('/dashboard/estudiante/explorar');
  return { success: true, vacancyId: opportunity.id, candidates };
}

type ServerClient = Awaited<ReturnType<typeof createClient>>;

interface CandidateRow extends MatchCandidate {
  userId: string;
  fullName: string;
}

async function findMatchingCandidates(
  supabase: ServerClient,
  params: { skillNames: string[]; weeklyHours: number },
  limit = 5
): Promise<MatchedCandidate[]> {
  // Los estudiantes guardan sus habilidades en profiles.skills
  const { data, error } = await supabase.from('profiles').select('id, full_name, skills, availability_hours, role');

  if (error || !data) {
    console.warn('[matching] No se pudieron obtener candidatos:', error?.message);
    return [];
  }

  const candidates: CandidateRow[] = data
    .filter((row: any) => normalizeRole(row.role) === 'estudiante')
    .map((row: any) => ({
      userId: row.id,
      fullName: row.full_name || 'Sin nombre',
      ...candidateFromProfiles(row),
    }));

  const displayName = new Map(params.skillNames.map((n) => [skillKey(n), n]));

  const ranked = rankCandidates(
    {
      skills: params.skillNames.map((n) => ({ skillId: skillKey(n) })),
      patHoursPerWeek: params.weeklyHours,
    },
    candidates,
    { minScore: 40, limit }
  );

  return ranked.map(({ candidate, match }) => ({
    userId: candidate.userId,
    fullName: candidate.fullName,
    score: match.score,
    matchedSkills: match.matchedSkillIds.map((id) => displayName.get(id) ?? id),
  }));
}
