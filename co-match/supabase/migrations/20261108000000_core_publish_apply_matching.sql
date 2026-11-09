-- ============================================================================
-- CO-MATCH - Core: publicar vacantes, postulaciones y matching
-- Ejecutar en Supabase: SQL Editor > New query > pegar y "Run"
-- Es idempotente (se puede ejecutar más de una vez).
-- ============================================================================

-- 1. Catálogo de departamentos que usa el formulario "Publicar necesidad"
INSERT INTO departments (name) VALUES
  ('Coordinación PAT'),
  ('Dirección de Estudiantes'),
  ('Recursos Humanos'),
  ('Facultad de Ingeniería'),
  ('Biblioteca'),
  ('Finanzas'),
  ('Dirección de Comunicaciones'),
  ('Dirección de Tecnologías de Información'),
  ('Centro de Emprendimiento'),
  ('Facultad de Ciencias Económicas y Administrativas'),
  ('Facultad de Derecho'),
  ('Facultad de Medicina'),
  ('Facultad de Ciencias'),
  ('Dirección de Bienestar Universitario')
ON CONFLICT (name) DO NOTHING;

-- 2. Catálogo de habilidades
INSERT INTO skills (name, category) VALUES
  ('Python', 'programacion'), ('Excel Avanzado', 'ofimatica'), ('Power BI', 'analitica'),
  ('JavaScript', 'programacion'), ('SQL', 'datos'), ('Apps Script', 'automatizacion'),
  ('Tableau', 'analitica'), ('R', 'programacion'), ('Node.js', 'programacion'),
  ('MySQL', 'datos'), ('RPA/UiPath', 'automatizacion'), ('VBA', 'automatizacion'),
  ('Zapier', 'automatizacion'), ('Pandas', 'datos')
ON CONFLICT (name) DO NOTHING;

-- Helper: ¿el usuario actual es dependencia/reclutador/admin?
CREATE OR REPLACE FUNCTION is_dependency_user()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'dependencia')
      OR EXISTS (
        SELECT 1 FROM users u JOIN roles r ON r.id = u.role_id
        WHERE u.id = auth.uid() AND r.name IN ('reclutador', 'jefe_area', 'admin')
      );
$$;

-- 3. Las dependencias registradas en `profiles` también pueden crear vacantes
DROP POLICY IF EXISTS "Dependencias crean vacantes" ON vacancies;
CREATE POLICY "Dependencias crean vacantes" ON vacancies
  FOR INSERT WITH CHECK (created_by = auth.uid() AND is_dependency_user());

DROP POLICY IF EXISTS "Creadores eliminan sus vacantes" ON vacancies;
CREATE POLICY "Creadores eliminan sus vacantes" ON vacancies
  FOR DELETE USING (created_by = auth.uid());

-- vacancy_skills: la política FOR ALL existente no tiene WITH CHECK explícito
DROP POLICY IF EXISTS "Creador inserta habilidades de vacante" ON vacancy_skills;
CREATE POLICY "Creador inserta habilidades de vacante" ON vacancy_skills
  FOR INSERT WITH CHECK (vacancy_id IN (SELECT id FROM vacancies WHERE created_by = auth.uid()));

DROP POLICY IF EXISTS "Habilidades de vacantes publicadas visibles" ON vacancy_skills;
CREATE POLICY "Habilidades de vacantes publicadas visibles" ON vacancy_skills
  FOR SELECT USING (vacancy_id IN (SELECT id FROM vacancies WHERE status = 'publicada'));

-- 4. Dependencias pueden registrar habilidades nuevas
DROP POLICY IF EXISTS "Dependencias crean habilidades" ON skills;
CREATE POLICY "Dependencias crean habilidades" ON skills
  FOR INSERT WITH CHECK (is_dependency_user());

-- 5. Matching: dependencias ven perfiles y habilidades de candidatos disponibles para PAT
DROP POLICY IF EXISTS "Dependencias ven candidatos disponibles" ON candidate_profiles;
CREATE POLICY "Dependencias ven candidatos disponibles" ON candidate_profiles
  FOR SELECT USING (is_available_for_pat = TRUE AND is_dependency_user());

DROP POLICY IF EXISTS "Dependencias ven habilidades de candidatos" ON candidate_skills;
CREATE POLICY "Dependencias ven habilidades de candidatos" ON candidate_skills
  FOR SELECT USING (
    is_dependency_user()
    AND candidate_profile_id IN (SELECT id FROM candidate_profiles WHERE is_available_for_pat = TRUE)
  );

-- 6. El estudiante puede retirar su postulación mientras siga en 'recibida'
DROP POLICY IF EXISTS "Candidatos retiran postulaciones" ON applications;
CREATE POLICY "Candidatos retiran postulaciones" ON applications
  FOR DELETE USING (candidate_id = auth.uid() AND status = 'recibida');

-- 7. Tabla de reportes de errores / feedback (fase Legal: Feedback Loop)
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

DROP POLICY IF EXISTS "Usuarios envían feedback" ON feedback_reports;
CREATE POLICY "Usuarios envían feedback" ON feedback_reports
  FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Usuarios ven su feedback" ON feedback_reports;
CREATE POLICY "Usuarios ven su feedback" ON feedback_reports
  FOR SELECT USING (user_id = auth.uid());
