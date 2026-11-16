'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, Edit, Trash2, MoreVertical, Lock, Unlock, Users } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { removeVacancyAction, setVacancyOpenAction } from '@/app/dashboard/dependencia/necesidades/actions';
import { useClickOutside } from '@/lib/use-click-outside';

interface VacancyRowActionsProps {
  id: string;
  title: string;
  status: string;
  hasApplications: boolean;
}

const iconBtn = 'p-2 rounded-lg text-neutral-400 hover:text-primary hover:bg-primary/10 transition-colors';

/** Botones de cada fila de la tabla de necesidades: ver, editar, eliminar y más opciones. */
export function VacancyRowActions({ id, title, status, hasApplications }: VacancyRowActionsProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, () => setMenuOpen(false), menuOpen);

  const isClosed = status === 'cerrada';

  const toggleOpen = async () => {
    setMenuOpen(false);
    setBusy(true);
    const result = await setVacancyOpenAction(id, isClosed);
    setBusy(false);
    if (!result.success) return setError(result.error ?? 'No se pudo actualizar');
    router.refresh();
  };

  const remove = async () => {
    setBusy(true);
    const result = await removeVacancyAction(id);
    setBusy(false);
    setConfirmDelete(false);
    if (!result.success) return setError(result.error ?? 'No se pudo eliminar');
    router.refresh();
  };

  return (
    <div className="flex items-center justify-end gap-1 relative">
      <Link href={`/dashboard/dependencia/necesidades/${id}`} className={iconBtn} aria-label={`Ver detalles de ${title}`} title="Ver detalles">
        <Eye className="w-4 h-4" />
      </Link>
      <Link href={`/dashboard/dependencia/necesidades/${id}/editar`} className={iconBtn} aria-label={`Editar ${title}`} title="Editar">
        <Edit className="w-4 h-4" />
      </Link>
      <button
        type="button"
        onClick={() => setConfirmDelete(true)}
        disabled={busy}
        className="p-2 rounded-lg text-neutral-400 hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
        aria-label={`Eliminar ${title}`}
        title="Eliminar"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
          aria-label="Más opciones"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        {menuOpen && (
          <div role="menu" className="absolute right-0 top-full mt-1 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg z-20 py-1 text-left">
            <Link
              role="menuitem"
              href={`/dashboard/dependencia/candidatos/${id}`}
              className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              <Users className="w-4 h-4" /> Ver candidatos
            </Link>
            <button
              role="menuitem"
              type="button"
              onClick={toggleOpen}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              {isClosed ? <><Unlock className="w-4 h-4" /> Reabrir</> : <><Lock className="w-4 h-4" /> Cerrar necesidad</>}
            </button>
          </div>
        )}
      </div>

      {error && <span role="alert" className="absolute right-0 top-full mt-1 text-xs text-danger bg-white px-2 py-1 rounded shadow">{error}</span>}

      <ConfirmDialog
        open={confirmDelete}
        title="¿Eliminar esta necesidad?"
        description={
          hasApplications
            ? `«${title}» tiene postulaciones: se cancelará y dejará de aparecer en tu panel y en Explorar.`
            : `«${title}» no tiene postulaciones: se borrará definitivamente.`
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
