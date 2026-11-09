-- ============================================================================
-- CO-MATCH - Esquema Completo de Base de Datos
-- Universidad de La Sabana
-- ============================================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- A. CONTROL DE USUARIOS, ROLES Y ESTRUCTURA ORGANIZACIONAL
-- ============================================================================

-- Tabla de Roles
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE CHECK (name IN ('postulante', 'reclutador', 'jefe_area', 'admin')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Departamentos/Dependencias
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Usuarios
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    document_number VARCHAR(20) UNIQUE,
    role_id UUID NOT NULL REFERENCES roles(id),
    department_id UUID REFERENCES departments(id),
    is_active BOOLEAN DEFAULT TRUE,
    is_two_factor_enabled BOOLEAN DEFAULT FALSE,
    is_profile_complete BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_institutional_email CHECK (email LIKE '%@unisabana.edu.co')
);

-- Índices para usuarios
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_department_id ON users(department_id);
CREATE INDEX idx_users_is_active ON users(is_active);

-- ============================================================================
-- B. PERFIL DEL POSTULANTE Y COMPETENCIAS (ESTUDIANTES PAT)
-- ============================================================================

-- Tabla de Perfiles de Postulantes
CREATE TABLE candidate_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    birth_date DATE,
    address TEXT,
    city VARCHAR(100),
    education_level VARCHAR(50) CHECK (education_level IN ('tecnico', 'tecnologo', 'pregrado', 'especializacion', 'maestria', 'doctorado')),
    years_experience INTEGER DEFAULT 0,
    professional_summary TEXT,
    professional_network_url VARCHAR(500),
    availability_hours_per_week INTEGER,
    preferred_modality VARCHAR(20) CHECK (preferred_modality IN ('presencial', 'remoto', 'hibrido', 'cualquiera')),
    preferred_contract_type VARCHAR(30) CHECK (preferred_contract_type IN ('fijo', 'temporal', 'pasantia', 'prestacion_servicios', 'cualquiera')),
    expected_salary_range_min NUMERIC(12,2),
    expected_salary_range_max NUMERIC(12,2),
    is_available_for_pat BOOLEAN DEFAULT TRUE,
    pat_hours_completed INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Habilidades (Catálogo maestro)
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50),
    description TEXT,
    is_technical BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Habilidades por Postulante
CREATE TABLE candidate_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level VARCHAR(20) NOT NULL CHECK (proficiency_level IN ('basico', 'intermedio', 'avanzado')),
    years_experience INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(candidate_profile_id, skill_id)
);

-- Tabla de Experiencia Laboral
CREATE TABLE work_experience (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    company_name VARCHAR(150) NOT NULL,
    position VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    location VARCHAR(100),
    modality VARCHAR(20) CHECK (modality IN ('presencial', 'remoto', 'hibrido')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para perfiles
CREATE INDEX idx_candidate_profiles_user_id ON candidate_profiles(user_id);
CREATE INDEX idx_candidate_skills_profile_id ON candidate_skills(candidate_profile_id);
CREATE INDEX idx_candidate_skills_skill_id ON candidate_skills(skill_id);
CREATE INDEX idx_work_experience_profile_id ON work_experience(candidate_profile_id);

-- ============================================================================
-- C. GESTIÓN DE VACANTES Y NECESIDADES DE AUTOMATIZACIÓN
-- ============================================================================

-- Tabla de Vacantes/Desafíos
CREATE TABLE vacancies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    responsibilities TEXT,
    contract_type VARCHAR(30) NOT NULL CHECK (contract_type IN ('fijo', 'temporal', 'pasantia', 'prestacion_servicios')),
    modality VARCHAR(20) NOT NULL CHECK (modality IN ('presencial', 'remoto', 'hibrido')),
    location VARCHAR(100),
    salary_range_min NUMERIC(12,2),
    salary_range_max NUMERIC(12,2),
    pat_hours_per_week INTEGER,
    department_id UUID NOT NULL REFERENCES departments(id),
    created_by UUID NOT NULL REFERENCES users(id),
    available_slots INTEGER DEFAULT 1,
    filled_slots INTEGER DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'borrador' CHECK (status IN ('borrador', 'en_aprobacion', 'publicada', 'cerrada', 'cancelada')),
    publication_date TIMESTAMPTZ,
    closing_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Habilidades por Vacante
CREATE TABLE vacancy_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vacancy_id UUID NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT TRUE,
    weight INTEGER DEFAULT 1 CHECK (weight BETWEEN 1 AND 10),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vacancy_id, skill_id)
);

