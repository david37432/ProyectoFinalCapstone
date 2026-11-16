'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, UserPlus, MessageCircle, CalendarClock } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useClickOutside } from '@/lib/use-click-outside';
import { countUnseen, type DependencyNotification } from '@/lib/notifications';

const SEEN_KEY = 'comatch:dep-notifications-seen';
const POLL_MS = 30_000;

const ICONS = { application: UserPlus, message: MessageCircle, milestone: CalendarClock } as const;

function readSeen(): string | null {
  try {
    return localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
}

/** Campana de avisos de la dependencia: postulaciones nuevas, mensajes sin leer e hitos por vencer. */
export function NotificationBell() {
  const [items, setItems] = useState<DependencyNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<string | null>(() => readSeen());
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/dependencia/notifications', { cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setItems(data.notifications ?? []);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    load();
    // Solo consulta mientras la pestaña está visible
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, POLL_MS);
    const onVisible = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load]);

  const unseen = countUnseen(items, seen);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      load();
      const now = new Date().toISOString();
      try {
        localStorage.setItem(SEEN_KEY, now);
      } catch {
        /* sin almacenamiento: no se recuerda lo visto */
      }
      setSeen(now);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        className="relative p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors"
        aria-label={unseen > 0 ? `Notificaciones: ${unseen} nuevas` : 'Notificaciones'}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Bell className="w-5 h-5" />
        {unseen > 0 && !open && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[11px] font-bold flex items-center justify-center">
            {unseen > 9 ? '9+' : unseen}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[min(22rem,calc(100vw-2rem))] bg-white border border-neutral-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
            <h2 className="font-semibold text-neutral-900 text-sm">Notificaciones</h2>
            <button type="button" onClick={load} className="text-xs text-primary hover:underline">Actualizar</button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {failed && <p className="p-4 text-sm text-danger">No se pudieron cargar los avisos.</p>}
            {!failed && items.length === 0 && (
              <p className="p-6 text-sm text-neutral-500 text-center">No tienes avisos pendientes.</p>
            )}
            {items.map((n) => {
              const Icon = ICONS[n.type];
              return (
                <Link
                  key={n.id}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className={cn('flex gap-3 px-4 py-3 hover:bg-neutral-50 border-b border-neutral-50 last:border-0')}
                >
                  <span className="mt-0.5 w-8 h-8 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-neutral-900">{n.title}</span>
                    <span className="block text-sm text-neutral-600 break-words">{n.message}</span>
                    <span className="block text-xs text-neutral-400 mt-0.5">{formatRelativeTime(n.createdAt)}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
