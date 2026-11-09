import { requireAdmin } from '@/lib/supabase/server-auth'
import { getConversationForUser, getMessagesForConversation, sendMessage } from '@/lib/supabase/admin-queries'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireAdmin()
    const { id } = await params
    const { conversation, status } = await getConversationForUser(id, user.id)
    if (!conversation) {
      return NextResponse.json({ error: status === 404 ? 'Conversación no encontrada' : 'No autorizado' }, { status })
    }
    const messages = await getMessagesForConversation(id, user.id)
    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error in messages GET:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireAdmin()
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const content = typeof body?.content === 'string' ? body.content.trim() : ''

    if (!content) {
      return NextResponse.json({ error: 'El contenido del mensaje es requerido' }, { status: 400 })
    }
    if (content.length > 5000) {
      return NextResponse.json({ error: 'El mensaje es demasiado largo' }, { status: 400 })
    }

    const { conversation, status } = await getConversationForUser(id, user.id)
    if (!conversation) {
      return NextResponse.json({ error: status === 404 ? 'Conversación no encontrada' : 'No autorizado' }, { status })
    }

    const { message, error } = await sendMessage(id, user.id, content)
    if (error || !message) {
      return NextResponse.json({ error: 'Error al enviar mensaje' }, { status: 500 })
    }
    return NextResponse.json({ message })
  } catch (error) {
    console.error('Error in messages POST:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
