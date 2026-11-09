'use client';

import { AdminMetricsCards } from './AdminMetricsCards';
import { VacanciesTable } from './VacanciesTable';
import { TopCandidatesPanel } from './TopCandidatesPanel';
import { QuickActions } from './QuickActions';
import type { AdminMetrics, VacancyWithDetails, TopCandidate } from '@/lib/supabase/admin-queries';

interface DependenciaDashboardClientProps {
  user: {
    full_name: string;
    email: string;
    role: string;
    department_name: string;
  };
  initialMetrics: AdminMetrics;
  initialVacancies: VacancyWithDetails[];
  initialTopCandidates: TopCandidate[];
}

export function DependenciaDashboardClient({ user, initialMetrics, initialVacancies, initialTopCandidates }: DependenciaDashboardClientProps) {
  // El encabezado y el menú lateral los pone dependencia/layout.tsx (antes se dibujaban dos veces)
  return (
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">Panel de Dependencia</h1>
                <p className="text-neutral-600 text-sm mt-1">
                  Bienvenido, {user.full_name}{user.department_name ? ` · ${user.department_name}` : ''}
                </p>
              </div>
              <div className="flex gap-3">
                <QuickActions />
              </div>
            </div>

            <AdminMetricsCards metrics={initialMetrics} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <VacanciesTable vacancies={initialVacancies} />
              </div>
              <div className="lg:col-span-1">
                <TopCandidatesPanel candidates={initialTopCandidates} />
              </div>
            </div>
          </div>
        </div>
  );
}