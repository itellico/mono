'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, Search, List, Edit, Trash2, Globe, Upload, Download, 
  PlayCircle, HelpCircle, MapPin, Zap, Target, Database,
  Info, AlertTriangle, CheckCircle, Settings, BarChart3, ArrowRightLeft, Grid, Filter, Tag
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RegionalMappingsEditor } from './components/RegionalMappingsEditor';

// API functions
const fetchOptionSets = async (search?: string, categoryId?: string) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (categoryId) params.append('categoryId', categoryId);

  const response = await fetch(`/api/v1/admin/option-sets?${params}`);
  if (!response.ok) throw new Error('Failed to fetch option sets');

  const result = await response.json();
  return result.data;
};

const fetchCategories = async () => {
  const response = await fetch('/api/v1/admin/categories');
  if (!response.ok) throw new Error('Failed to fetch categories');

  const result = await response.json();
  return result.data.categories;
};

const fetchOptionSetById = async (id: string) => {
  const response = await fetch(`/api/v1/admin/option-sets/${id}`);
  if (!response.ok) throw new Error('Failed to fetch option set');

  const result = await response.json();
  return result.data;
};

const createOptionSet = async (data: { slug: string; label: string; tenantId?: number | null; categoryId?: string | null }) => {
  const response = await fetch('/api/v1/admin/option-sets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create option set');
  }

  const result = await response.json();
  return result.data;
};

const updateOptionSet = async (id: string, data: { slug?: string; label?: string; categoryId?: string | null }) => {
  const response = await fetch(`/api/v1/admin/option-sets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update option set');
  }

  const result = await response.json();
  return result.data;
};

const deleteOptionSet = async (id: string) => {
  const response = await fetch(`/api/v1/admin/option-sets/${id}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete option set');
  }
};

const createOptionValue = async (
  optionSetId: string, 
  data: { 
    label: string; 
    value: string; 
    order?: number; 
    isDefault?: boolean;
    canonicalRegion?: string;
    regionalMappings?: Record<string, string>;
    metadata?: Record<string, any>;
  }
) => {
  const response = await fetch(`/api/v1/admin/option-sets/${optionSetId}/values`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create option value');
  }

  return response.json();
};

const updateOptionValue = async (id: string, data: { 
  label?: string; 
  value?: string; 
  order?: number; 
  isDefault?: boolean;
  canonicalRegion?: string;
  regionalMappings?: Record<string, string>;
  metadata?: Record<string, any>;
}) => {
  const response = await fetch(`/api/v1/admin/option-values/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update option value');
  }

  const result = await response.json();
  return result.data;
};

const deleteOptionValue = async (id: string) => {
  const response = await fetch(`/api/v1/admin/option-values/${id}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete option value');
  }
};

