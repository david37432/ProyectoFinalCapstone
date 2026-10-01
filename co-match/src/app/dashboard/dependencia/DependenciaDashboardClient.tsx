'use client';

import { useState, useCallback } from 'react';
import { AdminHeader } from '@/components/layout/admin/AdminHeader';
import { AdminSidebar } from '@/components/layout/admin/AdminSidebar';
import { AdminMetricsCards } from './AdminMetricsCards';
import { VacanciesTable } from './VacanciesTable';
import { TopCandidatesPanel } from './TopCandidatesPanel';
import { QuickActions } from './QuickActions';
import { cn } from '@/lib/utils';
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState<'web' | 'mobile'>('web');

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminHeader
        userName={user.full_name}
        departmentName={user.department_name}
        onViewToggle={setCurrentView}
        currentView={currentView}
      />
      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main
        className={cn(
          'pt-16 transition-all duration-300 min-h-[calc(100vh-4rem)]',
          isSidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">Panel de Dependencia</h1>
                <p className="text-neutral-600 text-sm mt-1">
                  Bienvenido, {user.full_name} · {user.department_name}
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
      </main>
    </div>
  );
}