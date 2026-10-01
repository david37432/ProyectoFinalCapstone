'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, PlusCircle, Users, MessageCircle, ClipboardList, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const navigation = [
  { name: 'Panel principal', href: '/dashboard/dependencia', icon: LayoutDashboard },
  { name: 'Publicar necesidad', href: '/dashboard/dependencia/publicar', icon: PlusCircle },
  { name: 'Candidatos', href: '/dashboard/dependencia/candidatos', icon: Users },
  { name: 'Mensajes', href: '/dashboard/dependencia/mensajes', icon: MessageCircle },
  { name: 'Seguimiento', href: '/dashboard/dependencia/seguimiento', icon: ClipboardList },
];

export function AdminSidebar({ isCollapsed, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'fixed top-16 left-0 z-30 bg-white border-r border-neutral-200 h-[calc(100vh-4rem)] transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
      aria-label="Navegación principal del administrador"
    >
      <nav className="flex flex-col h-full p-3" aria-label="Menú de navegación">
        <ul className="space-y-1 flex-1" role="list">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900',
                    isCollapsed && 'justify-center'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-primary')} aria-hidden="true" />
                  {!isCollapsed && <span className="font-medium text-sm">{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="pt-4 border-t border-neutral-200">
          <button
            onClick={onToggle}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 transition-colors',
              isCollapsed && 'justify-center'
            )}
            aria-label={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                <span className="font-medium text-sm">Colapsar menú</span>
              </>
            )}
          </button>
        </div>
      </nav>
    </aside>
  );
}