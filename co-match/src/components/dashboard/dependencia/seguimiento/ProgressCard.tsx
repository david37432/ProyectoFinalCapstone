'use client';

import { TrendingUp, Clock, AlertTriangle, Star, Target, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface ProgressCardProps {
  completedCount: number;
  totalCount: number;
  progressPercent: number;
}

function ProgressRing({ progress, size = 120, strokeWidth = 8 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progress-gradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000"
          style={{ filter: 'drop-shadow(0 4px 6px rgba(16, 185, 129, 0.3))' }}
        />
        <defs>
          <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-neutral-900">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

export function ProgressCard({ completedCount, totalCount, progressPercent }: ProgressCardProps) {
  const isComplete = progressPercent >= 100;

  return (
    <Card variant="elevated" padding="lg" className="text-center">
      <div className="mb-6">
        <ProgressRing progress={progressPercent} size={140} strokeWidth={10} />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-neutral-900">Progreso General</h3>
        <p className="text-neutral-500">
          {completedCount} de {totalCount} actividades finalizadas
        </p>
        {isComplete && (
          <Badge variant="success" className="mt-3 inline-flex gap-1" dot>
            <CheckCircle className="w-3 h-3" />
            Proyecto completado
          </Badge>
        )}
      </div>
    </Card>
  );
}

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  alert?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
}

const iconColors = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  neutral: 'bg-neutral-100 text-neutral-600',
};

const borderColors = {
  primary: 'border-primary/20',
  success: 'border-success/20',
  warning: 'border-warning/20',
  danger: 'border-danger/20',
  neutral: 'border-neutral-100',
};

export function KPICard({ title, value, subtitle, icon, trend, trendValue, alert, color = 'primary' }: KPICardProps) {
  return (
    <Card variant="outlined" padding="md" className={cn(
      'transition-all hover:shadow-md',
      alert && 'border-danger/30 bg-danger/5'
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-neutral-900">{value}</p>
          {subtitle && <p className="text-xs text-neutral-500 mt-1">{subtitle}</p>}
          {trend && trendValue && (
            <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', trend === 'up' ? 'text-success' : trend === 'down' ? 'text-danger' : 'text-neutral-500')}>
              {trend === 'up' && <TrendingUp className="w-3 h-3" />}
              {trend === 'down' && <TrendingUp className="w-3 h-3 rotate-180" />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', iconColors[color], borderColors[color])}>
          {icon}
        </div>
      </div>
      {alert && (
        <div className="mt-3 p-2 bg-danger/5 border border-danger/20 rounded-lg flex items-center gap-2 text-danger text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>Proyecto vencido - Requiere atención inmediata</span>
        </div>
      )}
    </Card>
  );
}