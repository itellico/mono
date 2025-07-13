'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Flag,
  Eye,
  MessageSquare,
  User,
  Clock,
  Search,
  Filter,
  Ban,
  Trash2,
  FileText,
  Download,
  TrendingUp,
  Activity
} from 'lucide-react';
import { AdminOnly } from '@/components/admin/AdminOnly';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';

interface ModerationItem {
  id: number;
  type: 'message' | 'conversation' | 'user_report';
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'critical';
  reportedAt: string;
  reviewedAt?: string;
  content: {
    messageId?: number;
    conversationId: number;
    text: string;
    attachments?: Array<{
      id: number;
      type: string;
      url: string;
      fileName: string;
    }>;
  };
  reporter: {
    id: number;
    name: string;
    avatar?: string;
    role: string;
  };
  reportedUser: {
    id: number;
    name: string;
    avatar?: string;
    role: string;
    violationHistory: number;
  };
  reason: string;
  category: 'spam' | 'harassment' | 'inappropriate_content' | 'violence' | 'hate_speech' | 'fraud' | 'other';
  aiConfidence?: number;
  moderatorNotes?: string;
  reviewedBy?: {
    id: number;
    name: string;
  };
  escalationReason?: string;
  tenantId: number;
  tenantName: string;
}

// Mock data for demonstration
const mockModerationItems: ModerationItem[] = [
  {
    id: 1001,
    type: 'message',
    status: 'pending',
    priority: 'high',
    reportedAt: '2024-01-20T14:30:00Z',
    content: {
      messageId: 5001,
      conversationId: 2001,
      text: 'This message contains inappropriate language and personal attacks against other users.',
      attachments: []
    },
    reporter: {
      id: 3001,
      name: 'Sarah Johnson',
      avatar: '',
      role: 'Model'
    },
    reportedUser: {
      id: 3002,
      name: 'Mike Wilson',
      avatar: '',
      role: 'Photographer',
      violationHistory: 2
    },
    reason: 'Contains offensive language and personal attacks',
    category: 'harassment',
    aiConfidence: 87,
    tenantId: 1,
    tenantName: 'Elite Fashion Agency'
  },
  {
    id: 1002,
    type: 'message',
    status: 'pending',
    priority: 'critical',
    reportedAt: '2024-01-20T13:15:00Z',
    content: {
      messageId: 5002,
      conversationId: 2002,
      text: 'Spam message promoting external services and asking for money transfers',
      attachments: [
        {
          id: 1,
          type: 'image',
          url: '/uploads/suspicious-link.jpg',
          fileName: 'suspicious-link.jpg'
        }
      ]
    },
    reporter: {
      id: 3003,
      name: 'Auto Detection',
      avatar: '',
      role: 'System'
    },
    reportedUser: {
      id: 3004,
      name: 'Suspicious Account',
      avatar: '',
      role: 'User',
      violationHistory: 0
    },
    reason: 'Automatic detection of spam patterns and suspicious links',
    category: 'spam',
    aiConfidence: 95,
    tenantId: 1,
    tenantName: 'Elite Fashion Agency'
  },
  {
    id: 1003,
    type: 'conversation',
    status: 'escalated',
    priority: 'critical',
    reportedAt: '2024-01-20T11:45:00Z',
    reviewedAt: '2024-01-20T12:30:00Z',
    content: {
      conversationId: 2003,
      text: 'Entire conversation contains threats and intimidation',
      attachments: []
    },
    reporter: {
      id: 3005,
      name: 'Jessica Wu',
      avatar: '',
      role: 'Model'
    },
    reportedUser: {
      id: 3006,
      name: 'John Doe',
      avatar: '',
      role: 'Client',
      violationHistory: 5
    },
    reason: 'Multiple threatening messages and intimidation tactics',
    category: 'violence',
    aiConfidence: 92,
    moderatorNotes: 'Pattern of escalating threats detected. Immediate action required.',
    reviewedBy: {
      id: 4001,
      name: 'Admin User'
    },
    escalationReason: 'Serious threats requiring legal review',
    tenantId: 2,
    tenantName: 'Creative Studios Inc'
  },
  {
    id: 1004,
    type: 'message',
    status: 'approved',
    priority: 'low',
    reportedAt: '2024-01-20T10:20:00Z',
    reviewedAt: '2024-01-20T11:15:00Z',
    content: {
      messageId: 5004,
      conversationId: 2004,
      text: 'Message was reported as inappropriate but found to be within guidelines',
      attachments: []
    },
    reporter: {
      id: 3007,
      name: 'Tom Smith',
      avatar: '',
      role: 'User'
    },
    reportedUser: {
      id: 3008,
      name: 'Alice Brown',
      avatar: '',
      role: 'Designer',
      violationHistory: 0
    },
    reason: 'False positive - content within community guidelines',
    category: 'other',
    aiConfidence: 23,
    moderatorNotes: 'Reviewed content. No violation found. Message is professional and appropriate.',
    reviewedBy: {
      id: 4001,
      name: 'Admin User'
    },
    tenantId: 1,
    tenantName: 'Elite Fashion Agency'
  },
  {
    id: 1005,
    type: 'user_report',
    status: 'rejected',
    priority: 'medium',
    reportedAt: '2024-01-20T09:30:00Z',
    reviewedAt: '2024-01-20T10:45:00Z',
    content: {
      conversationId: 2005,
      text: 'User reported for general behavior, not specific content',
      attachments: []
    },
    reporter: {
      id: 3009,
      name: 'Lisa Park',
      avatar: '',
      role: 'Client'
    },
    reportedUser: {
      id: 3010,
      name: 'David Kim',
      avatar: '',
      role: 'Photographer',
      violationHistory: 1
    },
    reason: 'Report lacks specific evidence of guideline violations',
    category: 'other',
    aiConfidence: 15,
    moderatorNotes: 'Insufficient evidence provided. Request was based on personal dispute rather than community guideline violations.',
    reviewedBy: {
      id: 4002,
      name: 'Moderator Jane'
    },
    tenantId: 3,
    tenantName: 'Premium Models LLC'
  }
];

