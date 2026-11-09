'use server';

import { createClient } from '@/lib/supabase/server';
import { getConversationForUser, sendMessage, markMessagesAsRead } from '@/lib/supabase/admin-queries';

export interface StudentSendResult {
  success: boolean;
  error?: string;
  message?: { id: string; content: string; createdAt: string };
}

async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** El estudiante envía un mensaje en una de sus conversaciones. */
export async function sendStudentMessageAction(conversationId: string, content: string): Promise<StudentSendResult> {
  const text = (content ?? '').trim();
  if (!text) return { success: false, error: 'El mensaje está vacío' };
  if (text.length > 5000) return { success: false, error: 'El mensaje es demasiado largo' };

  const userId = await currentUserId();
  if (!userId) return { success: false, error: 'Debes iniciar sesión' };

  const { conversation } = await getConversationForUser(conversationId, userId);
  if (!conversation || conversation.student_id !== userId) return { success: false, error: 'No autorizado' };

  const { message, error } = await sendMessage(conversationId, userId, text);
  if (error || !message) return { success: false, error: 'No se pudo enviar el mensaje' };
  return { success: true, message: { id: message.id, content: message.content, createdAt: message.created_at } };
}

/** Marca como leídos los mensajes recibidos en la conversación. */
export async function markStudentConversationReadAction(conversationId: string): Promise<{ success: boolean }> {
  const userId = await currentUserId();
  if (!userId) return { success: false };
  const { conversation } = await getConversationForUser(conversationId, userId);
  if (!conversation || conversation.student_id !== userId) return { success: false };
  const { error } = await markMessagesAsRead(conversationId, userId);
  return { success: !error };
}
