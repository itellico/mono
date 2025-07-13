'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TypingUser {
  id: number;
  name: string;
  avatar?: string;
}

interface TypingIndicatorProps {
  /**
   * List of users currently typing
   */
  typingUsers: TypingUser[];
  /**
   * Maximum number of typing users to show by name
   * Additional users will be shown as "and X others"
   * @default 3
   */
  maxDisplayUsers?: number;
  /**
   * Show avatars for typing users
   * @default true
   */
  showAvatars?: boolean;
  /**
   * Size variant for the indicator
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg';
  /**
   * Custom className for styling
   */
  className?: string;
  /**
   * Animation variant
   * @default 'dots'
   */
  animation?: 'dots' | 'pulse' | 'wave';
}

interface TypingDotsProps {
  size?: 'sm' | 'default' | 'lg';
  animation?: 'dots' | 'pulse' | 'wave';
}

function TypingDots({ size = 'default', animation = 'dots' }: TypingDotsProps) {
  const sizeClasses = {
    sm: 'w-1 h-1',
    default: 'w-1.5 h-1.5',
    lg: 'w-2 h-2'
  };

  const dotClass = cn(
    'rounded-full bg-muted-foreground',
    sizeClasses[size]
  );

  if (animation === 'pulse') {
    return (
      <div className="flex items-center space-x-1">
        <div className={cn(dotClass, 'animate-pulse')} />
        <div className={cn(dotClass, 'animate-pulse [animation-delay:0.2s]')} />
        <div className={cn(dotClass, 'animate-pulse [animation-delay:0.4s]')} />
      </div>
    );
  }

  if (animation === 'wave') {
    return (
      <div className="flex items-center space-x-1">
        <div className={cn(dotClass, 'animate-bounce')} />
        <div className={cn(dotClass, 'animate-bounce [animation-delay:0.1s]')} />
        <div className={cn(dotClass, 'animate-bounce [animation-delay:0.2s]')} />
      </div>
    );
  }

  // Default dots animation
  return (
    <div className="flex items-center space-x-1">
      <div className={cn(dotClass, 'animate-typing-dot')} />
      <div className={cn(dotClass, 'animate-typing-dot [animation-delay:0.2s]')} />
      <div className={cn(dotClass, 'animate-typing-dot [animation-delay:0.4s]')} />
      <style jsx>{`
        @keyframes typing-dot {
          0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
          30% { opacity: 1; transform: scale(1); }
        }
        .animate-typing-dot {
          animation: typing-dot 1.4s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}

export function TypingIndicator({
  typingUsers,
  maxDisplayUsers = 3,
  showAvatars = true,
  size = 'default',
  className,
  animation = 'dots'
}: TypingIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Show/hide animation with debouncing
  useEffect(() => {
    if (typingUsers.length > 0) {
      setIsVisible(true);
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    } else {
      // Delay hiding to prevent flickering
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 300);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [typingUsers.length]);

  // Don't render if no typing users and not visible
  if (!isVisible && typingUsers.length === 0) {
    return null;
  }

  const displayUsers = typingUsers.slice(0, maxDisplayUsers);
  const remainingCount = Math.max(0, typingUsers.length - maxDisplayUsers);

  const sizeClasses = {
    sm: {
      text: 'text-xs',
      avatar: 'w-4 h-4',
      gap: 'gap-1'
    },
    default: {
      text: 'text-sm',
      avatar: 'w-5 h-5',
      gap: 'gap-1.5'
    },
    lg: {
      text: 'text-base',
      avatar: 'w-6 h-6',
      gap: 'gap-2'
    }
  };

  const classes = sizeClasses[size];

  const formatTypingText = () => {
    if (typingUsers.length === 0) return '';
    
    if (typingUsers.length === 1) {
      return `${displayUsers[0].name} is typing`;
    }
    
    if (typingUsers.length === 2) {
      return `${displayUsers[0].name} and ${displayUsers[1].name} are typing`;
    }
    
    if (typingUsers.length <= maxDisplayUsers) {
      const names = displayUsers.slice(0, -1).map(u => u.name).join(', ');
      return `${names} and ${displayUsers[displayUsers.length - 1].name} are typing`;
    }
    
    const names = displayUsers.map(u => u.name).join(', ');
    return `${names} and ${remainingCount} other${remainingCount > 1 ? 's' : ''} are typing`;
  };

  return (
    <div
      className={cn(
        'flex items-center transition-all duration-300 ease-in-out',
        classes.gap,
        isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2',
        className
      )}
    >
      {/* User Avatars */}
      {showAvatars && displayUsers.length > 0 && (
        <div className="flex -space-x-1">
          {displayUsers.map((user) => (
            <Avatar 
              key={user.id} 
              className={cn(
                classes.avatar,
                'border-2 border-background relative z-10 hover:z-20 transition-transform hover:scale-110'
              )}
            >
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-xs">
                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
          ))}
          {remainingCount > 0 && (
            <div className={cn(
              classes.avatar,
              'border-2 border-background bg-muted flex items-center justify-center rounded-full'
            )}>
              <span className="text-xs font-medium text-muted-foreground">
                +{remainingCount}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Typing Text */}
      <div className="flex items-center space-x-2">
        <span className={cn(
          'text-muted-foreground font-medium',
          classes.text
        )}>
          {formatTypingText()}
        </span>
        
        {/* Typing Animation */}
        <TypingDots size={size} animation={animation} />
      </div>
    </div>
  );
}

// Hook for managing typing state
export function useTypingIndicator(conversationId: number) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const sendTypingTimeoutRef = useRef<NodeJS.Timeout>();

  // Start typing indicator
  const startTyping = (currentUserId: number) => {
    if (!isTyping) {
      setIsTyping(true);
      // In a real implementation, send typing start event to server
      // websocket.send({ type: 'typing_start', conversationId, userId: currentUserId });
    }

    // Reset the typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(currentUserId);
    }, 3000);
  };

  // Stop typing indicator
  const stopTyping = (currentUserId: number) => {
    if (isTyping) {
      setIsTyping(false);
      // In a real implementation, send typing stop event to server
      // websocket.send({ type: 'typing_stop', conversationId, userId: currentUserId });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  // Handle input change to manage typing state
  const handleInputChange = (currentUserId: number, value: string) => {
    if (value.trim().length > 0) {
      startTyping(currentUserId);
    } else {
      stopTyping(currentUserId);
    }
  };

  // Add typing user (called from WebSocket events)
  const addTypingUser = (user: TypingUser) => {
    setTypingUsers(prev => {
      if (prev.find(u => u.id === user.id)) {
        return prev;
      }
      return [...prev, user];
    });

    // Remove typing user after 5 seconds (in case stop event is missed)
    setTimeout(() => {
      removeTypingUser(user.id);
    }, 5000);
  };

  // Remove typing user
  const removeTypingUser = (userId: number) => {
    setTypingUsers(prev => prev.filter(u => u.id !== userId));
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (sendTypingTimeoutRef.current) {
        clearTimeout(sendTypingTimeoutRef.current);
      }
    };
  }, []);

  return {
    typingUsers,
    isTyping,
    startTyping,
    stopTyping,
    handleInputChange,
    addTypingUser,
    removeTypingUser
  };
}

// Example usage component for demonstration
export function TypingIndicatorExample() {
  const [inputValue, setInputValue] = useState('');
  const { typingUsers, handleInputChange } = useTypingIndicator(1);

  // Mock typing users for demonstration
  const mockTypingUsers: TypingUser[] = [
    { id: 1, name: 'Sarah Johnson', avatar: '' },
    { id: 2, name: 'Mike Chen', avatar: '' },
    { id: 3, name: 'Emily Davis', avatar: '' },
    { id: 4, name: 'Alex Rodriguez', avatar: '' }
  ];

  const [selectedUsers, setSelectedUsers] = useState<TypingUser[]>([]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Typing Indicator Examples</h3>
        
        {/* Controls */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-sm font-medium">Simulate typing users:</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {mockTypingUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    setSelectedUsers(prev => 
                      prev.find(u => u.id === user.id)
                        ? prev.filter(u => u.id !== user.id)
                        : [...prev, user]
                    );
                  }}
                  className={cn(
                    'px-3 py-1 text-xs rounded-full border transition-colors',
                    selectedUsers.find(u => u.id === user.id)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-muted'
                  )}
                >
                  {user.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Examples */}
        <div className="space-y-6">
          {/* Default */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Default</h4>
            <TypingIndicator typingUsers={selectedUsers.slice(0, 1)} />
          </div>

          {/* Multiple users */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Multiple Users</h4>
            <TypingIndicator typingUsers={selectedUsers.slice(0, 3)} />
          </div>

          {/* Many users */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Many Users (with overflow)</h4>
            <TypingIndicator typingUsers={selectedUsers} maxDisplayUsers={2} />
          </div>

          {/* Different sizes */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Different Sizes</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="w-12 text-xs">Small:</span>
                <TypingIndicator typingUsers={selectedUsers.slice(0, 1)} size="sm" />
              </div>
              <div className="flex items-center gap-4">
                <span className="w-12 text-xs">Default:</span>
                <TypingIndicator typingUsers={selectedUsers.slice(0, 1)} size="default" />
              </div>
              <div className="flex items-center gap-4">
                <span className="w-12 text-xs">Large:</span>
                <TypingIndicator typingUsers={selectedUsers.slice(0, 1)} size="lg" />
              </div>
            </div>
          </div>

          {/* Different animations */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Animation Variants</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="w-12 text-xs">Dots:</span>
                <TypingIndicator typingUsers={selectedUsers.slice(0, 1)} animation="dots" />
              </div>
              <div className="flex items-center gap-4">
                <span className="w-12 text-xs">Pulse:</span>
                <TypingIndicator typingUsers={selectedUsers.slice(0, 1)} animation="pulse" />
              </div>
              <div className="flex items-center gap-4">
                <span className="w-12 text-xs">Wave:</span>
                <TypingIndicator typingUsers={selectedUsers.slice(0, 1)} animation="wave" />
              </div>
            </div>
          </div>

          {/* Without avatars */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Without Avatars</h4>
            <TypingIndicator typingUsers={selectedUsers.slice(0, 2)} showAvatars={false} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TypingIndicator;