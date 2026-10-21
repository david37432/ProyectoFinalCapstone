'use client';

import { User, GraduationCap, Award, Clock, ExternalLink, MessageSquare, CheckCircle } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface CandidateCardProps {
  candidate: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    career: string;
    semester: string;
    gpa: number | null;
    availability_hours: number | null;
    experience: string | null;
    skills: { name: string; proficiency: string; is_match: boolean }[];
    match_score: number;
    application_id: string;
    application_status: string;
    dependency_status: string | null;
  };
  isTopMatch: boolean;
  onViewProfile: () => void;
  onContact: () => void;
}

function MatchScoreCircle({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;
  
  let color = 'text-warning';
  let strokeColor = '#f59e0b';
  if (score >= 90) {
    color = 'text-success';
    strokeColor = '#10b981';
  } else if (score >= 80) {
    color = 'text-primary';
    strokeColor = '#3b82f6';
  }

  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={strokeColor}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
        />
      </svg>
      <span className={cn('absolute font-bold text-xl', color)}>
        {score}%
      </span>
    </div>
  );
}

function ProficiencyBadge({ proficiency }: { proficiency: string }) {
  const variants = {
    basico: 'bg-neutral-100 text-neutral-600',
    intermedio: 'bg-primary/10 text-primary',
    avanzado: 'bg-success/10 text-success',
  };
  return (
    <Badge variant="outline" className={cn('text-xs', variants[proficiency as keyof typeof variants] || variants.basico)}>
      {proficiency.charAt(0).toUpperCase() + proficiency.slice(1)}
    </Badge>
  );
}

export function CandidateCard({ candidate, isTopMatch, onViewProfile, onContact }: CandidateCardProps) {
  const matchingSkills = candidate.skills.filter(s => s.is_match);
  const otherSkills = candidate.skills.filter(s => !s.is_match);

  return (
    <Card variant="outlined" padding="md" className={cn('relative transition-all hover:shadow-md', isTopMatch && 'ring-2 ring-primary/20')}>
      {isTopMatch && (
        <div className="absolute -top-2 -right-2">
          <Badge variant="primary" className="text-xs gap-1" dot>
            <Award className="w-3 h-3" />
            Top Match
          </Badge>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex items-center gap-4 sm:flex-none">
          <Avatar
            src={candidate.avatar_url}
            alt={candidate.full_name}
            size="lg"
            fallback={candidate.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          />
          <div>
            <h3 className="font-semibold text-neutral-900 text-lg">{candidate.full_name}</h3>
            <p className="text-sm text-neutral-500">{candidate.email}</p>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-neutral-400" />
            <div>
              <p className="text-xs text-neutral-500">Carrera</p>
              <p className="font-medium text-sm">{candidate.career}</p>
            </div>
          </div>
          {candidate.semester && (
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-neutral-400" />
              <div>
                <p className="text-xs text-neutral-500">Semestre</p>
                <p className="font-medium text-sm">{candidate.semester}</p>
              </div>
            </div>
          )}
          {candidate.gpa !== null && (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-neutral-400" />
              <div>
                <p className="text-xs text-neutral-500">Promedio</p>
                <p className="font-medium text-sm">{candidate.gpa.toFixed(2)}</p>
              </div>
            </div>
          )}
          {candidate.availability_hours && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-neutral-400" />
              <div>
                <p className="text-xs text-neutral-500">Disponibilidad</p>
                <p className="font-medium text-sm">{candidate.availability_hours} hrs/sem</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-3 sm:flex-none">
          <MatchScoreCircle score={candidate.match_score} />
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onViewProfile}
              className="gap-1.5"
            >
              <User className="w-4 h-4" />
              Ver perfil
            </Button>
            <Button
              variant={candidate.dependency_status === 'contacted' ? 'success' : 'primary'}
              size="sm"
              onClick={onContact}
              disabled={candidate.dependency_status === 'contacted'}
              className="gap-1.5"
            >
              <MessageSquare className="w-4 h-4" />
              {candidate.dependency_status === 'contacted' ? 'Contactado' : 'Contactar'}
            </Button>
          </div>
        </div>
      </div>

      {candidate.experience && (
        <div className="mt-4 pt-4 border-t border-neutral-100">
          <p className="text-sm text-neutral-600">
            <span className="font-medium text-neutral-900">Experiencia: </span>
            {candidate.experience}
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {matchingSkills.length > 0 && (
          <>
            <span className="text-xs text-success font-medium mr-1">Coinciden:</span>
            {matchingSkills.map((skill, i) => (
              <Badge key={`match-${i}`} variant="primary" className="text-xs gap-1" dot>
                {skill.name}
                <ProficiencyBadge proficiency={skill.proficiency} />
              </Badge>
            ))}
          </>
        )}
        {otherSkills.length > 0 && (
          <>
            <span className="text-xs text-neutral-500 font-medium mr-1">Otras:</span>
            {otherSkills.slice(0, 3).map((skill, i) => (
              <Badge key={`other-${i}`} variant="outline" className="text-xs gap-1" dot>
                {skill.name}
                <ProficiencyBadge proficiency={skill.proficiency} />
              </Badge>
            ))}
            {otherSkills.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{otherSkills.length - 3} más
              </Badge>
            )}
          </>
        )}
      </div>
    </Card>
  );
}