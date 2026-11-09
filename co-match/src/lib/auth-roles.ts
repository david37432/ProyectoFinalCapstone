export type RegisterRole = 'postulante' | 'reclutador';
export type ProfileRole = 'estudiante' | 'dependencia';

/** Traduce el rol elegido en el registro al rol de la tabla `profiles`. */
export function toProfileRole(role: RegisterRole | string): ProfileRole {
  return role === 'reclutador' ? 'dependencia' : 'estudiante';
}

/** Ruta de inicio según el rol de perfil. */
export function homePathForRole(role: ProfileRole | string): string {
  return role === 'dependencia' ? '/dashboard/dependencia' : '/dashboard/estudiante/explorar';
}
