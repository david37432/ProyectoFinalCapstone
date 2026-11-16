/** Avisos del panel de la dependencia, calculados a partir de los datos existentes (sin tabla propia). */
export type DependencyNotificationType = 'application' | 'message' | 'milestone';

export interface DependencyNotification {
  id: string;
  type: DependencyNotificationType;
  title: string;
  message: string;
  href: string;
  createdAt: string;
}

export interface NotificationInput {
  now?: Date;
  opportunities: { id: string; title: string }[];
  applications: {
    id: string;
    opportunity_id: string;
    student_id: string;
    dependency_status?: string | null;
    is_match?: boolean | null;
    created_at: string;
  }[];
  studentNames: Map<string, string>;
  conversations: {
    id: string;
    student_id: string;
    opportunity_id: string;
    unread_dependency_count?: number | null;
    last_message_at?: string | null;
  }[];
  milestones: { id: string; opportunity_id: string; title: string; status: string; due_date?: string | null }[];
}

const DAY = 24 * 60 * 60 * 1000;

export function buildDependencyNotifications(input: NotificationInput, limit = 30): DependencyNotification[] {
  const now = input.now ?? new Date();
  const titleOf = new Map(input.opportunities.map((o) => [o.id, o.title]));
  const out: DependencyNotification[] = [];

  for (const a of input.applications) {
    const pending = !a.dependency_status || a.dependency_status === 'pending';
    const recent = now.getTime() - new Date(a.created_at).getTime() <= 14 * DAY;
    if (!pending || a.is_match || !recent) continue;
    out.push({
      id: `app-${a.id}`,
      type: 'application',
      title: 'Nueva postulación',
      message: `${input.studentNames.get(a.student_id) ?? 'Un estudiante'} se postuló a "${titleOf.get(a.opportunity_id) ?? 'tu necesidad'}".`,
      href: `/dashboard/dependencia/candidatos/${a.opportunity_id}`,
      createdAt: a.created_at,
    });
  }

  for (const c of input.conversations) {
    const unread = c.unread_dependency_count ?? 0;
    if (unread <= 0) continue;
    out.push({
      id: `msg-${c.id}`,
      type: 'message',
      title: unread === 1 ? 'Mensaje nuevo' : `${unread} mensajes nuevos`,
      message: `${input.studentNames.get(c.student_id) ?? 'Un estudiante'} te escribió sobre "${titleOf.get(c.opportunity_id) ?? 'un proyecto'}".`,
      href: `/dashboard/dependencia/mensajes?conversationId=${c.id}`,
      createdAt: c.last_message_at ?? now.toISOString(),
    });
  }

  for (const m of input.milestones) {
    if (m.status === 'completed' || !m.due_date) continue;
    const due = new Date(m.due_date).getTime();
    const diff = due - now.getTime();
    if (diff > 3 * DAY) continue;
    const overdue = diff < 0;
    out.push({
      id: `ms-${m.id}`,
      type: 'milestone',
      title: overdue ? 'Hito vencido' : 'Hito próximo a vencer',
      message: `"${m.title}" en "${titleOf.get(m.opportunity_id) ?? 'un proyecto'}" ${overdue ? 'ya venció' : 'vence pronto'}.`,
      href: `/dashboard/dependencia/seguimiento?opportunityId=${m.opportunity_id}`,
      createdAt: new Date(due).toISOString(),
    });
  }

  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

/** Avisos más nuevos que la última vez que se abrió la campana; los mensajes sin leer siempre cuentan. */
export function countUnseen(items: DependencyNotification[], lastSeenIso: string | null): number {
  if (!lastSeenIso) return items.length;
  return items.filter((n) => n.type === 'message' || n.createdAt > lastSeenIso).length;
}
