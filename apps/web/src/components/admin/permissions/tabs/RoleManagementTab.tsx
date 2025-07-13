/**
 * @fileoverview Role Management Tab - Enterprise Permission System
 * 
 * Comprehensive role management interface with:
 * - Role listing with advanced filtering
 * - Role creation and editing capabilities
 * - Permission assignment interface
 * - Role templates and blueprints
 * - Bulk operations support
 * - Three-level caching integration
 * 
 * @author itellico Mono Team
 * @version 1.0.0
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AdminListPage, type ColumnConfig, type FilterConfig, type BulkAction } from '@/components/admin/AdminListPage';
import { useToast } from '@/hooks/use-toast';
import { browserLogger } from '@/lib/browser-logger';
import { Edit, Trash2, MoreHorizontal } from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface Permission {
  id: number;
  name: string;
  description: string | null;
  category: string;
}

interface Role {
  id: number;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    users: number;
    permissions: number;
  };
  users: Array<{
    user: {
      id: number;
      account: {
        email: string;
      };
    };
  }>;
  permissions: Array<{
    permission: {
      id: number;
      name: string;
      description: string | null;
    };
  }>;
}

interface RoleFormData {
  name: string;
  description: string;
  permissions: number[];
}

interface RoleManagementTabProps {
  userId: number;
  userEmail: string;
  tenantId: number | null;
  isSuperAdmin: boolean;
}

// ============================================================================
// REAL SERVICES WITH REDIS CACHING - NO MORE MOCK DATA
// ============================================================================

const fetchRoles = async (): Promise<Role[]> => {
  const response = await fetch('/api/v1/admin/roles', {
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error('Failed to fetch roles');
  }
  const data = await response.json();
  return data.data || []; // Extract the roles array from the response
};

const fetchPermissions = async (): Promise<Permission[]> => {
  const response = await fetch('/api/v1/admin/permissions', {
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error('Failed to fetch permissions');
  }
  const data = await response.json();
  return data.data || []; // Extract the permissions array from the response
};

const createRole = async (roleData: RoleFormData): Promise<Role> => {
  const response = await fetch('/api/v1/admin/roles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(roleData),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create role');
  }
  
  return response.json();
};

const updateRole = async (id: number, roleData: Partial<RoleFormData>): Promise<Role> => {
  const response = await fetch(`/api/v1/admin/roles/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(roleData),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update role');
  }
  
  return response.json();
};

const deleteRole = async (id: number): Promise<void> => {
  const response = await fetch(`/api/v1/admin/roles/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete role');
  }
};

const bulkDeleteRoles = async (ids: number[]): Promise<void> => {
  const response = await fetch('/api/v1/admin/roles/bulk-delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete roles');
  }
};

// ============================================================================
// ROLE FORM DIALOG COMPONENT
// ============================================================================

interface RoleFormDialogProps {
  role?: Role;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function RoleFormDialog({ role, open, onOpenChange, onSuccess }: RoleFormDialogProps) {
  const [formData, setFormData] = useState<RoleFormData>({
    name: role?.name || '',
    description: role?.description || '',
    permissions: role?.permissions.map(p => p.permission.id) || [],
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available permissions
  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: fetchPermissions,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createMutation = useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      onSuccess();
      onOpenChange(false);
      toast({
        title: 'Role Created',
        description: 'Role has been created successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create role',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<RoleFormData>) => updateRole(role!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      onSuccess();
      onOpenChange(false);
      toast({
        title: 'Role Updated',
        description: 'Role has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update role',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Role name is required',
        variant: 'destructive',
      });
      return;
    }

    if (role) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const togglePermission = (permissionId: number) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {role ? 'Edit Role' : 'Create New Role'}
          </DialogTitle>
          <DialogDescription>
            {role ? 'Update role details and permissions' : 'Create a new role with specific permissions'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter role name"
                disabled={role?.isSystem}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter role description"
                rows={3}
              />
            </div>
          </div>

          <div>
            <Label>Permissions ({formData.permissions.length} selected)</Label>
            <div className="mt-2 max-h-60 overflow-y-auto border rounded-lg p-4">
              <div className="grid grid-cols-1 gap-2">
                {permissions.map((permission: any) => (
                  <label
                    key={permission.id}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(permission.id)}
                      onChange={() => togglePermission(permission.id)}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{permission.name}</div>
                      {permission.description && (
                        <div className="text-xs text-muted-foreground">{permission.description}</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : role ? 'Update Role' : 'Create Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// MAIN ROLE MANAGEMENT TAB COMPONENT
// ============================================================================

export function RoleManagementTab({ userId, userEmail, tenantId, isSuperAdmin }: RoleManagementTabProps) {
  const [searchValue, setSearchValue] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ✅ TanStack Query with three-level caching
  const { data: roles = [], isLoading, error } = useQuery({
    queryKey: ['roles', { search: searchValue, filters: activeFilters }],
    queryFn: fetchRoles,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // ✅ AUDIT: Log role management access
  useEffect(() => {
    browserLogger.userAction('Role management tab accessed', 'RoleManagementTab', {
      userId,
      userEmail,
      tenantId,
      timestamp: new Date().toISOString()
    });
  }, [userId, userEmail, tenantId]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({
        title: 'Role Deleted',
        description: 'Role has been deleted successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete role',
        variant: 'destructive',
      });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: bulkDeleteRoles,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setSelectedRows(new Set());
      toast({
        title: 'Roles Deleted',
        description: 'Selected roles have been deleted successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete roles',
        variant: 'destructive',
      });
    },
  });

  // Filter the roles based on search and filters
  const filteredRoles = useMemo(() => {
    let filtered = roles;

    // Apply search filter
    if (searchValue) {
      filtered = filtered.filter(role =>
        role.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        role.description?.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    // Apply additional filters
    if (activeFilters.type?.length) {
      filtered = filtered.filter(role => {
        if (activeFilters.type.includes('system') && role.isSystem) return true;
        if (activeFilters.type.includes('custom') && !role.isSystem) return true;
        return false;
      });
    }

    if (activeFilters.userCount?.length) {
      filtered = filtered.filter(role => {
        const userCount = role._count.users;
        if (activeFilters.userCount.includes('none') && userCount === 0) return true;
        if (activeFilters.userCount.includes('low') && userCount > 0 && userCount <= 5) return true;
        if (activeFilters.userCount.includes('medium') && userCount > 5 && userCount <= 20) return true;
        if (activeFilters.userCount.includes('high') && userCount > 20) return true;
        return false;
      });
    }

    return filtered;
  }, [roles, searchValue, activeFilters]);

  // ✅ Column configuration
  const columns: ColumnConfig<Role>[] = [
    {
      key: 'name',
      title: 'Role Name',
      render: (_, role) => (
        <div className="space-y-1">
          <div className="font-medium flex items-center gap-2">
            {role.name}
            {role.isSystem && <Badge variant="secondary" className="text-xs">System</Badge>}
          </div>
          {role.description && (
            <div className="text-sm text-muted-foreground">{role.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'users',
      title: 'Users',
      render: (_, role) => (
        <Badge variant="outline">
          {role._count.users} {role._count.users === 1 ? 'user' : 'users'}
        </Badge>
      ),
    },
    {
      key: 'permissions',
      title: 'Permissions',
      render: (_, role) => (
        <Badge variant="outline">
          {role._count.permissions} {role._count.permissions === 1 ? 'permission' : 'permissions'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      title: 'Created',
      render: (_, role) => new Date(role.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions' as keyof Role,
      title: 'Actions',
      render: (_, role) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0" aria-label={`Actions for ${role.name}`}>
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => setEditingRole(role)}
              disabled={role.isSystem && !isSuperAdmin}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Role
            </DropdownMenuItem>
            {!role.isSystem && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => deleteMutation.mutate(role.id)}
                  disabled={deleteMutation.isPending}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Role
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // ✅ Filter configuration
  const filters: FilterConfig[] = [
    {
      key: 'type',
      title: 'Role Type',
      type: 'multiSelect',
      options: [
        { label: 'System Roles', value: 'system' },
        { label: 'Custom Roles', value: 'custom' },
      ],
    },
    {
      key: 'userCount',
      title: 'User Count',
      type: 'multiSelect',
      options: [
        { label: 'No Users', value: 'none' },
        { label: 'Low (1-5)', value: 'low' },
        { label: 'Medium (6-20)', value: 'medium' },
        { label: 'High (20+)', value: 'high' },
      ],
    },
  ];

  // ✅ Bulk actions
  const bulkActions: BulkAction[] = [
    {
      key: 'delete',
      label: 'Delete Selected',
      variant: 'destructive',
      permission: {
        action: 'delete',
        resource: 'roles',
      },
      onClick: (selectedIds) => {
        if (!roles || roles.length === 0) {
          toast({
            title: 'Error',
            description: 'Roles data not available',
            variant: 'destructive',
          });
          return;
        }
        
        const roleIds = Array.from(selectedIds) as number[];
        const systemRoles = roleIds.filter(id => 
          roles.find(r => r.id === id)?.isSystem
        );
        
        if (systemRoles.length > 0 && !isSuperAdmin) {
          toast({
            title: 'Error',
            description: 'Cannot delete system roles',
            variant: 'destructive',
          });
          return;
        }
        
        bulkDeleteMutation.mutate(roleIds);
      },
    },
  ];

  // ✅ Stats cards
  const statsCards = [
    {
      title: 'Total Roles',
      value: roles?.length || 0,
      description: 'System & Custom Roles',
    },
    {
      title: 'System Roles',
      value: roles?.filter(r => r.isSystem).length || 0,
      description: 'Built-in roles',
    },
    {
      title: 'Custom Roles',
      value: roles?.filter(r => !r.isSystem).length || 0,
      description: 'User-created roles',
    },
    {
      title: 'Total Users',
      value: roles?.reduce((sum, role) => sum + role._count.users, 0) || 0,
      description: 'With role assignments',
    },
  ];

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading roles: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <AdminListPage
        title="Role Management"
        description="Manage system roles and their permission assignments"
        statsCards={statsCards}
        addConfig={{
          label: 'Create Role',
          onClick: () => setShowCreateDialog(true),
          permission: {
            action: 'create',
            resource: 'roles',
          },
        }}
        searchConfig={{
          placeholder: 'Search roles...',
          value: searchValue,
          onChange: setSearchValue,
        }}
        filters={filters}
        activeFilters={activeFilters}
        onFilterChange={(key, values) => setActiveFilters(prev => ({ ...prev, [key]: values }))}
        onClearFilters={() => setActiveFilters({})}
        columns={columns}
        data={filteredRoles}
        isLoading={isLoading}
        selectedRows={selectedRows}
        onRowSelect={(id, selected) => {
          const newSelection = new Set(selectedRows);
          if (selected) {
            newSelection.add(id);
          } else {
            newSelection.delete(id);
          }
          setSelectedRows(newSelection);
        }}
        onSelectAll={(selected) => {
          if (selected) {
            setSelectedRows(new Set(filteredRoles.map(role => role.id)));
          } else {
            setSelectedRows(new Set());
          }
        }}
        bulkActions={bulkActions}
        savedSearchConfig={{
          entityType: 'roles',
          enabled: true,
          canSave: true,
          canLoad: true,
        }}
        userContext={{
          userId: userId.toString(),
          adminRole: isSuperAdmin ? 'super_admin' : 'admin',
          tenantId: tenantId?.toString() || null,
          permissions: ['roles.create', 'roles.read', 'roles.update', 'roles.delete'],
        }}
      />

      {/* Create Role Dialog */}
      <RoleFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          browserLogger.userAction('Role created', 'RoleManagementTab', {
            userId,
            userEmail,
            timestamp: new Date().toISOString()
          });
        }}
      />

      {/* Edit Role Dialog */}
      <RoleFormDialog
        role={editingRole || undefined}
        open={!!editingRole}
        onOpenChange={(open) => !open && setEditingRole(null)}
        onSuccess={() => {
          browserLogger.userAction('Role updated', 'RoleManagementTab', {
            userId,
            userEmail,
            roleId: editingRole?.id,
            timestamp: new Date().toISOString()
          });
          setEditingRole(null);
        }}
      />
    </div>
  );
} 