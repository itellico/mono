'use client';

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { browserLogger } from '@/lib/browser-logger';
// Removed import of extractUserContext - will create inline
import { AdminListPage, type ColumnConfig, type FilterConfig, type StatCard } from '@/components/admin/AdminListPage';
import { PermissionGate } from '@/components/auth/PermissionGate';
import {
  Button,
} from '@/components/ui/button';
import {
  Badge,
} from '@/components/ui/badge';
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
} from '@/components/ui/dialog';
import {
  BookmarkIcon,
  MoreHorizontalIcon,
  EditIcon,
  TrashIcon,
  StarIcon,
  ShareIcon,
  ClockIcon,
  SearchIcon,
  PlusIcon,
} from 'lucide-react';

// Types
interface SavedSearch {
  id: number;
  uuid: string;
  userId: number;
  tenantId: number;
  name: string;
  description: string | null;
  entityType: string;
  filters: Record<string, unknown>;
  sortBy: string | null;
  sortOrder: string | null;
  columnConfig: Record<string, boolean> | null;
  isDefault: boolean;
  isPublic: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

interface PaginationConfig {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * 📋 Saved Searches Management Page
 * 
 * Complete admin interface for managing saved searches using AdminListPage component.
 * Includes filtering, sorting, bulk actions, and CRUD operations.
 * 
 * @component
 */
export default function SavedSearchesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const userContext = {
    isAuthenticated: !!user,
    userId: user?.id || user?.uuid || '',
    tenantId: user?.tenantId || 0,
    roles: user?.roles || [],
    permissions: user?.permissions || []
  };
  const queryClient = useQueryClient();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [pagination, setPagination] = useState<PaginationConfig>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [sortConfig, setSortConfig] = useState<{
    column: string;
    direction: 'asc' | 'desc' | null;
  }>({ column: 'updatedAt', direction: 'desc' });
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    name: true,
    entityType: true,
    user: true,
    isDefault: true,
    isPublic: true,
    updatedAt: true,
    actions: true,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<SavedSearch | null>(null);

  // Fetch saved searches
  const {
    data: savedSearchesData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['admin-saved-searches', {
      page: pagination.page,
      limit: pagination.limit,
      search: searchQuery,
      filters: activeFilters,
      sort: sortConfig
    }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(sortConfig.column && { sortBy: sortConfig.column }),
        ...(sortConfig.direction && { sortOrder: sortConfig.direction }),
      });

      // Add filter parameters
      Object.entries(activeFilters).forEach(([key, values]) => {
        values.forEach(value => params.append(key, value));
      });

      const response = await fetch(`/api/v1/admin/saved-searches?${params}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch saved searches');
      }

      const result = await response.json();
      
      // Update pagination state
      if (result.meta?.pagination) {
        setPagination(result.meta.pagination);
      }

      return result.data;
    },
    enabled: !!userContext.isAuthenticated && !authLoading,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (searchId: number) => {
      const response = await fetch(`/api/v1/admin/saved-searches/${searchId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete saved search');
      }

      return response.json();
    },
    onSuccess: (_, searchId) => {
      queryClient.invalidateQueries({ queryKey: ['admin-saved-searches'] });
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
      setSelectedRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(searchId);
        return newSet;
      });
      toast.success('Saved search deleted successfully');
      
