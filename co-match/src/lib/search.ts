interface Searchable {
  title: string;
  department_name?: string;
  required_skills: string[];
}

const fold = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Filtra necesidades por título, área o habilidad (sin distinguir mayúsculas ni acentos). */
export function filterVacancies<T extends Searchable>(vacancies: T[], query: string): T[] {
  const terms = fold(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return vacancies;
  return vacancies.filter((v) => {
    const haystack = fold([v.title, v.department_name ?? '', ...v.required_skills].join(' '));
    return terms.every((t) => haystack.includes(t));
  });
}
