'use client';

import { useState } from 'react';
import { Briefcase, Clock, CheckCircle, XCircle, MessageSquare, ExternalLink, Loader2 } from 'lucide-react';

interface Application {
  id: string
  vacancy_id: string
  title: string
  department: string
  status: string
  applied_at: string
  match_score: number
  pat_hours_per_week: number
  interview_date?: string
  start_date?: string
  department_id: string
}

interface MisAppsContentProps {
  initialApplications: Application[]
}

const statusConfig: Record<string, { color: string; icon: typeof Clock }> = {
  'recibida': { color: 'bg-warning text-neutral-900', icon: Clock },
  'en_revision': { color: 'bg-warning text-neutral-900', icon: Clock },
  'entrevista': { color: 'bg-info text-white', icon: MessageSquare },
  'prueba': { color: 'bg-info text-white', icon: MessageSquare },
  'aceptada': { color: 'bg-success text-white', icon: CheckCircle },
  'rechazada': { color: 'bg-danger text-white', icon: XCircle },
};

const statusLabels: Record<string, string> = {
  'recibida': 'Recibida',
  'en_revision': 'En revisión',
  'entrevista': 'Entrevista',
  'prueba': 'Prueba',
  'aceptada': 'Aceptada',
  'rechazada': 'Rechazada',
};

export default function MisAppsContent({ initialApplications }: MisAppsContentProps) {
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [loading, setLoading] = useState(false);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 bg-neutral-200 rounded w-48 animate-pulse" />
          <div className="h-4 bg-neutral-200 rounded w-96 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4 animate-pulse">
              <div className="h-6 bg-neutral-200 rounded w-24" />
              <div className="h-7 bg-neutral-200 rounded w-3/4" />
              <div className="h-4 bg-neutral-200 rounded w-1/2" />
              <div className="h-4 bg-neutral-200 rounded w-1/3" />
              <div className="h-10 bg-neutral-200 rounded" />
              <div className="h-8 bg-neutral-200 rounded" />
              <div className="flex gap-2">
                <div className="h-8 bg-neutral-200 rounded flex-1" />
                <div className="h-8 bg-neutral-200 rounded flex-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const renderEmptyState = () => (
    <div className="col-span-full text-center py-16">
      <Briefcase className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-neutral-900 mb-2">Aún no te has postulado a ningún proyecto</h3>
      <p className="text-neutral-500 mb-6">Explora las oportunidades disponibles y postúlate a las que más te interesen</p>
      <a href="/dashboard/estudiante/explorar" className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors">
        Ir a Explorar
      </a>
    </div>
  );

  const renderApplications = () => (
    <>
      {applications.map((app) => {
        const config = statusConfig[app.status] || { color: 'bg-neutral-200 text-neutral-700', icon: Clock };
        const Icon = config.icon;
        return (
          <article key={app.id} className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="w-3 h-3 mr-1" />
                {statusLabels[app.status] || app.status}
              </span>
              <span className="text-sm text-neutral-500">Match: {app.match_score}%</span>
            </div>

            <h3 className="text-lg font-semibold text-neutral-900 line-clamp-2">{app.title}</h3>
            <p className="text-sm text-neutral-500">{app.department}</p>

            <div className="flex items-center gap-3 text-sm text-neutral-600">
              <span className="flex items-center gap-1">
                <ExternalLink className="w-3.5 h-3.5" />
                {app.pat_hours_per_week} horas/semana
              </span>
            </div>

            <div className="space-y-2 pt-2 border-t border-neutral-100">
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <span>Postulado: </span>
                <span className="font-medium text-neutral-700">{new Date(app.applied_at).toLocaleDateString('es-ES')}</span>
              </div>
              {app.interview_date && (
                <div className="flex items-center gap-2 text-sm text-info">
                  <MessageSquare className="w-4 h-4" />
                  <span>Entrevista: {new Date(app.interview_date).toLocaleString('es-ES')}</span>
                </div>
              )}
              {app.start_date && (
                <div className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle className="w-4 h-4" />
                  <span>Inicio: {new Date(app.start_date).toLocaleDateString('es-ES')}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button className="flex-1 py-2 px-4 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
                Ver detalles
              </button>
              <button className="flex-1 py-2 px-4 text-sm font-medium text-neutral-700 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors">
                Retirar
              </button>
            </div>
          </article>
        );
      })}
    </>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Mis Aplicaciones</h1>
        <p className="text-neutral-600">Gestiona y da seguimiento a tus postulaciones activas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {applications.length === 0 ? renderEmptyState() : renderApplications()}
      </div>
    </div>
  );
}