-- Tabla de Flujos de Aprobación
CREATE TABLE approval_flows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vacancy_id UUID NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    approver_id UUID REFERENCES users(id),
    approver_role_id UUID REFERENCES roles(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'aprobado', 'rechazado')),
    comments TEXT,
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vacancy_id, step_order)
);

-- Índices para vacantes
CREATE INDEX idx_vacancies_department_id ON vacancies(department_id);
CREATE INDEX idx_vacancies_created_by ON vacancies(created_by);
CREATE INDEX idx_vacancies_status ON vacancies(status);
CREATE INDEX idx_vacancies_publication_date ON vacancies(publication_date);
CREATE INDEX idx_vacancy_skills_vacancy_id ON vacancy_skills(vacancy_id);
CREATE INDEX idx_approval_flows_vacancy_id ON approval_flows(vacancy_id);

-- ============================================================================
-- D. POSTULACIONES Y ALGORITMO DE COINCIDENCIA (MATCH SCORE)
-- ============================================================================

-- Tabla de Postulaciones
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vacancy_id UUID NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'recibida' CHECK (status IN ('recibida', 'en_revision', 'entrevista', 'prueba', 'aceptada', 'rechazada')),
    match_score INTEGER DEFAULT 0 CHECK (match_score BETWEEN 0 AND 100),
    cover_letter TEXT,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id),
    UNIQUE(vacancy_id, candidate_id)
);

-- Tabla de Historial de Estados
CREATE TABLE application_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    previous_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    changed_by UUID NOT NULL REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Documentos
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    document_type VARCHAR(30) NOT NULL CHECK (document_type IN ('hoja_vida', 'certificado', 'titulo', 'carta_recomendacion', 'otro')),
    file_name VARCHAR(255) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    checksum VARCHAR(64),
    is_verified BOOLEAN DEFAULT FALSE,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para postulaciones
CREATE INDEX idx_applications_vacancy_id ON applications(vacancy_id);
CREATE INDEX idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_match_score ON applications(match_score DESC);
CREATE INDEX idx_application_status_history_application_id ON application_status_history(application_id);
CREATE INDEX idx_documents_application_id ON documents(application_id);

-- ============================================================================
-- H. SEGUIMIENTO DE PROYECTOS (MILESTONES & PROGRESO)
-- ============================================================================

-- Tabla de Hitos del Proyecto
CREATE TABLE project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    planned_date TIMESTAMPTZ,
    completed_date TIMESTAMPTZ,
    started_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(application_id, order_index)
);

-- Tabla de Registro de Horas
CREATE TABLE project_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hours NUMERIC(5,2) NOT NULL CHECK (hours > 0),
    description TEXT,
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Evaluación Final
CREATE TABLE project_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    dependency_rating INTEGER CHECK (dependency_rating BETWEEN 1 AND 5),
    candidate_rating INTEGER CHECK (candidate_rating BETWEEN 1 AND 5),
    dependency_feedback TEXT,
    candidate_feedback TEXT,
    satisfaction_rating NUMERIC(3,2) CHECK (satisfaction_rating BETWEEN 0 AND 5),
    evaluated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(application_id)
);

-- Índices para project_milestones
CREATE INDEX idx_project_milestones_application_id ON project_milestones(application_id);
CREATE INDEX idx_project_milestones_status ON project_milestones(status);
CREATE INDEX idx_project_milestones_order ON project_milestones(application_id, order_index);

