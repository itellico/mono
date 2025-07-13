'use client';
import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SkeletonWrapper, DataTableSkeleton } from '@/components/ui/tenant-skeleton';
import { EnhancedDataTable, type ColumnConfig } from '@/components/ui/enhanced-data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  MoreHorizontal, 
  Database, 
  Edit, 
  Trash2, 
  Plus, 
  Shield, 
  Clock,
  Flag,
  BarChart3,
  Settings,
  Timer,
  Zap
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PermissionGate } from '@/components/reusable/PermissionGate';
import { AdminOnly } from '@/components/admin/AdminOnly';
import { browserLogger } from '@/lib/browser-logger';

interface EntityMetadata {
  id: number;
  entityType: 'user' | 'account' | 'profile' | 'media_asset' | 'subscription' | 'tenant';
  entityId: number;
  metadataKey: string;
  metadataValue: any;
  metadataType: 'workflow_state' | 'feature_flag' | 'quality_metric' | 'business_logic' | 'cache_hint' | 'experiment';
  isSystem: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  description: string;
}

// Mock data showcasing different metadata types
const MOCK_METADATA: EntityMetadata[] = [
  // Workflow States
  {
    id: 1,
    entityType: 'profile',
    entityId: 1001,
    metadataKey: 'approval_stage',
    metadataValue: 'final_review',
    metadataType: 'workflow_state',
    isSystem: false,
    expiresAt: null,
    createdAt: '2024-01-20T10:30:00Z',
    updatedAt: '2024-01-20T10:30:00Z',
    description: 'Current stage in profile approval workflow'
  },
  {
    id: 2,
    entityType: 'profile',
    entityId: 1001,
    metadataKey: 'verification_status',
    metadataValue: 'verified',
    metadataType: 'workflow_state',
    isSystem: false,
    expiresAt: null,
    createdAt: '2024-01-19T14:20:00Z',
    updatedAt: '2024-01-20T09:15:00Z',
    description: 'Identity verification status'
  },
  {
    id: 3,
    entityType: 'profile',
    entityId: 1002,
    metadataKey: 'approval_stage',
    metadataValue: 'rejected',
    metadataType: 'workflow_state',
    isSystem: false,
    expiresAt: null,
    createdAt: '2024-01-18T16:45:00Z',
    updatedAt: '2024-01-19T11:30:00Z',
    description: 'Profile rejected due to incomplete portfolio'
  },

  // Feature Flags
  {
    id: 4,
    entityType: 'account',
    entityId: 2001,
    metadataKey: 'beta_access',
    metadataValue: true,
    metadataType: 'feature_flag',
    isSystem: true,
    expiresAt: '2024-03-01T00:00:00Z',
    createdAt: '2024-01-15T12:00:00Z',
    updatedAt: '2024-01-15T12:00:00Z',
    description: 'Access to beta features'
  },
  {
    id: 5,
    entityType: 'account',
    entityId: 2001,
    metadataKey: 'advanced_analytics',
    metadataValue: true,
    metadataType: 'feature_flag',
    isSystem: true,
    expiresAt: null,
    createdAt: '2024-01-10T08:30:00Z',
    updatedAt: '2024-01-10T08:30:00Z',
    description: 'Premium analytics dashboard access'
  },
  {
    id: 6,
    entityType: 'user',
    entityId: 3001,
    metadataKey: 'bulk_upload_enabled',
    metadataValue: false,
    metadataType: 'feature_flag',
    isSystem: true,
    expiresAt: null,
    createdAt: '2024-01-12T15:20:00Z',
    updatedAt: '2024-01-17T10:45:00Z',
    description: 'Bulk media upload capability'
  },

  // Quality Metrics
  {
    id: 7,
    entityType: 'profile',
    entityId: 1001,
    metadataKey: 'quality_score',
    metadataValue: 87,
    metadataType: 'quality_metric',
    isSystem: true,
    expiresAt: null,
    createdAt: '2024-01-20T06:00:00Z',
    updatedAt: '2024-01-20T18:30:00Z',
    description: 'AI-calculated profile quality score (0-100)'
  },
  {
    id: 8,
    entityType: 'profile',
    entityId: 1001,
    metadataKey: 'view_count',
    metadataValue: 1247,
    metadataType: 'quality_metric',
    isSystem: true,
    expiresAt: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-20T23:45:00Z',
    description: 'Total profile view count'
  },
  {
    id: 9,
    entityType: 'profile',
    entityId: 1002,
    metadataKey: 'booking_success_rate',
    metadataValue: 0.73,
    metadataType: 'quality_metric',
    isSystem: true,
    expiresAt: null,
    createdAt: '2024-01-05T12:00:00Z',
    updatedAt: '2024-01-20T16:20:00Z',
    description: 'Percentage of successful bookings (0.0-1.0)'
  },

  // Business Logic Flags
  {
    id: 10,
    entityType: 'profile',
    entityId: 1001,
    metadataKey: 'is_featured',
    metadataValue: true,
    metadataType: 'business_logic',
    isSystem: false,
    expiresAt: '2024-02-15T00:00:00Z',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    description: 'Featured in search results and listings'
  },
  {
    id: 11,
    entityType: 'profile',
    entityId: 1002,
    metadataKey: 'requires_verification',
    metadataValue: true,
    metadataType: 'business_logic',
    isSystem: false,
    expiresAt: null,
    createdAt: '2024-01-18T14:30:00Z',
    updatedAt: '2024-01-18T14:30:00Z',
    description: 'Profile requires additional verification'
  },
  {
    id: 12,
    entityType: 'account',
    entityId: 2002,
    metadataKey: 'payment_method_verified',
    metadataValue: false,
    metadataType: 'business_logic',
    isSystem: false,
    expiresAt: null,
    createdAt: '2024-01-19T09:15:00Z',
    updatedAt: '2024-01-19T09:15:00Z',
    description: 'Payment method verification status'
  },

  // Cache Hints
  {
    id: 13,
    entityType: 'media_asset',
    entityId: 5001,
    metadataKey: 'needs_reprocessing',
    metadataValue: true,
    metadataType: 'cache_hint',
    isSystem: true,
    expiresAt: '2024-01-22T00:00:00Z',
    createdAt: '2024-01-20T20:15:00Z',
    updatedAt: '2024-01-20T20:15:00Z',
    description: 'Media asset requires thumbnail regeneration'
  },
  {
    id: 14,
    entityType: 'media_asset',
    entityId: 5002,
    metadataKey: 'last_optimization_run',
    metadataValue: '2024-01-20T18:30:00Z',
    metadataType: 'cache_hint',
    isSystem: true,
    expiresAt: null,
    createdAt: '2024-01-20T18:30:00Z',
    updatedAt: '2024-01-20T18:30:00Z',
    description: 'Timestamp of last optimization process'
  },

  // Experiments & A/B Tests
  {
    id: 15,
    entityType: 'user',
    entityId: 3001,
    metadataKey: 'ui_variant',
    metadataValue: 'new_dashboard_v2',
    metadataType: 'experiment',
    isSystem: true,
    expiresAt: '2024-02-29T00:00:00Z',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    description: 'A/B test variant assignment for dashboard UI'
  },
  {
    id: 16,
    entityType: 'user',
    entityId: 3002,
    metadataKey: 'experiment_group',
    metadataValue: 'control',
    metadataType: 'experiment',
    isSystem: true,
    expiresAt: '2024-02-29T00:00:00Z',
    createdAt: '2024-01-16T14:20:00Z',
    updatedAt: '2024-01-16T14:20:00Z',
    description: 'Control group for messaging experiment'
  }
];

