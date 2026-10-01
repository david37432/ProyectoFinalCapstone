'use client';

import { useState } from 'react';
import { Search, Filter, Bookmark, X, ExternalLink, Loader2 } from 'lucide-react';

interface Vacancy {
  id: string
  title: string
  department: string
  department_id: string
  modality: string
  contract_type: string
  pat_hours_per_week: number
  location: string
  match_score: number
  required_skills: string[]
  description: string
  status: string
  publication_date: string
  candidates_count: number
  is_applied: boolean
}

interface ExplorarContentProps {
  initialVacancies: Vacancy[]
  userId: string
}

const filterOptions = [
  { id: 'all', label: 'Todas' },
  { id: 'high-match', label: 'Alta coincidencia (>80%)' },
  { id: 'new', label: 'Nuevas' },
  { id: 'saved', label: 'Guardadas' },
];

export default function ExplorarContent({ initialVacancies, userId }: ExplorarContentProps) {
  const [vacancies, setVacancies] = useState<Vacancy[]>(initialVacancies);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [interestedIds, setInterestedIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const filteredVacancies = vacancies
    .filter(v => !dismissedIds.has(v.id))
    .filter(v => {
      if (activeFilter === 'high-match') return v.match_score >= 80;
      if (activeFilter === 'new') return new Date(v.publication_date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (activeFilter === 'saved') return savedIds.has(v.id);
      return true;
    })
    .filter(v =>
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.required_skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const getMatchColor = (match: number) => {
    if (match >= 85) return 'bg-success text-white';
    if (match >= 70) return 'bg-info text-white';
    if (match >= 55) return 'bg-warning text-neutral-900';
    return 'bg-neutral-200 text-neutral-700';
  };

  const getTypeLabel = (contractType: string, modality: string) => {
    const typeMap: Record<string, string> = {
      'fijo': 'Tiempo completo',
      'temporal': 'Temporal',
      'pasantia': 'Pasantía',
      'prestacion_servicios': 'Prestación de servicios',
    };
    return typeMap[contractType] || contractType;
  };

  const toggleSaved = (id: string) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleInterested = async (id: string) => {
    const currentlyInterested = interestedIds.has(id);
    if (currentlyInterested) {
      setInterestedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      // TODO: Remove application via API
    } else {
      setInterestedIds(prev => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      // TODO: Create application via API
    }
  };

  const dismiss = (id: string) => {
    setDismissedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 bg-neutral-200 rounded w-48 animate-pulse" />
          <div className="h-4 bg-neutral-200 rounded w-96 animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-12 bg-neutral-200 rounded animate-pulse" />
          <div className="h-12 bg-neutral-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4 animate-pulse">
              <div className="h-6 bg-neutral-200 rounded w-24" />
              <div className="h-4 bg-neutral-200 rounded w-3/4" />
              <div className="h-5 bg-neutral-200 rounded w-full" />
              <div className="h-4 bg-neutral-200 rounded w-1/2" />
              <div className="h-16 bg-neutral-200 rounded" />
              <div className="h-4 bg-neutral-200 rounded w-3/4" />
              <div className="flex gap-2">
                <div className="h-2 bg-neutral-200 rounded w-20" />
                <div className="h-2 bg-neutral-200 rounded w-24" />
                <div className="h-2 bg-neutral-200 rounded w-20" />
              </div>
              <div className="flex gap-2">
                <div className="h-8 bg-neutral-200 rounded flex-1" />
                <div className="h-8 bg-neutral-200 rounded w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-neutral-900">Oportunidades</h1>
        <p className="text-neutral-600">
          Explora proyectos recomendados según tu perfil, habilidades e intereses.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por palabra clave, área, tecnología..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {filterOptions.map((filter) => {
            let count = 0;
            if (filter.id === 'all') count = vacancies.length;
            else if (filter.id === 'high-match') count = vacancies.filter(v => v.match_score >= 80).length;
            else if (filter.id === 'new') count = vacancies.filter(v => new Date(v.publication_date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;
            else if (filter.id === 'saved') count = vacancies.filter(v => savedIds.has(v.id)).length;

            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeFilter === filter.id
                    ? 'bg-primary text-white'
                    : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                }`}
              >
                {filter.label}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeFilter === filter.id ? 'bg-white/30' : 'bg-neutral-100 text-neutral-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Opportunities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVacancies.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <Search className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No hay oportunidades disponibles</h3>
            {activeFilter !== 'all' ? (
              <p className="text-neutral-500">Intenta ajustar tus filtros o términos de búsqueda</p>
            ) : (
              <p className="text-neutral-500">No hay oportunidades disponibles en este momento. Revisa más tarde.</p>
            )}
          </div>
        ) : (
          filteredVacancies.map((vacancy) => (
            <article
              key={vacancy.id}
              className="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-5 space-y-4">
                {/* Header with match badge and dismiss */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getMatchColor(vacancy.match_score)}`}>
                      {vacancy.match_score}% Match
                    </span>
                  </div>
                  <button
                    onClick={() => dismiss(vacancy.id)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 flex-shrink-0"
                    aria-label="Descartar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {formatDate(vacancy.publication_date)}
                  </span>
                  <span className="px-2 py-0.5 bg-neutral-100 rounded text-neutral-700">{vacancy.department}</span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-neutral-900 line-clamp-2">{vacancy.title}</h3>

                {/* Details */}
                <div className="flex items-center gap-3 text-sm text-neutral-600">
                  <span className="flex items-center gap-1">
                    <ExternalLink className="w-3.5 h-3.5" />
                    {vacancy.pat_hours_per_week} horas/semana
                  </span>
                  <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                    {getTypeLabel(vacancy.contract_type, vacancy.modality)}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-neutral-600 line-clamp-3">{vacancy.description}</p>

                {/* Benefits */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-1 bg-success/10 text-success text-xs rounded-full">
                    Reconocimiento de Horas PAT
                  </span>
                  <span className="px-2 py-1 bg-info/10 text-info text-xs rounded-full">
                    Certificado de experiencia
                  </span>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5">
                  {vacancy.required_skills.map((skill, i) => (
                    <span key={i} className="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs rounded-full border border-neutral-200">
                      {skill}
                    </span>
                  ))}
                  {vacancy.required_skills.length === 0 && (
                    <span className="px-2 py-1 bg-neutral-100 text-neutral-500 text-xs rounded-full border border-neutral-200">
                      Habilidades por definir
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
                  <button
                    onClick={() => toggleInterested(vacancy.id)}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                      interestedIds.has(vacancy.id) || vacancy.is_applied
                        ? 'bg-primary text-white'
                        : 'bg-primary text-white hover:bg-primary-dark'
                    }`}
                    disabled={vacancy.is_applied}
                  >
                    {interestedIds.has(vacancy.id) || vacancy.is_applied ? 'Interesado' : 'Me interesa'}
                  </button>
                  <button
                    onClick={() => toggleSaved(vacancy.id)}
                    className={`p-2.5 rounded-lg transition-colors ${
                      savedIds.has(vacancy.id)
                        ? 'bg-primary text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                    aria-label={savedIds.has(vacancy.id) ? 'Quitar de guardados' : 'Guardar'}
                  >
                    <Bookmark className={`w-5 h-5 ${savedIds.has(vacancy.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {filteredVacancies.length > 0 && (
        <div className="text-center pt-4">
          <button className="px-6 py-3 text-base font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors">
            Cargar más oportunidades
          </button>
        </div>
      )}
    </div>
  );
}