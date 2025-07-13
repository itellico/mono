'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send,
  Paperclip,
  Smile,
  Bold,
  Italic,
  Underline,
  Link,
  List,
  ListOrdered,
  Quote,
  Code,
  Image,
  Video,
  FileText,
  Mic,
  MicOff,
  Clock,
  X,
  Check,
  AlertCircle,
  Loader2,
  MoreHorizontal,
  Calendar,
  MapPin,
  Users,
  Hash,
  AtSign,
  Camera,
  File,
  Music,
  FileArchive,
  Sparkles,
  Languages,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MessageComposerProps {
  /**
   * Conversation ID for sending messages
   */
  conversationId: string;
  /**
   * Placeholder text for the composer
   * @default "Type a message..."
   */
  placeholder?: string;
  /**
   * Maximum message length
   * @default 10000
   */
  maxLength?: number;
  /**
   * Whether to show formatting toolbar
   * @default true
   */
  showFormatting?: boolean;
  /**
   * Whether to allow file attachments
   * @default true
   */
  allowAttachments?: boolean;
  /**
   * Maximum file size in bytes
   * @default 10MB
   */
  maxFileSize?: number;
  /**
   * Allowed file types
   * @default ['image/*', 'video/*', 'application/pdf', ...]
   */
  allowedFileTypes?: string[];
  /**
   * Whether to enable @mentions
   * @default true
   */
  enableMentions?: boolean;
  /**
   * Whether to enable emoji picker
   * @default true
   */
  enableEmojis?: boolean;
  /**
   * Whether to enable voice messages
   * @default false
   */
  enableVoiceMessages?: boolean;
  /**
   * Whether to enable message scheduling
   * @default false
   */
  enableScheduling?: boolean;
  /**
   * Whether to show typing indicator
   * @default true
   */
  showTypingIndicator?: boolean;
  /**
   * Auto-save draft interval in ms
   * @default 5000
   */
  autoSaveDraftInterval?: number;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Callback when message is sent
   */
  onSendMessage: (message: MessageData) => Promise<void>;
  /**
   * Callback when typing status changes
   */
  onTypingChange?: (isTyping: boolean) => void;
  /**
   * Callback when files are attached
   */
  onFilesAttached?: (files: File[]) => void;
  /**
   * Callback when draft is saved
   */
  onDraftSaved?: (draft: string) => void;
  /**
   * Users available for @mentions
   */
  mentionableUsers?: User[];
  /**
   * Reply to message
   */
  replyTo?: Message | null;
  /**
   * Edit message
   */
  editMessage?: Message | null;
  /**
   * Whether the conversation is encrypted
   */
  isEncrypted?: boolean;
}

interface MessageData {
  content: string;
  formattedContent?: string;
  attachments?: AttachmentData[];
  mentions?: string[];
  replyToId?: string;
  scheduledFor?: Date;
  isVoiceMessage?: boolean;
  metadata?: Record<string, any>;
}

interface AttachmentData {
  id: string;
  file: File;
  type: 'image' | 'video' | 'document' | 'audio' | 'other';
  name: string;
  size: number;
  preview?: string;
  uploadProgress?: number;
  error?: string;
}

interface User {
  id: string;
  name: string;
  username: string;
  avatar?: string;
}

interface Message {
  id: string;
  content: string;
  authorName: string;
  createdAt: Date;
}

interface EmojiData {
  emoji: string;
  name: string;
  category: string;
}

// Mock emoji data
const mockEmojis: EmojiData[] = [
  { emoji: '😀', name: 'smile', category: 'smileys' },
  { emoji: '😂', name: 'joy', category: 'smileys' },
  { emoji: '❤️', name: 'heart', category: 'smileys' },
  { emoji: '👍', name: 'thumbsup', category: 'gestures' },
  { emoji: '👏', name: 'clap', category: 'gestures' },
  { emoji: '🎉', name: 'party', category: 'objects' },
  { emoji: '🔥', name: 'fire', category: 'nature' },
  { emoji: '⭐', name: 'star', category: 'nature' },
];

