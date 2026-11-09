import { PAT_MAX_HOURS } from './profile';

/**
 * Algoritmo de matching de Co-Match.
 *
 * Calcula un puntaje de 0 a 100 entre un candidato y una vacante.
 * Es una función pura (sin acceso a la base de datos) para poder
 * probarla con tests unitarios y reutilizarla en servidor y cliente.
 *
 * Pesos:
 *   - Habilidades (70 pts): cobertura ponderada de las habilidades de la
 *     vacante, ajustada por el nivel de dominio del candidato.
 *   - Disponibilidad (20 pts): horas semanales del candidato vs. horas PAT.
 *   - Preferencias (10 pts): modalidad (6) y tipo de contrato (4).
 */

export type Proficiency = 'basico' | 'intermedio' | 'avanzado';

export interface MatchVacancySkill {
  skillId: string;
  /** Importancia de la habilidad (1-10). Por defecto 1. */
  weight?: number;
  /** Si es obligatoria. Las opcionales cuentan la mitad. Por defecto true. */
  isRequired?: boolean;
}

export interface MatchVacancy {
  skills: MatchVacancySkill[];
  patHoursPerWeek?: number | null;
  modality?: string | null;
  contractType?: string | null;
}

export interface MatchCandidateSkill {
  skillId: string;
  proficiency?: Proficiency | string | null;
}

export interface MatchCandidate {
  skills: MatchCandidateSkill[];
  availabilityHoursPerWeek?: number | null;
  preferredModality?: string | null;
  preferredContractType?: string | null;
}

export interface MatchBreakdown {
  score: number;
  skills: number;
  availability: number;
  preferences: number;
  matchedSkillIds: string[];
  missingSkillIds: string[];
}

export const MATCH_WEIGHTS = {
  skills: 70,
  availability: 20,
  modality: 6,
  contract: 4,
} as const;

const PROFICIENCY_FACTOR: Record<Proficiency, number> = {
  basico: 0.6,
  intermedio: 0.85,
  avanzado: 1,
};

/**
 * Factor por nivel de dominio. Si no se conoce (el perfil solo guarda el
 * nombre de la habilidad) no se penaliza: factor 1.
 */
export function proficiencyFactor(level?: string | null): number {
  if (level && level in PROFICIENCY_FACTOR) {
    return PROFICIENCY_FACTOR[level as Proficiency];
  }
  return 1;
}

function clampWeight(weight?: number): number {
  if (typeof weight !== 'number' || Number.isNaN(weight)) return 1;
  return Math.min(10, Math.max(1, weight));
}

function skillsScore(vacancy: MatchVacancy, candidate: MatchCandidate) {
  const candidateMap = new Map<string, MatchCandidateSkill>();
  for (const cs of candidate.skills) candidateMap.set(cs.skillId, cs);

  // Deduplicar habilidades de la vacante
  const vacancySkills = new Map<string, MatchVacancySkill>();
  for (const vs of vacancy.skills) vacancySkills.set(vs.skillId, vs);

  const matched: string[] = [];
  const missing: string[] = [];

  if (vacancySkills.size === 0) {
    // Sin habilidades definidas no se puede discriminar: puntaje neutro.
    return { points: MATCH_WEIGHTS.skills / 2, matched, missing };
  }

  let total = 0;
  let earned = 0;
  for (const vs of vacancySkills.values()) {
    const importance = clampWeight(vs.weight) * (vs.isRequired === false ? 0.5 : 1);
    total += importance;
    const cs = candidateMap.get(vs.skillId);
    if (cs) {
      earned += importance * proficiencyFactor(cs.proficiency);
      matched.push(vs.skillId);
    } else {
      missing.push(vs.skillId);
    }
  }

  return { points: (earned / total) * MATCH_WEIGHTS.skills, matched, missing };
}

function availabilityScore(vacancy: MatchVacancy, candidate: MatchCandidate): number {
  const required = vacancy.patHoursPerWeek;
  const available = candidate.availabilityHoursPerWeek;
  if (!required || required <= 0) return MATCH_WEIGHTS.availability;
  if (available == null || available < 0) return MATCH_WEIGHTS.availability / 2;
  return Math.min(1, available / required) * MATCH_WEIGHTS.availability;
}

function preferenceMatches(preferred?: string | null, actual?: string | null): number {
  if (!preferred || preferred === 'cualquiera') return 1;
  if (!actual) return 0.5;
  return preferred === actual ? 1 : 0;
}

function preferencesScore(vacancy: MatchVacancy, candidate: MatchCandidate): number {
  return (
    preferenceMatches(candidate.preferredModality, vacancy.modality) * MATCH_WEIGHTS.modality +
    preferenceMatches(candidate.preferredContractType, vacancy.contractType) * MATCH_WEIGHTS.contract
  );
}

/** Calcula el puntaje de compatibilidad con su desglose. */
export function computeMatch(vacancy: MatchVacancy, candidate: MatchCandidate): MatchBreakdown {
  const skills = skillsScore(vacancy, candidate);
  const availability = availabilityScore(vacancy, candidate);
  const preferences = preferencesScore(vacancy, candidate);
  const score = Math.round(Math.min(100, Math.max(0, skills.points + availability + preferences)));

  return {
    score,
    skills: Math.round(skills.points),
    availability: Math.round(availability),
    preferences: Math.round(preferences),
    matchedSkillIds: skills.matched,
    missingSkillIds: skills.missing,
  };
}

/** Atajo: solo el puntaje 0-100. */
export function computeMatchScore(vacancy: MatchVacancy, candidate: MatchCandidate): number {
  return computeMatch(vacancy, candidate).score;
}

