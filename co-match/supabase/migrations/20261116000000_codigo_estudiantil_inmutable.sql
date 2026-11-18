-- ============================================================================
-- CO-MATCH - El código estudiantil no se puede modificar una vez guardado
-- Un usuario autenticado no puede cambiar ni borrar un student_code que ya tiene valor
-- (solo puede fijarlo si estaba vacío). El SQL Editor / service role (sin auth.uid())
-- sigue pudiendo corregirlo. Idempotente.
-- ============================================================================

CREATE OR REPLACE FUNCTION cm_protect_student_code()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND COALESCE(OLD.student_code, '') <> ''
     AND NEW.student_code IS DISTINCT FROM OLD.student_code THEN
    RAISE EXCEPTION 'El código estudiantil no se puede modificar';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cm_profiles_protect_student_code ON profiles;
CREATE TRIGGER cm_profiles_protect_student_code
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION cm_protect_student_code();
