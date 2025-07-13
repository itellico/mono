'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import {
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  MoreHorizontal,
  Reply,
  Edit,
  Copy,
  Forward,
  Pin,
  Star,
  Trash2,
  Download,
  Play,
  Pause,
  Volume2,
  Eye,
  EyeOff,
  Shield,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  File,
  Link as LinkIcon,
  MapPin,
  Calendar,
  Users,
  Hash,
  Quote,
  RefreshCw,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Smile,
  Info
} from 'lucide-react';
import { cn, formatDistanceToNow } from '@/lib/utils';
import { toast } from 'sonner';

interface MessageBubbleProps {
  /**
   * Message data
   */
  message: Message;
  /**
   * Whether this is the current user's message
   * @default false
   */
  isOwn?: boolean;
  /**
   * Whether to show avatar
   * @default true
   */
  showAvatar?: boolean;
  /**
   * Whether to show timestamp
   * @default true
   */
  showTimestamp?: boolean;
  /**
   * Whether to show delivery status
   * @default true
   */
  showDeliveryStatus?: boolean;
  /**
   * Whether to show read receipts
   * @default true
   */
  showReadReceipts?: boolean;
  /**
   * Whether to enable reactions
   * @default true
   */
  enableReactions?: boolean;
  /**
   * Whether to enable actions menu
   * @default true
   */
  enableActions?: boolean;
  /**
   * Whether the message is selected
   * @default false
   */
  isSelected?: boolean;
  /**
   * Whether the message is highlighted
   * @default false
   */
  isHighlighted?: boolean;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Callback when message is clicked
   */
  onClick?: () => void;
  /**
   * Callback when reply is clicked
   */
  onReply?: () => void;
  /**
   * Callback when edit is clicked
   */
  onEdit?: () => void;
  /**
   * Callback when delete is clicked
   */
  onDelete?: () => void;
  /**
   * Callback when forward is clicked
   */
  onForward?: () => void;
  /**
   * Callback when reaction is added
   */
  onReaction?: (emoji: string) => void;
  /**
   * Callback when attachment is downloaded
   */
  onDownloadAttachment?: (attachment: Attachment) => void;
}

interface Message {
  id: string;
  content: string;
  formattedContent?: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
    isOnline?: boolean;
  };
  createdAt: Date;
  updatedAt?: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  attachments?: Attachment[];
  reactions?: Reaction[];
  replyTo?: {
    id: string;
    content: string;
    authorName: string;
  };
  mentions?: string[];
  isEdited?: boolean;
  isDeleted?: boolean;
  isPinned?: boolean;
  isStarred?: boolean;
  isEncrypted?: boolean;
  isVoiceMessage?: boolean;
  voiceDuration?: number;
  metadata?: {
    location?: { lat: number; lng: number; name: string };
    event?: { title: string; date: Date; location: string };
    poll?: { question: string; options: string[]; votes: Record<string, string[]> };
  };
  readBy?: ReadReceipt[];
  deliveredTo?: string[];
}

interface Attachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
  url: string;
  name: string;
  size: number;
  mimeType: string;
  thumbnail?: string;
  duration?: number; // For audio/video
  dimensions?: { width: number; height: number }; // For images/video
}

interface Reaction {
  emoji: string;
  users: string[];
  count: number;
}

interface ReadReceipt {
  userId: string;
  userName: string;
  readAt: Date;
}

const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

