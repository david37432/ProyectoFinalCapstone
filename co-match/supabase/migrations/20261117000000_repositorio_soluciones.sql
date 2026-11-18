-- ============================================================================
-- CO-MATCH - Repositorio de soluciones
--   * tabla solution_repository: enlaces o archivos de soluciones ya realizadas
--   * bucket PRIVADO "repo-files" (10 MB); la primera carpeta de la ruta es el id del autor
-- Lo ven todos los usuarios autenticados; solo el autor publica y elimina lo suyo.
-- Idempotente. Supabase > SQL Editor > New query > pegar TODO > Run
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS solution_repository (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL DEFAULT '',          -- copia del nombre (los estudiantes no pueden leer perfiles ajenos)
  author_role TEXT NOT NULL DEFAULT 'estudiante',
  title VARCHAR(120) NOT NULL CHECK (char_length(trim(title)) >= 3),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 2000),
  link_url TEXT CHECK (link_url IS NULL OR link_url ~* '^https?://'),
  file_path TEXT,                                 -- ruta dentro del bucket repo-files
  file_name TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT solution_repository_has_content CHECK (link_url IS NOT NULL OR file_path IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_solution_repository_created ON solution_repository (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_solution_repository_author ON solution_repository (author_id);

ALTER TABLE solution_repository ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cm_repo_select" ON solution_repository;
CREATE POLICY "cm_repo_select" ON solution_repository FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS "cm_repo_insert" ON solution_repository;
CREATE POLICY "cm_repo_insert" ON solution_repository FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());
DROP POLICY IF EXISTS "cm_repo_delete" ON solution_repository;
CREATE POLICY "cm_repo_delete" ON solution_repository FOR DELETE TO authenticated
  USING (author_id = auth.uid());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('repo-files', 'repo-files', FALSE, 10485760, ARRAY[
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

DROP POLICY IF EXISTS "cm_repo_files_read" ON storage.objects;
CREATE POLICY "cm_repo_files_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'repo-files');
DROP POLICY IF EXISTS "cm_repo_files_insert" ON storage.objects;
CREATE POLICY "cm_repo_files_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'repo-files' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "cm_repo_files_delete" ON storage.objects;
CREATE POLICY "cm_repo_files_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'repo-files' AND (storage.foldername(name))[1] = auth.uid()::text);

NOTIFY pgrst, 'reload schema';
