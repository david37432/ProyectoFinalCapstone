'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, Search } from 'lucide-react';
import { NotificationBell } from './NotificationBell';

interface AdminHeaderProps {
  userName: string;
  departmentName: string;
  /** Abre el menú lateral en pantallas pequeñas. */
  onMenuClick: () => void;
}

export function AdminHeader({ userName, departmentName, onMenuClick }: AdminHeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // La búsqueda filtra las necesidades del panel principal
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    router.push(q ? `/dashboard/dependencia?q=${encodeURIComponent(q)}` : '/dashboard/dependencia');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-neutral-200 h-16">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onMenuClick}
              className="lg:hidden p-2 -ml-2 rounded-lg text-neutral-600 hover:bg-neutral-100"
              aria-label="Abrir menú de navegación"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/dashboard/dependencia" className="flex items-center gap-2" aria-label="CO-MATCH Inicio">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg">CM</span>
              </div>
              <span className="font-semibold text-xl text-neutral-900 hidden sm:block">CO-MATCH</span>
            </Link>

            <form onSubmit={handleSearch} role="search" className="hidden lg:block w-64">
              <div className="relative">
                <input
                  type="search"
                  placeholder="Buscar necesidades..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  aria-label="Buscar necesidades"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" aria-hidden="true" />
              </div>
            </form>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationBell />
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-neutral-900">{userName}</p>
              <p className="text-xs text-neutral-500">{departmentName}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center" aria-hidden="true">
              <span className="text-white font-bold text-sm">{userName.charAt(0).toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
