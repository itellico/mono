'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MessageSquare,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Archive,
  Trash2,
  Shield,
  Users,
  Clock,
  AlertTriangle,
  Ban,
  CheckCircle,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import { AdminOnly } from '@/components/admin/AdminOnly';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';

interface Conversation {
  id: number;
  type: 'direct' | 'group' | 'support' | 'business';
  status: 'active' | 'archived' | 'closed' | 'blocked';
  subject?: string;
  participantCount: number;
  messageCount: number;
  lastMessageAt: string;
  lastMessage: {
    content: string;
    senderName: string;
    senderId: number;
  };
  participants: Array<{
    id: number;
    name: string;
    avatar?: string;
    role?: string;
    isOnline?: boolean;
  }>;
  createdAt: string;
  tags: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  flagged: boolean;
  tenantId: number;
  tenantName: string;
}

// Mock data for demonstration
const mockConversations: Conversation[] = [
  {
    id: 1001,
    type: 'direct',
    status: 'active',
    participantCount: 2,
    messageCount: 45,
    lastMessageAt: '2024-01-20T15:30:00Z',
    lastMessage: {
      content: 'Thanks for the quick response! When can we schedule the photoshoot?',
      senderName: 'Sarah Johnson',
      senderId: 2001
    },
    participants: [
      { id: 2001, name: 'Sarah Johnson', avatar: '', role: 'Model', isOnline: true },
      { id: 2002, name: 'Mike Chen', avatar: '', role: 'Photographer', isOnline: false }
    ],
    createdAt: '2024-01-18T10:00:00Z',
    tags: ['photography', 'booking'],
    priority: 'normal',
    flagged: false,
    tenantId: 1,
    tenantName: 'Elite Fashion Agency'
  },
  {
    id: 1002,
    type: 'support',
    status: 'active',
    subject: 'Payment Issue - Invoice #12345',
    participantCount: 3,
    messageCount: 12,
    lastMessageAt: '2024-01-20T14:15:00Z',
    lastMessage: {
      content: 'I\'ve escalated this to our billing team. You should receive a response within 24 hours.',
      senderName: 'Support Agent',
      senderId: 3001
    },
    participants: [
      { id: 4001, name: 'Jessica Wu', avatar: '', role: 'Client', isOnline: true },
      { id: 3001, name: 'Support Agent', avatar: '', role: 'Support', isOnline: true },
      { id: 3002, name: 'Billing Specialist', avatar: '', role: 'Support', isOnline: false }
    ],
    createdAt: '2024-01-20T09:30:00Z',
    tags: ['billing', 'urgent'],
    priority: 'high',
    flagged: true,
    tenantId: 1,
    tenantName: 'Elite Fashion Agency'
  },
  {
    id: 1003,
    type: 'group',
    status: 'active',
    subject: 'Summer Campaign Planning',
    participantCount: 8,
    messageCount: 127,
    lastMessageAt: '2024-01-20T13:45:00Z',
    lastMessage: {
      content: 'Can everyone confirm availability for next Tuesday\'s meeting?',
      senderName: 'Emily Davis',
      senderId: 5001
    },
    participants: [
      { id: 5001, name: 'Emily Davis', avatar: '', role: 'Creative Director', isOnline: true },
      { id: 5002, name: 'Alex Rodriguez', avatar: '', role: 'Account Manager', isOnline: true },
      { id: 5003, name: 'Lisa Park', avatar: '', role: 'Designer', isOnline: false }
    ],
    createdAt: '2024-01-15T14:00:00Z',
    tags: ['campaign', 'planning', 'creative'],
    priority: 'normal',
    flagged: false,
    tenantId: 2,
    tenantName: 'Creative Studios Inc'
  },
  {
    id: 1004,
    type: 'business',
    status: 'closed',
    subject: 'Contract Negotiation - Fashion Week',
    participantCount: 4,
    messageCount: 89,
    lastMessageAt: '2024-01-19T16:20:00Z',
    lastMessage: {
      content: 'Contract signed and terms agreed. Looking forward to working together!',
      senderName: 'David Kim',
      senderId: 6001
    },
    participants: [
      { id: 6001, name: 'David Kim', avatar: '', role: 'Agency Owner', isOnline: false },
      { id: 6002, name: 'Maria Santos', avatar: '', role: 'Legal Counsel', isOnline: false },
      { id: 6003, name: 'John Smith', avatar: '', role: 'Client', isOnline: false }
    ],
    createdAt: '2024-01-10T11:00:00Z',
    tags: ['contract', 'negotiation', 'fashion-week'],
    priority: 'high',
    flagged: false,
    tenantId: 3,
    tenantName: 'Premium Models LLC'
  },
  {
    id: 1005,
    type: 'direct',
    status: 'blocked',
    participantCount: 2,
    messageCount: 8,
    lastMessageAt: '2024-01-19T11:30:00Z',
    lastMessage: {
      content: '[Message blocked due to inappropriate content]',
      senderName: 'System',
      senderId: 0
    },
    participants: [
      { id: 7001, name: 'Blocked User', avatar: '', role: 'User', isOnline: false },
      { id: 7002, name: 'Tom Wilson', avatar: '', role: 'Model', isOnline: true }
    ],
    createdAt: '2024-01-19T10:00:00Z',
    tags: ['blocked', 'inappropriate'],
    priority: 'urgent',
    flagged: true,
    tenantId: 1,
    tenantName: 'Elite Fashion Agency'
  }
];

