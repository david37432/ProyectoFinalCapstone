import { requireAdmin } from '@/lib/supabase/server-auth'
import { CandidatesClient } from '@/components/dashboard/dependencia/candidatos/CandidatesClient'
import { 
  getVacanciesForSelector, 
  getCandidatesByVacancy, 
  getVacancyById 
} from '@/lib/supabase/admin-queries'
import type { VacancySummary, CandidateDetail } from '@/lib/supabase/admin-queries'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ opportunityId?: string }>;
}

export default async function CandidatosPage({ params }: PageProps) {
  const resolvedParams = await params;
  const opportunityId = resolvedParams.opportunityId;
  
  const user = await requireAdmin()

  // Fetch vacancies for selector
  const vacancies = await getVacanciesForSelector(user.id);

  // Determine which vacancy to show
  let selectedVacancyId = opportunityId;
  if (!selectedVacancyId && vacancies.length > 0) {
    // Default to first vacancy if none specified
    selectedVacancyId = vacancies[0].id;
  }

  // Fetch candidates for selected vacancy
  let candidates: CandidateDetail[] = [];
  let vacancyTitle = '';
  
  if (selectedVacancyId) {
    const [candidatesData, vacancyData] = await Promise.all([
      getCandidatesByVacancy(selectedVacancyId),
      getVacancyById(selectedVacancyId),
    ]);
    candidates = candidatesData.map(c => ({ ...c, vacancy_title: vacancyData?.title || '' }));
    vacancyTitle = vacancyData?.title || '';
  }

  return (
    <CandidatesClient
      user={{
        full_name: user.full_name,
        email: user.email || '',
        role: user.role,
        department_name: user.department_name || '',
      }}
      initialVacancies={vacancies}
      initialCandidates={candidates}
      initialSelectedVacancyId={selectedVacancyId ?? null}
      vacancyTitle={vacancyTitle}
    />
  )
}