function MessageStatus({ status, showReadReceipts, readBy }: { 
  status: Message['status']; 
  showReadReceipts: boolean;
  readBy?: ReadReceipt[];
}) {
  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-muted-foreground animate-pulse" />;
      case 'sent':
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-600" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-destructive" />;
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1">
            {getStatusIcon()}
            {showReadReceipts && readBy && readBy.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {readBy.length}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            {status === 'sending' && 'Sending...'}
            {status === 'sent' && 'Sent'}
            {status === 'delivered' && 'Delivered'}
            {status === 'read' && (
              <>
                <p>Read</p>
                {showReadReceipts && readBy && readBy.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {readBy.slice(0, 3).map((receipt) => (
                      <p key={receipt.userId} className="text-muted-foreground">
                        {receipt.userName} • {formatDistanceToNow(receipt.readAt)}
                      </p>
                    ))}
                    {readBy.length > 3 && (
                      <p className="text-muted-foreground">
                        +{readBy.length - 3} more
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
            {status === 'failed' && 'Failed to send'}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function AttachmentPreview({ 
  attachment, 
  onDownload 
}: { 
  attachment: Attachment; 
  onDownload?: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const media = attachment.type === 'audio' ? audioRef.current : videoRef.current;
    if (!media) return;

    const updateProgress = () => {
      if (media.duration) {
        setProgress((media.currentTime / media.duration) * 100);
      }
    };

    media.addEventListener('timeupdate', updateProgress);
    media.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      media.removeEventListener('timeupdate', updateProgress);
      media.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, [attachment.type]);

  const togglePlayPause = () => {
    const media = attachment.type === 'audio' ? audioRef.current : videoRef.current;
    if (!media) return;

    if (isPlaying) {
      media.pause();
    } else {
      media.play();
    }
    setIsPlaying(!isPlaying);
  };

  switch (attachment.type) {
    case 'image':
      return (
        <div className="relative group">
          <img
            src={attachment.url}
            alt={attachment.name}
            className="rounded-lg max-w-sm max-h-64 object-cover cursor-pointer"
            onClick={() => window.open(attachment.url, '_blank')}
          />
          <Button
            variant="secondary"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onDownload?.();
            }}
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      );

    case 'video':
      return (
        <div className="relative group">
          <video
            ref={videoRef}
            src={attachment.url}
            className="rounded-lg max-w-sm max-h-64"
            controls={false}
            onClick={togglePlayPause}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full"
              onClick={togglePlayPause}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent">
            <Progress value={progress} className="h-1" />
            {attachment.duration && (
              <span className="text-xs text-white">
                {formatDuration(attachment.duration)}
              </span>
            )}
          </div>
        </div>
      );

    case 'audio':
      return (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <audio ref={audioRef} src={attachment.url} />
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={togglePlayPause}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{attachment.name}</span>
              <Volume2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <Progress value={progress} className="h-1" />
            {attachment.duration && (
              <span className="text-xs text-muted-foreground">
                {formatDuration(attachment.duration)}
              </span>
            )}
          </div>
        </div>
      );

    case 'document':
      return (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg group">
          <FileText className="h-8 w-8 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{attachment.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onDownload}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      );

    default:
      return (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg group">
          <File className="h-8 w-8 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{attachment.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onDownload}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      );
  }
}

export function MessageBubble({
  message,
  isOwn = false,
  showAvatar = true,
  showTimestamp = true,
  showDeliveryStatus = true,
  showReadReceipts = true,
  enableReactions = true,
  enableActions = true,
  isSelected = false,
  isHighlighted = false,
  className,
  onClick,
  onReply,
  onEdit,
  onDelete,
  onForward,
  onReaction,
  onDownloadAttachment
}: MessageBubbleProps) {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    toast.success('Message copied to clipboard');
  };

  const handleReaction = (emoji: string) => {
    onReaction?.(emoji);
    setShowReactionPicker(false);
  };

  const renderContent = () => {
    if (message.isDeleted) {
      return (
        <p className="text-sm text-muted-foreground italic">
          This message was deleted
        </p>
      );
    }

    // Voice message
    if (message.isVoiceMessage && message.attachments?.[0]) {
      return (
        <AttachmentPreview
          attachment={message.attachments[0]}
          onDownload={() => onDownloadAttachment?.(message.attachments![0])}
        />
      );
    }

    // Regular content with formatting
    return (
      <div className="space-y-2">
        {message.formattedContent ? (
          <div 
            className="text-sm whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: message.formattedContent }}
          />
        ) : (
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        )}

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="space-y-2 mt-2">
            {message.attachments.map((attachment) => (
              <AttachmentPreview
                key={attachment.id}
                attachment={attachment}
                onDownload={() => onDownloadAttachment?.(attachment)}
              />
            ))}
          </div>
        )}

        {/* Metadata */}
        {message.metadata?.location && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded-lg text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{message.metadata.location.name}</span>
          </div>
        )}

        {message.metadata?.event && (
          <div className="p-3 bg-muted rounded-lg space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              {message.metadata.event.title}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(message.metadata.event.date).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {message.metadata.event.location}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        'group relative flex gap-3 px-4 py-2 transition-colors',
        isOwn && 'flex-row-reverse',
        isSelected && 'bg-accent/50',
        isHighlighted && 'bg-yellow-100/50 dark:bg-yellow-900/20',
        isHovered && 'bg-accent/20',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Avatar */}
      {showAvatar && !isOwn && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={message.author.avatar} alt={message.author.name} />
          <AvatarFallback>{message.author.name[0]}</AvatarFallback>
          {message.author.isOnline && (
            <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
          )}
        </Avatar>
      )}

      {/* Message content */}
      <div className={cn(
        'flex flex-col gap-1 max-w-[70%]',
        isOwn && 'items-end'
      )}>
        {/* Author name (for group chats) */}
        {!isOwn && showAvatar && (
          <span className="text-xs font-medium text-muted-foreground">
            {message.author.name}
          </span>
        )}

        {/* Reply indicator */}
        {message.replyTo && (
          <div className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg border-l-2 border-primary/30 mb-1">
            <Quote className="h-3 w-3 text-muted-foreground mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium">{message.replyTo.authorName}</p>
              <p className="text-xs text-muted-foreground truncate">
                {message.replyTo.content}
              </p>
            </div>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            'relative rounded-2xl px-4 py-2 shadow-sm',
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted rounded-bl-sm',
            message.isEncrypted && 'ring-1 ring-green-500/30'
          )}
        >
          {/* Encryption indicator */}
          {message.isEncrypted && (
            <div className="flex items-center gap-1 text-xs mb-1 opacity-70">
              <Shield className="h-3 w-3" />
              <span>Encrypted</span>
            </div>
          )}

          {/* Pinned indicator */}
          {message.isPinned && (
            <Pin className="absolute -top-2 -right-2 h-4 w-4 text-primary rotate-45" />
          )}

          {/* Content */}
          {renderContent()}

          {/* Edited indicator */}
          {message.isEdited && !message.isDeleted && (
            <span className="text-xs opacity-60 ml-1">(edited)</span>
          )}
        </div>

        {/* Message info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {showTimestamp && (
            <span>{formatDistanceToNow(message.createdAt)} ago</span>
          )}
          {isOwn && showDeliveryStatus && (
            <MessageStatus 
              status={message.status} 
              showReadReceipts={showReadReceipts}
              readBy={message.readBy}
            />
          )}
          {message.isStarred && (
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          )}
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {message.reactions.map((reaction) => (
              <Button
                key={reaction.emoji}
                variant="ghost"
                size="sm"
                className={cn(
                  'h-6 px-2 text-xs',
                  reaction.users.includes('current-user-id') && 'bg-primary/20'
                )}
                onClick={() => handleReaction(reaction.emoji)}
              >
                <span className="mr-1">{reaction.emoji}</span>
                <span>{reaction.count}</span>
              </Button>
            ))}
            {enableReactions && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setShowReactionPicker(true)}
              >
                <Smile className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Quick actions (visible on hover) */}
      {enableActions && !message.isDeleted && (
        <div className={cn(
          'absolute flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
          isOwn ? 'left-2 top-2' : 'right-2 top-2'
        )}>
          {/* Quick reactions */}
          {enableReactions && showReactionPicker && (
            <Card className="absolute top-full mt-1 p-2 z-50">
              <div className="flex gap-1">
                {quickReactions.map((emoji) => (
                  <Button
                    key={emoji}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleReaction(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </Card>
          )}

          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setShowReactionPicker(!showReactionPicker)}
                >
                  <Smile className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>React</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={onReply}
                >
                  <Reply className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reply</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* More actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isOwn ? 'start' : 'end'}>
              {isOwn && (
                <>
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={handleCopyMessage}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onForward}>
                <Forward className="mr-2 h-4 w-4" />
                Forward
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {}}>
                <Pin className="mr-2 h-4 w-4" />
                Pin
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {}}>
                <Star className="mr-2 h-4 w-4" />
                Star
              </DropdownMenuItem>
              {showReadReceipts && message.readBy && message.readBy.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {}}>
                    <Eye className="mr-2 h-4 w-4" />
                    Read by {message.readBy.length}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}

// Example usage component
export function MessageBubbleExample() {
  const mockMessages: Message[] = [
    {
      id: '1',
      content: 'Hey! How are you doing today?',
      author: {
        id: '1',
        name: 'John Doe',
        username: 'johndoe',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
        isOnline: true
      },
      createdAt: new Date(Date.now() - 5 * 60 * 1000),
      status: 'read',
      readBy: [
        { userId: '2', userName: 'You', readAt: new Date(Date.now() - 3 * 60 * 1000) }
      ]
    },
    {
      id: '2',
      content: "I'm doing great, thanks! Just finished working on the new messaging components. Check out this image:",
      author: {
        id: '2',
        name: 'You',
        username: 'you',
      },
      createdAt: new Date(Date.now() - 3 * 60 * 1000),
      status: 'delivered',
      attachments: [
        {
          id: 'att-1',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=400',
          name: 'project-screenshot.png',
          size: 245000,
          mimeType: 'image/png',
          dimensions: { width: 800, height: 600 }
        }
      ]
    },
    {
      id: '3',
      content: 'Wow, that looks amazing! 🎉',
      author: {
        id: '1',
        name: 'John Doe',
        username: 'johndoe',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
        isOnline: true
      },
      createdAt: new Date(Date.now() - 2 * 60 * 1000),
      status: 'read',
      reactions: [
        { emoji: '❤️', users: ['2'], count: 1 },
        { emoji: '👍', users: ['2', '3'], count: 2 }
      ]
    },
    {
      id: '4',
      content: 'Here\'s a voice message about the project:',
      author: {
        id: '2',
        name: 'You',
        username: 'you',
      },
      createdAt: new Date(Date.now() - 1 * 60 * 1000),
      status: 'sent',
      isVoiceMessage: true,
      voiceDuration: 15,
      attachments: [
        {
          id: 'att-2',
          type: 'audio',
          url: '/placeholder-audio.mp3',
          name: 'Voice Message',
          size: 123456,
          mimeType: 'audio/mpeg',
          duration: 15
        }
      ]
    },
    {
      id: '5',
      content: 'This message was edited',
      author: {
        id: '1',
        name: 'John Doe',
        username: 'johndoe',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
        isOnline: true
      },
      createdAt: new Date(Date.now() - 30 * 1000),
      updatedAt: new Date(Date.now() - 10 * 1000),
      status: 'read',
      isEdited: true,
      replyTo: {
        id: '2',
        content: "I'm doing great, thanks! Just finished working on the new messaging components.",
        authorName: 'You'
      }
    },
    {
      id: '6',
      content: 'Meeting tomorrow at 3 PM',
      author: {
        id: '2',
        name: 'You',
        username: 'you',
      },
      createdAt: new Date(Date.now() - 10 * 1000),
      status: 'sending',
      metadata: {
        event: {
          title: 'Project Review Meeting',
          date: new Date(Date.now() + 24 * 60 * 60 * 1000),
          location: 'Conference Room A'
        }
      }
    }
  ];

  const handleReaction = (messageId: string, emoji: string) => {
    console.log('Reaction added:', { messageId, emoji });
  };

  const handleReply = (messageId: string) => {
    console.log('Reply to message:', messageId);
  };

  const handleEdit = (messageId: string) => {
    console.log('Edit message:', messageId);
  };

  const handleDelete = (messageId: string) => {
    console.log('Delete message:', messageId);
  };

  const handleForward = (messageId: string) => {
    console.log('Forward message:', messageId);
  };

  const handleDownloadAttachment = (attachment: Attachment) => {
    console.log('Download attachment:', attachment);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-semibold mb-2">Message Bubble Examples</h2>
        <p className="text-muted-foreground mb-6">
          Rich message display with reactions, attachments, and delivery status.
        </p>
      </div>

      <Card>
        <div className="divide-y">
          {mockMessages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.author.id === '2'}
              onReaction={(emoji) => handleReaction(message.id, emoji)}
              onReply={() => handleReply(message.id)}
              onEdit={() => handleEdit(message.id)}
              onDelete={() => handleDelete(message.id)}
              onForward={() => handleForward(message.id)}
              onDownloadAttachment={handleDownloadAttachment}
              isHighlighted={index === 4}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

export default MessageBubble;