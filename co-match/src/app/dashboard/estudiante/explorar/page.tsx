import { getStudentVacancies } from '@/lib/supabase/student-queries'
import { createClient } from '@/lib/supabase/server'
import ExplorarContent from './ExplorarContent'

export default async function ExplorarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div className="text-center py-12">Cargando...</div>
  }

  const vacancies = await getStudentVacancies(user.id)

  return <ExplorarContent initialVacancies={vacancies} userId={user.id} />
}