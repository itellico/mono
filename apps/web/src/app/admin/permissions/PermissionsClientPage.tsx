'use client';

import React, { useState } from 'react';
import { AdminListPage, type ColumnConfig } from '@/components/admin/AdminListPage';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { PermissionDialog } from './PermissionDialog';

interface Permission {
  id: number;
  name: string;
  description: string | null;
}

interface PermissionsClientPageProps {
  initialPermissions: Permission[];
}

export function PermissionsClientPage({ initialPermissions }: PermissionsClientPageProps) {
  const [permissions, setPermissions] = useState(initialPermissions);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refetch = async () => {
    const response = await fetch('/api/v1/admin/permissions');
    const data = await response.json();
    setPermissions(data);
  };

  const handleAdd = () => {
    setEditingPermission(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (permission: Permission) => {
    setEditingPermission(permission);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/v1/admin/permissions/${id}`, { method: 'DELETE' });
      toast.success('Permission deleted successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to delete permission');
    }
  };

  const handleSubmit = async (values: { name: string; description?: string }) => {
    setIsSubmitting(true);
    const url = editingPermission
      ? `/api/v1/admin/permissions/${editingPermission.id}`
      : '/api/v1/admin/permissions';
    const method = editingPermission ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Failed to save permission');
      }

      toast.success(`Permission ${editingPermission ? 'updated' : 'added'} successfully`);
      refetch();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save permission');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: ColumnConfig<Permission>[] = [
    {
      key: 'name',
      title: 'Name',
    },
    {
      key: 'description',
      title: 'Description',
    },
  ];

  const renderRowActions = (permission: Permission) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleEdit(permission)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleDelete(permission.id)}
          className="text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <AdminListPage<Permission>
        title="Permissions"
        description="Manage user permissions"
        columns={columns}
        data={permissions}
        renderRowActions={renderRowActions}
        addConfig={{
          label: 'Add Permission',
          onClick: handleAdd,
        }}
      />
      <PermissionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleSubmit}
        initialData={editingPermission || undefined}
        isSubmitting={isSubmitting}
      />
    </>
  );
}