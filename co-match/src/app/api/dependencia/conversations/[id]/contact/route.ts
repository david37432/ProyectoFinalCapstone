import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/server-auth'
import { getConversationForUser, contactCandidate } from '@/lib/supabase/admin-queries'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

/** Marca como contactado al estudiante de una conversación. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin()
    const { id } = await params
    const { conversation, status } = await getConversationForUser(id, user.id)
    if (!conversation) {
      return NextResponse.json({ error: status === 404 ? 'Conversación no encontrada' : 'No autorizado' }, { status })
    }
    if (conversation.dependency_id !== user.id) {
      return NextResponse.json({ error: 'Solo la dependencia puede marcar como contactado' }, { status: 403 })
    }

    const supabase = await createClient()
    const { data: app } = await supabase
      .from('applications')
      .select('id')
      .eq('opportunity_id', conversation.opportunity_id)
      .eq('student_id', conversation.student_id)
      .maybeSingle()
    if (!app) return NextResponse.json({ error: 'Postulación no encontrada' }, { status: 404 })

    const result = await contactCandidate(app.id, user.id)
    if (result.error) return NextResponse.json({ error: result.error }, { status: result.status ?? 500 })
    return NextResponse.json({ success: true, conversationId: result.conversationId })
  } catch (error) {
    console.error('Error in contact POST:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
