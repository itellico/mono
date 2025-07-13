'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  X,
  Filter,
  Calendar as CalendarIcon,
  User,
  Hash,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Clock,
  Star,
  Pin,
  Eye,
  MessageSquare,
  TrendingUp,
  Users,
  Zap,
  Loader2,
  AlertCircle,
  Info,
  CheckCircle,
  Trash2,
  Archive,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface MessageSearchProps {
  /**
   * Conversation ID to search within
   */
  conversationId?: string;
  /**
   * Whether to search all conversations
   * @default false
   */
  searchAllConversations?: boolean;
  /**
   * Initial search query
   */
  initialQuery?: string;
  /**
   * Whether to show advanced filters
   * @default true
   */
  showAdvancedFilters?: boolean;
  /**
   * Whether to show search history
   * @default true
   */
  showSearchHistory?: boolean;
  /**
   * Whether to show search suggestions
   * @default true
   */
  showSuggestions?: boolean;
  /**
   * Maximum results per page
   * @default 20
   */
  pageSize?: number;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Callback when search is performed
   */
  onSearch?: (params: SearchParams) => Promise<SearchResults>;
  /**
   * Callback when message is selected
   */
  onMessageSelect?: (message: SearchResult) => void;
  /**
   * Callback when search is closed
   */
  onClose?: () => void;
  /**
   * Available participants for filtering
   */
  participants?: Participant[];
}

interface SearchParams {
  query: string;
  conversationId?: string;
  authorIds?: string[];
  hasAttachments?: boolean;
  attachmentTypes?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  isPinned?: boolean;
  isStarred?: boolean;
  sortBy?: 'relevance' | 'date' | 'author';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface SearchResults {
  results: SearchResult[];
  total: number;
  page: number;
  pageCount: number;
  facets?: {
    authors: { id: string; name: string; count: number }[];
    attachmentTypes: { type: string; count: number }[];
    dates: { date: string; count: number }[];
  };
}

interface SearchResult {
  id: string;
  content: string;
  highlightedContent?: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  conversationId: string;
  conversationName?: string;
  createdAt: Date;
  attachments?: {
    id: string;
    type: string;
    name: string;
    size: number;
  }[];
  isPinned?: boolean;
  isStarred?: boolean;
  context?: {
    before?: string;
    after?: string;
  };
}

interface Participant {
  id: string;
  name: string;
  username: string;
  avatar?: string;
}

interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: Date;
  resultCount: number;
}

// Mock search history
const mockSearchHistory: SearchHistoryItem[] = [
  { id: '1', query: 'project deadline', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), resultCount: 15 },
  { id: '2', query: 'meeting notes', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), resultCount: 23 },
  { id: '3', query: 'budget proposal', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), resultCount: 8 },
];

// Mock suggestions
const mockSuggestions = [
  'from:john',
  'has:attachment',
  'type:image',
  'after:last week',
  'in:project-team',
  'is:starred',
  'is:pinned'
];