interface ModerationActionDialogProps {
  item: ModerationItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: 'approve' | 'reject' | 'escalate' | 'ban_user' | null;
  onConfirm: (notes: string, additionalAction?: string) => void;
}

function ModerationActionDialog({ 
  item, 
  open, 
  onOpenChange, 
  action, 
  onConfirm 
}: ModerationActionDialogProps) {
  const [notes, setNotes] = useState('');
  const [additionalAction, setAdditionalAction] = useState('');

  if (!item || !action) return null;

  const actionConfig = {
    approve: {
      title: 'Approve Content',
      description: 'Mark this content as approved and remove from moderation queue.',
      confirmText: 'Approve',
      variant: 'default' as const,
      requiresNotes: false
    },
    reject: {
      title: 'Reject and Remove Content',
      description: 'Remove this content and take action against the user.',
      confirmText: 'Reject',
      variant: 'destructive' as const,
      requiresNotes: true
    },
    escalate: {
      title: 'Escalate to Senior Moderator',
      description: 'Send this case to a senior moderator for review.',
      confirmText: 'Escalate',
      variant: 'default' as const,
      requiresNotes: true
    },
    ban_user: {
      title: 'Ban User Account',
      description: 'Permanently ban this user from the platform.',
      confirmText: 'Ban User',
      variant: 'destructive' as const,
      requiresNotes: true
    }
  };

  const config = actionConfig[action];

  const handleConfirm = () => {
    if (config.requiresNotes && !notes.trim()) return;
    onConfirm(notes, additionalAction);
    setNotes('');
    setAdditionalAction('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Item Summary */}
          <div className="p-3 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="capitalize">
                {item.category.replace('_', ' ')}
              </Badge>
              <Badge variant="outline">
                {item.type.replace('_', ' ')}
              </Badge>
              {item.aiConfidence && (
                <Badge variant="outline">
                  AI: {item.aiConfidence}%
                </Badge>
              )}
            </div>
            <p className="text-sm">{item.reason}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span>Reported by: {item.reporter.name}</span>
              <span>•</span>
              <span>User: {item.reportedUser.name}</span>
              {item.reportedUser.violationHistory > 0 && (
                <>
                  <span>•</span>
                  <span className="text-red-600">
                    {item.reportedUser.violationHistory} previous violations
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Moderation Notes */}
          {config.requiresNotes && (
            <div className="space-y-2">
              <Label htmlFor="notes">Moderation Notes *</Label>
              <Textarea
                id="notes"
                placeholder="Explain your decision and any actions taken..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {/* Additional Actions for Reject */}
          {action === 'reject' && (
            <div className="space-y-2">
              <Label htmlFor="additional-action">Additional Action</Label>
              <Select value={additionalAction} onValueChange={setAdditionalAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Select additional action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warning">Send Warning</SelectItem>
                  <SelectItem value="temporary_ban">Temporary Ban (7 days)</SelectItem>
                  <SelectItem value="permanent_ban">Permanent Ban</SelectItem>
                  <SelectItem value="restrict_messaging">Restrict Messaging</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant={config.variant} 
            onClick={handleConfirm}
            disabled={config.requiresNotes && !notes.trim()}
          >
            {config.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AdminMessageModerationPanel() {
  const t = useTranslations('admin-common');
  const { trackUserAction } = useAuditTracking();
  
  const [moderationItems, setModerationItems] = useState<ModerationItem[]>(mockModerationItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject' | 'escalate' | 'ban_user' | null;
  }>({ open: false, action: null });

  // Filter items based on search and filters
  const filteredItems = moderationItems.filter(item => {
    const matchesSearch = 
      item.content.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reporter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reportedUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tenantName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesPriority = selectedPriority === 'all' || item.priority === selectedPriority;

    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });

  const handleAction = (item: ModerationItem, action: 'approve' | 'reject' | 'escalate' | 'ban_user') => {
    setSelectedItem(item);
    setActionDialog({ open: true, action });
  };

  const confirmAction = (notes: string, additionalAction?: string) => {
    if (!selectedItem || !actionDialog.action) return;

    trackUserAction('moderation_action', `Moderator performed ${actionDialog.action}`, {
      itemId: selectedItem.id,
      action: actionDialog.action,
      category: selectedItem.category,
      additionalAction
    });

    // Update item status
    setModerationItems(prev => prev.map(item => {
      if (item.id === selectedItem.id) {
        const now = new Date().toISOString();
        let newStatus: ModerationItem['status'];
        
        switch (actionDialog.action) {
          case 'approve':
            newStatus = 'approved';
            break;
          case 'reject':
            newStatus = 'rejected';
            break;
          case 'escalate':
            newStatus = 'escalated';
            break;
          default:
            newStatus = item.status;
        }

        return {
          ...item,
          status: newStatus,
          reviewedAt: now,
          moderatorNotes: notes,
          reviewedBy: { id: 1, name: 'Current Admin' }, // In real app, would use actual user
          escalationReason: actionDialog.action === 'escalate' ? notes : item.escalationReason
        };
      }
      return item;
    }));

    setActionDialog({ open: false, action: null });
    setSelectedItem(null);
  };

  const getStatusBadge = (status: ModerationItem['status']) => {
    const variants = {
      pending: { variant: 'default' as const, color: 'text-blue-700 bg-blue-50 border-blue-200' },
      approved: { variant: 'default' as const, color: 'text-green-700 bg-green-50 border-green-200' },
      rejected: { variant: 'destructive' as const, color: 'text-red-700 bg-red-50 border-red-200' },
      escalated: { variant: 'default' as const, color: 'text-orange-700 bg-orange-50 border-orange-200' }
    };

    return (
      <Badge variant={variants[status].variant} className={variants[status].color}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: ModerationItem['priority']) => {
    const colors = {
      low: 'text-gray-600 bg-gray-100',
      medium: 'text-blue-600 bg-blue-100',
      high: 'text-orange-600 bg-orange-100',
      critical: 'text-red-600 bg-red-100'
    };

    return (
      <Badge variant="outline" className={colors[priority]}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const getCategoryIcon = (category: ModerationItem['category']) => {
    const icons = {
      spam: <MessageSquare className="h-4 w-4" />,
      harassment: <AlertTriangle className="h-4 w-4" />,
      inappropriate_content: <Flag className="h-4 w-4" />,
      violence: <Shield className="h-4 w-4" />,
      hate_speech: <Ban className="h-4 w-4" />,
      fraud: <AlertTriangle className="h-4 w-4" />,
      other: <FileText className="h-4 w-4" />
    };

    return icons[category];
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

  // Calculate statistics
  const stats = {
    total: moderationItems.length,
    pending: moderationItems.filter(item => item.status === 'pending').length,
    escalated: moderationItems.filter(item => item.status === 'escalated').length,
    highPriority: moderationItems.filter(item => ['high', 'critical'].includes(item.priority)).length,
    avgConfidence: moderationItems.filter(item => item.aiConfidence).reduce((sum, item) => sum + (item.aiConfidence || 0), 0) / moderationItems.filter(item => item.aiConfidence).length
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
              <Shield className="h-8 w-8 text-red-600" />
              Message Moderation
            </h1>
            <p className="text-muted-foreground mt-1">
              Review and moderate reported messages and conversations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Reports
            </Button>
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Moderation Log
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Escalated</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.escalated}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              <Flag className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.highPriority}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Confidence</CardTitle>
              <Activity className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(stats.avgConfidence || 0)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters & Search</CardTitle>
            <CardDescription>Filter moderation items by status, category, priority, or search content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search reports, users, or content..."
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
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="spam">Spam</SelectItem>
                    <SelectItem value="harassment">Harassment</SelectItem>
                    <SelectItem value="inappropriate_content">Inappropriate</SelectItem>
                    <SelectItem value="violence">Violence</SelectItem>
                    <SelectItem value="hate_speech">Hate Speech</SelectItem>
                    <SelectItem value="fraud">Fraud</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Moderation Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Moderation Queue ({filteredItems.length})</span>
              <Badge variant="outline">{moderationItems.length} total</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex flex-col gap-4 p-4 border rounded-lg transition-colors hover:bg-muted/50",
                    item.priority === 'critical' && "border-red-200 bg-red-50/50",
                    item.priority === 'high' && "border-orange-200 bg-orange-50/30"
                  )}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                        {getCategoryIcon(item.category)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">Report #{item.id}</h3>
                          <div className="flex items-center gap-1">
                            {getStatusBadge(item.status)}
                            {getPriorityBadge(item.priority)}
                            <Badge variant="outline" className="capitalize">
                              {item.category.replace('_', ' ')}
                            </Badge>
                            {item.aiConfidence && (
                              <Badge variant="outline" className="text-xs">
                                AI: {item.aiConfidence}%
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{item.tenantName}</span>
                          <span>•</span>
                          <span className="capitalize">{item.type.replace('_', ' ')}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(item.reportedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {/* Content */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Reported Content</h4>
                      <div className="p-3 border rounded-lg bg-muted/30">
                        <p className="text-sm">{item.content.text}</p>
                        {item.content.attachments && item.content.attachments.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">Attachments:</p>
                            {item.content.attachments.map((attachment) => (
                              <Badge key={attachment.id} variant="outline" className="text-xs mr-1">
                                {attachment.fileName}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        <span className="font-medium">Reason:</span> {item.reason}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Participants</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={item.reporter.avatar} />
                            <AvatarFallback>
                              {item.reporter.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{item.reporter.name}</p>
                            <p className="text-xs text-muted-foreground">Reporter • {item.reporter.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={item.reportedUser.avatar} />
                            <AvatarFallback>
                              {item.reportedUser.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{item.reportedUser.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Reported User • {item.reportedUser.role}
                              {item.reportedUser.violationHistory > 0 && (
                                <span className="text-red-600 ml-1">
                                  • {item.reportedUser.violationHistory} violations
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Moderation Notes */}
                  {item.moderatorNotes && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Moderation Notes</h4>
                      <div className="p-3 border rounded-lg bg-blue-50/50">
                        <p className="text-sm">{item.moderatorNotes}</p>
                        {item.reviewedBy && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Reviewed by {item.reviewedBy.name} on {item.reviewedAt && new Date(item.reviewedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {item.status === 'pending' && (
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(item, 'approve')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleAction(item, 'reject')}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(item, 'escalate')}
                      >
                        <TrendingUp className="h-4 w-4 mr-1" />
                        Escalate
                      </Button>
                      {item.reportedUser.violationHistory > 2 && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleAction(item, 'ban_user')}
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Ban User
                        </Button>
                      )}
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4 mr-1" />
                        View Full
                      </Button>
                    </div>
                  )}
                </div>
              ))}

              {filteredItems.length === 0 && (
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No moderation items found</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery || selectedStatus !== 'all' || selectedCategory !== 'all' || selectedPriority !== 'all'
                      ? 'Try adjusting your filters or search terms.'
                      : 'No items require moderation at this time.'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Dialog */}
        <ModerationActionDialog
          item={selectedItem}
          open={actionDialog.open}
          onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}
          action={actionDialog.action}
          onConfirm={confirmAction}
        />
      </div>
    </AdminOnly>
  );
}

export default AdminMessageModerationPanel;