const ENTITY_TYPES = [
  { value: 'user', label: 'User' },
  { value: 'account', label: 'Account' },
  { value: 'profile', label: 'Profile' },
  { value: 'media_asset', label: 'Media Asset' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'tenant', label: 'Tenant' },
];

const METADATA_TYPES = [
  { value: 'workflow_state', label: 'Workflow State', icon: Settings, color: 'blue' },
  { value: 'feature_flag', label: 'Feature Flag', icon: Flag, color: 'green' },
  { value: 'quality_metric', label: 'Quality Metric', icon: BarChart3, color: 'purple' },
  { value: 'business_logic', label: 'Business Logic', icon: Zap, color: 'orange' },
  { value: 'cache_hint', label: 'Cache Hint', icon: Timer, color: 'gray' },
  { value: 'experiment', label: 'A/B Test', icon: Shield, color: 'indigo' },
];

function getMetadataTypeInfo(type: string) {
  return METADATA_TYPES.find(t => t.value === type) || METADATA_TYPES[0];
}

/**
 * Entity Metadata Management Page
 * 
 * Manages runtime metadata that controls business logic, workflow states,
 * feature flags, and system behavior for platform entities.
 * 
 * @component
 * @example
 * ```tsx
 * // Accessed via /admin/entity-metadata
 * <EntityMetadataPage />
 * ```
 */