function SearchResultItem({ 
  result, 
  onSelect 
}: { 
  result: SearchResult; 
  onSelect: () => void 
}) {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    
    if (diffDays === 0) return format(date, 'h:mm a');
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return format(date, 'EEEE');
    return format(date, 'MMM d, yyyy');
  };

  return (
    <div
      className="p-4 hover:bg-accent/50 cursor-pointer transition-colors border-b last:border-0"
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <img
          src={result.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.author.name}`}
          alt={result.author.name}
          className="h-8 w-8 rounded-full flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{result.author.name}</span>
              {result.conversationName && (
                <>
                  <span className="text-muted-foreground">in</span>
                  <Badge variant="outline" className="text-xs">
                    {result.conversationName}
                  </Badge>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {result.isPinned && <Pin className="h-3 w-3" />}
              {result.isStarred && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
              <span>{formatDate(result.createdAt)}</span>
            </div>
          </div>
          
          {/* Message content with highlighting */}
          <div className="text-sm">
            {result.highlightedContent ? (
              <div dangerouslySetInnerHTML={{ __html: result.highlightedContent }} />
            ) : (
              <p className="line-clamp-2">{result.content}</p>
            )}
          </div>

          {/* Context */}
          {result.context && (
            <div className="mt-2 text-xs text-muted-foreground">
              {result.context.before && (
                <p className="line-clamp-1">...{result.context.before}</p>
              )}
              {result.context.after && (
                <p className="line-clamp-1">{result.context.after}...</p>
              )}
            </div>
          )}

          {/* Attachments */}
          {result.attachments && result.attachments.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <Paperclip className="h-3 w-3 text-muted-foreground" />
              <div className="flex gap-1">
                {result.attachments.map((attachment) => (
                  <Badge key={attachment.id} variant="secondary" className="text-xs">
                    {attachment.type === 'image' ? <ImageIcon className="h-3 w-3 mr-1" /> : <FileText className="h-3 w-3 mr-1" />}
                    {attachment.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MessageSearch({
  conversationId,
  searchAllConversations = false,
  initialQuery = '',
  showAdvancedFilters = true,
  showSearchHistory = true,
  showSuggestions = true,
  pageSize = 20,
  className,
  onSearch,
  onMessageSelect,
  onClose,
  participants = []
}: MessageSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>(mockSearchHistory);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  
  // Filter states
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [hasAttachments, setHasAttachments] = useState(false);
  const [attachmentTypes, setAttachmentTypes] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [isPinned, setIsPinned] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'author'>('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const handleSearch = useCallback(async (resetPage = true) => {
    if (!query.trim() && !hasFilters()) return;

    setIsSearching(true);
    if (resetPage) setCurrentPage(1);

    const params: SearchParams = {
      query: query.trim(),
      conversationId: searchAllConversations ? undefined : conversationId,
      authorIds: selectedAuthors.length > 0 ? selectedAuthors : undefined,
      hasAttachments: hasAttachments || undefined,
      attachmentTypes: attachmentTypes.length > 0 ? attachmentTypes : undefined,
      dateFrom,
      dateTo,
      isPinned: isPinned || undefined,
      isStarred: isStarred || undefined,
      sortBy,
      sortOrder,
      page: resetPage ? 1 : currentPage,
      limit: pageSize
    };

    try {
      const searchResults = await (onSearch?.(params) || mockSearch(params));
      setResults(searchResults);
      
      // Add to search history
      if (query.trim() && resetPage) {
        const historyItem: SearchHistoryItem = {
          id: Date.now().toString(),
          query: query.trim(),
          timestamp: new Date(),
          resultCount: searchResults.total
        };
        setSearchHistory(prev => [historyItem, ...prev.slice(0, 9)]);
      }
    } catch (error) {
      toast.error('Search failed. Please try again.');
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [query, conversationId, searchAllConversations, selectedAuthors, hasAttachments, attachmentTypes, dateFrom, dateTo, isPinned, isStarred, sortBy, sortOrder, currentPage, pageSize, onSearch]);

  const hasFilters = () => {
    return selectedAuthors.length > 0 || hasAttachments || attachmentTypes.length > 0 || 
           dateFrom || dateTo || isPinned || isStarred;
  };

  const clearFilters = () => {
    setSelectedAuthors([]);
    setHasAttachments(false);
    setAttachmentTypes([]);
    setDateFrom(undefined);
    setDateTo(undefined);
    setIsPinned(false);
    setIsStarred(false);
    setSortBy('relevance');
    setSortOrder('desc');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      onClose?.();
    }
  };

  const handleHistoryItemClick = (item: SearchHistoryItem) => {
    setQuery(item.query);
    setShowHistoryDialog(false);
    handleSearch();
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    toast.success('Search history cleared');
  };

  // Mock search function
  const mockSearch = async (params: SearchParams): Promise<SearchResults> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockResults: SearchResult[] = [
      {
        id: '1',
        content: `Let's discuss the ${params.query} in our next meeting. I think we need to review all the requirements.`,
        highlightedContent: `Let's discuss the <mark class="bg-yellow-200">${params.query}</mark> in our next meeting. I think we need to review all the requirements.`,
        author: { id: '1', name: 'John Doe', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' },
        conversationId: 'conv-1',
        conversationName: 'Project Team',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        isPinned: true
      },
      {
        id: '2',
        content: `I've updated the document about ${params.query}. Please check the attached file for details.`,
        highlightedContent: `I've updated the document about <mark class="bg-yellow-200">${params.query}</mark>. Please check the attached file for details.`,
        author: { id: '2', name: 'Jane Smith', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane' },
        conversationId: 'conv-1',
        conversationName: 'Project Team',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        attachments: [
          { id: 'att-1', type: 'document', name: 'proposal.pdf', size: 245000 }
        ],
        isStarred: true
      },
      {
        id: '3',
        content: `The ${params.query} has been approved by management. We can proceed with the implementation.`,
        highlightedContent: `The <mark class="bg-yellow-200">${params.query}</mark> has been approved by management. We can proceed with the implementation.`,
        author: { id: '3', name: 'Alice Johnson', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice' },
        conversationId: 'conv-2',
        conversationName: 'Management',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        context: {
          before: 'After careful consideration of all factors',
          after: 'The team should start working on this immediately'
        }
      }
    ];

    return {
      results: mockResults,
      total: 42,
      page: params.page || 1,
      pageCount: Math.ceil(42 / (params.limit || 20)),
      facets: {
        authors: [
          { id: '1', name: 'John Doe', count: 15 },
          { id: '2', name: 'Jane Smith', count: 12 },
          { id: '3', name: 'Alice Johnson', count: 10 },
          { id: '4', name: 'Bob Wilson', count: 5 }
        ],
        attachmentTypes: [
          { type: 'document', count: 18 },
          { type: 'image', count: 12 },
          { type: 'video', count: 3 }
        ],
        dates: [
          { date: 'Today', count: 8 },
          { date: 'Yesterday', count: 12 },
          { date: 'This Week', count: 22 }
        ]
      }
    };
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Search Messages</CardTitle>
              <CardDescription>
                {searchAllConversations ? 'Search across all conversations' : 'Search in this conversation'}
              </CardDescription>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search input */}
          <div className="relative">
            <Input
              ref={searchInputRef}
              placeholder="Search messages..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pr-20"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {showAdvancedFilters && (
                <Button
                  variant={showFilters || hasFilters() ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-3 w-3" />
                  {hasFilters() && (
                    <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 flex items-center justify-center">
                      {selectedAuthors.length + (hasAttachments ? 1 : 0) + attachmentTypes.length + 
                       (dateFrom || dateTo ? 1 : 0) + (isPinned ? 1 : 0) + (isStarred ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => handleSearch()}
                disabled={isSearching}
              >
                {isSearching ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
              </Button>
            </div>
          </div>

          {/* Search suggestions */}
          {showSuggestions && !query && !results && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground">Try:</span>
              {mockSuggestions.map((suggestion) => (
                <Badge
                  key={suggestion}
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-accent"
                  onClick={() => setQuery(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          )}

          {/* Advanced filters */}
          {showFilters && (
            <Card className="p-4 space-y-4">
              {/* Author filter */}
              <div>
                <Label className="text-sm mb-2">From</Label>
                <div className="flex flex-wrap gap-2">
                  {participants.map((participant) => (
                    <label
                      key={participant.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedAuthors.includes(participant.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedAuthors([...selectedAuthors, participant.id]);
                          } else {
                            setSelectedAuthors(selectedAuthors.filter(id => id !== participant.id));
                          }
                        }}
                      />
                      <span className="text-sm">{participant.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Attachment filters */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="has-attachments"
                    checked={hasAttachments}
                    onCheckedChange={(checked) => setHasAttachments(checked as boolean)}
                  />
                  <Label htmlFor="has-attachments" className="text-sm cursor-pointer">
                    Has attachments
                  </Label>
                </div>
                
                {hasAttachments && (
                  <div className="ml-6 space-y-2">
                    <Label className="text-xs">Attachment type</Label>
                    <div className="flex flex-wrap gap-2">
                      {['image', 'video', 'document', 'audio'].map((type) => (
                        <label key={type} className="flex items-center gap-1 cursor-pointer">
                          <Checkbox
                            checked={attachmentTypes.includes(type)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setAttachmentTypes([...attachmentTypes, type]);
                              } else {
                                setAttachmentTypes(attachmentTypes.filter(t => t !== type));
                              }
                            }}
                          />
                          <span className="text-xs capitalize">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Date range */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-sm mb-1">From date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, 'PP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-sm mb-1">To date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, 'PP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Separator />

              {/* Status filters */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={isPinned}
                    onCheckedChange={(checked) => setIsPinned(checked as boolean)}
                  />
                  <Pin className="h-3 w-3" />
                  <span className="text-sm">Pinned</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={isStarred}
                    onCheckedChange={(checked) => setIsStarred(checked as boolean)}
                  />
                  <Star className="h-3 w-3" />
                  <span className="text-sm">Starred</span>
                </label>
              </div>

              <Separator />

              {/* Sort options */}
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="author">Author</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
                <Button size="sm" onClick={() => handleSearch()}>
                  Apply filters
                </Button>
              </div>
            </Card>
          )}

          {/* Search results */}
          {results && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {results.total} results found
                </p>
                {showSearchHistory && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHistoryDialog(true)}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    History
                  </Button>
                )}
              </div>

              {/* Results with facets */}
              <Tabs defaultValue="messages" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="messages">
                    Messages
                    {results.total > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {results.total}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="people">
                    People
                    {results.facets?.authors && (
                      <Badge variant="secondary" className="ml-1">
                        {results.facets.authors.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="files">
                    Files
                    {results.facets?.attachmentTypes && (
                      <Badge variant="secondary" className="ml-1">
                        {results.facets.attachmentTypes.reduce((sum, t) => sum + t.count, 0)}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="dates">Dates</TabsTrigger>
                </TabsList>

                <TabsContent value="messages" className="space-y-4">
                  <ScrollArea className="h-[400px]">
                    <div className="divide-y">
                      {results.results.map((result) => (
                        <SearchResultItem
                          key={result.id}
                          result={result}
                          onSelect={() => onMessageSelect?.(result)}
                        />
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Pagination */}
                  {results.pageCount > 1 && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Page {results.page} of {results.pageCount}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={results.page === 1}
                          onClick={() => {
                            setCurrentPage(results.page - 1);
                            handleSearch(false);
                          }}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={results.page === results.pageCount}
                          onClick={() => {
                            setCurrentPage(results.page + 1);
                            handleSearch(false);
                          }}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="people" className="space-y-4">
                  {results.facets?.authors && (
                    <div className="space-y-2">
                      {results.facets.authors.map((author) => (
                        <div
                          key={author.id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer"
                          onClick={() => {
                            setSelectedAuthors([author.id]);
                            handleSearch();
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${author.name}`}
                              alt={author.name}
                              className="h-8 w-8 rounded-full"
                            />
                            <span className="font-medium">{author.name}</span>
                          </div>
                          <Badge variant="secondary">{author.count} messages</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="files" className="space-y-4">
                  {results.facets?.attachmentTypes && (
                    <div className="space-y-2">
                      {results.facets.attachmentTypes.map((type) => (
                        <div
                          key={type.type}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer"
                          onClick={() => {
                            setHasAttachments(true);
                            setAttachmentTypes([type.type]);
                            handleSearch();
                          }}
                        >
                          <div className="flex items-center gap-3">
                            {type.type === 'image' ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                            <span className="font-medium capitalize">{type.type}s</span>
                          </div>
                          <Badge variant="secondary">{type.count} files</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="dates" className="space-y-4">
                  {results.facets?.dates && (
                    <div className="space-y-2">
                      {results.facets.dates.map((date) => (
                        <div
                          key={date.date}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <CalendarIcon className="h-5 w-5" />
                            <span className="font-medium">{date.date}</span>
                          </div>
                          <Badge variant="secondary">{date.count} messages</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </CardContent>

      {/* Search history dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Search History</DialogTitle>
            <DialogDescription>
              Your recent searches
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {searchHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No search history</p>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {searchHistory.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer"
                      onClick={() => handleHistoryItemClick(item)}
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{item.query}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(item.timestamp, 'PPp')} • {item.resultCount} results
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={clearSearchHistory}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear history
            </Button>
            <Button onClick={() => setShowHistoryDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Example usage component
export function MessageSearchExample() {
  const mockParticipants: Participant[] = [
    { id: '1', name: 'John Doe', username: 'johndoe', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' },
    { id: '2', name: 'Jane Smith', username: 'janesmith', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane' },
    { id: '3', name: 'Alice Johnson', username: 'alicej', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice' },
    { id: '4', name: 'Bob Wilson', username: 'bobw', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob' }
  ];

  const handleSearch = async (params: SearchParams): Promise<SearchResults> => {
    console.log('Search params:', params);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock results
    return {
      results: [
        {
          id: '1',
          content: 'This is a sample message that matches your search criteria.',
          highlightedContent: 'This is a <mark class="bg-yellow-200">sample message</mark> that matches your search criteria.',
          author: { id: '1', name: 'John Doe' },
          conversationId: 'conv-1',
          conversationName: 'Project Team',
          createdAt: new Date(),
          isPinned: true
        }
      ],
      total: 1,
      page: 1,
      pageCount: 1
    };
  };

  const handleMessageSelect = (message: SearchResult) => {
    console.log('Selected message:', message);
    toast.success(`Navigating to message from ${message.author.name}`);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-semibold mb-2">Message Search Examples</h2>
        <p className="text-muted-foreground mb-6">
          Advanced message search with filters and faceted results.
        </p>
      </div>

      <div className="space-y-6">
        {/* Search in conversation */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Search in Conversation</h3>
          <MessageSearch
            conversationId="conv-1"
            participants={mockParticipants}
            onSearch={handleSearch}
            onMessageSelect={handleMessageSelect}
          />
        </div>

        {/* Search all conversations */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Search All Conversations</h3>
          <MessageSearch
            searchAllConversations={true}
            participants={mockParticipants}
            onSearch={handleSearch}
            onMessageSelect={handleMessageSelect}
            initialQuery="project deadline"
          />
        </div>
      </div>
    </div>
  );
}

export default MessageSearch;