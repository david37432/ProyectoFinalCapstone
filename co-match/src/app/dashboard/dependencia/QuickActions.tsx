'use client';

import Link from 'next/link';
import { PlusCircle, Users, MessageCircle, ClipboardList } from 'lucide-react';

export function QuickActions() {
  const actions = [
    {
      label: 'Publicar necesidad',
      icon: PlusCircle,
      href: '/dashboard/dependencia/publicar',
      variant: 'primary' as const,
    },
    {
      label: 'Revisar candidatos',
      icon: Users,
      href: '/dashboard/dependencia/candidatos',
      variant: 'outline' as const,
    },
    {
      label: 'Mensajes',
      icon: MessageCircle,
      href: '/dashboard/dependencia/mensajes',
      variant: 'outline' as const,
    },
    {
      label: 'Seguimiento',
      icon: ClipboardList,
      href: '/dashboard/dependencia/seguimiento',
      variant: 'outline' as const,
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          className={
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ' +
            (action.variant === 'primary'
              ? 'bg-primary text-white hover:bg-primary-dark'
              : 'border-2 border-primary text-primary hover:bg-primary/10')
          }
        >
          <action.icon className="w-4 h-4" />
          {action.label}
        </Link>
      ))}
    </div>
  );
}