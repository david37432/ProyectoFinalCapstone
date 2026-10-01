import { createClient } from './server'

interface VacancyData {
  id: string
  title: string
  department_id: string
  pat_hours_per_week: number
  contract_type: string
  modality: string
}

interface ApplicationWithVacancy {
  id: string
  vacancy_id: string
  status: string
  match_score: number
  applied_at: string
  updated_at: string
  reviewed_at: string | null
  vacancies: VacancyData[] | null
}

export interface StudentVacancy {
  id: string
  title: string
  department: string
  department_id: string
  modality: string
  contract_type: string
  pat_hours_per_week: number
  location: string
  match_score: number
  required_skills: string[]
  description: string
  status: string
  publication_date: string
  candidates_count: number
  is_applied: boolean
}

export interface StudentProfile {
  id: string
  email: string
  full_name: string
  role: string
  phone?: string
  student_code?: string
  career?: string
  semester?: number
  focus?: string
  gpa?: number
  availability_hours?: number
  skills: string[]
  interests: string[]
  experience?: string
  completion: number
}

export interface StudentApplication {
  id: string
  vacancy_id: string
  title: string
  department: string
  status: string
  applied_at: string
  match_score: number
  pat_hours_per_week: number
  interview_date?: string
  start_date?: string
  department_id: string
}

export async function getStudentVacancies(userId: string): Promise<StudentVacancy[]> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('candidate_profiles')
    .select('id, education_level, availability_hours_per_week, preferred_modality, preferred_contract_type')
    .eq('user_id', userId)
    .single()

  const { data: candidateSkills } = await supabase
    .from('candidate_skills')
    .select('skill_id, proficiency_level')
    .eq('candidate_profile_id', profile?.id)

  const candidateSkillIds = candidateSkills?.map(cs => cs.skill_id) || []

  const { data: vacancies } = await supabase
    .from('vacancies')
    .select(`
      id,
      title,
      description,
      department_id,
      publication_date,
      contract_type,
      modality,
      pat_hours_per_week,
      status,
      vacancy_skills(skill_id, skills(name))
    `)
    .eq('status', 'publicada')
    .order('publication_date', { ascending: false })

  if (!vacancies) return []

  const { data: departments } = await supabase
    .from('departments')
    .select('id, name')
    .in('id', [...new Set(vacancies.map(v => v.department_id))])

  const departmentMap = new Map(departments?.map(d => [d.id, d.name]) || [])

  const vacancyIds = vacancies.map(v => v.id)
  const { data: applications } = await supabase
    .from('applications')
    .select('vacancy_id, candidate_id')
    .in('vacancy_id', vacancyIds)

  const applicationsByVacancy = new Map<string, number>()
  applications?.forEach(app => {
    applicationsByVacancy.set(app.vacancy_id, (applicationsByVacancy.get(app.vacancy_id) || 0) + 1)
  })

  const { data: myApplications } = await supabase
    .from('applications')
    .select('vacancy_id')
    .eq('candidate_id', userId)

  const appliedVacancyIds = new Set(myApplications?.map(a => a.vacancy_id) || [])

  return vacancies.map(vacancy => {
    const skills = vacancy.vacancy_skills?.map((vs: { skill_id: string; skills: { name: string }[] }) => vs.skills[0]?.name).filter(Boolean) || []
    const vacancySkillIds = vacancy.vacancy_skills?.map((vs: { skill_id: string }) => vs.skill_id) || []

    let matchScore = 0
    if (vacancySkillIds.length > 0) {
      const matchedSkills = vacancySkillIds.filter(id => candidateSkillIds.includes(id)).length
      matchScore = Math.round((matchedSkills / vacancySkillIds.length) * 100)
    }

    if (profile?.preferred_modality && profile.preferred_modality !== 'cualquiera' && 
        vacancy.modality === profile.preferred_modality) {
      matchScore = Math.min(100, matchScore + 10)
    }

    if (profile?.preferred_contract_type && profile.preferred_contract_type !== 'cualquiera' && 
        vacancy.contract_type === profile.preferred_contract_type) {
      matchScore = Math.min(100, matchScore + 5)
    }

    return {
      id: vacancy.id,
      title: vacancy.title,
      department: departmentMap.get(vacancy.department_id) || vacancy.department_id,
      department_id: vacancy.department_id,
      modality: vacancy.modality,
      contract_type: vacancy.contract_type,
      pat_hours_per_week: vacancy.pat_hours_per_week,
      location: departmentMap.get(vacancy.department_id) || '',
      match_score: Math.min(100, matchScore),
      required_skills: skills,
      description: vacancy.description,
      status: vacancy.status,
      publication_date: vacancy.publication_date,
      candidates_count: applicationsByVacancy.get(vacancy.id) || 0,
      is_applied: appliedVacancyIds.has(vacancy.id),
    }
  }).sort((a, b) => b.match_score - a.match_score)
}

