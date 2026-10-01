'use client';

import { useState } from 'react';
import { Bell, Check, Filter, X, AlertCircle, Info, Clock, Calendar, CheckCircle } from 'lucide-react';

const notifications = [
  {
    id: 1,
    type: 'success',
    title: 'Aplicación Aceptada',
    message: 'Tu postulación a "Sistema de Onboarding Digital con Power Apps" ha sido aceptada. Inicio: 1 de noviembre.',
    time: '2024-10-18 14:30',
    read: false,
    action: { label: 'Ver detalles', href: '/dashboard/estudiante/mis-apps' },
  },
  {
    id: 2,
    type: 'info',
    title: 'Entrevista Programada',
    message: 'Tienes una entrevista programada para "Dashboard de Métricas en Power BI" el 20 de octubre a las 10:00 AM.',
    time: '2024-10-18 09:15',
    read: false,
    action: { label: 'Ver en calendario', href: '/dashboard/estudiante/mis-apps' },
  },
  {
    id: 3,
    type: 'warning',
    title: 'Reporte de Horas Pendiente',
    message: 'Recuerda registrar tus horas PAT de esta semana antes del viernes 25 de octubre.',
    time: '2024-10-17 08:00',
    read: true,
  },
  {
    id: 4,
    type: 'info',
    title: 'Nueva Oportunidad Disponible',
    message: 'Se publicó "MVP de Plataforma de Matching Estudiantil" con 95% de coincidencia con tu perfil.',
    time: '2024-10-16 16:45',
    read: true,
    action: { label: 'Explorar', href: '/dashboard/estudiante/explorar' },
  },
  {
    id: 5,
    type: 'success',
    title: 'Perfil Completado al 90%',
    message: '¡Excelente! Tu perfil está casi completo. Solo falta agregar tu disponibilidad horaria.',
    time: '2024-10-15 12:00',
    read: true,
    action: { label: 'Completar perfil', href: '/dashboard/estudiante/perfil' },
  },
  {
    id: 6,
    type: 'warning',
    title: 'Fecha Límite Próxima',
    message: 'La convocatoria para "Automatización de Reportes en Excel" cierra el 25 de octubre.',
    time: '2024-10-14 10:30',
    read: true,
    action: { label: 'Postularse', href: '/dashboard/estudiante/explorar' },
  },
  {
    id: 7,
    type: 'info',
    title: 'Actualización del Sistema',
    message: 'Mantenimiento programado el sábado 26 de octubre de 2:00 AM a 4:00 AM. La plataforma no estará disponible.',
    time: '2024-10-13 18:00',
    read: true,
  },
];

const filterOptions = [
  { id: 'all', label: 'Todas', icon: Bell },
  { id: 'unread', label: 'No leídas', icon: AlertCircle },
  { id: 'success', label: 'Éxitos', icon: CheckCircle },
  { id: 'warning', label: 'Alertas', icon: AlertCircle },
  { id: 'info', label: 'Información', icon: Info },
];

export default function AvisosPage() {
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'unread') return !n.read;
    if (activeFilter !== 'all') return n.type === activeFilter;
    return true;
  });

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'success': return { bg: 'bg-success/10', text: 'text-success', icon: CheckCircle, border: 'border-success/20' };
      case 'warning': return { bg: 'bg-warning/10', text: 'text-warning', icon: AlertCircle, border: 'border-warning/20' };
      case 'info': return { bg: 'bg-info/10', text: 'text-info', icon: Info, border: 'border-info/20' };
      default: return { bg: 'bg-neutral-100', text: 'text-neutral-600', icon: Bell, border: 'border-neutral-200' };
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

  const markAllRead = () => {
    notifications.forEach(n => { n.read = true; });
    setActiveFilter(activeFilter);
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
            {notifications.filter(n => !n.read).length} no leídas
          </span>
          <button
            onClick={markAllRead}
            disabled={notifications.every(n => n.read)}
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
          else if (filter.id === 'unread') count = notifications.filter(n => !n.read).length;
          else count = notifications.filter(n => n.type === filter.id).length;

          return (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
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
            <Bell className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No hay avisos</h3>
            <p className="text-neutral-500">No hay notificaciones que coincidan con el filtro seleccionado</p>
          </div>
        ) : (
          <>
            {filteredNotifications.map((notification) => {
              const config = getTypeConfig(notification.type);
              const Icon = config.icon;
              return (
                <article
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 rounded-xl border ${config.border} ${config.bg} ${!notification.read ? 'bg-white ring-2 ring-primary/20' : ''}`}
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${config.bg} ${config.text}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-neutral-900">{notification.title}</h4>
                      <span className="text-xs text-neutral-500 flex-shrink-0 ml-2 whitespace-nowrap">
                        {formatTime(notification.time)}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 mt-1">{notification.message}</p>
                    {notification.action && (
                      <a
                        href={notification.action.href}
                        className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-primary hover:underline"
                      >
                        {notification.action.label}
                      </a>
                    )}
                  </div>
                  {!notification.read && (
                    <button
                      className="flex-shrink-0 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
                      aria-label="Marcar como leída"
                    >
                      <Check className="w-5 h-5" />
                    </button>
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