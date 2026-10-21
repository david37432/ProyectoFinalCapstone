'use client';

import { useRef, useEffect, useMemo, useState } from 'react';
import { User, GraduationCap, Award, Clock, ExternalLink, Check, CheckCheck, Paperclip, Send, MoreVertical, Star } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import type { MessageWithSender, ConversationWithDetails } from '@/lib/supabase/admin-queries';

interface ChatAreaProps {
  conversation: ConversationWithDetails | null;
  messages: MessageWithSender[];
  onSendMessage: (content: string) => void;
  onMarkAsRead: () => void;
  onViewProfile: () => void;
  onGoToTracking: () => void;
  isSending: boolean;
  currentUserId: string;
}

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDateSeparator(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return 'Hoy';
  if (isYesterday) return 'Ayer';
  return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function ChatArea({ 
  conversation, 
  messages, 
  onSendMessage, 
  onMarkAsRead,
  onViewProfile,
  onGoToTracking,
  isSending,
  currentUserId
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [newMessage, setNewMessage] = useState('');

  // Scroll to bottom on messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark as read when conversation loads
  useEffect(() => {
    if (conversation) onMarkAsRead();
  }, [conversation, onMarkAsRead]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: Record<string, MessageWithSender[]> = {};
    messages.forEach(msg => {
      const dateKey = formatDateSeparator(msg.created_at);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(msg);
    });
    return groups;
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;
    onSendMessage(newMessage.trim());
    setNewMessage('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!conversation) {
    return (
      <div className="flex flex-col h-full bg-neutral-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-neutral-900">Selecciona una conversación</h3>
            <p className="text-neutral-500 mt-1">Elige un chat de la lista para empezar a escribir</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="flex items-center gap-4 p-4 border-b border-neutral-100 bg-white sticky top-0 z-10">
        <Avatar
          src={conversation.candidate_avatar_url}
          alt={conversation.candidate_name}
          size="lg"
          fallback={conversation.candidate_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-neutral-900 truncate">{conversation.candidate_name}</h3>
            <span className={cn(
              'w-2 h-2 rounded-full',
              conversation.is_online ? 'bg-success' : 'bg-neutral-300'
            )} aria-label={conversation.is_online ? 'En línea' : 'Desconectado'} />
            <span className="text-xs text-neutral-500">
              {conversation.is_online ? 'En línea' : 'Desconectado'}
            </span>
          </div>
          <p className="text-sm text-neutral-500 truncate">{conversation.vacancy_title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onViewProfile} className="gap-1.5">
            <User className="w-4 h-4" />
            Ver perfil
          </Button>
          <Button variant="ghost" size="sm" onClick={onGoToTracking} className="gap-1.5">
            <ExternalLink className="w-4 h-4" />
            Seguimiento
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6" onClick={() => textareaRef.current?.focus()}>
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date} className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-center text-neutral-500 text-xs font-medium">
              <div className="flex-1 border-t border-neutral-200" />
              <span className="px-3 bg-white">{date}</span>
              <div className="flex-1 border-t border-neutral-200" />
            </div>
            
            {dateMessages.map((message, index) => {
              const isOwn = message.is_own;
              const showTime = index === dateMessages.length - 1 || 
                formatMessageTime(message.created_at) !== formatMessageTime(dateMessages[index + 1]?.created_at || '');
              
              return (
                <div key={message.id} className={cn('flex gap-2', isOwn ? 'justify-end' : 'justify-start')}>
                  {!isOwn && index === 0 && (
                    <Avatar
                      src={message.sender_avatar}
                      alt={message.sender_name}
                      size="sm"
                      fallback={message.sender_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      className="self-end mt-1"
                    />
                  )}
                  
                  <div className={cn(
                    'max-w-[70%] flex flex-col',
                    isOwn ? 'items-end' : 'items-start'
                  )}>
                    {!isOwn && index === 0 && (
                      <span className="text-xs text-neutral-500 mb-1 ml-1">{message.sender_name}</span>
                    )}
                    
                    <div className={cn(
                      'relative px-4 py-2 rounded-2xl',
                      isOwn 
                        ? 'bg-primary text-white rounded-tr-sm' 
                        : 'bg-neutral-100 text-neutral-900 rounded-tl-sm'
                    )}>
                      {message.message_type === 'file' && message.file_url ? (
                        <a href={message.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                          <Paperclip className="w-4 h-4" />
                          <span className="underline">{message.file_name || 'Archivo'}</span>
                        </a>
                      ) : (
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      )}
                    </div>
                    
                    <div className={cn('flex items-center gap-1.5 mt-1 text-xs', isOwn ? 'justify-end' : 'justify-start')}>
                      <span className={cn(
                        isOwn ? 'text-primary/70' : 'text-neutral-400'
                      )}>
                        {formatMessageTime(message.created_at)}
                      </span>
                      {isOwn && (
                        <span className={cn(
                          message.is_read ? 'text-success' : 'text-primary/70'
                        )}>
                          {message.is_read ? <CheckCheck className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-neutral-100 bg-white">
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="p-2"
            disabled={isSending}
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje..."
              rows={1}
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-sm max-h-32"
              style={{ minHeight: '48px' }}
              disabled={isSending}
            />
          </div>
          
          <Button
            type="submit"
            size="sm"
            disabled={!newMessage.trim() || isSending}
            className="h-10"
          >
            {isSending ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

