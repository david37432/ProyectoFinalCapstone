/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Supabase falso en memoria para pruebas de integración: ejecuta las consultas reales de
 * `admin-queries` (select/insert/update/delete con eq, neq, in, order, limit, single, maybeSingle)
 * contra tablas que viven en un objeto, sin red ni base de datos.
 */
export type Tables = Record<string, any[]>;

let counter = 0;
const uid = () => `id-${++counter}`;

class Query {
  private filters: ((row: any) => boolean)[] = [];
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private payload: any = null;
  private orderBy: { col: string; asc: boolean } | null = null;
  private max: number | null = null;
  private wantsRow = false;

  constructor(private tables: Tables, private table: string) {
    if (!tables[table]) tables[table] = [];
  }

  select() { return this; }
  insert(payload: any) { this.action = 'insert'; this.payload = payload; return this; }
  update(payload: any) { this.action = 'update'; this.payload = payload; return this; }
  delete() { this.action = 'delete'; return this; }
  eq(col: string, val: any) { this.filters.push((r) => r[col] === val); return this; }
  neq(col: string, val: any) { this.filters.push((r) => r[col] !== val); return this; }
  in(col: string, vals: any[]) { this.filters.push((r) => vals.includes(r[col])); return this; }
  order(col: string, opts?: { ascending?: boolean }) { this.orderBy = { col, asc: opts?.ascending !== false }; return this; }
  limit(n: number) { this.max = n; return this; }
  single() { this.wantsRow = true; return this.run(true); }
  maybeSingle() { this.wantsRow = true; return this.run(false); }

  private run(strict: boolean) {
    const rows = this.tables[this.table];
    const match = (r: any) => this.filters.every((f) => f(r));
    let result: any[] = [];

    if (this.action === 'insert') {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload];
      result = items.map((i) => ({ id: uid(), created_at: new Date().toISOString(), ...i }));
      rows.push(...result);
    } else if (this.action === 'update') {
      result = rows.filter(match);
      result.forEach((r) => Object.assign(r, this.payload));
    } else if (this.action === 'delete') {
      result = rows.filter(match);
      this.tables[this.table] = rows.filter((r) => !match(r));
    } else {
      result = rows.filter(match);
      if (this.orderBy) {
        const { col, asc } = this.orderBy;
        result = [...result].sort((a, b) => (String(a[col] ?? '') < String(b[col] ?? '') ? -1 : 1) * (asc ? 1 : -1));
      }
      if (this.max != null) result = result.slice(0, this.max);
    }

    if (this.wantsRow) {
      const row = result[0] ?? null;
      return Promise.resolve({ data: row, error: !row && strict ? { message: 'no rows' } : null });
    }
    return Promise.resolve({ data: result, error: null });
  }

  then(resolve: (v: any) => any, reject?: (e: any) => any) {
    return this.run(false).then(resolve, reject);
  }
}

export function createFakeSupabase(tables: Tables) {
  return {
    from: (table: string) => new Query(tables, table),
    auth: { getUser: async () => ({ data: { user: null }, error: null }) },
  };
}
