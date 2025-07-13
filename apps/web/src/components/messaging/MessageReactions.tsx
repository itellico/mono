'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { cn } from '@/lib/utils';
import { Plus, Smile } from 'lucide-react';

interface User {
  id: number;
  name: string;
  avatar?: string;
}

interface Reaction {
  emoji: string;
  users: User[];
  timestamp: string;
}

interface MessageReactionsProps {
  /**
   * Message ID for the reactions
   */
  messageId: number;
  /**
   * Current reactions on the message
   */
  reactions: Reaction[];
  /**
   * Current user information
   */
  currentUser: User;
  /**
   * Whether the current user can add reactions
   * @default true
   */
  canReact?: boolean;
  /**
   * Maximum number of reactions to show before collapsing
   * @default 5
   */
  maxVisibleReactions?: number;
  /**
   * Whether to show reaction picker inline or in popover
   * @default false
   */
  showPickerInline?: boolean;
  /**
   * Size variant for reactions
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg';
  /**
   * Callback when user adds a reaction
   */
  onAddReaction?: (messageId: number, emoji: string) => void;
  /**
   * Callback when user removes a reaction
   */
  onRemoveReaction?: (messageId: number, emoji: string) => void;
  /**
   * Custom className
   */
  className?: string;
}

// Common emoji reactions
const QUICK_REACTIONS = [
  '👍', '👎', '❤️', '😂', '😮', '😢', '😡', '🎉', '👏', '🔥',
  '💯', '⭐', '✅', '❌', '🤔', '😍', '😘', '😊', '😎', '🙄'
];

// Emoji categories for picker
const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳'],
  'Gestures': ['👍', '👎', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '🤲', '🤝', '🙏'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  'Objects': ['🔥', '💯', '⭐', '🌟', '💫', '⚡', '💥', '🎉', '🎊', '🏆', '🥇', '🥈', '🥉', '🎖️', '🏅', '🎗️', '🎀', '🎁', '🎪'],
  'Symbols': ['✅', '❌', '⚠️', '🚫', '💢', '💤', '💨', '🔔', '🔕', '📢', '📣', '💬', '💭', '🗯️', '💌', '📝', '📋', '📌', '📍', '🔍']
};

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  size?: 'sm' | 'default' | 'lg';
}

