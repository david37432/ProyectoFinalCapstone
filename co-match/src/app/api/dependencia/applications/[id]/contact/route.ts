import { requireAdminApi } from '@/lib/supabase/server-auth'
import { contactCandidate } from '@/lib/supabase/admin-queries'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

/**
 * La dependencia contacta a un candidato: match confirmado, conversación
 * creada y hitos iniciales del proyecto.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminApi()
    if (!auth.user) return auth.response
    const user = auth.user
    const { id } = await params
    const result = await contactCandidate(id, user.id)
    if (result.error) return NextResponse.json({ error: result.error }, { status: result.status ?? 500 })
    return NextResponse.json({ success: true, conversationId: result.conversationId })
  } catch (error) {
    console.error('Error in contact API:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
