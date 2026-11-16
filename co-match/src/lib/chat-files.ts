/** Reglas para archivos adjuntos del chat (el bucket de Supabase aplica las mismas). */
export const CHAT_BUCKET = 'chat-files';
export const CHAT_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export const CHAT_ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/zip': 'zip',
};

export function validateChatFile(file: { name: string; size: number; type: string }): string | null {
  if (!file.name) return 'El archivo no tiene nombre';
  if (file.size <= 0) return 'El archivo está vacío';
  if (file.size > CHAT_MAX_BYTES) return 'El archivo supera el máximo de 10 MB';
  if (!CHAT_ALLOWED_TYPES[file.type]) {
    return 'Tipo de archivo no permitido (usa PDF, imágenes, Word, Excel, PowerPoint, TXT, CSV o ZIP)';
  }
  return null;
}

/** Nombre seguro para la ruta de Storage (sin acentos, espacios ni caracteres raros). */
export function safeFileName(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(-80);
  return base || 'archivo';
}

/** Ruta en Storage: la primera carpeta es el id de la conversación (la usan las políticas RLS). */
export function chatFilePath(conversationId: string, fileName: string, uid: string): string {
  return `${conversationId}/${uid}-${safeFileName(fileName)}`;
}

/** Una ruta recibida del cliente solo es válida si pertenece a esa conversación. */
export function isPathInConversation(path: unknown, conversationId: string): path is string {
  return (
    typeof path === 'string' &&
    path.startsWith(`${conversationId}/`) &&
    !path.includes('..') &&
    path.length <= 300
  );
}
