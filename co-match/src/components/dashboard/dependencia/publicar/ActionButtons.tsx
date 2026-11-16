'use client';

import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ActionButtonsProps {
  onCancel: () => void;
  isLoading: boolean;
  submitLabel?: string;
}

/** El envío lo hace el <form> (type="submit"); antes también tenía onClick y se enviaba dos veces. */
export function ActionButtons({ onCancel, isLoading, submitLabel = 'Publicar y buscar candidatos' }: ActionButtonsProps) {
  return (
    <div className="flex gap-3 pt-4 border-t border-neutral-200">
      <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
        <X className="w-4 h-4 mr-2" />
        Cancelar
      </Button>
      <Button type="submit" isLoading={isLoading} size="lg" className="flex-1">
        {!isLoading && <Save className="w-4 h-4 mr-2" />}
        {submitLabel}
      </Button>
    </div>
  );
}
