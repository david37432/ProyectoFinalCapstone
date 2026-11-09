import { requireAdmin } from '@/lib/supabase/server-auth'
import { getSeguimientoProjects } from '@/lib/supabase/admin-queries'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireAdmin()
    const projects = await getSeguimientoProjects(user.id)
    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Error in projects GET:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
