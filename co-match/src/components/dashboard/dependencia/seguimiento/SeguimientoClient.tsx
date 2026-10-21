'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Download, AlertTriangle, CheckCircle, Clock, TrendingUp, Star, Target, Briefcase, Users, MessageSquare, User, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { MilestoneTimeline } from './MilestoneTimeline';
import { ProgressCard, KPICard } from './ProgressCard';
import { StudentCard } from './StudentCard';
import { ProjectSelector } from './ProjectSelector';
import { EmptyState, NoProjectSelected } from './EmptyState';
import type { SeguimientoProject, ProjectMilestone } from '@/lib/supabase/admin-queries';

interface SeguimientoClientProps {
  user: {
    id: string;
    full_name: string;
    email: string;
    role: string;
    department_name: string;
  };
  projects: SeguimientoProject[];
  selectedProject: SeguimientoProject | null;
}

export function SeguimientoClient({ user, projects, selectedProject: initialSelectedProject }: SeguimientoClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [selectedProject, setSelectedProject] = useState<SeguimientoProject | null>(initialSelectedProject);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Update URL when project changes
  useEffect(() => {
    if (selectedProject) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('opportunityId', selectedProject.vacancy_id);
      router.push(`/dashboard/dependencia/seguimiento?${params.toString()}`, { scroll: false });
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('opportunityId');
      router.push(`/dashboard/dependencia/seguimiento`, { scroll: false });
    }
  }, [selectedProject, router, searchParams]);

  // Calculate KPIs for selected project
  const kpis = useMemo(() => {
    if (!selectedProject) return null;

    const milestones = selectedProject.milestones;
    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter(m => m.status === 'completed').length;
    const inProgressMilestones = milestones.filter(m => m.status === 'in_progress').length;
    const progressPercent = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

    // Calculate days elapsed
    const startDate = selectedProject.start_date ? new Date(selectedProject.start_date) : null;
    const daysElapsed = startDate ? Math.max(0, Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24))) : 0;

    // Calculate days remaining
    const targetEndDate = selectedProject.target_end_date ? new Date(selectedProject.target_end_date) : null;
    const daysRemaining = targetEndDate ? Math.ceil((targetEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
    const isOverdue = daysRemaining !== null && daysRemaining <= 0 && progressPercent < 100;

    // Total hours logged
    const totalHours = selectedProject.total_hours;

    // Satisfaction rating
    const satisfactionRating = selectedProject.evaluation?.satisfaction_rating;

    return {
      progressPercent,
      completedMilestones,
      totalMilestones,
      inProgressMilestones,
      daysElapsed,
      daysRemaining,
      isOverdue,
      totalHours,
      satisfactionRating,
    };
  }, [selectedProject]);

  const handleUpdateMilestone = async (milestoneId: string, status: 'pending' | 'in_progress' | 'completed') => {
    setIsLoading(true);
    try {
      // In a real implementation, this would call an API
      // For now, we'll do optimistic update
      setSelectedProject(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          milestones: prev.milestones.map(m => 
            m.id === milestoneId 
              ? { 
                  ...m, 
                  status,
                  started_date: status === 'in_progress' ? new Date().toISOString() : m.started_date,
                  completed_date: status === 'completed' ? new Date().toISOString() : m.completed_date,
                }
              : m
          )
        };
      });
      
      setToast({ message: `Hito marcado como ${status === 'completed' ? 'completado' : status === 'in_progress' ? 'en curso' : 'pendiente'}`, type: 'success' });
    } catch (error) {
      setToast({ message: 'Error al actualizar hito', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChat = () => {
    if (selectedProject) {
      router.push(`/dashboard/dependencia/mensajes?studentId=${selectedProject.candidate_id}&opportunityId=${selectedProject.vacancy_id}`);
    }
  };

  const handleViewProfile = () => {
    if (selectedProject) {
      router.push(`/dashboard/dependencia/candidatos/${selectedProject.vacancy_id}`);
    }
  };

  const handleGoToTracking = () => {
    if (selectedProject) {
      router.push(`/dashboard/dependencia/seguimiento?opportunityId=${selectedProject.vacancy_id}`);
    }
  };

  // Toast notification
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-b border-neutral-100 bg-white">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/dependencia"
            className="flex items-center gap-2 text-neutral-600 hover:text-primary transition-colors p-2 rounded-lg hover:bg-neutral-100"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium hidden sm:inline">Regresar al panel principal</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-primary" />
              Seguimiento del Proyecto
            </h1>
            <p className="text-neutral-500 text-sm">Supervisión y control del avance de automatizaciones</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="w-4 h-4" />
            Exportar reporte
          </Button>
        </div>
      </div>

      {/* Project Selector / Summary */}
      <div className="p-4 border-b border-neutral-100 bg-white">
        <ProjectSelector
          projects={projects}
          selectedProject={selectedProject}
          onSelect={setSelectedProject}
        />
        
        {selectedProject && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-neutral-500 mb-1">Título del proyecto</p>
              <p className="font-semibold text-neutral-900">{selectedProject.vacancy_title}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500 mb-1">Dependencia solicitante</p>
              <p className="font-semibold text-neutral-900">{selectedProject.department_name}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500 mb-1">Estudiante responsable</p>
              <p className="font-semibold text-neutral-900 flex items-center gap-2">
                {selectedProject.candidate_name}
                <Badge variant={selectedProject.match_score >= 90 ? 'success' : selectedProject.match_score >= 80 ? 'primary' : 'warning'} className="gap-1" dot>
                  <Star className="w-3 h-3" fill="currentColor" />
                  {selectedProject.match_score}% compatibilidad
                </Badge>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {projects.length === 0 ? (
          <EmptyState projectsCount={0} />
        ) : !selectedProject ? (
          <NoProjectSelected projectsCount={projects.length} />
        ) : (
          <>
            {/* KPI Cards Row */}
            {kpis && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  title="Días transcurridos"
                  value={kpis.daysElapsed}
                  subtitle="Desde el inicio del proyecto"
                  icon={<Clock className="w-6 h-6" />}
                  color="primary"
                />
                <KPICard
                  title="Horas registradas"
                  value={kpis.totalHours}
                  subtitle="Total acumulado por el estudiante"
                  icon={<TrendingUp className="w-6 h-6" />}
                  color="success"
                />
                <KPICard
                  title="Días restantes"
                  value={kpis.daysRemaining !== null ? kpis.daysRemaining : '—'}
                  subtitle={kpis.daysRemaining !== null ? 'Para la fecha objetivo' : 'Sin fecha objetivo'}
                  icon={<Target className="w-6 h-6" />}
                  color={kpis.isOverdue ? 'danger' : 'warning'}
                  alert={kpis.isOverdue}
                  trend={kpis.daysRemaining !== null && kpis.daysRemaining < 10 ? 'down' : 'neutral'}
                  trendValue={kpis.daysRemaining !== null && kpis.daysRemaining < 10 ? 'Poco tiempo' : undefined}
                />
                <KPICard
                  title="Calificación satisfacción"
                  value={kpis.satisfactionRating !== null && kpis.satisfactionRating !== undefined ? `${kpis.satisfactionRating.toFixed(1)} / 5.0` : 'Sin evaluar'}
                  subtitle="Promedio de satisfacción"
                  icon={<Star className="w-6 h-6 fill-current" />}
                  color="warning"
                />
              </div>
            )}

            {/* Main Grid: Timeline (70%) + Sidebar (30%) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Timeline - 70% */}
              <div className="lg:col-span-7 space-y-6">
                <Card variant="outlined" padding="none">
                  <CardHeader className="p-6 border-b border-neutral-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-primary" />
                          Línea de Tiempo de Hitos
                        </CardTitle>
                        <p className="text-sm text-neutral-500 mt-1">
                          {kpis?.inProgressMilestones || 0} en curso · {kpis?.completedMilestones || 0} completados · {kpis?.totalMilestones || 0} total
                        </p>
                      </div>
                      <Badge variant={kpis && kpis.progressPercent >= 100 ? 'success' : 'primary'} className="gap-1" dot>
                        {kpis && kpis.progressPercent >= 100 ? (
                          <> <CheckCircle className="w-3 h-3" /> Completado </> 
                        ) : (
                          <> <Clock className="w-3 h-3" /> En progreso </>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <MilestoneTimeline
                      milestones={selectedProject.milestones}
                      onUpdateMilestone={handleUpdateMilestone}
                      isLoading={isLoading}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar - 30% */}
              <div className="lg:col-span-5 space-y-6">
                {/* Progress Card */}
                {kpis && (
                  <ProgressCard
                    completedCount={kpis.completedMilestones}
                    totalCount={kpis.totalMilestones}
                    progressPercent={kpis.progressPercent}
                  />
                )}

                {/* Student Card */}
                <StudentCard
                  student={{
                    id: selectedProject.candidate_id,
                    name: selectedProject.candidate_name,
                    email: selectedProject.candidate_email,
                    avatar_url: selectedProject.candidate_avatar_url,
                    career: selectedProject.candidate_career,
                    availability_hours: selectedProject.candidate_availability_hours,
                    match_score: selectedProject.match_score,
                    is_online: true, // Would come from real-time data
                  }}
                  vacancyId={selectedProject.vacancy_id}
                  onOpenChat={handleOpenChat}
                  onViewProfile={handleViewProfile}
                  onGoToTracking={handleGoToTracking}
                />

                {/* Quick Actions */}
                <Card variant="outlined" padding="md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Briefcase className="w-4 h-4 text-primary" />
                      Acciones Rápidas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="primary" 
                      className="w-full justify-start gap-2"
                      onClick={handleOpenChat}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Abrir Chat del Proyecto
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="w-full justify-start gap-2"
                      onClick={handleViewProfile}
                    >
                      <User className="w-4 h-4" />
                      Ver Perfil Completo del Estudiante
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2"
                      onClick={handleGoToTracking}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ver Seguimiento Detallado
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up lg:bottom-6 lg:right-6">
          <Card variant="elevated" padding="md" className="shadow-lg">
            <div className="flex items-center gap-3">
              {toast.type === 'success' ? (
                <span className="text-success">✓</span>
              ) : (
                <span className="text-danger">✕</span>
              )}
              <span className="font-medium">{toast.message}</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}