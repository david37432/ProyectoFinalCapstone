import { describe, it, expect } from 'vitest';
import {
  computeMatch,
  computeMatchScore,
  rankCandidates,
  proficiencyFactor,
  firstOf,
  validateVacancyForm,
  MATCH_WEIGHTS,
  type MatchVacancy,
  type MatchCandidate,
} from './matching';

const vacancy: MatchVacancy = {
  skills: [{ skillId: 'python' }, { skillId: 'sql' }],
  patHoursPerWeek: 20,
  modality: 'hibrido',
  contractType: 'pasantia',
};

const perfect: MatchCandidate = {
  skills: [
    { skillId: 'python', proficiency: 'avanzado' },
    { skillId: 'sql', proficiency: 'avanzado' },
  ],
  availabilityHoursPerWeek: 20,
  preferredModality: 'hibrido',
  preferredContractType: 'pasantia',
};

describe('proficiencyFactor', () => {
  it('ordena básico < intermedio < avanzado', () => {
    expect(proficiencyFactor('basico')).toBeLessThan(proficiencyFactor('intermedio'));
    expect(proficiencyFactor('intermedio')).toBeLessThan(proficiencyFactor('avanzado'));
    expect(proficiencyFactor('avanzado')).toBe(1);
  });

  it('no penaliza si el nivel es desconocido (perfil sin nivel de dominio)', () => {
    expect(proficiencyFactor(null)).toBe(1);
    expect(proficiencyFactor('experto')).toBe(1);
  });
});

describe('computeMatch', () => {
  it('da 100 a un candidato perfecto', () => {
    const r = computeMatch(vacancy, perfect);
    expect(r.score).toBe(100);
    expect(r.matchedSkillIds).toEqual(['python', 'sql']);
    expect(r.missingSkillIds).toEqual([]);
  });

  it('da 0 de habilidades a un candidato sin habilidades en común', () => {
    const r = computeMatch(vacancy, { ...perfect, skills: [{ skillId: 'java', proficiency: 'avanzado' }] });
    expect(r.skills).toBe(0);
    expect(r.missingSkillIds).toEqual(['python', 'sql']);
    expect(r.score).toBe(MATCH_WEIGHTS.availability + MATCH_WEIGHTS.modality + MATCH_WEIGHTS.contract);
  });

  it('cubrir la mitad de habilidades da la mitad de los puntos de habilidades', () => {
    const r = computeMatch(vacancy, { ...perfect, skills: [{ skillId: 'python', proficiency: 'avanzado' }] });
    expect(r.skills).toBe(MATCH_WEIGHTS.skills / 2);
  });

  it('el nivel de dominio afecta el puntaje', () => {
    const basico = computeMatchScore(vacancy, {
      ...perfect,
      skills: perfect.skills.map((s) => ({ ...s, proficiency: 'basico' })),
    });
    expect(basico).toBeLessThan(100);
    expect(basico).toBeGreaterThan(50);
  });

  it('respeta el peso de cada habilidad', () => {
    const weighted: MatchVacancy = {
      ...vacancy,
      skills: [{ skillId: 'python', weight: 9 }, { skillId: 'sql', weight: 1 }],
    };
    const soloPython = computeMatchScore(weighted, { ...perfect, skills: [{ skillId: 'python', proficiency: 'avanzado' }] });
    const soloSql = computeMatchScore(weighted, { ...perfect, skills: [{ skillId: 'sql', proficiency: 'avanzado' }] });
    expect(soloPython).toBeGreaterThan(soloSql);
  });

  it('las habilidades opcionales pesan menos que las obligatorias', () => {
    const v: MatchVacancy = {
      ...vacancy,
      skills: [{ skillId: 'python', isRequired: true }, { skillId: 'sql', isRequired: false }],
    };
    const conObligatoria = computeMatchScore(v, { ...perfect, skills: [{ skillId: 'python', proficiency: 'avanzado' }] });
    const conOpcional = computeMatchScore(v, { ...perfect, skills: [{ skillId: 'sql', proficiency: 'avanzado' }] });
    expect(conObligatoria).toBeGreaterThan(conOpcional);
  });

  it('penaliza disponibilidad insuficiente de forma proporcional', () => {
    const r = computeMatch(vacancy, { ...perfect, availabilityHoursPerWeek: 10 });
    expect(r.availability).toBe(MATCH_WEIGHTS.availability / 2);
  });

  it('no premia horas extra por encima de lo requerido', () => {
    const r = computeMatch(vacancy, { ...perfect, availabilityHoursPerWeek: 40 });
    expect(r.availability).toBe(MATCH_WEIGHTS.availability);
  });

  it('preferencia "cualquiera" cuenta como compatible', () => {
    const r = computeMatch(vacancy, { ...perfect, preferredModality: 'cualquiera', preferredContractType: 'cualquiera' });
    expect(r.preferences).toBe(MATCH_WEIGHTS.modality + MATCH_WEIGHTS.contract);
  });

  it('preferencias distintas no suman', () => {
    const r = computeMatch(vacancy, { ...perfect, preferredModality: 'remoto', preferredContractType: 'fijo' });
    expect(r.preferences).toBe(0);
  });

  it('una vacante sin habilidades da puntaje neutro de habilidades', () => {
    const r = computeMatch({ ...vacancy, skills: [] }, perfect);
    expect(r.skills).toBe(MATCH_WEIGHTS.skills / 2);
  });

  it('ignora habilidades duplicadas en la vacante', () => {
    const dup: MatchVacancy = { ...vacancy, skills: [{ skillId: 'python' }, { skillId: 'python' }, { skillId: 'sql' }] };
    expect(computeMatchScore(dup, perfect)).toBe(100);
  });

  it('siempre devuelve un entero entre 0 y 100', () => {
    const r = computeMatchScore({ skills: [{ skillId: 'x', weight: 999 }] }, { skills: [] });
    expect(Number.isInteger(r)).toBe(true);
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThanOrEqual(100);
  });
});

