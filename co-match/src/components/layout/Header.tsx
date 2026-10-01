'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface HeaderProps {
  user?: {
    full_name: string;
    email: string;
    avatar_url?: string;
    role: string;
  } | null;
  onSignOut: () => void;
}

export function Header({ user, onSignOut }: HeaderProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Oportunidades', href: '/oportunidades', roles: ['postulante'] },
    { name: 'Dashboard', href: '/dashboard', roles: ['reclutador', 'jefe_area', 'admin'] },
    { name: 'Perfil', href: '/profile', roles: ['postulante', 'reclutador', 'jefe_area', 'admin'] },
  ];

  const userNav = navigation.filter((item) => item.roles.includes(user?.role || ''));

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2" aria-label="CO-MATCH Home">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg">CM</span>
              </div>
              <span className="font-semibold text-xl text-neutral-900 hidden sm:block">CO-MATCH</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1" aria-label="Navegación principal">
              {userNav.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-primary text-white'
                      : 'text-neutral-600 hover:text-primary hover:bg-primary/10'
                  )}
                  aria-current={pathname === item.href ? 'page' : undefined}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="relative">
                <button
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
                  aria-expanded="false"
                  aria-haspopup="true"
                >
                  <Avatar src={user.avatar_url} alt={user.full_name} size="sm" />
                  <span className="hidden sm:block font-medium text-neutral-700">{user.full_name}</span>
                  <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            )}

            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onSignOut}>
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}