-- Índices para project_hours
CREATE INDEX idx_project_hours_application_id ON project_hours(application_id);
CREATE INDEX idx_project_hours_user_id ON project_hours(user_id);
CREATE INDEX idx_project_hours_logged_date ON project_hours(logged_date);

-- Índices para project_evaluations
CREATE INDEX idx_project_evaluations_application_id ON project_evaluations(application_id);

-- Trigger para actualizar updated_at en project_milestones
CREATE TRIGGER update_project_milestones_updated_at BEFORE UPDATE ON project_milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para inicializar hitos por defecto al aceptar una postulación
CREATE OR REPLACE FUNCTION initialize_default_milestones()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.status != 'aceptada' AND NEW.status = 'aceptada' THEN
        INSERT INTO project_milestones (application_id, title, description, order_index, status, planned_date) VALUES
            (NEW.id, 'Inicio del proyecto', 'Configuración e inducción del estudiante en el proyecto', 1, 'in_progress', NOW() + INTERVAL '7 days'),
            (NEW.id, 'Análisis del proceso actual', 'Levantamiento de requerimientos y mapa de proceso', 2, 'pending', NOW() + INTERVAL '21 days'),
            (NEW.id, 'Desarrollo de la solución', 'Construcción del script, bot o flujo automatizado', 3, 'pending', NOW() + INTERVAL '49 days'),
            (NEW.id, 'Pruebas y ajustes', 'Validación de datos y pruebas de usuario', 4, 'pending', NOW() + INTERVAL '63 days'),
            (NEW.id, 'Entrega y capacitación', 'Despliegue y entrenamiento al personal de la dependencia', 5, 'pending', NOW() + INTERVAL '77 days'),
            (NEW.id, 'Cierre y evaluación final', 'Medición de impacto y calificación', 6, 'pending', NOW() + INTERVAL '91 days');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_initialize_milestones
    AFTER UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION initialize_default_milestones();

-- Políticas RLS para project_milestones
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dependencia ve hitos de sus aplicaciones" ON project_milestones
    FOR SELECT USING (
        application_id IN (
            SELECT id FROM applications a
            JOIN vacancies v ON v.id = a.vacancy_id
            WHERE v.created_by = auth.uid()
        )
    );

CREATE POLICY "Candidato ve sus propios hitos" ON project_milestones
    FOR SELECT USING (
        application_id IN (
            SELECT id FROM applications WHERE candidate_id = auth.uid()
        )
    );

CREATE POLICY "Dependencia actualiza hitos de sus aplicaciones" ON project_milestones
    FOR UPDATE USING (
        application_id IN (
            SELECT id FROM applications a
            JOIN vacancies v ON v.id = a.vacancy_id
            WHERE v.created_by = auth.uid()
        )
    );

-- Políticas RLS para project_hours
ALTER TABLE project_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participantes ven horas del proyecto" ON project_hours
    FOR SELECT USING (
        application_id IN (
            SELECT id FROM applications WHERE candidate_id = auth.uid()
            UNION
            SELECT id FROM applications a
            JOIN vacancies v ON v.id = a.vacancy_id
            WHERE v.created_by = auth.uid()
        )
    );

CREATE POLICY "Candidato registra sus horas" ON project_hours
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND application_id IN (SELECT id FROM applications WHERE candidate_id = auth.uid())
    );

-- Políticas RLS para project_evaluations
ALTER TABLE project_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participantes ven evaluación del proyecto" ON project_evaluations
    FOR SELECT USING (
        application_id IN (
            SELECT id FROM applications WHERE candidate_id = auth.uid()
            UNION
            SELECT id FROM applications a
            JOIN vacancies v ON v.id = a.vacancy_id
            WHERE v.created_by = auth.uid()
        )
    );

CREATE POLICY "Dependencia evalúa proyecto" ON project_evaluations
    FOR INSERT WITH CHECK (
        application_id IN (
            SELECT id FROM applications a
            JOIN vacancies v ON v.id = a.vacancy_id
            WHERE v.created_by = auth.uid()
        )
    );

