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
    const conversationId = resolvedParams.id;
    const supabase = await createClient()

    // Verify user owns this conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, vacancy_id, dependency_id, candidate_id')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversación no encontrada' },
        { status: 404 }
      )
    }

    if (conversation.dependency_id !== user.id) {
      return NextResponse.json(
        { error: 'No autorizado - solo la dependencia puede marcar como contactado' },
        { status: 403 }
      )
    }

    // Update conversation to mark as contacted (you could add a contacted flag to conversations table)
    // For now, we'll create a system message
    const { error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: '📞 La dependencia ha contactado a este candidato',
        message_type: 'system',
      });

    if (msgError) {
      return NextResponse.json(
        { error: 'Error al registrar contacto' },
        { status: 500 }
      )
    }

    // Create notification for the candidate
    await supabase
      .from('notifications')
      .insert({
        user_id: conversation.candidate_id,
        channel: 'in_app',
        title: 'Nuevo contacto de la dependencia',
        message: `La dependencia ha mostrado interés en tu perfil para la vacante.`,
        related_entity_type: 'conversation',
        related_entity_id: conversationId,
      });

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in contact POST:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}