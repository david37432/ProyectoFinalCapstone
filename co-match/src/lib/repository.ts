/** Reglas del repositorio de soluciones (la base de datos y el bucket aplican las mismas). */
import { CHAT_ALLOWED_TYPES, CHAT_MAX_BYTES, safeFileName, validateChatFile } from '@/lib/chat-files';

export const REPO_BUCKET = 'repo-files';
export const REPO_MAX_BYTES = CHAT_MAX_BYTES;
export const REPO_ALLOWED_TYPES = CHAT_ALLOWED_TYPES;

export interface RepoSolution {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  title: string;
  description: string | null;
  linkUrl: string | null;
  filePath: string | null;
  fileName: string | null;
  fileSize: number | null;
  createdAt: string;
}

export interface RepoInput {
  title: string;
  description?: string;
  linkUrl?: string;
  file?: { path: string; name: string; size?: number } | null;
}

export const validateRepoFile = validateChatFile;

/** Ruta en Storage: la primera carpeta es el id del autor (la usan las políticas RLS). */
export function repoFilePath(authorId: string, fileName: string, uid: string): string {
  return `${authorId}/${uid}-${safeFileName(fileName)}`;
}

export function isPathOwnedBy(path: unknown, authorId: string): path is string {
  return (
    typeof path === 'string' &&
    path.startsWith(`${authorId}/`) &&
    !path.includes('..') &&
    path.length <= 300
  );
}

/** Solo se aceptan enlaces http(s). Devuelve la URL normalizada o null si no es válida. */
export function normalizeLink(raw: string | undefined | null): string | null {
  const value = (raw ?? '').trim();
  if (!value) return null;
  const withProtocol = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withProtocol);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.hostname.includes('.')) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Valida el formulario. Devuelve un mensaje de error o null si todo está bien. */
export function validateRepoInput(input: RepoInput): string | null {
  const title = (input.title ?? '').trim();
  if (title.length < 3) return 'Ponle un nombre de al menos 3 caracteres';
  if (title.length > 120) return 'El nombre es demasiado largo (máximo 120 caracteres)';
  if ((input.description ?? '').length > 2000) return 'La descripción es demasiado larga (máximo 2000 caracteres)';
  const hasLink = (input.linkUrl ?? '').trim() !== '';
  if (hasLink && !normalizeLink(input.linkUrl)) return 'El enlace no es válido (debe empezar por http:// o https://)';
  if (!hasLink && !input.file) return 'Agrega un enlace o sube un archivo';
  return null;
}
