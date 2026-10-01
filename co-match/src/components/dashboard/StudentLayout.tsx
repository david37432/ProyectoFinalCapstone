'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  Briefcase,
  MessageSquare,
  Bell,
  User,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const navigation = [
  { href: '/dashboard/estudiante/explorar', label: 'Explorar', icon: Compass },
  { href: '/dashboard/estudiante/mis-apps', label: 'Mis Apps', icon: Briefcase },
  { href: '/dashboard/estudiante/mensajes', label: 'Mensajes', icon: MessageSquare },
  { href: '/dashboard/estudiante/avisos', label: 'Avisos', icon: Bell },
  { href: '/dashboard/estudiante/perfil', label: 'Perfil', icon: User },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  if (isMobile) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-neutral-200 z-40 flex items-center justify-between px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-neutral-600 hover:bg-neutral-100"
            aria-label="Abrir menú"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-xl text-neutral-900">CO-MATCH</h1>
          <div className="w-12" />
        </header>

        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-neutral-200 transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:hidden`}
          aria-label="Navegación móvil"
        >
          <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-200">
            <h2 className="font-semibold text-neutral-900">Navegación</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg text-neutral-600 hover:bg-neutral-100"
              aria-label="Cerrar menú"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="p-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary text-white'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <main className="pt-16 pb-20 lg:pb-8 px-4">
          {children}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-40 lg:hidden">
          <div className="grid grid-cols-5 gap-1 px-2 py-2">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs transition-colors ${
                  isActive(item.href) ? 'text-primary' : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-neutral-200 hidden lg:flex flex-col">
        <div className="flex items-center justify-between h-16 px-6 border-b border-neutral-200">
          <h1 className="font-bold text-xl text-primary">CO-MATCH</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100"
            aria-label="Cerrar menú"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? 'bg-primary text-white'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-neutral-200">
          <p className="text-xs text-neutral-500 text-center">
            Universidad de La Sabana - PAT
          </p>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64 min-w-0">
        <header className="sticky top-0 z-30 bg-white border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-neutral-900">Oportunidades</h1>
            <button className="p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-3 h-3 bg-danger rounded-full" />
            </button>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}