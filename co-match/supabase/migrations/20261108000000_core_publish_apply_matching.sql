-- ============================================================================
-- CO-MATCH - Core: tablas y permisos para publicar necesidades, postularse
-- y hacer matching.
--
-- Es AUTOSUFICIENTE: crea las tablas solo si no existen, así que funciona
-- tanto si el esquema inicial (20240925000000) se ejecutó como si no.
-- Es idempotente: se puede ejecutar varias veces.
--
-- Supabase > SQL Editor > New query > pegar todo > Run
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- 1. Helper de roles (solo depende de la tabla profiles)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_dependency_user()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND lower(role) IN ('dependencia', 'reclutador', 'jefe_area', 'pat', 'admin', 'administrador')
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. Tablas (se crean solo si faltan)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50),
  description TEXT,
  is_technical BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vacancies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  responsibilities TEXT,
  contract_type VARCHAR(30) NOT NULL DEFAULT 'pasantia'
    CHECK (contract_type IN ('fijo', 'temporal', 'pasantia', 'prestacion_servicios')),
  modality VARCHAR(20) NOT NULL DEFAULT 'hibrido'
    CHECK (modality IN ('presencial', 'remoto', 'hibrido')),
  location VARCHAR(100),
  salary_range_min NUMERIC(12,2),
  salary_range_max NUMERIC(12,2),
  pat_hours_per_week INTEGER CHECK (pat_hours_per_week IS NULL OR pat_hours_per_week BETWEEN 1 AND 25),
  department_id UUID NOT NULL REFERENCES departments(id),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  available_slots INTEGER DEFAULT 1,
  filled_slots INTEGER DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'borrador'
    CHECK (status IN ('borrador', 'en_aprobacion', 'publicada', 'cerrada', 'cancelada')),
  publication_date TIMESTAMPTZ,
  closing_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vacancy_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vacancy_id UUID NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT TRUE,
  weight INTEGER DEFAULT 1 CHECK (weight BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (vacancy_id, skill_id)
);

CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vacancy_id UUID NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL DEFAULT 'recibida'
    CHECK (status IN ('recibida', 'en_revision', 'entrevista', 'prueba', 'aceptada', 'rechazada')),
  match_score INTEGER DEFAULT 0 CHECK (match_score BETWEEN 0 AND 100),
  cover_letter TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  UNIQUE (vacancy_id, candidate_id)
);
-- Columna que usa el panel de candidatos ("Contactar" / "Contactado")
ALTER TABLE applications ADD COLUMN IF NOT EXISTS dependency_status VARCHAR(20) DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_vacancies_status ON vacancies(status);
CREATE INDEX IF NOT EXISTS idx_vacancies_created_by ON vacancies(created_by);
CREATE INDEX IF NOT EXISTS idx_applications_vacancy ON applications(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate ON applications(candidate_id);

-- ---------------------------------------------------------------------------
-- 3. Catálogos
-- ---------------------------------------------------------------------------
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

INSERT INTO skills (name, category) VALUES
  ('Python', 'programacion'), ('Excel Avanzado', 'ofimatica'), ('Power BI', 'analitica'),
  ('JavaScript', 'programacion'), ('SQL', 'datos'), ('Apps Script', 'automatizacion'),
  ('Tableau', 'analitica'), ('R', 'programacion'), ('Node.js', 'programacion'),
  ('MySQL', 'datos'), ('RPA/UiPath', 'automatizacion'), ('VBA', 'automatizacion'),
  ('Zapier', 'automatizacion'), ('Pandas', 'datos')
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Seguridad a nivel de fila (RLS)
-- ---------------------------------------------------------------------------
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacancy_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- departments / skills: lectura para cualquier usuario con sesión
DROP POLICY IF EXISTS "cm_departments_select" ON departments;
CREATE POLICY "cm_departments_select" ON departments FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "cm_skills_select" ON skills;
CREATE POLICY "cm_skills_select" ON skills FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS "cm_skills_insert" ON skills;
CREATE POLICY "cm_skills_insert" ON skills FOR INSERT TO authenticated WITH CHECK (is_dependency_user());

-- vacancies
DROP POLICY IF EXISTS "cm_vacancies_select_published" ON vacancies;
CREATE POLICY "cm_vacancies_select_published" ON vacancies FOR SELECT TO authenticated USING (status = 'publicada');
DROP POLICY IF EXISTS "cm_vacancies_select_own" ON vacancies;
CREATE POLICY "cm_vacancies_select_own" ON vacancies FOR SELECT TO authenticated USING (created_by = auth.uid());
DROP POLICY IF EXISTS "cm_vacancies_insert" ON vacancies;
CREATE POLICY "cm_vacancies_insert" ON vacancies FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND is_dependency_user());
DROP POLICY IF EXISTS "cm_vacancies_update_own" ON vacancies;
CREATE POLICY "cm_vacancies_update_own" ON vacancies FOR UPDATE TO authenticated USING (created_by = auth.uid());
DROP POLICY IF EXISTS "cm_vacancies_delete_own" ON vacancies;
CREATE POLICY "cm_vacancies_delete_own" ON vacancies FOR DELETE TO authenticated USING (created_by = auth.uid());

-- vacancy_skills
DROP POLICY IF EXISTS "cm_vacancy_skills_select" ON vacancy_skills;
CREATE POLICY "cm_vacancy_skills_select" ON vacancy_skills FOR SELECT TO authenticated
  USING (vacancy_id IN (SELECT id FROM vacancies WHERE status = 'publicada' OR created_by = auth.uid()));
DROP POLICY IF EXISTS "cm_vacancy_skills_insert" ON vacancy_skills;
CREATE POLICY "cm_vacancy_skills_insert" ON vacancy_skills FOR INSERT TO authenticated
  WITH CHECK (vacancy_id IN (SELECT id FROM vacancies WHERE created_by = auth.uid()));
DROP POLICY IF EXISTS "cm_vacancy_skills_delete" ON vacancy_skills;
CREATE POLICY "cm_vacancy_skills_delete" ON vacancy_skills FOR DELETE TO authenticated
  USING (vacancy_id IN (SELECT id FROM vacancies WHERE created_by = auth.uid()));

-- applications
DROP POLICY IF EXISTS "cm_applications_select" ON applications;
CREATE POLICY "cm_applications_select" ON applications FOR SELECT TO authenticated
  USING (candidate_id = auth.uid() OR vacancy_id IN (SELECT id FROM vacancies WHERE created_by = auth.uid()));
DROP POLICY IF EXISTS "cm_applications_insert" ON applications;
CREATE POLICY "cm_applications_insert" ON applications FOR INSERT TO authenticated
  WITH CHECK (candidate_id = auth.uid()
              AND EXISTS (SELECT 1 FROM vacancies v WHERE v.id = vacancy_id AND v.status = 'publicada'));
DROP POLICY IF EXISTS "cm_applications_update_owner" ON applications;
CREATE POLICY "cm_applications_update_owner" ON applications FOR UPDATE TO authenticated
  USING (vacancy_id IN (SELECT id FROM vacancies WHERE created_by = auth.uid()));
DROP POLICY IF EXISTS "cm_applications_delete_own" ON applications;
CREATE POLICY "cm_applications_delete_own" ON applications FOR DELETE TO authenticated
  USING (candidate_id = auth.uid() AND status = 'recibida');

-- ---------------------------------------------------------------------------
-- 5. Reportes de errores / feedback (fase Legal: Feedback Loop)
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
-- 6. Que la API de Supabase vea las tablas nuevas de inmediato
--    (soluciona "Could not find the table ... in the schema cache")
-- ---------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
