'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { browserLogger } from '@/lib/browser-logger';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Folder, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { AdminListPage, type StatCard, type ColumnConfig, type BulkAction, type FilterConfig } from '@/components/admin/AdminListPage';
import { ConfirmationModal, useConfirmationModal } from '@/components/admin/shared/ConfirmationModal';
import { AdminEditModal } from '@/components/admin/shared/AdminEditModal';
import { 
  useAdminCategoriesList, 
  useDeleteCategory, 
  useCreateCategory,
  useCategoryStatistics 
} from '@/hooks/useCategories';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  type: 'product' | 'service';
  createdAt: string;
}

interface CategoriesResponse {
  categories: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

interface CategoriesClientPageProps {
  initialData: CategoriesResponse;
  initialFilters: {
    page: number;
    limit: number;
    search: string;
    status: 'active' | 'inactive' | 'all';
  };
  userContext: {
    userId: string;
    adminRole: string;
    tenantId: string | null;
    permissions: string[];
  };
}

interface ExtendedFilters {
  page: number;
  limit: number;
  search: string;
  status: string[];
  type: string[];
}

export function CategoriesClientPage({ 
  initialData, 
  initialFilters, 
  userContext 
}: CategoriesClientPageProps) {
  const t = useTranslations('admin-common');
  const router = useRouter();

  const [filters, setFilters] = React.useState<ExtendedFilters>({
    page: initialFilters.page,
    limit: initialFilters.limit,
    search: initialFilters.search,
    status: initialFilters.status === 'all' ? [] : [initialFilters.status],
    type: [],
  });
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set());
  const deleteModal = useConfirmationModal();
  const [isCreateModalOpen, setCreateModalOpen] = React.useState(false);
  const [actionState, setActionState] = React.useState<{
    type: 'delete' | 'bulk-delete' | null;
    categoryId?: string;
    categoryName?: string;
    selectedIds?: Set<string>;
  }>({ type: null });

  const { data, isLoading, error, refetch, isRefetching } = useAdminCategoriesList(filters, initialData);
  const { data: stats } = useCategoryStatistics();
  const deleteCategoryMutation = useDeleteCategory();
  const createCategoryMutation = useCreateCategory();