CREATE POLICY "Dependencia actualiza su evaluación" ON project_evaluations
    FOR UPDATE USING (
        application_id IN (
            SELECT id FROM applications a
            JOIN vacancies v ON v.id = a.vacancy_id
            WHERE v.created_by = auth.uid()
        )
    );

-- ============================================================================
-- E. EVALUACIÓN, ENTREVISTAS Y PRUEBAS TÉCNICAS
-- ============================================================================
-- G. CONVERSACIONES Y MENSAJERÍA EN TIEMPO REAL
-- ============================================================================

-- Tabla de Conversaciones
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vacancy_id UUID NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
    dependency_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(200),
    last_message TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_by UUID REFERENCES users(id),
    unread_dependency_count INTEGER DEFAULT 0,
    unread_candidate_count INTEGER DEFAULT 0,
    is_archived_dependency BOOLEAN DEFAULT FALSE,
    is_archived_candidate BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vacancy_id, candidate_id)
);

-- Tabla de Mensajes
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
    file_url VARCHAR(500),
    file_name VARCHAR(255),
    file_size INTEGER,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para conversaciones
CREATE INDEX idx_conversations_vacancy_id ON conversations(vacancy_id);
CREATE INDEX idx_conversations_dependency_id ON conversations(dependency_id);
CREATE INDEX idx_conversations_candidate_id ON conversations(candidate_id);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX idx_conversations_unread_dependency ON conversations(unread_dependency_count) WHERE unread_dependency_count > 0;

-- Índices para mensajes
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_is_read ON messages(is_read) WHERE is_read = FALSE;

-- Trigger para actualizar last_message_at en conversaciones
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET last_message = NEW.content,
        last_message_at = NEW.created_at,
        last_message_by = NEW.sender_id,
        unread_dependency_count = CASE 
            WHEN NEW.sender_id != conversations.dependency_id THEN conversations.unread_dependency_count + 1
            ELSE conversations.unread_dependency_count
        END,
        unread_candidate_count = CASE 
            WHEN NEW.sender_id != conversations.candidate_id THEN conversations.unread_candidate_count + 1
            ELSE conversations.unread_candidate_count
        END,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_conversation_last_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();

-- Trigger para actualizar updated_at en conversations
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS para conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dependencia ve sus conversaciones" ON conversations
    FOR SELECT USING (dependency_id = auth.uid());

CREATE POLICY "Candidato ve sus conversaciones" ON conversations
    FOR SELECT USING (candidate_id = auth.uid());

CREATE POLICY "Dependencia crea conversaciones" ON conversations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM vacancies v
            WHERE v.id = vacancy_id
            AND v.created_by = auth.uid()
        )
    );

CREATE POLICY "Dependencia actualiza sus conversaciones" ON conversations
    FOR UPDATE USING (dependency_id = auth.uid());

CREATE POLICY "Candidato actualiza sus conversaciones" ON conversations
    FOR UPDATE USING (candidate_id = auth.uid());

-- Políticas RLS para messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participantes ven mensajes de su conversación" ON messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM conversations WHERE dependency_id = auth.uid() OR candidate_id = auth.uid()
        )
    );

CREATE POLICY "Participantes envían mensajes" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid()
        AND conversation_id IN (
            SELECT id FROM conversations WHERE dependency_id = auth.uid() OR candidate_id = auth.uid()
        )
    );

CREATE POLICY "Participantes marcan como leídos" ON messages
    FOR UPDATE USING (
        conversation_id IN (
            SELECT id FROM conversations WHERE dependency_id = auth.uid() OR candidate_id = auth.uid()
        )
    );

-- ============================================================================
-- E. EVALUACIÓN, ENTREVISTAS Y PRUEBAS TÉCNICAS
-- ============================================================================

