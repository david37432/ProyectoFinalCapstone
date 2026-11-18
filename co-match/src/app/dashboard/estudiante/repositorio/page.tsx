import { redirect } from 'next/navigation';
import RepositorioClient from '@/components/repository/RepositorioClient';
import { listSolutions } from '@/lib/repository-actions';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';

export default async function RepositorioPage() {
  const { user } = await getAuthenticatedUser();
  if (!user) redirect('/auth/login');
  return <RepositorioClient initialSolutions={await listSolutions()} userId={user.id} />;
}
