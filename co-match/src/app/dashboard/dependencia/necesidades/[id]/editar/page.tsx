import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/supabase/server-auth';
import { getOwnVacancyDetail } from '@/lib/supabase/admin-queries';
import { VacancyForm } from '@/components/dashboard/dependencia/publicar/VacancyForm';

export const dynamic = 'force-dynamic';

export default async function EditarNecesidadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireAdmin();
  const vacancy = await getOwnVacancyDetail(id, user.id);
  if (!vacancy) notFound();

  return (
    <VacancyForm
      mode="edit"
      vacancyId={vacancy.id}
      initial={{
        title: vacancy.title,
        department: vacancy.area,
        description: vacancy.description,
        skills: vacancy.skills,
        weeklyHours: String(vacancy.weekly_hours || 20),
        durationMonths: String(vacancy.duration_months || 3),
      }}
    />
  );
}
