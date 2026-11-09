import { DependenciaShell } from '@/components/layout/admin/DependenciaShell';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';

export default async function DependenciaLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getAuthenticatedUser();

  return (
    <DependenciaShell userName={user?.full_name || user?.email || 'Usuario'} departmentName="Dependencia">
      {children}
    </DependenciaShell>
  );
}
