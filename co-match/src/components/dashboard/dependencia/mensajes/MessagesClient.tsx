'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, MessageCircle, Send } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
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
  const searchParams = useSearchParams();
  
  const [conversations, setConversations] = useState<ConversationWithDetails[]>(initialConversations);
  const [messages, setMessages] = useState<MessageWithSender[]>(initialMessages);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(initialSelectedConversationId);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<ConversationWithDetails | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Get selected conversation
  const selectedConversation = useMemo(() => 
    conversations.find(c => c.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId);
    } else {
      setMessages([]);
    }
  }, [selectedConversationId]);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/dependencia/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    setIsLoadingMessages(true);
    try {
      const response = await fetch(`/api/dependencia/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setSearchQuery('');
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId) return;
    
    setIsSending(true);
    try {
      const response = await fetch(`/api/dependencia/conversations/${selectedConversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, messageType: 'text' }),
      });

      if (!response.ok) throw new Error('Error al enviar mensaje');

      const data = await response.json();
      
      // Optimistic update - add message to list
      setMessages(prev => [...prev, {
        ...data.message,
        is_own: true,
        sender_name: user.full_name,
        sender_avatar: null,
      }]);

      // Update conversation last message
      setConversations(prev => prev.map(c => 
        c.id === selectedConversationId 
          ? { ...c, last_message: content, last_message_at: new Date().toISOString(), last_message_by: user.id }
          : c
      ));

    } catch (error) {
      setToast({ message: 'Error al enviar mensaje', type: 'error' });
    } finally {
      setIsSending(false);
    }
  };

  const handleMarkAsRead = useCallback(async () => {
    if (!selectedConversationId) return;
    
    try {
      await fetch(`/api/dependencia/conversations/${selectedConversationId}/read`, {
        method: 'POST',
      });

      // Update local state
      setConversations(prev => prev.map(c => 
        c.id === selectedConversationId 
          ? { ...c, unread_dependency_count: 0 }
          : c
      ));

      // Mark messages as read
      setMessages(prev => prev.map(m => ({ ...m, is_read: true })));
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

  const handleContactStudent = async (conversation: ConversationWithDetails) => {
    try {
      const response = await fetch(`/api/dependencia/conversations/${conversation.id}/contact`, {
        method: 'POST',
      });
      if (response.ok) {
        setToast({ message: 'Candidato marcado como contactado', type: 'success' });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (error) {
      setToast({ message: 'Error al contactar', type: 'error' });
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