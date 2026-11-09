/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Consultas del lado de la DEPENDENCIA sobre el esquema real de Supabase
 * (opportunities, applications, conversations, messages, project_milestones, profiles).
 *
 * Se usan desde páginas de servidor y rutas API, por eso usan el cliente de
 * SERVIDOR (con la cookie de sesión). Antes usaban el cliente de navegador y
 * consultaban sin sesión, por lo que todo salía vacío.
 *
 * No se usan "joins" embebidos de PostgREST porque dependen de llaves foráneas
 * que no sabemos si existen; se consulta cada tabla y se cruza en memoria.
 */
import { createClient } from './server';
import {
  OPPORTUNITY_STATUS,
  opportunityPhase,
  isActiveOpportunity,
  parseSkillList,
  isConfirmedMatch,
  isReviewed,
  projectEndDate,
  groupBy,
  defaultMilestoneRows,
  DEPENDENCY_STATUS,
} from '@/lib/data/model';
import { skillKey } from '@/lib/matching';

type Client = Awaited<ReturnType<typeof createClient>>;

// ============================================================================
// Tipos que usa la interfaz (se conservan los nombres originales)
// ============================================================================

export interface AdminMetrics {
  activeVacancies: number;
  candidatesReviewed: number;
  confirmedMatches: number;
  projectsInProgress: number;
}

export interface VacancyWithDetails {
  id: string;
  title: string;
  status: string;
  department_id: string;
  publication_date: string;
  contract_type: string;
  modality: string;
  pat_hours_per_week: number;
  required_skills: string[];
  candidates_count: number;
  department_name?: string;
}

export interface TopCandidate {
  id: string;
  full_name: string;
  email: string;
  career: string;
  match_score: number;
  vacancy_title: string;
}

export interface CandidateDetail {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  career: string;
  semester: string;
  gpa: number | null;
  availability_hours: number | null;
  experience: string | null;
  skills: { name: string; proficiency: string; is_match: boolean }[];
  match_score: number;
  application_id: string;
  application_status: string;
  vacancy_id: string;
  vacancy_title: string;
  dependency_status: string | null;
}

export interface VacancySummary {
  id: string;
  title: string;
  department_name: string;
  candidates_count: number;
  required_skills: string[];
}

export interface ConversationWithDetails {
  id: string;
  vacancy_id: string;
  vacancy_title: string;
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_avatar_url: string | null;
  last_message: string | null;
  last_message_at: string | null;
  last_message_by: string | null;
  unread_dependency_count: number;
  dependency_status: string | null;
  is_online: boolean;
  created_at: string;
}

export interface MessageWithSender {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string | null;
  content: string;
  message_type: string;
  file_url: string | null;
  file_name: string | null;
  is_read: boolean;
  created_at: string;
  is_own: boolean;
}

