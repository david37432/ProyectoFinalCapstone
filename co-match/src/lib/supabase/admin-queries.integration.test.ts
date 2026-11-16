/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Pruebas de INTEGRACIÓN: las consultas reales de la dependencia (contactar, retirar, eliminar,
 * chat con archivos, notificaciones) contra un Supabase falso en memoria.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Tables } from '@/test/fake-supabase';

let tables: Tables;

vi.mock('react', async (original) => ({ ...(await original<typeof import('react')>()), cache: (fn: unknown) => fn }));
vi.mock('./server', async () => {
  const { createFakeSupabase } = await import('@/test/fake-supabase');
  return { createClient: async () => createFakeSupabase(tables) };
});

import {
  contactCandidate,
  releaseCandidate,
  removeVacancy,
  setVacancyOpen,
  updateVacancy,
  sendMessage,
  getAdminMetrics,
  getVacanciesWithDetails,
  getDependencyNotifications,
  getOwnVacancyDetail,
  getSeguimientoProjects,
} from './admin-queries';

const DAY = 24 * 60 * 60 * 1000;
const iso = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString();

beforeEach(() => {
  tables = {
    profiles: [
      { id: 'dep1', full_name: 'Dependencia Uno', role: 'dependencia' },
      { id: 'dep2', full_name: 'Dependencia Dos', role: 'dependencia' },
      { id: 's1', full_name: 'Ana Estudiante', email: 'ana@unisabana.edu.co', role: 'estudiante' },
      { id: 's2', full_name: 'Beto Estudiante', email: 'beto@unisabana.edu.co', role: 'estudiante' },
    ],
    opportunities: [
      { id: 'o1', dependency_id: 'dep1', title: 'Automatizar reportes', status: 'published', area: 'Finanzas', required_skills: ['Python'], weekly_hours: 20, duration_months: 3, created_at: iso(-5 * DAY) },
      { id: 'o2', dependency_id: 'dep1', title: 'Sin postulaciones', status: 'published', area: 'Biblioteca', required_skills: ['SQL'], weekly_hours: 10, duration_months: 2, created_at: iso(-4 * DAY) },
      { id: 'o3', dependency_id: 'dep2', title: 'De otra dependencia', status: 'published', area: 'RRHH', required_skills: [], weekly_hours: 5, duration_months: 1, created_at: iso(-3 * DAY) },
    ],
    applications: [
      { id: 'a1', opportunity_id: 'o1', student_id: 's1', match_score: 90, dependency_status: 'pending', is_match: false, created_at: iso(-1 * DAY) },
      { id: 'a2', opportunity_id: 'o1', student_id: 's2', match_score: 70, dependency_status: 'pending', is_match: false, created_at: iso(-1 * DAY) },
    ],
    conversations: [],
    messages: [],
    project_milestones: [],
  };
});

describe('contactCandidate', () => {
  it('confirma el match, pone la necesidad en curso, crea hitos y conversación', async () => {
    const res = await contactCandidate('a1', 'dep1');
    expect(res.error).toBeUndefined();
    expect(res.conversationId).toBeTruthy();

    expect(tables.applications.find((a) => a.id === 'a1')).toMatchObject({ is_match: true, dependency_status: 'contacted' });
    expect(tables.opportunities.find((o) => o.id === 'o1')?.status).toBe('in_progress');
    expect(tables.project_milestones).toHaveLength(6);
    expect(tables.conversations).toHaveLength(1);
  });

  it('no duplica hitos ni conversaciones si se contacta dos veces', async () => {
    await contactCandidate('a1', 'dep1');
    await contactCandidate('a1', 'dep1');
    expect(tables.project_milestones).toHaveLength(6);
    expect(tables.conversations).toHaveLength(1);
  });

  it('rechaza a una dependencia que no es dueña de la necesidad', async () => {
    const res = await contactCandidate('a1', 'dep2');
    expect(res.status).toBe(403);
    expect(tables.applications.find((a) => a.id === 'a1')?.is_match).toBe(false);
  });
});

describe('releaseCandidate (retirar / cambiar al estudiante)', () => {
  it('rechaza la postulación, borra sus hitos, reabre la necesidad y avisa por el chat', async () => {
    await contactCandidate('a1', 'dep1');
    const res = await releaseCandidate('a1', 'dep1', 'Cambió el alcance del proyecto');

    expect(res).toMatchObject({ vacancyId: 'o1', opportunityStatus: 'published' });
    expect(tables.applications.find((a) => a.id === 'a1')).toMatchObject({ is_match: false, dependency_status: 'rejected' });
    expect(tables.project_milestones).toHaveLength(0);
    expect(tables.opportunities.find((o) => o.id === 'o1')).toMatchObject({ status: 'published', start_date: null });

    const note = tables.messages.at(-1);
    expect(note.content).toContain('ha finalizado tu participación');
    expect(note.content).toContain('Cambió el alcance del proyecto');
    expect(tables.conversations[0].unread_student_count).toBe(1);
  });

  it('el estudiante retirado ya no aparece en el seguimiento', async () => {
    await contactCandidate('a1', 'dep1');
    expect(await getSeguimientoProjects('dep1')).toHaveLength(1);
    await releaseCandidate('a1', 'dep1');
    expect(await getSeguimientoProjects('dep1')).toHaveLength(0);
  });

  it('si queda otro estudiante en curso, la necesidad sigue en curso', async () => {
    await contactCandidate('a1', 'dep1');
    await contactCandidate('a2', 'dep1');
    const res = await releaseCandidate('a1', 'dep1');
    expect(res.opportunityStatus).toBe('in_progress');
    expect(tables.project_milestones.every((m) => m.student_id === 's2')).toBe(true);
  });

  it('funciona aunque todavía no exista conversación', async () => {
    const res = await releaseCandidate('a2', 'dep1');
    expect(res.error).toBeUndefined();
    expect(tables.messages).toHaveLength(0);
  });

  it('no deja que otra dependencia retire al estudiante', async () => {
    await contactCandidate('a1', 'dep1');
    const res = await releaseCandidate('a1', 'dep2');
    expect(res.status).toBe(403);
    expect(tables.applications.find((a) => a.id === 'a1')?.is_match).toBe(true);
  });

  it('devuelve 404 si la postulación no existe', async () => {
    expect((await releaseCandidate('nope', 'dep1')).status).toBe(404);
  });
});

