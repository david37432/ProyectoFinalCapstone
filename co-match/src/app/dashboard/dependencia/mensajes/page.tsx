import { requireAdmin } from '@/lib/supabase/server-auth'
import { MessagesClient } from '@/components/dashboard/dependencia/mensajes/MessagesClient'
import { getConversationsForDependency, getMessagesForConversation } from '@/lib/supabase/admin-queries'
import type { ConversationWithDetails, MessageWithSender } from '@/lib/supabase/admin-queries'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ conversationId?: string; studentId?: string; opportunityId?: string }>;
}

export default async function MensajesPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const conversationId = resolvedParams.conversationId ?? null;
  
  const user = await requireAdmin()

  // Fetch conversations for this dependency
  const conversations = await getConversationsForDependency(user.id);

  // Determine which conversation to show
  let selectedConversationId = conversationId;
  // Desde Seguimiento se llega con el estudiante y la necesidad
  if (!selectedConversationId && resolvedParams.studentId) {
    selectedConversationId =
      conversations.find(
        (c) =>
          c.candidate_id === resolvedParams.studentId &&
          (!resolvedParams.opportunityId || c.vacancy_id === resolvedParams.opportunityId)
      )?.id ?? null;
  }
  if (!selectedConversationId && conversations.length > 0) {
    selectedConversationId = conversations[0].id;
  }

  // Fetch messages for selected conversation
  let messages: MessageWithSender[] = [];
  if (selectedConversationId) {
    messages = await getMessagesForConversation(selectedConversationId, user.id);
  }

  return (
    <MessagesClient
      user={{
        id: user.id,
        full_name: user.full_name,
        email: user.email || '',
        role: user.role,
        department_name: user.department_name || '',
      }}
      initialConversations={conversations}
      initialMessages={messages}
      initialSelectedConversationId={selectedConversationId}
    />
  )
}