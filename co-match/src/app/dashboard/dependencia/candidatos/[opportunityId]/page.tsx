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
  params: Promise<{ opportunityId: string }>;
}

export default async function CandidatosOpportunityPage({ params }: PageProps) {
  const resolvedParams = await params;
  const opportunityId = resolvedParams.opportunityId;
  
  const user = await requireAdmin()

  // Fetch vacancies for selector
  const vacancies = await getVacanciesForSelector(user.id);

  // Validate that the opportunityId belongs to this user
  const validVacancy = vacancies.find(v => v.id === opportunityId);
  
  // Fetch candidates for selected vacancy
  let candidates: CandidateDetail[] = [];
  let vacancyTitle = '';
  
  if (validVacancy) {
    const [candidatesData, vacancyData] = await Promise.all([
      getCandidatesByVacancy(opportunityId),
      getVacancyById(opportunityId),
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
      initialSelectedVacancyId={validVacancy ? opportunityId : null}
      vacancyTitle={vacancyTitle}
    />
  )
}