'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Edit, Mail, UserX, Trash2, MoreHorizontal, Building2 } from 'lucide-react';
import { browserLogger } from '@/lib/browser-logger';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { AdminListPage, type StatCard, type FilterConfig, type ColumnConfig, type BulkAction } from '@/components/admin/AdminListPage';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { toast } from 'sonner';
import { 
  usePlatformUsersList, 
  useBulkUpdatePlatformUsers, 
  useDeletePlatformUser,
  type PlatformUser,
  type PlatformUserFilters 
} from '@/hooks/admin/usePlatformUsers';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface PlatformUsersClientPageProps {
  initialFiltersData: PlatformUserFilters;
  userContext: {
    userId: string;
    adminRole: string;
    tenantId: string | null;
    permissions: string[];
  };
}

interface ExtendedPlatformUserFilters extends PlatformUserFilters {
  // Additional filters can be added here
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PlatformUsersClientPage({ 
  initialFiltersData, 
  userContext 
}: PlatformUsersClientPageProps) {
  const router = useRouter();
  const { trackClick } = useAuditTracking();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [filters, setFilters] = React.useState<ExtendedPlatformUserFilters>({
    page: initialFiltersData.page || 1,
    limit: initialFiltersData.limit || 20,
    search: initialFiltersData.search || '',
    userTypes: initialFiltersData.userTypes || [],
    statuses: initialFiltersData.statuses || [],
    tenantIds: initialFiltersData.tenantIds || []
  });

  // Sorting state
  const [sortConfig, setSortConfig] = React.useState<{
    column: string;
    direction: 'asc' | 'desc' | null;
  }>({ column: '', direction: null });

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = React.useState<Record<string, boolean>>({});

  // Selection state
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set());

  // ✅ TanStack Query hooks for data management
  const { 
    data: platformUsersData,
    isLoading,
    isRefetching,
    error,
    refetch
  } = usePlatformUsersList(filters);

  // ✅ Mutation hooks for CRUD operations
  const bulkUpdateMutation = useBulkUpdatePlatformUsers();
  const deleteUserMutation = useDeletePlatformUser();

  // Modal management
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = React.useState(false);
  const [actionState, setActionState] = React.useState<{
    type: 'delete' | 'bulk-delete';
    userId?: string;
    selectedIds?: Set<string>;
  } | null>(null);

  // ============================================================================
  // DATA TRANSFORMATION
  // ============================================================================

  const tableData = React.useMemo(() => {
    if (!platformUsersData?.users) return [];
    
    return platformUsersData.users
      .filter((user): user is NonNullable<typeof user> => Boolean(user))
      .map(user => ({
        ...user,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown',
        statusBadge: (
          <Badge variant={user.isActive ? 'default' : 'secondary'}>
            {user.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
        verificationBadge: (
          <Badge variant={user.isVerified ? 'default' : 'outline'}>
            {user.isVerified ? 'Verified' : 'Unverified'}
          </Badge>
        ),
        tenantBadge: user.tenant ? (
          <div className="flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            <span className="text-xs">{user.tenant.name}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">No tenant</span>
        ),
        lastLoginFormatted: user.lastLoginAt ? (
          <span>{new Date(user.lastLoginAt).toLocaleDateString()}</span>
        ) : (
          'Never'
        ),
        createdAtFormatted: <span>{new Date(user.createdAt).toLocaleDateString()}</span>,
      }));
  }, [platformUsersData?.users]);

  const pagination = React.useMemo(() => {
    if (!platformUsersData?.pagination) {
      return {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasMore: false
      };
    }
    
    return platformUsersData.pagination;
  }, [platformUsersData?.pagination]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleFilterChange = (key: string, values: string[]) => {
    setFilters(prev => ({
      ...prev,
      [key]: values,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      search: '',
      userTypes: [],
      statuses: [],
      tenantIds: []
    });
  };

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      search: value,
      page: 1 // Reset to first page when searching
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }));
  };

  // Handle column sorting
  const handleSort = (column: string) => {
    setSortConfig(prev => {
      if (prev.column === column) {
        // Toggle direction: asc -> desc -> null -> asc
        const nextDirection = prev.direction === 'asc' ? 'desc' : prev.direction === 'desc' ? null : 'asc';
        return { column, direction: nextDirection };
      } else {
        // New column, start with asc
        return { column, direction: 'asc' };
      }
    });
  };

