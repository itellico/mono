'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { browserLogger } from '@/lib/browser-logger';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Tag, Edit, Trash2 } from 'lucide-react';
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
import { useAdminTagsList, useDeleteTag, useCreateTag } from '@/hooks/admin/useTags';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface TagData {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

interface TagsResponse {
  tags: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

interface TagsClientPageProps {
  initialData: TagsResponse;
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
}

async function fetchTagStats() {
  const response = await fetch('/api/v1/admin/tags/stats');
  if (!response.ok) {
    throw new Error('Failed to fetch tag stats');
  }
  const result = await response.json();
  return result.data;
}

export function TagsClientPage({ 
  initialData, 
  initialFilters, 
  userContext 
}: TagsClientPageProps) {
  const t = useTranslations('admin-common');
  const router = useRouter();

    const [filters, setFilters] = React.useState<ExtendedFilters>({
    page: initialFilters.page,
    limit: initialFilters.limit,
    search: initialFilters.search,
    status: initialFilters.status === 'all' ? [] : [initialFilters.status],
  });
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set());
  const deleteModal = useConfirmationModal();
  const [isCreateModalOpen, setCreateModalOpen] = React.useState(false);
  const [actionState, setActionState] = React.useState<{
    type: 'delete' | 'bulk-delete' | null;
    tagId?: string;
    tagName?: string;
    selectedIds?: Set<string>;
  }>({ type: null });

  const { data, isLoading, error, refetch, isRefetching } = useAdminTagsList(filters, initialData);
  const { data: stats } = useQuery({ queryKey: ['tagStats'], queryFn: fetchTagStats });
  const deleteTagMutation = useDeleteTag();
  const createTagMutation = useCreateTag();

  const tableData: TagData[] = React.useMemo(() => {
    if (!data?.tags) return [];
    return data.tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      description: tag.description,
      isActive: tag.isActive,
      createdAt: tag.createdAt,
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
        title: 'Total Tags',
        value: stats.total,
        icon: Tag,
      },
      {
        title: 'Active Tags',
        value: stats.active,
        color: 'green' as const,
      },
      {
        title: 'Inactive Tags',
        value: stats.inactive,
        color: 'orange' as const,
      },
    ];
  }, [stats]);

  const columns: ColumnConfig<TagData>[] = [
    {
      key: 'name',
      title: 'Name',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
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
      key: 'createdAt',
      title: 'Created',
      render: (value) => <span>{new Date(value).toLocaleDateString()}</span>
    }
  ];

    const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];

  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      title: 'Status',
      type: 'multiSelect',
      options: statusOptions
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

  const handleDelete = (tagId: string) => {
    const tag = tableData.find(t => t.id === tagId);
    setActionState({
      type: 'delete',
      tagId,
      tagName: tag?.name || 'Unknown'
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
    if (actionState.type === 'delete' && actionState.tagId) {
      await deleteTagMutation.mutateAsync(actionState.tagId);
    } else if (actionState.type === 'bulk-delete' && actionState.selectedIds) {
      await Promise.all(Array.from(actionState.selectedIds).map(id => deleteTagMutation.mutateAsync(id)));
    }
    refetch();
  };

  const bulkActions: BulkAction[] = [
    {
      key: 'delete',
      label: 'Delete',
      variant: 'destructive',
      permission: { action: 'delete', resource: 'tags' },
      onClick: handleBulkDelete
    }
  ];

  const renderRowActions = (tag: TagData) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <PermissionGate permissions={['update:tags']}>
          <DropdownMenuItem onClick={() => router.push(`/admin/tags/${tag.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
        </PermissionGate>
        <PermissionGate permissions={['delete:tags']}>
          <DropdownMenuItem 
            onClick={() => handleDelete(tag.id)}
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
      <AdminListPage<TagData>
        statsCards={statsCards}
        addConfig={{
          label: "Add Tag",
          onClick: () => setCreateModalOpen(true),
          permission: {
            action: "create",
            resource: "tags"
          }
        }}
        searchConfig={{
          placeholder: "Search by name...",
          value: filters.search,
          onChange: handleSearchChange
        }}
        filters={filterConfigs}
        activeFilters={{ status: filters.status }}
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
        title={actionState.type === 'bulk-delete' ? 'Delete Tags' : 'Delete Tag'}
        description={actionState.type === 'bulk-delete' ? `Are you sure you want to delete ${actionState.selectedIds?.size} tags?` : `Are you sure you want to delete "${actionState.tagName}"? This action cannot be undone.`}
        confirmText={actionState.type === 'bulk-delete' ? 'Delete Tags' : 'Delete Tag'}
        variant="destructive"
        icon="delete"
        onConfirm={confirmDelete}
      />

      <AdminEditModal
        title="Create Tag"
        initialData={{ name: '', description: '' }}
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSave={handleCreateTag}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" />
          </div>
        </div>
      </AdminEditModal>
    </>
  );
}

const handleCreateTag = async (data: Partial<TagData>) => {
  await createTagMutation.mutateAsync(data);
  refetch();
};