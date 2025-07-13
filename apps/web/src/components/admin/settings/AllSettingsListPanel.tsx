'use client';

/**
 * All Settings List Panel - Comprehensive settings management interface
 * 
 * Features:
 * - List view of all admin settings with filtering and search
 * - Bulk operations (delete, export, update)
 * - Import/export functionality  
 * - Permission-based access control
 * - Real-time updates and optimistic UI
 * - Integration with AdminListPage component pattern
 */

import React, { useState, useMemo, useEffect } from 'react';
import { AdminListPage, type ColumnConfig, type FilterConfig, type StatCard, type BulkAction } from '@/components/admin/AdminListPage';
import { PermissionGate } from '@/components/reusable/PermissionGate';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  useAdminSettingsList,
  useCreateOrUpdateSetting,
  useDeleteSetting,
  useBulkDeleteSettings,
  useImportSettings,
  useExportSettings
} from '@/hooks/admin/useAdminSettings';
import { useAdminSettingsStore, type AdminSetting } from '@/stores/admin-settings.store';
import { 
  SettingsIcon,
  DatabaseIcon,
  GlobeIcon,
  BuildingIcon,
  EyeIcon,
  EyeOffIcon,
  EditIcon,
  TrashIcon,
  DownloadIcon,
  UploadIcon,
  RefreshCwIcon,
  PlusIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  InfoIcon,
  FileTextIcon,
  KeyIcon,
  TagIcon,
  CalendarIcon,
  UserIcon,
  ShieldIcon,
  MoreHorizontalIcon
} from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES  
// ============================================================================

interface CreateEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  setting?: AdminSetting | null;
  mode: 'create' | 'edit';
}

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// CREATE/EDIT DIALOG COMPONENT
// ============================================================================

