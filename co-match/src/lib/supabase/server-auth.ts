import { createClient } from './server'
import { redirect } from 'next/navigation'
import { cache } from 'react'

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

export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile, error } = await supabase
    .from('users')
    .select('full_name, email, role_id, department_id, is_profile_complete, is_active')
    .eq('id', user.id)
    .single()

  if (error || !profile || profile.is_active === false) {
    return null
  }

  const { data: role } = await supabase
    .from('roles')
    .select('name')
    .eq('id', profile.role_id)
    .single()

  const { data: department } = await supabase
    .from('departments')
    .select('name')
    .eq('id', profile.department_id)
    .single()

  return {
    id: user.id,
    email: user.email || profile.email,
    full_name: profile.full_name,
    role: role?.name || 'unknown',
    department_id: profile.department_id,
    department_name: department?.name || null,
    is_profile_complete: profile.is_profile_complete,
    is_active: profile.is_active,
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect('/auth/login')
  }
  return user
}

export async function requireRole(allowedRoles: string[]): Promise<AuthUser> {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role)) {
    redirect('/auth/login')
  }
  return user
}

export async function requireStudent(): Promise<AuthUser> {
  return requireRole(['postulante'])
}

export async function requireAdmin(): Promise<AuthUser> {
  return requireRole(['reclutador', 'jefe_area', 'admin'])
}