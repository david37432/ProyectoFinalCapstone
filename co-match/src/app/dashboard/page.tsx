import { requireAuth } from '@/lib/supabase/server-auth';
import { homePathForRole } from '@/lib/auth-roles';
import { redirect } from 'next/navigation';

/** /dashboard no tiene contenido propio: lleva a cada usuario a su inicio según el rol. */
export default async function DashboardPage() {
  const { user } = await requireAuth();
  redirect(homePathForRole(user.role));
}
