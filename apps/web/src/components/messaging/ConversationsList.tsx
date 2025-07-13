'use client';

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Clock, 
  Users, 
  MessageCircle, 
  Archive,
  CheckCircle2,
  MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ConversationSummary {
  id: number;
  uuid: string;
  subject?: string;
  type: string;
  status: string;
  messageCount: number;
  lastMessageAt?: string;
  createdAt: string;
  participants: Array<{
    user: {
      id: number;
      uuid: string;
      firstName: string;
      lastName: string;
      avatarUrl?: string;
    };
    role: string;
    joinedAt: string;
    lastReadAt?: string;
  }>;
  lastMessage?: {
    id: number;
    content: string;
    messageType: string;
    createdAt: string;
    sender: {
      firstName: string;
      lastName: string;
    };
  };
  _count: {
    messages: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface ConversationsListProps {
  conversations: ConversationSummary[];
  selectedConversationUuid: string | null;
  onSelectConversation: (uuid: string) => void;
  isLoading: boolean;
  pagination: Pagination;
  onLoadMore: () => void;
}

function ConversationItem({ 
  conversation, 
  isSelected, 
  onClick 
}: { 
  conversation: ConversationSummary; 
  isSelected: boolean; 
  onClick: () => void; 
}) {
  const getConversationTitle = () => {
    if (conversation.subject) {
      return conversation.subject;
    }
    
    // For group conversations, show participant names
    if (conversation.type === 'group') {
      const names = conversation.participants
        .slice(0, 3)
        .map(p => `${p.user.firstName} ${p.user.lastName}`)
        .join(', ');
      return names + (conversation.participants.length > 3 ? '...' : '');
    }
    
    // For direct conversations, show the other participant's name
    const otherParticipant = conversation.participants[0];
    if (otherParticipant) {
      return `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`;
    }
    
    return 'Untitled Conversation';
  };

  const getStatusBadge = () => {
    const statusColors = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      closed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      blocked: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };

    if (conversation.status === 'active') return null;

    return (
      <Badge variant="outline" className={cn('text-xs', statusColors[conversation.status as keyof typeof statusColors])}>
        {conversation.status}
      </Badge>
    );
  };

  const getTypeIcon = () => {
    switch (conversation.type) {
      case 'group':
        return <Users className="h-3 w-3" />;
      case 'support':
        return <MessageCircle className="h-3 w-3" />;
      case 'business':
        return <MessageCircle className="h-3 w-3" />;
      default:
        return <MessageCircle className="h-3 w-3" />;
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return '';
    }
  };

  const getAvatarProps = () => {
    if (conversation.type === 'group') {
      return {
        fallback: conversation.participants.length.toString(),
        src: undefined,
      };
    }
    
    const otherParticipant = conversation.participants[0];
    if (otherParticipant) {
      return {
        fallback: `${otherParticipant.user.firstName[0]}${otherParticipant.user.lastName[0]}`,
        src: otherParticipant.user.avatarUrl,
      };
    }
    
    return {
      fallback: 'C',
      src: undefined,
    };
  };

  const { fallback, src } = getAvatarProps();

  return (
    <div
      className={cn(
        'p-3 cursor-pointer border-b border-border hover:bg-accent/50 transition-colors',
        isSelected && 'bg-accent'
      )}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={src} />
          <AvatarFallback className="text-sm">{fallback}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              {getTypeIcon()}
              <h3 className="font-medium text-sm truncate">
                {getConversationTitle()}
              </h3>
            </div>
            <div className="flex items-center space-x-1 flex-shrink-0">
              {getStatusBadge()}
              <span className="text-xs text-muted-foreground">
                {formatTime(conversation.lastMessageAt || conversation.createdAt)}
              </span>
            </div>
          </div>
          
          {conversation.lastMessage && (
            <div className="text-sm text-muted-foreground truncate mb-1">
              <span className="font-medium">
                {conversation.lastMessage.sender.firstName}:
              </span>{' '}
              {conversation.lastMessage.content}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span>{conversation.participants.length} participants</span>
              <span>•</span>
              <span>{conversation._count.messages} messages</span>
            </div>
            
            {conversation._count.messages > 0 && (
              <Badge variant="secondary" className="text-xs">
                {conversation._count.messages}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConversationSkeleton() {
  return (
    <div className="p-3 border-b border-border">
      <div className="flex items-start space-x-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-3 w-48" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-6" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConversationsList({
  conversations,
  selectedConversationUuid,
  onSelectConversation,
  isLoading,
  pagination,
  onLoadMore,
}: ConversationsListProps) {
  if (isLoading && conversations.length === 0) {
    return (
      <div className="space-y-0">
        {[...Array(8)].map((_, i) => (
          <ConversationSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center">
        <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="font-medium mb-2">No conversations yet</h3>
        <p className="text-sm text-muted-foreground">
          Start a new conversation to begin messaging
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-0">
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.uuid}
            conversation={conversation}
            isSelected={selectedConversationUuid === conversation.uuid}
            onClick={() => onSelectConversation(conversation.uuid)}
          />
        ))}
        
        {isLoading && conversations.length > 0 && (
          <div className="space-y-0">
            {[...Array(3)].map((_, i) => (
              <ConversationSkeleton key={`loading-${i}`} />
            ))}
          </div>
        )}
        
        {pagination.hasMore && !isLoading && (
          <div className="p-4">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={onLoadMore}
            >
              Load More Conversations
            </Button>
          </div>
        )}
        
        {conversations.length > 0 && (
          <div className="p-4 text-center text-xs text-muted-foreground">
            Showing {conversations.length} of {pagination.total} conversations
          </div>
        )}
      </div>
    </ScrollArea>
  );
}