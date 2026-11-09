/**
 * Modelo de datos REAL de Co-Match en Supabase (tablas existentes):
 *
 *  opportunities       id, dependency_id, title, description, required_skills (jsonb),
 *                      weekly_hours, status, area, duration_months, start_date,
 *                      target_end_date, logged_hours, satisfaction_rating, created_at, updated_at
 *  applications        id, opportunity_id, student_id, match_score, student_status,
 *                      dependency_status, pat_status, is_match, created_at
 *  conversations       id, opportunity_id, dependency_id, student_id, last_message,
 *                      last_message_at, unread_dependency_count, unread_student_count, created_at
 *  messages            id, conversation_id, sender_id, content, is_read, created_at
 *  project_milestones  id, opportunity_id, student_id, title, description, due_date,
 *                      completed_at, status, order_index, created_at
 *  profiles            id, email, full_name, avatar_url, role, career, experience,
 *                      availability_hours, phone, student_code, semester, gpa, focus,
 *                      interests (jsonb), skills (jsonb), created_at, updated_at
 *
 * Este archivo solo tiene lógica pura (sin Supabase) para poder probarla.
 */

// ---------------------------------------------------------------------------
// Estados de una necesidad (opportunities.status)
// ---------------------------------------------------------------------------
export const OPPORTUNITY_STATUS = {
  PENDING: 'pending_pat',
  PUBLISHED: 'published',
  IN_PROGRESS: 'in_progress',
  CLOSED: 'closed',
  REJECTED: 'rejected',
} as const;

// Se aceptan variantes por si en la BD hay datos con otros nombres
const PENDING_SET = new Set(['pending_pat', 'pending', 'pendiente', 'en_aprobacion', 'borrador', 'draft']);
const PUBLISHED_SET = new Set(['published', 'publicada', 'approved', 'aprobada', 'active', 'activa', 'open', 'abierta']);
const IN_PROGRESS_SET = new Set(['in_progress', 'en_curso', 'en_progreso', 'ongoing']);

const norm = (s: string | null | undefined) => (s ?? '').trim().toLowerCase();

export type OpportunityPhase = 'pending' | 'published' | 'in_progress' | 'closed';

export function opportunityPhase(status: string | null | undefined): OpportunityPhase {
  const s = norm(status);
  if (PUBLISHED_SET.has(s)) return 'published';
  if (IN_PROGRESS_SET.has(s)) return 'in_progress';
  if (PENDING_SET.has(s) || s === '') return 'pending';
  return 'closed';
}

/** Necesidad "activa" para el panel: pendiente de PAT, publicada o en curso. */
export function isActiveOpportunity(status: string | null | undefined): boolean {
  return opportunityPhase(status) !== 'closed';
}

/** Valores de status que los estudiantes pueden ver en Explorar. */
export const PUBLISHED_STATUS_VALUES = Array.from(PUBLISHED_SET);

/** Etiqueta en español para mostrar en tablas. */
export function opportunityStatusLabel(status: string | null | undefined): string {
  switch (opportunityPhase(status)) {
    case 'pending':
      return 'Pendiente revisión PAT';
    case 'published':
      return 'Publicada';
    case 'in_progress':
      return 'En curso';
    default:
      return 'Cerrada';
  }
}

