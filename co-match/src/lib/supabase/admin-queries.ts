import { createClient } from './client';

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

export async function getAdminMetrics(userId: string): Promise<AdminMetrics> {
  const supabase = createClient();

  const { data: vacancies } = await supabase
    .from('vacancies')
    .select('id, status, department_id')
    .eq('created_by', userId);

  const activeVacancies = vacancies?.filter(v => v.status === 'publicada').length || 0;

  const { data: applications } = await supabase
    .from('applications')
    .select('id, status, vacancy_id, match_score')
    .in('vacancy_id', vacancies?.map(v => v.id) || []);

  const candidatesReviewed = applications?.filter(a => 
    ['en_revision', 'entrevista', 'prueba', 'aceptada', 'rechazada'].includes(a.status)
  ).length || 0;

  const confirmedMatches = applications?.filter(a => a.status === 'aceptada').length || 0;

  const projectsInProgress = applications?.filter(a => 
    ['entrevista', 'prueba'].includes(a.status)
  ).length || 0;

  return {
    activeVacancies,
    candidatesReviewed,
    confirmedMatches,
    projectsInProgress,
  };
}

export async function getVacanciesWithDetails(userId: string): Promise<VacancyWithDetails[]> {
  const supabase = createClient();

  const { data: vacancies } = await supabase
    .from('vacancies')
    .select(`
      id,
      title,
      status,
      department_id,
      publication_date,
      contract_type,
      modality,
      pat_hours_per_week,
      vacancy_skills(skill_id, skills(name))
    `)
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (!vacancies) return [];

  const vacancyIds = vacancies.map(v => v.id);
  
  const { data: applications } = await supabase
    .from('applications')
    .select('vacancy_id, status')
    .in('vacancy_id', vacancyIds);

  const { data: departments } = await supabase
    .from('departments')
    .select('id, name')
    .in('id', [...new Set(vacancies.map(v => v.department_id))]);

  const departmentMap = new Map(departments?.map(d => [d.id, d.name]) || []);

  return vacancies.map(vacancy => {
    const candidatesCount = applications?.filter(a => a.vacancy_id === vacancy.id).length || 0;
    const skills = vacancy.vacancy_skills?.map((vs: { skill_id: string; skills: { name: string }[] }) => vs.skills[0]?.name).filter(Boolean) || [];

    return {
      id: vacancy.id,
      title: vacancy.title,
      status: vacancy.status,
      department_id: vacancy.department_id,
      department_name: departmentMap.get(vacancy.department_id),
      publication_date: vacancy.publication_date,
      contract_type: vacancy.contract_type,
      modality: vacancy.modality,
      pat_hours_per_week: vacancy.pat_hours_per_week,
      required_skills: skills,
      candidates_count: candidatesCount,
    };
  });
}