export interface RankedCandidate<T> {
  candidate: T;
  match: MatchBreakdown;
}

/**
 * Ordena candidatos por compatibilidad (mayor a menor) y filtra
 * los que no alcanzan el puntaje mínimo.
 */
export function rankCandidates<T extends MatchCandidate>(
  vacancy: MatchVacancy,
  candidates: T[],
  options: { minScore?: number; limit?: number } = {}
): RankedCandidate<T>[] {
  const { minScore = 0, limit } = options;
  const ranked = candidates
    .map((candidate) => ({ candidate, match: computeMatch(vacancy, candidate) }))
    .filter((r) => r.match.score >= minScore)
    .sort((a, b) => b.match.score - a.match.score || b.match.matchedSkillIds.length - a.match.matchedSkillIds.length);
  return typeof limit === 'number' ? ranked.slice(0, limit) : ranked;
}

/** Normaliza relaciones de Supabase que pueden venir como objeto o arreglo. */
export function firstOf<T>(value: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(value)) return value[0];
  return value ?? undefined;
}

/** Valida y normaliza los datos del formulario de publicación. */
export interface VacancyFormInput {
  title: string;
  department: string;
  description: string;
  skills: string[];
  weeklyHours: string | number;
  durationMonths: string | number;
}

export interface ValidVacancyForm {
  title: string;
  department: string;
  description: string;
  skills: string[];
  weeklyHours: number;
  durationMonths: number;
}

export function validateVacancyForm(
  input: VacancyFormInput
): { ok: true; data: ValidVacancyForm } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const title = (input.title ?? '').trim();
  const department = (input.department ?? '').trim();
  const description = (input.description ?? '').trim();
  const skills = Array.from(new Set((input.skills ?? []).map((s) => s.trim()).filter(Boolean)));
  const weeklyHours = Number(input.weeklyHours);
  const durationMonths = Number(input.durationMonths);

  if (!title) errors.title = 'El título es obligatorio';
  else if (title.length > 200) errors.title = 'El título no puede superar 200 caracteres';
  if (!department) errors.department = 'El área/departamento es obligatorio';
  if (!description) errors.description = 'La descripción es obligatoria';
  if (skills.length === 0) errors.skills = 'Debe seleccionar al menos una habilidad';
  if (!Number.isInteger(weeklyHours) || weeklyHours < 1 || weeklyHours > PAT_MAX_HOURS)
    errors.weeklyHours = `Las horas semanales deben estar entre 1 y ${PAT_MAX_HOURS} (máximo PAT)`;
  if (!Number.isInteger(durationMonths) || durationMonths < 1 || durationMonths > 24)
    errors.durationMonths = 'La duración debe estar entre 1 y 24 meses';

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, data: { title, department, description, skills, weeklyHours, durationMonths } };
}

// ---------------------------------------------------------------------------
// Adaptadores: el perfil del estudiante guarda las habilidades como texto
// en `profiles.skills` (y opcionalmente en candidate_skills). El matching se
// hace por NOMBRE de habilidad normalizado para que ambas fuentes coincidan.
// ---------------------------------------------------------------------------

/** Clave normalizada de una habilidad: "  Power BI " → "power bi". */
export function skillKey(name: string | null | undefined): string {
  return (name ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

interface VacancySkillRow {
  skill_id?: string;
  weight?: number | null;
  is_required?: boolean | null;
  skills?: { name: string } | { name: string }[] | null;
}

/** Convierte las filas vacancy_skills(…, skills(name)) a habilidades por nombre. */
export function vacancySkillsFromRows(rows: VacancySkillRow[] | null | undefined): MatchVacancySkill[] {
  return (rows ?? [])
    .map((vs) => {
      const name = firstOf(vs.skills)?.name;
      return {
        skillId: name ? skillKey(name) : (vs.skill_id ?? ''),
        weight: vs.weight ?? 1,
        isRequired: vs.is_required ?? true,
      };
    })
    .filter((s) => s.skillId);
}

export interface StudentProfileRow {
  skills?: string[] | null;
  availability_hours?: number | null;
}

export interface CandidateProfileRow {
  availability_hours_per_week?: number | null;
  preferred_modality?: string | null;
  preferred_contract_type?: string | null;
  candidate_skills?: { proficiency_level?: string | null; skills?: { name: string } | { name: string }[] | null }[] | null;
}

/**
 * Arma el candidato para el matching uniendo `profiles` (habilidades como
 * texto y horas) con `candidate_profiles` (nivel de dominio y preferencias).
 */
export function candidateFromProfiles(
  profile: StudentProfileRow | null | undefined,
  candidateProfile?: CandidateProfileRow | null
): MatchCandidate {
  const skills = new Map<string, MatchCandidateSkill>();

  for (const cs of candidateProfile?.candidate_skills ?? []) {
    const key = skillKey(firstOf(cs.skills)?.name);
    if (key) skills.set(key, { skillId: key, proficiency: cs.proficiency_level });
  }
  for (const name of profile?.skills ?? []) {
    const key = skillKey(name);
    if (key && !skills.has(key)) skills.set(key, { skillId: key, proficiency: null });
  }

  return {
    skills: Array.from(skills.values()),
    availabilityHoursPerWeek: profile?.availability_hours ?? candidateProfile?.availability_hours_per_week ?? null,
    preferredModality: candidateProfile?.preferred_modality ?? null,
    preferredContractType: candidateProfile?.preferred_contract_type ?? null,
  };
}
