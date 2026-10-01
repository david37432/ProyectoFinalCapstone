'use client';

import { useState, useMemo, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { StudentBottomNavigation } from '@/components/layout/StudentBottomNavigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { cn, getMatchScoreColor, getMatchScoreLabel, getMatchScoreBgColor, formatRelativeTime } from '@/lib/utils';
import { Bell, Filter, Bookmark, Heart, X, Search } from 'lucide-react';
import type { StudentVacancy } from '@/lib/supabase/student-queries';

interface ExplorarClientProps {
  user: {
    full_name: string
    email: string
    role: string
  }
  initialVacancies: StudentVacancy[]
}

export function ExplorarClient({ user, initialVacancies }: ExplorarClientProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'high' | 'new' | 'saved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // eslint-disable-next-line react-hooks/purity
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const filteredVacancies = useMemo(() => {
    let result = initialVacancies.filter((v) => !dismissedIds.has(v.id));

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (v) =>
          v.title.toLowerCase().includes(query) ||
          v.department.toLowerCase().includes(query) ||
          v.required_skills.some((s) => s.toLowerCase().includes(query))
      );
    }

    switch (activeFilter) {
      case 'high':
        result = result.filter((v) => v.match_score >= 80).sort((a, b) => b.match_score - a.match_score);
        break;
      case 'new':
        result = result.sort((a, b) => new Date(b.publication_date).getTime() - new Date(a.publication_date).getTime());
        break;
      case 'saved':
        result = result.filter((v) => savedIds.has(v.id));
        break;
      default:
        result = result.sort((a, b) => b.match_score - a.match_score);
    }

    return result;
  }, [initialVacancies, searchQuery, activeFilter, savedIds, dismissedIds]);

  const toggleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const dismissCard = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  };

  const modalityLabels: Record<string, string> = {
    presencial: 'Presencial',
    remoto: 'Remoto',
    hibrido: 'Híbrido',
  };

  const modalityColors: Record<string, string> = {
    presencial: 'bg-blue-100 text-blue-700',
    remoto: 'bg-green-100 text-green-700',
    hibrido: 'bg-purple-100 text-purple-700',
  };

  const contractLabels: Record<string, string> = {
    fijo: 'Fijo',
    temporal: 'Temporal',
    pasantia: 'Pasantía',
    prestacion_servicios: 'Prest. Servicios',
  };

  const nuevasCount = initialVacancies.filter((v) => new Date(v.publication_date).getTime() > sevenDaysAgo).length;

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col pb-20 md:pb-0">
      <Header user={user} onSignOut={() => {}} />

      <main className="flex-1 pt-20 pb-24 md:pb-12 px-4">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">¡Hola, {user.full_name.split(' ')[0]}!</h1>
              <p className="text-neutral-600 text-sm mt-0.5">Explora oportunidades que matchen con tu perfil</p>
            </div>
            <div className="relative">
              <Button variant="ghost" size="sm" aria-label="Notificaciones">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">3</span>
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" aria-hidden="true" />
              <input
                type="search"
                placeholder="Buscar por proyecto, área, tecnologías..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-xl bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-success focus:border-transparent text-base"
                aria-label="Buscar oportunidades"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Filtros rápidos">
              {[
                { id: 'all', label: 'Todas', count: initialVacancies.length },
                { id: 'high', label: 'Alta coincidencia', count: initialVacancies.filter((v) => v.match_score >= 80).length },
                { id: 'new', label: 'Nuevas', count: initialVacancies.filter((v) => new Date(v.publication_date).getTime() > sevenDaysAgo).length },
                { id: 'saved', label: 'Guardadas', count: savedIds.size },
              ].map((filter) => (
                <button
                  key={filter.id}
                  role="tab"
                  aria-selected={activeFilter === filter.id}
                  onClick={() => setActiveFilter(filter.id as typeof activeFilter)}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200',
                    activeFilter === filter.id
                      ? 'bg-success text-white shadow-sm shadow-success/20'
                      : 'bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200'
                  )}
                >
                  {filter.label}
                  <span className={cn('text-xs px-2 py-0.5 rounded-full', activeFilter === filter.id ? 'bg-white/30' : 'bg-neutral-100 text-neutral-600')}>
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {showFilters && (
            <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-4 animate-fade-in" role="region" aria-label="Filtros avanzados">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Modalidad"
                  options={[
                    { value: '', label: 'Todas' },
                    { value: 'presencial', label: 'Presencial' },
                    { value: 'remoto', label: 'Remoto' },
                    { value: 'hibrido', label: 'Híbrido' },
                  ]}
                  placeholder="Todas"
                  value=""
                  onChange={() => {}}
                />
                <Select
                  label="Tipo de contrato"
                  options={[
                    { value: '', label: 'Todos' },
                    { value: 'pasantia', label: 'Pasantía' },
                    { value: 'prestacion_servicios', label: 'Prestación de servicios' },
                    { value: 'temporal', label: 'Temporal' },
                    { value: 'fijo', label: 'Fijo' },
                  ]}
                  placeholder="Todos"
                  value=""
                  onChange={() => {}}
                />
                <Input
                  label="Horas PAT/semana (mín)"
                  type="number"
                  placeholder="Mínimo"
                  value=""
                  onChange={() => {}}
                />
                <Input
                  label="Ubicación"
                  type="text"
                  placeholder="Ciudad o remoto"
                  value=""
                  onChange={() => {}}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                <Button variant="secondary" size="sm">Limpiar</Button>
                <Button variant="success" size="sm">Aplicar</Button>
              </div>
            </div>
          )}

          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)} 
            className="w-full sm:w-auto"
            size="sm"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros avanzados
          </Button>

          <div className="space-y-4" role="feed" aria-label="Lista de oportunidades">
            {filteredVacancies.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-neutral-200">
                <svg className="w-16 h-16 mx-auto text-neutral-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-neutral-900 mb-1">No se encontraron oportunidades</h3>
                <p className="text-neutral-500 text-sm mb-4">Intenta ajustar tus filtros o términos de búsqueda</p>
                <Button variant="outline" onClick={() => { setActiveFilter('all'); setSearchQuery(''); }}>Ver todas</Button>
              </div>
            ) : (
              filteredVacancies.map((vacancy) => (
                <OpportunityCard
                  key={vacancy.id}
                  vacancy={vacancy}
                  isSaved={savedIds.has(vacancy.id)}
                  onSave={() => toggleSave(vacancy.id)}
                  onInterested={() => {}}
                  onDismiss={() => dismissCard(vacancy.id)}
                />
              ))
            )}
          </div>
        </div>
      </main>

      <StudentBottomNavigation unreadNotifications={3} unreadMessages={1} />
    </div>
  );
}

