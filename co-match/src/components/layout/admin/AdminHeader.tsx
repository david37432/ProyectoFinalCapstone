'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AdminHeaderProps {
  userName: string;
  departmentName: string;
  onViewToggle: (view: 'web' | 'mobile') => void;
  currentView: 'web' | 'mobile';
}

export function AdminHeader({ userName, departmentName, onViewToggle, currentView }: AdminHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-neutral-200 h-16">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/dependencia" className="flex items-center gap-2" aria-label="CO-MATCH Home">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg">CM</span>
              </div>
              <span className="font-semibold text-xl text-neutral-900 hidden sm:block">CO-MATCH</span>
            </Link>

            <div className="hidden lg:block w-64">
              <div className="relative">
                <input
                  type="search"
                  placeholder="Buscar en la plataforma..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  aria-label="Búsqueda general"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 p-2 rounded-lg bg-neutral-50 border border-neutral-200" role="group" aria-label="Selector de vista">
              <button
                onClick={() => onViewToggle('web')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  currentView === 'web'
                    ? 'bg-primary text-white'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-white'
                )}
                aria-pressed={currentView === 'web'}
              >
                Vista Web
              </button>
              <button
                onClick={() => onViewToggle('mobile')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  currentView === 'mobile'
                    ? 'bg-primary text-white'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-white'
                )}
                aria-pressed={currentView === 'mobile'}
              >
                Vista Móvil
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-neutral-900">{userName}</p>
                <p className="text-xs text-neutral-500">{departmentName}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}