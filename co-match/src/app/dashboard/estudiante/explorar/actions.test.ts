import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Mock mínimo del cliente de Supabase ----
type Result = { data: unknown; error: { message: string; code?: string } | null };

let user: { id: string } | null;
let responses: Record<string, Result>;
let calls: { table: string; op: string; payload?: unknown; filters: [string, string, unknown][] }[];

function builder(table: string) {
  const call = { table, op: 'select', payload: undefined as unknown, filters: [] as [string, string, unknown][] };
  calls.push(call);
  const result = () => responses[`${table}.${call.op}`] ?? { data: null, error: null };
  const b: any = {
    select: () => b,
    insert: (p: unknown) => ((call.op = 'insert'), (call.payload = p), b),
    delete: () => ((call.op = 'delete'), b),
    eq: (col: string, val: unknown) => (call.filters.push(['eq', col, val]), b),
    in: (col: string, val: unknown) => (call.filters.push(['in', col, val]), b),
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

const publishedOpportunity = {
  id: 'o1',
  status: 'published',
  required_skills: ['Python', 'SQL'],
  weekly_hours: 20,
};

beforeEach(() => {
  user = { id: 'u1' };
  calls = [];
  responses = {
    'opportunities.select': { data: publishedOpportunity, error: null },
    'profiles.select': { data: { skills: ['python', 'sql'], availability_hours: 20 }, error: null },
    'applications.insert': { data: null, error: null },
  };
});

describe('applyToVacancyAction', () => {
  it('exige sesión iniciada', async () => {
    user = null;
    expect(await applyToVacancyAction('o1')).toEqual({ success: false, error: 'Debes iniciar sesión' });
  });

  it('rechaza un id vacío', async () => {
    expect((await applyToVacancyAction('')).success).toBe(false);
  });

  it('crea la postulación en applications con el puntaje calculado en el servidor', async () => {
    const r = await applyToVacancyAction('o1');
    expect(r).toEqual({ success: true, matchScore: 100 });
    const insert = calls.find((c) => c.table === 'applications' && c.op === 'insert');
    expect(insert?.payload).toEqual({
      opportunity_id: 'o1',
      student_id: 'u1',
      match_score: 100,
      student_status: 'interested',
      dependency_status: 'pending',
      pat_status: 'pending',
      is_match: false,
    });
  });

  it('acepta habilidades jsonb como objetos', async () => {
    responses['opportunities.select'] = {
      data: { ...publishedOpportunity, required_skills: [{ name: 'Python' }, { name: 'SQL' }] },
      error: null,
    };
    expect((await applyToVacancyAction('o1')).matchScore).toBe(100);
  });

  it('no permite postularse a necesidades pendientes de PAT', async () => {
    responses['opportunities.select'] = { data: { ...publishedOpportunity, status: 'pending_pat' }, error: null };
    const r = await applyToVacancyAction('o1');
    expect(r.success).toBe(false);
    expect(calls.some((c) => c.op === 'insert')).toBe(false);
  });

  it('trata una postulación duplicada como éxito', async () => {
    responses['applications.insert'] = { data: null, error: { message: 'dup', code: '23505' } };
    expect((await applyToVacancyAction('o1')).success).toBe(true);
  });

  it('devuelve el error de la base de datos', async () => {
    responses['applications.insert'] = { data: null, error: { message: 'RLS' } };
    const r = await applyToVacancyAction('o1');
    expect(r.success).toBe(false);
    expect(r.error).toContain('RLS');
  });

  it('un estudiante sin habilidades obtiene puntaje bajo', async () => {
    responses['profiles.select'] = { data: { skills: [], availability_hours: null }, error: null };
    const r = await applyToVacancyAction('o1');
    expect(r.success).toBe(true);
    expect(r.matchScore).toBeLessThan(50);
  });
});

describe('withdrawApplicationAction', () => {
  it('borra la postulación propia si la dependencia no ha respondido', async () => {
    responses['applications.select'] = { data: [{ id: 'a1', dependency_status: 'pending', is_match: false }], error: null };
    responses['applications.delete'] = { data: null, error: null };
    const r = await withdrawApplicationAction('o1');
    expect(r.success).toBe(true);
    const read = calls.find((c) => c.table === 'applications' && c.op === 'select');
    expect(read?.filters).toEqual([
      ['eq', 'opportunity_id', 'o1'],
      ['eq', 'student_id', 'u1'],
    ]);
    const del = calls.find((c) => c.op === 'delete');
    expect(del?.filters).toEqual([['in', 'id', ['a1']]]);
  });

  it('no deja retirarse si la dependencia ya contactó', async () => {
    responses['applications.select'] = { data: [{ id: 'a1', dependency_status: 'contacted', is_match: true }], error: null };
    const r = await withdrawApplicationAction('o1');
    expect(r.success).toBe(false);
    expect(calls.some((c) => c.op === 'delete')).toBe(false);
  });

  it('si no había postulación responde éxito sin borrar nada', async () => {
    responses['applications.select'] = { data: [], error: null };
    expect((await withdrawApplicationAction('o1')).success).toBe(true);
    expect(calls.some((c) => c.op === 'delete')).toBe(false);
  });

  it('exige sesión iniciada', async () => {
    user = null;
    expect((await withdrawApplicationAction('o1')).success).toBe(false);
  });
});
