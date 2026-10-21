'use client';

import { Search, MessageCircle, CheckCheck, Clock, User, Briefcase } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { ConversationWithDetails } from '@/lib/supabase/admin-queries';

interface ConversationListProps {
  conversations: ConversationWithDetails[];
  selectedConversationId: string | null;
  onSelect: (conversationId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalUnread: number;
}

function formatLastMessageTime(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}

export function ConversationList({ 
  conversations, 
  selectedConversationId, 
  onSelect, 
  searchQuery, 
  onSearchChange,
  totalUnread 
}: ConversationListProps) {
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter(c => 
      c.candidate_name.toLowerCase().includes(query) ||
      c.vacancy_title.toLowerCase().includes(query) ||
      c.last_message?.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-white border-r border-neutral-200">
      {/* Header */}
      <div className="p-4 border-b border-neutral-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Mensajes
          </h2>
          {totalUnread > 0 && (
            <Badge variant="primary" className="text-xs" dot>
              {totalUnread}
            </Badge>
          )}
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar conversación..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">
            <MessageCircle className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm font-medium">No hay conversaciones</p>
            <p className="text-xs text-neutral-400 mt-1">
              {searchQuery ? 'No se encontraron resultados' : 'Los mensajes aparecerán aquí cuando los candidatos respondan'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100" role="list">
            {filteredConversations.map((conversation) => (
              <li key={conversation.id}>
                <button
                  onClick={() => onSelect(conversation.id)}
                  className={cn(
                    'w-full p-4 flex items-start gap-3 text-left transition-colors',
                    'hover:bg-neutral-50',
                    selectedConversationId === conversation.id 
                      ? 'bg-primary/5 ring-2 ring-primary/20 ring-inset' 
                      : ''
                  )}
                  aria-current={selectedConversationId === conversation.id ? 'true' : 'false'}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar
                      src={conversation.candidate_avatar_url}
                      alt={conversation.candidate_name}
                      size="lg"
                      fallback={conversation.candidate_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    />
                    <span className={cn(
                      'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white',
                      conversation.is_online ? 'bg-success' : 'bg-neutral-300'
                    )} aria-label={conversation.is_online ? 'En línea' : 'Desconectado'} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'font-medium text-sm truncate',
                          selectedConversationId === conversation.id ? 'text-primary' : 'text-neutral-900'
                        )}>
                          {conversation.candidate_name}
                        </p>
                        <p className="text-xs text-neutral-500 truncate mt-0.5 flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {conversation.vacancy_title}
                        </p>
                      </div>
                      <span className={cn(
                        'text-xs text-neutral-400 whitespace-nowrap flex-shrink-0',
                        selectedConversationId === conversation.id ? 'text-primary' : ''
                      )}>
                        {formatLastMessageTime(conversation.last_message_at)}
                      </span>
                    </div>
                    
                    {conversation.last_message && (
                      <p className={cn(
                        'text-sm truncate mt-1',
                        selectedConversationId === conversation.id ? 'text-neutral-700' : 'text-neutral-500',
                        conversation.unread_dependency_count > 0 && selectedConversationId !== conversation.id ? 'font-medium' : ''
                      )}>
                        {conversation.last_message_by === conversation.candidate_id ? '' : 'Tú: '}
                        {conversation.last_message}
                      </p>
                    )}
                    
                    {conversation.unread_dependency_count > 0 && selectedConversationId !== conversation.id && (
                      <div className="mt-1 flex items-center gap-1">
                        <Badge variant="primary" className="text-xs" dot>
                          {conversation.unread_dependency_count}
                        </Badge>
                        <span className="text-xs text-primary font-medium">nuevos</span>
                      </div>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}