// ---------------------------------------------------------------------------
// Habilidades guardadas como jsonb: ["Python", ...] o [{ "name": "Python" }, ...]
// ---------------------------------------------------------------------------
export function parseSkillList(value: unknown): string[] {
  let list: unknown = value;
  if (typeof value === 'string') {
    try {
      list = JSON.parse(value);
    } catch {
      list = value.split(',');
    }
  }
  if (!Array.isArray(list)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of list) {
    const name =
      typeof item === 'string'
        ? item
        : item && typeof item === 'object' && 'name' in item
          ? String((item as { name: unknown }).name)
          : '';
    const clean = name.trim();
    const key = clean.toLowerCase();
    if (clean && !seen.has(key)) {
      seen.add(key);
      out.push(clean);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Postulaciones (applications)
// ---------------------------------------------------------------------------
export interface ApplicationRow {
  dependency_status?: string | null;
  pat_status?: string | null;
  student_status?: string | null;
  is_match?: boolean | null;
}

export const DEPENDENCY_STATUS = {
  PENDING: 'pending',
  CONTACTED: 'contacted',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
} as const;

/** Valores para una postulación nueva. */
export function newApplicationRow(opportunityId: string, studentId: string, matchScore: number) {
  return {
    opportunity_id: opportunityId,
    student_id: studentId,
    match_score: matchScore,
    student_status: 'interested',
    dependency_status: DEPENDENCY_STATUS.PENDING,
    pat_status: 'pending',
    is_match: false,
  };
}

/** Match confirmado: la dependencia respondió al interés del estudiante. */
export function isConfirmedMatch(app: ApplicationRow): boolean {
  const d = norm(app.dependency_status);
  return app.is_match === true || d === 'accepted' || d === 'contacted';
}

export function isRejected(app: ApplicationRow): boolean {
  return norm(app.dependency_status) === 'rejected' || norm(app.pat_status) === 'rejected';
}

/** La dependencia ya hizo algo con la postulación. */
export function isReviewed(app: ApplicationRow): boolean {
  const d = norm(app.dependency_status);
  return d !== '' && d !== 'pending';
}

/** El estudiante solo puede retirarse mientras la dependencia no haya respondido. */
export function canWithdraw(app: ApplicationRow): boolean {
  return !isReviewed(app) && app.is_match !== true;
}

/**
 * Estado que ve el estudiante en "Mis Apps"
 * (claves que ya usa la interfaz: recibida, entrevista, aceptada, rechazada).
 */
export function studentApplicationStatus(app: ApplicationRow): 'recibida' | 'entrevista' | 'aceptada' | 'rechazada' {
  if (isRejected(app)) return 'rechazada';
  if (app.is_match === true || norm(app.dependency_status) === 'accepted') return 'aceptada';
  if (norm(app.dependency_status) === 'contacted') return 'entrevista';
  return 'recibida';
}

// ---------------------------------------------------------------------------
// Proyectos y fechas
// ---------------------------------------------------------------------------
export const DEFAULT_MILESTONES = [
  { title: 'Inicio del proyecto', description: 'Configuración e inducción del estudiante en el proyecto' },
  { title: 'Análisis del proceso actual', description: 'Levantamiento de requerimientos y mapa de proceso' },
  { title: 'Desarrollo de la solución', description: 'Construcción del script, bot o flujo automatizado' },
  { title: 'Pruebas y ajustes', description: 'Validación de datos y pruebas de usuario' },
  { title: 'Entrega y capacitación', description: 'Despliegue y entrenamiento al personal de la dependencia' },
  { title: 'Cierre y evaluación final', description: 'Medición de impacto y calificación' },
] as const;

/** Hitos iniciales para un proyecto nuevo (el primero queda en curso). */
export function defaultMilestoneRows(opportunityId: string, studentId: string) {
  return DEFAULT_MILESTONES.map((m, i) => ({
    opportunity_id: opportunityId,
    student_id: studentId,
    title: m.title,
    description: m.description,
    order_index: i + 1,
    status: i === 0 ? 'in_progress' : 'pending',
  }));
}

export function addMonths(isoDate: string, months: number): string {
  const d = new Date(isoDate);
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

/** Fecha de fin: target_end_date o inicio + duración (por defecto 3 meses). */
export function projectEndDate(
  startIso: string | null | undefined,
  targetEndIso: string | null | undefined,
  durationMonths: number | null | undefined
): string | null {
  if (targetEndIso) return targetEndIso;
  if (!startIso) return null;
  return addMonths(startIso, durationMonths && durationMonths > 0 ? durationMonths : 3);
}

/** Agrupa filas por una clave. */
export function groupBy<T, K>(rows: T[], key: (row: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const row of rows) {
    const k = key(row);
    const list = map.get(k);
    if (list) list.push(row);
    else map.set(k, [row]);
  }
  return map;
}
