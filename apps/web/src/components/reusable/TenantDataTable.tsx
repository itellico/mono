'use client';
/**
 * Universal Tenant-Aware Data Table
 * 
 * Replaces 5+ duplicate table implementations with a single, configurable component.
 * Includes automatic tenant context, permissions, pagination, and loading states.
 */
import React from 'react';
import { useTranslations } from 'next-intl';
import { useTenantQuery, useTenantMutation } from '@/lib/platform/tenant-query';
import { SkeletonWrapper, DataTableSkeleton } from '@/components/ui/tenant-skeleton';
import { useComponentLogger } from '@/lib/platform/logging';
import { EnhancedDataTable, type ColumnConfig } from '@/components/ui/enhanced-data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, Trash2, UserCheck, UserX, Ban } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// ============================================================================
// TYPES & INTERFACES
// ============================================================================
export interface TenantTableAction<T = any> {
  key: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (row: T) => void | Promise<void>;
  variant?: 'default' | 'destructive' | 'secondary';
  requirePermission?: {
    action: string;
    resource: string;
  };
  condition?: (row: T) => boolean;
  confirmMessage?: string;
}
export interface TenantTableConfig<T = any> {
  // Data & API
  resource: string;
  endpoint: string;
  tenantId?: number;
  // Permissions
  permissions?: {
    view?: { action: string; resource: string };
    create?: { action: string; resource: string };
    edit?: { action: string; resource: string };
    delete?: { action: string; resource: string };
  };
  // Table Configuration
  columns: ColumnConfig<T>[];
  actions?: TenantTableAction<T>[];
  // UI Labels (translation keys)
  labels: {
    title: string;
    description: string;
    emptyMessage: string;
    searchPlaceholder: string;
    createButton?: string;
  };
  // Features
  enableCreate?: boolean;
  enableBulkActions?: boolean;
  enableExport?: boolean;
  enableRefresh?: boolean;
  enableColumnVisibility?: boolean;
  enableAdvancedFilters?: boolean;
  // Pagination
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  // Custom handlers
  onRowClick?: (row: T) => void;
  onCreateClick?: () => void;
  onCreate?: (data: any) => Promise<void>;
  onUpdate?: (id: string | number, data: any) => Promise<void>;
  onDelete?: (id: string | number) => Promise<void>;
}
// ============================================================================
// UNIVERSAL DATA TABLE COMPONENT
// ============================================================================
export function TenantDataTable<T extends Record<string, any>>({
  resource,
  endpoint,
  tenantId,
  permissions,
  columns,
  actions = [],
  labels,
  enableCreate = false,
  enableBulkActions = false,
  enableExport = false,
  enableRefresh = true,
  enableColumnVisibility = true,
  enableAdvancedFilters = true,
  defaultPageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  onRowClick,
  onCreateClick,
  onCreate,
  onUpdate,
  onDelete }: TenantTableConfig<T>) {
  const t = useTranslations();
  const log = useComponentLogger(`TenantDataTable:${resource}`);
  const { toast } = useToast();
  // ============================================================================
  // DATA FETCHING
  // ============================================================================
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(defaultPageSize);
  const [search, setSearch] = React.useState('');
  const [filters, setFilters] = React.useState<Record<string, any>>({});
  // Main data query with tenant awareness
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useTenantQuery<{ data: T[]; total: number; pages: number }>(endpoint, {
    resource,
    action: 'list',
    tenantId,
    requirePermission: true,
    permission: permissions?.view || { action: 'view', resource },
    // Add pagination and filters to query key for proper caching
    enabled: true });
  // Create mutation
  const createMutation = useTenantMutation(endpoint, {
    resource,
    action: 'create',
    tenantId,
    requirePermission: true,
    showToasts: true,
    invalidateQueries: [`tenant-query`, `admin-query`] });
  // Update mutation
  const updateMutation = useTenantMutation(`${endpoint}/:id`, {
    resource,
    action: 'update',
    tenantId,
    requirePermission: true,
    showToasts: true,
    invalidateQueries: [`tenant-query`, `admin-query`] });
  // Delete mutation
  const deleteMutation = useTenantMutation(`${endpoint}/:id`, {
    resource,
    action: 'delete',
    tenantId,
    requirePermission: true,
    showToasts: true,
    invalidateQueries: [`tenant-query`, `admin-query`] });
  // ============================================================================
  // ACTION HANDLERS
  // ============================================================================
  const handleCreate = React.useCallback(async (data: any) => {
    try {
      log.debug('Creating new resource', { resource, data });
      if (onCreate) {
        await onCreate(data);
      } else {
        await createMutation.mutateAsync(data);
      }
      log.info('Resource created successfully', { resource });
    } catch (error) {
      log.error('Failed to create resource', { resource, error });
    }
  }, [onCreate, createMutation, resource, log]);
  const handleUpdate = React.useCallback(async (id: string | number, data: any) => {
    try {
      log.debug('Updating resource', { resource, id, data });
      if (onUpdate) {
        await onUpdate(id, data);
      } else {
        await updateMutation.mutateAsync(data);
      }
      log.info('Resource updated successfully', { resource, id });
    } catch (error) {
      log.error('Failed to update resource', { resource, id, error });
    }
  }, [onUpdate, updateMutation, resource, log]);
  const handleDelete = React.useCallback(async (id: string | number) => {
    try {
      log.debug('Deleting resource', { resource, id });
      if (onDelete) {
        await onDelete(id);
      } else {
        await deleteMutation.mutateAsync(undefined);
      }
      log.info('Resource deleted successfully', { resource, id });
    } catch (error) {
      log.error('Failed to delete resource', { resource, id, error });
    }
  }, [onDelete, deleteMutation, resource, log]);
  // ============================================================================
  // ENHANCED COLUMNS WITH ACTIONS
  // ============================================================================
  const enhancedColumns = (() => {
    const baseColumns = [...columns];
    
    // Add actions column if actions are provided
    if (actions.length > 0) {
      const actionsColumn: ColumnConfig<T> = {
        key: 'actions',
        title: t('common.actions'),
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
              {actions.map((action, index) => {
                // Check if action should be shown for this row
                if (action.condition && !action.condition(row)) {
                  return null;
                }
                const Icon = action.icon;
                return (
                  <React.Fragment key={action.key}>
                    <DropdownMenuItem
                      className={action.variant === 'destructive' ? 'text-destructive' : ''}
                      onClick={async () => {
                        log.debug('Action triggered', { 
                          action: action.key, 
                          resource, 
                          rowId: row.id 
                        });
                        
                        // Show confirmation for destructive actions
                        if (action.confirmMessage) {
                          const confirmed = window.confirm(action.confirmMessage);
                          if (!confirmed) return;
                        }
                        
                        try {
                          await action.onClick(row);
                        } catch (error) {
                          log.error('Action failed', { 
                            action: action.key, 
                            error 
                          });
                        }
                      }}
                    >
                      {Icon && <Icon className="mr-2 h-4 w-4" />}
                      {action.label}
                    </DropdownMenuItem>
                    {/* Add separator before destructive actions */}
                    {action.variant === 'destructive' && 
                     index < actions.length - 1 && 
                     <DropdownMenuSeparator />}
                  </React.Fragment>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        width: '80px'
      };
      baseColumns.push(actionsColumn);
    }
    return baseColumns;
  })();
  // ============================================================================
  // HEADER ACTIONS
  // ============================================================================
  const headerActions = (() => {
    const actionButtons = [];
    
    if (enableCreate && onCreateClick) {
      actionButtons.push(
        <Button 
          key="create" 
          onClick={onCreateClick}
          size="sm"
        >
          {labels.createButton ? t(labels.createButton) : t('common.create')}
        </Button>
      );
    }
    
    if (enableExport) {
      actionButtons.push(
        <Button 
          key="export" 
          variant="outline" 
          size="sm"
          onClick={() => {
            log.debug('Export triggered', { resource });
            // TODO: Implement export functionality
          }}
        >
          {t('common.export')}
        </Button>
      );
    }
    
    return actionButtons;
  })();
  // ============================================================================
  // ERROR HANDLING
  // ============================================================================
  if (error) {
    log.error('Data loading failed', { resource, error });
    return (
      <div className="flex items-center justify-center h-64 text-center">
        <div className="space-y-2">
          <p className="text-muted-foreground">
            {t('common.errors.loadingFailed')}
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }
  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="space-y-4">
      {/* Header with actions */}
      {headerActions.length > 0 && (
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">{t(labels.title)}</h3>
            <p className="text-sm text-muted-foreground">
              {t(labels.description)}
            </p>
          </div>
          <div className="flex gap-2">
            {headerActions}
          </div>
        </div>
      )}
      {/* Data Table with Skeleton Loading */}
      <SkeletonWrapper
        isLoading={isLoading}
        skeleton={
          <DataTableSkeleton 
            rows={pageSize} 
            columns={enhancedColumns.length}
            showHeader={true}
            showActions={actions.length > 0}
          />
        }
      >
        <EnhancedDataTable<T>
          data={data?.data || []}
          columns={enhancedColumns}
          isLoading={false} // Handled by SkeletonWrapper
          title={t(labels.title)}
          description={t(labels.description)}
          emptyMessage={t(labels.emptyMessage)}
          searchPlaceholder={t(labels.searchPlaceholder)}
          enableGlobalSearch={true}
          enableColumnVisibility={enableColumnVisibility}
          enableAdvancedFilters={enableAdvancedFilters}
          onRefresh={enableRefresh ? refetch : undefined}
          onRowClick={onRowClick}
          className="shadow-sm"
        />
      </SkeletonWrapper>
    </div>
  );
}
// ============================================================================
// PREDEFINED COMMON ACTIONS
// ============================================================================
export const CommonActions = {
  view: <T extends { id: string | number }>(onView: (row: T) => void): TenantTableAction<T> => ({
    key: 'view',
    label: 'View Details',
    icon: Eye,
    onClick: onView,
    variant: 'default' }),
  edit: <T extends { id: string | number }>(onEdit: (row: T) => void): TenantTableAction<T> => ({
    key: 'edit',
    label: 'Edit',
    icon: Edit,
    onClick: onEdit,
    variant: 'default',
    requirePermission: { action: 'update', resource: 'users' } }),
  delete: <T extends { id: string | number }>(onDelete: (row: T) => void): TenantTableAction<T> => ({
    key: 'delete',
    label: 'Delete',
    icon: Trash2,
    onClick: onDelete,
    variant: 'destructive',
    requirePermission: { action: 'delete', resource: 'users' },
    confirmMessage: 'Are you sure you want to delete this item? This action cannot be undone.' }),
  approve: <T extends { id: string | number }>(onApprove: (row: T) => void): TenantTableAction<T> => ({
    key: 'approve',
    label: 'Approve',
    icon: UserCheck,
    onClick: onApprove,
    variant: 'default',
    requirePermission: { action: 'approve', resource: 'applications' },
    condition: (row: any) => row.status === 'pending' }),
  reject: <T extends { id: string | number }>(onReject: (row: T) => void): TenantTableAction<T> => ({
    key: 'reject',
    label: 'Reject',
    icon: UserX,
    onClick: onReject,
    variant: 'destructive',
    requirePermission: { action: 'reject', resource: 'applications' },
    condition: (row: any) => row.status === 'pending' }),
  suspend: <T extends { id: string | number }>(onSuspend: (row: T) => void): TenantTableAction<T> => ({
    key: 'suspend',
    label: 'Suspend',
    icon: Ban,
    onClick: onSuspend,
    variant: 'destructive',
    requirePermission: { action: 'suspend', resource: 'users' },
    condition: (row: any) => row.status === 'active',
    confirmMessage: 'Are you sure you want to suspend this user?' }) };
// ============================================================================
// SPECIALIZED TABLE COMPONENTS
// ============================================================================
export function TenantUsersTable({ tenantId }: { tenantId?: number }) {
  const log = useComponentLogger('TenantUsersTable');
  return (
    <TenantDataTable
      resource="users"
      endpoint="/api/v1/admin/users"
      tenantId={tenantId}
      labels={{
        title: 'admin.users.title',
        description: 'admin.users.description',
        emptyMessage: 'admin.users.emptyMessage',
        searchPlaceholder: 'admin.users.searchPlaceholder',
        createButton: 'admin.users.createButton' }}
      columns={[
        {
          key: 'name',
          title: 'Name',
          sortable: true,
          filterable: true,
          render: (value, row: any) => (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                {row.firstName?.[0]}{row.lastName?.[0]}
              </div>
              <span>{row.firstName} {row.lastName}</span>
            </div>
          ) },
        {
          key: 'email',
          title: 'Email',
          sortable: true,
          filterable: true },
        {
          key: 'role',
          title: 'Role',
          sortable: true,
          filterable: true,
          render: (value) => <Badge variant="outline">{value}</Badge> },
        {
          key: 'status',
          title: 'Status',
          sortable: true,
          filterable: true,
          render: (value) => (
            <Badge variant={value === 'active' ? 'default' : 'secondary'}>
              {value}
            </Badge>
          ) },
      ]}
      actions={[
        CommonActions.view((row) => {
          log.info('View user action triggered', { userId: row.id, userEmail: (row as any).email });
          // TODO: Implement user view modal/page
        }),
        CommonActions.edit((row) => {
          log.info('Edit user action triggered', { userId: row.id, userEmail: (row as any).email });
          // TODO: Implement user edit modal/form
        }),
        CommonActions.suspend((row) => {
          log.info('Suspend user action triggered', { userId: row.id, userEmail: (row as any).email });
          // TODO: Implement user suspension logic
        }),
        CommonActions.delete((row) => {
          log.info('Delete user action triggered', { userId: row.id, userEmail: (row as any).email });
          // TODO: Implement user deletion with confirmation
        }),
      ]}
      enableCreate={true}
      enableExport={true}
      onCreateClick={() => {
        log.info('Create new user action triggered');
        // TODO: Implement user creation modal/form
      }}
    />
  );
}
export default TenantDataTable; 