function CreateEditSettingDialog({ isOpen, onClose, setting, mode }: CreateEditDialogProps) {
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    category: '',
    description: '',
    type: 'string' as const,
    isPublic: false,
    isGlobal: false,
  });

  const { mutate: createOrUpdate, isPending } = useCreateOrUpdateSetting();
  const { toast } = useToast();

  useEffect(() => {
    if (setting && mode === 'edit') {
      setFormData({
        key: setting.key,
        value: typeof setting.value === 'string' ? setting.value : JSON.stringify(setting.value),
        category: setting.category || '',
        description: setting.description || '',
        type: setting.type,
        isPublic: setting.isPublic,
        isGlobal: setting.tenantId === null,
      });
    } else {
      setFormData({
        key: '',
        value: '',
        category: '',
        description: '',
        type: 'string',
        isPublic: false,
        isGlobal: false,
      });
    }
  }, [setting, mode, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let processedValue = formData.value;
    if (formData.type === 'json' || formData.type === 'array') {
      try {
        processedValue = JSON.parse(formData.value);
      } catch {
        toast({
          title: 'Invalid JSON',
          description: 'Please provide valid JSON for the value.',
          variant: 'destructive',
        });
        return;
      }
    } else if (formData.type === 'number') {
      processedValue = Number(formData.value);
      if (isNaN(processedValue)) {
        toast({
          title: 'Invalid Number',
          description: 'Please provide a valid number for the value.',
          variant: 'destructive',
        });
        return;
      }
    } else if (formData.type === 'boolean') {
      processedValue = formData.value === 'true';
    }

    createOrUpdate({
      key: formData.key,
      data: {
        value: processedValue,
        category: formData.category || undefined,
        description: formData.description || undefined,
        type: formData.type,
        isPublic: formData.isPublic,
        isGlobal: formData.isGlobal,
      },
    }, {
      onSuccess: () => {
        onClose();
        toast({
          title: mode === 'create' ? 'Setting Created' : 'Setting Updated',
          description: `Setting "${formData.key}" has been ${mode === 'create' ? 'created' : 'updated'} successfully.`,
        });
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'create' ? <PlusIcon className="h-5 w-5" /> : <EditIcon className="h-5 w-5" />}
            {mode === 'create' ? 'Create New Setting' : 'Edit Setting'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Create a new admin setting for your platform configuration.'
              : 'Update the selected admin setting.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="key">Setting Key</Label>
              <Input
                id="key"
                value={formData.key}
                onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                disabled={mode === 'edit'}
                placeholder="e.g., max_upload_size"
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., upload, security"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this setting controls..."
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="type">Data Type</Label>
            <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">String</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
                <SelectItem value="json">JSON Object</SelectItem>
                <SelectItem value="array">Array</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="value">Value</Label>
            {formData.type === 'boolean' ? (
              <Select value={formData.value} onValueChange={(value) => setFormData(prev => ({ ...prev, value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Textarea
                id="value"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                placeholder={
                  formData.type === 'json' ? '{"key": "value"}' :
                  formData.type === 'array' ? '["item1", "item2"]' :
                  formData.type === 'number' ? '123' :
                  'Setting value...'
                }
                rows={formData.type === 'json' || formData.type === 'array' ? 4 : 2}
                required
              />
            )}
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
              />
              <Label htmlFor="isPublic">Public Setting</Label>
            </div>

            <PermissionGate action="manage" resource="settings" context={{ scope: 'global' }} showFallback={false}>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isGlobal"
                  checked={formData.isGlobal}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isGlobal: checked }))}
                />
                <Label htmlFor="isGlobal">Global Setting</Label>
              </div>
            </PermissionGate>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                mode === 'create' ? 'Create Setting' : 'Update Setting'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// IMPORT DIALOG COMPONENT
// ============================================================================

function ImportSettingsDialog({ isOpen, onClose }: ImportDialogProps) {
  const [importData, setImportData] = useState('');
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const { mutate: importSettings, isPending } = useImportSettings();
  const { importExport } = useAdminSettingsStore();

  const handleImport = () => {
    try {
      const settings = JSON.parse(importData);
      if (!Array.isArray(settings)) {
        throw new Error('Import data must be an array of settings');
      }

      importSettings({
        settings,
        overwriteExisting,
      }, {
        onSuccess: () => {
          onClose();
          setImportData('');
        },
      });
    } catch (error) {
      useToast().toast({
        title: 'Invalid Import Data',
        description: 'Please provide valid JSON array of settings.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UploadIcon className="h-5 w-5" />
            Import Settings
          </DialogTitle>
          <DialogDescription>
            Import settings from JSON data. Existing settings can be overwritten or preserved.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="importData">Settings JSON Data</Label>
            <Textarea
              id="importData"
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder='[{"key": "setting_name", "value": "setting_value", "category": "general"}]'
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="overwrite"
              checked={overwriteExisting}
              onCheckedChange={setOverwriteExisting}
            />
            <Label htmlFor="overwrite">Overwrite existing settings</Label>
          </div>

          {importExport.isImporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Importing settings...</span>
                <span>{importExport.importProgress ?? 0}%</span>
              </div>
              <Progress value={importExport.importProgress ?? 0} />
            </div>
          )}

          {importExport.importResults && (
            <Alert>
              <CheckCircleIcon className="h-4 w-4" />
              <AlertDescription>
                Import completed: {importExport.importResults.imported} imported, 
                {importExport.importResults.skipped} skipped
                {importExport.importResults.errors.length > 0 && 
                  `, ${importExport.importResults.errors.length} errors`
                }
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isPending || !importData.trim()}>
            {isPending ? (
              <>
                <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <UploadIcon className="mr-2 h-4 w-4" />
                Import Settings
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// EXPORT DIALOG COMPONENT
// ============================================================================

function ExportSettingsDialog({ isOpen, onClose }: ExportDialogProps) {
  const [exportParams, setExportParams] = useState({
    category: '',
    includeGlobal: false,
    format: 'json' as 'json' | 'csv',
  });
  const { mutate: exportSettings, isPending } = useExportSettings();
  const { categories } = useAdminSettingsStore();

  const handleExport = () => {
    exportSettings({
      ...exportParams,
      category: exportParams.category || undefined,
    }, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DownloadIcon className="h-5 w-5" />
            Export Settings
          </DialogTitle>
          <DialogDescription>
            Export settings to JSON or CSV format for backup or migration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="category">Category (optional)</Label>
            <Select value={exportParams.category} onValueChange={(value) => 
              setExportParams(prev => ({ ...prev, category: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="format">Export Format</Label>
            <Select value={exportParams.format} onValueChange={(value: 'json' | 'csv') => 
              setExportParams(prev => ({ ...prev, format: value }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <PermissionGate action="manage" resource="settings" context={{ scope: 'global' }} showFallback={false}>
            <div className="flex items-center space-x-2">
              <Switch
                id="includeGlobal"
                checked={exportParams.includeGlobal}
                onCheckedChange={(checked) => 
                  setExportParams(prev => ({ ...prev, includeGlobal: checked }))
                }
              />
              <Label htmlFor="includeGlobal">Include global settings</Label>
            </div>
          </PermissionGate>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isPending}>
            {isPending ? (
              <>
                <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <DownloadIcon className="mr-2 h-4 w-4" />
                Export Settings
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AllSettingsListPanel() {
  const [dialogs, setDialogs] = useState({
    createEdit: { isOpen: false, mode: 'create' as 'create' | 'edit', setting: null as AdminSetting | null },
    import: { isOpen: false },
    export: { isOpen: false },
  });

  // Store state
  const { 
    filters, 
    setFilters, 
    setSearch,
    viewState,
    settings,
    categories,
    bulkOperation,
    getFilteredSettings,
    canPerformBulkOperation,
    clearSelection,
  } = useAdminSettingsStore();

  // API hooks
  const { data, isLoading, error, refresh } = useAdminSettingsList(filters);
  const { mutate: deleteSetting } = useDeleteSetting();
  const { mutate: bulkDelete } = useBulkDeleteSettings();

  // Filtered and paginated data
  const filteredSettings = useMemo(() => getFilteredSettings(), [getFilteredSettings]);

  // Stats cards
  const statsCards: StatCard[] = useMemo(() => [
    {
      title: 'Total Settings',
      value: settings.length,
      description: 'All configured settings',
    },
    {
      title: 'Categories',
      value: categories.length,
      description: 'Setting categories',
    },
    {
      title: 'Global Settings',
      value: settings.filter(s => s.tenantId === null).length,
      description: 'Platform-wide settings',
    },
    {
      title: 'Public Settings',
      value: settings.filter(s => s.isPublic).length,
      description: 'Publicly accessible',
    },
  ], [settings, categories]);

  // Column configuration
  const columns: ColumnConfig<AdminSetting>[] = [
    {
      key: 'key',
      label: 'Setting Key',
      sortable: true,
      render: (setting) => (
        <div className="flex items-center gap-2">
          <KeyIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-sm">{setting.key}</span>
        </div>
      ),
    },
    {
      key: 'value',
      label: 'Value',
      render: (setting) => (
        <div className="max-w-xs">
          <code className="text-xs bg-muted px-2 py-1 rounded">
            {typeof setting.value === 'string' 
              ? setting.value.length > 50 
                ? `${setting.value.substring(0, 50)}...`
                : setting.value
              : JSON.stringify(setting.value).length > 50
                ? `${JSON.stringify(setting.value).substring(0, 50)}...`
                : JSON.stringify(setting.value)
            }
          </code>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (setting) => setting.category ? (
        <Badge variant="outline" className="flex items-center gap-1">
          <TagIcon className="h-3 w-3" />
          {setting.category}
        </Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (setting) => (
        <Badge variant="secondary">{setting.type}</Badge>
      ),
    },
    {
      key: 'scope',
      label: 'Scope',
      render: (setting) => (
        <Badge variant={setting.tenantId === null ? 'destructive' : 'default'} className="flex items-center gap-1">
          {setting.tenantId === null ? (
            <>
              <GlobeIcon className="h-3 w-3" />
              Global
            </>
          ) : (
            <>
              <BuildingIcon className="h-3 w-3" />
              Tenant
            </>
          )}
        </Badge>
      ),
    },
    {
      key: 'isPublic',
      label: 'Visibility',
      render: (setting) => (
        <Badge variant={setting.isPublic ? 'default' : 'outline'} className="flex items-center gap-1">
          {setting.isPublic ? (
            <>
              <EyeIcon className="h-3 w-3" />
              Public
            </>
          ) : (
            <>
              <EyeOffIcon className="h-3 w-3" />
              Private
            </>
          )}
        </Badge>
      ),
    },
    {
      key: 'updatedAt',
      label: 'Last Updated',
      sortable: true,
      render: (setting) => (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <CalendarIcon className="h-3 w-3" />
          {new Date(setting.updatedAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (setting) => (
        <div className="flex items-center gap-2">
          <PermissionGate action="write" resource="settings" context={{ scope: 'tenant' }} showFallback={false}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDialogs(prev => ({
                ...prev,
                createEdit: { isOpen: true, mode: 'edit', setting },
              }))}
            >
              <EditIcon className="h-4 w-4" />
            </Button>
          </PermissionGate>
          
          <PermissionGate action="delete" resource="settings" context={{ scope: 'tenant' }} showFallback={false}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (confirm(`Are you sure you want to delete setting "${setting.key}"?`)) {
                  deleteSetting(setting.key);
                }
              }}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </PermissionGate>
        </div>
      ),
    },
  ];

  // Filter configuration
  const filterConfigs: FilterConfig[] = [
    {
      key: 'category',
      title: 'Category',
      type: 'multiSelect',
      options: categories.map(cat => ({
        label: cat,
        value: cat,
        icon: TagIcon,
      })),
    },
    {
      key: 'type',
      title: 'Data Type',
      type: 'multiSelect',
      options: [
        { label: 'String', value: 'string' },
        { label: 'Number', value: 'number' },
        { label: 'Boolean', value: 'boolean' },
        { label: 'JSON', value: 'json' },
        { label: 'Array', value: 'array' },
      ],
    },
    {
      key: 'scope',
      title: 'Scope',
      type: 'multiSelect',
      options: [
        { label: 'Global', value: 'global', icon: GlobeIcon },
        { label: 'Tenant', value: 'tenant', icon: BuildingIcon },
      ],
    },
    {
      key: 'visibility',
      title: 'Visibility',
      type: 'multiSelect',
      options: [
        { label: 'Public', value: 'public', icon: EyeIcon },
        { label: 'Private', value: 'private', icon: EyeOffIcon },
      ],
    },
  ];

  // Bulk actions
  const bulkActions: BulkAction[] = [
    {
      label: 'Delete Selected',
      icon: TrashIcon,
      variant: 'destructive',
      action: (selectedIds) => {
        if (confirm(`Are you sure you want to delete ${selectedIds.length} settings?`)) {
          bulkDelete(Array.from(selectedIds));
        }
      },
      permission: { action: 'delete', resource: 'settings', context: { scope: 'tenant' } },
    },
    {
      label: 'Export Selected',
      icon: DownloadIcon,
      action: () => {
        setDialogs(prev => ({ ...prev, export: { isOpen: true } }));
      },
      permission: { action: 'read', resource: 'settings', context: { scope: 'tenant' } },
    },
  ];

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangleIcon className="h-4 w-4" />
        <AlertDescription>
          Failed to load settings: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <AdminListPage
        title="All Settings Management"
        description="Comprehensive view and management of all platform settings with bulk operations"
        
        statsCards={statsCards}
        
        addConfig={{
          label: 'Create Setting',
          onClick: () => setDialogs(prev => ({
            ...prev,
            createEdit: { isOpen: true, mode: 'create', setting: null },
          })),
        }}
        
        searchConfig={{
          placeholder: 'Search settings by key, value, or description...',
          value: filters.search || '',
          onChange: setSearch,
        }}
        
        filters={filterConfigs}
        columns={columns}
        data={filteredSettings}
        bulkActions={bulkActions}
        
        isLoading={isLoading}
        
        pagination={{
          page: 1,
          limit: 50,
          total: filteredSettings.length,
          totalPages: 1,
        }}
        
        customActions={
          <div className="flex items-center gap-2">
            <PermissionGate action="import" resource="settings" context={{ scope: 'tenant' }} showFallback={false}>
              <Button
                variant="outline"
                onClick={() => setDialogs(prev => ({ ...prev, import: { isOpen: true } }))}
              >
                <UploadIcon className="mr-2 h-4 w-4" />
                Import
              </Button>
            </PermissionGate>
            
            <PermissionGate action="export" resource="settings" context={{ scope: 'tenant' }} showFallback={false}>
              <Button
                variant="outline"
                onClick={() => setDialogs(prev => ({ ...prev, export: { isOpen: true } }))}
              >
                <DownloadIcon className="mr-2 h-4 w-4" />
                Export
              </Button>
            </PermissionGate>
            
            <Button variant="outline" onClick={refresh}>
              <RefreshCwIcon className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Dialogs */}
      <CreateEditSettingDialog
        isOpen={dialogs.createEdit.isOpen}
        onClose={() => setDialogs(prev => ({
          ...prev,
          createEdit: { isOpen: false, mode: 'create', setting: null },
        }))}
        setting={dialogs.createEdit.setting}
        mode={dialogs.createEdit.mode}
      />

      <ImportSettingsDialog
        isOpen={dialogs.import.isOpen}
        onClose={() => setDialogs(prev => ({ ...prev, import: { isOpen: false } }))}
      />

      <ExportSettingsDialog
        isOpen={dialogs.export.isOpen}
        onClose={() => setDialogs(prev => ({ ...prev, export: { isOpen: false } }))}
      />
    </div>
  );
}