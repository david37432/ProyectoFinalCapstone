/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Consultas del lado del ESTUDIANTE sobre el esquema real de Supabase
 * (opportunities, applications, profiles).
 */
import { createClient } from './server'
import { computeMatchScore, candidateFromProfiles, skillKey } from '@/lib/matching'
import {
  PUBLISHED_STATUS_VALUES,
  parseSkillList,
  studentApplicationStatus,
  isConfirmedMatch,
} from '@/lib/data/model'

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

type Client = Awaited<ReturnType<typeof createClient>>

/** Número de postulaciones por necesidad (función SQL; RLS no deja contar las de otros). */
async function applicationCounts(supabase: Client, opportunityIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  if (opportunityIds.length === 0) return counts
  const { data, error } = await supabase.rpc('cm_application_counts', { opportunity_ids: opportunityIds })
  if (error) {
    console.warn('[student-queries] cm_application_counts:', error.message)
    return counts
  }
  for (const row of (data ?? []) as any[]) counts.set(row.opportunity_id, Number(row.total) || 0)
  return counts
}

export async function getStudentVacancies(userId: string): Promise<StudentVacancy[]> {
  const supabase = await createClient()

  const { data: studentProfile } = await supabase
    .from('profiles')
    .select('skills, availability_hours')
    .eq('id', userId)
    .maybeSingle()
  const candidate = candidateFromProfiles(studentProfile)

  const { data: opportunities, error } = await supabase
    .from('opportunities')
    .select('*')
    .in('status', PUBLISHED_STATUS_VALUES)
    .order('created_at', { ascending: false })
  if (error) console.error('[student-queries] opportunities:', error.message)
  const opps = (opportunities ?? []) as any[]
  if (opps.length === 0) return []

  const { data: myApplications } = await supabase
    .from('applications')
    .select('opportunity_id')
    .eq('student_id', userId)
  const applied = new Set((myApplications ?? []).map((a: any) => a.opportunity_id))
  const counts = await applicationCounts(supabase, opps.map((o) => o.id))

  return opps
    .map((o) => {
      const skills = parseSkillList(o.required_skills)
      const matchScore = computeMatchScore(
        { skills: skills.map((n) => ({ skillId: skillKey(n) })), patHoursPerWeek: o.weekly_hours },
        candidate
      )
      return {
        id: o.id,
        title: o.title,
        department: o.area || 'Sin área',
        department_id: o.area || '',
        modality: 'hibrido',
        contract_type: 'pasantia',
        pat_hours_per_week: o.weekly_hours ?? 0,
        location: o.area || '',
        match_score: matchScore,
        required_skills: skills,
        description: o.description || '',
        status: o.status,
        publication_date: o.start_date || o.created_at,
        candidates_count: counts.get(o.id) ?? (applied.has(o.id) ? 1 : 0),
        is_applied: applied.has(o.id),
      }
    })
    .sort((a, b) => b.match_score - a.match_score)
}

export async function getStudentApplications(userId: string): Promise<StudentApplication[]> {
  const supabase = await createClient()

  const { data: applications, error } = await supabase
    .from('applications')
    .select('*')
    .eq('student_id', userId)
    .order('created_at', { ascending: false })
  if (error) console.error('[student-queries] applications:', error.message)
  const apps = (applications ?? []) as any[]
  if (apps.length === 0) return []

  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('*')
    .in('id', [...new Set(apps.map((a) => a.opportunity_id))])
  const oppById = new Map((opportunities ?? []).map((o: any) => [o.id, o]))

  return apps.map((a) => {
    const o: any = oppById.get(a.opportunity_id)
    return {
      id: a.id,
      vacancy_id: a.opportunity_id,
      title: o?.title || 'Proyecto sin título',
      department: o?.area || 'Sin asignar',
      department_id: o?.area || '',
      status: studentApplicationStatus(a),
      applied_at: a.created_at,
      match_score: Math.round(Number(a.match_score) || 0),
      pat_hours_per_week: o?.weekly_hours || 0,
      interview_date: undefined,
      start_date: isConfirmedMatch(a) ? o?.start_date || undefined : undefined,
    }
  })
}
