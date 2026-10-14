'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  MessageSquare,
  Send,
  Paperclip,
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  MessageSquareOff,
  Loader2,
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  senderId: string;
  isOwn: boolean;
  isRead: boolean;
  createdAt: string;
  sender?: {
    id: string;
    full_name: string;
    email: string;
    role_id: string;
    roles?: { name: string };
  };
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
  lastAdminMessage: Message;
  messages: Message[];
}

interface ConversationListItem {
  applicationId: string;
  vacancyId: string;
  vacancyTitle: string;
  departmentName: string;
  status: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface StudentMessagesPageProps {
  initialConversations: Conversation[];
  userId: string;
}

export default function StudentMessagesPage({ initialConversations, userId }: StudentMessagesPageProps) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const channelRef = useRef<any>(null);

  // Scroll to bottom helper
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Subscribe to realtime messages for the selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const channel = supabase
      .channel(`messages:${selectedConversation.applicationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `application_id=eq.${selectedConversation.applicationId}`,
        },
        (payload) => {
          const newMessage = payload.new as any;
          if (newMessage.sender_id === userId) return; // Don't duplicate own messages

          setConversations(prev => prev.map(conv => {
            if (conv.applicationId !== selectedConversation.applicationId) return conv;
            
            const newMsg = {
              id: payload.new.id,
              content: payload.new.content,
              senderId: payload.new.sender_id,
              isOwn: false,
              isRead: false,
              createdAt: payload.new.created_at,
              sender: payload.new.sender,
            };

            return {
              ...conv,
              messages: [...conv.messages, newMsg],
              lastMessage: newMsg.content,
              lastMessageTime: newMsg.createdAt,
              unreadCount: conv.unreadCount + 1,
            };
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `application_id=eq.${selectedConversation.applicationId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as any;
          setConversations(prev => prev.map(conv => {
            if (conv.applicationId !== selectedConversation.applicationId) return conv;
            return {
              ...conv,
              messages: conv.messages.map(m => 
                m.id === updatedMessage.id ? { ...m, isRead: updatedMessage.is_read } : m
              ),
            };
          }));
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation, userId]);

  // Auto-scroll when messages change
  useEffect(() => {
    if (selectedConversation) {
      scrollToBottom();
    }
  }, [selectedConversation?.messages.length, scrollToBottom]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Ahora';
    if (hours < 24) return `Hace ${hours}h`;
    if (hours < 48) return 'Ayer';
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    // Mark messages as read
    if (conv.unreadCount > 0) {
      setConversations(prev => prev.map(c => 
        c.applicationId === conv.applicationId ? { ...c, unreadCount: 0 } : c
      ));
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    setIsSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          application_id: selectedConversation.applicationId,
          sender_id: userId,
          content,
        });

      if (error) {
        console.error('Error sending message:', error);
        setNewMessage(content); // Restore message on error
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setNewMessage(content);
    } finally {
      setIsSending(false);
    }
  };

  // Empty state when no conversations
  if (conversations.length === 0) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center bg-neutral-50">
        <div className="text-center p-8 max-w-md mx-auto">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-neutral-100 flex items-center justify-center">
            <MessageSquareOff className="w-10 h-10 text-neutral-400" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">
            No tienes conversaciones activas
          </h2>
          <p className="text-neutral-600 mb-6">
            Las conversaciones se habilitarán automáticamente cuando una dependencia o la Coordinación PAT apruebe tu postulación e inicie el contacto.
          </p>
          <div className="text-sm text-neutral-500">
            <p>Cuando una dependencia te seleccione, aparecerá aquí el chat para coordinar.</p>
          </div>
        </div>
      </div>
    );
  }

  // Default to first conversation if none selected
  if (!selectedConversation && conversations.length > 0) {
    setSelectedConversation(conversations[0]);
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex overflow-hidden">
      {/* Conversations List */}
      <aside className="w-80 lg:w-96 flex-shrink-0 bg-white border-r border-neutral-200 flex flex-col">
        <div className="p-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">Mensajes</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <button
              key={conv.applicationId}
              onClick={() => handleSelectConversation(conv)}
              className={`w-full p-4 flex items-start gap-3 hover:bg-neutral-50 transition-colors border-b border-neutral-100 ${
                selectedConversation?.applicationId === conv.applicationId 
                  ? 'bg-primary/5 border-l-2 border-l-primary' 
                  : ''
              }`}
            >
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {conv.departmentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-neutral-900 truncate">{conv.vacancyTitle}</h4>
                  <span className="text-xs text-neutral-500 flex-shrink-0 ml-2">
                    {formatTime(conv.lastMessageTime || '')}
                  </span>
                </div>
                <p className="text-sm text-neutral-500 truncate">{conv.departmentName}</p>
                <p className="text-sm text-neutral-600 truncate mt-1">{conv.lastMessage}</p>
              </div>
              {conv.unreadCount > 0 && (
                <span className="flex-shrink-0 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                  {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </aside>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedConversation ? (
          <>
            <div className="flex items-center gap-4 p-4 border-b border-neutral-200 bg-white">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-base font-bold text-primary">
                    {selectedConversation.departmentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-neutral-900 truncate">{selectedConversation.vacancyTitle}</h3>
                <p className="text-sm text-neutral-500 truncate">{selectedConversation.departmentName}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  selectedConversation.status === 'aceptada' 
                    ? 'bg-success/10 text-success' 
                    : 'bg-warning/10 text-warning'
                }`}>
                  {selectedConversation.status === 'aceptada' ? 'Aceptada' : 'En entrevista'}
                </span>
                <button className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50">
              {selectedConversation.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] ${msg.isOwn ? 'bg-primary text-white' : 'bg-white text-neutral-900'} rounded-2xl px-4 py-2 shadow-sm`}>
                    <p className="text-sm">{msg.content}</p>
                    <div className={`flex items-center gap-1 mt-1 text-xs ${msg.isOwn ? 'justify-end text-primary/70' : 'justify-start text-neutral-400'}`}>
                      <span>{formatMessageTime(msg.createdAt)}</span>
                      {msg.isOwn && (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <CheckCheck className="w-3.5 h-3.5" />
                        </>
                      )}
                      {!msg.isOwn && <Clock className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>
              ))}
              <div id="messages-end" ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-neutral-200 bg-white flex items-center gap-2">
              <button 
                type="button" 
                className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100"
                disabled
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 px-4 py-2.5 rounded-full border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || isSending}
                className="p-2.5 rounded-full bg-primary text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-neutral-50">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Selecciona una conversación</h3>
              <p className="text-neutral-500">Elige un chat de la lista para comenzar a escribir</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}