import { requireAdmin } from '@/lib/supabase/server-auth'
import { getConversationsForDependency } from '@/lib/supabase/admin-queries'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireAdmin()
    const conversations = await getConversationsForDependency(user.id)
    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Error in conversations GET:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
