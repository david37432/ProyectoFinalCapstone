'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Bell,
  Check,
  Filter,
  X,
  AlertCircle,
  Info,
  Clock,
  Calendar,
  CheckCircle,
  BellOff,
  CheckCircle2,
  Briefcase,
  Lightbulb,
  Shield,
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'opportunity' | 'match' | 'tip' | 'system';
  title: string;
  message: string;
  link_url?: string;
  is_read: boolean;
  created_at: string;
  is_virtual?: boolean;
  vacancy_id?: string;
  action?: { label: string; href: string };
}

interface AvisosClientProps {
  initialNotifications: Notification[];
  userId: string;
}

const filterOptions = [
  { id: 'all', label: 'Todos', icon: Bell },
  { id: 'unread', label: 'No leídas', icon: AlertCircle },
  { id: 'opportunity', label: 'Nuevas Oportunidades', icon: Briefcase },
  { id: 'match', label: 'Estado de Solicitudes', icon: Shield },
  { id: 'tip', label: 'Consejos PAT', icon: Lightbulb },
  { id: 'system', label: 'Información', icon: Info },
];

const typeIcons = {
  opportunity: Briefcase,
  match: Shield,
  tip: Lightbulb,
  system: Info,
};

export default function AvisosClient({ initialNotifications, userId }: AvisosClientProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'opportunity' | 'match' | 'tip' | 'system'>('all');
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'unread') return !n.is_read;
    if (activeFilter !== 'all') return n.type === activeFilter;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'opportunity': return { bg: 'bg-primary/10', text: 'text-primary', icon: Briefcase, border: 'border-primary/20', label: 'Oportunidad' };
      case 'match': return { bg: 'bg-success/10', text: 'text-success', icon: Shield, border: 'border-success/20', label: 'Match' };
      case 'tip': return { bg: 'bg-warning/10', text: 'text-warning', icon: Lightbulb, border: 'border-warning/20', label: 'Consejo' };
      case 'system': return { bg: 'bg-info/10', text: 'text-info', icon: Info, border: 'border-info/20', label: 'Info' };
      default: return { bg: 'bg-neutral-100', text: 'text-neutral-600', icon: Bell, border: 'border-neutral-200', label: 'Otro' };
    }
  };

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Hace pocos min';
    if (hours < 24) return `Hace ${hours}h`;
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const handleMarkRead = async (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification || notification.is_virtual) return;

    // Optimistic update
    startTransition(() => {
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
    });

    // Server update
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);
    } catch (err) {
      console.error('Error marking as read:', err);
      // Revert on error
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: false } : n
      ));
    }
  };

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read && !n.is_virtual).map(n => n.id);
    if (unreadIds.length === 0) return;

    startTransition(() => {
      setNotifications(prev => prev.map(n => 
        unreadIds.includes(n.id) ? { ...n, is_read: true } : n
      ));
    });

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', unreadIds);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      handleMarkRead(notification.id);
    }
    if (notification.link_url) {
      window.location.href = notification.link_url;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Avisos</h1>
          <p className="text-neutral-600">Notificaciones y actualizaciones de tu cuenta</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">
            {unreadCount} no leída{unreadCount !== 1 ? 's' : ''}
          </span>
          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Marcar todas como leídas
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((filter) => {
          let count = 0;
          if (filter.id === 'all') count = notifications.length;
          else if (filter.id === 'unread') count = notifications.filter(n => !n.is_read).length;
          else count = notifications.filter(n => n.type === filter.id).length;

          return (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as typeof activeFilter)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeFilter === filter.id
                  ? 'bg-primary text-white'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
              }`}
            >
              <filter.icon className="w-4 h-4" />
              {filter.label}
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeFilter === filter.id ? 'bg-white/30' : 'bg-neutral-100 text-neutral-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
              {filteredNotifications.length === 0 && notifications.length > 0 ? (
                <Filter className="w-10 h-10 text-neutral-400" />
              ) : (
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                  <BellOff className="w-8 h-8 text-neutral-400" />
                </div>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                  <BellOff className="w-8 h-8 text-neutral-400" />
                </div>
                <h3 className="text-lg font-medium text-neutral-900 mb-2">Estás al día</h3>
                <p className="text-neutral-600 mb-4">
                  Te avisaremos de inmediato cuando se publique una nueva oportunidad afín a tu perfil 
                  o la Coordinación PAT envíe novedades.
                </p>
                <div className="text-sm text-neutral-500">
                  <p className="font-medium">Consejo:</p>
                  <p>Completa tu perfil para recibir avisos personalizados.</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-neutral-900 mb-2">No hay avisos en esta categoría</h3>
                <p className="text-neutral-500">Intenta con otro filtro para ver más notificaciones.</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {filteredNotifications.map((notification) => {
              const config = getTypeConfig(notification.type);
              const Icon = config.icon;
              return (
                <article
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex items-start gap-4 p-4 rounded-xl border ${config.border} ${config.bg} ${!notification.is_read ? 'bg-white ring-2 ring-primary/20' : ''} cursor-pointer hover:bg-neutral-50 transition-colors`}
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${config.bg} ${config.text}`}>
                    <config.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-neutral-900">{notification.title}</h4>
                      <span className="text-xs text-neutral-500 flex-shrink-0 ml-2 whitespace-nowrap">
                        {formatTime(notification.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 mt-1">{notification.message}</p>
                    {notification.link_url && (
                      <a
                        href={notification.link_url}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-primary hover:underline"
                      >
                        {notification.action?.label || 'Ver más'}
                        <X className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  {!notification.is_read && !notification.is_virtual && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMarkRead(notification.id); }}
                      className="flex-shrink-0 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
                      aria-label="Marcar como leída"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  )}
                  {notification.is_read && !notification.is_virtual && (
                    <span className="flex-shrink-0 p-1.5 text-neutral-300">
                      <CheckCircle2 className="w-5 h-5" />
                    </span>
                  )}
                  {notification.is_virtual && (
                    <span className="flex-shrink-0 px-2 py-1 text-xs text-neutral-500 bg-neutral-100 rounded">
                      Automático
                    </span>
                  )}
                </article>
              );
            })}

            {filteredNotifications.length > 6 && (
              <div className="text-center pt-4">
                <button className="px-6 py-3 text-base font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors">
                  Ver todas las notificaciones
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}