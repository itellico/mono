'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { browserLogger } from '@/lib/browser-logger';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Folder, FolderOpen, Plus, Edit, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { AdminListPage, type StatCard, type FilterConfig, type ColumnConfig, type BulkAction } from '@/components/admin/AdminListPage';
import { ConfirmationModal } from '@/components/admin/shared/ConfirmationModal';
import { toast } from 'sonner';
import { useAdminCategoriesList, useAdminCreateCategory, useAdminUpdateCategory, useAdminDeleteCategory, useCategoryStatistics } from '@/hooks/useCategories';
import { useAdminTagsList } from '@/hooks/admin/useTags';
import { CategoryEditModal } from './CategoryEditModal';

interface CategoryData {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subcategories?: CategoryData[];
}

interface CategoriesResponse {
  categories: CategoryData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

interface AdminCategoriesClientPageProps {
  initialData: CategoriesResponse;
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

export function AdminCategoriesClientPage({
  initialData,
  initialFilters,
  userContext
}: AdminCategoriesClientPageProps) {
  const t = useTranslations('admin-common');
  const tCommon = useTranslations('common');
  const tAdmin = useTranslations('admin-common');
  const router = useRouter();
  const queryClient = useQueryClient();

  const [filters, setFilters] = React.useState({
    page: initialFilters.page,
    limit: initialFilters.limit,
    search: initialFilters.search,
    parentId: undefined as number | undefined, // Filter by parentId for hierarchical view
    status: [] as string[], // Filter by status
    parentCategory: [] as string[] // Filter by parent category
  });

  const [activeFilters, setActiveFilters] = React.useState<Record<string, string[]>>({
    status: [],
    parentCategory: []
  });

  const [expandedCategories, setExpandedCategories] = React.useState<Set<number>>(new Set());
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<CategoryData | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [columnVisibility, setColumnVisibility] = React.useState<Record<string, boolean>>({});
  const [sortConfig, setSortConfig] = React.useState<{ column: string; direction: 'asc' | 'desc' | null }>({ column: 'createdAt', direction: 'desc' });
  const [activeSearchName, setActiveSearchName] = React.useState<string>('');
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set());
  const [hasUserInteracted, setHasUserInteracted] = React.useState(false);
  const [defaultLoaded, setDefaultLoaded] = React.useState(false);

  const { data, error, isLoading, refetch, isFetching } = useAdminCategoriesList(filters);
  const createCategoryMutation = useAdminCreateCategory();
  const updateCategoryMutation = useAdminUpdateCategory();
  const deleteCategoryMutation = useAdminDeleteCategory();
  
