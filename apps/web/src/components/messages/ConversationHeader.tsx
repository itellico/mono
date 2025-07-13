'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  MoreVertical,
  Phone,
  Video,
  Search,
  Info,
  Users,
  Settings,
  Bell,
  BellOff,
  Pin,
  Archive,
  Trash2,
  LogOut,
  UserPlus,
  UserMinus,
  Shield,
  Star,
  Flag,
  Clock,
  Globe,
  Lock,
  Unlock,
  Edit,
  CheckCircle,
  CheckCheck,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Hash,
  Volume2,
  VolumeX,
  Palette,
  Image as ImageIcon,
  FileText,
  Link as LinkIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ConversationHeaderProps {
  /**
   * Conversation data
   */
  conversation: Conversation;
  /**
   * Whether to show back button
   * @default false
   */
  showBackButton?: boolean;
  /**
   * Whether to enable voice calls
   * @default true
   */
  enableVoiceCall?: boolean;
  /**
   * Whether to enable video calls
   * @default true
   */
  enableVideoCall?: boolean;
  /**
   * Whether to show participant count
   * @default true
   */
  showParticipantCount?: boolean;
  /**
   * Whether to show online status
   * @default true
   */
  showOnlineStatus?: boolean;
  /**
   * Whether to show typing indicator
   * @default true
   */
  showTypingIndicator?: boolean;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Callback when back button is clicked
   */
  onBack?: () => void;
  /**
   * Callback when voice call is initiated
   */
  onVoiceCall?: () => void;
  /**
   * Callback when video call is initiated
   */
  onVideoCall?: () => void;
  /**
   * Callback when search is clicked
   */
  onSearch?: () => void;
  /**
   * Callback when settings are updated
   */
  onUpdateSettings?: (settings: ConversationSettings) => void;
  /**
   * Callback when participant is added
   */
  onAddParticipant?: (userId: string) => void;
  /**
   * Callback when participant is removed
   */
  onRemoveParticipant?: (userId: string) => void;
  /**
   * Callback when conversation is archived
   */
  onArchive?: () => void;
  /**
   * Callback when conversation is deleted
   */
  onDelete?: () => void;
  /**
   * Callback when leaving conversation
   */
  onLeave?: () => void;
}

interface Conversation {
  id: string;
  name?: string;
  type: 'direct' | 'group' | 'support' | 'business';
  avatar?: string;
  participants: Participant[];
  settings: ConversationSettings;
  status: 'active' | 'archived' | 'blocked';
  isPinned?: boolean;
  isStarred?: boolean;
  isMuted?: boolean;
  isEncrypted?: boolean;
  lastActivity?: Date;
  createdAt: Date;
  metadata?: {
    description?: string;
    category?: string;
    tags?: string[];
    customFields?: Record<string, any>;
  };
  typingUsers?: string[];
  unreadCount?: number;
}

interface Participant {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member';
  isOnline?: boolean;
  lastSeen?: Date;
  status?: string;
  joinedAt: Date;
}

interface ConversationSettings {
  notifications: boolean;
  sound: boolean;
  theme?: string;
  wallpaper?: string;
  autoDeleteMessages?: number; // hours
  readReceipts: boolean;
  typingIndicators: boolean;
}

