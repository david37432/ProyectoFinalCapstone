import { requireAdminApi } from '@/lib/supabase/server-auth'
import { updateMilestoneStatus } from '@/lib/supabase/admin-queries'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

const VALID = ['pending', 'in_progress', 'completed'] as const

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminApi()
    if (!auth.user) return auth.response
    const user = auth.user
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const status = body?.status

    if (!VALID.includes(status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }

    const result = await updateMilestoneStatus(id, status, user.id)
    if (result.error) return NextResponse.json({ error: result.error }, { status: result.status })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in milestone PATCH:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