-- Tabla de Entrevistas
CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    interviewer_id UUID NOT NULL REFERENCES users(id),
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    modality VARCHAR(20) NOT NULL CHECK (modality IN ('presencial', 'videollamada')),
    meeting_link VARCHAR(500),
    location VARCHAR(200),
    status VARCHAR(30) NOT NULL DEFAULT 'programada' CHECK (status IN ('programada', 'realizada', 'cancelada', 'reprogramada')),
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    notes TEXT,
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Pruebas/Evaluaciones
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    test_type VARCHAR(30) NOT NULL CHECK (test_type IN ('tecnica', 'psicotecnica', 'idiomas', 'otra')),
    test_name VARCHAR(150) NOT NULL,
    score NUMERIC(5,2) CHECK (score BETWEEN 0 AND 100),
    max_score NUMERIC(5,2) DEFAULT 100,
    result_url VARCHAR(500),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_progreso', 'completada', 'expirada')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para evaluaciones
CREATE INDEX idx_interviews_application_id ON interviews(application_id);
CREATE INDEX idx_interviews_interviewer_id ON interviews(interviewer_id);
CREATE INDEX idx_interviews_scheduled_at ON interviews(scheduled_at);
CREATE INDEX idx_assessments_application_id ON assessments(application_id);
CREATE INDEX idx_assessments_test_type ON assessments(test_type);

-- ============================================================================
-- F. NOTIFICACIONES, AUDITORÍA Y REPORTES
-- ============================================================================

-- Tabla de Notificaciones
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'push', 'in_app')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Auditoría
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(20) NOT NULL CHECK (action IN ('create', 'update', 'delete', 'read', 'download')),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    user_id UUID REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,
    old_values JSONB,
    new_values JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Reportes Guardados
CREATE TABLE saved_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    report_type VARCHAR(50) NOT NULL,
    filters JSONB NOT NULL,
    configuration JSONB,
    is_scheduled BOOLEAN DEFAULT FALSE,
    schedule_cron VARCHAR(100),
    last_generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para notificaciones y auditoría
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_saved_reports_user_id ON saved_reports(user_id);

-- ============================================================================
-- TRIGGERS Y FUNCIONES AUXILIARES
-- ============================================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_candidate_profiles_updated_at BEFORE UPDATE ON candidate_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vacancies_updated_at BEFORE UPDATE ON vacancies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON interviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saved_reports_updated_at BEFORE UPDATE ON saved_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para crear perfil de candidato al registrar usuario
CREATE OR REPLACE FUNCTION create_candidate_profile()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT name FROM roles WHERE id = NEW.role_id) = 'postulante' THEN
        INSERT INTO candidate_profiles (user_id) VALUES (NEW.id);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_create_candidate_profile
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_candidate_profile();