function ParticipantAvatar({ participant, size = 'default' }: { participant: Participant; size?: 'sm' | 'default' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    default: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <Avatar className={sizeClasses[size]}>
              <AvatarImage src={participant.avatar} alt={participant.name} />
              <AvatarFallback>{participant.name[0]}</AvatarFallback>
            </Avatar>
            {participant.isOnline && (
              <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <p className="font-medium">{participant.name}</p>
            <p className="text-muted-foreground">@{participant.username}</p>
            {participant.status && (
              <p className="text-muted-foreground mt-1">{participant.status}</p>
            )}
            <p className="text-muted-foreground mt-1">
              {participant.isOnline ? 'Online' : `Last seen ${formatDistanceToNow(participant.lastSeen || new Date())}`}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMins = Math.floor(diffInMs / 60000);
  
  if (diffInMins < 1) return 'just now';
  if (diffInMins < 60) return `${diffInMins}m ago`;
  const diffInHours = Math.floor(diffInMins / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
}

export function ConversationHeader({
  conversation,
  showBackButton = false,
  enableVoiceCall = true,
  enableVideoCall = true,
  showParticipantCount = true,
  showOnlineStatus = true,
  showTypingIndicator = true,
  className,
  onBack,
  onVoiceCall,
  onVideoCall,
  onSearch,
  onUpdateSettings,
  onAddParticipant,
  onRemoveParticipant,
  onArchive,
  onDelete,
  onLeave
}: ConversationHeaderProps) {
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showAddParticipantDialog, setShowAddParticipantDialog] = useState(false);
  const [settings, setSettings] = useState(conversation.settings);
  const [newParticipantId, setNewParticipantId] = useState('');

  const isDirectMessage = conversation.type === 'direct';
  const otherParticipant = isDirectMessage ? conversation.participants.find(p => p.id !== 'current-user-id') : null;
  const onlineCount = conversation.participants.filter(p => p.isOnline).length;
  const isGroupAdmin = conversation.participants.find(p => p.id === 'current-user-id')?.role !== 'member';

  const conversationTitle = conversation.name || 
    (isDirectMessage && otherParticipant ? otherParticipant.name : 'Conversation');

  const conversationSubtitle = () => {
    if (showTypingIndicator && conversation.typingUsers && conversation.typingUsers.length > 0) {
      const typingCount = conversation.typingUsers.length;
      return (
        <span className="text-primary animate-pulse">
          {typingCount === 1 ? 'typing...' : `${typingCount} people typing...`}
        </span>
      );
    }

    if (isDirectMessage && otherParticipant) {
      if (showOnlineStatus) {
        return otherParticipant.isOnline ? 'Online' : `Last seen ${formatDistanceToNow(otherParticipant.lastSeen || new Date())}`;
      }
      return `@${otherParticipant.username}`;
    }

    if (showParticipantCount) {
      return `${conversation.participants.length} members${showOnlineStatus ? `, ${onlineCount} online` : ''}`;
    }

    return null;
  };

  const handleUpdateSettings = () => {
    onUpdateSettings?.(settings);
    setShowSettingsDialog(false);
    toast.success('Conversation settings updated');
  };

  const handleAddParticipant = () => {
    if (newParticipantId.trim()) {
      onAddParticipant?.(newParticipantId);
      setNewParticipantId('');
      setShowAddParticipantDialog(false);
      toast.success('Participant added');
    }
  };

  const handleAction = (action: string, callback?: () => void) => {
    callback?.();
    toast.success(`Conversation ${action}`);
  };

  return (
    <>
      <Card className={cn('border-b rounded-none', className)}>
        <div className="flex items-center justify-between p-4">
          {/* Left section */}
          <div className="flex items-center gap-3 min-w-0">
            {showBackButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="flex-shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}

            {/* Avatar(s) */}
            <div className="relative flex-shrink-0">
              {isDirectMessage && otherParticipant ? (
                <ParticipantAvatar participant={otherParticipant} />
              ) : (
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={conversation.avatar} alt={conversationTitle} />
                    <AvatarFallback>
                      {conversation.type === 'group' ? <Users className="h-5 w-5" /> : conversationTitle[0]}
                    </AvatarFallback>
                  </Avatar>
                  {conversation.type === 'support' && (
                    <Badge className="absolute -bottom-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">
                      <Shield className="h-3 w-3" />
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Title and subtitle */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{conversationTitle}</h3>
                {conversation.isPinned && <Pin className="h-3 w-3 text-muted-foreground" />}
                {conversation.isStarred && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                {conversation.isMuted && <VolumeX className="h-3 w-3 text-muted-foreground" />}
                {conversation.isEncrypted && <Lock className="h-3 w-3 text-green-600" />}
              </div>
              {conversationSubtitle() && (
                <p className="text-sm text-muted-foreground">{conversationSubtitle()}</p>
              )}
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2">
            {/* Call buttons */}
            {(enableVoiceCall || enableVideoCall) && isDirectMessage && (
              <>
                {enableVoiceCall && (
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={onVoiceCall}>
                          <Phone className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Voice call</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {enableVideoCall && (
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={onVideoCall}>
                          <Video className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Video call</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <Separator orientation="vertical" className="h-6" />
              </>
            )}

            {/* Search button */}
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onSearch}>
                    <Search className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Search messages</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Info button */}
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setShowInfoDialog(true)}>
                    <Info className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Conversation info</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* More options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setShowSettingsDialog(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Conversation Settings
                </DropdownMenuItem>
                
                {!isDirectMessage && isGroupAdmin && (
                  <DropdownMenuItem onClick={() => setShowAddParticipantDialog(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Participants
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuCheckboxItem
                  checked={conversation.isPinned}
                  onCheckedChange={() => handleAction('pinned')}
                >
                  <Pin className="mr-2 h-4 w-4" />
                  Pin Conversation
                </DropdownMenuCheckboxItem>

                <DropdownMenuCheckboxItem
                  checked={conversation.isStarred}
                  onCheckedChange={() => handleAction('starred')}
                >
                  <Star className="mr-2 h-4 w-4" />
                  Star Conversation
                </DropdownMenuCheckboxItem>

                <DropdownMenuCheckboxItem
                  checked={conversation.isMuted}
                  onCheckedChange={() => handleAction('muted')}
                >
                  {conversation.isMuted ? <Volume2 className="mr-2 h-4 w-4" /> : <VolumeX className="mr-2 h-4 w-4" />}
                  {conversation.isMuted ? 'Unmute' : 'Mute'} Notifications
                </DropdownMenuCheckboxItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => handleAction('archived', onArchive)}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive Conversation
                </DropdownMenuItem>

                {!isDirectMessage && (
                  <DropdownMenuItem 
                    onClick={() => handleAction('left', onLeave)}
                    className="text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Leave Conversation
                  </DropdownMenuItem>
                )}

                {isGroupAdmin && (
                  <DropdownMenuItem 
                    onClick={() => handleAction('deleted', onDelete)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Conversation
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Status badges */}
        {(conversation.status !== 'active' || conversation.metadata?.tags) && (
          <div className="px-4 pb-3 -mt-1">
            <div className="flex items-center gap-2 flex-wrap">
              {conversation.status === 'archived' && (
                <Badge variant="secondary">
                  <Archive className="h-3 w-3 mr-1" />
                  Archived
                </Badge>
              )}
              {conversation.status === 'blocked' && (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Blocked
                </Badge>
              )}
              {conversation.metadata?.tags?.map((tag) => (
                <Badge key={tag} variant="outline">
                  <Hash className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Conversation Info Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Conversation Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Basic info */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {isDirectMessage && otherParticipant ? (
                  <ParticipantAvatar participant={otherParticipant} size="lg" />
                ) : (
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conversation.avatar} alt={conversationTitle} />
                    <AvatarFallback>
                      {conversation.type === 'group' ? <Users className="h-6 w-6" /> : conversationTitle[0]}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold">{conversationTitle}</h3>
                  <p className="text-sm text-muted-foreground">
                    {conversation.type === 'direct' ? 'Direct Message' :
                     conversation.type === 'group' ? 'Group Conversation' :
                     conversation.type === 'support' ? 'Support Thread' : 'Business Inquiry'}
                  </p>
                </div>
              </div>
              {conversation.metadata?.description && (
                <p className="text-sm text-muted-foreground">{conversation.metadata.description}</p>
              )}
            </div>

            <Separator />

            {/* Participants */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Participants ({conversation.participants.length})
              </h4>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {conversation.participants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
                      <div className="flex items-center gap-3">
                        <ParticipantAvatar participant={participant} size="sm" />
                        <div>
                          <p className="text-sm font-medium">{participant.name}</p>
                          <p className="text-xs text-muted-foreground">@{participant.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {participant.role !== 'member' && (
                          <Badge variant="secondary" className="text-xs">
                            {participant.role}
                          </Badge>
                        )}
                        {isGroupAdmin && participant.id !== 'current-user-id' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              onRemoveParticipant?.(participant.id);
                              toast.success(`${participant.name} removed from conversation`);
                            }}
                          >
                            <UserMinus className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <Separator />

            {/* Additional info */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(conversation.createdAt).toLocaleDateString()}</span>
              </div>
              {conversation.lastActivity && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last activity</span>
                  <span>{formatDistanceToNow(conversation.lastActivity)} ago</span>
                </div>
              )}
              {conversation.metadata?.category && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <Badge variant="outline">{conversation.metadata.category}</Badge>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Conversation Settings</DialogTitle>
            <DialogDescription>
              Customize your conversation experience
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications
                </Label>
                <Switch
                  id="notifications"
                  checked={settings.notifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, notifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="sound" className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Sound
                </Label>
                <Switch
                  id="sound"
                  checked={settings.sound}
                  onCheckedChange={(checked) => setSettings({ ...settings, sound: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="readReceipts" className="flex items-center gap-2">
                  <CheckCheck className="h-4 w-4" />
                  Read receipts
                </Label>
                <Switch
                  id="readReceipts"
                  checked={settings.readReceipts}
                  onCheckedChange={(checked) => setSettings({ ...settings, readReceipts: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="typingIndicators" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Typing indicators
                </Label>
                <Switch
                  id="typingIndicators"
                  checked={settings.typingIndicators}
                  onCheckedChange={(checked) => setSettings({ ...settings, typingIndicators: checked })}
                />
              </div>

              <Separator />

              <div>
                <Label htmlFor="autoDelete" className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4" />
                  Auto-delete messages after
                </Label>
                <Select
                  value={settings.autoDeleteMessages?.toString() || '0'}
                  onValueChange={(value) => setSettings({ ...settings, autoDeleteMessages: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Never</SelectItem>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                    <SelectItem value="168">7 days</SelectItem>
                    <SelectItem value="720">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSettings}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Participant Dialog */}
      <Dialog open={showAddParticipantDialog} onOpenChange={setShowAddParticipantDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Participants</DialogTitle>
            <DialogDescription>
              Add new members to this conversation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="participant">User ID or Username</Label>
              <Input
                id="participant"
                placeholder="Enter user ID or @username"
                value={newParticipantId}
                onChange={(e) => setNewParticipantId(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddParticipantDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddParticipant} disabled={!newParticipantId.trim()}>
              Add Participant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Example usage component
export function ConversationHeaderExample() {
  const mockConversation: Conversation = {
    id: '1',
    name: 'Project Team',
    type: 'group',
    avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=project',
    participants: [
      {
        id: 'current-user-id',
        name: 'You',
        username: 'you',
        role: 'admin',
        isOnline: true,
        joinedAt: new Date()
      },
      {
        id: '2',
        name: 'John Doe',
        username: 'johndoe',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
        role: 'owner',
        isOnline: true,
        joinedAt: new Date()
      },
      {
        id: '3',
        name: 'Jane Smith',
        username: 'janesmith',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
        role: 'member',
        isOnline: false,
        lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000),
        joinedAt: new Date()
      },
      {
        id: '4',
        name: 'Alice Johnson',
        username: 'alicej',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
        role: 'member',
        isOnline: true,
        status: 'In a meeting',
        joinedAt: new Date()
      }
    ],
    settings: {
      notifications: true,
      sound: true,
      readReceipts: true,
      typingIndicators: true
    },
    status: 'active',
    isPinned: true,
    isStarred: false,
    isMuted: false,
    isEncrypted: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    lastActivity: new Date(Date.now() - 10 * 60 * 1000),
    metadata: {
      description: 'Main project communication channel',
      category: 'work',
      tags: ['project', 'team', 'development']
    },
    typingUsers: ['3'],
    unreadCount: 5
  };

  const mockDirectConversation: Conversation = {
    ...mockConversation,
    id: '2',
    name: undefined,
    type: 'direct',
    participants: [
      mockConversation.participants[0],
      mockConversation.participants[1]
    ],
    metadata: undefined
  };

  const handleAction = (action: string) => {
    console.log('Action:', action);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-semibold mb-2">Conversation Header Examples</h2>
        <p className="text-muted-foreground mb-6">
          Rich conversation header with participant info and actions.
        </p>
      </div>

      <div className="space-y-6">
        {/* Group conversation header */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Group Conversation</h3>
          <Card className="overflow-hidden">
            <ConversationHeader
              conversation={mockConversation}
              showBackButton={true}
              onBack={() => handleAction('back')}
              onVoiceCall={() => handleAction('voice call')}
              onVideoCall={() => handleAction('video call')}
              onSearch={() => handleAction('search')}
              onUpdateSettings={(settings) => console.log('Update settings:', settings)}
              onAddParticipant={(userId) => console.log('Add participant:', userId)}
              onRemoveParticipant={(userId) => console.log('Remove participant:', userId)}
              onArchive={() => handleAction('archive')}
              onDelete={() => handleAction('delete')}
              onLeave={() => handleAction('leave')}
            />
          </Card>
        </div>

        {/* Direct message header */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Direct Message</h3>
          <Card className="overflow-hidden">
            <ConversationHeader
              conversation={mockDirectConversation}
              showBackButton={false}
              onVoiceCall={() => handleAction('voice call')}
              onVideoCall={() => handleAction('video call')}
              onSearch={() => handleAction('search')}
              onUpdateSettings={(settings) => console.log('Update settings:', settings)}
            />
          </Card>
        </div>

        {/* Support conversation header */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Support Thread</h3>
          <Card className="overflow-hidden">
            <ConversationHeader
              conversation={{
                ...mockConversation,
                type: 'support',
                name: 'Support Ticket #12345',
                status: 'active',
                metadata: {
                  category: 'technical',
                  tags: ['bug', 'high-priority']
                }
              }}
              enableVoiceCall={false}
              enableVideoCall={false}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ConversationHeader;