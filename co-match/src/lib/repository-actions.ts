'use server';

import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';
import {
  REPO_BUCKET,
  isPathOwnedBy,
  normalizeLink,
  validateRepoInput,
  type RepoInput,
  type RepoSolution,
} from '@/lib/repository';

/* eslint-disable @typescript-eslint/no-explicit-any */
function toSolution(r: any): RepoSolution {
  return {
    id: r.id,
    authorId: r.author_id,
    authorName: r.author_name || 'Usuario',
    authorRole: r.author_role || 'estudiante',
    title: r.title,
    description: r.description ?? null,
    linkUrl: r.link_url ?? null,
    filePath: r.file_path ?? null,
    fileName: r.file_name ?? null,
    fileSize: r.file_size ?? null,
    createdAt: r.created_at,
  };
}

export async function listSolutions(): Promise<RepoSolution[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('solution_repository')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  return (data ?? []).map(toSolution);
}

export async function addSolutionAction(
  input: RepoInput
): Promise<{ success: boolean; error?: string; solution?: RepoSolution }> {
  const invalid = validateRepoInput(input);
  if (invalid) return { success: false, error: invalid };

  const { user } = await getAuthenticatedUser();
  if (!user) return { success: false, error: 'Debes iniciar sesión' };
  if (input.file && !isPathOwnedBy(input.file.path, user.id)) {
    return { success: false, error: 'Archivo inválido' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('solution_repository')
    .insert({
      author_id: user.id,
      author_name: user.full_name || user.email,
      author_role: user.role,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      link_url: normalizeLink(input.linkUrl),
      file_path: input.file?.path ?? null,
      file_name: input.file?.name?.trim().slice(0, 200) ?? null,
      file_size: input.file?.size ?? null,
    })
    .select('*')
    .single();

  if (error || !data) {
    // El archivo ya subido queda huérfano: se intenta borrar
    if (input.file) await supabase.storage.from(REPO_BUCKET).remove([input.file.path]);
    return {
      success: false,
      error: /relation|schema cache/i.test(error?.message ?? '')
        ? 'El repositorio aún no está configurado (falta ejecutar la migración).'
        : 'No se pudo publicar la solución',
    };
  }
  return { success: true, solution: toSolution(data) };
}

export async function deleteSolutionAction(id: string): Promise<{ success: boolean; error?: string }> {
  const { user } = await getAuthenticatedUser();
  if (!user) return { success: false, error: 'Debes iniciar sesión' };

  const supabase = await createClient();
  const { data: row } = await supabase
    .from('solution_repository')
    .select('author_id, file_path')
    .eq('id', id)
    .maybeSingle();
  if (!row || row.author_id !== user.id) return { success: false, error: 'No autorizado' };

  const { error } = await supabase.from('solution_repository').delete().eq('id', id).eq('author_id', user.id);
  if (error) return { success: false, error: 'No se pudo eliminar' };
  if (row.file_path) await supabase.storage.from(REPO_BUCKET).remove([row.file_path]);
  return { success: true };
}
