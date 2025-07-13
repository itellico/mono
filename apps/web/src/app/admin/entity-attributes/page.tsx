'use client';
import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useComponentLogger } from '@/lib/platform/logging';
import { useTenantQuery } from '@/lib/platform/tenant-query';
import { SkeletonWrapper, DataTableSkeleton } from '@/components/ui/tenant-skeleton';
import { EnhancedDataTable, type ColumnConfig } from '@/components/ui/enhanced-data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  MoreHorizontal, 
  FileText, 
  Edit, 
  Trash2, 
  Plus, 
  Shield, 
  Clock 
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PermissionGate } from '@/components/reusable/PermissionGate';
import { AdminOnly } from '@/components/admin/AdminOnly';
interface EntityAttributeData {
  id: number;
  entityType: string;
  entityId: number;
  attributeKey: string;
  attributeValue: any;
  isSystem: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: number | null;
  updatedBy: number | null;
}
const ENTITY_TYPES = [
  { value: 'user', label: 'User' },
  { value: 'account', label: 'Account' },
  { value: 'profile', label: 'Profile' },
  { value: 'media_asset', label: 'Media Asset' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'tenant', label: 'Tenant' },
];
export default function EntityAttributesPage() {
  const t = useTranslations('admin-common');
  const log = useComponentLogger('EntityAttributesPage');
  // Use new tenant-aware query system
  const { data, isLoading, refetch } = useTenantQuery<{ attributes: EntityAttributeData[] }>('/api/v1/admin/entity-attributes?limit=100', {
    resource: 'entity-attributes',
    action: 'list',
    requirePermission: true,
    permission: {
      action: 'view',
      resource: 'entity-attributes'
    }
  });
  // State for dialogs and forms
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState<EntityAttributeData | null>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<Set<number>>(new Set());
  const [confirmationText, setConfirmationText] = useState('');
  // Form state
  const [newAttribute, setNewAttribute] = useState({
    entityType: '',
    attributeKey: '',
    attributeValue: '',
    isSystem: false,
  });
  const [editAttribute, setEditAttribute] = useState({
    attributeValue: '',
  });
  // Transform data for the table
  const tableData: EntityAttributeData[] = React.useMemo(() => {
    return data?.attributes || [];
  }, [data?.attributes]);
  // Define columns for the enhanced data table
  const columns: ColumnConfig<EntityAttributeData>[] = [
    {
      key: 'select',
      title: '',
      sortable: false,
      filterable: false,
      render: (_, row) => (
        <input
          type="checkbox"
          checked={selectedAttributes.has(row.id)}
          onChange={(e) => {
            const newSelected = new Set(selectedAttributes);
            if (e.target.checked) {
              newSelected.add(row.id);
            } else {
              newSelected.delete(row.id);
            }
            setSelectedAttributes(newSelected);
          }}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      width: '50px'
    },
    {
      key: 'entityType',
      title: 'Entity Type',
      sortable: true,
      filterable: true,
      filterConfig: {
        type: 'select',
        placeholder: 'All Types',
        options: ENTITY_TYPES
      },
      render: (value) => (
        <Badge variant="outline" className="capitalize">
          {ENTITY_TYPES.find(t => t.value === value)?.label || value}
        </Badge>
      ),
      width: '120px'
    },
    {
      key: 'attributeKey',
      title: 'Attribute Key',
      sortable: true,
      filterable: true,
      filterConfig: {
        type: 'text',
        placeholder: 'Search by Key'
      },
      render: (value, row) => (
        <div className="flex items-center gap-2">
          {row.isSystem && <Shield className="h-3 w-3 text-orange-500" />}
          <span className="font-medium">{value}</span>
        </div>
      ),
      width: '200px'
    },
    {
      key: 'attributeValue',
      title: 'Value',
      sortable: false,
      filterable: false,
      render: (value) => {
        const displayValue = typeof value === 'object' 
          ? JSON.stringify(value).substring(0, 50) + '...'
          : String(value).substring(0, 50);
        return (
          <span className="text-xs text-muted-foreground font-mono">
            {displayValue}
          </span>
        );
      },
      width: '200px'
    },
    {
      key: 'isSystem',
      title: 'Type',
      sortable: true,
      filterable: true,
      filterConfig: {
        type: 'select',
        placeholder: 'All Types',
        options: [
          { value: 'true', label: 'System' },
          { value: 'false', label: 'User' }
        ]
      },
      render: (value) => (
        <Badge 
          variant={value ? 'destructive' : 'secondary'}
          className="text-xs"
        >
          {value ? (
            <>
              <Shield className="h-3 w-3 mr-1" />
              System
            </>
          ) : (
            'User'
          )}
        </Badge>
      ),
      width: '100px'
    },
    {
      key: 'expiresAt',
      title: 'Expires',
      sortable: true,
      filterable: false,
      render: (value) => value ? (
        <div className="flex items-center gap-1 text-xs">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span>{new Date(value).toLocaleDateString()}</span>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">Never</span>
      ),
      width: '120px',
      hidden: true
    },
    {
      key: 'createdAt',
      title: 'Created',
      sortable: true,
      filterable: false,
      render: (value) => <span>{new Date(value).toLocaleDateString()}</span>,
      width: '120px',
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
                setSelectedAttribute(row);
                setEditAttribute({
                  attributeValue: typeof row.attributeValue === 'string' 
                    ? row.attributeValue 
                    : JSON.stringify(row.attributeValue),
                });
                setEditDialogOpen(true);
              }}
              disabled={row.isSystem}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSelectedAttribute(row);
                setDeleteDialogOpen(true);
              }}
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
  // Handle add attribute
  const handleAddAttribute = async () => {
    try {
      let value: any = newAttribute.attributeValue;
      // Try to parse as JSON if it looks like JSON
      if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('[') || value === 'true' || value === 'false' || !isNaN(Number(value)))) {
        try {
          value = JSON.parse(value);
        } catch {
          // Keep as string if JSON parsing fails
        }
      }
      const payload = {
        entityType: newAttribute.entityType,
        entityId: 1, // Auto-generated - will be replaced by actual entity ID logic
        attributeKey: newAttribute.attributeKey,
        attributeValue: value,
        isSystem: newAttribute.isSystem,
      };
      const response = await fetch('/api/v1/admin/entity-attributes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create attribute');
      }
      // Reset form
      setNewAttribute({
        entityType: '',
        attributeKey: '',
        attributeValue: '',
        isSystem: false,
      });
      setAddDialogOpen(false);
      // Refresh data
      refetch();
      log.info('Entity attribute created successfully');
    } catch (error) {
      log.error('Failed to create entity attribute', { error });
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  // Handle edit attribute
  const handleEditAttribute = async () => {
    if (!selectedAttribute) return;
    try {
      let value: any;
      try {
        value = JSON.parse(editAttribute.attributeValue);
      } catch {
        value = editAttribute.attributeValue;
      }
      const payload = {
        attributeValue: value,
      };
      const response = await fetch(`/api/v1/admin/entity-attributes/${selectedAttribute.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Failed to update attribute');
      }
      setEditDialogOpen(false);
      refetch();
    } catch (error) {
      log.error('Failed to update entity attribute', { error });
    }
  };
  // Handle delete attribute
  const handleDeleteAttribute = async () => {
    if (!selectedAttribute) return;
    try {
      const response = await fetch(`/api/v1/admin/entity-attributes/${selectedAttribute.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete attribute');
      }
      setDeleteDialogOpen(false);
      setConfirmationText('');
      refetch();
    } catch (error) {
      log.error('Failed to delete entity attribute', { error });
    }
  };
  // Handle bulk delete attributes
  const handleBulkDeleteAttributes = async () => {
    if (selectedAttributes.size === 0) return;
    try {
      const deletePromises = Array.from(selectedAttributes).map(id =>
        fetch(`/api/v1/admin/entity-attributes/${id}`, {
          method: 'DELETE',
        })
      );
      const responses = await Promise.all(deletePromises);
      const failedDeletes = responses.filter(response => !response.ok);
      if (failedDeletes.length > 0) {
        throw new Error(`Failed to delete ${failedDeletes.length} attributes`);
      }
      setBulkDeleteDialogOpen(false);
      setSelectedAttributes(new Set());
      refetch();
      log.info('Bulk delete completed', { deletedCount: selectedAttributes.size });
    } catch (error) {
      log.error('Failed to bulk delete entity attributes', { error });
    }
  };
  // Handle select all checkbox
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(tableData.map(item => item.id));
      setSelectedAttributes(allIds);
    } else {
      setSelectedAttributes(new Set());
    }
  };
  // Check if all items are selected
  const isAllSelected = tableData.length > 0 && selectedAttributes.size === tableData.length;
  const isIndeterminate = selectedAttributes.size > 0 && selectedAttributes.size < tableData.length;
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Entity Attributes</h1>
          <p className="text-muted-foreground">
            Manage dynamic attributes and metadata for platform entities
          </p>
        </div>
        <AdminOnly>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Attribute
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Entity Attribute</DialogTitle>
                <DialogDescription>
                  Create a new attribute for an entity. Entity ID will be auto-generated. Values can be strings, numbers, booleans, or JSON objects.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="entityType">Entity Type</Label>
                    <Select
                      value={newAttribute.entityType}
                      onValueChange={(value) => setNewAttribute(prev => ({ ...prev, entityType: value }))}
                    >
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
                    <Label htmlFor="attributeKey">Attribute Key</Label>
                    <Input
                      id="attributeKey"
                      value={newAttribute.attributeKey}
                      onChange={(e) => setNewAttribute(prev => ({ ...prev, attributeKey: e.target.value }))}
                      placeholder="e.g., feature_flag, preference_setting"
                    />
                  </div>
                  <div>
                    <Label htmlFor="attributeValue">Attribute Value (Optional)</Label>
                    <Textarea
                      id="attributeValue"
                      value={newAttribute.attributeValue}
                      onChange={(e) => setNewAttribute(prev => ({ ...prev, attributeValue: e.target.value }))}
                      placeholder="Enter value (string, number, boolean, or JSON object)"
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isSystem"
                      checked={newAttribute.isSystem}
                      onCheckedChange={(checked) => setNewAttribute(prev => ({ ...prev, isSystem: checked === true }))}
                    />
                    <Label htmlFor="isSystem" className="text-sm">
                      System attribute (cannot be edited once created)
                    </Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddAttribute}
                  disabled={!newAttribute.entityType || !newAttribute.attributeKey}
                  className="w-full"
                >
                  Create Attribute
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </AdminOnly>
      </div>
      <SkeletonWrapper 
        isLoading={isLoading}
        skeleton={<DataTableSkeleton />}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Entity Attributes ({tableData.length})
              </CardTitle>
              {selectedAttributes.size > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="px-3 py-1">
                    {selectedAttributes.size} selected
                  </Badge>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setBulkDeleteDialogOpen(true)}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Selected
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedAttributes(new Set())}
                  >
                    Clear Selection
                  </Button>
                </div>
              )}
            </div>
            {tableData.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Select all {tableData.length} attributes</span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <EnhancedDataTable
              data={tableData}
              columns={columns}
              isLoading={isLoading}
              emptyMessage="No entity attributes found"
              enableGlobalSearch={true}
              enableColumnVisibility={true}
              enableAdvancedFilters={true}
              onRefresh={refetch}
            />
          </CardContent>
        </Card>
      </SkeletonWrapper>
      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Attribute</DialogTitle>
            <DialogDescription>
              Update the value and expiration of this attribute.
            </DialogDescription>
          </DialogHeader>
          {selectedAttribute && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Entity Type</Label>
                  <p className="text-sm text-muted-foreground">{selectedAttribute.entityType}</p>
                </div>
                <div>
                  <Label>Attribute Key</Label>
                  <p className="text-sm text-muted-foreground">{selectedAttribute.attributeKey}</p>
                </div>
              </div>
              <div>
                <Label htmlFor="editAttributeValue">Attribute Value</Label>
                <Textarea
                  id="editAttributeValue"
                  value={editAttribute.attributeValue}
                  onChange={(e) => setEditAttribute(prev => ({ ...prev, attributeValue: e.target.value }))}
                  placeholder="Enter value (string, number, boolean, or JSON object)"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditAttribute}
              disabled={!editAttribute.attributeValue}
            >
              Update Attribute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attribute</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedAttribute?.isSystem ? (
                <div className="space-y-2">
                  <p>This is a <strong>system attribute</strong> which requires special confirmation to delete.</p>
                  <p>Type <code className="bg-muted px-1 py-0.5 rounded text-sm">{selectedAttribute.attributeKey}</code> or <code className="bg-muted px-1 py-0.5 rounded text-sm">delete</code> to confirm:</p>
                  <Input
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder={`Type "${selectedAttribute.attributeKey}" or "delete"`}
                    className="mt-2"
                  />
                </div>
              ) : (
                `Are you sure you want to delete the attribute "${selectedAttribute?.attributeKey}"? This action cannot be undone.`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setConfirmationText('');
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAttribute}
              disabled={
                selectedAttribute?.isSystem && 
                confirmationText !== selectedAttribute.attributeKey && 
                confirmationText !== 'delete'
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Attribute
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Attributes</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedAttributes.size} selected attribute{selectedAttributes.size !== 1 ? 's' : ''}? This action cannot be undone.
              {Array.from(selectedAttributes).some(id => {
                const attr = tableData.find(item => item.id === id);
                return attr?.isSystem;
              }) && (
                <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-orange-800">
                  <strong>Warning:</strong> Some selected attributes are system attributes which require special care when deleting.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBulkDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteAttributes}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {selectedAttributes.size} Attribute{selectedAttributes.size !== 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 