  // Fetch tags for category tagging
  const { data: tagsData, isLoading: isLoadingTags } = useAdminTagsList({
    page: 1,
    limit: 9999, // Fetch all tags
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
      browserLogger.info('🔄 Cache invalidation detected, refetching categories data');
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
    if (data && data.categories) {
      browserLogger.info('Categories data loaded via TanStack Query', {
        count: data.categories.length,
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
      browserLogger.error('Failed to load categories data via TanStack Query', {
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
    setActiveFilters({ status: [], parentCategory: [] });
    setFilters(prev => ({
      ...prev,
      status: [],
      parentCategory: [],
      page: 1
    }));
  };

  const handleAddCategory = (parentId?: number | null) => {
    setSelectedCategory(null); // Clear any previously selected category
    // Pre-populate the category with parentId but don't filter the list
    if (parentId) {
      setSelectedCategory({ parentId } as CategoryData);
    }
    setEditModalOpen(true);
    browserLogger.userAction('admin_category_add_initiated', { parentId });
  };

  const handleEditCategory = (category: CategoryData) => {
    setSelectedCategory(category);
    setEditModalOpen(true);
    browserLogger.userAction('admin_category_edit_initiated', { categoryId: category.id });
  };

  const handleDeleteCategory = async (category: CategoryData) => {
    try {
      await deleteCategoryMutation.mutateAsync(category.uuid);
      toast.success(tCommon('messages.deleteSuccess', { entity: t('category') }));
      browserLogger.userAction('admin_category_delete_success', { categoryId: category.id });
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
    } catch (err: any) {
      toast.error(tCommon('messages.deleteError', { entity: t('category'), message: err.message }));
      browserLogger.error('admin_category_delete_failed', { categoryId: category.id, error: err.message });
    }
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
      entityType: 'categories', 
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
      entityType: 'categories', 
      searchName: searchData.name,
      isDefault: searchData.isDefault,
      isPublic: searchData.isPublic
    });
  };

  const handleSaveCategory = async (categoryData: Partial<CategoryData>) => {
    try {
      if (selectedCategory) {
        await updateCategoryMutation.mutateAsync({ uuid: selectedCategory.uuid, ...categoryData });
        toast.success(tCommon('messages.updateSuccess', { entity: t('category') }));
        browserLogger.userAction('admin_category_update_success', { categoryId: selectedCategory.id });
      } else {
        await createCategoryMutation.mutateAsync({ ...categoryData, parentId: filters.parentId });
        toast.success(tCommon('messages.createSuccess', { entity: t('category') }));
        browserLogger.userAction('admin_category_create_success', { categoryName: categoryData.name });
      }
      setEditModalOpen(false);
      setSelectedCategory(null);
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
    } catch (err: any) {
      toast.error(tCommon('messages.saveError', { entity: t('category'), message: err.message }));
      browserLogger.error('admin_category_save_failed', { categoryData, error: err.message });
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
      setSelectedRows(new Set(data?.categories.map(cat => cat.id.toString()) || []));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleBulkDelete = async (selectedIds: Set<string>) => {
    browserLogger.userAction('admin_categories_bulk_delete_initiated', `Bulk delete initiated for ${selectedIds.size} categories`);
    for (const id of Array.from(selectedIds)) {
      const category = data?.categories.find(c => c.id.toString() === id);
      if (category) {
        await deleteCategoryMutation.mutateAsync(category.uuid);
      }
    }
    setSelectedRows(new Set());
    toast.info(tCommon('messages.bulkDeleteCompleted', { count: selectedIds.size, entity: t('categories') }));
  };

  const handleBulkStatusChange = async (status: 'active' | 'inactive', selectedIds: Set<string>) => {
    const isActive = status === 'active';
    browserLogger.userAction('admin_categories_bulk_status_change_initiated', `Bulk status change to ${status} initiated for ${selectedIds.size} categories`);
    for (const id of Array.from(selectedIds)) {
      const category = data?.categories.find(c => c.id.toString() === id);
      if (category) {
        await updateCategoryMutation.mutateAsync({ uuid: category.uuid, isActive });
      }
    }
    setSelectedRows(new Set());
    toast.info(tCommon('messages.bulkUpdateCompleted', { count: selectedIds.size, entity: t('categories') }));
  };

  const toggleExpand = (categoryId: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const renderCategoryRow = (category: CategoryData, level: number = 0) => {
    const isExpanded = expandedCategories.has(category.id);
    const hasSubcategories = category.subcategories && category.subcategories.length > 0;

    return (
      <React.Fragment key={category.id}>
        <tr className="group">
          <td style={{ paddingLeft: `${16 + level * 20}px` }} className="py-2">
            <div className="flex items-center gap-2">
              {hasSubcategories ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpand(category.id)}
                  className="h-6 w-6 p-0"
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              ) : (
                <div className="h-6 w-6"></div> // Spacer for alignment
              )}
              {category.isActive ? (
                <FolderOpen className="h-4 w-4 text-blue-500" />
              ) : (
                <Folder className="h-4 w-4 text-gray-500" />
              )}
              <span className="font-medium">{category.name}</span>
            </div>
          </td>
          <td>
            <code className="text-xs bg-muted px-2 py-1 rounded">
              {category.slug}
            </code>
          </td>
          <td>
            <Badge variant={category.isActive ? 'default' : 'secondary'}>
              {category.isActive ? tCommon('status.active') : tCommon('status.inactive')}
            </Badge>
          </td>
          <td>{category.description || '-'}</td>
          <td><span>{new Date(category.createdAt).toLocaleDateString()}</span></td>
          <td className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <PermissionGate permissions={['update:categories']}>
                  <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                    <Edit className="mr-2 h-4 w-4" />
                    {tCommon('actions.edit')}
                  </DropdownMenuItem>
                </PermissionGate>
                <PermissionGate permissions={['create:categories']}>
                  <DropdownMenuItem onClick={() => handleAddCategory(category.id)}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('actions.addChildCategory')}
                  </DropdownMenuItem>
                </PermissionGate>
                <PermissionGate permissions={['delete:categories']}>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedCategory(category);
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
          </td>
        </tr>
        {isExpanded && hasSubcategories && category.subcategories?.map(sub => renderCategoryRow(sub, level + 1))}
      </React.Fragment>
    );
  };

  const renderRowActions = (category: CategoryData) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <PermissionGate permissions={['categories.update']}>
          <DropdownMenuItem onClick={() => handleEditCategory(category)}>
            <Edit className="mr-2 h-4 w-4" />
            {tCommon('actions.edit')}
          </DropdownMenuItem>
        </PermissionGate>
        <PermissionGate permissions={['categories.create']}>
          <DropdownMenuItem onClick={() => handleAddCategory(category.id)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('actions.addChildCategory')}
          </DropdownMenuItem>
        </PermissionGate>
        <PermissionGate permissions={['categories.delete']}>
          <DropdownMenuItem 
            onClick={() => {
              setSelectedCategory(category);
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
  );

  const columns: ColumnConfig<CategoryData>[] = [
    {
      key: 'name',
      title: t('table.name'),
      sortable: true,
      hideable: false,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          {row.isActive ? (
            <FolderOpen className="h-4 w-4 text-blue-500" />
          ) : (
            <Folder className="h-4 w-4 text-gray-500" />
          )}
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
      key: 'description',
      title: t('table.description'),
      sortable: false,
      hideable: true,
      render: (value) => value || '-'
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
    const active = data.categories.filter(cat => cat.isActive).length;
    return [
      {
        title: t('stats.totalCategories'),
        value: total,
        icon: Folder
      },
      {
        title: t('stats.activeCategories'),
        value: active,
        color: 'green' as const,
        indicator: <div className="h-2 w-2 rounded-full bg-green-500" />
      },
      {
        title: t('stats.inactiveCategories'),
        value: total - active,
        color: 'orange' as const,
        indicator: <div className="h-2 w-2 rounded-full bg-gray-400" />
      }
    ];
  }, [data, t]);

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
      permission: { action: 'update', resource: 'categories' },
      onClick: (selectedIds) => handleBulkStatusChange('active', selectedIds)
    },
    {
      key: 'deactivate',
      label: 'Deactivate',
      variant: 'outline',
      permission: { action: 'update', resource: 'categories' },
      onClick: (selectedIds) => handleBulkStatusChange('inactive', selectedIds)
    },
    {
      key: 'delete',
      label: 'Delete Selected',
      variant: 'destructive',
      permission: { action: 'delete', resource: 'categories' },
      onClick: handleBulkDelete
    }
  ];
  
  // Build parent category options from available categories
  const parentCategoryOptions = React.useMemo(() => {
    if (!data?.categories) return [];
    
    // Get only parent categories (those without parentId or with parentId null)
    const parentCategories = data.categories.filter(cat => !cat.parentId);
    
    return [
      { label: t('filters.parentCategory.all'), value: 'all' },
      { label: t('filters.parentCategory.rootOnly'), value: 'root' },
      ...parentCategories.map(cat => ({
        label: cat.name,
        value: cat.id.toString()
      }))
    ];
  }, [data, t]);

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
      key: 'parentCategory',
      title: t('filters.parentCategory.title'),
      type: 'multiSelect', 
      options: parentCategoryOptions
    }
  ];
  
  const savedSearchConfig = {
    entityType: 'categories',
    enabled: true,
    activeSearchName: activeSearchName,
    onLoadSearch: handleLoadSavedSearch,
    onSaveSearch: handleSaveSavedSearch,
    canSave: userContext.permissions?.includes('saved_searches.create.own') || 
             userContext.permissions?.includes('saved_searches.manage.global') ||
             userContext.permissions?.includes('saved_searches.create.global') ||
             userContext.permissions?.includes('saved_searches.*.global') ||
             userContext.permissions?.includes('saved_searches.*.tenant') ||
             userContext.permissions?.includes('*') || false,
    canLoad: userContext.permissions?.includes('saved_searches.read.own') || 
             userContext.permissions?.includes('saved_searches.read.global') ||
             userContext.permissions?.includes('saved_searches.read.tenant') ||
             userContext.permissions?.includes('saved_searches.*.global') ||
             userContext.permissions?.includes('saved_searches.*.tenant') ||
             userContext.permissions?.includes('*') || false
  };

  return (
    <>
      <AdminListPage<CategoryData>
        title={tAdmin('navigation.categories')}
        description={tAdmin('categories.description')}
        statsCards={statsCards}
        addConfig={{
          label: t('actions.addCategory'),
          onClick: () => handleAddCategory(undefined),
          permission: { action: 'create', resource: 'categories' }
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
        data={data?.categories || []}
        isLoading={isLoading}
        fetchError={error?.message || null}
        pagination={data?.pagination || { page: filters.page, limit: filters.limit, total: 0, totalPages: 1 }}
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
        renderRowActions={renderRowActions}
        userContext={userContext}
      />

      <CategoryEditModal
        isOpen={editModalOpen}
        onOpenChange={setEditModalOpen}
        category={selectedCategory}
        onSave={handleSaveCategory}
        allCategories={data?.categories || []} // Pass all categories for parent selection
        allTags={tagsData?.tags || []} // Pass all tags for tag selection
        isLoadingTags={isLoadingTags}
      />

      <ConfirmationModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title={t('deleteModal.title')}
        description={t('deleteModal.description', { categoryName: selectedCategory?.name })}
        confirmText={tCommon('actions.delete')}
        variant="destructive"
        icon="delete"
        onConfirm={async () => {
          if (selectedCategory) {
            await handleDeleteCategory(selectedCategory);
            setSelectedCategory(null);
            setDeleteModalOpen(false);
          }
        }}
        onCancel={() => {
          setSelectedCategory(null);
          setDeleteModalOpen(false);
        }}
      />
    </>
  );
}