  const handleRowSelect = (id: string, selected: boolean) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedRows(new Set(tableData.map(user => user.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleUserAction = (action: string, userId: string) => {
    trackClick(`platform_user_${action}`, { userId, userRole: userContext.adminRole });
    
    switch (action) {
      case 'view':
        router.push(`/admin/platform-users/${userId}`);
        break;
      case 'edit':
        router.push(`/admin/platform-users/${userId}/edit`);
        break;
      case 'email':
        // TODO: Implement platform email functionality
        browserLogger.info('Platform user email action', { userId });
        toast.info('Platform email functionality coming soon');
        break;
      case 'delete':
        setActionState({ type: 'delete', userId });
        setDeleteModalOpen(true);
        break;
    }
  };

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  const handleBulkStatusChange = (status: 'active' | 'inactive', selectedIds: Set<string>) => {
    trackClick(`platform_bulk_user_${status}`, { count: selectedIds.size });
    browserLogger.info(`Platform bulk ${status} operation`, { 
      selectedCount: selectedIds.size,
      userRole: userContext.adminRole
    });
    
    const action = status === 'active' ? 'activate' : 'deactivate';
    bulkUpdateMutation.mutate({
      userIds: Array.from(selectedIds),
      action
    });
    
    // Clear selection after operation
    setSelectedRows(new Set());
  };

  const handleBulkDelete = (selectedIds: Set<string>) => {
    trackClick('platform_bulk_user_delete', { count: selectedIds.size });
    browserLogger.warn('Platform bulk delete operation initiated', { 
      selectedCount: selectedIds.size,
      userRole: userContext.adminRole
    });
    
    setActionState({
      type: 'bulk-delete',
      selectedIds
    });
    setBulkDeleteModalOpen(true);
  };

  const handleBulkEmail = (selectedIds: Set<string>) => {
    trackClick('platform_bulk_user_email', { count: selectedIds.size });
    browserLogger.info('Platform bulk email operation', { 
      selectedCount: selectedIds.size,
      userRole: userContext.adminRole
    });
    
    // TODO: Implement platform bulk email functionality
    toast.info('Platform bulk email functionality coming soon');
    
    // Clear selection after operation
    setSelectedRows(new Set());
  };

  // ✅ DELETE OPERATIONS: Real deletion with cache coordination
  const deleteUser = async (userId: string) => {
    try {
      await deleteUserMutation.mutateAsync(userId);
      browserLogger.info('Platform user deleted successfully', { userId, userRole: userContext.adminRole });
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete user';
      browserLogger.error('Failed to delete platform user', { userId, error: message });
      throw error;
    }
  };

  const bulkDeleteUsers = async (userIds: Set<string>) => {
    try {
      const deletePromises = Array.from(userIds).map(id => 
        deleteUserMutation.mutateAsync(id)
      );

      const results = await Promise.allSettled(deletePromises);
      const failures = results.filter(r => r.status === 'rejected').length;
      const successes = results.length - failures;

      if (successes > 0) {
        toast.success(`Successfully deleted ${successes} user${successes === 1 ? '' : 's'}`);
        browserLogger.info('Platform bulk delete completed', { 
          successes, 
          failures, 
          userRole: userContext.adminRole 
        });
      }

      if (failures > 0) {
        toast.error(`Failed to delete ${failures} user${failures === 1 ? '' : 's'}`);
        browserLogger.error('Platform bulk delete had failures', { failures });
      }

      // Clear selection
      setSelectedRows(new Set());
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete users';
      toast.error(message);
      browserLogger.error('Platform bulk delete failed', { error: message });
      throw error;
    }
  };

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  // Stats cards with platform-wide data
  const statsCards: StatCard[] = [
    {
      title: 'Total Platform Users',
      value: platformUsersData?.stats.totalUsers.toString() || '0',
      description: 'Users across all tenants'
    },
    {
      title: 'Active Users',
      value: platformUsersData?.stats.activeUsers.toString() || '0',
      description: 'Currently active users'
    },
    {
      title: 'Verified Users',
      value: platformUsersData?.stats.verifiedUsers.toString() || '0',
      description: 'Email verified users'
    },
    {
      title: 'Total Tenants',
      value: platformUsersData?.stats.totalTenants.toString() || '0',
      description: 'Active tenant organizations'
    }
  ];

  // Filter configurations for platform users
  const filterConfigs: FilterConfig[] = [
    {
      key: 'userTypes',
      title: 'User Types',
      type: 'multiSelect',
      options: [
        { label: 'Individual', value: 'individual' },
        { label: 'Model', value: 'model' },
        { label: 'Client', value: 'client' },
        { label: 'Agency', value: 'agency' },
        { label: 'Photographer', value: 'photographer' }
      ]
    },
    {
      key: 'statuses',
      title: 'Status',
      type: 'multiSelect',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' }
      ]
    },
    {
      key: 'tenantIds',
      title: 'Tenants',
      type: 'multiSelect',
      options: Object.values(platformUsersData?.tenantSummaries || {}).map(tenant => ({
        label: `${tenant.name} (${tenant.userCount} users)`,
        value: tenant.id.toString()
      }))
    }
  ];

  // Column configurations for platform users
  const columns: ColumnConfig<PlatformUser>[] = [
    {
      key: 'firstName',
      title: 'User',
      sortable: true,
      hideable: false,
      render: (value, user) => (
        <div className="flex flex-col">
          <span className="font-medium">{user.firstName} {user.lastName}</span>
          <span className="text-sm text-muted-foreground">{user.email}</span>
        </div>
      )
    },
    {
      key: 'tenant',
      title: 'Tenant',
      sortable: false,
      hideable: false,
      render: (value, user) => user.tenant ? (
        <div className="flex items-center gap-1">
          <Building2 className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{user.tenant.name}</span>
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">No tenant</span>
      )
    },
    {
      key: 'userType',
      title: 'Type',
      sortable: true,
      hideable: true,
      render: (value, user) => (
        <Badge variant="outline" className="capitalize">
          {user.userType}
        </Badge>
      )
    },
    {
      key: 'isActive',
      title: 'Status',
      sortable: false,
      hideable: false,
      render: (value, user) => (
        <Badge variant={user.isActive ? 'default' : 'secondary'}>
          {user.isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      key: 'isVerified',
      title: 'Verification',
      sortable: false,
      hideable: true,
      render: (value, user) => (
        <Badge variant={user.isVerified ? 'default' : 'outline'}>
          {user.isVerified ? 'Verified' : 'Unverified'}
        </Badge>
      )
    },
    {
      key: 'stats',
      title: 'Sessions',
      sortable: false,
      hideable: true,
      render: (value, user) => (
        <span className="text-sm">{user.stats.sessionCount}</span>
      )
    },
    {
      key: 'lastLoginAt',
      title: 'Last Login',
      sortable: true,
      hideable: true,
      render: (value, user) => {
        return user.lastLoginAt ? (
          <span>{new Date(user.lastLoginAt).toLocaleDateString()}</span>
        ) : (
          'Never'
        );
      }
    },
    {
      key: 'createdAt',
      title: 'Created',
      sortable: true,
      hideable: true,
      render: (value, user) => (
        <span>{new Date(user.createdAt).toLocaleDateString()}</span>
      )
    },
    {
      key: 'id',
      title: 'Actions',
      sortable: false,
      render: (user) => {
        if (!user) return null;
        return renderRowActions(user);
      }
    }
  ];

  // Bulk actions configuration for platform users
  const bulkActions: BulkAction[] = [
    {
      key: 'activate',
      label: 'Activate',
      variant: 'outline',
      permission: { action: 'update', resource: 'platform-users' },
      onClick: (selectedIds) => handleBulkStatusChange('active', selectedIds)
    },
    {
      key: 'deactivate',
      label: 'Deactivate',
      variant: 'outline',
      permission: { action: 'update', resource: 'platform-users' },
      onClick: (selectedIds) => handleBulkStatusChange('inactive', selectedIds)
    },
    {
      key: 'email',
      label: 'Send Email',
      variant: 'outline',
      permission: { action: 'manage', resource: 'platform-users' },
      onClick: handleBulkEmail
    },
    {
      key: 'delete',
      label: 'Delete',
      variant: 'destructive',
      permission: { action: 'delete', resource: 'platform-users' },
      onClick: handleBulkDelete
    }
  ];

  // Row actions renderer
  function renderRowActions(user: PlatformUser) {
    if (!user) return null;
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <PermissionGate permissions={['platform-users.read']}>
            <DropdownMenuItem onClick={() => handleUserAction('view', user.uuid)}>
              <Eye className="mr-2 h-4 w-4" />
              View Profile
            </DropdownMenuItem>
          </PermissionGate>
          <PermissionGate permissions={['platform-users.update']}>
            <DropdownMenuItem onClick={() => handleUserAction('edit', user.uuid)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit User
            </DropdownMenuItem>
          </PermissionGate>
          <PermissionGate permissions={['platform-users.manage']}>
            <DropdownMenuItem onClick={() => handleUserAction('email', user.uuid)}>
              <Mail className="mr-2 h-4 w-4" />
              Send Email
            </DropdownMenuItem>
          </PermissionGate>
          <DropdownMenuSeparator />
          <PermissionGate permissions={['platform-users.delete']}>
            <DropdownMenuItem 
              onClick={() => handleUserAction('delete', user.uuid)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </PermissionGate>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Active filters for the composite component
  const activeFilters = {
    userTypes: filters.userTypes,
    statuses: filters.statuses,
    tenantIds: filters.tenantIds
  };

  // Handle column visibility changes
  const handleColumnVisibilityChange = (visibility: Record<string, boolean>) => {
    setColumnVisibility(visibility);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      <AdminListPage<PlatformUser>
        statsCards={statsCards}
        addConfig={{
          label: "Create Platform User",
          href: "/admin/platform-users/new",
          permission: {
            action: "platform-users.create",
            resource: "platform-users"
          }
        }}
        searchConfig={{
          placeholder: "Search platform users by name, email, or tenant...",
          value: filters.search,
          onChange: handleSearchChange
        }}
        filters={filterConfigs}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        columns={columns}
        data={tableData}
        isLoading={isLoading || isRefetching}
        fetchError={error?.message || null}
        selectedRows={selectedRows}
        onRowSelect={handleRowSelect}
        onSelectAll={handleSelectAll}
        getRowId={(row) => row.id}
        bulkActions={bulkActions}
        pagination={pagination}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        sortConfig={sortConfig}
        onSort={handleSort}
        onRowClick={(user) => {
          handleUserAction('view', user.uuid);
        }}
        onColumnVisibilityChange={handleColumnVisibilityChange}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={deleteModalOpen}
        title="Delete Platform User"
        description={
          actionState?.type === 'delete' && actionState.userId
            ? `Are you sure you want to delete this platform user? This action cannot be undone and will permanently remove all associated data across all tenants.`
            : 'Are you sure you want to delete this platform user?'
        }
        confirmText="Delete User"
        variant="destructive"
        icon="delete"
        onConfirm={async () => {
          if (actionState?.type === 'delete' && actionState.userId) {
            await deleteUser(actionState.userId);
            setActionState(null);
            setDeleteModalOpen(false);
          }
        }}
        onCancel={() => {
          setActionState(null);
          setDeleteModalOpen(false);
        }}
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmationModal
        open={bulkDeleteModalOpen}
        title="Delete Multiple Platform Users"
        description={
          actionState?.type === 'bulk-delete' && actionState.selectedIds
            ? `Are you sure you want to delete ${actionState.selectedIds.size} platform users? This action cannot be undone and will permanently remove all associated data across all tenants.`
            : 'Are you sure you want to delete these platform users?'
        }
        confirmText={`Delete ${actionState?.selectedIds?.size || 0} Users`}
        variant="destructive"
        icon="delete"
        onConfirm={async () => {
          if (actionState?.type === 'bulk-delete' && actionState.selectedIds) {
            await bulkDeleteUsers(actionState.selectedIds);
            setActionState(null);
            setBulkDeleteModalOpen(false);
          }
        }}
        onCancel={() => {
          setActionState(null);
          setBulkDeleteModalOpen(false);
        }}
      />
    </>
  );
}