describe('eliminar, cerrar y editar necesidades', () => {
  it('sin postulaciones se borra definitivamente', async () => {
    const res = await removeVacancy('o2', 'dep1');
    expect(res.mode).toBe('delete');
    expect(tables.opportunities.find((o) => o.id === 'o2')).toBeUndefined();
  });

  it('con postulaciones se cancela y deja de mostrarse en el panel', async () => {
    const res = await removeVacancy('o1', 'dep1');
    expect(res.mode).toBe('cancel');
    expect(tables.opportunities.find((o) => o.id === 'o1')?.status).toBe('cancelled');
    const visible = await getVacanciesWithDetails('dep1');
    expect(visible.map((v) => v.id)).toEqual(['o2']);
    expect((await getAdminMetrics('dep1')).activeVacancies).toBe(1);
    expect(await getOwnVacancyDetail('o1', 'dep1')).toBeNull();
  });

  it('no permite eliminar ni cerrar necesidades de otra dependencia', async () => {
    expect((await removeVacancy('o3', 'dep1')).status).toBe(403);
    expect((await setVacancyOpen('o3', 'dep1', false)).status).toBe(403);
    expect(tables.opportunities.find((o) => o.id === 'o3')?.status).toBe('published');
  });

  it('cerrar y reabrir; al reabrir con un match vuelve a "en curso"', async () => {
    await setVacancyOpen('o2', 'dep1', false);
    expect(tables.opportunities.find((o) => o.id === 'o2')?.status).toBe('closed');
    await setVacancyOpen('o2', 'dep1', true);
    expect(tables.opportunities.find((o) => o.id === 'o2')?.status).toBe('published');

    await contactCandidate('a1', 'dep1');
    await setVacancyOpen('o1', 'dep1', false);
    await setVacancyOpen('o1', 'dep1', true);
    expect(tables.opportunities.find((o) => o.id === 'o1')?.status).toBe('in_progress');
  });

  it('edita los datos de su necesidad y rechaza a otra dependencia', async () => {
    const changes = { title: 'Nuevo título', department: 'Área nueva', description: 'Desc', skills: ['Excel Avanzado', 'Mi herramienta'], weeklyHours: 15, durationMonths: 4 };
    expect((await updateVacancy('o1', 'dep1', changes)).error).toBeNull();
    expect(tables.opportunities.find((o) => o.id === 'o1')).toMatchObject({
      title: 'Nuevo título',
      area: 'Área nueva',
      required_skills: ['Excel Avanzado', 'Mi herramienta'],
      weekly_hours: 15,
      duration_months: 4,
    });
    expect((await updateVacancy('o1', 'dep2', changes)).status).toBe(403);
    expect((await updateVacancy('nope', 'dep1', changes)).status).toBe(404);
  });
});

describe('chat con archivos', () => {
  beforeEach(async () => {
    await contactCandidate('a1', 'dep1');
  });

  it('un mensaje de texto suma no leídos para el estudiante', async () => {
    const convId = tables.conversations[0].id;
    const { message } = await sendMessage(convId, 'dep1', 'Hola Ana');
    expect(message).toMatchObject({ content: 'Hola Ana', message_type: 'text', is_own: true });
    expect(tables.conversations[0]).toMatchObject({ last_message: 'Hola Ana', unread_student_count: 1 });
  });

  it('un archivo guarda su ruta y nombre y se muestra como adjunto', async () => {
    const convId = tables.conversations[0].id;
    const path = `${convId}/abc12345-contrato.pdf`;
    const { message } = await sendMessage(convId, 'dep1', 'contrato.pdf', { path, name: 'contrato.pdf', size: 2048 });

    expect(message).toMatchObject({ message_type: 'file', file_url: path, file_name: 'contrato.pdf' });
    expect(tables.messages[0]).toMatchObject({ message_type: 'file', file_size: 2048 });
    expect(tables.conversations[0].last_message).toBe('📎 contrato.pdf');
  });

  it('el estudiante responde y suma no leídos para la dependencia', async () => {
    const convId = tables.conversations[0].id;
    await sendMessage(convId, 's1', 'Gracias');
    expect(tables.conversations[0].unread_dependency_count).toBe(1);
  });
});

describe('notificaciones de la dependencia', () => {
  it('reúne postulaciones nuevas, mensajes sin leer e hitos por vencer', async () => {
    await contactCandidate('a1', 'dep1'); // a1 deja de ser "nueva"; a2 sigue pendiente
    const convId = tables.conversations[0].id;
    await sendMessage(convId, 's1', 'Buenas tardes');
    tables.project_milestones[1].due_date = iso(-1 * DAY); // vencido

    const items = await getDependencyNotifications('dep1');
    const types = items.map((n) => n.type);
    expect(types).toContain('application');
    expect(types).toContain('message');
    expect(types).toContain('milestone');
    expect(items.find((n) => n.type === 'application')?.message).toContain('Beto Estudiante');
    expect(items.find((n) => n.type === 'message')?.href).toContain(convId);
  });

  it('no mezcla avisos de otras dependencias', async () => {
    expect(await getDependencyNotifications('dep2')).toEqual([]);
  });
});
