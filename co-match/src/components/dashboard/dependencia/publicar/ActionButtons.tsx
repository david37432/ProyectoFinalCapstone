'use client';

import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ActionButtonsProps {
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export function ActionButtons({ onCancel, onSubmit, isLoading }: ActionButtonsProps) {
  return (
    <div className="flex gap-3 pt-4 border-t border-neutral-200">
      <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
        <X className="w-4 h-4 mr-2" />
        Cancelar
      </Button>
      <Button
        type="submit"
        onClick={onSubmit}
        disabled={isLoading}
        size="lg"
        className="flex-1"
      >
        <Save className="w-4 h-4 mr-2" />
        Publicar y buscar candidatos
      </Button>
    </div>
  );
}