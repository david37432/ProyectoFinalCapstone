import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/server-auth'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin()
    const resolvedParams = await params;
    const applicationId = resolvedParams.id;

    const supabase = await createClient()

    // Verify the application belongs to a vacancy created by this user
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select(`
        id,
        vacancy_id,
        candidate_id,
        dependency_status,
        vacancy:vacancies!inner(created_by)
      `)
      .eq('id', applicationId)
      .single()

    if (appError || !application) {
      return NextResponse.json(
        { error: 'Postulación no encontrada' },
        { status: 404 }
      )
    }

    const vacancy = Array.isArray(application.vacancy) ? application.vacancy[0] : application.vacancy;
    if (vacancy?.created_by !== user.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    // Update dependency_status to 'contacted'
    const { error: updateError } = await supabase
      .from('applications')
      .update({ 
        dependency_status: 'contacted',
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Error al actualizar estado' },
        { status: 500 }
      )
    }

    // Create notification for the candidate
    await supabase
      .from('notifications')
      .insert({
        user_id: application.candidate_id,
        channel: 'in_app',
        title: 'Nuevo contacto de la dependencia',
        message: `La dependencia ha mostrado interés en tu perfil para la vacante.`,
        related_entity_type: 'application',
        related_entity_id: applicationId,
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in contact API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}