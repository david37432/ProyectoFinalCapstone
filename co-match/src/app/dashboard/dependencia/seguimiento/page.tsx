import { requireAdmin } from '@/lib/supabase/server-auth'
import { SeguimientoClient } from '@/components/dashboard/dependencia/seguimiento/SeguimientoClient'
import { getSeguimientoProjects, getSeguimientoProjectById } from '@/lib/supabase/admin-queries'
import type { SeguimientoProject } from '@/lib/supabase/admin-queries'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ opportunityId?: string }>;
}

export default async function SeguimientoPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const opportunityId = resolvedParams.opportunityId;
  
  const user = await requireAdmin()

  // Fetch all projects for this dependency
  const projects = await getSeguimientoProjects(user.id);

  // Determine which project to show
  let selectedProject: SeguimientoProject | null = null;
  
  if (opportunityId) {
    // Try to find project by opportunityId (vacancy_id)
    const projectByVacancy = projects.find(p => p.vacancy_id === opportunityId);
    if (projectByVacancy) {
      selectedProject = await getSeguimientoProjectById(projectByVacancy.application_id);
    }
  }
  
  if (!selectedProject && projects.length > 0) {
    // Default to first project
    selectedProject = await getSeguimientoProjectById(projects[0].application_id);
  }

  return (
    <SeguimientoClient
      user={{
        id: user.id,
        full_name: user.full_name,
        email: user.email || '',
        role: user.role,
        department_name: user.department_name || '',
      }}
      projects={projects}
      selectedProject={selectedProject}
    />
  )
}