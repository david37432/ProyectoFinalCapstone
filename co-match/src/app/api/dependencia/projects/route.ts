import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/server-auth'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireAdmin()
    const supabase = await createClient()

    // First, get vacancy IDs created by this user
    const { data: userVacancies } = await supabase
      .from('vacancies')
      .select('id')
      .eq('created_by', user.id);

    const vacancyIds = userVacancies?.map((v: { id: string }) => v.id) ?? [];

    if (vacancyIds.length === 0) {
      return NextResponse.json({ projects: [] })
    }

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

    if (!applications || applications.length === 0) {
      return NextResponse.json({ projects: [] })
    }

    const applicationIds = applications.map((application: { id: string }) => application.id);

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

    // Get departments
    const departmentIds = [...new Set(applications.map((application: {
      vacancy?: { department_id?: string } | Array<{ department_id?: string }> }
    ) => {
      const vacancy = Array.isArray(application.vacancy) ? application.vacancy[0] : application.vacancy;
      return vacancy?.department_id;
    }).filter((departmentId: string | undefined): departmentId is string => Boolean(departmentId)))];
    const { data: departments } = await supabase
      .from('departments')
      .select('id, name')
      .in('id', departmentIds);

    const departmentMap = new Map<string, string>(
      departments?.map((department: { id: string; name: string }) => [department.id, department.name]) ?? []
    );

    const milestonesByApp = new Map<string, Array<Record<string, unknown>>>();
    milestones?.forEach((milestone: { application_id: string }) => {
      if (!milestonesByApp.has(milestone.application_id)) milestonesByApp.set(milestone.application_id, []);
      milestonesByApp.get(milestone.application_id)!.push(milestone as Record<string, unknown>);
    });

    const hoursByApp = new Map<string, number>();
    hours?.forEach((hourEntry: { application_id: string; hours: number | string }) => {
      hoursByApp.set(hourEntry.application_id, (hoursByApp.get(hourEntry.application_id) || 0) + Number(hourEntry.hours));
    });

    const evaluationByApp = new Map<string, Record<string, unknown>>();
    evaluations?.forEach((evaluation: { application_id: string }) => {
      evaluationByApp.set(evaluation.application_id, evaluation as Record<string, unknown>);
    });

    const projects = applications.map((app: {
      id: string
      match_score?: number | null
      created_at: string
      vacancy?: { id?: string; title?: string; department_id?: string; publication_date?: string | null; pat_hours_per_week?: number | null } | Array<{ id?: string; title?: string; department_id?: string; publication_date?: string | null; pat_hours_per_week?: number | null }>
      candidate?: {
        id?: string
        full_name?: string
        email?: string
        avatar_url?: string | null
        candidate_profile?: {
          education_level?: string | null
          availability_hours_per_week?: number | null
        } | Array<{ education_level?: string | null; availability_hours_per_week?: number | null }>
      } | Array<{
        id?: string
        full_name?: string
        email?: string
        avatar_url?: string | null
        candidate_profile?: {
          education_level?: string | null
          availability_hours_per_week?: number | null
        } | Array<{ education_level?: string | null; availability_hours_per_week?: number | null }>
      }>
    }) => {
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

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Error in projects GET:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}