function OpportunityCard({
  vacancy,
  isSaved,
  onSave,
  onInterested,
  onDismiss,
}: {
  vacancy: StudentVacancy;
  isSaved: boolean;
  onSave: () => void;
  onInterested: () => void;
  onDismiss: () => void;
}) {
  const modalityLabels: Record<string, string> = {
    presencial: 'Presencial',
    remoto: 'Remoto',
    hibrido: 'Híbrido',
  };

  const modalityColors: Record<string, string> = {
    presencial: 'bg-blue-100 text-blue-700',
    remoto: 'bg-green-100 text-green-700',
    hibrido: 'bg-purple-100 text-purple-700',
  };

  const contractLabels: Record<string, string> = {
    fijo: 'Fijo',
    temporal: 'Temporal',
    pasantia: 'Pasantía',
    prestacion_servicios: 'Prest. Servicios',
  };

  return (
    <Card variant="outlined" padding="none" className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold text-lg">CM</span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-neutral-900 text-base mb-0.5 truncate">{vacancy.title}</h3>
              <p className="text-neutral-600 text-sm">{vacancy.department}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSave}
              aria-label={isSaved ? 'Quitar de guardados' : 'Guardar oportunidad'}
              className={cn('p-2', isSaved ? 'text-warning' : 'text-neutral-400 hover:text-warning')}
            >
              <Bookmark className={cn('w-5 h-5', isSaved && 'fill-current')} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              aria-label="Descartar oportunidad"
              className="p-2 text-neutral-400 hover:text-danger"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge variant={modalityColors[vacancy.modality] as 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline'} size="sm">
            {modalityLabels[vacancy.modality] || vacancy.modality}
          </Badge>
          <Badge variant="outline" size="sm">
            {contractLabels[vacancy.contract_type] || vacancy.contract_type}
          </Badge>
          <Badge variant="outline" size="sm">
            {vacancy.pat_hours_per_week} hrs PAT/sem
          </Badge>
        </div>

        <p className="text-neutral-600 text-sm mb-3 line-clamp-2">{vacancy.description}</p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {vacancy.required_skills.map((skill) => (
            <Badge key={skill} variant="outline" size="sm" className="bg-neutral-50 border-neutral-200 text-neutral-700">
              {skill}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
          <div className={cn('flex items-center gap-2 px-3 py-2 rounded-full', getMatchScoreBgColor(vacancy.match_score))}>
            <Heart className="w-4 h-4" fill="currentColor" aria-hidden="true" />
            <span className="font-bold text-sm">{vacancy.match_score}% Match</span>
            <span className="text-xs opacity-80">{getMatchScoreLabel(vacancy.match_score)}</span>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onInterested} className="flex-1 sm:flex-none">
              Me interesa
            </Button>
            <Button variant="success" size="sm" onClick={onInterested} className="flex-1 sm:flex-none">
              Postularme
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}