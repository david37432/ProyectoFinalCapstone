import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) {
    return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  }
  if (diffHours > 0) {
    return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  }
  if (diffMinutes > 0) {
    return `hace ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
  }
  return 'hace un momento';
}

export function getMatchScoreColor(score: number): 'success' | 'primary' | 'warning' | 'danger' {
  if (score >= 80) return 'success';
  if (score >= 60) return 'primary';
  if (score >= 40) return 'warning';
  return 'danger';
}

export function getMatchScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-success/10 text-success';
  if (score >= 60) return 'bg-primary/10 text-primary';
  if (score >= 40) return 'bg-warning/10 text-warning';
  return 'bg-danger/10 text-danger';
}

export function getMatchScoreLabel(score: number): string {
  if (score >= 80) return 'Alta coincidencia';
  if (score >= 60) return 'Buena coincidencia';
  if (score >= 40) return 'Coincidencia media';
  return 'Baja coincidencia';
}