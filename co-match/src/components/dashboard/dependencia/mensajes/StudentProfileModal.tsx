'use client';

import { useEffect } from 'react';
import { X, User, GraduationCap, Award, Clock, Mail, MapPin, ExternalLink, CheckCircle, Star, Briefcase, FileText } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import type { ConversationWithDetails } from '@/lib/supabase/admin-queries';

interface StudentProfileModalProps {
  student: ConversationWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onGoToTracking: () => void;
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
            Coinciden con la necesidad
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

export function StudentProfileModal({ student, isOpen, onClose, onGoToTracking }: StudentProfileModalProps) {
  if (!student || !isOpen) return null;

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
              src={student.candidate_avatar_url}
              alt={student.candidate_name}
              size="2xl"
              fallback={student.candidate_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            />
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">{student.candidate_name}</h2>
              <p className="text-neutral-500 mt-1">{student.candidate_email}</p>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant={student.dependency_status === 'contacted' ? 'success' : 'outline'} className="gap-1">
                  {student.dependency_status === 'contacted' ? (
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
                Información de la Conversación
              </CardTitle>
              <div className="space-y-3 mt-4">
                <div>
                  <p className="text-xs text-neutral-500">Proyecto</p>
                  <p className="font-medium">{student.vacancy_title}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Candidato</p>
                  <p className="font-medium">{student.candidate_name}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Email</p>
                  <p className="font-medium">{student.candidate_email}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Estado</p>
                  <Badge variant={student.dependency_status === 'contacted' ? 'success' : 'outline'}>
                    {student.dependency_status === 'contacted' ? 'Contactado' : 'Por contactar'}
                  </Badge>
                </div>
              </div>
            </Card>

            <Card variant="outlined" padding="md">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="w-4 h-4 text-primary" />
                Detalles de la Conversación
              </CardTitle>
              <div className="space-y-3 mt-4">
                <div>
                  <p className="text-xs text-neutral-500">Último mensaje</p>
                  <p className="font-medium text-sm line-clamp-1">{student.last_message || 'Sin mensajes'}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Última actividad</p>
                  <p className="font-medium">{student.last_message_at ? new Date(student.last_message_at).toLocaleString('es-ES') : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Mensajes sin leer</p>
                  <p className="font-medium text-primary">{student.unread_dependency_count}</p>
                </div>
              </div>
            </Card>

            <Card variant="outlined" padding="md">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="w-4 h-4 text-primary" />
                Acciones
              </CardTitle>
              <div className="space-y-3 mt-4">
                <div>
                  <p className="text-xs text-neutral-500">Estado en la aplicación</p>
                  <Badge variant="outline">
                    {student.is_online ? 'En línea' : 'Desconectado'}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex gap-3 pt-4 border-t border-neutral-100">
            <Button variant="primary" onClick={onGoToTracking} className="flex-1 gap-2">
              <ExternalLink className="w-4 h-4" />
              Ver Seguimiento de Selección
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </CardContent>
      </div>
    </div>
  );
}