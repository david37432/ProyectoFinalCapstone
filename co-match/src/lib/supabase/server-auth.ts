import { normalizeRole, homePathForRole } from '@/lib/auth-roles'
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

  // Rol normalizado: 'estudiante' | 'dependencia'. Sin perfil → metadata → estudiante (mínimo privilegio)
  const userRole = normalizeRole(profile?.role ?? user.user_metadata?.role)

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
    profile: profile || { id: user.id, email: user.email, role: userRole },
  }
}

export async function requireAuth(allowedRoles?: string[]): Promise<{ user: AuthUser; profile: any }> {
  const authData = await getAuthenticatedUser()

  if (!authData || !authData.user) {
    console.log("🚨 REDIRECCIÓN DISPARADA DESDE: requireAuth - Usuario no autenticado")
    redirect('/auth/login')
  }

  const userRole = authData.user.role

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.map(normalizeRole).includes(normalizeRole(userRole))) {
    console.log(`🚨 requireAuth - Rol "${userRole}" no autorizado. Redirigiendo a su inicio.`)
    // Se redirige al inicio de su rol (no al login) para evitar bucles
    redirect(homePathForRole(userRole))
  }

  return { user: authData.user, profile: authData.profile }
}

export async function requireRole(allowedRoles: string[]): Promise<{ user: AuthUser; profile: any }> {
  return requireAuth(allowedRoles)
}

export async function requireStudent(): Promise<AuthUser> {
  const authData = await requireRole(['estudiante'])
  return authData.user
}

export async function requireAdmin(): Promise<AuthUser> {
  const authData = await requireRole(['dependencia'])
  return authData.user
}

/**
 * Para rutas API: devuelve el usuario si es dependencia, o una respuesta
 * 401/403 (redirect() dentro de una ruta API terminaba en error 500).
 */
export async function requireAdminApi(): Promise<
  { user: AuthUser; response: null } | { user: null; response: Response }
> {
  const { user } = await getAuthenticatedUser()
  if (!user) {
    return { user: null, response: Response.json({ error: 'No autenticado' }, { status: 401 }) }
  }
  if (normalizeRole(user.role) !== 'dependencia') {
    return { user: null, response: Response.json({ error: 'No autorizado' }, { status: 403 }) }
  }
  return { user, response: null }
}
