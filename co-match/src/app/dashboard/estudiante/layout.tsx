import StudentLayout from '@/components/dashboard/StudentLayout';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';

export default async function EstudianteLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getAuthenticatedUser();
  return (
    <StudentLayout userName={user?.full_name || user?.email || 'Estudiante'} avatarUrl={profile?.avatar_url ?? null}>
      {children}
    </StudentLayout>
  );
}
