'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  Paperclip, 
  MoreVertical,
  Users,
  Phone,
  Video,
  Info,
  Archive,
  Trash2,
  Settings,
  Image as ImageIcon,
  File,
  Smile
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { apiClient } from '@/lib/api-client';

interface Message {
  id: number;
  uuid: string;
  content: string;
  messageType: string;
  createdAt: string;
  editedAt?: string;
  sender: {
    id: number;
    uuid: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  attachments?: Array<{
    url: string;
    filename: string;
    size: number;
    mimeType: string;
    thumbnail?: string;
  }>;
  replyTo?: {
    id: number;
    content: string;
    sender: {
      firstName: string;
      lastName: string;
    };
  };
  reactions?: Array<{
    emoji: string;
    count: number;
    users: Array<{ firstName: string; lastName: string; }>;
  }>;
  metadata?: Record<string, any>;
}

interface Conversation {
  id: number;
  uuid: string;
  subject?: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
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
  messages: Message[];
  settings?: {
    allowInvites?: boolean;
    autoArchiveAfter?: number;
    priority?: string;
  };
  context?: {
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, any>;
  };
}

interface MessageThreadProps {
  conversation: Conversation | null;
  conversationUuid: string;
  isLoading: boolean;
  onSendMessage: (content: string, attachments?: any[]) => void;
  isSending: boolean;
}

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // If less than 24 hours, show time
    if (diff < 24 * 60 * 60 * 1000) {
      return format(date, 'HH:mm');
    }
    
