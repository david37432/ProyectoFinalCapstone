import { requireAdminApi } from '@/lib/supabase/server-auth'
import { getDependencyNotifications } from '@/lib/supabase/admin-queries'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requireAdminApi()
    if (!auth.user) return auth.response
    const notifications = await getDependencyNotifications(auth.user.id)
    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('Error in notifications GET:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