-- Función para actualizar match_score automáticamente
CREATE OR REPLACE FUNCTION calculate_match_score(vacancy_uuid UUID, candidate_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
    required_skills_count INTEGER := 0;
    matched_skills_count INTEGER := 0;
    total_weight INTEGER := 0;
    matched_weight INTEGER := 0;
BEGIN
    -- Contar habilidades requeridas y sus pesos
    SELECT COUNT(*), COALESCE(SUM(weight), 0)
    INTO required_skills_count, total_weight
    FROM vacancy_skills
    WHERE vacancy_id = vacancy_uuid AND is_required = TRUE;

    IF required_skills_count > 0 THEN
        -- Contar coincidencias
        SELECT COUNT(*), COALESCE(SUM(vs.weight), 0)
        INTO matched_skills_count, matched_weight
        FROM vacancy_skills vs
        JOIN candidate_skills cs ON cs.skill_id = vs.skill_id
        JOIN candidate_profiles cp ON cp.id = cs.candidate_profile_id
        WHERE vs.vacancy_id = vacancy_uuid
        AND vs.is_required = TRUE
        AND cp.user_id = candidate_uuid;

        -- Calcular score base (0-70 por habilidades técnicas)
        score := CASE WHEN total_weight > 0 THEN (matched_weight * 70) / total_weight ELSE 0 END;
    END IF;

    -- Agregar puntos por experiencia (0-15)
    -- Agregar puntos por educación (0-15)
    -- Total máximo 100
    RETURN LEAST(score, 100);
END;
$$ language 'plpgsql';

-- Trigger para actualizar match_score al crear postulación
CREATE OR REPLACE FUNCTION update_application_match_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.match_score := calculate_match_score(NEW.vacancy_id, NEW.candidate_id);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_match_score
    BEFORE INSERT OR UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_application_match_score();

-- Función para actualizar filled_slots en vacantes
CREATE OR REPLACE FUNCTION update_vacancy_filled_slots()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'aceptada' THEN
        UPDATE vacancies SET filled_slots = filled_slots + 1 WHERE id = NEW.vacancy_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'aceptada' AND NEW.status != 'aceptada' THEN
        UPDATE vacancies SET filled_slots = filled_slots - 1 WHERE id = NEW.vacancy_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status != 'aceptada' AND NEW.status = 'aceptada' THEN
        UPDATE vacancies SET filled_slots = filled_slots + 1 WHERE id = NEW.vacancy_id;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'aceptada' THEN
        UPDATE vacancies SET filled_slots = filled_slots - 1 WHERE id = OLD.vacancy_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_filled_slots
    AFTER INSERT OR UPDATE OR DELETE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_vacancy_filled_slots();

-- Función para registrar en auditoría
CREATE OR REPLACE FUNCTION log_audit_action()
RETURNS TRIGGER AS $$
DECLARE
    v_action VARCHAR(20);
    v_old_values JSONB;
    v_new_values JSONB;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_action := 'create';
        v_old_values := NULL;
        v_new_values := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'update';
        v_old_values := to_jsonb(OLD);
        v_new_values := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'delete';
        v_old_values := to_jsonb(OLD);
        v_new_values := NULL;
    END IF;

    INSERT INTO audit_logs (action, entity_type, entity_id, user_id, old_values, new_values)
    VALUES (v_action, TG_TABLE_NAME, 
            COALESCE(NEW.id, OLD.id),
            auth.uid(),
            v_old_values,
            v_new_values);
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Aplicar auditoría a tablas críticas
CREATE TRIGGER audit_vacancies AFTER INSERT OR UPDATE OR DELETE ON vacancies FOR EACH ROW EXECUTE FUNCTION log_audit_action();
CREATE TRIGGER audit_applications AFTER INSERT OR UPDATE OR DELETE ON applications FOR EACH ROW EXECUTE FUNCTION log_audit_action();
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION log_audit_action();
CREATE TRIGGER audit_candidate_profiles AFTER INSERT OR UPDATE OR DELETE ON candidate_profiles FOR EACH ROW EXECUTE FUNCTION log_audit_action();

-- ============================================================================
-- DATOS INICIALES (SEED)
-- ============================================================================

-- Roles por defecto
INSERT INTO roles (name, description) VALUES
    ('postulante', 'Estudiante o egresado que busca oportunidades PAT'),
    ('reclutador', 'Personal de dependencias que publica y gestiona vacantes'),
    ('jefe_area', 'Jefe de área o coordinador que aprueba vacantes'),
    ('admin', 'Administrador del sistema con acceso total')
ON CONFLICT (name) DO NOTHING;

-- Habilidades base
INSERT INTO skills (name, category, is_technical) VALUES
    ('Python', 'Programación', TRUE),
    ('JavaScript', 'Programación', TRUE),
    ('TypeScript', 'Programación', TRUE),
    ('React', 'Frontend', TRUE),
    ('Node.js', 'Backend', TRUE),
    ('PostgreSQL', 'Base de Datos', TRUE),
    ('MongoDB', 'Base de Datos', TRUE),
    ('AWS', 'Cloud', TRUE),
    ('Docker', 'DevOps', TRUE),
    ('Kubernetes', 'DevOps', TRUE),
    ('Git', 'Control de Versiones', TRUE),
    ('Agile/Scrum', 'Metodologías', FALSE),
    ('Comunicación Efectiva', 'Habilidades Blandas', FALSE),
    ('Trabajo en Equipo', 'Habilidades Blandas', FALSE),
    ('Resolución de Problemas', 'Habilidades Blandas', FALSE),
    ('Inglés Técnico', 'Idiomas', FALSE),
    ('Análisis de Datos', 'Analítica', TRUE),
    ('Machine Learning', 'IA/ML', TRUE),
    ('Figma', 'Diseño', TRUE),
    ('Excel Avanzado', 'Ofimática', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Departamentos de ejemplo
INSERT INTO departments (name, description) VALUES
    ('Facultad de Ingeniería', 'Facultad de Ingeniería y Ciencias Básicas'),
    ('Facultad de Ciencias Económicas y Administrativas', 'Facultad de Ciencias Económicas y Administrativas'),
    ('Facultad de Derecho', 'Facultad de Derecho y Ciencias Políticas'),
    ('Facultad de Medicina', 'Facultad de Medicina'),
    ('Dirección de Bienestar Universitario', 'Dirección de Bienestar Universitario'),
    ('Dirección de Comunicaciones', 'Dirección de Comunicaciones y Mercadeo'),
    ('Dirección de Tecnologías de Información', 'Dirección de Tecnologías de Información'),
    ('Centro de Emprendimiento', 'Centro de Emprendimiento e Innovación')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- ============================================================================

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacancy_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;

-- Políticas para roles (lectura pública)
CREATE POLICY "Roles son visibles para todos los usuarios autenticados" ON roles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas para departamentos (lectura pública)
CREATE POLICY "Departamentos son visibles para todos los usuarios autenticados" ON departments
    FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas para users
CREATE POLICY "Usuarios pueden ver su propio perfil" ON users
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON users
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Reclutadores y admins pueden ver usuarios de su departamento" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND (u.role_id IN (SELECT id FROM roles WHERE name IN ('reclutador', 'jefe_area', 'admin')))
            AND (u.department_id = users.department_id OR u.role_id = (SELECT id FROM roles WHERE name = 'admin'))
        )
    );

