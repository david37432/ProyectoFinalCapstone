'use client';

import { createClient } from '@/lib/supabase/client';
import { CHAT_BUCKET, chatFilePath, validateChatFile } from '@/lib/chat-files';

export interface UploadedChatFile {
  path: string;
  name: string;
  size: number;
}

/** Valida y sube el archivo al bucket privado. Devuelve la ruta o un mensaje de error. */
export async function uploadChatFile(
  conversationId: string,
  file: File
): Promise<{ file?: UploadedChatFile; error?: string }> {
  const invalid = validateChatFile(file);
  if (invalid) return { error: invalid };

  const supabase = createClient();
  const path = chatFilePath(conversationId, file.name, crypto.randomUUID().slice(0, 8));
  const { error } = await supabase.storage.from(CHAT_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    return {
      error: /bucket/i.test(error.message)
        ? 'El almacenamiento de archivos aún no está configurado (falta ejecutar la migración de adjuntos).'
        : 'No se pudo subir el archivo. Inténtalo de nuevo.',
    };
  }
  return { file: { path, name: file.name, size: file.size } };
}

/** Abre un adjunto con un enlace firmado de 60 segundos (el bucket es privado). */
export async function openChatFile(path: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.storage.from(CHAT_BUCKET).createSignedUrl(path, 60);
  if (error || !data?.signedUrl) return 'No se pudo abrir el archivo';
  window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  return null;
}
