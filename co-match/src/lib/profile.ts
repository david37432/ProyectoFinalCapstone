/** Máximo de horas semanales del Programa de Asistencia Técnica (PAT). */
export const PAT_MAX_HOURS = 25;

/** Limita las horas a 0..PAT_MAX_HOURS (null si no hay valor válido). */
export function clampAvailability(hours: number | string | null | undefined): number | null {
  if (hours === null || hours === undefined || hours === '') return null;
  const n = Math.round(Number(hours));
  if (!Number.isFinite(n)) return null;
  return Math.min(PAT_MAX_HOURS, Math.max(0, n));
}

/** Porcentaje (0-100) de la disponibilidad respecto al máximo PAT. */
export function availabilityPercent(hours: number | null | undefined): number {
  const h = clampAvailability(hours) ?? 0;
  return Math.round((h / PAT_MAX_HOURS) * 100);
}

// ---------------------------------------------------------------------------
// Foto de perfil
// ---------------------------------------------------------------------------

export const AVATAR_BUCKET = 'avatars';
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
export const AVATAR_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function validateAvatarFile(file: { type: string; size: number }): string | null {
  if (!(file.type in AVATAR_TYPES)) return 'La foto debe ser JPG, PNG o WEBP';
  if (file.size <= 0) return 'El archivo está vacío';
  if (file.size > AVATAR_MAX_BYTES) return 'La foto no puede pesar más de 2 MB';
  return null;
}

/** Ruta en Storage: cada usuario solo escribe dentro de su carpeta `<userId>/`. */
export function avatarPath(userId: string, mimeType: string, now: number = Date.now()): string {
  const ext = AVATAR_TYPES[mimeType] ?? 'jpg';
  return `${userId}/avatar-${now}.${ext}`;
}

// ---------------------------------------------------------------------------
// Datos del registro → perfil
// ---------------------------------------------------------------------------

export interface RegistrationMetadata {
  full_name?: string | null;
  phone?: string | null;
  student_code?: string | null;
  /** Registros antiguos guardaban el código como document_number */
  document_number?: string | null;
}

/** Campos del perfil que vienen del formulario de registro (metadata de Supabase Auth). */
export function profileFieldsFromRegistration(meta: RegistrationMetadata | null | undefined) {
  const clean = (v?: string | null) => (typeof v === 'string' ? v.trim() : '');
  return {
    full_name: clean(meta?.full_name),
    phone: clean(meta?.phone),
    student_code: clean(meta?.student_code) || clean(meta?.document_number),
  };
}

/** Usa el valor guardado en el perfil y, si está vacío, el del registro. */
export function preferFilled(saved: string | null | undefined, fromRegistration: string): string {
  return saved && saved.trim() ? saved : fromRegistration;
}
