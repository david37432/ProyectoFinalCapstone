-- ============================================================================
-- CO-MATCH - Tabla de Mensajes (Chat)
-- Universidad de La Sabana
-- ============================================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabla de Mensajes (Chat entre estudiante y dependencia/admin)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mensajes
CREATE INDEX idx_messages_application_id ON messages(application_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para updated_at en messages
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- ============================================================================

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Políticas para messages
-- Estudiantes ven mensajes de sus propias postulaciones
CREATE POLICY "Estudiantes ven mensajes de sus postulaciones" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM applications a
            WHERE a.id = messages.application_id
            AND a.candidate_id = auth.uid()
        )
    );

-- Dependencias/Admins ven mensajes de postulaciones a sus vacantes
CREATE POLICY "Dependencias ven mensajes de sus postulaciones" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM applications a
            JOIN vacancies v ON v.id = a.vacancy_id
            WHERE a.id = messages.application_id
            AND v.created_by = auth.uid()
        )
    );

-- Jefes de área ven mensajes de postulaciones de su departamento
CREATE POLICY "Jefes de área ven mensajes de su departamento" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM applications a
            JOIN vacancies v ON v.id = a.vacancy_id
            JOIN users u ON u.id = auth.uid()
            WHERE a.id = messages.application_id
            AND u.role_id = (SELECT id FROM roles WHERE name = 'jefe_area')
            AND u.department_id = v.department_id
        )
    );

-- Admins ven todos los mensajes
CREATE POLICY "Admins ven todos los mensajes" ON messages
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role_id = (SELECT id FROM roles WHERE name = 'admin'))
    );

-- Estudiantes pueden enviar mensajes en sus postulaciones (solo si la postulación está aceptada)
CREATE POLICY "Estudiantes envían mensajes en sus postulaciones aceptadas" ON messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM applications a
            WHERE a.id = messages.application_id
            AND a.candidate_id = auth.uid()
            AND a.status = 'aceptada'
        )
        AND messages.sender_id = auth.uid()
    );

-- Dependencias/Admins pueden enviar mensajes en postulaciones a sus vacantes (si están en entrevista o aceptada)
CREATE POLICY "Dependencias envían mensajes en sus postulaciones" ON messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM applications a
            JOIN vacancies v ON v.id = a.vacancy_id
            WHERE a.id = messages.application_id
            AND v.created_by = auth.uid()
            AND a.status IN ('entrevista', 'aceptada')
        )
        AND messages.sender_id = auth.uid()
    );

-- Jefes de área pueden enviar mensajes en postulaciones de su departamento
CREATE POLICY "Jefes de área envían mensajes en su departamento" ON messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM applications a
            JOIN vacancies v ON v.id = a.vacancy_id
            JOIN users u ON u.id = auth.uid()
            WHERE a.id = messages.application_id
            AND u.role_id = (SELECT id FROM roles WHERE name = 'jefe_area')
            AND u.department_id = v.department_id
            AND a.status IN ('entrevista', 'aceptada')
        )
        AND messages.sender_id = auth.uid()
    );

-- Admins pueden enviar mensajes en cualquier postulación
CREATE POLICY "Admins envían mensajes en cualquier postulación" ON messages
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role_id = (SELECT id FROM roles WHERE name = 'admin'))
        AND messages.sender_id = auth.uid()
    );

-- Función para actualizar updated_at en messages
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Realtime para la tabla messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;