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

const DEFAULT_CONTRACT_TYPE = 'pasantia';
const DEFAULT_MODALITY = 'hibrido';

/**
 * Publica una necesidad (vacante) y devuelve los candidatos más compatibles.
 * La vacante queda en estado 'en_aprobacion' (pendiente revisión PAT).
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

  // 1. Departamento (debe existir en el catálogo)
  const { data: department, error: deptError } = await supabase
    .from('departments')
    .select('id')
    .eq('name', form.department)
    .maybeSingle();
  if (deptError) return { success: false, error: `Error consultando el departamento: ${deptError.message}` };
  if (!department) {
    return { success: false, error: `El departamento "${form.department}" no existe en la base de datos` };
  }

  // 2. Habilidades: obtener ids (crear las que falten)
  const skillIds = await resolveSkillIds(supabase, form.skills);
  if ('error' in skillIds) return { success: false, error: skillIds.error };

  // 3. Crear la vacante
  const closingDate = new Date();
  closingDate.setMonth(closingDate.getMonth() + form.durationMonths);

  const { data: vacancy, error: vacancyError } = await supabase
    .from('vacancies')
    .insert({
      title: form.title,
      description: form.description,
      requirements: `Duración estimada: ${form.durationMonths} mes(es)`,
      contract_type: DEFAULT_CONTRACT_TYPE,
      modality: DEFAULT_MODALITY,
      pat_hours_per_week: form.weeklyHours,
      department_id: department.id,
      created_by: user.id,
      status: 'en_aprobacion',
      closing_date: closingDate.toISOString(),
    })
    .select('id')
    .single();

  if (vacancyError || !vacancy) {
    return { success: false, error: `No se pudo publicar la necesidad: ${vacancyError?.message ?? 'error desconocido'}` };
  }

  // 4. Habilidades de la vacante
  const { error: vsError } = await supabase.from('vacancy_skills').insert(
    skillIds.ids.map((skill_id) => ({ vacancy_id: vacancy.id, skill_id, is_required: true, weight: 1 }))
  );
  if (vsError) {
    // Revertir para no dejar una vacante sin habilidades
    await supabase.from('vacancies').delete().eq('id', vacancy.id);
    return { success: false, error: `No se pudieron guardar las habilidades: ${vsError.message}` };
  }

  // 5. Matching de candidatos
  const candidates = await findMatchingCandidates(supabase, {
    skillNames: form.skills,
    weeklyHours: form.weeklyHours,
  });

  revalidatePath('/dashboard/dependencia');
  return { success: true, vacancyId: vacancy.id, candidates };
}

type ServerClient = Awaited<ReturnType<typeof createClient>>;

async function resolveSkillIds(
  supabase: ServerClient,
  names: string[]
): Promise<{ ids: string[]; nameById: Map<string, string> } | { error: string }> {
  const { data: existing, error } = await supabase.from('skills').select('id, name').in('name', names);
  if (error) return { error: `Error consultando habilidades: ${error.message}` };

  const nameById = new Map<string, string>();
  const found = new Set<string>();
  for (const s of existing ?? []) {
    nameById.set(s.id, s.name);
    found.add(s.name);
  }

  const missing = names.filter((n) => !found.has(n));
  if (missing.length > 0) {
    const { data: created, error: insertError } = await supabase
      .from('skills')
      .insert(missing.map((name) => ({ name, is_technical: true })))
      .select('id, name');
    if (insertError) return { error: `No se pudieron registrar las habilidades: ${insertError.message}` };
    for (const s of created ?? []) nameById.set(s.id, s.name);
  }

  return { ids: Array.from(nameById.keys()), nameById };
}

interface CandidateRow extends MatchCandidate {
  userId: string;
  fullName: string;
}

async function findMatchingCandidates(
  supabase: ServerClient,
  params: { skillNames: string[]; weeklyHours: number },
  limit = 5
): Promise<MatchedCandidate[]> {
  // Los estudiantes guardan sus habilidades en profiles.skills (texto)
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, skills, availability_hours, role')
    .in('role', ['estudiante', 'postulante']);

  if (error || !data) {
    console.warn('[matching] No se pudieron obtener candidatos:', error?.message);
    return [];
  }

  const candidates: CandidateRow[] = data.map((row: any) => ({
    userId: row.id,
    fullName: row.full_name || 'Sin nombre',
    ...candidateFromProfiles(row),
  }));

  const displayName = new Map(params.skillNames.map((n) => [skillKey(n), n]));

  const ranked = rankCandidates(
    {
      skills: params.skillNames.map((n) => ({ skillId: skillKey(n) })),
      patHoursPerWeek: params.weeklyHours,
      modality: DEFAULT_MODALITY,
      contractType: DEFAULT_CONTRACT_TYPE,
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
