import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AvisosClient from './AvisosClient';

export default async function AvisosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.log("🚨 REDIRECCIÓN DISPARADA DESDE: src/app/dashboard/estudiante/avisos/page.tsx");
    redirect('/auth/login');
  }

  // Obtener notificaciones del usuario + globales
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .or(`user_id.eq.${user.id},is_global.eq.true`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching notifications:', error);
  }

  // Generar avisos automáticos de oportunidades recientes (últimos 7 días)
  const { data: recentVacancies } = await supabase
    .from('vacancies')
    .select('id, title, department_id, departments(name)')
    .eq('status', 'publicada')
    .gte('publication_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('publication_date', { ascending: false })
    .limit(5);

  // Convertir vacantes recientes a notificaciones virtuales de oportunidad
  const opportunityNotifications = (recentVacancies || []).map(vacancy => ({
    id: `opportunity-${vacancy.id}`,
    type: 'opportunity' as const,
    title: '¡Nueva oportunidad publicada!',
    message: `La dependencia ${vacancy.departments?.[0]?.name || 'desconocida'} publicó una ficha: "${vacancy.title}".`,
    link_url: `/dashboard/estudiante/explorar`,
    is_read: false,
    created_at: vacancy.id, // usar ID como timestamp virtual para ordenamiento
    is_virtual: true,
    vacancy_id: vacancy.id,
  }));

  // Generar tips de perfil si está incompleto
  const { data: profile } = await supabase
    .from('profiles')
    .select('career, availability_hours, focus')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .single();

  const tipNotifications = [];
  if (profile) {
    if (!profile.career) {
      tipNotifications.push({
        id: 'tip-career',
        type: 'tip' as const,
        title: 'Completa tu perfil para mejores oportunidades',
        message: 'Agrega tu carrera para recibir mejores recomendaciones de proyectos.',
        link_url: '/dashboard/estudiante/perfil',
        is_read: false,
        created_at: new Date().toISOString(),
        is_virtual: true,
      });
    }
    if (!profile.availability_hours) {
      tipNotifications.push({
        id: 'tip-availability',
        type: 'tip' as const,
        title: 'Completa tu perfil para mejores oportunidades',
        message: 'Completa tus horas de disponibilidad horaria para recibir mejores recomendaciones de proyectos.',
        link_url: '/dashboard/estudiante/perfil',
        is_read: false,
        created_at: new Date().toISOString(),
        is_virtual: true,
      });
    }
    if (!profile.focus) {
      tipNotifications.push({
        id: 'tip-focus',
        type: 'tip' as const,
        title: 'Completa tu perfil para mejores oportunidades',
        message: 'Define tu enfoque/especialización para mejorar el matching con oportunidades.',
        link_url: '/dashboard/estudiante/perfil',
        is_read: false,
        created_at: new Date().toISOString(),
        is_virtual: true,
      });
    }
  }

  // Combinar todas las notificaciones
  const allNotifications = [
    ...(notifications || []).map(n => ({ ...n, is_virtual: false })),
    ...opportunityNotifications,
    ...tipNotifications,
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 50);

  return <AvisosClient initialNotifications={allNotifications} userId={user.id} />;
}