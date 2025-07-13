'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Search, 
  X, 
  Users, 
  MessageCircle, 
  Plus,
  Check,
  ChevronsUpDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';

interface User {
  id: number;
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  isActive: boolean;
}

interface NewConversationModalProps {
  open: boolean;
  onClose: () => void;
  onCreateConversation: (data: {
    participantIds: number[];
    subject?: string;
    type?: string;
  }) => void;
  isCreating: boolean;
}

export function NewConversationModal({
  open,
  onClose,
  onCreateConversation,
  isCreating,
}: NewConversationModalProps) {
  const [subject, setSubject] = useState('');
  const [type, setType] = useState<'direct' | 'group' | 'support' | 'business'>('direct');
  const [selectedParticipants, setSelectedParticipants] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Fetch users for participant selection
  const { 
    data: usersData, 
    isLoading: isLoadingUsers 
  } = useQuery({
    queryKey: ['users-search', searchTerm],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/user/search', {
        params: {
          search: searchTerm,
          limit: 50,
          includeInactive: false,
        }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to search users');
      }
      
      return response.data.data.users as User[];
    },
    enabled: searchTerm.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });

  const handleReset = () => {
    setSubject('');
    setType('direct');
    setSelectedParticipants([]);
    setSearchTerm('');
    setIsSearchOpen(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = () => {
    if (selectedParticipants.length === 0) return;

    onCreateConversation({
      participantIds: selectedParticipants.map(p => p.id),
      subject: subject.trim() || undefined,
      type,
    });
  };

  const addParticipant = (user: User) => {
    if (!selectedParticipants.find(p => p.id === user.id)) {
      setSelectedParticipants(prev => [...prev, user]);
    }
    setSearchTerm('');
    setIsSearchOpen(false);
  };

  const removeParticipant = (userId: number) => {
    setSelectedParticipants(prev => prev.filter(p => p.id !== userId));
  };

  const filteredUsers = usersData?.filter(user => 
    !selectedParticipants.find(p => p.id === user.id)
  ) || [];

  // Auto-adjust type based on participant count
  React.useEffect(() => {
    if (selectedParticipants.length <= 1) {
      setType('direct');
    } else if (selectedParticipants.length > 1 && type === 'direct') {
      setType('group');
    }
  }, [selectedParticipants.length, type]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Start New Conversation
          </DialogTitle>
          <DialogDescription>
            Add participants and start a new conversation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Conversation Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Conversation Type</Label>
            <Select value={type} onValueChange={(value: any) => setType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select conversation type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="direct" disabled={selectedParticipants.length > 1}>
                  Direct Message
                </SelectItem>
                <SelectItem value="group">
                  Group Chat
                </SelectItem>
                <SelectItem value="support">
                  Support Conversation
                </SelectItem>
                <SelectItem value="business">
                  Business Discussion
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subject (optional for groups) */}
          {(type === 'group' || type === 'support' || type === 'business') && (
            <div className="space-y-2">
              <Label htmlFor="subject">Subject (Optional)</Label>
              <Input
                id="subject"
                placeholder="Enter conversation subject..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
              />
              {subject && (
                <p className="text-xs text-muted-foreground">
                  {subject.length}/200 characters
                </p>
              )}
            </div>
          )}

          {/* Participant Selection */}
          <div className="space-y-2">
            <Label>Participants</Label>
            
            {/* Search for users */}
            <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isSearchOpen}
                  className="w-full justify-between"
                >
                  <div className="flex items-center">
                    <Search className="h-4 w-4 mr-2" />
                    {searchTerm || "Search users..."}
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput 
                    placeholder="Search users..." 
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {searchTerm.length < 2 
                        ? "Type at least 2 characters to search" 
                        : "No users found"
                      }
                    </CommandEmpty>
                    {isLoadingUsers && searchTerm.length >= 2 && (
                      <CommandGroup>
                        {[...Array(3)].map((_, i) => (
                          <CommandItem key={i} disabled>
                            <div className="flex items-center space-x-2 w-full">
                              <Skeleton className="h-8 w-8 rounded-full" />
                              <div className="space-y-1 flex-1">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-2 w-32" />
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                    {filteredUsers.length > 0 && (
                      <CommandGroup>
                        {filteredUsers.map((user) => (
                          <CommandItem
                            key={user.id}
                            onSelect={() => addParticipant(user)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center space-x-2 w-full">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatarUrl} />
                                <AvatarFallback className="text-xs">
                                  {user.firstName[0]}{user.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {user.firstName} {user.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {user.email}
                                </p>
                              </div>
                              <Plus className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Selected participants */}
            {selectedParticipants.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Selected participants ({selectedParticipants.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedParticipants.map((participant) => (
                    <Badge
                      key={participant.id}
                      variant="secondary"
                      className="flex items-center gap-2 pr-1"
                    >
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={participant.avatarUrl} />
                        <AvatarFallback className="text-xs">
                          {participant.firstName[0]}{participant.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs">
                        {participant.firstName} {participant.lastName}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => removeParticipant(participant.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {selectedParticipants.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No participants selected. Search and select users to start a conversation.
              </p>
            )}
          </div>

          {/* Validation Messages */}
          {type === 'direct' && selectedParticipants.length > 1 && (
            <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950 p-2 rounded-md">
              Direct conversations can only have one other participant. 
              Consider using a group chat instead.
            </div>
          )}
          
          {type === 'group' && selectedParticipants.length < 2 && (
            <div className="text-sm text-blue-600 bg-blue-50 dark:bg-blue-950 p-2 rounded-md">
              Group conversations require at least 2 participants.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              selectedParticipants.length === 0 ||
              (type === 'direct' && selectedParticipants.length > 1) ||
              (type === 'group' && selectedParticipants.length < 2) ||
              isCreating
            }
          >
            {isCreating ? 'Creating...' : 'Start Conversation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}