export type RegisterRole = 'postulante' | 'reclutador';
export type ProfileRole = 'estudiante' | 'dependencia';

/**
 * Roles que en la base de datos aparecen con distintos nombres
 * (tabla profiles, tabla roles y metadata de Supabase Auth).
 */
const DEPENDENCY_ROLES = new Set([
  'dependencia',
  'reclutador',
  'jefe_area',
  'pat',
  'admin',
  'administrador',
]);

/**
 * Normaliza cualquier nombre de rol a los dos roles de la app.
 * Desconocido o vacío → 'estudiante' (mínimo privilegio).
 */
export function normalizeRole(role: string | null | undefined): ProfileRole {
  const value = (role ?? '').trim().toLowerCase();
  return DEPENDENCY_ROLES.has(value) ? 'dependencia' : 'estudiante';
}

/** Traduce el rol elegido en el registro al rol de la tabla `profiles`. */
export function toProfileRole(role: RegisterRole | string): ProfileRole {
  return normalizeRole(role);
}

/** Ruta de inicio según el rol (acepta cualquier variante de nombre). */
export function homePathForRole(role: string | null | undefined): string {
  return normalizeRole(role) === 'dependencia' ? '/dashboard/dependencia' : '/dashboard/estudiante/explorar';
}

/**
 * Decide si un usuario puede entrar a una ruta del dashboard.
 * Devuelve la ruta a la que hay que redirigir, o null si puede pasar.
 */
export function dashboardRedirectFor(pathname: string, role: string | null | undefined): string | null {
  const normalized = normalizeRole(role);
  if (pathname.startsWith('/dashboard/dependencia') && normalized !== 'dependencia') {
    return '/dashboard/estudiante/explorar';
  }
  if (pathname.startsWith('/dashboard/estudiante') && normalized !== 'estudiante') {
    return '/dashboard/dependencia';
  }
  return null;
}
