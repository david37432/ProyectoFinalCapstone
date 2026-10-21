'use client';

import { useState } from 'react';
import { CheckCircle, Clock, Circle, AlertCircle, ChevronDown, ChevronUp, MoreHorizontal, Play, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import type { ProjectMilestone } from '@/lib/supabase/admin-queries';

interface MilestoneTimelineProps {
  milestones: ProjectMilestone[];
  onUpdateMilestone: (milestoneId: string, status: 'pending' | 'in_progress' | 'completed') => void;
  isLoading?: boolean;
}

const DEFAULT_MILESTONES = [
  { title: 'Inicio del proyecto', description: 'Configuración e inducción del estudiante en el proyecto', order: 1 },
  { title: 'Análisis del proceso actual', description: 'Levantamiento de requerimientos y mapa de proceso', order: 2 },
  { title: 'Desarrollo de la solución', description: 'Construcción del script, bot o flujo automatizado', order: 3 },
  { title: 'Pruebas y ajustes', description: 'Validación de datos y pruebas de usuario', order: 4 },
  { title: 'Entrega y capacitación', description: 'Despliegue y entrenamiento al personal de la dependencia', order: 5 },
  { title: 'Cierre y evaluación final', description: 'Medición de impacto y calificación', order: 6 },
];

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Sin fecha';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  });
}

function formatShortDate(dateString: string | null): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function MilestoneTimeline({ milestones, onUpdateMilestone, isLoading }: MilestoneTimelineProps) {
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);

  // Merge with default milestones if empty
  const displayMilestones = milestones.length > 0 
    ? milestones.sort((a, b) => a.order_index - b.order_index)
    : DEFAULT_MILESTONES.map((m, i) => ({
        id: `default-${i}`,
        application_id: '',
        title: m.title,
        description: m.description,
        order_index: m.order,
        status: i === 0 ? 'in_progress' as const : 'pending' as const,
        planned_date: null,
        completed_date: null,
        started_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

  return (
    <div className="space-y-0">
      {displayMilestones.map((milestone, index) => {
        const isCompleted = milestone.status === 'completed';
        const isInProgress = milestone.status === 'in_progress';
        const isPending = milestone.status === 'pending';
        const isLast = index === displayMilestones.length - 1;
        const isExpanded = expandedMilestone === milestone.id;
        const showConnector = !isLast;

        return (
          <div key={milestone.id} className="relative flex gap-4">
            {/* Timeline connector line */}
            <div className="absolute left-6 top-12 bottom-0 w-0.5" style={{ 
              display: showConnector ? 'block' : 'none' 
            }}>
              <div className={cn(
                'h-full',
                isCompleted ? 'bg-success' : 
                isInProgress ? 'bg-primary' : 
                'bg-neutral-200'
              )} style={{ 
                background: isCompleted ? 'linear-gradient(to bottom, #10b981 50%, #d1d5db 50%)' :
                isInProgress ? 'linear-gradient(to bottom, #3b82f6 50%, #d1d5db 50%)' :
                'repeating-linear-gradient(to bottom, #d1d5db, #d1d5db 8px, transparent 8px, transparent 16px)'
              }} />
            </div>

            {/* Milestone content */}
            <div className="flex-1 ml-14 relative">
              {/* Milestone indicator */}
              <div className={cn(
                'absolute -left-14 w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 z-10',
                isCompleted && 'bg-success border-success text-white',
                isInProgress && 'bg-primary border-primary text-white animate-pulse',
                isPending && 'bg-white border-neutral-300 text-neutral-400'
              )}>
                {isCompleted && <CheckCircle className="w-6 h-6" />}
                {isInProgress && <Clock className="w-6 h-6" />}
                {isPending && <Circle className="w-6 h-6" />}
              </div>

              {/* Milestone card */}
              <Card variant="outlined" padding="md" className={cn(
                'transition-all duration-200',
                isCompleted && 'border-success/30 bg-success/5',
                isInProgress && 'border-primary/30 bg-primary/5 ring-2 ring-primary/20',
                isPending && 'border-neutral-200'
              )}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm text-neutral-500">
                        {String(milestone.order_index).padStart(2, '0')}
                      </span>
                      <h3 className={cn(
                        'font-semibold text-lg',
                        isCompleted ? 'text-neutral-900' : 
                        isInProgress ? 'text-primary' : 
                        'text-neutral-700'
                      )}>
                        {milestone.title}
                      </h3>
                      <Badge 
                        variant={isCompleted ? 'success' : isInProgress ? 'primary' : 'outline'} 
                        className="text-xs gap-1"
                        dot
                      >
                        {isCompleted && <CheckCircle className="w-3 h-3" />}
                        {isInProgress && <Clock className="w-3 h-3" />}
                        {isPending && <Circle className="w-3 h-3" />}
                        {isCompleted ? 'Completado' : isInProgress ? 'En curso' : 'Pendiente'}
                      </Badge>
                    </div>

                    {milestone.description && (
                      <p className="text-sm text-neutral-600 mb-3 ml-7">{milestone.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 ml-7">
                      {milestone.planned_date && (
                        <span className="flex items-center gap-1">
                          <span className="font-medium text-neutral-700">Previsto:</span>
                          {formatShortDate(milestone.planned_date)}
                        </span>
                      )}
                      {milestone.started_date && (
                        <span className="flex items-center gap-1">
                          <span className="font-medium text-neutral-700">Iniciado:</span>
                          {formatShortDate(milestone.started_date)}
                        </span>
                      )}
                      {milestone.completed_date && (
                        <span className="flex items-center gap-1 text-success">
                          <CheckCircle className="w-3 h-3" />
                          Completado: {formatShortDate(milestone.completed_date)}
                        </span>
                      )}
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-neutral-100 ml-7 space-y-2 animate-slide-down">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-neutral-500 w-20">Creado:</span>
                          {formatDate(milestone.created_at)}
                        </div>
                        {milestone.updated_at !== milestone.created_at && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-500 w-20">Actualizado:</span>
                            {formatDate(milestone.updated_at)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedMilestone(isExpanded ? null : milestone.id)}
                      className="p-2"
                      aria-label={isExpanded ? 'Colapsar' : 'Expandir'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>

                    {milestone.id && !milestone.id.startsWith('default-') && (
                      <>
                        {!isCompleted && !isInProgress && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onUpdateMilestone(milestone.id, 'in_progress')}
                            disabled={isLoading}
                            className="gap-1.5"
                          >
                            <Play className="w-3.5 h-3.5" />
                            Iniciar
                          </Button>
                        )}
                        {isInProgress && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => onUpdateMilestone(milestone.id, 'completed')}
                            disabled={isLoading}
                            className="gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Completar
                          </Button>
                        )}
                        {isCompleted && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onUpdateMilestone(milestone.id, 'pending')}
                            disabled={isLoading}
                            className="gap-1.5 text-neutral-600 hover:text-neutral-900"
                          >
                            <ChevronUp className="w-3.5 h-3.5 rotate-180" />
                            Reabrir
                          </Button>
                        )}
                        {isPending && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onUpdateMilestone(milestone.id, 'in_progress')}
                            disabled={isLoading}
                            className="gap-1.5"
                          >
                            <Play className="w-3.5 h-3.5" />
                            Iniciar
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        );
      })}
    </div>
  );
}