  const tableData: CategoryData[] = React.useMemo(() => {
    if (!data?.categories) return [];
    return data.categories.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      isActive: category.isActive,
      type: category.type,
      createdAt: category.createdAt,
    }));
  }, [data]);

  const pagination = React.useMemo(() => ({
    page: filters.page,
    limit: filters.limit,
    total: data?.pagination?.total || 0,
    totalPages: data?.pagination?.totalPages || 1
  }), [filters.page, filters.limit, data?.pagination]);

  const statsCards: StatCard[] = React.useMemo(() => {
    if (!stats) return [];
    return [
      {
        title: 'Total Categories',
        value: stats.total,
        icon: Folder,
      },
      {
        title: 'Active Categories',
        value: stats.active,
        color: 'green' as const,
      },
      {
        title: 'Inactive Categories',
        value: stats.inactive,
        color: 'orange' as const,
      },
    ];
  }, [stats]);

  const columns: ColumnConfig<CategoryData>[] = [
    {
      key: 'name',
      title: 'Name',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'slug',
      title: 'Slug',
      render: (value) => (
        <code className="text-xs bg-muted px-2 py-1 rounded">
          {value}
        </code>
      )
    },
    {
      key: 'isActive',
      title: 'Status',
      render: (value) => (
        <Badge 
          variant={value ? 'default' : 'secondary'}
          className="capitalize"
        >
          {value ? 'active' : 'inactive'}
        </Badge>
      )
    },
    {
      key: 'type',
      title: 'Type',
      render: (value) => (
        <Badge 
          variant={value === 'product' ? 'default' : 'secondary'}
          className="capitalize"
        >
          {value}
        </Badge>
      )
    },
    {
      key: 'createdAt',
      title: 'Created',
      render: (value) => <span>{new Date(value).toLocaleDateString()}</span>
    }
  ];

  const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];

  const typeOptions = [
    { label: 'Product', value: 'product' },
    { label: 'Service', value: 'service' },
  ];

  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      title: 'Status',
      type: 'multiSelect',
      options: statusOptions
    },
    {
      key: 'type',
      title: 'Type',
      type: 'multiSelect',
      options: typeOptions
    },
  ];

  const handleFilterChange = (key: string, values: string[]) => {
    setFilters(prev => ({
      ...prev,
      [key]: values,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handleClearFilters = () => {
    setFilters(prev => ({
      ...prev,
      status: [],
      type: [],
      page: 1
    }));
  };

  const handleSearchChange = (value: string) => {
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
      setSelectedRows(new Set(tableData.map(row => row.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleDelete = (categoryId: string) => {
    const category = tableData.find(c => c.id === categoryId);
    setActionState({
      type: 'delete',
      categoryId,
      categoryName: category?.name || 'Unknown'
    });
    deleteModal.openModal();
  };

  const handleBulkDelete = (selectedIds: Set<string>) => {
    setActionState({
      type: 'bulk-delete',
      selectedIds
    });
    deleteModal.openModal();
  };

  const confirmDelete = async () => {
    if (actionState.type === 'delete' && actionState.categoryId) {
      await deleteCategoryMutation.mutateAsync(actionState.categoryId);
    } else if (actionState.type === 'bulk-delete' && actionState.selectedIds) {
      await Promise.all(Array.from(actionState.selectedIds).map(id => deleteCategoryMutation.mutateAsync(id)));
    }
    refetch();
  };

  const handleCreateCategory = async (data: Partial<CategoryData>) => {
    await createCategoryMutation.mutateAsync(data);
    refetch();
  };

  const bulkActions: BulkAction[] = [
    {
      key: 'delete',
      label: 'Delete',
      variant: 'destructive',
      permission: { action: 'delete', resource: 'categories' },
      onClick: handleBulkDelete
    }
  ];

  const renderRowActions = (category: CategoryData) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <PermissionGate permissions={['update:categories']}>
          <DropdownMenuItem onClick={() => router.push(`/admin/categories/${category.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
        </PermissionGate>
        <PermissionGate permissions={['delete:categories']}>
          <DropdownMenuItem 
            onClick={() => handleDelete(category.id)}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </PermissionGate>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <AdminListPage<CategoryData>
        statsCards={statsCards}
        addConfig={{
          label: "Add Category",
          onClick: () => setCreateModalOpen(true),
          permission: {
            action: "create",
            resource: "categories"
          }
        }}
        searchConfig={{
          placeholder: "Search by name...",
          value: filters.search,
          onChange: handleSearchChange
        }}
        filters={filterConfigs}
        activeFilters={{ status: filters.status, type: filters.type }}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        columns={columns}
        data={tableData}
        loading={isLoading || isRefetching}
        error={error?.message || null}
        selectedRows={selectedRows}
        onRowSelect={handleRowSelect}
        onSelectAll={handleSelectAll}
        getRowId={(row) => row.id}
        bulkActions={bulkActions}
        pagination={pagination}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        renderRowActions={renderRowActions}
        userContext={userContext}
      />

      <ConfirmationModal
        open={deleteModal.open}
        onOpenChange={deleteModal.setOpen}
        title={actionState.type === 'bulk-delete' ? 'Delete Categories' : 'Delete Category'}
        description={actionState.type === 'bulk-delete' ? `Are you sure you want to delete ${actionState.selectedIds?.size} categories?` : `Are you sure you want to delete "${actionState.categoryName}"? This action cannot be undone.`}
        confirmText={actionState.type === 'bulk-delete' ? 'Delete Categories' : 'Delete Category'}
        variant="destructive"
        icon="delete"
        onConfirm={confirmDelete}
      />

      <AdminEditModal
        title="Create Category"
        initialData={{ name: '', description: '' }}
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSave={handleCreateCategory}
      >
        {({ formData, setFormData }: { formData: any, setFormData: any }) => (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                name="name" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                name="description" 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
        )}
      </AdminEditModal>
    </>
  );
}
