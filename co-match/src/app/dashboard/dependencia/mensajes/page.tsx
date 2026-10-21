import { requireAdmin } from '@/lib/supabase/server-auth'
import { MessagesClient } from '@/components/dashboard/dependencia/mensajes/MessagesClient'
import { getConversationsForDependency, getMessagesForConversation, getTotalUnreadCount } from '@/lib/supabase/admin-queries'
import type { ConversationWithDetails, MessageWithSender } from '@/lib/supabase/admin-queries'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ conversationId?: string }>;
}

export default async function MensajesPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const conversationId = resolvedParams.conversationId ?? null;
  
  const user = await requireAdmin()

  // Fetch conversations for this dependency
  const conversations = await getConversationsForDependency(user.id);

  // Determine which conversation to show
  let selectedConversationId = conversationId;
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