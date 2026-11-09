-- ============================================================================
-- CO-MATCH - Actualización de Tabla Notificaciones para Avisos Reales
-- Universidad de La Sabana
-- ============================================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ACTUALIZACIÓN DE TABLA NOTIFICACIONES
-- ============================================================================

-- Agregar columnas faltantes
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'system' 
    CHECK (type IN ('opportunity', 'match', 'tip', 'system')),
  ADD COLUMN IF NOT EXISTS link_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS is_global BOOLEAN NOT NULL DEFAULT FALSE;

-- Permitir user_id NULL para avisos globales
ALTER TABLE notifications
  ALTER COLUMN user_id DROP NOT NULL;

-- Actualizar notificaciones existentes para tener type por defecto
UPDATE notifications 
SET type = 'system' 
WHERE type IS NULL OR type NOT IN ('opportunity', 'match', 'tip', 'system');

-- Agregar constraint para validar tipos
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('opportunity', 'match', 'tip', 'system'));

-- Índices adicionales
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_global ON notifications(is_global);

-- ============================================================================
-- POLÍTICAS DE SEGURIDAD ACTUALIZADAS (RLS)
-- ============================================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Usuarios ven sus notificaciones" ON notifications;
DROP POLICY IF EXISTS "Usuarios actualizan sus notificaciones" ON notifications;

-- Nueva política: usuarios ven sus notificaciones + notificaciones globales
CREATE POLICY "Usuarios ven sus notificaciones y globales" ON notifications
    FOR SELECT USING (
        user_id = auth.uid() OR is_global = TRUE
    );

-- Nueva política: usuarios actualizan sus propias notificaciones
CREATE POLICY "Usuarios actualizan sus notificaciones" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Política para insertar notificaciones (solo admins/sistema)
CREATE POLICY "Sistema inserta notificaciones" ON notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role_id IN (
                SELECT id FROM roles WHERE name IN ('admin', 'jefe_area', 'reclutador')
            )
        )
    );

-- ============================================================================
-- FUNCIÓN PARA GENERAR AVISOS AUTOMÁTICOS DE OPORTUNIDADES
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_opportunity_notifications()
RETURNS TRIGGER AS $$
DECLARE
    v_student_ids UUID[];
BEGIN
    -- Solo generar notificaciones cuando se publica una vacante
    IF NEW.status = 'publicada' AND OLD.status != 'publicada' THEN
        -- Obtener todos los estudiantes activos (role = postulante)
        SELECT ARRAY_AGG(u.id) INTO v_student_ids
        FROM users u
        JOIN roles r ON r.id = u.role_id
        WHERE r.name = 'postulante' AND u.is_active = TRUE;

        -- Insertar notificación para cada estudiante
        IF v_student_ids IS NOT NULL THEN
            INSERT INTO notifications (user_id, type, title, message, link_url)
            SELECT 
                student_id,
                'opportunity',
                '¡Nueva oportunidad publicada!',
                'La dependencia ' || (SELECT name FROM departments WHERE id = NEW.department_id) || ' publicó una ficha que busca apoyo en ' || COALESCE(
                    (SELECT string_agg(s.name, ', ') 
                     FROM vacancy_skills vs 
                     JOIN skills s ON s.id = vs.skill_id 
                     WHERE vs.vacancy_id = NEW.id), 'varias áreas'),
                '/dashboard/estudiante/explorar'
            FROM unnest(v_student_ids) AS student_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para generar notificaciones al publicar vacantes
CREATE TRIGGER trigger_opportunity_notifications
    AFTER UPDATE ON vacancies
    FOR EACH ROW
    EXECUTE FUNCTION generate_opportunity_notifications();

-- ============================================================================
-- FUNCIÓN PARA GENERAR TIPS AUTOMÁTICOS (PERFIL INCOMPLETO)
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_profile_tips()
RETURNS TRIGGER AS $$
BEGIN
    -- Generar tip si el perfil se actualiza y está incompleto
    IF NEW.full_name IS NOT NULL AND 
       (NEW.career IS NULL OR NEW.availability_hours IS NULL OR NEW.focus IS NULL) THEN
        INSERT INTO notifications (user_id, type, title, message, link_url)
        VALUES (
            NEW.id,
            'tip',
            'Completa tu perfil para mejores oportunidades',
            CASE 
                WHEN NEW.career IS NULL THEN 'Agrega tu carrera para recibir mejores recomendaciones de proyectos.'
                WHEN NEW.availability_hours IS NULL THEN 'Completa tus horas de disponibilidad horaria para recibir mejores recomendaciones de proyectos.'
                WHEN NEW.focus IS NULL THEN 'Define tu enfoque/especialización para mejorar el matching con oportunidades.'
                ELSE 'Completa tu perfil para recibir mejores recomendaciones de proyectos.'
            END,
            '/dashboard/estudiante/perfil'
        )
        ON CONFLICT DO NOTHING; -- Evitar duplicados
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para generar tips al actualizar perfil
CREATE TRIGGER trigger_profile_tips
    AFTER UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION generate_profile_tips();

-- ============================================================================
-- HABILITAR REALTIME PARA NOTIFICACIONES
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;