-- Políticas para candidate_profiles
CREATE POLICY "Candidatos ven su propio perfil" ON candidate_profiles
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Candidatos actualizan su propio perfil" ON candidate_profiles
    FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Reclutadores ven perfiles de postulaciones a sus vacantes" ON candidate_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM applications a
            JOIN vacancies v ON v.id = a.vacancy_id
            WHERE a.candidate_id = candidate_profiles.user_id
            AND v.created_by = auth.uid()
        )
    );

-- Políticas para skills (lectura pública)
CREATE POLICY "Habilidades visibles para todos" ON skills
    FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas para candidate_skills
CREATE POLICY "Candidatos gestionan sus habilidades" ON candidate_skills
    FOR ALL USING (
        candidate_profile_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid())
    );

-- Políticas para work_experience
CREATE POLICY "Candidatos gestionan su experiencia" ON work_experience
    FOR ALL USING (
        candidate_profile_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid())
    );

-- Políticas para vacancies
CREATE POLICY "Vacantes publicadas visibles para postulantes" ON vacancies
    FOR SELECT USING (status = 'publicada');
CREATE POLICY "Reclutadores ven sus vacantes" ON vacancies
    FOR SELECT USING (created_by = auth.uid());
CREATE POLICY "Jefes de área ven vacantes de su departamento" ON vacancies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role_id = (SELECT id FROM roles WHERE name = 'jefe_area')
            AND u.department_id = vacancies.department_id
        )
    );
CREATE POLICY "Admins ven todas las vacantes" ON vacancies
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role_id = (SELECT id FROM roles WHERE name = 'admin'))
    );
CREATE POLICY "Reclutadores crean vacantes" ON vacancies
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role_id IN (SELECT id FROM roles WHERE name IN ('reclutador', 'admin')))
    );
CREATE POLICY "Creadores y admins actualizan vacantes" ON vacancies
    FOR UPDATE USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role_id = (SELECT id FROM roles WHERE name = 'admin')));

-- Políticas para vacancy_skills
CREATE POLICY "Gestión de habilidades de vacante por creador" ON vacancy_skills
    FOR ALL USING (
        vacancy_id IN (SELECT id FROM vacancies WHERE created_by = auth.uid())
    );