interface ConversationActionsDialogProps {
  conversation: Conversation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: 'archive' | 'delete' | 'block' | 'unblock' | null;
  onConfirm: () => void;
}

function ConversationActionsDialog({ 
  conversation, 
  open, 
  onOpenChange, 
  action, 
  onConfirm 
}: ConversationActionsDialogProps) {
  if (!conversation || !action) return null;

  const actionConfig = {
    archive: {
      title: 'Archive Conversation',
      description: 'This conversation will be archived and hidden from the active list. You can restore it later if needed.',
      confirmText: 'Archive',
      variant: 'default' as const
    },
    delete: {
      title: 'Delete Conversation',
      description: 'This action cannot be undone. All messages in this conversation will be permanently deleted.',
      confirmText: 'Delete',
      variant: 'destructive' as const
    },
    block: {
      title: 'Block Conversation',
      description: 'This conversation will be blocked. No new messages can be sent and existing messages will be hidden.',
      confirmText: 'Block',
      variant: 'destructive' as const
    },
    unblock: {
      title: 'Unblock Conversation',
      description: 'This conversation will be unblocked and participants can resume messaging.',
      confirmText: 'Unblock',
      variant: 'default' as const
    }
  };

  const config = actionConfig[action];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                Conversation #{conversation.id}
                {conversation.subject && ` - ${conversation.subject}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {conversation.participantCount} participants • {conversation.messageCount} messages
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant={config.variant} onClick={onConfirm}>
            {config.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AdminConversationsList() {
  const t = useTranslations('admin-common');
  const { trackUserAction } = useAuditTracking();
  
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: 'archive' | 'delete' | 'block' | 'unblock' | null;
  }>({ open: false, action: null });

  // Filter conversations based on search and filters
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = 
      conv.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.participants.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      conv.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = selectedStatus === 'all' || conv.status === selectedStatus;
    const matchesType = selectedType === 'all' || conv.type === selectedType;
    const matchesPriority = selectedPriority === 'all' || conv.priority === selectedPriority;

    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  const handleAction = (conversation: Conversation, action: 'archive' | 'delete' | 'block' | 'unblock') => {
    setSelectedConversation(conversation);
    setActionDialog({ open: true, action });
  };

  const confirmAction = () => {
    if (!selectedConversation || !actionDialog.action) return;

    trackUserAction('admin_conversation_action', `Admin performed ${actionDialog.action} on conversation`, {
      conversationId: selectedConversation.id,
      action: actionDialog.action,
      type: selectedConversation.type
    });

    // Update conversation status based on action
    setConversations(prev => prev.map(conv => {
      if (conv.id === selectedConversation.id) {
        switch (actionDialog.action) {
          case 'archive':
            return { ...conv, status: 'archived' as const };
          case 'delete':
            return { ...conv, status: 'closed' as const }; // In real app, would remove from list
          case 'block':
            return { ...conv, status: 'blocked' as const };
          case 'unblock':
            return { ...conv, status: 'active' as const };
          default:
            return conv;
        }
      }
      return conv;
    }));

    setActionDialog({ open: false, action: null });
    setSelectedConversation(null);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => setIsLoading(false), 1000);
  };

  const getStatusBadge = (status: Conversation['status']) => {
    const variants = {
      active: { variant: 'default' as const, color: 'text-green-700 bg-green-50 border-green-200' },
      archived: { variant: 'secondary' as const, color: 'text-gray-700 bg-gray-50 border-gray-200' },
      closed: { variant: 'outline' as const, color: 'text-blue-700 bg-blue-50 border-blue-200' },
      blocked: { variant: 'destructive' as const, color: 'text-red-700 bg-red-50 border-red-200' }
    };

    return (
      <Badge variant={variants[status].variant} className={variants[status].color}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: Conversation['priority']) => {
    const colors = {
      low: 'text-gray-600 bg-gray-100',
      normal: 'text-blue-600 bg-blue-100',
      high: 'text-orange-600 bg-orange-100',
      urgent: 'text-red-600 bg-red-100'
    };

    return (
      <Badge variant="outline" className={colors[priority]}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const getTypeIcon = (type: Conversation['type']) => {
    const icons = {
      direct: <Users className="h-4 w-4" />,
      group: <Users className="h-4 w-4" />,
      support: <Shield className="h-4 w-4" />,
      business: <MessageSquare className="h-4 w-4" />
    };

    return icons[type];
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <AdminOnly fallback={
      <div className="text-center py-12">
        <p className="text-gray-600">Access denied. Admin permissions required.</p>
      </div>
    }>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              Platform Conversations
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and monitor all conversations across the platform
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters & Search</CardTitle>
            <CardDescription>Filter conversations by status, type, priority, or search content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations, participants, or content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="direct">Direct</SelectItem>
                    <SelectItem value="group">Group</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversations List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Conversations ({filteredConversations.length})</span>
              <Badge variant="outline">{conversations.length} total</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={cn(
                    "flex items-center justify-between p-4 border rounded-lg transition-colors hover:bg-muted/50",
                    conversation.flagged && "border-red-200 bg-red-50/50"
                  )}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Type Icon */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                      {getTypeIcon(conversation.type)}
                    </div>

                    {/* Conversation Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">
                          {conversation.subject || `Conversation #${conversation.id}`}
                        </h3>
                        {conversation.flagged && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                        <div className="flex items-center gap-1">
                          {getStatusBadge(conversation.status)}
                          {getPriorityBadge(conversation.priority)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <span className="capitalize">{conversation.type}</span>
                        <span>•</span>
                        <span>{conversation.participantCount} participants</span>
                        <span>•</span>
                        <span>{conversation.messageCount} messages</span>
                        <span>•</span>
                        <span>{conversation.tenantName}</span>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex -space-x-2">
                          {conversation.participants.slice(0, 3).map((participant) => (
                            <Avatar key={participant.id} className="w-6 h-6 border-2 border-background">
                              <AvatarImage src={participant.avatar} />
                              <AvatarFallback className="text-xs">
                                {participant.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {conversation.participantCount > 3 && (
                            <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                              <span className="text-xs">+{conversation.participantCount - 3}</span>
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {conversation.participants.slice(0, 2).map(p => p.name).join(', ')}
                          {conversation.participantCount > 2 && ` +${conversation.participantCount - 2} more`}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground truncate">
                        <span className="font-medium">{conversation.lastMessage.senderName}:</span> {conversation.lastMessage.content}
                      </p>

                      {conversation.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {conversation.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {conversation.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{conversation.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="text-xs text-muted-foreground text-right">
                      <div className="flex items-center gap-1 mb-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(conversation.lastMessageAt)}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-2">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => trackUserAction('view_conversation', 'Admin viewed conversation details')}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {conversation.status === 'active' && (
                        <DropdownMenuItem onClick={() => handleAction(conversation, 'archive')}>
                          <Archive className="mr-2 h-4 w-4" />
                          Archive
                        </DropdownMenuItem>
                      )}
                      {conversation.status === 'blocked' ? (
                        <DropdownMenuItem onClick={() => handleAction(conversation, 'unblock')}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Unblock
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem 
                          onClick={() => handleAction(conversation, 'block')}
                          className="text-orange-600"
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Block
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleAction(conversation, 'delete')}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}

              {filteredConversations.length === 0 && (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No conversations found</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery || selectedStatus !== 'all' || selectedType !== 'all' || selectedPriority !== 'all'
                      ? 'Try adjusting your filters or search terms.'
                      : 'No conversations have been created yet.'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Confirmation Dialog */}
        <ConversationActionsDialog
          conversation={selectedConversation}
          open={actionDialog.open}
          onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}
          action={actionDialog.action}
          onConfirm={confirmAction}
        />
      </div>
    </AdminOnly>
  );
}

export default AdminConversationsList;