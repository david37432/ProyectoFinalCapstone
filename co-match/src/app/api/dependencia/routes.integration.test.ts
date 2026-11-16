/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Pruebas de integración de las rutas API de la dependencia (autenticación, validación y
 * respuestas HTTP) con un Supabase falso en memoria.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Tables } from '@/test/fake-supabase';

let tables: Tables;
let currentUser: { id: string; role: string } | null;

vi.mock('react', async (original) => ({ ...(await original<typeof import('react')>()), cache: (fn: unknown) => fn }));
vi.mock('@/lib/supabase/server', async () => {
  const { createFakeSupabase } = await import('@/test/fake-supabase');
  return { createClient: async () => createFakeSupabase(tables) };
});
vi.mock('@/lib/supabase/server-auth', () => ({
  requireAdminApi: async () =>
    currentUser?.role === 'dependencia'
      ? { user: currentUser, response: null }
      : { user: null, response: Response.json({ error: currentUser ? 'No autorizado' : 'No autenticado' }, { status: currentUser ? 403 : 401 }) },
}));

import { POST as postMessage, GET as getMessages } from './conversations/[id]/messages/route';
import { DELETE as release, POST as contact } from './applications/[id]/contact/route';
import { GET as getNotifications } from './notifications/route';

const params = (id: string) => ({ params: Promise.resolve({ id }) });
const json = (body: unknown) =>
  new Request('http://localhost/x', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

beforeEach(() => {
  currentUser = { id: 'dep1', role: 'dependencia' };
  tables = {
    profiles: [
      { id: 'dep1', full_name: 'Dependencia', role: 'dependencia' },
      { id: 's1', full_name: 'Ana', role: 'estudiante' },
    ],
    opportunities: [{ id: 'o1', dependency_id: 'dep1', title: 'Proyecto', status: 'published', required_skills: [], created_at: new Date().toISOString() }],
    applications: [{ id: 'a1', opportunity_id: 'o1', student_id: 's1', dependency_status: 'pending', is_match: false, created_at: new Date().toISOString() }],
    conversations: [{ id: 'c1', opportunity_id: 'o1', dependency_id: 'dep1', student_id: 's1', unread_dependency_count: 0, unread_student_count: 0 }],
    messages: [],
    project_milestones: [],
  };
});

describe('autenticación y permisos', () => {
  it('sin sesión todo responde 401', async () => {
    currentUser = null;
    expect((await getNotifications()).status).toBe(401);
    expect((await postMessage(json({ content: 'hola' }), params('c1'))).status).toBe(401);
    expect((await release(json({}), params('a1'))).status).toBe(401);
  });

  it('un estudiante recibe 403 en las rutas de la dependencia', async () => {
    currentUser = { id: 's1', role: 'estudiante' };
    expect((await getNotifications()).status).toBe(403);
    expect((await contact(json({}), params('a1'))).status).toBe(403);
  });
});

describe('POST /conversations/[id]/messages', () => {
  it('envía un mensaje de texto', async () => {
    const res = await postMessage(json({ content: '  Hola Ana  ' }), params('c1'));
    expect(res.status).toBe(200);
    expect((await res.json()).message.content).toBe('Hola Ana');
    expect(tables.messages).toHaveLength(1);
  });

  it('rechaza mensajes vacíos o demasiado largos', async () => {
    expect((await postMessage(json({ content: '   ' }), params('c1'))).status).toBe(400);
    expect((await postMessage(json({ content: 'x'.repeat(5001) }), params('c1'))).status).toBe(400);
    expect(tables.messages).toHaveLength(0);
  });

  it('envía un archivo cuya ruta pertenece a la conversación', async () => {
    const res = await postMessage(
      json({ messageType: 'file', filePath: 'c1/ab12-informe.pdf', fileName: 'informe.pdf', fileSize: 1000 }),
      params('c1')
    );
    expect(res.status).toBe(200);
    const { message } = await res.json();
    expect(message).toMatchObject({ message_type: 'file', file_name: 'informe.pdf', file_url: 'c1/ab12-informe.pdf' });
  });

  it('rechaza archivos con la ruta de otra conversación o con ".."', async () => {
    for (const filePath of ['c2/x.pdf', 'c1/../c2/x.pdf', '', undefined]) {
      const res = await postMessage(json({ messageType: 'file', filePath, fileName: 'x.pdf' }), params('c1'));
      expect(res.status).toBe(400);
    }
    expect(tables.messages).toHaveLength(0);
  });

  it('rechaza a una dependencia que no participa en la conversación', async () => {
    tables.conversations[0].dependency_id = 'otra';
    expect((await postMessage(json({ content: 'hola' }), params('c1'))).status).toBe(403);
    expect((await getMessages(new Request('http://x'), params('c1'))).status).toBe(403);
  });

  it('404 si la conversación no existe', async () => {
    expect((await postMessage(json({ content: 'hola' }), params('nope'))).status).toBe(404);
  });
});

describe('DELETE /applications/[id]/contact (retirar del proceso)', () => {
  it('retira al estudiante después de contactarlo', async () => {
    expect((await contact(json({}), params('a1'))).status).toBe(200);
    const res = await release(json({ reason: 'Ya no se necesita' }), params('a1'));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true, vacancyId: 'o1', opportunityStatus: 'published' });
    expect(tables.applications[0]).toMatchObject({ dependency_status: 'rejected', is_match: false });
  });

  it('acepta un cuerpo vacío o inválido', async () => {
    const res = await release(new Request('http://x', { method: 'DELETE' }), params('a1'));
    expect(res.status).toBe(200);
  });

  it('404 si la postulación no existe', async () => {
    expect((await release(json({}), params('nope'))).status).toBe(404);
  });
});

describe('GET /notifications', () => {
  it('devuelve los avisos de la dependencia', async () => {
    const res = await getNotifications();
    expect(res.status).toBe(200);
    const { notifications } = await res.json();
    expect(notifications.map((n: any) => n.type)).toContain('application');
  });
});
