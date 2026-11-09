import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Mock mínimo del cliente de Supabase ----
type Result = { data: unknown; error: { message: string; code?: string } | null };

let user: { id: string } | null;
let responses: Record<string, Result>;
let calls: { table: string; op: string; payload?: unknown; filters: [string, unknown][] }[];

function builder(table: string) {
  const call = { table, op: 'select', payload: undefined as unknown, filters: [] as [string, unknown][] };
  calls.push(call);
  const result = () => responses[`${table}.${call.op}`] ?? { data: null, error: null };
  const b: any = {
    select: () => b,
    insert: (p: unknown) => ((call.op = 'insert'), (call.payload = p), b),
    delete: () => ((call.op = 'delete'), b),
    eq: (col: string, val: unknown) => (call.filters.push([col, val]), b),
    maybeSingle: () => Promise.resolve(result()),
    single: () => Promise.resolve(result()),
    then: (res: (r: Result) => unknown, rej?: (e: unknown) => unknown) => Promise.resolve(result()).then(res, rej),
  };
  return b;
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user } }) },
    from: (table: string) => builder(table),
  }),
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { applyToVacancyAction, withdrawApplicationAction } from './actions';

const publishedVacancy = {
  id: 'v1',
  status: 'publicada',
  modality: 'hibrido',
  contract_type: 'pasantia',
  pat_hours_per_week: 20,
  vacancy_skills: [{ skill_id: 's-python', weight: 1, is_required: true }],
};

beforeEach(() => {
  user = { id: 'u1' };
  calls = [];
  responses = {
    'vacancies.select': { data: publishedVacancy, error: null },
    'candidate_profiles.select': {
      data: {
        id: 'cp1',
        availability_hours_per_week: 20,
        preferred_modality: 'hibrido',
        preferred_contract_type: 'pasantia',
        candidate_skills: [{ skill_id: 's-python', proficiency_level: 'avanzado' }],
      },
      error: null,
    },
    'applications.insert': { data: null, error: null },
  };
});

describe('applyToVacancyAction', () => {
  it('exige sesión iniciada', async () => {
    user = null;
    const r = await applyToVacancyAction('v1');
    expect(r).toEqual({ success: false, error: 'Debes iniciar sesión' });
  });

  it('rechaza un id vacío', async () => {
    expect((await applyToVacancyAction('')).success).toBe(false);
  });

  it('crea la postulación con el puntaje calculado en el servidor', async () => {
    const r = await applyToVacancyAction('v1');
    expect(r).toEqual({ success: true, matchScore: 100 });
    const insert = calls.find((c) => c.table === 'applications' && c.op === 'insert');
    expect(insert?.payload).toEqual({ vacancy_id: 'v1', candidate_id: 'u1', status: 'recibida', match_score: 100 });
  });

  it('no permite postularse a vacantes no publicadas', async () => {
    responses['vacancies.select'] = { data: { ...publishedVacancy, status: 'borrador' }, error: null };
    const r = await applyToVacancyAction('v1');
    expect(r.success).toBe(false);
    expect(calls.some((c) => c.op === 'insert')).toBe(false);
  });

  it('trata una postulación duplicada como éxito', async () => {
    responses['applications.insert'] = { data: null, error: { message: 'dup', code: '23505' } };
    expect((await applyToVacancyAction('v1')).success).toBe(true);
  });

  it('devuelve el error de la base de datos', async () => {
    responses['applications.insert'] = { data: null, error: { message: 'RLS' } };
    const r = await applyToVacancyAction('v1');
    expect(r.success).toBe(false);
    expect(r.error).toContain('RLS');
  });

  it('funciona aunque el estudiante no tenga perfil de candidato', async () => {
    responses['candidate_profiles.select'] = { data: null, error: null };
    const r = await applyToVacancyAction('v1');
    expect(r.success).toBe(true);
    expect(r.matchScore).toBeLessThan(50);
  });
});

describe('withdrawApplicationAction', () => {
  it('elimina solo postulaciones propias en estado recibida', async () => {
    responses['applications.delete'] = { data: [{ id: 'a1' }], error: null };
    const r = await withdrawApplicationAction('v1');
    expect(r.success).toBe(true);
    const del = calls.find((c) => c.op === 'delete');
    expect(del?.filters).toEqual([
      ['vacancy_id', 'v1'],
      ['candidate_id', 'u1'],
      ['status', 'recibida'],
    ]);
  });

  it('informa si la postulación ya está en revisión', async () => {
    responses['applications.delete'] = { data: [], error: null };
    const r = await withdrawApplicationAction('v1');
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/en revisión/);
  });

  it('exige sesión iniciada', async () => {
    user = null;
    expect((await withdrawApplicationAction('v1')).success).toBe(false);
  });
});