export async function getTopCandidates(userId: string, limit = 5): Promise<TopCandidate[]> {
  const supabase = createClient();

  const { data: vacancies } = await supabase
    .from('vacancies')
    .select('id, title')
    .eq('created_by', userId);

  if (!vacancies || vacancies.length === 0) return [];

  const vacancyIds = vacancies.map(v => v.id);

  const { data: applications } = await supabase
    .from('applications')
    .select(`
      id,
      vacancy_id,
      candidate_id,
      match_score,
      status,
      candidate:users!inner(full_name, email),
      candidate_profile:candidate_profiles!inner(education_level)
    `)
    .in('vacancy_id', vacancyIds)
    .gte('match_score', 60)
    .order('match_score', { ascending: false })
    .limit(limit * 3);

  if (!applications) return [];

  const uniqueCandidates = new Map();
  applications.forEach(app => {
    const key = app.candidate_id;
    if (!uniqueCandidates.has(key) || uniqueCandidates.get(key).match_score < app.match_score) {
      uniqueCandidates.set(key, app);
    }
  });

  return Array.from(uniqueCandidates.values())
    .slice(0, limit)
    .map(app => ({
      id: app.candidate_id,
      full_name: app.candidate?.full_name || 'Sin nombre',
      email: app.candidate?.email || '',
      career: app.candidate_profile?.education_level || 'No especificado',
      match_score: app.match_score,
      vacancy_title: vacancies.find(v => v.id === app.vacancy_id)?.title || 'Vacante',
    }));
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

export async function getVacanciesForSelector(userId: string): Promise<VacancySummary[]> {
  const supabase = createClient();

  const { data: vacancies } = await supabase
    .from('vacancies')
    .select(`
      id,
      title,
      department_id,
      vacancy_skills(skill_id, skills(name))
    `)
    .eq('created_by', userId)
    .eq('status', 'publicada')
    .order('created_at', { ascending: false });

  if (!vacancies) return [];

  const vacancyIds = vacancies.map(v => v.id);
  
  const { data: applications } = await supabase
    .from('applications')
    .select('vacancy_id, id')
    .in('vacancy_id', vacancyIds);

  const { data: departments } = await supabase
    .from('departments')
    .select('id, name')
    .in('id', [...new Set(vacancies.map(v => v.department_id))]);

  const departmentMap = new Map(departments?.map(d => [d.id, d.name]) || []);

  return vacancies.map(vacancy => {
    const candidatesCount = applications?.filter(a => a.vacancy_id === vacancy.id).length || 0;
    const skills = vacancy.vacancy_skills?.map((vs: { skill_id: string; skills: { name: string }[] }) => vs.skills[0]?.name).filter(Boolean) || [];

    return {
      id: vacancy.id,
      title: vacancy.title,
      department_name: departmentMap.get(vacancy.department_id) || 'Sin departamento',
      candidates_count: candidatesCount,
      required_skills: skills,
    };
  });
}

export async function getCandidatesByVacancy(vacancyId: string): Promise<CandidateDetail[]> {
  const supabase = createClient();

  // Get vacancy required skills
  const { data: vacancySkills } = await supabase
    .from('vacancy_skills')
    .select('skill_id, skills(name)')
    .eq('vacancy_id', vacancyId)
    .eq('is_required', true);

  const requiredSkillIds = new Set(vacancySkills?.map(vs => vs.skill_id) || []);

  // Get applications with candidate details
  const { data: applications } = await supabase
    .from('applications')
    .select(`
      id,
      vacancy_id,
      candidate_id,
      match_score,
      status,
      dependency_status,
      candidate:users!inner(
        id,
        full_name,
        email,
        avatar_url,
        candidate_profile:candidate_profiles!inner(
          education_level,
          years_experience,
          professional_summary,
          availability_hours_per_week,
          candidate_skills(
            skill_id,
            proficiency_level,
            skills(name)
          )
        )
      )
    `)
    .eq('vacancy_id', vacancyId)
    .order('match_score', { ascending: false });

  if (!applications) return [];

  return applications.map(app => {
    const candidate = Array.isArray(app.candidate) ? app.candidate[0] : app.candidate;
    const profile = candidate?.candidate_profile;
    const profileData = Array.isArray(profile) ? profile[0] : profile;
    const candidateSkills = profileData?.candidate_skills || [];

    const skillsWithMatch = candidateSkills.map((cs: { skill_id: string; proficiency_level: string; skills: { name: string }[] }) => ({
      name: cs.skills?.[0]?.name || 'Desconocida',
      proficiency: cs.proficiency_level,
      is_match: requiredSkillIds.has(cs.skill_id),
    }));

    return {
      id: candidate?.id || '',
      full_name: candidate?.full_name || 'Sin nombre',
      email: candidate?.email || '',
      avatar_url: candidate?.avatar_url || null,
      career: profileData?.education_level || 'No especificado',
      semester: '',
      gpa: null,
      availability_hours: profileData?.availability_hours_per_week || null,
      experience: profileData?.professional_summary || profileData?.years_experience ? `${profileData.years_experience} años de experiencia` : null,
      skills: skillsWithMatch,
      match_score: app.match_score,
      application_id: app.id,
      application_status: app.status,
      vacancy_id: app.vacancy_id,
      vacancy_title: '',
      dependency_status: app.dependency_status,
    };
  });
}

export async function getVacancyById(vacancyId: string) {
  const supabase = createClient();

  const { data: vacancy } = await supabase
    .from('vacancies')
    .select(`
      id,
      title,
      department_id,
      status,
      publication_date,
      vacancy_skills(skill_id, skills(name))
    `)
    .eq('id', vacancyId)
    .single();

  if (!vacancy) return null;

  const { data: department } = await supabase
    .from('departments')
    .select('name')
    .eq('id', vacancy.department_id)
    .single();

  const { data: applications } = await supabase
    .from('applications')
    .select('id')
    .eq('vacancy_id', vacancyId);

  const skills = vacancy.vacancy_skills?.map((vs: { skill_id: string; skills: { name: string }[] }) => vs.skills[0]?.name).filter(Boolean) || [];

  return {
    id: vacancy.id,
    title: vacancy.title,
    department_name: department?.name || 'Sin departamento',
    candidates_count: applications?.length || 0,
    required_skills: skills,
    status: vacancy.status,
  };
}

export async function updateApplicationDependencyStatus(applicationId: string, status: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('applications')
    .update({ dependency_status: status, updated_at: new Date().toISOString() })
    .eq('id', applicationId);

  return { error };
}

// ============================================================================
// CONVERSATIONS & MESSAGES QUERIES
// ============================================================================

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

export async function getConversationsForDependency(dependencyId: string): Promise<ConversationWithDetails[]> {
  const supabase = createClient();

  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      id,
      vacancy_id,
      candidate_id,
      last_message,
      last_message_at,
      last_message_by,
      unread_dependency_count,
      dependency_status,
      created_at,
      vacancy:vacancies!inner(title),
      candidate:users!inner(full_name, email, avatar_url)
    `)
    .eq('dependency_id', dependencyId)
    .eq('is_archived_dependency', false)
    .order('last_message_at', { ascending: false });

  if (!conversations) return [];

  // Get online status for candidates (last activity within 5 minutes)
  const candidateIds = conversations.map(c => c.candidate_id);
  const { data: profiles } = await supabase
    .from('users')
    .select('id, last_login_at')
    .in('id', candidateIds);

  const onlineMap = new Map<string, boolean>();
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  
  profiles?.forEach(p => {
    onlineMap.set(p.id, p.last_login_at && p.last_login_at > fiveMinutesAgo);
  });

  return conversations.map(conv => {
    const vacancy = Array.isArray(conv.vacancy) ? conv.vacancy[0] : conv.vacancy;
    const candidate = Array.isArray(conv.candidate) ? conv.candidate[0] : conv.candidate;
    
    return {
      id: conv.id,
      vacancy_id: conv.vacancy_id,
      vacancy_title: vacancy?.title || 'Sin título',
      candidate_id: conv.candidate_id,
      candidate_name: candidate?.full_name || 'Sin nombre',
      candidate_email: candidate?.email || '',
      candidate_avatar_url: candidate?.avatar_url || null,
      last_message: conv.last_message,
      last_message_at: conv.last_message_at,
      last_message_by: conv.last_message_by,
      unread_dependency_count: conv.unread_dependency_count || 0,
      dependency_status: conv.dependency_status || null,
      is_online: onlineMap.get(conv.candidate_id) || false,
      created_at: conv.created_at,
    };
  });
}

export async function getMessagesForConversation(conversationId: string, currentUserId: string): Promise<MessageWithSender[]> {
  const supabase = createClient();

  const { data: messages } = await supabase
    .from('messages')
    .select(`
      id,
      conversation_id,
      sender_id,
      content,
      message_type,
      file_url,
      file_name,
      is_read,
      created_at,
      sender:users!inner(full_name, avatar_url)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (!messages) return [];

  return messages.map(msg => {
    const sender = Array.isArray(msg.sender) ? msg.sender[0] : msg.sender;
    
    return {
      id: msg.id,
      conversation_id: msg.conversation_id,
      sender_id: msg.sender_id,
      sender_name: sender?.full_name || 'Sin nombre',
      sender_avatar: sender?.avatar_url || null,
      content: msg.content,
      message_type: msg.message_type,
      file_url: msg.file_url,
      file_name: msg.file_name,
      is_read: msg.is_read,
      created_at: msg.created_at,
      is_own: msg.sender_id === currentUserId,
    };
  });
}

export async function sendMessage(conversationId: string, senderId: string, content: string, messageType: 'text' | 'file' = 'text', fileUrl?: string, fileName?: string, fileSize?: number) {
  const supabase = createClient();

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      message_type: messageType,
      file_url: fileUrl,
      file_name: fileName,
      file_size: fileSize,
    })
    .select()
    .single();

  return { message, error };
}

