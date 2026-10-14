import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import StudentMessagesPage from './StudentMessagesPage';

interface Message {
  id: string;
  content: string;
  senderId: string;
  isOwn: boolean;
  isRead: boolean;
  createdAt: string;
  sender?: any;
}

interface Conversation {
  applicationId: string;
  vacancyId: string;
  vacancyTitle: string;
  departmentName: string;
  status: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  lastAdminMessage: any;
  messages: Message[];
}

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Obtener postulaciones aceptadas/entrevista del estudiante con mensajes
  const { data: conversations, error } = await supabase
    .from('applications')
    .select(`
      id,
      status,
      vacancy_id,
      updated_at,
      vacancies (
        id,
        title,
        department_id,
        departments (id, name)
      ),
      messages (
        id,
        content,
        sender_id,
        is_read,
        created_at,
        sender:users!sender_id (
          id,
          full_name,
          email,
          role_id,
          roles (name)
        )
      )
    `)
    .eq('candidate_id', user.id)
    .in('status', ['aceptada', 'entrevista'])
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
  }

  // Filtrar solo conversaciones que tienen al menos un mensaje de la dependencia/admin
  const validConversations = (conversations || [])
    .filter((app: any) => app.messages && app.messages.length > 0)
    .map((app: any) => {
      const messages = app.messages
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      const lastMessage = messages[messages.length - 1];
      const unreadCount = messages.filter((m: any) => !m.is_read && m.sender_id !== user.id).length;
      
      // Encontrar el último mensaje de la dependencia/admin
      const lastAdminMessage = messages
        .filter((m: any) => m.sender_id !== user.id)
        .pop();
      
      // Solo incluir si hay al menos un mensaje de la dependencia/admin
      if (!lastAdminMessage) return null;

      const vacancy = app.vacancies as any;
      const department = vacancy?.departments?.[0] as any;
      
      return {
        applicationId: app.id,
        vacancyId: vacancy?.id,
        vacancyTitle: vacancy?.title,
        departmentName: department?.name || 'Sin departamento',
        status: app.status,
        lastMessage: lastMessage?.content || '',
        lastMessageTime: lastMessage?.created_at,
        unreadCount,
        lastAdminMessage: lastAdminMessage,
        messages: messages.map((m: any) => ({
          id: m.id,
          content: m.content,
          senderId: m.sender_id,
          isOwn: m.sender_id === user.id,
          isRead: m.is_read,
          createdAt: m.created_at,
          sender: m.sender
        })),
      };
    })
    .filter((c): c is Conversation => c !== null);

  return <StudentMessagesPage initialConversations={validConversations} userId={user.id} />;
}