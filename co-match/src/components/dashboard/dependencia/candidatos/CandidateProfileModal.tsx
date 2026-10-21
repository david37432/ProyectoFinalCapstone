'use client';

import { useEffect, useState } from 'react';
import { X, User, GraduationCap, Award, Clock, Mail, MapPin, ExternalLink, CheckCircle, Star, Briefcase } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface CandidateProfileModalProps {
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
    vacancy_title: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
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

function SkillCategory({ title, skills, matchColor }: { title: string; skills: { name: string; proficiency: string; is_match: boolean }[]; matchColor: string }) {
  if (skills.length === 0) return null;
  
  return (
    <div>
      <h4 className="font-medium text-neutral-700 mb-2 flex items-center gap-2">
        {title}
        {skills.some(s => s.is_match) && (
          <Badge variant="primary" className="text-xs" dot>
            Coinciden
          </Badge>
        )}
      </h4>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, i) => (
          <Badge key={i} variant={skill.is_match ? 'primary' : 'outline'} className="text-sm gap-1">
            {skill.name}
            <ProficiencyBadge proficiency={skill.proficiency} />
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function CandidateProfileModal({ candidate, isOpen, onClose }: CandidateProfileModalProps) {
  if (!candidate || !isOpen) return null;

  const matchingSkills = candidate.skills.filter(s => s.is_match);
  const otherSkills = candidate.skills.filter(s => !s.is_match);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-start justify-between p-6 border-b border-neutral-100">
          <div className="flex items-start gap-4">
            <Avatar
              src={candidate.avatar_url}
              alt={candidate.full_name}
              size="2xl"
              fallback={candidate.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            />
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">{candidate.full_name}</h2>
              <p className="text-neutral-500 mt-1">{candidate.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className={cn('px-3 py-1 rounded-full text-sm font-medium', 
                  candidate.match_score >= 90 ? 'bg-success/10 text-success' :
                  candidate.match_score >= 80 ? 'bg-primary/10 text-primary' :
                  'bg-warning/10 text-warning'
                )}>
                  <Star className="w-3 h-3 mr-1" fill="currentColor" />
                  {candidate.match_score}% Compatibilidad
                </span>
                <Badge variant={candidate.dependency_status === 'contacted' ? 'success' : 'outline'} className="gap-1">
                  {candidate.dependency_status === 'contacted' ? (
                    <> <CheckCircle className="w-3 h-3" /> Contactado </> 
                  ) : (
                    <> <ExternalLink className="w-3 h-3" /> Pendiente </>
                  )}
                </Badge>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="outlined" padding="md">
              <CardTitle className="flex items-center gap-2 text-base">
                <GraduationCap className="w-4 h-4 text-primary" />
                Información Académica
              </CardTitle>
              <div className="space-y-3 mt-4">
                <div>
                  <p className="text-xs text-neutral-500">Carrera</p>
                  <p className="font-medium">{candidate.career}</p>
                </div>
                {candidate.semester && (
                  <div>
                    <p className="text-xs text-neutral-500">Semestre</p>
                    <p className="font-medium">{candidate.semester}</p>
                  </div>
                )}
                {candidate.gpa !== null && (
                  <div>
                    <p className="text-xs text-neutral-500">Promedio Académico</p>
                    <p className="font-medium text-lg text-primary">{candidate.gpa.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </Card>

            <Card variant="outlined" padding="md">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="w-4 h-4 text-primary" />
                Disponibilidad
              </CardTitle>
              <div className="space-y-3 mt-4">
                {candidate.availability_hours && (
                  <div>
                    <p className="text-xs text-neutral-500">Horas semanales</p>
                    <p className="font-medium">{candidate.availability_hours} hrs</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-neutral-500">Modalidad preferida</p>
                  <p className="font-medium">Híbrido</p>
                </div>
              </div>
            </Card>

            <Card variant="outlined" padding="md">
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="w-4 h-4 text-primary" />
                Postulación
              </CardTitle>
              <div className="space-y-3 mt-4">
                <div>
                  <p className="text-xs text-neutral-500">Vacante</p>
                  <p className="font-medium text-sm line-clamp-1">{candidate.vacancy_title}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Estado</p>
                  <Badge variant={
                    candidate.application_status === 'aceptada' ? 'success' :
                    candidate.application_status === 'rechazada' ? 'danger' :
                    candidate.application_status === 'entrevista' ? 'primary' :
                    'warning'
                  }>
                    {candidate.application_status.charAt(0).toUpperCase() + candidate.application_status.slice(1).replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Estado Dependencia</p>
                  <Badge variant={candidate.dependency_status === 'contacted' ? 'success' : 'outline'}>
                    {candidate.dependency_status === 'contacted' ? 'Contactado' : 'Por contactar'}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>

          {candidate.experience && (
            <Card variant="outlined" padding="md">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="w-4 h-4 text-primary" />
                Experiencia y Proyectos
              </CardTitle>
              <p className="text-neutral-600 mt-4 whitespace-pre-wrap">{candidate.experience}</p>
            </Card>
          )}

          <Card variant="outlined" padding="md">
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="w-4 h-4 text-primary" fill="currentColor" />
              Habilidades Técnicas
            </CardTitle>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <SkillCategory 
                title="Habilidades que coinciden con la necesidad" 
                skills={matchingSkills} 
                matchColor="text-success"
              />
              <SkillCategory 
                title="Otras habilidades" 
                skills={otherSkills} 
                matchColor="text-neutral-500"
              />
            </div>
          </Card>
        </CardContent>
      </div>
    </div>
  );
}