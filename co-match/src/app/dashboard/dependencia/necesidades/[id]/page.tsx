import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, Users, CalendarDays } from 'lucide-react';
import { requireAdmin } from '@/lib/supabase/server-auth';
import { getOwnVacancyDetail } from '@/lib/supabase/admin-queries';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { VacancyActions } from '@/components/dashboard/dependencia/necesidades/VacancyActions';

export const dynamic = 'force-dynamic';

const STATUS: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline' }> = {
  publicada: { label: 'Publicada', variant: 'success' },
  en_aprobacion: { label: 'Pendiente revisión PAT', variant: 'warning' },
  en_curso: { label: 'En curso', variant: 'primary' },
  cerrada: { label: 'Cerrada', variant: 'default' },
};

export default async function NecesidadDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireAdmin();
  const v = await getOwnVacancyDetail(id, user.id);
  if (!v) notFound();

  const status = STATUS[v.status] ?? { label: v.status, variant: 'outline' as const };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href="/dashboard/dependencia"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-primary text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al panel
        </Link>

        <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-neutral-900 break-words">{v.title}</h1>
              <p className="text-neutral-500 mt-1">{v.area}</p>
            </div>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2 text-neutral-700"><Clock className="w-4 h-4 text-neutral-400" />{v.weekly_hours} hrs/semana</div>
            <div className="flex items-center gap-2 text-neutral-700"><CalendarDays className="w-4 h-4 text-neutral-400" />{v.duration_months} mes{v.duration_months !== 1 ? 'es' : ''}</div>
            <div className="flex items-center gap-2 text-neutral-700"><Users className="w-4 h-4 text-neutral-400" />{v.applications_count} postulación{v.applications_count !== 1 ? 'es' : ''}</div>
            <div className="text-neutral-500">Creada el {formatDate(v.created_at)}</div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-neutral-900 mb-2">Descripción</h2>
            <p className="text-neutral-700 whitespace-pre-wrap break-words">{v.description || 'Sin descripción'}</p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-neutral-900 mb-2">Habilidades requeridas</h2>
            <div className="flex flex-wrap gap-2">
              {v.skills.length > 0
                ? v.skills.map((s) => <Badge key={s} variant="primary">{s}</Badge>)
                : <span className="text-neutral-400 text-sm">Sin habilidades</span>}
            </div>
          </div>

          <VacancyActions
            id={v.id}
            isClosed={v.status === 'cerrada'}
            hasApplications={v.applications_count > 0}
            hasMatch={v.matches_count > 0}
          />
        </div>
      </div>
    </div>
  );
}