      browserLogger.userAction('saved_search_deleted', 'Deleted saved search from admin', {
        searchId,
        fromAdminPanel: true
      });
    },
    onError: (error) => {
      toast.error('Failed to delete saved search', {
        description: error.message
      });
      
      browserLogger.error('Failed to delete saved search', {
        error: error.message,
        fromAdminPanel: true
      });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (searchIds: number[]) => {
      const response = await fetch('/api/v1/admin/saved-searches/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: searchIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete saved searches');
      }

      return response.json();
    },
    onSuccess: (_, searchIds) => {
      queryClient.invalidateQueries({ queryKey: ['admin-saved-searches'] });
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
      setSelectedRows(new Set());
      toast.success(`${searchIds.length} saved searches deleted successfully`);
      
      browserLogger.userAction('saved_searches_bulk_deleted', 'Bulk deleted saved searches from admin', {
        count: searchIds.length,
        fromAdminPanel: true
      });
    },
    onError: (error) => {
      toast.error('Failed to delete saved searches', {
        description: error.message
      });
      
      browserLogger.error('Failed to bulk delete saved searches', {
        error: error.message,
        fromAdminPanel: true
      });
    },
  });

  // Event handlers
  const handleFilterChange = useCallback((key: string, values: string[]) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: values
    }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1
  }, []);

  const handleClearFilters = useCallback(() => {
    setActiveFilters({});
    setSearchQuery('');
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleSort = useCallback((column: string) => {
    setSortConfig(prev => {
      if (prev.column === column) {
        return {
          column,
          direction: prev.direction === 'asc' ? 'desc' : prev.direction === 'desc' ? null : 'asc'
        };
      }
      return { column, direction: 'asc' };
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const handleLimitChange = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  }, []);

  const handleRowSelect = useCallback((id: number, selected: boolean) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected && savedSearchesData?.searches) {
      setSelectedRows(new Set(savedSearchesData.searches.map((search: SavedSearch) => search.id)));
    } else {
      setSelectedRows(new Set());
    }
  }, [savedSearchesData?.searches]);

  const handleDelete = (search: SavedSearch) => {
    setItemToDelete(search);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleBulkDelete = () => {
    if (selectedRows.size > 0) {
      const idsArray = Array.from(selectedRows);
      bulkDeleteMutation.mutate(idsArray);
    }
  };

  const handleRowClick = (search: SavedSearch) => {
    router.push(`/admin/saved-searches/${search.id}`);
  };

  // Configuration
  const filterConfigs: FilterConfig[] = [
    {
      key: 'entityType',
      title: 'Entity Type',
      type: 'multiSelect',
      options: [
        { label: 'Tenants', value: 'tenants' },
        { label: 'Users', value: 'users' },
        { label: 'Jobs', value: 'jobs' },
        { label: 'Orders', value: 'orders' },
      ],
      placeholder: 'Select entity types...',
    },
    {
      key: 'isDefault',
      title: 'Default Status',
      type: 'select',
      options: [
        { label: 'Default', value: 'true' },
        { label: 'Non-default', value: 'false' },
      ],
      placeholder: 'Filter by default status...',
    },
    {
      key: 'isPublic',
      title: 'Visibility',
      type: 'select',
      options: [
        { label: 'Public', value: 'true' },
        { label: 'Private', value: 'false' },
      ],
      placeholder: 'Filter by visibility...',
    },
  ];

  const columns: ColumnConfig<SavedSearch>[] = [
    {
      key: 'name',
      title: 'Search Name',
      sortable: true,
      className: 'font-medium',
      render: (_, search) => (
        <div className="flex items-center gap-2">
          <BookmarkIcon className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{search.name}</div>
            {search.description && (
              <div className="text-sm text-muted-foreground truncate max-w-xs">
                {search.description}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'entityType',
      title: 'Entity Type',
      sortable: true,
      render: (value) => (
        <Badge variant="outline">
          {String(value)}
        </Badge>
      ),
    },
    {
      key: 'user',
      title: 'Created By',
      sortable: false,
      render: (_, search) => (
        <div className="text-sm">
          {search.user ? (
            <div>
              <div>{search.user.firstName && search.user.lastName 
                ? `${search.user.firstName} ${search.user.lastName}`
                : search.user.email
              }</div>
              <div className="text-muted-foreground">{search.user.email}</div>
            </div>
          ) : (
            <span className="text-muted-foreground">Unknown</span>
          )}
        </div>
      ),
    },
    {
      key: 'isDefault',
      title: 'Status',
      sortable: true,
      render: (_, search) => (
        <div className="flex items-center gap-2">
          {search.isDefault && (
            <Badge variant="default" className="gap-1">
              <StarIcon className="h-3 w-3" />
              Default
            </Badge>
          )}
          {search.isPublic && (
            <Badge variant="secondary" className="gap-1">
              <ShareIcon className="h-3 w-3" />
              Public
            </Badge>
          )}
          {!search.isDefault && !search.isPublic && (
            <Badge variant="outline">Private</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'updatedAt',
      title: 'Last Updated',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ClockIcon className="h-4 w-4" />
          {new Date(String(value)).toLocaleString()}
        </div>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      sortable: false,
      hideable: false,
      className: 'w-[70px]',
      render: (_, search) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/admin/saved-searches/${search.id}`)}>
              <EditIcon className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleDelete(search)}
              className="text-destructive"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const bulkActions = [
    {
      key: 'delete',
      label: 'Delete Selected',
      variant: 'destructive' as const,
      onClick: handleBulkDelete,
    },
  ];

  const statsCards: StatCard[] = savedSearchesData?.stats ? [
    {
      title: 'Total Searches',
      value: savedSearchesData.stats.total || 0,
      description: 'All saved searches',
    },
    {
      title: 'Default Searches',
      value: savedSearchesData.stats.defaults || 0,
      description: 'Set as default',
    },
    {
      title: 'Public Searches',
      value: savedSearchesData.stats.public || 0,
      description: 'Shared with team',
    },
    {
      title: 'Entity Types',
      value: savedSearchesData.stats.entityTypes || 0,
      description: 'Different types',
    },
  ] : [];

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!userContext.isAuthenticated) {
    return <div>Please sign in to access this page.</div>;
  }

  return (
    <PermissionGate action="read" resource="saved_searches" fallback={<div>Access denied</div>}>
      <div className="space-y-6">
        <AdminListPage<SavedSearch>
          title="📋 Saved Searches"
          description="Manage user saved searches across all entity types. View, edit, and delete saved search configurations."
          
          statsCards={statsCards}
          
          addConfig={{
            label: 'Create Search',
            href: '/admin/saved-searches/new',
            permission: {
              action: 'create',
              resource: 'saved_searches',
            },
          }}
          
          searchConfig={{
            placeholder: 'Search by name, description, or entity type...',
            value: searchQuery,
            onChange: setSearchQuery,
          }}
          
          filters={filterConfigs}
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          
          columns={columns}
          data={savedSearchesData?.searches || []}
          isLoading={isLoading}
          fetchError={error?.message || null}
          
          selectedRows={selectedRows}
          onRowSelect={handleRowSelect}
          onSelectAll={handleSelectAll}
          getRowId={(search) => search.id}
          
          bulkActions={bulkActions}
          
          pagination={pagination}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          
          sortConfig={sortConfig}
          onSort={handleSort}
          
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          
          onRowClick={handleRowClick}
          
          userContext={userContext}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Saved Search</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{itemToDelete?.name}&quot;? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGate>
  );
} 