'use client';

import { Button } from '@/components/ui/Button';
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
        <a
          key={action.label}
          href={action.href}
          className="flex items-center gap-1.5"
        >
          <Button variant={action.variant} size="sm" className="gap-1.5">
            <action.icon className="w-4 h-4" />
            {action.label}
          </Button>
        </a>
      ))}
    </div>
  );
}