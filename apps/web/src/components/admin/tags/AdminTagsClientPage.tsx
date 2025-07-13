'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { browserLogger } from '@/lib/browser-logger';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Tag, Plus, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { AdminListPage, type StatCard, type FilterConfig, type ColumnConfig } from '@/components/admin/AdminListPage';
import { ConfirmationModal } from '@/components/admin/shared/ConfirmationModal';
import { toast } from 'sonner';
import { useAdminTagsList, useCreateTag, useUpdateTag, useDeleteTag } from '@/hooks/admin/useTags';
import { TagEditModal } from './TagEditModal';
import { useAdminCategoriesList } from '@/hooks/admin/useCategories';

// Import the BulkAction interface from AdminListPage
import type { BulkAction } from '@/components/admin/AdminListPage';

interface TagData {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  categories: { category: { id: number; name: string; slug: string } }[];
}

interface TagsResponse {
  tags: TagData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

interface AdminTagsClientPageProps {
  initialData: TagsResponse;
  initialFilters: {
    page: number;
    limit: number;
    search: string;
  };
  userContext: {
    userId: string;
    adminRole: string;
    tenantId: string | null;
    permissions: string[];
  };
}

export function AdminTagsClientPage({
  initialData,
  initialFilters,
  userContext
}: AdminTagsClientPageProps) {
  const t = useTranslations('admin-tags');
  const tCommon = useTranslations('common');
  const tAdmin = useTranslations('admin-common');
  const router = useRouter();
  const queryClient = useQueryClient();

  const [filters, setFilters] = React.useState({
    page: initialFilters.page,
    limit: initialFilters.limit,
    search: initialFilters.search,
    categoryId: undefined as number | undefined, // Filter by category
    status: [] as string[], // Filter by status
    category: [] as string[] // Filter by category
  });

  const [activeFilters, setActiveFilters] = React.useState<Record<string, string[]>>({
    status: [],
    category: []
  });

  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [selectedTag, setSelectedTag] = React.useState<TagData | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [columnVisibility, setColumnVisibility] = React.useState<Record<string, boolean>>({});
  const [sortConfig, setSortConfig] = React.useState<{ column: string; direction: 'asc' | 'desc' | null }>({ column: 'createdAt', direction: 'desc' });
  const [activeSearchName, setActiveSearchName] = React.useState<string>('');
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set());
  const [hasUserInteracted, setHasUserInteracted] = React.useState(false);
  const [defaultLoaded, setDefaultLoaded] = React.useState(false);

  const { data, error, isLoading, refetch, isFetching } = useAdminTagsList(filters);
  const createTagMutation = useCreateTag();
  const updateTagMutation = useUpdateTag();
  const deleteTagMutation = useDeleteTag();

  // Fetch all categories for the tag edit modal
  const { data: categoriesData, isLoading: isLoadingCategories } = useAdminCategoriesList({
    page: 1,
    limit: 9999, // Fetch all categories
    search: '',
  });

  // Log TanStack Query state
  React.useEffect(() => {
    browserLogger.info('TanStack Query state changed', {
      isLoading,
      isFetching,
      hasData: !!data,
      hasError: !!error,
      filters
    });
  }, [isLoading, isFetching, data, error, filters]);

  // Listen for custom cache clear events
  React.useEffect(() => {
    const handleCacheInvalidation = () => {
      browserLogger.info('🔄 Cache invalidation detected, refetching tags data');
      refetch();
    };

    window.addEventListener('clearTanStackCache', handleCacheInvalidation);
    return () => {
      window.removeEventListener('clearTanStackCache', handleCacheInvalidation);
    };
  }, [refetch]);