interface OptionSet {
  id: number;
  slug: string;
  label: string;
  tenantId: number | null;
  categoryId: string | null;
  valueCount: number;
  createdAt: string;
  category?: {
    id: string;
    name: string;
    slug: string;
    path: string;
    color?: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  path: string;
  level: number;
  parentId: string | null;
  color?: string;
  icon?: string;
  children?: Category[];
}

interface OptionValue {
  id: number;
  label: string;
  value: string;
  order: number;
  isDefault: boolean;
  canonicalRegion: string;
  regionalMappings: Record<string, string>;
  metadata?: Record<string, any>;
}

interface OptionSetsListProps {
  selectedOptionSet: OptionSet | null;
  onOptionSetSelect: (optionSet: OptionSet) => void;
}

function OptionSetsList({ selectedOptionSet, onOptionSetSelect }: OptionSetsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories
  });

  const { data: optionSets = [], isLoading } = useQuery({
    queryKey: ['option-sets', searchTerm, selectedCategoryId],
    queryFn: () => fetchOptionSets(searchTerm || undefined, selectedCategoryId === 'all' ? undefined : selectedCategoryId || undefined)
  });

  const deleteOptionSetMutation = useMutation({
    mutationFn: deleteOptionSet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['option-sets'] });
      toast({
        title: 'Success',
        description: 'Option set deleted successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleDelete = (e: React.MouseEvent, optionSetId: number) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this option set? This will also delete all its values.')) {
      deleteOptionSetMutation.mutate(optionSetId.toString());
    }
  };

  // Build hierarchical category options
  const categoryOptions = categories.reduce((acc: { value: string; label: string }[], category: Category) => {
    acc.push({ value: category.id, label: category.name });
    if (category.children) {
      category.children.forEach(child => {
        acc.push({ value: child.id, label: `  └─ ${child.name}` });
      });
    }
    return acc;
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search option sets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
          <SelectTrigger className="w-64">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categoryOptions.map((option: { value: string; label: string }) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ultra-Condensed Option Sets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
        {optionSets.map((optionSet: OptionSet) => (
          <Card 
            key={optionSet.id}
            className={`cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] ${
              selectedOptionSet?.id === optionSet.id ? 'ring-2 ring-primary shadow-md' : ''
            }`}
            onClick={() => onOptionSetSelect(optionSet)}
          >
            <CardContent className="p-3">
              <div className="space-y-1.5">
                {/* Header - more compact */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-xs truncate leading-tight">{optionSet.label}</h3>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {optionSet.slug}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-5 w-5 p-0 hover:bg-muted"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle edit
                      }}
                    >
                      <Edit className="h-2.5 w-2.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-5 w-5 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => handleDelete(e, optionSet.id)}
                      disabled={deleteOptionSetMutation.isPending}
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                </div>

                {/* Category badge - more compact */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    {optionSet.category && (
                      <Badge 
                        variant="secondary" 
                        className="text-[9px] px-1.5 py-0 h-4 truncate flex-shrink-0"
                        style={{ 
                          backgroundColor: optionSet.category.color ? `${optionSet.category.color}15` : undefined,
                          borderColor: optionSet.category.color || undefined
                        }}
                      >
                        <Tag className="h-2 w-2 mr-0.5" />
                        {optionSet.category.name}
                      </Badge>
                    )}
                    {optionSet.tenantId === null && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 flex-shrink-0">
                        <Globe className="h-2 w-2 mr-0.5" />
                        Global
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 flex-shrink-0 font-medium">
                    {optionSet.valueCount || 0}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {optionSets.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No option sets found</p>
          {searchTerm || (selectedCategoryId && selectedCategoryId !== 'all') ? (
            <p className="text-sm">Try adjusting your search or filter criteria</p>
          ) : (
            <p className="text-sm">Create your first option set to get started</p>
          )}
        </div>
      )}
    </div>
  );
}

interface OptionSetEditorProps {
  optionSet: OptionSet | null;
}

function OptionSetEditor({ optionSet }: OptionSetEditorProps) {
  const [newValueLabel, setNewValueLabel] = useState('');
  const [newValueValue, setNewValueValue] = useState('');
  const [newValueMappings, setNewValueMappings] = useState<Record<string, string>>({ 'GLOBAL': '' });
  const [newValueCanonicalRegion, setNewValueCanonicalRegion] = useState('GLOBAL');
  const [editingValue, setEditingValue] = useState<OptionValue | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editMappings, setEditMappings] = useState<Record<string, string>>({});
  const [editCanonicalRegion, setEditCanonicalRegion] = useState('GLOBAL');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: optionSetWithValues, isLoading } = useQuery({
    queryKey: ['option-set', optionSet?.id],
    queryFn: () => optionSet ? fetchOptionSetById(optionSet.id.toString()) : null,
    enabled: !!optionSet
  });

  const createValueMutation = useMutation({
    mutationFn: (data: { label: string; value: string; canonicalRegion: string; regionalMappings: Record<string, string> }) =>
      createOptionValue(optionSet!.id.toString(), {
        label: data.label,
        value: data.value,
        canonicalRegion: data.canonicalRegion,
        regionalMappings: data.regionalMappings
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['option-set', optionSet?.id] });
      queryClient.invalidateQueries({ queryKey: ['option-sets'] });
      setNewValueLabel('');
      setNewValueValue('');
      setNewValueMappings({ 'GLOBAL': '' });
      setNewValueCanonicalRegion('GLOBAL');
      toast({
        title: 'Success',
        description: 'Option value created successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const deleteValueMutation = useMutation({
    mutationFn: deleteOptionValue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['option-set', optionSet?.id] });
      queryClient.invalidateQueries({ queryKey: ['option-sets'] });
      toast({
        title: 'Success',
        description: 'Option value deleted successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const updateValueMutation = useMutation({
    mutationFn: (data: { id: number; label: string; value: string; canonicalRegion: string; regionalMappings: Record<string, string> }) =>
      updateOptionValue(data.id.toString(), {
        label: data.label,
        value: data.value,
        canonicalRegion: data.canonicalRegion,
        regionalMappings: data.regionalMappings
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['option-sets'] });
      queryClient.invalidateQueries({ queryKey: ['option-set', optionSet?.id] });
      setEditingValue(null);
      setEditLabel('');
      setEditValue('');
      setEditMappings({});
      setEditCanonicalRegion('GLOBAL');
      toast({
        title: 'Success',
        description: 'Option value updated successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleAddValue = () => {
    if (!newValueLabel.trim() || !newValueValue.trim()) {
      toast({
        title: 'Error',
        description: 'Both label and value are required',
        variant: 'destructive'
      });
      return;
    }

    createValueMutation.mutate({
      label: newValueLabel.trim(),
      value: newValueValue.trim(),
      canonicalRegion: newValueCanonicalRegion,
      regionalMappings: newValueMappings
    });
  };

  const handleEditValue = (value: OptionValue) => {
    setEditingValue(value);
    setEditLabel(value.label);
    setEditValue(value.value);
    setEditMappings(value.regionalMappings || {});
    setEditCanonicalRegion(value.canonicalRegion || 'GLOBAL');
  };

  const handleUpdateValue = () => {
    if (!editingValue || !editLabel.trim() || !editValue.trim()) {
      toast({
        title: 'Error',
        description: 'Both label and value are required',
        variant: 'destructive'
      });
      return;
    }

    updateValueMutation.mutate({
      id: editingValue.id,
      label: editLabel.trim(),
      value: editValue.trim(),
      canonicalRegion: editCanonicalRegion,
      regionalMappings: editMappings
    });
  };

  const handleCancelEdit = () => {
    setEditingValue(null);
    setEditLabel('');
    setEditValue('');
    setEditMappings({});
    setEditCanonicalRegion('GLOBAL');
  };

  const handleDeleteValue = (valueId: number) => {
    if (confirm('Are you sure you want to delete this option value?')) {
      deleteValueMutation.mutate(valueId.toString());
    }
  };

  if (!optionSet) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Select an option set to view and edit its values</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const values = optionSetWithValues?.values || [];

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{optionSet.label}</h2>
            <p className="text-sm text-muted-foreground">
              Slug: {optionSet.slug}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {optionSet.tenantId === null && (
              <Badge variant="secondary">Platform-wide</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="new-label">Label</Label>
              <Input
                id="new-label"
                placeholder="Value label (e.g., Blonde)"
                value={newValueLabel}
                onChange={(e) => setNewValueLabel(e.target.value)}
              />
            </div>
          </div>

          <RegionalMappingsEditor
            value={newValueMappings}
            onChange={setNewValueMappings}
            canonicalRegion={newValueCanonicalRegion}
            onCanonicalRegionChange={setNewValueCanonicalRegion}
            defaultValue={newValueValue}
            onDefaultValueChange={setNewValueValue}
          />

          <Button 
            onClick={handleAddValue}
            disabled={createValueMutation.isPending}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Option Value
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-medium">Option Values</h3>
        <div className="space-y-2">
          {values.map((value: OptionValue, index: number) => (
            <Card key={value.id}>
              <CardContent className="p-4">
                {editingValue?.id === value.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="edit-label">Label</Label>
                        <Input
                          id="edit-label"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          placeholder="Label"
                        />
                      </div>
                    </div>

                    <RegionalMappingsEditor
                      value={editMappings}
                      onChange={setEditMappings}
                      canonicalRegion={editCanonicalRegion}
                      onCanonicalRegionChange={setEditCanonicalRegion}
                      defaultValue={editValue}
                      onDefaultValueChange={setEditValue}
                    />

                    <div className="flex gap-2">
                      <Button 
                        onClick={handleUpdateValue}
                        disabled={updateValueMutation.isPending}
                        className="flex-1"
                      >
                        Save Changes
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={handleCancelEdit}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-muted-foreground font-mono">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{value.label}</div>
                        <div className="text-sm text-muted-foreground">
                          Value: {value.value}
                          {value.canonicalRegion && value.canonicalRegion !== 'GLOBAL' && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {value.canonicalRegion}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {value.isDefault && (
                        <Badge variant="default" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditValue(value)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteValue(value.id)}
                        disabled={deleteValueMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {values.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No option values yet</p>
            <p className="text-sm">Add some values to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Enhanced API functions for new features
const getOptionSetStatistics = async () => {
  const response = await fetch('/api/v1/admin/option-sets/statistics');
  if (!response.ok) throw new Error('Failed to fetch statistics');
  const result = await response.json();

  // Transform API response to match UI expectations
  return {
    totalSets: result.data.totals.optionSets,
    totalValues: result.data.totals.optionValues,
    withMappings: result.data.totals.mappingsCoverage,
    mappingsCoveragePercent: result.data.totals.mappingsCoveragePercent,
    byTenant: result.data.byTenant,
    topOptionSets: result.data.topOptionSets,
    recentActivity: result.data.recentActivity,
    availableRegions: result.data.availableRegions
  };
};

const runSeeder = async (options: { clear?: boolean; categories?: string[] }) => {
  const response = await fetch('/api/v1/admin/option-sets/seed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options)
  });
  if (!response.ok) throw new Error('Failed to run seeder');
  return response.json();
};

const generateConversionMappings = async (optionSetId: string) => {
  const response = await fetch(`/api/v1/admin/option-sets/${optionSetId}/generate-mappings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!response.ok) throw new Error('Failed to generate mappings');
  return response.json();
};

const exportOptionSets = async (format: 'json' | 'csv' = 'json') => {
  const response = await fetch(`/api/v1/admin/option-sets/export?format=${format}`);
  if (!response.ok) throw new Error('Failed to export option sets');
  return response.blob();
};

// Enhanced main component with comprehensive features
export default function OptionSetsPage() {
  const [selectedOptionSet, setSelectedOptionSet] = useState<OptionSet | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newOptionSetSlug, setNewOptionSetSlug] = useState('');
  const [newOptionSetLabel, setNewOptionSetLabel] = useState('');
  const [activeTab, setActiveTab] = useState('browse');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Statistics query
  const { data: statistics } = useQuery({
    queryKey: ['option-sets-statistics'],
    queryFn: getOptionSetStatistics,
    refetchInterval: 30000
  });

  const createOptionSetMutation = useMutation({
    mutationFn: createOptionSet,
    onSuccess: (newOptionSet) => {
      queryClient.invalidateQueries({ queryKey: ['option-sets'] });
      setIsCreateDialogOpen(false);
      setNewOptionSetSlug('');
      setNewOptionSetLabel('');
      setSelectedOptionSet(newOptionSet);
      toast({
        title: 'Success',
        description: 'Option set created successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleCreateOptionSet = () => {
    if (!newOptionSetSlug.trim() || !newOptionSetLabel.trim()) {
      toast({
        title: 'Error',
        description: 'Both slug and label are required',
        variant: 'destructive'
      });
      return;
    }

    createOptionSetMutation.mutate({
      slug: newOptionSetSlug.trim(),
      label: newOptionSetLabel.trim(),
      tenantId: null, // Platform-wide for now
      categoryId: null
    });
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Statistics */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Option Sets Management
          </h1>
          <p className="text-muted-foreground text-lg">
            Comprehensive administration of dropdown options, regional mappings, and conversion systems
          </p>
          {statistics && (
            <div className="flex items-center gap-6 mt-2">
              <Badge variant="secondary" className="gap-1">
                <Database className="h-3 w-3" />
                {statistics.totalSets} Sets
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <List className="h-3 w-3" />
                {statistics.totalValues} Values
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <MapPin className="h-3 w-3" />
                {statistics.withMappings} With Mappings
              </Badge>
            </div>
          )}
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Option Set
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Option Set</DialogTitle>
              <DialogDescription>
                Create a new reusable option set for form dropdowns with regional mapping support.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  placeholder="e.g., hair-colors"
                  value={newOptionSetSlug}
                  onChange={(e) => setNewOptionSetSlug(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Used for API references. Use lowercase with hyphens.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  placeholder="e.g., Hair Colors"
                  value={newOptionSetLabel}
                  onChange={(e) => setNewOptionSetLabel(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Display name shown to users.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateOptionSet}
                disabled={createOptionSetMutation.isPending}
              >
                {createOptionSetMutation.isPending ? 'Creating...' : 'Create Option Set'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Enhanced Tabs with Comprehensive Features */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="browse" className="gap-2">
            <List className="h-4 w-4" />
            Browse & Edit
          </TabsTrigger>
          <TabsTrigger value="mappings" className="gap-2">
            <MapPin className="h-4 w-4" />
            Conversion Mappings
          </TabsTrigger>
          <TabsTrigger value="seeder" className="gap-2">
            <PlayCircle className="h-4 w-4" />
            Seeder & Import
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="help" className="gap-2">
            <HelpCircle className="h-4 w-4" />
            Help & Guide
          </TabsTrigger>
        </TabsList>

        {/* Browse & Edit Tab - Enhanced existing functionality */}
        <TabsContent value="browse" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-300px)]">
            {/* Left Panel - Option Sets List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <List className="h-5 w-5" />
                  Option Sets
                  <Badge variant="outline" className="ml-auto">
                    {statistics?.totalSets || 0} sets
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Browse and manage your reusable option sets with regional mapping support
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[calc(100%-120px)] overflow-auto">
                <OptionSetsList 
                  selectedOptionSet={selectedOptionSet}
                  onOptionSetSelect={setSelectedOptionSet}
                />
              </CardContent>
            </Card>

            {/* Right Panel - Option Values Editor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Option Values
                  {selectedOptionSet && (
                    <Badge variant="outline" className="ml-auto">
                      {selectedOptionSet.valueCount} values
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {selectedOptionSet 
                    ? `Manage values for ${selectedOptionSet.label} with regional mappings`
                    : 'Select an option set to manage its values and regional mappings'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[calc(100%-120px)] overflow-auto">
                <OptionSetEditor optionSet={selectedOptionSet} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Conversion Mappings Tab */}
        <TabsContent value="mappings" className="space-y-6">
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertTitle>Intelligent Conversion System</AlertTitle>
            <AlertDescription>
              Manage comprehensive mappings between different measurement systems, sizes, and units. 
              These mappings enable smart search that finds models with equivalent values across regions.
            </AlertDescription>
          </Alert>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Conversion mappings manager coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Seeder & Import Tab */}
        <TabsContent value="seeder" className="space-y-6">
          <Alert>
            <PlayCircle className="h-4 w-4" />
            <AlertTitle>Data Management Tools</AlertTitle>
            <AlertDescription>
              Use the comprehensive seeder to populate modeling industry option sets, or import/export your custom configurations.
            </AlertDescription>
          </Alert>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <PlayCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Data management tools coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Option Sets</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics?.totalSets || 0}</div>
                <p className="text-xs text-muted-foreground">
                  +{statistics?.recentActivity || 0} in last 30 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Option Values</CardTitle>
                <List className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics?.totalValues || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Avg {Math.round((statistics?.totalValues || 0) / Math.max(statistics?.totalSets || 1, 1))} per set
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">With Regional Mappings</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics?.withMappings || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round(((statistics?.withMappings || 0) / Math.max(statistics?.totalSets || 1, 1)) * 100)}% coverage
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Usage Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Analytics</CardTitle>
              <CardDescription>
                Most frequently used option sets and their performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statistics?.topOptionSets?.map((item: any, index: number) => (
                  <div key={item.slug} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <div>
                        <div className="font-medium">{item.label}</div>
                        <div className="text-sm text-muted-foreground">{item.slug}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{item.usage || 0} uses</div>
                      <div className="text-sm text-muted-foreground">{item.valueCount} values</div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No usage data available yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Help & Guide Tab */}
        <TabsContent value="help" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Quick Start Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5">1</Badge>
                    <div>
                      <div className="font-medium">Create Option Sets</div>
                      <div className="text-sm text-muted-foreground">
                        Use the &quot;Create Option Set&quot; button or run the comprehensive seeder for modeling industry standards.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5">2</Badge>
                    <div>
                      <div className="font-medium">Add Option Values</div>
                      <div className="text-sm text-muted-foreground">
                        Add values with regional mappings for international compatibility.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5">3</Badge>
                    <div>
                      <div className="font-medium">Configure Mappings</div>
                      <div className="text-sm text-muted-foreground">
                        Set up conversion mappings for intelligent search across different units.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5">4</Badge>
                    <div>
                      <div className="font-medium">Use in Schemas</div>
                      <div className="text-sm text-muted-foreground">
                        Reference option sets in model schemas using their slugs.
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Best Practices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Regional Mappings</AlertTitle>
                  <AlertDescription>
                    Always add regional mappings for size-based option sets (clothing, shoes) to enable international compatibility.
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Target className="h-4 w-4" />
                  <AlertTitle>Naming Conventions</AlertTitle>
                  <AlertDescription>
                    Use descriptive slugs (hair-colors, not hc) and clear labels. This improves API usability and admin management.
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Zap className="h-4 w-4" />
                  <AlertTitle>Search Performance</AlertTitle>
                  <AlertDescription>
                    Conversion mappings enable 5-20ms search performance. Configure them for measurement-based option sets.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* Examples Section */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration Examples</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="height" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="height">Height Measurements</TabsTrigger>
                  <TabsTrigger value="clothing">Clothing Sizes</TabsTrigger>
                  <TabsTrigger value="characteristics">Characteristics</TabsTrigger>
                </TabsList>
                <TabsContent value="height" className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Height Option Set Example</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Slug:</strong> height-ranges</div>
                      <div><strong>Default Value:</strong> 170cm (Canonical Region: EU)</div>
                      <div><strong>Regional Mappings:</strong></div>
                      <ul className="ml-4 space-y-1">
                        <li>• US: 5ft7in</li>
                        <li>• UK: 5ft7in</li>
                        <li>• Asia: 170cm</li>
                      </ul>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="clothing" className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Clothing Size Example</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Slug:</strong> dress-sizes-women</div>
                      <div><strong>Default Value:</strong> 8 (Canonical Region: US)</div>
                      <div><strong>Regional Mappings:</strong></div>
                      <ul className="ml-4 space-y-1">
                        <li>• EU: 38</li>
                        <li>• UK: 10</li>
                        <li>• Asia: L</li>
                      </ul>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="characteristics" className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Characteristics Example</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Slug:</strong> hair-colors</div>
                      <div><strong>Values:</strong> Blonde, Brunette, Black, Red, etc.</div>
                      <div><strong>Note:</strong> No regional mappings needed for characteristics</div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}