export async function getStudentProfile(userId: string): Promise<StudentProfile | null> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, phone, student_code, career, semester, focus, gpa, availability_hours')
    .eq('id', userId)
    .single()

  if (!profile) return null

  const { data: candidateProfile } = await supabase
    .from('candidate_profiles')
    .select('id, professional_summary, availability_hours_per_week, education_level')
    .eq('user_id', userId)
    .single()

  const { data: candidateSkills } = await supabase
    .from('candidate_skills')
    .select('skill_id, proficiency_level, skills(name)')
    .eq('candidate_profile_id', candidateProfile?.id)

  const { data: workExperience } = await supabase
    .from('work_experience')
    .select('description')
    .eq('candidate_profile_id', candidateProfile?.id)
    .order('start_date', { ascending: false })
    .limit(3)

  const skills = candidateSkills?.map(cs => cs.skills?.[0]?.name).filter(Boolean) || []
  const experience = workExperience?.map(w => w.description).filter(Boolean).join('\n\n') || ''

  const fields = [
    profile.full_name, profile.email, profile.phone, profile.student_code,
    profile.career, profile.semester, profile.focus, profile.gpa,
    skills.length > 0, experience, profile.availability_hours
  ]
  const filled = fields.filter(Boolean).length
  const completion = Math.round((filled / fields.length) * 100)

  return {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    role: profile.role,
    phone: profile.phone,
    student_code: profile.student_code,
    career: profile.career,
    semester: profile.semester,
    focus: profile.focus,
    gpa: profile.gpa,
    availability_hours: profile.availability_hours || candidateProfile?.availability_hours_per_week,
    skills,
    interests: [],
    experience,
    completion,
  }
}

export async function getStudentApplications(userId: string): Promise<StudentApplication[]> {
  const supabase = await createClient()

  const { data: applications } = await supabase
    .from('applications')
    .select(`
      id,
      vacancy_id,
      status,
      match_score,
      applied_at,
      updated_at,
      reviewed_at,
      vacancies (
        id,
        title,
        department_id,
        pat_hours_per_week,
        contract_type,
        modality
      )
    `)
    .eq('candidate_id', userId)
    .order('applied_at', { ascending: false })

  if (!applications) return []

  const typedApplications = applications as ApplicationWithVacancy[]

  const vacancyIds = typedApplications
    .map(a => a.vacancies?.[0]?.id)
    .filter((id): id is string => Boolean(id))

  const { data: departments } = await supabase
    .from('departments')
    .select('id, name')
    .in('id', [...new Set(vacancyIds.map(v => {
      const app = typedApplications.find(a => a.vacancies?.[0]?.id === v)
      return app?.vacancies?.[0]?.department_id
    }).filter(Boolean))])

  const departmentMap = new Map(departments?.map(d => [d.id, d.name]) || [])

  return typedApplications.map(app => {
    const vacancy = app.vacancies?.[0]
    return {
      id: app.id,
      vacancy_id: app.vacancy_id,
      title: vacancy?.title || 'Proyecto sin título',
      department: vacancy?.department_id ? departmentMap.get(vacancy.department_id) || vacancy.department_id : 'Sin asignar',
      department_id: vacancy?.department_id || '',
      status: app.status,
      applied_at: app.applied_at,
      match_score: app.match_score,
      pat_hours_per_week: vacancy?.pat_hours_per_week || 0,
      interview_date: app.reviewed_at || undefined,
      start_date: app.updated_at,
    }
  })
}