export default function EntityMetadataPage() {
  const t = useTranslations('admin-common');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedMetadataType, setSelectedMetadataType] = useState('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Mock loading state for demo
  const [isLoading, setIsLoading] = useState(false);

  // Filter data based on search and filters
  const filteredData = MOCK_METADATA.filter(item => {
    const matchesSearch = 
      item.metadataKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(item.metadataValue).toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesEntityType = selectedType === 'all' || item.entityType === selectedType;
    const matchesMetadataType = selectedMetadataType === 'all' || item.metadataType === selectedMetadataType;
    
    return matchesSearch && matchesEntityType && matchesMetadataType;
  });

  // Statistics for overview cards
  const stats = {
    total: MOCK_METADATA.length,
    workflow: MOCK_METADATA.filter(m => m.metadataType === 'workflow_state').length,
    features: MOCK_METADATA.filter(m => m.metadataType === 'feature_flag').length,
    metrics: MOCK_METADATA.filter(m => m.metadataType === 'quality_metric').length,
    business: MOCK_METADATA.filter(m => m.metadataType === 'business_logic').length,
    cache: MOCK_METADATA.filter(m => m.metadataType === 'cache_hint').length,
    experiments: MOCK_METADATA.filter(m => m.metadataType === 'experiment').length,
    expiring: MOCK_METADATA.filter(m => m.expiresAt && new Date(m.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length
  };

  // Define columns for the enhanced data table
  const columns: ColumnConfig<EntityMetadata>[] = [
    {
      key: 'metadataType',
      title: 'Type',
      sortable: true,
      filterable: true,
      filterConfig: {
        type: 'select',
        placeholder: 'All Types',
        options: METADATA_TYPES.map(t => ({ value: t.value, label: t.label }))
      },
      render: (value) => {
        const typeInfo = getMetadataTypeInfo(value);
        const IconComponent = typeInfo.icon;
        return (
          <Badge variant="outline" className={`bg-${typeInfo.color}-50 text-${typeInfo.color}-700 border-${typeInfo.color}-200`}>
            <IconComponent className="h-3 w-3 mr-1" />
            {typeInfo.label}
          </Badge>
        );
      },
      width: '140px'
    },
    {
      key: 'entityType',
      title: 'Entity',
      sortable: true,
      filterable: true,
      filterConfig: {
        type: 'select',
        placeholder: 'All Entities',
        options: ENTITY_TYPES
      },
      render: (value, row) => (
        <div className="flex flex-col">
          <Badge variant="secondary" className="text-xs w-fit">
            {ENTITY_TYPES.find(t => t.value === value)?.label || value}
          </Badge>
          <span className="text-xs text-muted-foreground mt-1">ID: {row.entityId}</span>
        </div>
      ),
      width: '100px'
    },
    {
      key: 'metadataKey',
      title: 'Key',
      sortable: true,
      filterable: true,
      filterConfig: {
        type: 'text',
        placeholder: 'Search by key'
      },
      render: (value, row) => (
        <div className="flex items-center gap-2">
          {row.isSystem && <Shield className="h-3 w-3 text-orange-500" />}
          <div className="flex flex-col">
            <span className="font-medium text-sm">{value}</span>
            <span className="text-xs text-muted-foreground">{row.description}</span>
          </div>
        </div>
      ),
      width: '250px'
    },
    {
      key: 'metadataValue',
      title: 'Value',
      sortable: false,
      filterable: false,
      render: (value) => {
        const displayValue = typeof value === 'object' 
          ? JSON.stringify(value) 
          : String(value);
        
        const isBoolean = typeof value === 'boolean';
        const isNumber = typeof value === 'number';
        
        return (
          <div className="flex items-center gap-2">
            {isBoolean && (
              <Badge variant={value ? 'default' : 'secondary'} className="text-xs">
                {value ? 'TRUE' : 'FALSE'}
              </Badge>
            )}
            {isNumber && (
              <Badge variant="outline" className="text-xs font-mono">
                {displayValue}
              </Badge>
            )}
            {!isBoolean && !isNumber && (
              <span className="text-sm font-mono text-muted-foreground max-w-[200px] truncate">
                {displayValue}
              </span>
            )}
          </div>
        );
      },
      width: '200px'
    },
    {
      key: 'expiresAt',
      title: 'Expires',
      sortable: true,
      filterable: false,
      render: (value) => {
        if (!value) {
          return <span className="text-xs text-muted-foreground">Never</span>;
        }
        
        const expiryDate = new Date(value);
        const now = new Date();
        const isExpiringSoon = expiryDate < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        
        return (
          <div className="flex items-center gap-1 text-xs">
            <Clock className={`h-3 w-3 ${isExpiringSoon ? 'text-red-500' : 'text-muted-foreground'}`} />
            <span className={isExpiringSoon ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
              {new Date(value).toLocaleDateString()}
            </span>
          </div>
        );
      },
      width: '120px',
      hidden: true
    },
    {
      key: 'updatedAt',
      title: 'Updated',
      sortable: true,
      filterable: false,
      render: (value) => <span>{new Date(value).toLocaleDateString()}</span>,
      width: '100px',
      hidden: true
    },
    {
      key: 'actions',
      title: 'Actions',
      sortable: false,
      filterable: false,
      render: (_, row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                browserLogger.info('Editing metadata', { id: row.id, key: row.metadataKey });
              }}
              disabled={row.isSystem}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Value
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                browserLogger.info('Viewing metadata history', { id: row.id, key: row.metadataKey });
              }}
            >
              <Clock className="mr-2 h-4 w-4" />
              View History
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                browserLogger.warn('Deleting metadata', { id: row.id, key: row.metadataKey });
              }}
              disabled={row.isSystem}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      width: '80px'
    }
  ];

  return (
    <AdminOnly fallback={
      <div className="text-center py-12">
        <p className="text-gray-600">Access denied. Admin permissions required.</p>
      </div>
    }>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Database className="h-8 w-8 text-blue-600" />
              Entity Metadata
            </h1>
            <p className="text-muted-foreground mt-1">
              Runtime metadata that controls business logic, workflow states, and system behavior
            </p>
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Metadata
          </Button>
        </div>

        {/* Overview Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workflow</CardTitle>
              <Settings className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.workflow}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Features</CardTitle>
              <Flag className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.features}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Metrics</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.metrics}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Business</CardTitle>
              <Zap className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.business}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cache</CardTitle>
              <Timer className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.cache}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">A/B Tests</CardTitle>
              <Shield className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">{stats.experiments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring</CardTitle>
              <Clock className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.expiring}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by key, description, or value..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Entity Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {ENTITY_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedMetadataType} onValueChange={setSelectedMetadataType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Metadata Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {METADATA_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Data Table */}
        <SkeletonWrapper isLoading={isLoading} skeleton={<DataTableSkeleton />}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Metadata Entries ({filteredData.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedDataTable
                data={filteredData}
                columns={columns}
                isLoading={isLoading}
                emptyMessage="No metadata entries found"
                enableGlobalSearch={false}
                enableColumnVisibility={true}
                enableAdvancedFilters={true}
                onRefresh={() => {
                  setIsLoading(true);
                  setTimeout(() => setIsLoading(false), 1000);
                }}
              />
            </CardContent>
          </Card>
        </SkeletonWrapper>

        {/* Add Metadata Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add Entity Metadata</DialogTitle>
              <DialogDescription>
                Create runtime metadata to control business logic, workflow states, or system behavior.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="entityType">Entity Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select entity type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="metadataType">Metadata Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select metadata type" />
                    </SelectTrigger>
                    <SelectContent>
                      {METADATA_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="entityId">Entity ID</Label>
                <Input
                  id="entityId"
                  type="number"
                  placeholder="Enter entity ID"
                />
              </div>
              <div>
                <Label htmlFor="metadataKey">Metadata Key</Label>
                <Input
                  id="metadataKey"
                  placeholder="e.g., approval_stage, beta_access, quality_score"
                />
              </div>
              <div>
                <Label htmlFor="metadataValue">Metadata Value</Label>
                <Textarea
                  id="metadataValue"
                  placeholder="Enter value (string, number, boolean, or JSON object)"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief description of what this metadata controls"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setAddDialogOpen(false)}>
                Create Metadata
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminOnly>
  );
}