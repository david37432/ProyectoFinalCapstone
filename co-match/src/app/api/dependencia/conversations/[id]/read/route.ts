import { requireAdminApi } from '@/lib/supabase/server-auth'
import { getConversationForUser, markMessagesAsRead } from '@/lib/supabase/admin-queries'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminApi()
    if (!auth.user) return auth.response
    const user = auth.user
    const { id } = await params
    const { conversation, status } = await getConversationForUser(id, user.id)
    if (!conversation) {
      return NextResponse.json({ error: status === 404 ? 'Conversación no encontrada' : 'No autorizado' }, { status })
    }
    const { error } = await markMessagesAsRead(id, user.id)
    if (error) return NextResponse.json({ error: 'Error al marcar como leído' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in read POST:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
