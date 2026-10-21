'use client';

import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Users, Filter, Download, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CandidateCard } from './CandidateCard';
import { CandidateProfileModal } from './CandidateProfileModal';
import { FilterTabs } from './FilterTabs';
import { VacancySelector } from './VacancySelector';
import { cn } from '@/lib/utils';
import type { CandidateDetail, VacancySummary } from '@/lib/supabase/admin-queries';

interface CandidatesClientProps {
  user: {
    full_name: string;
    email: string;
    role: string;
    department_name: string;
  };
  initialVacancies: VacancySummary[];
  initialCandidates: CandidateDetail[];
  initialSelectedVacancyId: string | null;
  vacancyTitle: string;
}

type FilterType = 'all' | 'high' | 'medium' | 'contacted';

export function CandidatesClient({ 
  user, 
  initialVacancies, 
  initialCandidates, 
  initialSelectedVacancyId,
  vacancyTitle 
}: CandidatesClientProps) {
  const [vacancies] = useState<VacancySummary[]>(initialVacancies);
  const [candidates, setCandidates] = useState<CandidateDetail[]>(initialCandidates);
  const [selectedVacancyId, setSelectedVacancyId] = useState<string | null>(initialSelectedVacancyId);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Filter candidates based on active filter
  const filteredCandidates = useMemo(() => {
    return candidates.filter(candidate => {
      switch (activeFilter) {
        case 'high':
          return candidate.match_score >= 90;
        case 'medium':
          return candidate.match_score >= 80 && candidate.match_score < 90;
        case 'contacted':
          return candidate.dependency_status === 'contacted';
        case 'all':
        default:
          return true;
      }
    });
  }, [candidates, activeFilter]);

  // Calculate filter counts
  const filterCounts = useMemo(() => ({
    all: candidates.length,
    high: candidates.filter(c => c.match_score >= 90).length,
    medium: candidates.filter(c => c.match_score >= 80 && c.match_score < 90).length,
    contacted: candidates.filter(c => c.dependency_status === 'contacted').length,
  }), [candidates]);

  // Handle contact action
  const handleContact = async (candidate: CandidateDetail) => {
    if (candidate.dependency_status === 'contacted') return;
    
    setIsLoading(true);
    try {
      // Update via server action or API
      const response = await fetch(`/api/dependencia/applications/${candidate.application_id}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) throw new Error('Error al contactar');
      
      // Optimistic update
      setCandidates(prev => prev.map(c => 
        c.application_id === candidate.application_id 
          ? { ...c, dependency_status: 'contacted' }
          : c
      ));
      
      setToast({ message: 'Candidato marcado como contactado', type: 'success' });
      
      // Optionally redirect to messages
      // router.push(`/dashboard/dependencia/mensajes?studentId=${candidate.id}`);
    } catch (error) {
      setToast({ message: 'Error al marcar como contactado', type: 'error' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleViewProfile = (candidate: CandidateDetail) => {
    setSelectedCandidate({ ...candidate, vacancy_title: vacancyTitle });
  };

  // Toast notification
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <div className="space-y-6">
      {/* Header with back button and title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/dependencia"
            className="flex items-center gap-2 text-neutral-600 hover:text-primary transition-colors p-2 rounded-lg hover:bg-neutral-100"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Regresar al panel principal</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Candidatos Recomendados</h1>
            <p className="text-neutral-500 text-sm">Gestiona y revisa los candidatos para tus necesidades</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Vacancy Selector / Summary Card */}
      <Card variant="outlined" padding="md">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Necesidad Seleccionada
              </CardTitle>
              <CardDescription>
                Selecciona una necesidad publicada para ver sus candidatos recomendados
              </CardDescription>
            </div>
            <VacancySelector
              vacancies={vacancies}
              selectedVacancyId={selectedVacancyId}
              onSelect={setSelectedVacancyId}
            />
          </div>
        </CardHeader>
        
        {selectedVacancyId && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-neutral-500">Título de la necesidad</p>
                <p className="font-semibold text-neutral-900">{vacancyTitle}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Área solicitante</p>
                <p className="font-semibold text-neutral-900">
                  {vacancies.find(v => v.id === selectedVacancyId)?.department_name || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Total candidatos</p>
                <p className="font-semibold text-neutral-900 text-primary text-xl">
                  {vacancies.find(v => v.id === selectedVacancyId)?.candidates_count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Filter Tabs */}
      {selectedVacancyId && candidates.length > 0 && (
        <FilterTabs
          activeFilter={activeFilter}
          onFilterChange={(value: string) => setActiveFilter(value as FilterType)}
          counts={filterCounts}
        />
      )}

      {/* Candidates Grid */}
      {selectedVacancyId ? (
        filteredCandidates.length > 0 ? (
          <div className="space-y-4">
            {filteredCandidates.map((candidate, index) => (
              <CandidateCard
                key={candidate.application_id}
                candidate={candidate}
                isTopMatch={index === 0 && activeFilter === 'all'}
                onViewProfile={() => handleViewProfile(candidate)}
                onContact={() => handleContact(candidate)}
              />
            ))}
          </div>
        ) : (
          <Card variant="outlined" padding="lg" className="text-center py-12">
            <Filter className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-1">
              No se encontraron candidatos
            </h3>
            <p className="text-neutral-500">
              No se encontraron candidatos para el filtro seleccionado.
            </p>
          </Card>
        )
      ) : (
        <Card variant="outlined" padding="lg" className="text-center py-12">
          <Users className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-1">
            Selecciona una necesidad
          </h3>
          <p className="text-neutral-500 mb-4">
            Elige una necesidad publicada en el selector superior para ver los candidatos recomendados.
          </p>
          {vacancies.length === 0 && (
            <Link href="/dashboard/dependencia/publicar" className="text-primary hover:underline font-medium">
              Publicar tu primera necesidad
            </Link>
          )}
        </Card>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
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

      {/* Candidate Profile Modal */}
      <CandidateProfileModal
        candidate={selectedCandidate}
        isOpen={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
      />
    </div>
  );
}