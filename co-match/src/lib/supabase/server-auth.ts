import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export interface AuthUser {
  id: string
  email: string
  full_name: string
  role: string
  department_id: string | null
  department_name: string | null
  is_profile_complete: boolean
  is_active: boolean
}

interface AuthData {
  user: AuthUser
  profile: {
    id: string
    email: string
    role: string
    full_name?: string
  } | null
}

export async function getAuthenticatedUser(): Promise<{ user: AuthUser | null; profile: any }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.log("[getAuthenticatedUser] ❌ No hay usuario en sesión o error de auth:", authError?.message)
    return { user: null, profile: null }
  }

  // CORRECCIÓN CLAVE: Consultar la tabla 'profiles' en lugar de 'users'
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error("❌ Error al consultar 'profiles' en getAuthenticatedUser:", profileError.message)
  }

  const userRole = profile?.role || 'dependencia'

  const authUser: AuthUser = {
    id: user.id,
    email: user.email || '',
    full_name: profile?.full_name || '',
    role: userRole,
    department_id: profile?.department_id || null,
    department_name: null,
    is_profile_complete: !!profile,
    is_active: true,
  }

  return {
    user: authUser,
    profile: profile || { id: user.id, email: user.email, role: 'dependencia' },
  }
}

export async function requireAuth(allowedRoles?: string[]): Promise<{ user: AuthUser; profile: any }> {
  const authData = await getAuthenticatedUser()

  if (!authData || !authData.user) {
    console.log("🚨 REDIRECCIÓN DISPARADA DESDE: requireAuth - Usuario no autenticado")
    redirect('/auth/login')
  }

  const userRole = authData.user.role

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    console.log(`🚨 REDIRECCIÓN DISPARADA DESDE: requireAuth - Rol "${authData.user.role}" no autorizado`)
    redirect('/auth/login')
  }

  return { user: { ...authData.user, role: authData.profile?.role || 'dependencia' }, profile: authData.profile }
}

export async function requireRole(allowedRoles: string[]): Promise<{ user: AuthUser; profile: any }> {
  const authData = await requireAuth()
  const userRole = authData.user.role

  if (!allowedRoles.includes(userRole)) {
    console.log(`🚨 REDIRECCIÓN DISPARADA DESDE: src/lib/supabase/server-auth.ts (requireRole) - Rol no autorizado: ${authData.user.role}, permitidos: ${allowedRoles.join(', ')}`)
    redirect('/auth/login')
  }
  return { user: { ...authData.user, role: authData.profile?.role || 'dependencia' }, profile: authData.profile }
}

export async function requireStudent(): Promise<AuthUser> {
  const authData = await requireRole(['postulante'])
  return authData.user
}

export async function requireAdmin(): Promise<AuthUser> {
  const authData = await requireRole(['dependencia', 'reclutador', 'jefe_area', 'admin'])
  return authData.user
}