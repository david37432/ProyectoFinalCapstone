import { getStudentApplications } from '@/lib/supabase/student-queries'
import { createClient } from '@/lib/supabase/server'
import MisAppsContent from './MisAppsContent'

export default async function MisAppsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div className="text-center py-12">Cargando...</div>
  }

  const applications = await getStudentApplications(user.id)

  return <MisAppsContent initialApplications={applications} />
}