    // If less than a week, show day and time
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return format(date, 'EEE HH:mm');
    }
    
    // Otherwise show full date
    return format(date, 'MMM d, HH:mm');
  };

  const renderAttachments = () => {
    if (!message.attachments || message.attachments.length === 0) return null;

    return (
      <div className="mt-2 space-y-2">
        {message.attachments.map((attachment, index) => (
          <div 
            key={index}
            className="flex items-center space-x-2 p-2 border border-border rounded-md bg-background/50"
          >
            {attachment.mimeType.startsWith('image/') ? (
              <ImageIcon className="h-4 w-4 text-blue-500" />
            ) : (
              <File className="h-4 w-4 text-gray-500" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{attachment.filename}</p>
              <p className="text-xs text-muted-foreground">
                {(attachment.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                View
              </a>
            </Button>
          </div>
        ))}
      </div>
    );
  };

  const renderReplyTo = () => {
    if (!message.replyTo) return null;

    return (
      <div className="mb-2 p-2 border-l-4 border-muted bg-muted/30 rounded-r-md">
        <p className="text-xs text-muted-foreground">
          Replying to {message.replyTo.sender.firstName} {message.replyTo.sender.lastName}
        </p>
        <p className="text-sm truncate">{message.replyTo.content}</p>
      </div>
    );
  };

  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div className={cn('flex max-w-[70%]', isOwn ? 'flex-row-reverse' : 'flex-row')}>
        {!isOwn && (
          <Avatar className="h-8 w-8 mr-2">
            <AvatarImage src={message.sender.avatarUrl} />
            <AvatarFallback className="text-xs">
              {message.sender.firstName[0]}{message.sender.lastName[0]}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className={cn('space-y-1', isOwn ? 'mr-2' : 'ml-0')}>
          {!isOwn && (
            <p className="text-xs text-muted-foreground ml-1">
              {message.sender.firstName} {message.sender.lastName}
            </p>
          )}
          
          <div
            className={cn(
              'px-3 py-2 rounded-lg',
              isOwn
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {renderReplyTo()}
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
            {renderAttachments()}
            
            <div className={cn(
              'flex items-center justify-between mt-1 text-xs',
              isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}>
              <span>{formatMessageTime(message.createdAt)}</span>
              {message.editedAt && (
                <span className="italic">edited</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageComposer({ 
  onSendMessage, 
  isSending, 
  disabled 
}: { 
  onSendMessage: (content: string, attachments?: any[]) => void; 
  isSending: boolean;
  disabled?: boolean;
}) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!message.trim() || isSending || disabled) return;
    
    // TODO: Handle file attachments
    onSendMessage(message.trim());
    setMessage('');
    setAttachments([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  return (
    <div className="p-4 border-t border-border bg-background">
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div 
              key={index}
              className="flex items-center space-x-2 bg-muted p-2 rounded-md"
            >
              <File className="h-4 w-4" />
              <span className="text-sm truncate max-w-32">{file.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex items-end space-x-2">
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled || isSending}
            className="min-h-[60px] max-h-32 resize-none"
            rows={2}
          />
        </div>
        
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
          >
            <Smile className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={handleSend}
            disabled={!message.trim() || isSending || disabled}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <input
        id="file-upload"
        type="file"
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  );
}

function ConversationHeader({ conversation }: { conversation: Conversation }) {
  const getConversationTitle = () => {
    if (conversation.subject) {
      return conversation.subject;
    }
    
    if (conversation.type === 'group') {
      const names = conversation.participants
        .slice(0, 3)
        .map(p => `${p.user.firstName} ${p.user.lastName}`)
        .join(', ');
      return names + (conversation.participants.length > 3 ? '...' : '');
    }
    
    const otherParticipant = conversation.participants[0];
    if (otherParticipant) {
      return `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`;
    }
    
    return 'Conversation';
  };

  const getStatusBadge = () => {
    if (conversation.status === 'active') return null;

    const statusColors = {
      archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      closed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      blocked: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };

    return (
      <Badge variant="outline" className={cn('text-xs', statusColors[conversation.status as keyof typeof statusColors])}>
        {conversation.status}
      </Badge>
    );
  };

  return (
    <div className="p-4 border-b border-border bg-background">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex -space-x-2">
            {conversation.participants.slice(0, 3).map((participant, index) => (
              <Avatar key={participant.user.id} className="h-8 w-8 border-2 border-background">
                <AvatarImage src={participant.user.avatarUrl} />
                <AvatarFallback className="text-xs">
                  {participant.user.firstName[0]}{participant.user.lastName[0]}
                </AvatarFallback>
              </Avatar>
            ))}
            {conversation.participants.length > 3 && (
              <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                <span className="text-xs text-muted-foreground">
                  +{conversation.participants.length - 3}
                </span>
              </div>
            )}
          </div>
          
          <div>
            <h2 className="font-semibold text-lg">{getConversationTitle()}</h2>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{conversation.participants.length} participants</span>
              {getStatusBadge()}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Info className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function MessageThread({
  conversation,
  conversationUuid,
  isLoading,
  onSendMessage,
  isSending,
}: MessageThreadProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Fetch messages for the conversation
  const { 
    data: messagesData, 
    isLoading: isLoadingMessages 
  } = useQuery({
    queryKey: ['conversation-messages', conversationUuid],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/conversations/${conversationUuid}/messages`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch messages');
      }
      return response.data.data.messages;
    },
    enabled: !!conversationUuid,
    staleTime: 5 * 1000, // 5 seconds
    refetchInterval: 10 * 1000, // Refetch every 10 seconds for real-time updates
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesData && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messagesData]);

  // Get current user ID from conversation participants (placeholder logic)
  useEffect(() => {
    if (conversation && conversation.participants.length > 0) {
      // TODO: Get actual current user ID from auth context
      // For now, assume the first participant is the current user
      setCurrentUserId(conversation.participants[0]?.user.id);
    }
  }, [conversation]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={cn('flex', i % 2 === 0 ? 'justify-start' : 'justify-end')}>
              <div className={cn('flex max-w-[70%]', i % 2 === 0 ? 'flex-row' : 'flex-row-reverse')}>
                {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full mr-2" />}
                <div className="space-y-2">
                  <Skeleton className="h-16 w-48 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p>Conversation not found</p>
        </div>
      </div>
    );
  }

  const isConversationDisabled = conversation.status === 'closed' || conversation.status === 'blocked';
  const messages = messagesData || [];

  return (
    <div className="flex-1 flex flex-col">
      <ConversationHeader conversation={conversation} />
      
      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {isLoadingMessages && messages.length === 0 ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className={cn('flex', i % 2 === 0 ? 'justify-start' : 'justify-end')}>
                <div className={cn('flex max-w-[70%]', i % 2 === 0 ? 'flex-row' : 'flex-row-reverse')}>
                  {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full mr-2" />}
                  <Skeleton className="h-16 w-48 rounded-lg" />
                </div>
              </div>
            ))
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender.id === currentUserId}
              />
            ))
          )}
        </div>
      </ScrollArea>
      
      {/* Message Composer */}
      <MessageComposer
        onSendMessage={onSendMessage}
        isSending={isSending}
        disabled={isConversationDisabled}
      />
      
      {isConversationDisabled && (
        <div className="p-2 bg-muted text-center text-sm text-muted-foreground">
          This conversation is {conversation.status}. You cannot send new messages.
        </div>
      )}
    </div>
  );
}