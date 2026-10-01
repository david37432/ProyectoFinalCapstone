'use client';

import { cn } from '@/lib/utils';
import { Briefcase, Users, CheckCircle, Clock } from 'lucide-react';

interface AdminMetricsCardsProps {
  metrics: {
    activeVacancies: number;
    candidatesReviewed: number;
    confirmedMatches: number;
    projectsInProgress: number;
  };
}

const metricCards = [
  {
    label: 'Necesidades activas',
    value: 'activeVacancies',
    icon: Briefcase,
    color: 'bg-primary/10 text-primary',
    description: 'Publicadas y recibiendo postulaciones',
  },
  {
    label: 'Candidatos revisados',
    value: 'candidatesReviewed',
    icon: Users,
    color: 'bg-warning/10 text-warning',
    description: 'En proceso de evaluación',
  },
  {
    label: 'Matches confirmados',
    value: 'confirmedMatches',
    icon: CheckCircle,
    color: 'bg-success/10 text-success',
    description: 'Estudiantes aceptados',
  },
  {
    label: 'Proyectos en curso',
    value: 'projectsInProgress',
    icon: Clock,
    color: 'bg-purple-100 text-purple-700',
    description: 'Entrevistas y pruebas activas',
  },
] as const;

export function AdminMetricsCards({ metrics }: AdminMetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metricCards.map((metric) => (
        <div
          key={metric.value}
          className="bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-neutral-500 mb-1">{metric.label}</p>
              <p className="text-3xl font-bold text-neutral-900">
                {metrics[metric.value as keyof typeof metrics]}
              </p>
              <p className="text-xs text-neutral-500 mt-1">{metric.description}</p>
            </div>
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', metric.color)}>
              <metric.icon className="w-6 h-6" aria-hidden="true" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}