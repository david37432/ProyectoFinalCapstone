'use client';

import { MessageSquare, ExternalLink, Clock, GraduationCap, User, Star } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface StudentCardProps {
  student: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
    career: string;
    availability_hours: number | null;
    match_score: number;
    is_online: boolean;
  };
  vacancyId: string;
  onOpenChat: () => void;
  onViewProfile: () => void;
  onGoToTracking: () => void;
}

export function StudentCard({ student, vacancyId, onOpenChat, onViewProfile, onGoToTracking }: StudentCardProps) {
  return (
    <Card variant="outlined" padding="md">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar
              src={student.avatar_url}
              alt={student.name}
              size="xl"
              fallback={student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            />
            <span className={cn(
              'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white',
              student.is_online ? 'bg-success' : 'bg-neutral-300'
            )} aria-label={student.is_online ? 'En línea' : 'Desconectado'} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-neutral-900 truncate">{student.name}</h3>
            <p className="text-sm text-neutral-500 truncate">{student.email}</p>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <span className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium',
              student.match_score >= 90 ? 'bg-success/10 text-success' :
              student.match_score >= 80 ? 'bg-primary/10 text-primary' :
              'bg-warning/10 text-warning'
            )}>
              <Star className="w-3 h-3 mr-1" fill="currentColor" />
              {student.match_score}%
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg">
            <GraduationCap className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-neutral-500">Carrera</p>
              <p className="font-medium text-sm truncate">{student.career}</p>
            </div>
          </div>
          {student.availability_hours && (
            <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-neutral-500">Disponibilidad</p>
                <p className="font-medium text-sm">{student.availability_hours} hrs/semana</p>
              </div>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-neutral-100">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="primary"
              onClick={onOpenChat}
              className="flex-1 gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Abrir Chat del Proyecto
            </Button>
            <Button
              variant="secondary"
              onClick={onViewProfile}
              className="flex-1 gap-2"
            >
              <User className="w-4 h-4" />
              Ver Perfil
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}