export async function markMessagesAsRead(conversationId: string, userId: string) {
  const supabase = createClient();

  // Mark messages as read
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .eq('is_read', false);

  // Reset unread count for the user
  if (!error) {
    const { data: conv } = await supabase
      .from('conversations')
      .select('dependency_id, candidate_id')
      .eq('id', conversationId)
      .single();

    if (conv) {
      if (conv.dependency_id === userId) {
        await supabase
          .from('conversations')
          .update({ unread_dependency_count: 0 })
          .eq('id', conversationId);
      } else if (conv.candidate_id === userId) {
        await supabase
          .from('conversations')
          .update({ unread_candidate_count: 0 })
          .eq('id', conversationId);
      }
    }
  }

  return { error };
}

export async function getOrCreateConversation(vacancyId: string, dependencyId: string, candidateId: string) {
  const supabase = createClient();

  // Try to find existing conversation
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('vacancy_id', vacancyId)
    .eq('dependency_id', dependencyId)
    .eq('candidate_id', candidateId)
    .single();

  if (existing) return { conversation: existing, error: null };

  // Create new conversation
  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert({
      vacancy_id: vacancyId,
      dependency_id: dependencyId,
      candidate_id: candidateId,
    })
    .select()
    .single();

  return { conversation, error };
}

