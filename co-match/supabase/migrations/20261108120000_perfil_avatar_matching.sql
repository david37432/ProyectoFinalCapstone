-- ============================================================================
-- CO-MATCH - Perfil del estudiante: foto, datos del registro y matching
-- Ejecutar DESPUÉS de 20261108000000_core_publish_apply_matching.sql
-- SQL Editor > New query > pegar > Run. Es idempotente.
-- ============================================================================

-- 1. Columnas del perfil que usa la app (por si la tabla se creó con el esquema viejo)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS student_code VARCHAR(30);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS availability_hours INTEGER;

-- 2. Máximo PAT: 25 horas semanales
UPDATE profiles SET availability_hours = 25 WHERE availability_hours > 25;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_availability_pat_max;
ALTER TABLE profiles ADD CONSTRAINT profiles_availability_pat_max
  CHECK (availability_hours IS NULL OR availability_hours BETWEEN 0 AND 25);

-- 3. Completar teléfono y código con lo que el usuario escribió al registrarse
UPDATE profiles p
SET phone = COALESCE(NULLIF(p.phone, ''), u.raw_user_meta_data->>'phone'),
    student_code = COALESCE(
      NULLIF(p.student_code, ''),
      NULLIF(u.raw_user_meta_data->>'student_code', ''),
      NULLIF(u.raw_user_meta_data->>'document_number', '')
    )
FROM auth.users u
WHERE u.id = p.id
  AND (COALESCE(p.phone, '') = '' OR COALESCE(p.student_code, '') = '');

-- 4. Matching: las dependencias pueden ver los perfiles de los estudiantes
DROP POLICY IF EXISTS "Dependencias ven perfiles de estudiantes" ON profiles;
CREATE POLICY "Dependencias ven perfiles de estudiantes" ON profiles
  FOR SELECT USING (role IN ('estudiante', 'postulante') AND is_dependency_user());

-- 5. Storage: bucket público "avatars" para las fotos de perfil (máx. 2 MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', TRUE, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Cada usuario solo puede subir/cambiar/borrar archivos dentro de su carpeta <user_id>/
DROP POLICY IF EXISTS "Avatares visibles para todos" ON storage.objects;
CREATE POLICY "Avatares visibles para todos" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Usuarios suben su avatar" ON storage.objects;
CREATE POLICY "Usuarios suben su avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Usuarios actualizan su avatar" ON storage.objects;
CREATE POLICY "Usuarios actualizan su avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Usuarios borran su avatar" ON storage.objects;
CREATE POLICY "Usuarios borran su avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
NOTIFY pgrst, 'reload schema';