// Mock mentionable users
const mockUsers: User[] = [
  { id: '1', name: 'John Doe', username: 'johndoe', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' },
  { id: '2', name: 'Jane Smith', username: 'janesmith', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane' },
  { id: '3', name: 'Alice Johnson', username: 'alicej', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice' },
];

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return Image;
  if (type.startsWith('video/')) return Video;
  if (type.startsWith('audio/')) return Music;
  if (type.includes('pdf')) return FileText;
  if (type.includes('zip') || type.includes('rar')) return FileArchive;
  return File;
};

export function MessageComposer({
  conversationId,
  placeholder = "Type a message...",
  maxLength = 10000,
  showFormatting = true,
  allowAttachments = true,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  allowedFileTypes = ['image/*', 'video/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  enableMentions = true,
  enableEmojis = true,
  enableVoiceMessages = false,
  enableScheduling = false,
  showTypingIndicator = true,
  autoSaveDraftInterval = 5000,
  className,
  onSendMessage,
  onTypingChange,
  onFilesAttached,
  onDraftSaved,
  mentionableUsers = mockUsers,
  replyTo = null,
  editMessage = null,
  isEncrypted = false
}: MessageComposerProps) {
  const [content, setContent] = useState(editMessage?.content || '');
  const [attachments, setAttachments] = useState<AttachmentData[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [lastTypingNotification, setLastTypingNotification] = useState(0);
  const [draftSaveTimeout, setDraftSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Update character count
  useEffect(() => {
    setCharacterCount(content.length);
  }, [content]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [content]);

  // Auto-save draft
  useEffect(() => {
    if (!content.trim() || editMessage) return;

    if (draftSaveTimeout) {
      clearTimeout(draftSaveTimeout);
    }

    const timeout = setTimeout(() => {
      onDraftSaved?.(content);
      toast.success('Draft saved', { duration: 1000 });
    }, autoSaveDraftInterval);

    setDraftSaveTimeout(timeout);

    return () => {
      if (draftSaveTimeout) {
        clearTimeout(draftSaveTimeout);
      }
    };
  }, [content, autoSaveDraftInterval, editMessage, onDraftSaved, draftSaveTimeout]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingNotification > 3000) {
      onTypingChange?.(true);
      setLastTypingNotification(now);
      setTimeout(() => onTypingChange?.(false), 3000);
    }
  }, [lastTypingNotification, onTypingChange]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    if (newContent.length <= maxLength) {
      setContent(newContent);
      if (showTypingIndicator) {
        handleTyping();
      }

      // Check for mentions
      if (enableMentions) {
        const lastAtIndex = newContent.lastIndexOf('@');
        if (lastAtIndex !== -1 && lastAtIndex === newContent.length - 1) {
          setShowMentions(true);
          setMentionSearch('');
        } else if (lastAtIndex !== -1) {
          const afterAt = newContent.substring(lastAtIndex + 1);
          const spaceIndex = afterAt.indexOf(' ');
          if (spaceIndex === -1) {
            setShowMentions(true);
            setMentionSearch(afterAt);
          } else {
            setShowMentions(false);
          }
        } else {
          setShowMentions(false);
        }
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: AttachmentData[] = [];

    for (const file of files) {
      // Check file size
      if (file.size > maxFileSize) {
        toast.error(`${file.name} exceeds maximum file size of ${formatBytes(maxFileSize)}`);
        continue;
      }

      // Check file type
      const isAllowed = allowedFileTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -2));
        }
        return file.type === type;
      });

      if (!isAllowed) {
        toast.error(`${file.name} is not an allowed file type`);
        continue;
      }

      // Create attachment object
      const attachment: AttachmentData = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        type: file.type.startsWith('image/') ? 'image' :
              file.type.startsWith('video/') ? 'video' :
              file.type.startsWith('audio/') ? 'audio' :
              file.type.includes('pdf') || file.type.includes('document') ? 'document' : 'other',
        name: file.name,
        size: file.size,
        uploadProgress: 0
      };

      // Generate preview for images
      if (attachment.type === 'image') {
        const reader = new FileReader();
        reader.onload = (e) => {
          attachment.preview = e.target?.result as string;
          setAttachments(prev => [...prev]);
        };
        reader.readAsDataURL(file);
      }

      validFiles.push(attachment);
    }

    if (validFiles.length > 0) {
      setAttachments(prev => [...prev, ...validFiles]);
      onFilesAttached?.(validFiles.map(a => a.file));
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSend = async () => {
    if (!content.trim() && attachments.length === 0) return;
    if (isSending) return;

    setIsSending(true);

    try {
      const messageData: MessageData = {
        content: content.trim(),
        attachments,
        replyToId: replyTo?.id,
        scheduledFor: scheduleDate || undefined,
        mentions: extractMentions(content),
        metadata: {
          encrypted: isEncrypted,
          edited: !!editMessage,
          editedAt: editMessage ? new Date().toISOString() : undefined
        }
      };

      await onSendMessage(messageData);
      
      // Clear composer
      setContent('');
      setAttachments([]);
      setScheduleDate(null);
      onTypingChange?.(false);
      
      toast.success(scheduleDate ? 'Message scheduled' : 'Message sent');
    } catch (error) {
      toast.error('Failed to send message');
      console.error('Send message error:', error);
    } finally {
      setIsSending(false);
    }
  };

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  };

  const insertMention = (user: User) => {
    const lastAtIndex = content.lastIndexOf('@');
    const beforeAt = content.substring(0, lastAtIndex);
    const afterAt = content.substring(lastAtIndex + 1);
    const spaceIndex = afterAt.indexOf(' ');
    const afterMention = spaceIndex !== -1 ? afterAt.substring(spaceIndex) : '';
    
    const newContent = `${beforeAt}@${user.username} ${afterMention}`;
    setContent(newContent);
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const insertEmoji = (emoji: string) => {
    const start = textareaRef.current?.selectionStart || 0;
    const end = textareaRef.current?.selectionEnd || 0;
    const newContent = content.substring(0, start) + emoji + content.substring(end);
    setContent(newContent);
    setShowEmojiPicker(false);
    
    // Set cursor position after emoji
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = start + emoji.length;
        textareaRef.current.setSelectionRange(newPosition, newPosition);
        textareaRef.current.focus();
      }
    }, 0);
  };

  const applyFormatting = (format: string) => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = content.substring(start, end);

    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `__${selectedText}__`;
        break;
      case 'code':
        formattedText = `\`${selectedText}\``;
        break;
      case 'quote':
        formattedText = `> ${selectedText}`;
        break;
    }

    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);
    
    // Set selection to formatted text
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(start, start + formattedText.length);
        textareaRef.current.focus();
      }
    }, 0);
  };

  const startVoiceRecording = async () => {
    if (!enableVoiceMessages) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, { type: 'audio/webm' });
        
        const attachment: AttachmentData = {
          id: `${Date.now()}-voice`,
          file: audioFile,
          type: 'audio',
          name: audioFile.name,
          size: audioFile.size,
          uploadProgress: 0
        };

        setAttachments(prev => [...prev, attachment]);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info('Recording started');
    } catch (error) {
      toast.error('Failed to start recording');
      console.error('Recording error:', error);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.info('Recording stopped');
    }
  };

  const filteredUsers = mentionableUsers.filter(user =>
    user.name.toLowerCase().includes(mentionSearch.toLowerCase()) ||
    user.username.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Reply/Edit indicator */}
      {(replyTo || editMessage) && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-t-lg border-t border-x">
          <div className="flex items-center gap-2 text-sm">
            {replyTo ? (
              <>
                <Quote className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Replying to</span>
                <span className="font-medium">{replyTo.authorName}</span>
                <span className="text-muted-foreground truncate max-w-[200px]">
                  {replyTo.content}
                </span>
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Editing message</span>
              </>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (replyTo) {
                // Clear reply
              } else if (editMessage) {
                setContent('');
              }
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Main composer */}
      <Card className={cn(
        'relative',
        (replyTo || editMessage) && 'rounded-t-none border-t-0'
      )}>
        {/* Formatting toolbar */}
        {showFormatting && (
          <>
            <div className="flex items-center gap-1 p-2 border-b">
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => applyFormatting('bold')}
                    >
                      <Bold className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Bold</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => applyFormatting('italic')}
                    >
                      <Italic className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Italic</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => applyFormatting('underline')}
                    >
                      <Underline className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Underline</TooltipContent>
                </Tooltip>

                <Separator orientation="vertical" className="mx-1 h-6" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => applyFormatting('code')}
                    >
                      <Code className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Code</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => applyFormatting('quote')}
                    >
                      <Quote className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Quote</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="flex-1" />

              {isEncrypted && (
                <Badge variant="secondary" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Encrypted
                </Badge>
              )}
            </div>
          </>
        )}

        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 border-b">
            {attachments.map((attachment) => {
              const FileIcon = getFileIcon(attachment.file.type);
              return (
                <div
                  key={attachment.id}
                  className="relative group flex items-center gap-2 p-2 bg-muted rounded-lg"
                >
                  {attachment.type === 'image' && attachment.preview ? (
                    <img
                      src={attachment.preview}
                      alt={attachment.name}
                      className="h-12 w-12 object-cover rounded"
                    />
                  ) : (
                    <FileIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{attachment.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(attachment.size)}</p>
                  </div>
                  {attachment.uploadProgress !== undefined && attachment.uploadProgress < 100 && (
                    <Progress value={attachment.uploadProgress} className="w-16 h-1" />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeAttachment(attachment.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  {attachment.error && (
                    <Badge variant="destructive" className="text-xs">
                      {attachment.error}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Message input */}
        <div className="relative p-3">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full min-h-[80px] max-h-[200px] bg-transparent border-0 outline-none resize-none pr-24"
            disabled={isSending || isRecording}
          />

          {/* Character count */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <span className={cn(
              "text-xs",
              characterCount > maxLength * 0.9 ? "text-destructive" : "text-muted-foreground"
            )}>
              {characterCount}/{maxLength}
            </span>
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-between p-2 border-t">
          <div className="flex items-center gap-1">
            {/* Attachments */}
            {allowAttachments && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={allowedFileTypes.join(',')}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSending}
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Attach files</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}

            {/* Emoji picker */}
            {enableEmojis && (
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Smile className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2">
                  <div className="grid grid-cols-8 gap-1">
                    {mockEmojis.map((emojiData) => (
                      <Button
                        key={emojiData.name}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => insertEmoji(emojiData.emoji)}
                      >
                        {emojiData.emoji}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* Voice message */}
            {enableVoiceMessages && (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isRecording ? "destructive" : "ghost"}
                      size="sm"
                      onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                      disabled={isSending}
                    >
                      {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isRecording ? 'Stop recording' : 'Record voice message'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Schedule */}
            {enableScheduling && (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowScheduleDialog(true)}
                      disabled={isSending}
                    >
                      <Clock className="h-4 w-4" />
                      {scheduleDate && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          Scheduled
                        </Badge>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Schedule message</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={(!content.trim() && attachments.length === 0) || isSending}
            size="sm"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="ml-2">Send</span>
          </Button>
        </div>
      </Card>

      {/* Mentions dropdown */}
      {showMentions && enableMentions && (
        <Card className="absolute bottom-full left-0 right-0 mb-2 p-2 z-50">
          <ScrollArea className="max-h-48">
            {filteredUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground p-2">No users found</p>
            ) : (
              <div className="space-y-1">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors text-left"
                    onClick={() => insertMention(user)}
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-6 w-6 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>
      )}

      {/* Schedule dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Message</DialogTitle>
            <DialogDescription>
              Choose when to send this message
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const date = new Date();
                  date.setHours(date.getHours() + 1);
                  setScheduleDate(date);
                  setShowScheduleDialog(false);
                }}
              >
                <Clock className="h-4 w-4 mr-2" />
                In 1 hour
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const date = new Date();
                  date.setDate(date.getDate() + 1);
                  date.setHours(9, 0, 0, 0);
                  setScheduleDate(date);
                  setShowScheduleDialog(false);
                }}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Tomorrow 9 AM
              </Button>
            </div>
            {/* Add custom date/time picker here */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!scheduleDate) {
                  setScheduleDate(new Date());
                }
                setShowScheduleDialog(false);
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Example usage component
export function MessageComposerExample() {
  const handleSendMessage = async (message: MessageData) => {
    console.log('Sending message:', message);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleTypingChange = (isTyping: boolean) => {
    console.log('Typing:', isTyping);
  };

  const handleFilesAttached = (files: File[]) => {
    console.log('Files attached:', files);
  };

  const handleDraftSaved = (draft: string) => {
    console.log('Draft saved:', draft);
  };

  const mockReplyTo: Message = {
    id: '1',
    content: 'This is a message you can reply to',
    authorName: 'John Doe',
    createdAt: new Date()
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-semibold mb-2">Message Composer Examples</h2>
        <p className="text-muted-foreground">
          Rich text message composer with attachments, mentions, and more.
        </p>
      </div>

      <div className="space-y-6">
        {/* Basic composer */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Basic Composer</h3>
          <MessageComposer
            conversationId="conv-1"
            onSendMessage={handleSendMessage}
          />
        </div>

        {/* Full-featured composer */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Full-Featured Composer</h3>
          <MessageComposer
            conversationId="conv-2"
            onSendMessage={handleSendMessage}
            onTypingChange={handleTypingChange}
            onFilesAttached={handleFilesAttached}
            onDraftSaved={handleDraftSaved}
            enableVoiceMessages={true}
            enableScheduling={true}
          />
        </div>

        {/* Reply composer */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Reply to Message</h3>
          <MessageComposer
            conversationId="conv-3"
            onSendMessage={handleSendMessage}
            replyTo={mockReplyTo}
          />
        </div>

        {/* Encrypted composer */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Encrypted Conversation</h3>
          <MessageComposer
            conversationId="conv-4"
            onSendMessage={handleSendMessage}
            isEncrypted={true}
          />
        </div>

        {/* Minimal composer */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Minimal Composer</h3>
          <MessageComposer
            conversationId="conv-5"
            onSendMessage={handleSendMessage}
            showFormatting={false}
            enableEmojis={false}
            allowAttachments={false}
            placeholder="Send a quick message..."
          />
        </div>
      </div>
    </div>
  );
}

export default MessageComposer;