describe('rankCandidates', () => {
  const candidates = [
    { id: 'c-sin', skills: [] as MatchCandidate['skills'], availabilityHoursPerWeek: 20 },
    { id: 'c-perfecto', ...perfect },
    { id: 'c-medio', ...perfect, skills: [{ skillId: 'python', proficiency: 'intermedio' }] },
  ];

  it('ordena de mayor a menor compatibilidad', () => {
    const ids = rankCandidates(vacancy, candidates).map((r) => r.candidate.id);
    expect(ids).toEqual(['c-perfecto', 'c-medio', 'c-sin']);
  });

  it('aplica puntaje mínimo y límite', () => {
    const r = rankCandidates(vacancy, candidates, { minScore: 40, limit: 1 });
    expect(r).toHaveLength(1);
    expect(r[0].candidate.id).toBe('c-perfecto');
  });

  it('devuelve lista vacía si no hay candidatos', () => {
    expect(rankCandidates(vacancy, [])).toEqual([]);
  });
});

describe('firstOf', () => {
  it('normaliza objetos y arreglos de Supabase', () => {
    expect(firstOf([{ a: 1 }, { a: 2 }])).toEqual({ a: 1 });
    expect(firstOf({ a: 1 })).toEqual({ a: 1 });
    expect(firstOf(null)).toBeUndefined();
    expect(firstOf([])).toBeUndefined();
  });
});

describe('validateVacancyForm', () => {
  const valid = {
    title: '  Automatizar reportes ',
    department: 'Finanzas',
    description: 'Proceso manual en Excel',
    skills: ['Python', 'Python', ' SQL '],
    weeklyHours: '20',
    durationMonths: '3',
  };

  it('normaliza datos válidos', () => {
    const r = validateVacancyForm(valid);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.title).toBe('Automatizar reportes');
      expect(r.data.skills).toEqual(['Python', 'SQL']);
      expect(r.data.weeklyHours).toBe(20);
      expect(r.data.durationMonths).toBe(3);
    }
  });

  it('reporta todos los campos obligatorios vacíos', () => {
    const r = validateVacancyForm({ title: ' ', department: '', description: '', skills: [], weeklyHours: '20', durationMonths: '3' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['department', 'description', 'skills', 'title']);
  });

  it('rechaza horas y duración fuera de rango', () => {
    const r = validateVacancyForm({ ...valid, weeklyHours: '0', durationMonths: 'abc' });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.weeklyHours).toBeDefined();
      expect(r.errors.durationMonths).toBeDefined();
    }
  });

  it('rechaza más de 25 horas semanales (máximo PAT)', () => {
    expect(validateVacancyForm({ ...valid, weeklyHours: '30' }).ok).toBe(false);
    expect(validateVacancyForm({ ...valid, weeklyHours: '25' }).ok).toBe(true);
  });

  it('rechaza títulos de más de 200 caracteres', () => {
    const r = validateVacancyForm({ ...valid, title: 'a'.repeat(201) });
    expect(r.ok).toBe(false);
  });
});

import { skillKey, vacancySkillsFromRows, candidateFromProfiles } from './matching';

describe('adaptadores de perfil', () => {
  it('skillKey normaliza mayúsculas y espacios', () => {
    expect(skillKey('  Power   BI ')).toBe('power bi');
    expect(skillKey(null)).toBe('');
  });

  it('vacancySkillsFromRows usa el nombre de la habilidad (objeto o arreglo)', () => {
    const rows = [
      { skill_id: 'id-1', weight: 3, is_required: true, skills: { name: 'Python' } },
      { skill_id: 'id-2', skills: [{ name: 'SQL' }] },
      { skill_id: 'id-3', skills: null },
    ];
    expect(vacancySkillsFromRows(rows)).toEqual([
      { skillId: 'python', weight: 3, isRequired: true },
      { skillId: 'sql', weight: 1, isRequired: true },
      { skillId: 'id-3', weight: 1, isRequired: true },
    ]);
  });

  it('candidateFromProfiles toma habilidades y horas de profiles', () => {
    const c = candidateFromProfiles({ skills: ['Python', 'python', ' SQL'], availability_hours: 20 });
    expect(c.skills.map((s) => s.skillId)).toEqual(['python', 'sql']);
    expect(c.availabilityHoursPerWeek).toBe(20);
  });

  it('candidate_skills aporta el nivel de dominio', () => {
    const c = candidateFromProfiles(
      { skills: ['Python'] },
      { candidate_skills: [{ proficiency_level: 'avanzado', skills: { name: 'python' } }], preferred_modality: 'remoto' }
    );
    expect(c.skills).toEqual([{ skillId: 'python', proficiency: 'avanzado' }]);
    expect(c.preferredModality).toBe('remoto');
  });

  it('un estudiante con las habilidades del perfil hace match con la vacante', () => {
    const vacancy = { skills: vacancySkillsFromRows([{ skills: { name: 'Python' } }, { skills: { name: 'SQL' } }]), patHoursPerWeek: 20 };
    const student = candidateFromProfiles({ skills: ['python', 'sql'], availability_hours: 20 });
    expect(computeMatch(vacancy, student).matchedSkillIds).toEqual(['python', 'sql']);
    expect(computeMatchScore(vacancy, student)).toBeGreaterThanOrEqual(85);
  });

  it('sin perfil no falla', () => {
    expect(candidateFromProfiles(null).skills).toEqual([]);
  });
});
