/**
 * Permission Management Tab - Enterprise Permission System
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminListPage, ColumnConfig, FilterConfig } from '@/components/admin/AdminListPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { browserLogger } from '@/lib/browser-logger';
import { Key, Shield, Edit, Trash2 } from 'lucide-react';

interface Permission {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    roles: number;
  };
  roles: Array<{
    role: {
      id: number;
      name: string;
    };
  }>;
}

interface PermissionManagementTabProps {
  userId: number;
  userEmail: string;
  tenantId: number | null;
  isSuperAdmin: boolean;
}

// Mock data for development
const mockPermissions: Permission[] = [
  {
    id: 1,
    name: 'admin.full_access',
    description: 'Full administrative access to all system features',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    _count: { roles: 1 },
    roles: [{ role: { id: 1, name: 'super_admin' } }]
  },
  {
    id: 2,
    name: 'admin.manage',
    description: 'Administrative management access',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    _count: { roles: 2 },
    roles: [
      { role: { id: 1, name: 'super_admin' } },
      { role: { id: 2, name: 'tenant_admin' } }
    ]
  },
  {
    id: 3,
    name: 'content.create',
    description: 'Create content and posts',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    _count: { roles: 3 },
    roles: [
      { role: { id: 1, name: 'super_admin' } },
      { role: { id: 2, name: 'tenant_admin' } },
      { role: { id: 3, name: 'content_moderator' } }
    ]
  },
  {
    id: 4,
    name: 'content.edit',
    description: 'Edit and modify content',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    _count: { roles: 3 },
    roles: [
      { role: { id: 1, name: 'super_admin' } },
      { role: { id: 2, name: 'tenant_admin' } },
      { role: { id: 3, name: 'content_moderator' } }
    ]
  },
  {
    id: 5,
    name: 'content.delete',
    description: 'Delete content and posts',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    _count: { roles: 2 },
    roles: [
      { role: { id: 1, name: 'super_admin' } },
      { role: { id: 2, name: 'tenant_admin' } }
    ]
  }
];

export function PermissionManagementTab({ userId, userEmail, tenantId, isSuperAdmin }: PermissionManagementTabProps) {
  const [searchValue, setSearchValue] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});

  const { toast } = useToast();

  // Mock query for now - will implement real API later
  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['permissions', { search: searchValue, filters: activeFilters }],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockPermissions;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Audit logging
  useEffect(() => {
    browserLogger.userAction('Permission management tab accessed', 'PermissionManagementTab', {
      userId, userEmail, tenantId, timestamp: new Date().toISOString()
    });
  }, [userId, userEmail, tenantId]);

  // Filter permissions
  const filteredPermissions = useMemo(() => {
    let filtered = permissions;

    if (searchValue) {
      filtered = filtered.filter(permission =>
        permission.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        permission.description?.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    if (activeFilters.category?.length) {
      filtered = filtered.filter(permission => {
        const category = permission.name.split('.')[0];
        return activeFilters.category.includes(category);
      });
    }

    if (activeFilters.roleCount?.length) {
      filtered = filtered.filter(permission => {
        const roleCount = permission._count.roles;
        if (activeFilters.roleCount.includes('none') && roleCount === 0) return true;
        if (activeFilters.roleCount.includes('low') && roleCount > 0 && roleCount <= 2) return true;
        if (activeFilters.roleCount.includes('medium') && roleCount > 2 && roleCount <= 5) return true;
        if (activeFilters.roleCount.includes('high') && roleCount > 5) return true;
        return false;
      });
    }

    return filtered;
  }, [permissions, searchValue, activeFilters]);

  // Column configuration
  const columns: ColumnConfig<Permission>[] = [
    {
      key: 'name',
      title: 'Permission Name',
      sortable: true,
      render: (_, permission) => (
        <div className="flex items-center space-x-2">
          <Key className="h-4 w-4 text-blue-600" />
          <div>
            <div className="font-medium">{permission.name}</div>
            <div className="text-xs text-muted-foreground">
              {permission.name.split('.')[0]} category
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      title: 'Description',
      render: (_, permission) => (
        <div className="max-w-xs truncate text-muted-foreground">
          {permission.description || 'No description'}
        </div>
      ),
    },
    {
      key: 'roles',
      title: 'Assigned Roles',
      render: (_, permission) => (
        <div className="flex flex-wrap gap-1">
          {permission.roles.slice(0, 3).map((roleAssignment) => (
            <Badge key={roleAssignment.role.id} variant="secondary" className="text-xs">
              {roleAssignment.role.name}
            </Badge>
          ))}
          {permission.roles.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{permission.roles.length - 3} more
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: '_count',
      title: 'Role Count',
      render: (_, permission) => (
        <div className="flex items-center space-x-1">
          <Shield className="h-4 w-4 text-gray-500" />
          <span>{permission._count.roles}</span>
        </div>
      ),
    },
    {
      key: 'updatedAt',
      title: 'Last Updated',
      render: (_, permission) => (
        <div className="text-sm text-muted-foreground">
          {new Date(permission.updatedAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, permission) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              toast({
                title: 'Edit Permission',
                description: `Edit functionality for ${permission.name} coming soon`,
              });
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              toast({
                title: 'Delete Permission',
                description: `Delete functionality for ${permission.name} coming soon`,
              });
            }}
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  // Filter configuration
  const filters: FilterConfig[] = [
    {
      key: 'category',
      title: 'Category',
      type: 'multiSelect',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Content', value: 'content' },
        { label: 'User', value: 'user' },
        { label: 'System', value: 'system' },
      ],
    },
    {
      key: 'roleCount',
      title: 'Role Count',
      type: 'multiSelect',
      options: [
        { label: 'No Roles', value: 'none' },
        { label: 'Low (1-2)', value: 'low' },
        { label: 'Medium (3-5)', value: 'medium' },
        { label: 'High (6+)', value: 'high' },
      ],
    },
  ];

  // Stats cards
  const statsCards = [
    { title: 'Total Permissions', value: permissions.length, description: 'System permissions' },
    { title: 'Admin Permissions', value: permissions.filter(p => p.name.startsWith('admin.')).length },
    { title: 'Content Permissions', value: permissions.filter(p => p.name.startsWith('content.')).length },
    { title: 'Avg Roles per Permission', value: Math.round(permissions.reduce((sum, p) => sum + p._count.roles, 0) / permissions.length || 0) },
  ];

  return (
    <div className="space-y-6">
      <AdminListPage
        title="Permission Management"
        description="Manage individual permissions and resource scoping"
        statsCards={statsCards}
        addConfig={{
          label: 'Create Permission',
          onClick: () => {
            toast({
              title: 'Create Permission',
              description: 'Permission creation functionality coming soon',
            });
          },
        }}
        searchConfig={{
          placeholder: 'Search permissions...',
          value: searchValue,
          onChange: setSearchValue,
        }}
        filters={filters}
        activeFilters={activeFilters}
        onFilterChange={(key, values) => setActiveFilters(prev => ({ ...prev, [key]: values }))}
        onClearFilters={() => setActiveFilters({})}
        columns={columns}
        data={filteredPermissions}
        isLoading={isLoading}
        selectedRows={selectedRows}
        onRowSelect={(id, selected) => {
          const newSelection = new Set(selectedRows);
          if (selected) newSelection.add(id);
          else newSelection.delete(id);
          setSelectedRows(newSelection);
        }}
        savedSearchConfig={{
          entityType: 'permissions',
          enabled: true,
          canSave: true,
          canLoad: true,
        }}
      />
    </div>
  );
} 