function EmojiPicker({ onEmojiSelect, size = 'default' }: EmojiPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState('Smileys');

  const sizeClasses = {
    sm: 'text-xs p-1',
    default: 'text-sm p-1.5',
    lg: 'text-base p-2'
  };

  return (
    <div className="w-80 max-h-96 overflow-hidden">
      {/* Quick reactions */}
      <div className="p-3 border-b">
        <h4 className="text-sm font-medium mb-2">Quick Reactions</h4>
        <div className="grid grid-cols-10 gap-1">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onEmojiSelect(emoji)}
              className={cn(
                'hover:bg-muted rounded transition-colors',
                sizeClasses[size]
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex border-b">
        {Object.keys(EMOJI_CATEGORIES).map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              'px-3 py-2 text-xs font-medium transition-colors',
              selectedCategory === category
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="p-3 max-h-48 overflow-y-auto">
        <div className="grid grid-cols-8 gap-1">
          {EMOJI_CATEGORIES[selectedCategory as keyof typeof EMOJI_CATEGORIES].map((emoji) => (
            <button
              key={emoji}
              onClick={() => onEmojiSelect(emoji)}
              className={cn(
                'hover:bg-muted rounded transition-colors',
                sizeClasses[size]
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ReactionTooltipProps {
  reaction: Reaction;
  children: React.ReactNode;
}

function ReactionTooltip({ reaction, children }: ReactionTooltipProps) {
  const formatUsers = () => {
    if (reaction.users.length === 0) return '';
    
    if (reaction.users.length === 1) {
      return `${reaction.users[0].name} reacted with ${reaction.emoji}`;
    }
    
    if (reaction.users.length <= 3) {
      const names = reaction.users.map(u => u.name);
      return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} reacted with ${reaction.emoji}`;
    }
    
    const remaining = reaction.users.length - 2;
    return `${reaction.users[0].name}, ${reaction.users[1].name} and ${remaining} other${remaining > 1 ? 's' : ''} reacted with ${reaction.emoji}`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <p className="text-sm">{formatUsers()}</p>
            {reaction.users.length > 0 && (
              <div className="flex -space-x-1">
                {reaction.users.slice(0, 5).map((user) => (
                  <Avatar key={user.id} className="w-6 h-6 border-2 border-background">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="text-xs">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {reaction.users.length > 5 && (
                  <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                    <span className="text-xs">+{reaction.users.length - 5}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function MessageReactions({
  messageId,
  reactions,
  currentUser,
  canReact = true,
  maxVisibleReactions = 5,
  showPickerInline = false,
  size = 'default',
  onAddReaction,
  onRemoveReaction,
  className
}: MessageReactionsProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [showAllReactions, setShowAllReactions] = useState(false);

  const sizeClasses = {
    sm: {
      button: 'h-6 px-2 text-xs gap-1',
      emoji: 'text-sm',
      count: 'text-xs'
    },
    default: {
      button: 'h-7 px-2.5 text-sm gap-1.5',
      emoji: 'text-base',
      count: 'text-xs'
    },
    lg: {
      button: 'h-8 px-3 text-base gap-2',
      emoji: 'text-lg',
      count: 'text-sm'
    }
  };

  const classes = sizeClasses[size];

  const handleEmojiSelect = (emoji: string) => {
    // Check if user already reacted with this emoji
    const existingReaction = reactions.find(r => r.emoji === emoji);
    const userHasReacted = existingReaction?.users.some(u => u.id === currentUser.id);

    if (userHasReacted) {
      onRemoveReaction?.(messageId, emoji);
    } else {
      onAddReaction?.(messageId, emoji);
    }
    
    setIsPickerOpen(false);
  };

  const handleReactionClick = (emoji: string) => {
    const existingReaction = reactions.find(r => r.emoji === emoji);
    const userHasReacted = existingReaction?.users.some(u => u.id === currentUser.id);

    if (userHasReacted) {
      onRemoveReaction?.(messageId, emoji);
    } else {
      onAddReaction?.(messageId, emoji);
    }
  };

  // Filter and sort reactions
  const visibleReactions = showAllReactions 
    ? reactions 
    : reactions.slice(0, maxVisibleReactions);

  const hasMoreReactions = reactions.length > maxVisibleReactions;

  if (reactions.length === 0 && !canReact) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {/* Existing reactions */}
      {visibleReactions.map((reaction) => {
        const userHasReacted = reaction.users.some(u => u.id === currentUser.id);
        
        return (
          <ReactionTooltip key={reaction.emoji} reaction={reaction}>
            <Button
              variant={userHasReacted ? 'default' : 'outline'}
              size="sm"
              onClick={() => canReact && handleReactionClick(reaction.emoji)}
              disabled={!canReact}
              className={cn(
                'rounded-full transition-all duration-200 hover:scale-105',
                classes.button,
                userHasReacted && 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
              )}
            >
              <span className={classes.emoji}>{reaction.emoji}</span>
              <span className={cn('font-medium', classes.count)}>
                {reaction.users.length}
              </span>
            </Button>
          </ReactionTooltip>
        );
      })}

      {/* Show more button */}
      {hasMoreReactions && !showAllReactions && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAllReactions(true)}
          className={cn('rounded-full', classes.button)}
        >
          <span className={classes.count}>+{reactions.length - maxVisibleReactions}</span>
        </Button>
      )}

      {/* Show less button */}
      {showAllReactions && hasMoreReactions && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAllReactions(false)}
          className={cn('rounded-full', classes.button)}
        >
          <span className={classes.count}>Show less</span>
        </Button>
      )}

      {/* Add reaction button */}
      {canReact && (
        <Popover open={isPickerOpen} onOpenChange={setIsPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'rounded-full opacity-60 hover:opacity-100 transition-opacity',
                classes.button
              )}
            >
              <Plus className="w-3 h-3" />
              <Smile className="w-3 h-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" className="w-auto p-0">
            <EmojiPicker onEmojiSelect={handleEmojiSelect} size={size} />
          </PopoverContent>
        </Popover>
      )}

      {/* Inline picker */}
      {showPickerInline && canReact && (
        <div className="mt-2 w-full">
          <EmojiPicker onEmojiSelect={handleEmojiSelect} size={size} />
        </div>
      )}
    </div>
  );
}

// Hook for managing message reactions
export function useMessageReactions(initialReactions: Reaction[] = []) {
  const [reactions, setReactions] = useState<Reaction[]>(initialReactions);

  const addReaction = (messageId: number, emoji: string, user: User) => {
    setReactions(prev => {
      const existingReactionIndex = prev.findIndex(r => r.emoji === emoji);
      
      if (existingReactionIndex >= 0) {
        // Add user to existing reaction if not already present
        const existingReaction = prev[existingReactionIndex];
        if (!existingReaction.users.some(u => u.id === user.id)) {
          const updatedReactions = [...prev];
          updatedReactions[existingReactionIndex] = {
            ...existingReaction,
            users: [...existingReaction.users, user],
            timestamp: new Date().toISOString()
          };
          return updatedReactions;
        }
        return prev;
      } else {
        // Create new reaction
        return [...prev, {
          emoji,
          users: [user],
          timestamp: new Date().toISOString()
        }];
      }
    });
  };

  const removeReaction = (messageId: number, emoji: string, userId: number) => {
    setReactions(prev => {
      return prev.map(reaction => {
        if (reaction.emoji === emoji) {
          const updatedUsers = reaction.users.filter(u => u.id !== userId);
          return updatedUsers.length > 0 
            ? { ...reaction, users: updatedUsers }
            : null;
        }
        return reaction;
      }).filter(Boolean) as Reaction[];
    });
  };

  const toggleReaction = (messageId: number, emoji: string, user: User) => {
    const existingReaction = reactions.find(r => r.emoji === emoji);
    const userHasReacted = existingReaction?.users.some(u => u.id === user.id);

    if (userHasReacted) {
      removeReaction(messageId, emoji, user.id);
    } else {
      addReaction(messageId, emoji, user);
    }
  };

  return {
    reactions,
    addReaction,
    removeReaction,
    toggleReaction,
    setReactions
  };
}

// Example usage component
export function MessageReactionsExample() {
  const currentUser: User = { id: 1, name: 'Current User', avatar: '' };
  
  const mockUsers: User[] = [
    { id: 1, name: 'Current User', avatar: '' },
    { id: 2, name: 'Sarah Johnson', avatar: '' },
    { id: 3, name: 'Mike Chen', avatar: '' },
    { id: 4, name: 'Emily Davis', avatar: '' },
    { id: 5, name: 'Alex Rodriguez', avatar: '' }
  ];

  const initialReactions: Reaction[] = [
    {
      emoji: '👍',
      users: [mockUsers[1], mockUsers[2]],
      timestamp: new Date().toISOString()
    },
    {
      emoji: '❤️',
      users: [mockUsers[3]],
      timestamp: new Date().toISOString()
    },
    {
      emoji: '😂',
      users: [mockUsers[0], mockUsers[4]],
      timestamp: new Date().toISOString()
    }
  ];

  const { reactions, toggleReaction } = useMessageReactions(initialReactions);

  const handleAddReaction = (messageId: number, emoji: string) => {
    toggleReaction(messageId, emoji, currentUser);
  };

  const handleRemoveReaction = (messageId: number, emoji: string) => {
    toggleReaction(messageId, emoji, currentUser);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Message Reactions Examples</h3>
        
        <div className="space-y-6">
          {/* Default */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Default Size</h4>
            <div className="p-3 bg-muted rounded mb-3">
              <p className="text-sm">Hey everyone! How's the project going? 🚀</p>
            </div>
            <MessageReactions
              messageId={1}
              reactions={reactions}
              currentUser={currentUser}
              onAddReaction={handleAddReaction}
              onRemoveReaction={handleRemoveReaction}
            />
          </div>

          {/* Small */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Small Size</h4>
            <div className="p-3 bg-muted rounded mb-3">
              <p className="text-sm">Quick update message</p>
            </div>
            <MessageReactions
              messageId={2}
              reactions={reactions}
              currentUser={currentUser}
              size="sm"
              onAddReaction={handleAddReaction}
              onRemoveReaction={handleRemoveReaction}
            />
          </div>

          {/* Large */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Large Size</h4>
            <div className="p-3 bg-muted rounded mb-3">
              <p className="text-sm">Important announcement message</p>
            </div>
            <MessageReactions
              messageId={3}
              reactions={reactions}
              currentUser={currentUser}
              size="lg"
              onAddReaction={handleAddReaction}
              onRemoveReaction={handleRemoveReaction}
            />
          </div>

          {/* Read-only */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Read-only (No Add Button)</h4>
            <div className="p-3 bg-muted rounded mb-3">
              <p className="text-sm">You can't react to this message</p>
            </div>
            <MessageReactions
              messageId={4}
              reactions={reactions}
              currentUser={currentUser}
              canReact={false}
            />
          </div>

          {/* Many reactions */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Many Reactions (with overflow)</h4>
            <div className="p-3 bg-muted rounded mb-3">
              <p className="text-sm">This message has many reactions</p>
            </div>
            <MessageReactions
              messageId={5}
              reactions={[
                ...reactions,
                { emoji: '🔥', users: [mockUsers[1]], timestamp: new Date().toISOString() },
                { emoji: '💯', users: [mockUsers[2]], timestamp: new Date().toISOString() },
                { emoji: '🎉', users: [mockUsers[3]], timestamp: new Date().toISOString() },
                { emoji: '👏', users: [mockUsers[4]], timestamp: new Date().toISOString() },
                { emoji: '⭐', users: [mockUsers[0]], timestamp: new Date().toISOString() }
              ]}
              currentUser={currentUser}
              maxVisibleReactions={3}
              onAddReaction={handleAddReaction}
              onRemoveReaction={handleRemoveReaction}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessageReactions;