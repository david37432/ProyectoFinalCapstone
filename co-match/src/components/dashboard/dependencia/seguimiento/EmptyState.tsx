'use client';

import { Briefcase, Users, Link } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  projectsCount: number;
}

export function EmptyState({ projectsCount }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="w-24 h-24 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-6">
        <Briefcase className="w-12 h-12 text-neutral-400" />
      </div>
      <h3 className="text-xl font-medium text-neutral-900 mb-2">
        No tienes proyectos en curso actualmente
      </h3>
      <p className="text-neutral-500 max-w-md mx-auto mb-6">
        Asigna una necesidad a un candidato para iniciar el seguimiento del proyecto de automatización.
      </p>
      <Link href="/dashboard/dependencia/candidatos" className="text-primary hover:underline font-medium">
        Ir a Candidatos Recomendados
      </Link>
    </div>
  );
}

interface NoProjectSelectedProps {
  projectsCount: number;
}

export function NoProjectSelected({ projectsCount }: NoProjectSelectedProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="w-24 h-24 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-6">
        <Users className="w-12 h-12 text-neutral-400" />
      </div>
      <h3 className="text-xl font-medium text-neutral-900 mb-2">
        Selecciona un proyecto para ver su seguimiento
      </h3>
      <p className="text-neutral-500 max-w-md mx-auto">
        Usa el selector superior para elegir uno de tus {projectsCount} proyecto{projectsCount !== 1 ? 's' : ''} en curso.
      </p>
    </div>
  );
}