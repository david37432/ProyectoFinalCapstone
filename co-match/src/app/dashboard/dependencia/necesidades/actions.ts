'use server';

import { revalidatePath } from 'next/cache';
import { validateVacancyForm, type VacancyFormInput } from '@/lib/matching';
import { requireAdminApi } from '@/lib/supabase/server-auth';
import { removeVacancy, setVacancyOpen, updateVacancy } from '@/lib/supabase/admin-queries';

export interface VacancyActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  mode?: 'delete' | 'cancel' | null;
}

async function currentDependencyId(): Promise<string | null> {
  const auth = await requireAdminApi();
  return auth.user?.id ?? null;
}

function refresh(id: string) {
  revalidatePath('/dashboard/dependencia');
  revalidatePath(`/dashboard/dependencia/necesidades/${id}`);
  revalidatePath('/dashboard/estudiante/explorar');
}

export async function updateVacancyAction(id: string, input: VacancyFormInput): Promise<VacancyActionResult> {
  const validation = validateVacancyForm(input);
  if (!validation.ok) return { success: false, error: 'Revisa los campos del formulario', fieldErrors: validation.errors };
  const userId = await currentDependencyId();
  if (!userId) return { success: false, error: 'No autorizado' };
  const result = await updateVacancy(id, userId, validation.data);
  if (result.error) return { success: false, error: result.error };
  refresh(id);
  return { success: true };
}

export async function setVacancyOpenAction(id: string, open: boolean): Promise<VacancyActionResult> {
  const userId = await currentDependencyId();
  if (!userId) return { success: false, error: 'No autorizado' };
  const result = await setVacancyOpen(id, userId, open);
  if (result.error) return { success: false, error: result.error };
  refresh(id);
  return { success: true };
}

export async function removeVacancyAction(id: string): Promise<VacancyActionResult> {
  const userId = await currentDependencyId();
  if (!userId) return { success: false, error: 'No autorizado' };
  const result = await removeVacancy(id, userId);
  if (result.error) return { success: false, error: result.error };
  refresh(id);
  return { success: true, mode: result.mode };
}
