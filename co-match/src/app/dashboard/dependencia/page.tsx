import { requireAdmin } from '@/lib/supabase/server-auth'
import { DependenciaDashboardClient } from './DependenciaDashboardClient'
import { getAdminMetrics, getVacanciesWithDetails, getTopCandidates, getUserProfile } from '@/lib/supabase/admin-queries'
import type { AdminMetrics, VacancyWithDetails, TopCandidate } from '@/lib/supabase/admin-queries'

export default async function DependenciaDashboardPage() {
  const user = await requireAdmin()
  
  const [profile, metrics, vacancies, topCandidates] = await Promise.all([
    getUserProfile(user.id),
    getAdminMetrics(user.id),
    getVacanciesWithDetails(user.id),
    getTopCandidates(user.id, 5),
  ])

  return (
    <DependenciaDashboardClient
      user={{
        full_name: profile?.full_name || user.full_name,
        email: user.email,
        role: user.role,
        department_name: profile?.department_name || '',
      }}
      initialMetrics={{
        activeVacancies: metrics.activeVacancies,
        candidatesReviewed: metrics.candidatesReviewed,
        confirmedMatches: metrics.confirmedMatches,
        projectsInProgress: metrics.projectsInProgress,
      }}
      initialVacancies={vacancies}
      initialTopCandidates={topCandidates}
    />
  )
}