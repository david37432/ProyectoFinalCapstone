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