-- Políticas para approval_flows
CREATE POLICY "Aprobadores ven sus flujos" ON approval_flows
    FOR SELECT USING (approver_id = auth.uid());
CREATE POLICY "Creadores de vacantes ven flujos" ON approval_flows
    FOR SELECT USING (
        vacancy_id IN (SELECT id FROM vacancies WHERE created_by = auth.uid())
    );

-- Políticas para applications
CREATE POLICY "Candidatos ven sus postulaciones" ON applications
    FOR SELECT USING (candidate_id = auth.uid());
CREATE POLICY "Reclutadores ven postulaciones a sus vacantes" ON applications
    FOR SELECT USING (
        vacancy_id IN (SELECT id FROM vacancies WHERE created_by = auth.uid())
    );
CREATE POLICY "Jefes de área ven postulaciones de su departamento" ON applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM vacancies v
            JOIN users u ON u.id = auth.uid()
            WHERE v.id = applications.vacancy_id
            AND u.role_id = (SELECT id FROM roles WHERE name = 'jefe_area')
            AND u.department_id = v.department_id
        )
    );
CREATE POLICY "Candidatos crean postulaciones" ON applications
    FOR INSERT WITH CHECK (
        candidate_id = auth.uid()
        AND EXISTS (SELECT 1 FROM vacancies WHERE id = vacancy_id AND status = 'publicada')
    );

-- Políticas para application_status_history
CREATE POLICY "Historial visible para partes involucradas" ON application_status_history
    FOR SELECT USING (
        application_id IN (
            SELECT id FROM applications WHERE candidate_id = auth.uid()
            UNION
            SELECT id FROM applications WHERE vacancy_id IN (SELECT id FROM vacancies WHERE created_by = auth.uid())
        )
    );

-- Políticas para documents
CREATE POLICY "Documentos visibles para propietario y reclutador" ON documents
    FOR SELECT USING (
        application_id IN (
            SELECT id FROM applications WHERE candidate_id = auth.uid()
            UNION
            SELECT id FROM applications WHERE vacancy_id IN (SELECT id FROM vacancies WHERE created_by = auth.uid())
        )
    );
CREATE POLICY "Candidatos suben documentos" ON documents
    FOR INSERT WITH CHECK (
        application_id IN (SELECT id FROM applications WHERE candidate_id = auth.uid())
    );

-- Políticas para interviews
CREATE POLICY "Entrevistas visibles para participantes" ON interviews
    FOR SELECT USING (
        interviewer_id = auth.uid()
        OR application_id IN (SELECT id FROM applications WHERE candidate_id = auth.uid())
        OR application_id IN (SELECT id FROM applications WHERE vacancy_id IN (SELECT id FROM vacancies WHERE created_by = auth.uid()))
    );
CREATE POLICY "Reclutadores crean entrevistas" ON interviews
    FOR INSERT WITH CHECK (
        application_id IN (SELECT id FROM applications WHERE vacancy_id IN (SELECT id FROM vacancies WHERE created_by = auth.uid()))
    );

-- Políticas para assessments
CREATE POLICY "Evaluaciones visibles para participantes" ON assessments
    FOR SELECT USING (
        application_id IN (SELECT id FROM applications WHERE candidate_id = auth.uid())
        OR application_id IN (SELECT id FROM applications WHERE vacancy_id IN (SELECT id FROM vacancies WHERE created_by = auth.uid()))
    );

-- Políticas para notifications
CREATE POLICY "Usuarios ven sus notificaciones" ON notifications
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Usuarios actualizan sus notificaciones" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Políticas para audit_logs (solo admins)
CREATE POLICY "Admins ven auditoría" ON audit_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role_id = (SELECT id FROM roles WHERE name = 'admin'))
    );

-- Políticas para saved_reports
CREATE POLICY "Usuarios gestionan sus reportes" ON saved_reports
    FOR ALL USING (user_id = auth.uid());