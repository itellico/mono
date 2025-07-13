'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
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
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Package,
  Plus,
  Trash2,
  Edit,
  Download,
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Play,
  Pause,
  RotateCcw,
  Filter,
  Search,
  Archive,
  Star,
  Eye,
  EyeOff,
  Move,
  Copy,
  Merge,
  Split,
  RefreshCw,
  Clock,
  Users,
  Target,
  Activity,
  Zap,
  Settings,
  MoreHorizontal,
  ChevronDown,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TagData {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  usageCount: number;
  isActive: boolean;
  isSystem: boolean;
  isFeatured?: boolean;
  parentId?: number;
  children?: TagData[];
  createdAt: string;
  metadata?: {
    color?: string;
    icon?: string;
    aliases?: string[];
  };
}

interface BulkOperation {
  id: string;
  type: 'create' | 'update' | 'delete' | 'merge' | 'move' | 'import' | 'export';
  name: string;
  description: string;
  progress: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  totalItems: number;
  processedItems: number;
  failedItems: number;
  startedAt?: Date;
  completedAt?: Date;
  estimatedTimeRemaining?: number;
  errors: string[];
  warnings: string[];
  results?: any;
}

interface BulkTagOperationsProps {
  /**
   * Available tags for operations
   */
  tags: TagData[];
  /**
   * Selected tag IDs for bulk operations
   */
  selectedTagIds: number[];
  /**
   * Whether to show the selection interface
   * @default true
   */
  showSelection?: boolean;
  /**
   * Whether to allow dangerous operations (delete, merge)
   * @default true
   */
  allowDangerousOps?: boolean;
  /**
   * Maximum number of tags that can be processed at once
   * @default 1000
   */
  maxBatchSize?: number;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Callback when tags are selected/deselected
   */
  onSelectionChange?: (tagIds: number[]) => void;
  /**
   * Callback when bulk operation is executed
   */
  onBulkOperation?: (operation: string, tagIds: number[], options?: any) => Promise<any>;
  /**
   * Callback for importing tags
   */
  onImportTags?: (tags: Partial<TagData>[]) => Promise<TagData[]>;
  /**
   * Callback for exporting tags
   */
  onExportTags?: (tagIds: number[], format: 'csv' | 'json' | 'xml') => Promise<void>;
}

// Mock data for demonstration
const mockTags: TagData[] = [
  {
    id: 1,
    uuid: '1',
    name: 'Photography',
    slug: 'photography',
    category: 'content-type',
    usageCount: 156,
    isActive: true,
    isSystem: false,
    isFeatured: true,
    createdAt: '2024-01-01T00:00:00Z',
    metadata: { color: '#3B82F6' }
  },
  {
    id: 2,
    uuid: '2',
    name: 'Design',
    slug: 'design',
    category: 'content-type',
    usageCount: 134,
    isActive: true,
    isSystem: false,
    createdAt: '2024-01-02T00:00:00Z',
    metadata: { color: '#10B981' }
  },
  {
    id: 3,
    uuid: '3',
    name: 'Marketing',
    slug: 'marketing',
    category: 'industry',
    usageCount: 98,
    isActive: false,
    isSystem: false,
    createdAt: '2024-01-03T00:00:00Z',
    metadata: { color: '#F59E0B' }
  },
  {
    id: 4,
    uuid: '4',
    name: 'Fashion',
    slug: 'fashion',
    category: 'industry',
    usageCount: 87,
    isActive: true,
    isSystem: false,
    createdAt: '2024-01-04T00:00:00Z',
    metadata: { color: '#EC4899' }
  },
  {
    id: 5,
    uuid: '5',
    name: 'Technology',
    slug: 'technology',
    category: 'industry',
    usageCount: 76,
    isActive: true,
    isSystem: true,
    createdAt: '2024-01-05T00:00:00Z',
    metadata: { color: '#8B5CF6' }
  }
];

