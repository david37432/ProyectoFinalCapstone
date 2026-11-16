'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Edit, Lock, Unlock, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { removeVacancyAction, setVacancyOpenAction } from '@/app/dashboard/dependencia/necesidades/actions';

interface VacancyActionsProps {
  id: string;
  isClosed: boolean;
  hasApplications: boolean;
  hasMatch: boolean;
}

export function VacancyActions({ id, isClosed, hasApplications, hasMatch }: VacancyActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleOpen = async () => {
    setBusy(true);
    setError(null);
    const result = await setVacancyOpenAction(id, isClosed);
    setBusy(false);
    if (!result.success) return setError(result.error ?? 'No se pudo actualizar la necesidad');
    router.refresh();
  };

  const remove = async () => {
    setBusy(true);
    setError(null);
    const result = await removeVacancyAction(id);
    setBusy(false);
    setConfirmDelete(false);
    if (!result.success) return setError(result.error ?? 'No se pudo eliminar la necesidad');
    router.push('/dashboard/dependencia');
    router.refresh();
  };

  return (
    <div className="pt-4 border-t border-neutral-200 space-y-3">
      <div className="flex flex-wrap gap-2">
        <Link href={`/dashboard/dependencia/necesidades/${id}/editar`}>
          <Button variant="primary" size="sm" className="gap-1.5"><Edit className="w-4 h-4" />Editar</Button>
        </Link>
        <Link href={`/dashboard/dependencia/candidatos/${id}`}>
          <Button variant="outline" size="sm" className="gap-1.5"><Users className="w-4 h-4" />Ver candidatos</Button>
        </Link>
        <Button variant="secondary" size="sm" className="gap-1.5" onClick={toggleOpen} disabled={busy}>
          {isClosed ? <><Unlock className="w-4 h-4" />Reabrir</> : <><Lock className="w-4 h-4" />Cerrar necesidad</>}
        </Button>
        <Button variant="danger" size="sm" className="gap-1.5" onClick={() => setConfirmDelete(true)} disabled={busy}>
          <Trash2 className="w-4 h-4" />Eliminar
        </Button>
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}

      <ConfirmDialog
        open={confirmDelete}
        title="¿Eliminar esta necesidad?"
        description={
          hasApplications
            ? `Tiene postulaciones${hasMatch ? ' y un estudiante en proceso' : ''}: se cancelará y dejará de aparecer en tu panel y en Explorar. Esta acción no se puede deshacer.`
            : 'No tiene postulaciones: se borrará definitivamente. Esta acción no se puede deshacer.'
        }
        confirmLabel="Sí, eliminar"
        danger
        busy={busy}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
