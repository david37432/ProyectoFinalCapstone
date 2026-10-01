'use client';

import { Badge } from '@/components/ui/Badge';
import { TopCandidate } from '@/lib/supabase/admin-queries';
import { cn, getMatchScoreColor, getMatchScoreBgColor } from '@/lib/utils';
import { ArrowRight, Briefcase } from 'lucide-react';

interface TopCandidatesPanelProps {
  candidates: TopCandidate[];
}

export function TopCandidatesPanel({ candidates }: TopCandidatesPanelProps) {
  if (candidates.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-6 h-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-neutral-900">Top Candidatos</h2>
        </div>
        <div className="text-center py-8">
          <svg className="w-16 h-16 mx-auto text-neutral-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-medium text-neutral-900 mb-1">No hay candidatos con alta coincidencia</h3>
          <p className="text-neutral-500 text-sm">Publica necesidades para ver coincidencias</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-neutral-900">Top Candidatos</h2>
        <span className="text-xs text-neutral-500">{candidates.length} perfiles destacados</span>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto pr-2">
        {candidates.map((candidate, index) => (
          <div
            key={candidate.id}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg transition-all',
              index === 0 ? 'bg-primary/5 border border-primary/20' : 'hover:bg-neutral-50'
            )}
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <p className="font-medium text-neutral-900 truncate">{candidate.full_name}</p>
                  <p className="text-xs text-neutral-500">{candidate.career}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={getMatchScoreColor(candidate.match_score)} size="sm">
                  {candidate.match_score}% Match
                </Badge>
              </div>
              <p className="text-xs text-neutral-500 truncate">
                <Briefcase className="w-3 h-3 inline mr-1" />
                {candidate.vacancy_title}
              </p>
            </div>
            <div className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full',
              getMatchScoreBgColor(candidate.match_score)
            )}>
              <span className="font-semibold text-xs">{candidate.match_score}%</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        ))}

        <div className="pt-4 border-t border-neutral-100">
          <a
            href="/dashboard/dependencia/candidatos"
            className="w-full flex items-center justify-center gap-2 text-primary font-medium text-sm hover:underline"
          >
            Ver todos los candidatos
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}