const mockOperations: BulkOperation[] = [
  {
    id: '1',
    type: 'update',
    name: 'Update Status to Active',
    description: 'Activating 25 inactive tags',
    progress: 80,
    status: 'running',
    totalItems: 25,
    processedItems: 20,
    failedItems: 0,
    startedAt: new Date(Date.now() - 120000),
    estimatedTimeRemaining: 30,
    errors: [],
    warnings: ['2 tags are system tags and will be skipped']
  },
  {
    id: '2',
    type: 'export',
    name: 'Export Selected Tags',
    description: 'Exporting 156 tags to CSV format',
    progress: 100,
    status: 'completed',
    totalItems: 156,
    processedItems: 156,
    failedItems: 0,
    startedAt: new Date(Date.now() - 300000),
    completedAt: new Date(Date.now() - 60000),
    errors: [],
    warnings: []
  },
  {
    id: '3',
    type: 'delete',
    name: 'Delete Unused Tags',
    description: 'Removing 12 tags with zero usage',
    progress: 45,
    status: 'failed',
    totalItems: 12,
    processedItems: 5,
    failedItems: 1,
    startedAt: new Date(Date.now() - 180000),
    errors: ['Cannot delete tag "system-required" - it is a system tag'],
    warnings: []
  }
];

function OperationProgress({ operation }: { operation: BulkOperation }) {
  const getStatusIcon = () => {
    switch (operation.status) {
      case 'running':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (operation.status) {
      case 'running':
        return 'text-blue-600';
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'paused':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="font-medium">{operation.name}</span>
            </div>
            <Badge variant="outline" className={getStatusColor()}>
              {operation.status}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground">{operation.description}</p>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span>{operation.processedItems}/{operation.totalItems} items</span>
            </div>
            <Progress value={operation.progress} className="h-2" />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {operation.startedAt && `Started ${formatDuration(Date.now() - operation.startedAt.getTime())} ago`}
            </span>
            {operation.status === 'running' && operation.estimatedTimeRemaining && (
              <span>~{operation.estimatedTimeRemaining}s remaining</span>
            )}
          </div>

          {operation.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Errors ({operation.errors.length})</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside text-xs mt-1">
                  {operation.errors.slice(0, 2).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {operation.errors.length > 2 && (
                    <li>... and {operation.errors.length - 2} more</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {operation.warnings.length > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Warnings ({operation.warnings.length})</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside text-xs mt-1">
                  {operation.warnings.slice(0, 2).map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                  {operation.warnings.length > 2 && (
                    <li>... and {operation.warnings.length - 2} more</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-2">
            {operation.status === 'running' && (
              <Button size="sm" variant="outline">
                <Pause className="h-3 w-3 mr-1" />
                Pause
              </Button>
            )}
            {operation.status === 'paused' && (
              <Button size="sm" variant="outline">
                <Play className="h-3 w-3 mr-1" />
                Resume
              </Button>
            )}
            {(operation.status === 'failed' || operation.status === 'paused') && (
              <Button size="sm" variant="outline">
                <RotateCcw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
            <Button size="sm" variant="ghost">
              <Info className="h-3 w-3 mr-1" />
              Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TagSelectionTable({ 
  tags, 
  selectedIds, 
  onSelectionChange 
}: { 
  tags: TagData[], 
  selectedIds: number[], 
  onSelectionChange: (ids: number[]) => void 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filteredTags = useMemo(() => {
    return tags.filter(tag => {
      const matchesSearch = !searchQuery || 
        tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tag.slug.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !filterCategory || tag.category === filterCategory;
      const matchesStatus = !filterStatus || 
        (filterStatus === 'active' && tag.isActive) ||
        (filterStatus === 'inactive' && !tag.isActive);
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [tags, searchQuery, filterCategory, filterStatus]);

  const categories = useMemo(() => {
    const cats = new Set(tags.map(tag => tag.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [tags]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelection = [...new Set([...selectedIds, ...filteredTags.map(tag => tag.id)])];
      onSelectionChange(newSelection);
    } else {
      const filteredIds = new Set(filteredTags.map(tag => tag.id));
      const newSelection = selectedIds.filter(id => !filteredIds.has(id));
      onSelectionChange(newSelection);
    }
  };

  const handleSelectTag = (tagId: number, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, tagId]);
    } else {
      onSelectionChange(selectedIds.filter(id => id !== tagId));
    }
  };

  const allFilteredSelected = filteredTags.length > 0 && 
    filteredTags.every(tag => selectedIds.includes(tag.id));
  const someFilteredSelected = filteredTags.some(tag => selectedIds.includes(tag.id));

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category?.charAt(0).toUpperCase() + category?.slice(1).replace('-', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Selection Summary */}
      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={allFilteredSelected}
            onCheckedChange={handleSelectAll}
            ref={(ref) => {
              if (ref) {
                ref.indeterminate = someFilteredSelected && !allFilteredSelected;
              }
            }}
          />
          <span className="text-sm font-medium">
            {selectedIds.length} of {tags.length} tags selected
          </span>
        </div>
        {selectedIds.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onSelectionChange([])}
          >
            Clear Selection
          </Button>
        )}
      </div>

      {/* Tags Table */}
      <ScrollArea className="h-[400px] border rounded-lg">
        <div className="p-4 space-y-2">
          {filteredTags.map((tag) => (
            <div
              key={tag.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                selectedIds.includes(tag.id) && 'bg-accent/50 border-primary/30'
              )}
            >
              <Checkbox
                checked={selectedIds.includes(tag.id)}
                onCheckedChange={(checked) => handleSelectTag(tag.id, checked as boolean)}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{tag.name}</span>
                  {tag.isFeatured && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                  {tag.isSystem && (
                    <Badge variant="outline" className="text-xs">System</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs bg-muted px-1 rounded">{tag.slug}</code>
                  {tag.category && (
                    <Badge variant="outline" className="text-xs">
                      {tag.category}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right text-sm">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span>{tag.usageCount}</span>
                </div>
                <Badge variant={tag.isActive ? "default" : "secondary"} className="text-xs mt-1">
                  {tag.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export function BulkTagOperations({
  tags = mockTags,
  selectedTagIds = [],
  showSelection = true,
  allowDangerousOps = true,
  maxBatchSize = 1000,
  className,
  onSelectionChange = () => {},
  onBulkOperation,
  onImportTags,
  onExportTags
}: BulkTagOperationsProps) {
  const [currentOperations, setCurrentOperations] = useState<BulkOperation[]>(mockOperations);
  const [selectedOperation, setSelectedOperation] = useState<string>('');
  const [operationOptions, setOperationOptions] = useState<any>({});
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'xml'>('csv');

  const selectedTags = useMemo(() => {
    return tags.filter(tag => selectedTagIds.includes(tag.id));
  }, [tags, selectedTagIds]);

  const canExecuteOperation = useMemo(() => {
    if (selectedTagIds.length === 0) return false;
    if (selectedTagIds.length > maxBatchSize) return false;
    if (!selectedOperation) return false;
    return true;
  }, [selectedTagIds, maxBatchSize, selectedOperation]);

  const getOperationWarnings = useCallback(() => {
    const warnings: string[] = [];
    
    if (selectedTagIds.length > 100) {
      warnings.push(`Large batch size (${selectedTagIds.length} items) may take time to process`);
    }
    
    const systemTags = selectedTags.filter(tag => tag.isSystem);
    if (systemTags.length > 0 && ['delete', 'deactivate'].includes(selectedOperation)) {
      warnings.push(`${systemTags.length} system tags cannot be ${selectedOperation}d`);
    }
    
    const activeTags = selectedTags.filter(tag => tag.isActive);
    if (activeTags.length > 0 && selectedOperation === 'delete') {
      warnings.push(`${activeTags.length} active tags will be deleted - this may affect content`);
    }

    return warnings;
  }, [selectedTags, selectedOperation, selectedTagIds.length]);

  const handleExecuteOperation = async () => {
    if (!canExecuteOperation) return;

    const warnings = getOperationWarnings();
    if (warnings.length > 0 && allowDangerousOps) {
      setConfirmDialogOpen(true);
      return;
    }

    try {
      await onBulkOperation?.(selectedOperation, selectedTagIds, operationOptions);
      toast.success(`Bulk ${selectedOperation} operation started successfully`);
      setSelectedOperation('');
      setOperationOptions({});
    } catch (error) {
      toast.error(`Failed to start bulk operation: ${(error as Error).message}`);
    }
  };

  const handleImportTags = async () => {
    if (!importData.trim()) return;

    try {
      const tags = JSON.parse(importData) as Partial<TagData>[];
      await onImportTags?.(tags);
      toast.success(`Successfully imported ${tags.length} tags`);
      setImportData('');
    } catch (error) {
      toast.error('Failed to import tags. Please check the data format.');
    }
  };

  const handleExportTags = async () => {
    if (selectedTagIds.length === 0) return;

    try {
      await onExportTags?.(selectedTagIds, exportFormat);
      toast.success(`Successfully exported ${selectedTagIds.length} tags as ${exportFormat.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export tags');
    }
  };

  const runningOperations = currentOperations.filter(op => op.status === 'running');
  const completedOperations = currentOperations.filter(op => op.status === 'completed');
  const failedOperations = currentOperations.filter(op => op.status === 'failed');

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" />
            Bulk Tag Operations
          </h3>
          <p className="text-sm text-muted-foreground">
            Perform batch operations on multiple tags efficiently
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {selectedTagIds.length} selected
          </Badge>
          <Badge variant="outline" className="text-xs">
            Max: {maxBatchSize}
          </Badge>
        </div>
      </div>

      {/* Operation Status */}
      {(runningOperations.length > 0 || failedOperations.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Active Operations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {runningOperations.map(operation => (
              <OperationProgress key={operation.id} operation={operation} />
            ))}
            {failedOperations.slice(0, 2).map(operation => (
              <OperationProgress key={operation.id} operation={operation} />
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="operations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="operations">Bulk Operations</TabsTrigger>
          {showSelection && <TabsTrigger value="selection">Tag Selection</TabsTrigger>}
          <TabsTrigger value="import">Import/Export</TabsTrigger>
          <TabsTrigger value="history">Operation History</TabsTrigger>
        </TabsList>

        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Execute Bulk Operation</CardTitle>
              <CardDescription>
                Apply operations to {selectedTagIds.length} selected tags
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedTagIds.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>No Tags Selected</AlertTitle>
                  <AlertDescription>
                    Please select tags from the Selection tab to perform bulk operations.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {/* Operation Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="operation">Operation Type</Label>
                      <Select value={selectedOperation} onValueChange={setSelectedOperation}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select operation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="activate">Activate Tags</SelectItem>
                          <SelectItem value="deactivate">Deactivate Tags</SelectItem>
                          <SelectItem value="feature">Mark as Featured</SelectItem>
                          <SelectItem value="unfeature">Remove Featured</SelectItem>
                          <SelectItem value="update-category">Update Category</SelectItem>
                          <SelectItem value="move">Move to Parent</SelectItem>
                          <SelectItem value="duplicate">Duplicate Tags</SelectItem>
                          {allowDangerousOps && (
                            <>
                              <SelectItem value="merge">Merge Tags</SelectItem>
                              <SelectItem value="delete">Delete Tags</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Operation-specific options */}
                    {(selectedOperation === 'update-category' || selectedOperation === 'move') && (
                      <div>
                        <Label htmlFor="target">
                          {selectedOperation === 'update-category' ? 'New Category' : 'Target Parent'}
                        </Label>
                        <Input
                          placeholder={selectedOperation === 'update-category' ? 'Enter category name' : 'Parent tag name'}
                          value={operationOptions.target || ''}
                          onChange={(e) => setOperationOptions({ ...operationOptions, target: e.target.value })}
                        />
                      </div>
                    )}
                  </div>

                  {/* Operation Preview */}
                  {selectedOperation && (
                    <div className="space-y-3">
                      <Label>Operation Preview</Label>
                      <div className="p-3 bg-muted rounded-lg space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Target className="h-4 w-4" />
                          <span className="font-medium">
                            {selectedOperation.charAt(0).toUpperCase() + selectedOperation.slice(1).replace('-', ' ')}
                          </span>
                          <span>→ {selectedTagIds.length} tags</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {selectedTags.slice(0, 5).map(tag => (
                            <Badge key={tag.id} variant="outline" className="text-xs">
                              {tag.name}
                            </Badge>
                          ))}
                          {selectedTags.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{selectedTags.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Warnings */}
                      {getOperationWarnings().length > 0 && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Warnings</AlertTitle>
                          <AlertDescription>
                            <ul className="list-disc list-inside text-sm mt-1">
                              {getOperationWarnings().map((warning, index) => (
                                <li key={index}>{warning}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

                  {/* Execute Button */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleExecuteOperation}
                      disabled={!canExecuteOperation}
                      className="flex items-center gap-2"
                    >
                      <Zap className="h-4 w-4" />
                      Execute Operation
                    </Button>
                    {selectedTagIds.length > maxBatchSize && (
                      <span className="text-sm text-destructive">
                        Batch size exceeds limit ({maxBatchSize})
                      </span>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {showSelection && (
          <TabsContent value="selection" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tag Selection</CardTitle>
                <CardDescription>
                  Choose tags for bulk operations using filters and search
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TagSelectionTable
                  tags={tags}
                  selectedIds={selectedTagIds}
                  onSelectionChange={onSelectionChange}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="import" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Import */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Import Tags
                </CardTitle>
                <CardDescription>
                  Import tags from JSON data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="import-data">JSON Data</Label>
                  <Textarea
                    id="import-data"
                    placeholder="Paste JSON tag data here..."
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    rows={8}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  Expected format: Array of tag objects with name, slug, category, etc.
                </div>
                <Button 
                  onClick={handleImportTags}
                  disabled={!importData.trim()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Import Tags
                </Button>
              </CardContent>
            </Card>

            {/* Export */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export Tags
                </CardTitle>
                <CardDescription>
                  Export selected tags in various formats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Export Format</Label>
                  <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="xml">XML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedTagIds.length} tags selected for export
                </div>
                <Button 
                  onClick={handleExportTags}
                  disabled={selectedTagIds.length === 0}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export as {exportFormat.toUpperCase()}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Operation History
              </CardTitle>
              <CardDescription>
                Recent bulk operations and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {currentOperations.map(operation => (
                    <OperationProgress key={operation.id} operation={operation} />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Operation</DialogTitle>
            <DialogDescription>
              You are about to perform a potentially destructive operation on {selectedTagIds.length} tags.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warnings</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside text-sm mt-1">
                  {getOperationWarnings().map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to continue? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={async () => {
                setConfirmDialogOpen(false);
                await handleExecuteOperation();
              }}
            >
              Continue Operation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Example usage component
export function BulkTagOperationsExample() {
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([1, 2, 3]);

  const handleBulkOperation = async (operation: string, tagIds: number[], options?: any) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Bulk operation:', { operation, tagIds, options });
  };

  const handleImportTags = async (tags: Partial<TagData>[]): Promise<TagData[]> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Import tags:', tags);
    return tags as TagData[];
  };

  const handleExportTags = async (tagIds: number[], format: 'csv' | 'json' | 'xml') => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Export tags:', { tagIds, format });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Bulk Tag Operations</h2>
        <p className="text-muted-foreground">
          Efficiently manage multiple tags with bulk operations, import/export, and real-time progress tracking.
        </p>
      </div>

      <BulkTagOperations
        tags={mockTags}
        selectedTagIds={selectedTagIds}
        onSelectionChange={setSelectedTagIds}
        onBulkOperation={handleBulkOperation}
        onImportTags={handleImportTags}
        onExportTags={handleExportTags}
        showSelection={true}
        allowDangerousOps={true}
        maxBatchSize={1000}
      />
    </div>
  );
}

export default BulkTagOperations;