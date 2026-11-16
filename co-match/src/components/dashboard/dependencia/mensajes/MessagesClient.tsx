'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageCircle, Send } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';
import { uploadChatFile } from '@/lib/chat-upload';
import { ConversationList } from './ConversationList';
import { ChatArea } from './ChatArea';
import { StudentProfileModal } from './StudentProfileModal';
import type { ConversationWithDetails, MessageWithSender } from '@/lib/supabase/admin-queries';

interface MessagesClientProps {
  user: {
    id: string;
    full_name: string;
    email: string;
    role: string;
    department_name: string;
  };
  initialConversations: ConversationWithDetails[];
  initialMessages: MessageWithSender[];
  initialSelectedConversationId: string | null;
}

export function MessagesClient({
  user,
  initialConversations,
  initialMessages,
  initialSelectedConversationId
}: MessagesClientProps) {
  const router = useRouter();

  const [conversations, setConversations] = useState<ConversationWithDetails[]>(initialConversations);
  const [messages, setMessages] = useState<MessageWithSender[]>(initialMessages);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(initialSelectedConversationId);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<ConversationWithDetails | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const loadedConversationRef = useRef<string | null>(initialMessages.length > 0 ? initialSelectedConversationId : null);
  const selectedIdRef = useRef<string | null>(initialSelectedConversationId);
  const conversationsRef = useRef(conversations);
  useEffect(() => {
    conversationsRef.current = conversations;
  });

  const selectedConversation = useMemo(() =>
    conversations.find(c => c.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/dependencia/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(`/api/dependencia/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        // Ignorar respuestas de una conversación que ya no está abierta
        if (selectedIdRef.current === conversationId) setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, []);

  // Cargar los mensajes al cambiar de conversación (la primera ya llega desde el servidor)
  useEffect(() => {
    selectedIdRef.current = selectedConversationId;
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }
    if (loadedConversationRef.current === selectedConversationId) return;
    loadedConversationRef.current = selectedConversationId;
    loadMessages(selectedConversationId);
  }, [selectedConversationId, loadMessages]);

  // Tiempo real (WebSocket de Supabase): mensajes nuevos y confirmaciones de lectura.
  // RLS hace que solo lleguen eventos de las conversaciones del usuario.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`dep-messages:${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => {
        const m = payload.new;
        if (!m || m.sender_id === user.id) return; // los propios ya se agregaron al enviarlos
        const conv = conversationsRef.current.find(c => c.id === m.conversation_id);
        if (!conv) {
          loadConversations(); // conversación nueva
          return;
        }
        const preview = m.message_type === 'file' ? `📎 ${m.file_name ?? 'Archivo'}` : String(m.content ?? '');
        const isOpen = selectedIdRef.current === m.conversation_id;
        setConversations(prev => prev.map(c => c.id === m.conversation_id
          ? { ...c, last_message: preview.slice(0, 500), last_message_at: m.created_at, last_message_by: m.sender_id,
              unread_dependency_count: isOpen ? 0 : c.unread_dependency_count + 1 }
          : c));
        if (isOpen) {
          setMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, {
            id: m.id,
            conversation_id: m.conversation_id,
            sender_id: m.sender_id,
            sender_name: conv.candidate_name,
            sender_avatar: conv.candidate_avatar_url,
            content: m.content,
            message_type: m.message_type === 'file' && m.file_url ? 'file' : 'text',
            file_url: m.file_url ?? null,
            file_name: m.file_name ?? null,
            is_read: true,
            created_at: m.created_at,
            is_own: false,
          }]);
          void fetch(`/api/dependencia/conversations/${m.conversation_id}/read`, { method: 'POST' });
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload: any) => {
        const m = payload.new;
        if (m?.is_read && selectedIdRef.current === m.conversation_id) {
          setMessages(prev => prev.map(x => (x.id === m.id ? { ...x, is_read: true } : x)));
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id, loadConversations]);

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setSearchQuery('');
  };

  const appendOwnMessage = (message: MessageWithSender, preview: string) => {
    setMessages(prev => (prev.some(m => m.id === message.id) ? prev : [...prev, { ...message, is_own: true, sender_name: user.full_name }]));
    setConversations(prev => prev.map(c =>
      c.id === message.conversation_id
        ? { ...c, last_message: preview, last_message_at: new Date().toISOString(), last_message_by: user.id }
        : c
    ));
  };

  const postMessage = async (body: Record<string, unknown>, preview: string) => {
    if (!selectedConversationId) return;
    const response = await fetch(`/api/dependencia/conversations/${selectedConversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error('Error al enviar mensaje');
    const data = await response.json();
    appendOwnMessage(data.message, preview);
  };

  const handleSendMessage = async (content: string) => {
    setIsSending(true);
    try {
      await postMessage({ content, messageType: 'text' }, content);
    } catch {
      setToast({ message: 'Error al enviar mensaje', type: 'error' });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendFile = async (file: File) => {
    if (!selectedConversationId) return;
    setIsSending(true);
    try {
      const { file: uploaded, error } = await uploadChatFile(selectedConversationId, file);
      if (!uploaded) {
        setToast({ message: error ?? 'No se pudo subir el archivo', type: 'error' });
        return;
      }
      await postMessage(
        { messageType: 'file', filePath: uploaded.path, fileName: uploaded.name, fileSize: uploaded.size, content: uploaded.name },
        `📎 ${uploaded.name}`
      );
    } catch {
      setToast({ message: 'Error al enviar el archivo', type: 'error' });
    } finally {
      setIsSending(false);
    }
  };

  const handleMarkAsRead = useCallback(async () => {
    const id = selectedConversationId;
    if (!id) return;
    try {
      await fetch(`/api/dependencia/conversations/${id}/read`, { method: 'POST' });
      setConversations(prev => prev.map(c => (c.id === id ? { ...c, unread_dependency_count: 0 } : c)));
      // Solo los mensajes recibidos pasan a leídos (los propios los marca el estudiante)
      setMessages(prev => prev.map(m => (m.is_own ? m : { ...m, is_read: true })));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [selectedConversationId]);

  const handleViewProfile = () => {
    if (selectedConversation) {
      setSelectedStudent(selectedConversation);
    }
  };

  const handleGoToTracking = () => {
    if (selectedConversation) {
      router.push(`/dashboard/dependencia/seguimiento?opportunityId=${selectedConversation.vacancy_id}`);
    }
  };

  // Total unread count
  const totalUnread = useMemo(() => 
    conversations.reduce((sum, c) => sum + c.unread_dependency_count, 0),
    [conversations]
  );

  // Toast notification
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-b border-neutral-100 bg-white">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/dependencia"
            className="flex items-center gap-2 text-neutral-600 hover:text-primary transition-colors p-2 rounded-lg hover:bg-neutral-100"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium hidden sm:inline">Regresar al panel principal</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-primary" />
              Mensajes
            </h1>
            <p className="text-neutral-500 text-sm">Comunicación con candidatos postulados</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500 hidden sm:inline">
            {conversations.length} conversaciones
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Conversation List */}
        <aside className="w-full sm:w-[35%] lg:w-[380px] flex-shrink-0 hidden lg:flex flex-col">
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            onSelect={handleSelectConversation}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            totalUnread={totalUnread}
          />
        </aside>

        {/* Mobile Conversation List */}
        <div className="lg:hidden border-b border-neutral-100 bg-white">
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            onSelect={handleSelectConversation}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            totalUnread={totalUnread}
          />
        </div>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col min-w-0">
          <ChatArea
            conversation={selectedConversation}
            messages={messages}
            onSendMessage={handleSendMessage}
            onSendFile={handleSendFile}
            onMarkAsRead={handleMarkAsRead}
            onViewProfile={handleViewProfile}
            onGoToTracking={handleGoToTracking}
            isSending={isSending}
            currentUserId={user.id}
          />
        </main>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up lg:bottom-6 lg:right-6">
          <Card variant="elevated" padding="md" className="shadow-lg">
            <div className="flex items-center gap-3">
              {toast.type === 'success' ? (
                <span className="text-success">✓</span>
              ) : (
                <span className="text-danger">✕</span>
              )}
              <span className="font-medium">{toast.message}</span>
            </div>
          </Card>
        </div>
      )}

      {/* Student Profile Modal */}
      <StudentProfileModal
        student={selectedStudent}
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        onGoToTracking={handleGoToTracking}
      />
    </div>
  );
}