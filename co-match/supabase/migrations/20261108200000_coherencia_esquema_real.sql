-- ============================================================================
-- CO-MATCH - Ajustes sobre el esquema REAL de Supabase
--
-- Tablas existentes: profiles, opportunities, applications, conversations,
-- messages, project_milestones. Este script NO crea esas tablas ni borra datos:
--   * funciones auxiliares de permisos
--   * políticas RLS para que cada usuario vea/edite solo lo suyo
--   * índices, perfil (foto, teléfono, código), máximo PAT de 25 h
--   * tabla de reportes de errores (feedback) y bucket de fotos
--
-- Es idempotente: se puede ejecutar varias veces.
-- Supabase > SQL Editor > New query > pegar TODO el contenido > Run
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- 1. Funciones auxiliares (SECURITY DEFINER evita recursión entre políticas)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_dependency_user()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND lower(role) IN ('dependencia', 'reclutador', 'jefe_area', 'pat', 'admin', 'administrador')
  );
$$;

CREATE OR REPLACE FUNCTION cm_owns_opportunity(opp UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM opportunities WHERE id = opp AND dependency_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION cm_is_published(opp UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM opportunities
    WHERE id = opp
      AND lower(status) IN ('published', 'publicada', 'approved', 'aprobada', 'active', 'activa', 'open', 'abierta')
  );
$$;

CREATE OR REPLACE FUNCTION cm_has_applied(opp UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM applications WHERE opportunity_id = opp AND student_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION cm_in_conversation(conv UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversations
    WHERE id = conv AND (dependency_id = auth.uid() OR student_id = auth.uid())
  );
$$;

-- Número de postulaciones por necesidad (los estudiantes no pueden leer las de otros)
CREATE OR REPLACE FUNCTION cm_application_counts(opportunity_ids UUID[])
RETURNS TABLE (opportunity_id UUID, total BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.opportunity_id, COUNT(*)::BIGINT
  FROM applications a
  WHERE a.opportunity_id = ANY (opportunity_ids)
  GROUP BY a.opportunity_id;
$$;
GRANT EXECUTE ON FUNCTION cm_application_counts(UUID[]) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Estados de la necesidad: aceptar los que usa la app
--    (si existía un CHECK sobre opportunities.status se reemplaza por uno amplio)
-- ---------------------------------------------------------------------------
DO $$
DECLARE c RECORD;
BEGIN
  FOR c IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'opportunities' AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE opportunities DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE opportunities ADD CONSTRAINT opportunities_status_cm CHECK (
  status IS NULL OR lower(status) IN (
    'pending_pat', 'pending', 'pendiente', 'en_aprobacion', 'borrador', 'draft',
    'published', 'publicada', 'approved', 'aprobada', 'active', 'activa', 'open', 'abierta',
    'in_progress', 'en_curso', 'en_progreso', 'ongoing',
    'closed', 'cerrada', 'completed', 'completada', 'rejected', 'rechazada', 'cancelled', 'cancelada'
  )
) NOT VALID;

-- Máximo PAT: 25 horas semanales (NOT VALID: no toca los datos que ya existen)
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_weekly_hours_pat_max;
ALTER TABLE opportunities ADD CONSTRAINT opportunities_weekly_hours_pat_max
  CHECK (weekly_hours IS NULL OR weekly_hours BETWEEN 1 AND 25) NOT VALID;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_availability_pat_max;
ALTER TABLE profiles ADD CONSTRAINT profiles_availability_pat_max
  CHECK (availability_hours IS NULL OR availability_hours BETWEEN 0 AND 25) NOT VALID;

-- ---------------------------------------------------------------------------
-- 3. Índices y una sola postulación por estudiante y necesidad
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_opportunities_dependency ON opportunities(dependency_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_applications_opportunity ON applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_student ON applications(student_id);
CREATE INDEX IF NOT EXISTS idx_conversations_dependency ON conversations(dependency_id);
CREATE INDEX IF NOT EXISTS idx_conversations_student ON conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_milestones_opportunity ON project_milestones(opportunity_id);

DO $$
BEGIN
  -- Solo si no hay duplicados (si los hay, se deja como está para no fallar)
  IF NOT EXISTS (
    SELECT 1 FROM applications GROUP BY opportunity_id, student_id HAVING COUNT(*) > 1
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS uq_applications_opportunity_student
      ON applications(opportunity_id, student_id);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Perfil: columnas y datos del registro
-- ---------------------------------------------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS student_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Completar teléfono y código con lo que el usuario escribió al registrarse
UPDATE profiles p
SET phone = COALESCE(NULLIF(p.phone, ''), NULLIF(u.raw_user_meta_data->>'phone', '')),
    student_code = COALESCE(
      NULLIF(p.student_code, ''),
      NULLIF(u.raw_user_meta_data->>'student_code', ''),
      NULLIF(u.raw_user_meta_data->>'document_number', '')
    )
FROM auth.users u
WHERE u.id = p.id
  AND (COALESCE(p.phone, '') = '' OR COALESCE(p.student_code, '') = '');

-- ---------------------------------------------------------------------------
-- 5. Seguridad a nivel de fila (RLS)
--    Las políticas se suman a las que ya existan (Supabase las combina con OR).
-- ---------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;

-- profiles
DROP POLICY IF EXISTS "cm_profiles_own" ON profiles;
CREATE POLICY "cm_profiles_own" ON profiles FOR ALL TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
DROP POLICY IF EXISTS "cm_profiles_dependency_reads_students" ON profiles;
CREATE POLICY "cm_profiles_dependency_reads_students" ON profiles FOR SELECT TO authenticated
  USING (lower(role) IN ('estudiante', 'postulante') AND is_dependency_user());
DROP POLICY IF EXISTS "cm_profiles_read_dependencies" ON profiles;
CREATE POLICY "cm_profiles_read_dependencies" ON profiles FOR SELECT TO authenticated
  USING (lower(role) IN ('dependencia', 'reclutador', 'jefe_area', 'pat', 'admin', 'administrador'));

-- opportunities
DROP POLICY IF EXISTS "cm_opp_select" ON opportunities;
CREATE POLICY "cm_opp_select" ON opportunities FOR SELECT TO authenticated
  USING (dependency_id = auth.uid() OR cm_is_published(id) OR cm_has_applied(id));
DROP POLICY IF EXISTS "cm_opp_insert" ON opportunities;
CREATE POLICY "cm_opp_insert" ON opportunities FOR INSERT TO authenticated
  WITH CHECK (dependency_id = auth.uid() AND is_dependency_user());
DROP POLICY IF EXISTS "cm_opp_update" ON opportunities;
CREATE POLICY "cm_opp_update" ON opportunities FOR UPDATE TO authenticated
  USING (dependency_id = auth.uid()) WITH CHECK (dependency_id = auth.uid());
DROP POLICY IF EXISTS "cm_opp_delete" ON opportunities;
CREATE POLICY "cm_opp_delete" ON opportunities FOR DELETE TO authenticated
  USING (dependency_id = auth.uid());

-- applications
DROP POLICY IF EXISTS "cm_app_select" ON applications;
CREATE POLICY "cm_app_select" ON applications FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR cm_owns_opportunity(opportunity_id));
DROP POLICY IF EXISTS "cm_app_insert" ON applications;
CREATE POLICY "cm_app_insert" ON applications FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() AND cm_is_published(opportunity_id));
DROP POLICY IF EXISTS "cm_app_update_dependency" ON applications;
CREATE POLICY "cm_app_update_dependency" ON applications FOR UPDATE TO authenticated
  USING (cm_owns_opportunity(opportunity_id)) WITH CHECK (cm_owns_opportunity(opportunity_id));
DROP POLICY IF EXISTS "cm_app_delete_own_pending" ON applications;
CREATE POLICY "cm_app_delete_own_pending" ON applications FOR DELETE TO authenticated
  USING (student_id = auth.uid()
         AND COALESCE(dependency_status, 'pending') = 'pending'
         AND COALESCE(is_match, FALSE) = FALSE);

-- conversations
DROP POLICY IF EXISTS "cm_conv_select" ON conversations;
CREATE POLICY "cm_conv_select" ON conversations FOR SELECT TO authenticated
  USING (dependency_id = auth.uid() OR student_id = auth.uid());
DROP POLICY IF EXISTS "cm_conv_insert" ON conversations;
CREATE POLICY "cm_conv_insert" ON conversations FOR INSERT TO authenticated
  WITH CHECK (dependency_id = auth.uid() AND cm_owns_opportunity(opportunity_id));
DROP POLICY IF EXISTS "cm_conv_update" ON conversations;
CREATE POLICY "cm_conv_update" ON conversations FOR UPDATE TO authenticated
  USING (dependency_id = auth.uid() OR student_id = auth.uid());

-- messages
DROP POLICY IF EXISTS "cm_msg_select" ON messages;
CREATE POLICY "cm_msg_select" ON messages FOR SELECT TO authenticated
  USING (cm_in_conversation(conversation_id));
DROP POLICY IF EXISTS "cm_msg_insert" ON messages;
CREATE POLICY "cm_msg_insert" ON messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND cm_in_conversation(conversation_id));
DROP POLICY IF EXISTS "cm_msg_update" ON messages;
CREATE POLICY "cm_msg_update" ON messages FOR UPDATE TO authenticated
  USING (cm_in_conversation(conversation_id));

-- project_milestones
DROP POLICY IF EXISTS "cm_ms_select" ON project_milestones;
CREATE POLICY "cm_ms_select" ON project_milestones FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR cm_owns_opportunity(opportunity_id));
DROP POLICY IF EXISTS "cm_ms_write" ON project_milestones;
CREATE POLICY "cm_ms_write" ON project_milestones FOR ALL TO authenticated
  USING (cm_owns_opportunity(opportunity_id)) WITH CHECK (cm_owns_opportunity(opportunity_id));

-- ---------------------------------------------------------------------------
-- 6. Reportes de errores / feedback (fase Legal: Feedback Loop)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feedback_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('error', 'sugerencia', 'otro')),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 10 AND 2000),
  page_url VARCHAR(500),
  status VARCHAR(20) NOT NULL DEFAULT 'abierto' CHECK (status IN ('abierto', 'en_progreso', 'resuelto')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE feedback_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cm_feedback_insert" ON feedback_reports;
CREATE POLICY "cm_feedback_insert" ON feedback_reports
  FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid());
DROP POLICY IF EXISTS "cm_feedback_select_own" ON feedback_reports;
CREATE POLICY "cm_feedback_select_own" ON feedback_reports
  FOR SELECT USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 7. Storage: bucket público "avatars" para fotos de perfil (máx. 2 MB)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', TRUE, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "cm_avatars_read" ON storage.objects;
CREATE POLICY "cm_avatars_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "cm_avatars_insert" ON storage.objects;
CREATE POLICY "cm_avatars_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "cm_avatars_update" ON storage.objects;
CREATE POLICY "cm_avatars_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "cm_avatars_delete" ON storage.objects;
CREATE POLICY "cm_avatars_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- 8. Mensajes en tiempo real (el chat del estudiante escucha la tabla messages)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 9. Recargar el caché de la API de Supabase
-- ---------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
