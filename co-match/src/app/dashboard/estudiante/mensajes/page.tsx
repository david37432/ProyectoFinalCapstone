/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import StudentMessagesPage from './StudentMessagesPage';
import { studentApplicationStatus } from '@/lib/data/model';

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
    console.log("🚨 REDIRECCIÓN DISPARADA DESDE: src/app/dashboard/estudiante/mensajes/page.tsx");
    redirect('/auth/login');
  }

  // Conversaciones del estudiante (las crea la dependencia al contactarlo)
  const { data: convRows, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('student_id', user.id)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('Error fetching conversations:', error);
  }
  const convs = (convRows ?? []) as any[];

  const oppIds = [...new Set(convs.map((c) => c.opportunity_id))];
  const convIds = convs.map((c) => c.id);

  const [{ data: opps }, { data: msgs }, { data: apps }] = await Promise.all([
    oppIds.length
      ? supabase.from('opportunities').select('id, title, area').in('id', oppIds)
      : Promise.resolve({ data: [] as any[] }),
    convIds.length
      ? supabase.from('messages').select('*').in('conversation_id', convIds).order('created_at', { ascending: true })
      : Promise.resolve({ data: [] as any[] }),
    oppIds.length
      ? supabase.from('applications').select('*').eq('student_id', user.id).in('opportunity_id', oppIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const oppById = new Map((opps ?? []).map((o: any) => [o.id, o]));

  const validConversations: Conversation[] = convs.map((c) => {
    const opp: any = oppById.get(c.opportunity_id);
    const messages = (msgs ?? []).filter((m: any) => m.conversation_id === c.id);
    const last = messages[messages.length - 1];
    const app = (apps ?? []).find((a: any) => a.opportunity_id === c.opportunity_id);
    return {
      applicationId: c.id, // id de la conversación
      vacancyId: c.opportunity_id,
      vacancyTitle: opp?.title || 'Proyecto',
      departmentName: opp?.area || 'Dependencia',
      status: app ? studentApplicationStatus(app) : 'entrevista',
      lastMessage: last?.content || c.last_message || '',
      lastMessageTime: last?.created_at || c.last_message_at || c.created_at,
      unreadCount: messages.filter((m: any) => !m.is_read && m.sender_id !== user.id).length,
      lastAdminMessage: [...messages].reverse().find((m: any) => m.sender_id !== user.id) ?? null,
      messages: messages.map((m: any) => ({
        id: m.id,
        content: m.content,
        senderId: m.sender_id,
        isOwn: m.sender_id === user.id,
        isRead: m.is_read,
        createdAt: m.created_at,
      })),
    };
  });

  return <StudentMessagesPage initialConversations={validConversations} userId={user.id} />;
}