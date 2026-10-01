'use client';

import { Badge } from '@/components/ui/Badge';
import { formatRelativeTime } from '@/lib/utils';
import { VacancyWithDetails } from '@/lib/supabase/admin-queries';
import { MoreVertical, Eye, Edit, Trash2, ExternalLink } from 'lucide-react';

interface VacanciesTableProps {
  vacancies: VacancyWithDetails[];
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline' }> = {
  publicada: { label: 'Publicada', variant: 'success' },
  borrador: { label: 'Borrador', variant: 'outline' },
  en_aprobacion: { label: 'En aprobación', variant: 'warning' },
  cerrada: { label: 'Cerrada', variant: 'default' },
  cancelada: { label: 'Cancelada', variant: 'danger' },
};

const modalityLabels: Record<string, string> = {
  presencial: 'Presencial',
  remoto: 'Remoto',
  hibrido: 'Híbrido',
};

export function VacanciesTable({ vacancies }: VacanciesTableProps) {
  if (vacancies.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-8">
        <div className="text-center py-8">
          <svg className="w-16 h-16 mx-auto text-neutral-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <h3 className="text-lg font-medium text-neutral-900 mb-1">No hay necesidades publicadas</h3>
          <p className="text-neutral-500 text-sm mb-4">Comienza publicando tu primera necesidad</p>
          <a href="/dashboard/dependencia/publicar" className="inline-flex items-center gap-2 text-primary font-medium hover:underline">
            Publicar necesidad
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-200">
        <h2 className="text-lg font-semibold text-neutral-900">Necesidades Publicadas</h2>
        <p className="text-sm text-neutral-500 mt-0.5">{vacancies.length} necesidades registradas</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full" role="table">
          <thead>
            <tr className="text-left text-neutral-500 text-xs font-medium uppercase tracking-wider border-b border-neutral-200 bg-neutral-50">
              <th className="px-6 py-3">Necesidad</th>
              <th className="px-6 py-3">Estado</th>
              <th className="px-6 py-3 hidden md:table-cell">Dependencia</th>
              <th className="px-6 py-3 hidden lg:table-cell">Publicación</th>
              <th className="px-6 py-3 hidden lg:table-cell">Modalidad</th>
              <th className="px-6 py-3">Candidatos</th>
              <th className="px-6 py-3">Horas/sem</th>
              <th className="px-6 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {vacancies.map((vacancy) => (
              <tr key={vacancy.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <h3 className="font-medium text-neutral-900 truncate max-w-xs">{vacancy.title}</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {vacancy.required_skills.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="outline" size="sm" className="bg-neutral-50 border-neutral-200 text-neutral-700">
                          {skill}
                        </Badge>
                      ))}
                      {vacancy.required_skills.length > 3 && (
                        <Badge variant="outline" size="sm" className="bg-neutral-50 border-neutral-200 text-neutral-500">
                          +{vacancy.required_skills.length - 3} más
                        </Badge>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={statusConfig[vacancy.status]?.variant || 'outline'}>
                    {statusConfig[vacancy.status]?.label || vacancy.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 hidden md:table-cell text-neutral-600 text-sm">
                  {vacancy.department_name || vacancy.department_id}
                </td>
                <td className="px-6 py-4 hidden lg:table-cell text-neutral-500 text-sm">
                  {formatRelativeTime(vacancy.publication_date)}
                </td>
                <td className="px-6 py-4 hidden lg:table-cell">
                  <Badge variant="outline" size="sm" className="bg-neutral-50">
                    {modalityLabels[vacancy.modality] || vacancy.modality}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="font-medium text-neutral-900">{vacancy.candidates_count}</span>
                </td>
                <td className="px-6 py-4 text-neutral-600 text-sm">
                  {vacancy.pat_hours_per_week} hrs
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      className="p-2 rounded-lg text-neutral-400 hover:text-primary hover:bg-primary/10 transition-colors"
                      aria-label="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 rounded-lg text-neutral-400 hover:text-primary hover:bg-primary/10 transition-colors"
                      aria-label="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 rounded-lg text-neutral-400 hover:text-danger hover:bg-danger/10 transition-colors"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
                      aria-label="Más opciones"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}