  // Refetch data when user navigates back to this page
  React.useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        browserLogger.info('🔄 Page restored from cache, refetching data');
        refetch();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [refetch]);

  // Log data changes
  React.useEffect(() => {
    if (data && data.tags) {
      browserLogger.info('Tags data loaded via TanStack Query', {
        count: data.tags.length,
        total: data.pagination?.total || 0,
        filters,
        userRole: userContext.adminRole,
        fromCache: !isLoading && !isFetching
      });
    }
  }, [data, filters, userContext.adminRole, isLoading, isFetching]);

  // Log errors
  React.useEffect(() => {
    if (error) {
      browserLogger.error('Failed to load tags data via TanStack Query', {
        error: error.message,
        filters,
        userRole: userContext.adminRole
      });
    }
  }, [error, filters, userContext.adminRole]);

  const handleSearchChange = (value: string) => {
    setHasUserInteracted(true);
    setFilters(prev => ({
      ...prev,
      search: value,
      page: 1
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }));
  };

  const handleFilterChange = (key: string, values: string[]) => {
    setHasUserInteracted(true);
    setActiveFilters(prev => ({ ...prev, [key]: values }));
    setFilters(prev => ({
      ...prev,
      [key]: values,
      page: 1
    }));
  };

  const handleClearFilters = () => {
    setActiveFilters({ status: [], category: [] });
    setFilters(prev => ({
      ...prev,
      status: [],
      category: [],
      page: 1
    }));
  };

  const handleAddTag = () => {
    setSelectedTag(null); // Clear any previously selected tag
    setEditModalOpen(true);
    browserLogger.userAction('admin_tag_add_initiated');
  };

  const handleEditTag = (tag: TagData) => {
    setSelectedTag(tag);
    setEditModalOpen(true);
    browserLogger.userAction('admin_tag_edit_initiated', { tagId: tag.id });
  };

  const handleDeleteTag = async (tagId: number) => {
    try {
      await deleteTagMutation.mutateAsync(tagId.toString());
      toast.success(tCommon('messages.deleteSuccess', { entity: t('tag') }));
      browserLogger.userAction('admin_tag_delete_success', { tagId });
      queryClient.invalidateQueries({ queryKey: ['adminTags'] });
    } catch (err: any) {
      toast.error(tCommon('messages.deleteError', { entity: t('tag'), message: err.message }));
      browserLogger.error('admin_tag_delete_failed', { tagId, error: err.message });
    }
  };

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
      setSelectedRows(new Set(data?.tags.map(tag => tag.id.toString()) || []));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleBulkDelete = async (selectedIds: Set<string>) => {
    browserLogger.userAction('admin_tags_bulk_delete_initiated', `Bulk delete initiated for ${selectedIds.size} tags`);
    for (const id of Array.from(selectedIds)) {
      await deleteTagMutation.mutateAsync(id);
    }
    setSelectedRows(new Set());
    toast.info(tCommon('messages.bulkDeleteCompleted', { count: selectedIds.size, entity: t('tags') }));
  };

  const handleBulkStatusChange = async (status: 'active' | 'inactive', selectedIds: Set<string>) => {
    const isActive = status === 'active';
    browserLogger.userAction('admin_tags_bulk_status_change_initiated', `Bulk status change to ${status} initiated for ${selectedIds.size} tags`);
    for (const id of Array.from(selectedIds)) {
      const tag = data?.tags.find(t => t.id.toString() === id);
      if (tag) {
        await updateTagMutation.mutateAsync({ id: tag.id.toString(), isActive });
      }
    }
    setSelectedRows(new Set());
    toast.info(tCommon('messages.bulkUpdateCompleted', { count: selectedIds.size, entity: t('tags') }));
  };

  const handleLoadSavedSearch = (config: {
    filters: Record<string, string[]>;
    sortConfig: { column: string; direction: 'asc' | 'desc' | null } | null;
    columnVisibility: Record<string, boolean>;
    searchValue?: string;
    paginationLimit?: number;
    searchName: string;
  }) => {
    // Apply filters
    if (config.searchValue !== undefined) {
      setFilters(prev => ({ ...prev, search: config.searchValue || '' }));
    }
    if (config.paginationLimit) {
      setFilters(prev => ({ ...prev, limit: config.paginationLimit }));
    }
    
    // Apply sort
    if (config.sortConfig) {
      setSortConfig(config.sortConfig);
    }
    
    // Apply column visibility
    setColumnVisibility(config.columnVisibility);
    
    // Set active search name
    setActiveSearchName(config.searchName);
    
    browserLogger.userAction('admin_saved_search_loaded', { 
      entityType: 'tags', 
      searchName: config.searchName 
    });
  };

  const handleSaveSavedSearch = (searchData: {
    name: string;
    description?: string;
    isDefault: boolean;
    isPublic: boolean;
    filters: Record<string, string[]>;
    sortConfig: { column: string; direction: 'asc' | 'desc' | null } | null;
    columnVisibility: Record<string, boolean>;
    searchValue?: string;
    paginationLimit?: number;
  }) => {
    browserLogger.userAction('admin_saved_search_created', { 
      entityType: 'tags', 
      searchName: searchData.name,
      isDefault: searchData.isDefault,
      isPublic: searchData.isPublic
    });
  };

  const handleSaveTag = async (tagData: Partial<TagData>) => {
    try {
      if (selectedTag) {
        await updateTagMutation.mutateAsync({ id: selectedTag.id.toString(), ...tagData });
        toast.success(tCommon('messages.updateSuccess', { entity: t('tag') }));
        browserLogger.userAction('admin_tag_update_success', { tagId: selectedTag.id });
      } else {
        await createTagMutation.mutateAsync(tagData);
        toast.success(tCommon('messages.createSuccess', { entity: t('tag') }));
        browserLogger.userAction('admin_tag_create_success', { tagName: tagData.name });
      }
      setEditModalOpen(false);
      setSelectedTag(null);
      queryClient.invalidateQueries({ queryKey: ['adminTags'] });
    } catch (err: any) {
      toast.error(tCommon('messages.saveError', { entity: t('tag'), message: err.message }));
      browserLogger.error('admin_tag_save_failed', { tagData, error: err.message });
    }
  };

  const columns: ColumnConfig<TagData>[] = [
    {
      key: 'name',
      title: t('table.name'),
      sortable: true,
      hideable: false,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.name}</span>
        </div>
      )
    },
    {
      key: 'slug',
      title: t('table.slug'),
      sortable: true,
      hideable: true,
      render: (value) => (
        <code className="text-xs bg-muted px-2 py-1 rounded">
          {value}
        </code>
      )
    },
    {
      key: 'isActive',
      title: t('table.status'),
      sortable: true,
      hideable: false,
      render: (value) => (
        <Badge 
          variant={value ? 'default' : 'secondary'}
          className="capitalize"
        >
          {value ? tCommon('status.active') : tCommon('status.inactive')}
        </Badge>
      )
    },
    {
      key: 'categories',
      title: t('table.categories'),
      sortable: false,
      hideable: true,
      render: (value, row) => (
        <div className="flex flex-wrap gap-1">
          {row.categories.map((cat: any) => (
            <Badge key={cat.category.id} variant="outline">
              {cat.category.name}
            </Badge>
          ))}
        </div>
      )
    },
    {
      key: 'createdAt',
      title: t('table.createdAt'),
      sortable: true,
      hideable: true,
      render: (value) => <span>{new Date(value).toLocaleDateString()}</span>
    }
  ];

  const statsCards: StatCard[] = React.useMemo(() => {
    if (!data) return [];
    const total = data.pagination?.total || 0;
    const active = data.tags.filter(tag => tag.isActive).length;
    return [
      {
        title: t('stats.totalTags'),
        value: total,
        icon: Tag
      },
      {
        title: t('stats.activeTags'),
        value: active,
        color: 'green' as const,
        indicator: <div className="h-2 w-2 rounded-full bg-green-500" />
      },
      {
        title: t('stats.inactiveTags'),
        value: total - active,
        color: 'orange' as const,
        indicator: <div className="h-2 w-2 rounded-full bg-gray-400" />
      }
    ];
  }, [data, t]);

  // Build category options from available categories
  // Helper function to check permissions with wildcard support
  const hasPermissionWithWildcard = (permissions: string[], requiredPermission: string): boolean => {
    // Safety check for undefined permissions
    if (!permissions || !Array.isArray(permissions)) {
      return false;
    }
    
    // Direct match
    if (permissions.includes(requiredPermission)) {
      return true;
    }
    
    // Wildcard match
    const requiredParts = requiredPermission.split('.');
    for (const userPerm of permissions) {
      const userParts = userPerm.split('.');
      if (userParts.length === requiredParts.length) {
        const matches = userParts.every((part, index) => 
          part === '*' || part === requiredParts[index]
        );
        if (matches) {
          return true;
        }
      }
    }
    return false;
  };

  // Bulk actions configuration
  const bulkActions: BulkAction[] = [
    {
      key: 'activate',
      label: 'Activate',
      variant: 'outline',
      permission: { action: 'update', resource: 'tags' },
      onClick: (selectedIds) => handleBulkStatusChange('active', selectedIds)
    },
    {
      key: 'deactivate',
      label: 'Deactivate',
      variant: 'outline',
      permission: { action: 'update', resource: 'tags' },
      onClick: (selectedIds) => handleBulkStatusChange('inactive', selectedIds)
    },
    {
      key: 'delete',
      label: 'Delete Selected',
      variant: 'destructive',
      permission: { action: 'delete', resource: 'tags' },
      onClick: handleBulkDelete
    }
  ];

  const categoryOptions = React.useMemo(() => {
    const options = [
      { label: t('filters.category.uncategorized'), value: 'uncategorized' }
    ];
    
    if (categoriesData?.categories) {
      categoriesData.categories.forEach(category => {
        options.push({
          label: category.name,
          value: category.id.toString()
        });
      });
    }
    
    return options;
  }, [categoriesData, t]);
  
  const filtersConfig: FilterConfig[] = [
    {
      key: 'status',
      title: t('filters.status.title'),
      type: 'multiSelect',
      options: [
        { label: t('filters.status.active'), value: 'active' },
        { label: t('filters.status.inactive'), value: 'inactive' }
      ]
    },
    {
      key: 'category',
      title: t('filters.category.title'),
      type: 'multiSelect',
      options: categoryOptions
    }
  ];
  
  // Mock saved searches for development
  const mockSavedSearches = process.env.NODE_ENV === 'development' ? [
    {
      id: '1',
      name: 'Active Tags',
      isDefault: true,
      entityType: 'tags',
      filters: {
        status: ['active']
      },
      createdAt: new Date('2024-01-10')
    },
    {
      id: '2',
      name: 'Inactive Tags',
      isDefault: false,
      entityType: 'tags',
      filters: {
        status: ['inactive']
      },
      createdAt: new Date('2024-01-08')
    },
    {
      id: '3',
      name: 'Uncategorized Tags',
      isDefault: false,
      entityType: 'tags',
      filters: {
        category: ['uncategorized']
      },
      createdAt: new Date('2024-01-05')
    }
  ] : undefined;

  const savedSearchConfig = {
    entityType: 'tags',
    enabled: true,
    activeSearchName: activeSearchName,
    onLoadSearch: handleLoadSavedSearch,
    onSaveSearch: handleSaveSavedSearch,
    canSave: process.env.NODE_ENV === 'development' ? true : (
      hasPermissionWithWildcard(userContext.permissions || [], 'saved_searches.create.own') || 
      hasPermissionWithWildcard(userContext.permissions || [], 'saved_searches.manage.global') ||
      hasPermissionWithWildcard(userContext.permissions || [], 'saved_searches.create.global') ||
      userContext.permissions?.includes('saved_searches.*.global') ||
      userContext.permissions?.includes('saved_searches.*.tenant') ||
      userContext.permissions?.includes('*')
    ),
    canLoad: process.env.NODE_ENV === 'development' ? true : (
      hasPermissionWithWildcard(userContext.permissions || [], 'saved_searches.read.own') || 
      hasPermissionWithWildcard(userContext.permissions || [], 'saved_searches.read.global') ||
      hasPermissionWithWildcard(userContext.permissions || [], 'saved_searches.read.tenant') ||
      userContext.permissions?.includes('saved_searches.*.global') ||
      userContext.permissions?.includes('saved_searches.*.tenant') ||
      userContext.permissions?.includes('*')
    ),
    mockData: mockSavedSearches
  };

  return (
    <>
      <AdminListPage<TagData>
        title={tAdmin('navigation.tags')}
        description={tAdmin('tags.description')}
        statsCards={statsCards}
        addConfig={{
          label: t('actions.addTag'),
          onClick: handleAddTag,
          permission: { action: 'create', resource: 'tags' }
        }}
        searchConfig={{
          placeholder: t('search.placeholder'),
          value: filters.search,
          onChange: handleSearchChange
        }}
        filters={filtersConfig}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        columns={columns}
        data={React.useMemo(() => {
          let filteredData = data?.tags || [];
          
          // Apply client-side sorting if needed
          if (sortConfig.column && sortConfig.direction) {
            filteredData = [...filteredData].sort((a, b) => {
              const aValue = a[sortConfig.column as keyof TagData];
              const bValue = b[sortConfig.column as keyof TagData];
              
              if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
              if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
              return 0;
            });
          }
          
          return filteredData;
        }, [data?.tags, sortConfig])}
        isLoading={isLoading}
        fetchError={error?.message || null}
        pagination={data?.pagination}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        sortConfig={sortConfig}
        onSort={handleSort}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        savedSearchConfig={savedSearchConfig}
        selectedRows={selectedRows}
        onRowSelect={handleRowSelect}
        onSelectAll={handleSelectAll}
        getRowId={(row) => row.id.toString()}
        bulkActions={bulkActions}
        renderRowActions={(row) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <PermissionGate permissions={['update:tags']}>
                <DropdownMenuItem onClick={() => handleEditTag(row)}>
                  <Edit className="mr-2 h-4 w-4" />
                  {tCommon('actions.edit')}
                </DropdownMenuItem>
              </PermissionGate>
              <PermissionGate permissions={['delete:tags']}>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedTag(row);
                    setDeleteModalOpen(true);
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {tCommon('actions.delete')}
                </DropdownMenuItem>
              </PermissionGate>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        userContext={userContext}
      />

      <TagEditModal
        isOpen={editModalOpen}
        onOpenChange={setEditModalOpen}
        tag={selectedTag}
        onSave={handleSaveTag}
        allCategories={categoriesData?.categories || []}
        isLoadingCategories={isLoadingCategories}
      />

      <ConfirmationModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title={t('deleteModal.title')}
        description={t('deleteModal.description', { tagName: selectedTag?.name })}
        confirmText={tCommon('actions.delete')}
        variant="destructive"
        icon="delete"
        onConfirm={async () => {
          if (selectedTag) {
            await handleDeleteTag(selectedTag.id);
            setSelectedTag(null);
            setDeleteModalOpen(false);
          }
        }}
        onCancel={() => {
          setSelectedTag(null);
          setDeleteModalOpen(false);
        }}
      />
    </>
  );
}
