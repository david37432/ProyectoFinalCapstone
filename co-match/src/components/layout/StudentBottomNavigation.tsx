'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface StudentBottomNavigationProps {
  unreadNotifications?: number;
  unreadMessages?: number;
}

export function StudentBottomNavigation({ 
  unreadNotifications = 0, 
  unreadMessages = 0 
}: StudentBottomNavigationProps) {
  const pathname = usePathname();

  const navigation = [
    { 
      name: 'Explorar', 
      href: '/dashboard/estudiante/explorar', 
      icon: CompassIcon,
      badge: null
    },
    { 
      name: 'Mis apps', 
      href: '/dashboard/estudiante/mis-apps', 
      icon: FolderOpenIcon,
      badge: null
    },
    { 
      name: 'Mensajes', 
      href: '/dashboard/estudiante/mensajes', 
      icon: MessageCircleIcon,
      badge: unreadMessages > 0 ? unreadMessages : null
    },
    { 
      name: 'Avisos', 
      href: '/dashboard/estudiante/avisos', 
      icon: BellIcon,
      badge: unreadNotifications > 0 ? unreadNotifications : null
    },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 md:hidden"
      role="navigation"
      aria-label="Navegación principal del estudiante"
    >
      <div className="grid grid-cols-4">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'relative flex flex-col items-center justify-center py-2.5 px-2 gap-1 transition-colors',
              pathname === item.href
                ? 'text-success'
                : 'text-neutral-500 hover:text-success'
            )}
            aria-current={pathname === item.href ? 'page' : undefined}
          >
            <item.icon className="w-6 h-6" aria-hidden="true" />
            <span className="text-xs font-medium">{item.name}</span>
            {item.badge && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function CompassIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
    </svg>
  );
}

function FolderOpenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14v3m-3-3h6" />
    </svg>
  );
}

function MessageCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}