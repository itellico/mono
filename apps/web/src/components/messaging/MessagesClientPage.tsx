'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MessageCircle, 
  Plus, 
  Search, 
  Send, 
  Paperclip, 
  MoreVertical,
  Archive,
  Trash2,
  Users,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { ConversationsList } from './ConversationsList';
import { MessageThread } from './MessageThread';
import { NewConversationModal } from './NewConversationModal';

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

interface MessagesData {
  conversations: ConversationSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

interface MessagesFilters {
  page: number;
  limit: number;
  search: string;
  status: 'all' | 'active' | 'archived' | 'closed' | 'blocked';
  type?: 'direct' | 'group' | 'support' | 'business';
}

interface UserContext {
  userId: string;
  adminRole: string;
  tenantId: number | null;
  permissions: string[];
}

interface MessagesClientPageProps {
  initialData: MessagesData;
  initialFilters: MessagesFilters;
  userContext: UserContext;
}

export function MessagesClientPage({ 
  initialData, 
  initialFilters, 
  userContext 
}: MessagesClientPageProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<MessagesFilters>(initialFilters);
  const [selectedConversationUuid, setSelectedConversationUuid] = useState<string | null>(null);
  const [showNewConversation, setShowNewConversation] = useState(false);

  // Fetch conversations with TanStack Query
  const { 
    data: conversationsData = initialData, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['conversations', filters],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/conversations', {
        params: filters
      });
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch conversations');
      }
      return response.data.data;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute for real-time updates
    initialData: initialData,
  });

  // Get selected conversation details
  const { 
    data: selectedConversation, 
    isLoading: isLoadingConversation 
  } = useQuery({
    queryKey: ['conversation', selectedConversationUuid],
    queryFn: async () => {
      if (!selectedConversationUuid) return null;
      
      const response = await apiClient.get(`/api/v1/conversations/${selectedConversationUuid}`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch conversation');
      }
      return response.data.data.conversation;
    },
    enabled: !!selectedConversationUuid,
    staleTime: 10 * 1000, // 10 seconds for conversation details
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationUuid, content, messageType = 'text', attachments }: {
      conversationUuid: string;
      content: string;
      messageType?: string;
      attachments?: any[];
    }) => {
      const response = await apiClient.post(`/api/v1/conversations/${conversationUuid}/messages`, {
        content,
        messageType,
        attachments,
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to send message');
      }
      
      return response.data.data.message;
    },
    onSuccess: () => {
      // Invalidate and refetch conversation data
      queryClient.invalidateQueries({ queryKey: ['conversation', selectedConversationUuid] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast({
        title: 'Message sent',
        description: 'Your message has been sent successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to send message',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (data: {
      participantIds: number[];
      subject?: string;
      type?: string;
      context?: any;
    }) => {
      const response = await apiClient.post('/api/v1/conversations', data);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create conversation');
      }
      
      return response.data.data.conversation;
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setSelectedConversationUuid(newConversation.uuid);
      setShowNewConversation(false);
      toast({
        title: 'Conversation created',
        description: 'New conversation has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create conversation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm,
      page: 1, // Reset to first page on search
    }));
  };

  const handleStatusFilter = (status: MessagesFilters['status']) => {
    setFilters(prev => ({
      ...prev,
      status,
      page: 1,
    }));
  };

  const handleSendMessage = (content: string, attachments?: any[]) => {
    if (!selectedConversationUuid || !content.trim()) return;
    
    sendMessageMutation.mutate({
      conversationUuid: selectedConversationUuid,
      content: content.trim(),
      attachments,
    });
  };

  const handleCreateConversation = (data: {
    participantIds: number[];
    subject?: string;
    type?: string;
  }) => {
    createConversationMutation.mutate(data);
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-destructive mb-4">Error Loading Messages</h2>
        <p className="text-muted-foreground mb-4">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </p>
        <Button onClick={() => refetch()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Conversations Sidebar */}
      <div className="w-1/3 min-w-[320px] border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageCircle className="h-6 w-6" />
              Messages
            </h1>
            <Button size="sm" onClick={() => setShowNewConversation(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {/* Status Filters */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {(['all', 'active', 'archived', 'closed', 'blocked'] as const).map((status) => (
              <Button
                key={status}
                variant={filters.status === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter(status)}
                className="capitalize"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-hidden">
          <ConversationsList
            conversations={conversationsData.conversations}
            selectedConversationUuid={selectedConversationUuid}
            onSelectConversation={setSelectedConversationUuid}
            isLoading={isLoading}
            pagination={conversationsData.pagination}
            onLoadMore={() => {
              if (conversationsData.pagination.hasMore) {
                setFilters(prev => ({
                  ...prev,
                  page: prev.page + 1,
                }));
              }
            }}
          />
        </div>
      </div>

      {/* Main Message Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversationUuid ? (
          <MessageThread
            conversation={selectedConversation}
            conversationUuid={selectedConversationUuid}
            isLoading={isLoadingConversation}
            onSendMessage={handleSendMessage}
            isSending={sendMessageMutation.isPending}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No conversation selected</h3>
              <p>Choose a conversation from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      <NewConversationModal
        open={showNewConversation}
        onClose={() => setShowNewConversation(false)}
        onCreateConversation={handleCreateConversation}
        isCreating={createConversationMutation.isPending}
      />
    </div>
  );
}