import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/server-auth'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin()
    const resolvedParams = await params;
    const milestoneId = resolvedParams.id;
    const supabase = await createClient()

    const body = await request.json();
    const { status } = body;

    if (!['pending', 'in_progress', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: 'Estado inválido' },
        { status: 400 }
      )
    }

    // Verify the milestone belongs to a vacancy created by this user
    const { data: milestone, error: milestoneError } = await supabase
      .from('project_milestones')
      .select(`
        id,
        application_id,
        application:applications!inner(
          id,
          vacancy_id,
          vacancy:vacancies!inner(created_by)
        )
      `)
      .eq('id', milestoneId)
      .single()

    if (milestoneError || !milestone) {
      return NextResponse.json(
        { error: 'Hito no encontrado' },
        { status: 404 }
      )
    }

    const application = Array.isArray(milestone.application) ? milestone.application[0] : milestone.application;
    const vacancy = Array.isArray(application?.vacancy) ? application.vacancy[0] : application?.vacancy;
    
    if (vacancy?.created_by !== user.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    // Update milestone status
    const updates: any = { status, updated_at: new Date().toISOString() };
    if (status === 'in_progress') updates.started_date = new Date().toISOString();
    if (status === 'completed') updates.completed_date = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('project_milestones')
      .update(updates)
      .eq('id', milestoneId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Error al actualizar hito' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in milestone PATCH:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}