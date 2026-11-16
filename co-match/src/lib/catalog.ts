/** Opciones sugeridas del formulario de necesidades. El usuario también puede escribir las suyas. */
export const SKILLS_OPTIONS = [
  'Python', 'Excel Avanzado', 'Power BI', 'JavaScript', 'SQL', 'Apps Script',
  'Tableau', 'R', 'Node.js', 'MySQL', 'RPA/UiPath', 'VBA', 'Zapier', 'Pandas',
] as const;

export const DEPARTMENTS = [
  'Coordinación PAT',
  'Dirección de Estudiantes',
  'Recursos Humanos',
  'Facultad de Ingeniería',
  'Biblioteca',
  'Finanzas',
  'Dirección de Comunicaciones',
  'Dirección de Tecnologías de Información',
  'Centro de Emprendimiento',
  'Facultad de Ciencias Económicas y Administrativas',
  'Facultad de Derecho',
  'Facultad de Medicina',
  'Facultad de Ciencias',
  'Dirección de Bienestar Universitario',
] as const;

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

/** Filtra las sugerencias por el texto escrito (sin distinguir mayúsculas). */
export function filterOptions(options: readonly string[], query: string): string[] {
  const q = norm(query);
  return options.filter((o) => norm(o).includes(q));
}

/**
 * Agrega un valor escrito a mano a la lista (sin duplicados, sin distinguir mayúsculas).
 * Si coincide con una sugerencia, se usa la escritura canónica de la sugerencia.
 */
export function addCustomItem(
  list: readonly string[],
  raw: string,
  suggestions: readonly string[] = [],
  max = 30
): string[] {
  const clean = raw.trim().replace(/\s+/g, ' ');
  if (!clean || clean.length > 60) return [...list];
  const key = norm(clean);
  if (list.some((s) => norm(s) === key)) return [...list];
  if (list.length >= max) return [...list];
  const canonical = suggestions.find((s) => norm(s) === key) ?? clean;
  return [...list, canonical];
}