export interface ProjectMilestone {
  id: string;
  application_id: string;
  title: string;
  description: string | null;
  order_index: number;
  status: 'pending' | 'in_progress' | 'completed';
  planned_date: string | null;
  completed_date: string | null;
  started_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectEvaluation {
  id: string;
  application_id: string;
  dependency_rating: number | null;
  candidate_rating: number | null;
  dependency_feedback: string | null;
  candidate_feedback: string | null;
  satisfaction_rating: number | null;
  evaluated_at: string;
}

export interface SeguimientoProject {
  application_id: string;
  vacancy_title: string;
  vacancy_id: string;
  department_name: string;
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_avatar_url: string | null;
  candidate_career: string;
  candidate_availability_hours: number | null;
  match_score: number;
  start_date: string | null;
  target_end_date: string | null;
  milestones: ProjectMilestone[];
  total_hours: number;
  evaluation: ProjectEvaluation | null;
}

// ============================================================================
// Helpers internos
// ============================================================================

/** Estado de la necesidad con las claves que muestra VacanciesTable. */
function tableStatus(status: string | null | undefined): string {
  switch (opportunityPhase(status)) {
    case 'pending':
      return 'en_aprobacion';
    case 'published':
      return 'publicada';
    case 'in_progress':
      return 'en_curso';
    default:
      return 'cerrada';
  }
}

async function getOwnOpportunities(supabase: Client, dependencyId: string) {
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('dependency_id', dependencyId)
    .order('created_at', { ascending: false });
  if (error) console.error('[admin-queries] opportunities:', error.message);
  return (data ?? []) as any[];
}

async function getApplicationsFor(supabase: Client, opportunityIds: string[]) {
  if (opportunityIds.length === 0) return [] as any[];
  const { data, error } = await supabase.from('applications').select('*').in('opportunity_id', opportunityIds);
  if (error) console.error('[admin-queries] applications:', error.message);
  return (data ?? []) as any[];
}

async function getProfilesByIds(supabase: Client, ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map<string, any>();
  const { data, error } = await supabase.from('profiles').select('*').in('id', unique);
  if (error) console.error('[admin-queries] profiles:', error.message);
  return new Map<string, any>((data ?? []).map((p: any) => [p.id, p]));
}

function mapMilestone(m: any, applicationId: string): ProjectMilestone {
  const status = ['pending', 'in_progress', 'completed'].includes(m.status) ? m.status : 'pending';
  return {
    id: m.id,
    application_id: applicationId,
    title: m.title,
    description: m.description ?? null,
    order_index: m.order_index ?? 0,
    status,
    planned_date: m.due_date ?? null,
    completed_date: m.completed_at ?? null,
    started_date: null,
    created_at: m.created_at,
    updated_at: m.completed_at ?? m.created_at,
  };
}

// ============================================================================
// Panel principal
// ============================================================================

export async function getAdminMetrics(userId: string): Promise<AdminMetrics> {
  const supabase = await createClient();
  const opportunities = await getOwnOpportunities(supabase, userId);
  const applications = await getApplicationsFor(supabase, opportunities.map((o) => o.id));

  return {
    activeVacancies: opportunities.filter((o) => isActiveOpportunity(o.status)).length,
    candidatesReviewed: applications.filter(isReviewed).length,
    confirmedMatches: applications.filter(isConfirmedMatch).length,
    projectsInProgress: opportunities.filter(
      (o) =>
        opportunityPhase(o.status) === 'in_progress' ||
        applications.some((a) => a.opportunity_id === o.id && isConfirmedMatch(a))
    ).length,
  };
}

export async function getVacanciesWithDetails(userId: string): Promise<VacancyWithDetails[]> {
  const supabase = await createClient();
  const opportunities = await getOwnOpportunities(supabase, userId);
  const byOpp = groupBy(await getApplicationsFor(supabase, opportunities.map((o) => o.id)), (a: any) => a.opportunity_id);

  return opportunities.map((o) => ({
    id: o.id,
    title: o.title,
    status: tableStatus(o.status),
    department_id: o.area ?? '',
    department_name: o.area ?? undefined,
    publication_date: o.start_date ?? o.created_at,
    contract_type: 'pasantia',
    modality: 'hibrido',
    pat_hours_per_week: o.weekly_hours ?? 0,
    required_skills: parseSkillList(o.required_skills),
    candidates_count: byOpp.get(o.id)?.length ?? 0,
  }));
}

export async function getTopCandidates(userId: string, limit = 5): Promise<TopCandidate[]> {
  const supabase = await createClient();
  const opportunities = await getOwnOpportunities(supabase, userId);
  const applications = (await getApplicationsFor(supabase, opportunities.map((o) => o.id)))
    .filter((a) => Number(a.match_score) >= 60)
    .sort((a, b) => Number(b.match_score) - Number(a.match_score));

  // Mejor postulación por estudiante
  const best = new Map<string, any>();
  for (const app of applications) if (!best.has(app.student_id)) best.set(app.student_id, app);
  const top = [...best.values()].slice(0, limit);

  const profiles = await getProfilesByIds(supabase, top.map((a) => a.student_id));
  const titles = new Map(opportunities.map((o) => [o.id, o.title]));

  return top.map((a) => {
    const p = profiles.get(a.student_id);
    return {
      id: a.student_id,
      full_name: p?.full_name || 'Sin nombre',
      email: p?.email || '',
      career: p?.career || 'No especificado',
      match_score: Math.round(Number(a.match_score) || 0),
      vacancy_title: titles.get(a.opportunity_id) || 'Necesidad',
    };
  });
}

export async function getUserProfile(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('profiles').select('full_name, email, role').eq('id', userId).maybeSingle();
  if (!data) return null;
  return { ...data, department_name: undefined as string | undefined, role_name: data.role };
}

// ============================================================================
// Candidatos
// ============================================================================

export async function getVacanciesForSelector(userId: string): Promise<VacancySummary[]> {
  const supabase = await createClient();
  const opportunities = (await getOwnOpportunities(supabase, userId)).filter((o) => isActiveOpportunity(o.status));
  const byOpp = groupBy(await getApplicationsFor(supabase, opportunities.map((o) => o.id)), (a: any) => a.opportunity_id);

  return opportunities.map((o) => ({
    id: o.id,
    title: o.title,
    department_name: o.area || 'Sin área',
    candidates_count: byOpp.get(o.id)?.length ?? 0,
    required_skills: parseSkillList(o.required_skills),
  }));
}

export async function getCandidatesByVacancy(vacancyId: string): Promise<CandidateDetail[]> {
  const supabase = await createClient();

  const { data: opportunity } = await supabase
    .from('opportunities')
    .select('id, title, required_skills')
    .eq('id', vacancyId)
    .maybeSingle();
  const required = new Set(parseSkillList(opportunity?.required_skills).map(skillKey));

  const applications = (await getApplicationsFor(supabase, [vacancyId])).sort(
    (a, b) => Number(b.match_score) - Number(a.match_score)
  );
  const profiles = await getProfilesByIds(supabase, applications.map((a) => a.student_id));

  return applications.map((a) => {
    const p = profiles.get(a.student_id);
    return {
      id: a.student_id,
      full_name: p?.full_name || 'Sin nombre',
      email: p?.email || '',
      avatar_url: p?.avatar_url || null,
      career: p?.career || 'No especificado',
      semester: p?.semester ? String(p.semester) : '',
      gpa: p?.gpa != null ? Number(p.gpa) : null,
      availability_hours: p?.availability_hours ?? null,
      experience: p?.experience || null,
      skills: parseSkillList(p?.skills).map((name) => ({
        name,
        proficiency: '',
        is_match: required.has(skillKey(name)),
      })),
      match_score: Math.round(Number(a.match_score) || 0),
      application_id: a.id,
      application_status: a.dependency_status || DEPENDENCY_STATUS.PENDING,
      vacancy_id: a.opportunity_id,
      vacancy_title: opportunity?.title || '',
      dependency_status: a.dependency_status || null,
    };
  });
}

export async function getVacancyById(vacancyId: string) {
  const supabase = await createClient();
  const { data: o } = await supabase.from('opportunities').select('*').eq('id', vacancyId).maybeSingle();
  if (!o) return null;
  const applications = await getApplicationsFor(supabase, [vacancyId]);
  return {
    id: o.id,
    title: o.title,
    department_name: o.area || 'Sin área',
    candidates_count: applications.length,
    required_skills: parseSkillList(o.required_skills),
    status: tableStatus(o.status),
  };
}

/**
 * La dependencia contacta a un candidato: queda como match, se crea la
 * conversación y los hitos iniciales del proyecto.
 * Devuelve el id de la conversación.
 */
export async function contactCandidate(
  applicationId: string,
  dependencyId: string
): Promise<{ conversationId?: string; error?: string; status?: number }> {
  const supabase = await createClient();

  const { data: app } = await supabase.from('applications').select('*').eq('id', applicationId).maybeSingle();
  if (!app) return { error: 'Postulación no encontrada', status: 404 };

  const { data: opp } = await supabase
    .from('opportunities')
    .select('id, dependency_id, status, start_date')
    .eq('id', app.opportunity_id)
    .maybeSingle();
  if (!opp || opp.dependency_id !== dependencyId) return { error: 'No autorizado', status: 403 };

  const { error: updateError } = await supabase
    .from('applications')
    .update({ dependency_status: DEPENDENCY_STATUS.CONTACTED, is_match: true })
    .eq('id', applicationId);
  if (updateError) return { error: `Error al actualizar estado: ${updateError.message}`, status: 500 };

  // La necesidad pasa a "en curso" y se fija la fecha de inicio si no tenía
  await supabase
    .from('opportunities')
    .update({
      status: OPPORTUNITY_STATUS.IN_PROGRESS,
      start_date: opp.start_date ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', opp.id);

  // Hitos iniciales (solo si aún no tiene)
  const { data: existingMilestones } = await supabase
    .from('project_milestones')
    .select('id')
    .eq('opportunity_id', opp.id)
    .eq('student_id', app.student_id)
    .limit(1);
  if (!existingMilestones || existingMilestones.length === 0) {
    const { error: msError } = await supabase.from('project_milestones').insert(defaultMilestoneRows(opp.id, app.student_id));
    if (msError) console.warn('[contactCandidate] hitos:', msError.message);
  }

  const { conversation, error } = await getOrCreateConversation(opp.id, dependencyId, app.student_id);
  if (error || !conversation) return { error: 'No se pudo crear la conversación', status: 500 };
  return { conversationId: conversation.id };
}

export async function updateApplicationDependencyStatus(applicationId: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('applications').update({ dependency_status: status }).eq('id', applicationId);
  return { error };
}

// ============================================================================
// Conversaciones y mensajes
// ============================================================================

export async function getConversationsForDependency(dependencyId: string): Promise<ConversationWithDetails[]> {
  const supabase = await createClient();
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('dependency_id', dependencyId)
    .order('last_message_at', { ascending: false, nullsFirst: false });
  if (error) console.error('[admin-queries] conversations:', error.message);
  const convs = (conversations ?? []) as any[];
  if (convs.length === 0) return [];

  const profiles = await getProfilesByIds(supabase, convs.map((c) => c.student_id));
  const oppIds = [...new Set(convs.map((c) => c.opportunity_id))];
  const { data: opps } = await supabase.from('opportunities').select('id, title').in('id', oppIds);
  const titles = new Map<string, string>((opps ?? []).map((o: any) => [o.id, o.title]));
  const apps = await getApplicationsFor(supabase, oppIds);

  return convs.map((c) => {
    const p = profiles.get(c.student_id);
    const app = apps.find((a) => a.opportunity_id === c.opportunity_id && a.student_id === c.student_id);
    return {
      id: c.id,
      vacancy_id: c.opportunity_id,
      vacancy_title: titles.get(c.opportunity_id) || 'Sin título',
      candidate_id: c.student_id,
      candidate_name: p?.full_name || 'Sin nombre',
      candidate_email: p?.email || '',
      candidate_avatar_url: p?.avatar_url || null,
      last_message: c.last_message ?? null,
      last_message_at: c.last_message_at ?? null,
      last_message_by: null,
      unread_dependency_count: c.unread_dependency_count || 0,
      dependency_status: app?.dependency_status ?? null,
      is_online: false,
      created_at: c.created_at,
    };
  });
}

export async function getMessagesForConversation(conversationId: string, currentUserId: string): Promise<MessageWithSender[]> {
  const supabase = await createClient();
  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) console.error('[admin-queries] messages:', error.message);
  const msgs = (messages ?? []) as any[];
  const profiles = await getProfilesByIds(supabase, msgs.map((m) => m.sender_id));

  return msgs.map((m) => toMessageWithSender(m, profiles.get(m.sender_id), currentUserId));
}

function toMessageWithSender(m: any, sender: any, currentUserId: string): MessageWithSender {
  return {
    id: m.id,
    conversation_id: m.conversation_id,
    sender_id: m.sender_id,
    sender_name: sender?.full_name || 'Sin nombre',
    sender_avatar: sender?.avatar_url || null,
    content: m.content,
    message_type: 'text',
    file_url: null,
    file_name: null,
    is_read: !!m.is_read,
    created_at: m.created_at,
    is_own: m.sender_id === currentUserId,
  };
}

/** Verifica que el usuario participa en la conversación. */
export async function getConversationForUser(conversationId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('conversations').select('*').eq('id', conversationId).maybeSingle();
  if (!data) return { conversation: null, status: 404 as const };
  if (data.dependency_id !== userId && data.student_id !== userId) return { conversation: null, status: 403 as const };
  return { conversation: data as any, status: 200 as const };
}

export async function sendMessage(conversationId: string, senderId: string, content: string) {
  const supabase = await createClient();
  const { data: message, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, content, is_read: false })
    .select()
    .single();
  if (error || !message) return { message: null, error };

  // Actualizar resumen de la conversación y no leídos del otro participante
  const { data: conv } = await supabase.from('conversations').select('*').eq('id', conversationId).maybeSingle();
  if (conv) {
    const toStudent = conv.dependency_id === senderId;
    await supabase
      .from('conversations')
      .update({
        last_message: content.slice(0, 500),
        last_message_at: message.created_at,
        ...(toStudent
          ? { unread_student_count: (conv.unread_student_count || 0) + 1 }
          : { unread_dependency_count: (conv.unread_dependency_count || 0) + 1 }),
      })
      .eq('id', conversationId);
  }

  const { data: sender } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', senderId).maybeSingle();
  return { message: toMessageWithSender(message, sender, senderId), error: null };
}

export async function markMessagesAsRead(conversationId: string, userId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .eq('is_read', false);

  if (!error) {
    const { data: conv } = await supabase
      .from('conversations')
      .select('dependency_id, student_id')
      .eq('id', conversationId)
      .maybeSingle();
    if (conv?.dependency_id === userId) {
      await supabase.from('conversations').update({ unread_dependency_count: 0 }).eq('id', conversationId);
    } else if (conv?.student_id === userId) {
      await supabase.from('conversations').update({ unread_student_count: 0 }).eq('id', conversationId);
    }
  }
  return { error };
}

export async function getOrCreateConversation(opportunityId: string, dependencyId: string, studentId: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('opportunity_id', opportunityId)
    .eq('dependency_id', dependencyId)
    .eq('student_id', studentId)
    .maybeSingle();
  if (existing) return { conversation: existing, error: null };

  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert({
      opportunity_id: opportunityId,
      dependency_id: dependencyId,
      student_id: studentId,
      unread_dependency_count: 0,
      unread_student_count: 0,
    })
    .select('id')
    .single();
  if (error) console.error('[getOrCreateConversation]', error.message);
  return { conversation, error };
}

export async function getTotalUnreadCount(dependencyId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase.from('conversations').select('unread_dependency_count').eq('dependency_id', dependencyId);
  return (data ?? []).reduce((sum: number, c: any) => sum + (c.unread_dependency_count || 0), 0);
}

// ============================================================================
// Seguimiento de proyectos (matches confirmados)
// ============================================================================

function buildProject(o: any, a: any, p: any, milestones: any[]): SeguimientoProject {
  const start = o.start_date ?? a.created_at ?? null;
  return {
    application_id: a.id,
    vacancy_title: o.title || 'Sin título',
    vacancy_id: o.id,
    department_name: o.area || 'Sin área',
    candidate_id: a.student_id,
    candidate_name: p?.full_name || 'Sin nombre',
    candidate_email: p?.email || '',
    candidate_avatar_url: p?.avatar_url || null,
    candidate_career: p?.career || 'No especificado',
    candidate_availability_hours: p?.availability_hours ?? o.weekly_hours ?? 0,
    match_score: Math.round(Number(a.match_score) || 0),
    start_date: start,
    target_end_date: projectEndDate(start, o.target_end_date, o.duration_months),
    milestones: milestones.sort((x, y) => (x.order_index ?? 0) - (y.order_index ?? 0)).map((m) => mapMilestone(m, a.id)),
    total_hours: Number(o.logged_hours) || 0,
    evaluation:
      o.satisfaction_rating != null
        ? {
            id: o.id,
            application_id: a.id,
            dependency_rating: Number(o.satisfaction_rating),
            candidate_rating: null,
            dependency_feedback: null,
            candidate_feedback: null,
            satisfaction_rating: Number(o.satisfaction_rating),
            evaluated_at: o.updated_at ?? o.created_at,
          }
        : null,
  };
}

export async function getSeguimientoProjects(dependencyId: string): Promise<SeguimientoProject[]> {
  const supabase = await createClient();
  const opportunities = await getOwnOpportunities(supabase, dependencyId);
  const matches = (await getApplicationsFor(supabase, opportunities.map((o) => o.id))).filter(isConfirmedMatch);
  if (matches.length === 0) return [];

  const profiles = await getProfilesByIds(supabase, matches.map((a) => a.student_id));
  const { data: milestones } = await supabase
    .from('project_milestones')
    .select('*')
    .in('opportunity_id', [...new Set(matches.map((a) => a.opportunity_id))]);
  const oppById = new Map(opportunities.map((o) => [o.id, o]));

  return matches.map((a) =>
    buildProject(
      oppById.get(a.opportunity_id),
      a,
      profiles.get(a.student_id),
      (milestones ?? []).filter((m: any) => m.opportunity_id === a.opportunity_id && m.student_id === a.student_id)
    )
  );
}

export async function getSeguimientoProjectById(applicationId: string): Promise<SeguimientoProject | null> {
  const supabase = await createClient();
  const { data: a } = await supabase.from('applications').select('*').eq('id', applicationId).maybeSingle();
  if (!a) return null;
  const { data: o } = await supabase.from('opportunities').select('*').eq('id', a.opportunity_id).maybeSingle();
  if (!o) return null;
  const profiles = await getProfilesByIds(supabase, [a.student_id]);
  const { data: milestones } = await supabase
    .from('project_milestones')
    .select('*')
    .eq('opportunity_id', a.opportunity_id)
    .eq('student_id', a.student_id);
  return buildProject(o, a, profiles.get(a.student_id), milestones ?? []);
}

/** Cambia el estado de un hito verificando que la necesidad sea de la dependencia. */
export async function updateMilestoneStatus(
  milestoneId: string,
  status: 'pending' | 'in_progress' | 'completed',
  dependencyId?: string
): Promise<{ error: string | null; status: number }> {
  const supabase = await createClient();
  const { data: milestone } = await supabase.from('project_milestones').select('id, opportunity_id').eq('id', milestoneId).maybeSingle();
  if (!milestone) return { error: 'Hito no encontrado', status: 404 };

  if (dependencyId) {
    const { data: opp } = await supabase.from('opportunities').select('dependency_id').eq('id', milestone.opportunity_id).maybeSingle();
    if (opp?.dependency_id !== dependencyId) return { error: 'No autorizado', status: 403 };
  }

  const { error } = await supabase
    .from('project_milestones')
    .update({ status, completed_at: status === 'completed' ? new Date().toISOString() : null })
    .eq('id', milestoneId);
  return { error: error?.message ?? null, status: error ? 500 : 200 };
}
