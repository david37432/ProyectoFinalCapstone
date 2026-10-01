import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PerfilContent from './PerfilContent'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Obtener perfil de public.profiles
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url, role, career, experience, availability_hours, created_at, updated_at')
    .eq('id', user.id)
    .maybeSingle()

  // Si no existe perfil, hacer auto-upsert mínimo para crearlo
  let profileData = profile
  if (!profileData) {
    const { data: created, error: createError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, email: user.email, role: 'estudiante' }, { onConflict: 'id' })
      .select('id, full_name, email, avatar_url, role, career, experience, availability_hours, created_at, updated_at')
      .single()

    if (createError || !created) {
      console.error('Error creating profile:', createError)
    } else {
      profileData = created
    }
  }

  // Fallback final usando user_metadata si aún no hay perfil
  const initialProfile = {
    id: user.id,
    email: user.email || '',
    full_name: profileData?.full_name || user.user_metadata?.full_name || '',
    role: profileData?.role || user.user_metadata?.role || 'estudiante',
    phone: '',
    student_code: '',
    career: profileData?.career || null,
    semester: undefined,
    focus: '',
    gpa: undefined,
    availability_hours: profileData?.availability_hours || null,
    skills: [],
    interests: [],
    experience: profileData?.experience || '',
    completion: 0,
    avatar_url: profileData?.avatar_url || null,
    created_at: profileData?.created_at || new Date().toISOString(),
    updated_at: profileData?.updated_at || new Date().toISOString(),
  }

  // Calcular completion básico
  const fields = [
    initialProfile.full_name, initialProfile.email, initialProfile.phone, initialProfile.student_code,
    initialProfile.career, initialProfile.semester, initialProfile.focus, initialProfile.gpa,
    initialProfile.skills.length > 0, initialProfile.interests.length > 0, initialProfile.experience, initialProfile.availability_hours
  ]
  const filled = fields.filter(Boolean).length
  initialProfile.completion = Math.round((filled / fields.length) * 100)

  console.log('[page.tsx] initialProfile enviado al cliente:', initialProfile);
  return <PerfilContent initialProfile={initialProfile} userId={user.id} />
}