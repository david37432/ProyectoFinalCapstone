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
      .select('id, dependency_id, candidate_id')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversación no encontrada' },
        { status: 404 }
      )
    }

    if (conversation.dependency_id !== user.id && conversation.candidate_id !== user.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    // Mark messages as read
    const { error: msgError } = await supabase
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .eq('is_read', false);

    if (msgError) {
      return NextResponse.json(
        { error: 'Error al marcar como leído' },
        { status: 500 }
      )
    }

    // Reset unread count for the user
    if (conversation.dependency_id === user.id) {
      await supabase
        .from('conversations')
        .update({ unread_dependency_count: 0 })
        .eq('id', conversationId);
    } else if (conversation.candidate_id === user.id) {
      await supabase
        .from('conversations')
        .update({ unread_candidate_count: 0 })
        .eq('id', conversationId);
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in read POST:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}