export async function getTotalUnreadCount(dependencyId: string): Promise<number> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('conversations')
    .select('unread_dependency_count')
    .eq('dependency_id', dependencyId)
    .eq('is_archived_dependency', false);

  if (error || !data) return 0;

  return data.reduce((sum, conv) => sum + (conv.unread_dependency_count || 0), 0);
}

// ============================================================================
// SEGUIMIENTO DE PROYECTOS (MILESTONES & PROGRESO)
// ============================================================================

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

export interface ProjectHours {
  id: string;
  application_id: string;
  user_id: string;
  hours: number;
  description: string | null;
  logged_date: string;
  created_at: string;
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

export async function getSeguimientoProjects(dependencyId: string): Promise<SeguimientoProject[]> {
  const supabase = createClient();

  // First, get vacancy IDs created by this user
  const { data: userVacancies } = await supabase
    .from('vacancies')
    .select('id')
    .eq('created_by', dependencyId);

  const vacancyIds = userVacancies?.map(v => v.id) || [];

  if (vacancyIds.length === 0) return [];

  // Get accepted applications for this dependency's vacancies
  const { data: applications } = await supabase
    .from('applications')
    .select(`
      id,
      vacancy_id,
      candidate_id,
      match_score,
      created_at,
      vacancy:vacancies!inner(
        id,
        title,
        department_id,
        pat_hours_per_week,
        publication_date
      ),
      candidate:users!inner(
        id,
        full_name,
        email,
        avatar_url,
        candidate_profile:candidate_profiles!inner(
          education_level,
          availability_hours_per_week
        )
      )
    `)
    .eq('status', 'aceptada')
    .in('vacancy_id', vacancyIds);

  if (!applications || applications.length === 0) return [];

  const applicationIds = applications.map(a => a.id);

  // Get milestones for all applications
  const { data: milestones } = await supabase
    .from('project_milestones')
    .select('*')
    .in('application_id', applicationIds)
    .order('order_index', { ascending: true });

  // Get hours for all applications
  const { data: hours } = await supabase
    .from('project_hours')
    .select('application_id, hours')
    .in('application_id', applicationIds);

  // Get evaluations for all applications
  const { data: evaluations } = await supabase
    .from('project_evaluations')
    .select('*')
    .in('application_id', applicationIds);

  // Get departments for vacancy names
  const departmentIds = [...new Set(applications.map(a => {
      const vacancy = Array.isArray(a.vacancy) ? a.vacancy[0] : a.vacancy;
      return vacancy?.department_id;
    }).filter(Boolean))];
  const { data: departments } = await supabase
    .from('departments')
    .select('id, name')
    .in('id', departmentIds);
  
  const departmentMap = new Map(departments?.map(d => [d.id, d.name]) || []);

  const milestonesByApp = new Map<string, ProjectMilestone[]>();
  milestones?.forEach(m => {
    if (!milestonesByApp.has(m.application_id)) milestonesByApp.set(m.application_id, []);
    milestonesByApp.get(m.application_id)!.push(m);
  });

  const hoursByApp = new Map<string, number>();
  hours?.forEach(h => {
    hoursByApp.set(h.application_id, (hoursByApp.get(h.application_id) || 0) + Number(h.hours));
  });

  const evaluationByApp = new Map<string, ProjectEvaluation>();
  evaluations?.forEach(e => {
    evaluationByApp.set(e.application_id, e);
  });

  return applications.map(app => {
    const vacancy = Array.isArray(app.vacancy) ? app.vacancy[0] : app.vacancy;
    const candidate = Array.isArray(app.candidate) ? app.candidate[0] : app.candidate;
    const profile = candidate?.candidate_profile;
    const profileData = Array.isArray(profile) ? profile[0] : profile;

    return {
      application_id: app.id,
      vacancy_title: vacancy?.title || 'Sin título',
      vacancy_id: vacancy?.id || '',
      department_name: departmentMap.get(vacancy?.department_id || '') || 'Sin departamento',
      candidate_id: candidate?.id || '',
      candidate_name: candidate?.full_name || 'Sin nombre',
      candidate_email: candidate?.email || '',
      candidate_avatar_url: candidate?.avatar_url || null,
      candidate_career: profileData?.education_level || 'No especificado',
      candidate_availability_hours: profileData?.availability_hours_per_week || vacancy?.pat_hours_per_week || 0,
      match_score: app.match_score,
      start_date: vacancy?.publication_date || app.created_at,
      target_end_date: vacancy?.publication_date ? new Date(new Date(vacancy.publication_date).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString() : null,
      milestones: milestonesByApp.get(app.id) || [],
      total_hours: hoursByApp.get(app.id) || 0,
      evaluation: evaluationByApp.get(app.id) || null,
    };
  });
}

export async function getSeguimientoProjectById(applicationId: string): Promise<SeguimientoProject | null> {
  const supabase = createClient();

  const { data: app } = await supabase
    .from('applications')
    .select(`
      id,
      vacancy_id,
      candidate_id,
      match_score,
      created_at,
      vacancy:vacancies!inner(
        id,
        title,
        department_id,
        pat_hours_per_week,
        publication_date
      ),
      candidate:users!inner(
        id,
        full_name,
        email,
        avatar_url,
        candidate_profile:candidate_profiles!inner(
          education_level,
          availability_hours_per_week
        )
      )
    `)
    .eq('id', applicationId)
    .single();

  if (!app) return null;

  const [milestonesRes, hoursRes, evaluationRes] = await Promise.all([
    supabase.from('project_milestones').select('*').eq('application_id', applicationId).order('order_index', { ascending: true }),
    supabase.from('project_hours').select('hours').eq('application_id', applicationId),
    supabase.from('project_evaluations').select('*').eq('application_id', applicationId).single(),
  ]);

  const vacancy = Array.isArray(app.vacancy) ? app.vacancy[0] : app.vacancy;
  const candidate = Array.isArray(app.candidate) ? app.candidate[0] : app.candidate;
  const profile = candidate?.candidate_profile;
  const profileData = Array.isArray(profile) ? profile[0] : profile;

  const { data: department } = await supabase
    .from('departments')
    .select('name')
    .eq('id', vacancy?.department_id)
    .single();

  const totalHours = hoursRes.data?.reduce((sum, h) => sum + Number(h.hours), 0) || 0;

  return {
    application_id: app.id,
    vacancy_title: vacancy?.title || 'Sin título',
    vacancy_id: vacancy?.id || '',
    department_name: department?.name || 'Sin departamento',
    candidate_id: candidate?.id || '',
    candidate_name: candidate?.full_name || 'Sin nombre',
    candidate_email: candidate?.email || '',
    candidate_avatar_url: candidate?.avatar_url || null,
    candidate_career: profileData?.education_level || 'No especificado',
    candidate_availability_hours: profileData?.availability_hours_per_week || vacancy?.pat_hours_per_week || 0,
    match_score: app.match_score,
    start_date: vacancy?.publication_date || app.created_at,
    target_end_date: vacancy?.publication_date ? new Date(new Date(vacancy.publication_date).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString() : null,
    milestones: milestonesRes.data || [],
    total_hours: totalHours,
    evaluation: evaluationRes.data,
  };
}

export async function updateMilestoneStatus(milestoneId: string, status: 'pending' | 'in_progress' | 'completed') {
  const supabase = createClient();
  
  const updates: any = { status, updated_at: new Date().toISOString() };
  if (status === 'in_progress') updates.started_date = new Date().toISOString();
  if (status === 'completed') updates.completed_date = new Date().toISOString();

  const { error } = await supabase
    .from('project_milestones')
    .update(updates)
    .eq('id', milestoneId);

  return { error };
}

export async function logProjectHours(applicationId: string, userId: string, hours: number, description: string, loggedDate?: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('project_hours')
    .insert({
      application_id: applicationId,
      user_id: userId,
      hours,
      description,
      logged_date: loggedDate || new Date().toISOString().split('T')[0],
    })
    .select()
    .single();

  return { data, error };
}

export async function createProjectEvaluation(applicationId: string, data: {
  dependency_rating?: number;
  dependency_feedback?: string;
  satisfaction_rating?: number;
}) {
  const supabase = createClient();
  
  const { data: evaluation, error } = await supabase
    .from('project_evaluations')
    .upsert({
      application_id: applicationId,
      ...data,
    })
    .select()
    .single();

  return { evaluation, error };
}

export async function getUserProfile(userId: string) {
  const supabase = createClient();

  const { data: user } = await supabase
    .from('users')
    .select('full_name, email, department_id, role_id')
    .eq('id', userId)
    .single();

  if (!user) return null;

  const { data: department } = await supabase
    .from('departments')
    .select('name')
    .eq('id', user.department_id)
    .single();

  const { data: role } = await supabase
    .from('roles')
    .select('name')
    .eq('id', user.role_id)
    .single();

  return {
    ...user,
    department_name: department?.name,
    role_name: role?.name,
  };
}