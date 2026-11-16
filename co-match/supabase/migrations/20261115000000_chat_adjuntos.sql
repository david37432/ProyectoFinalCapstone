-- ============================================================================
-- CO-MATCH - Adjuntos en el chat
--   * columnas de archivo en messages
--   * bucket PRIVADO "chat-files" (10 MB) con acceso solo para los participantes
-- Idempotente. Supabase > SQL Editor > New query > pegar TODO > Run
-- ============================================================================

ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'text';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_url TEXT;   -- ruta dentro del bucket
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_size INTEGER;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('chat-files', 'chat-files', FALSE, 10485760, ARRAY[
  'application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain', 'text/csv',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip'
])
ON CONFLICT (id) DO UPDATE
  SET public = FALSE,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- La primera carpeta de la ruta es el id de la conversación
DROP POLICY IF EXISTS "cm_chat_files_read" ON storage.objects;
CREATE POLICY "cm_chat_files_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'chat-files' AND cm_in_conversation(((storage.foldername(name))[1])::uuid));
DROP POLICY IF EXISTS "cm_chat_files_insert" ON storage.objects;
CREATE POLICY "cm_chat_files_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-files' AND cm_in_conversation(((storage.foldername(name))[1])::uuid));

NOTIFY pgrst, 'reload schema';
