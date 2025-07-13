/**
 * Permission Matrix Tab - Optimized Permission System
 * 
 * Interactive matrix showing role and permission intersections with:
 * - Visual role vs permission grid
 * - Wildcard permission visualization
 * - Scope-based grouping (global/tenant/own)
 * - Quick toggle functionality
 * - Bulk permission operations
 * - Real-time updates with optimistic UI
 * 
 * @version 2.0.0
 */

'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { browserLogger } from '@/lib/browser-logger';
import { Download, Upload, RotateCcw, Search, Grid3X3, Eye, EyeOff, AlertCircle } from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface Role {
  id: number;
  name: string;
  code: string;
  description: string | null;
  _count: {
    permissions: number;
    users: number;
  };
  permissions?: Array<{
    permission: {
      id: number;
      name: string;
    };
  }>;
}

interface Permission {
  id: number;
  name: string;
  pattern?: string;
  description: string | null;
  resource?: string;
  action?: string;
  scope?: 'global' | 'tenant' | 'own';
  isWildcard?: boolean;
  category?: string;
}

interface RolePermission {
  roleId: number;
  permissionId: number;
}

interface PermissionMatrixTabProps {
  userId: number;
  userEmail: string;
  tenantId: number | null;
  isSuperAdmin: boolean;
}

// ============================================================================
// API SERVICES
// ============================================================================

const fetchRoles = async (): Promise<Role[]> => {
  const response = await fetch('/api/v1/admin/roles', {
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error('Failed to fetch roles');
  }
  const data = await response.json();
  return data.data || [];
};

const fetchPermissions = async (): Promise<Permission[]> => {
  const response = await fetch('/api/v1/admin/permissions', {
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error('Failed to fetch permissions');
  }
  const data = await response.json();
  return data.data || [];
};

const updateRolePermission = async ({
  roleId,
  permissionId,
  grant
}: {
  roleId: number;
  permissionId: number;
  grant: boolean;
}): Promise<void> => {
  const response = await fetch(`/api/v1/admin/roles/${roleId}/permissions/${permissionId}`, {
    method: grant ? 'POST' : 'DELETE',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to ${grant ? 'grant' : 'revoke'} permission`);
  }
};

// ============================================================================
// PERMISSION MATRIX TAB COMPONENT
// ============================================================================

export function PermissionMatrixTab({ 
  userId, 
  userEmail, 
  tenantId, 
  isSuperAdmin 
}: PermissionMatrixTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showPermissionDetails, setShowPermissionDetails] = useState(true);
  const [selectedScope, setSelectedScope] = useState<string>('all');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: fetchRoles,
    staleTime: 5 * 60 * 1000,
  });

  const { data: permissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: fetchPermissions,
    staleTime: 5 * 60 * 1000,
  });

  // Build permission matrix from role data
  const permissionMatrix = useMemo(() => {
    const matrix = new Map<string, boolean>();
    
    roles.forEach(role => {
      if (role.permissions) {
        role.permissions.forEach(rp => {
          matrix.set(`${role.id}-${rp.permission.id}`, true);
        });
      }
    });
    
    return matrix;
  }, [roles]);

  // Group permissions by scope
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {
      global: [],
      tenant: [],
      own: [],
      other: []
    };
    
    permissions.forEach(permission => {
      const scope = permission.scope || 
        (permission.name.includes('.global') ? 'global' : 
         permission.name.includes('.tenant') ? 'tenant' : 
         permission.name.includes('.own') ? 'own' : 'other');
      
      // Ensure the scope exists in groups
      if (!groups[scope]) {
        groups[scope] = [];
      }
      
      groups[scope].push(permission);
    });
    
    return groups;
  }, [permissions]);

  // Filter permissions
  const filteredPermissions = useMemo(() => {
    let filtered = [...permissions];
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedScope !== 'all') {
      filtered = filtered.filter(p => {
        const scope = p.scope || 
          (p.name.includes('.global') ? 'global' : 
           p.name.includes('.tenant') ? 'tenant' : 
           p.name.includes('.own') ? 'own' : 'other');
        return scope === selectedScope;
      });
    }
    
    return filtered;
  }, [permissions, searchTerm, selectedScope]);

  // Permission toggle mutation
  const togglePermissionMutation = useMutation({
    mutationFn: updateRolePermission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast({
        title: 'Permission Updated',
        description: 'Role permission has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update permission',
        variant: 'destructive',
      });
    },
  });

  const handlePermissionToggle = (roleId: number, permissionId: number, currentState: boolean) => {
    togglePermissionMutation.mutate({
      roleId,
      permissionId,
      grant: !currentState,
    });
    
    browserLogger.userAction('Permission toggled', 'PermissionMatrixTab', {
      userId,
      userEmail,
      roleId,
      permissionId,
      grant: !currentState,
      timestamp: new Date().toISOString()
    });
  };

  const exportMatrix = () => {
    const csvContent = [
      ['Permission', ...roles.map(r => r.name)].join(','),
      ...filteredPermissions.map(permission => {
        const row = [permission.name];
        roles.forEach(role => {
          const hasPermission = permissionMatrix.has(`${role.id}-${permission.id}`);
          const isInherited = role.code === 'super_admin' && 
            (permission.scope === 'global' || permission.name.includes('.global'));
          row.push(hasPermission ? '✓' : (isInherited ? '(inherited)' : ''));
        });
        return row.join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `permission-matrix-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    browserLogger.userAction('Matrix exported', 'PermissionMatrixTab', {
      userId,
      userEmail,
      timestamp: new Date().toISOString()
    });
  };

  if (rolesLoading || permissionsLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Permission Matrix
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPermissionDetails(!showPermissionDetails)}
              >
                {showPermissionDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPermissionDetails ? 'Hide' : 'Show'} Details
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportMatrix}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Interactive matrix showing role and permission relationships
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search permissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={selectedScope}
              onChange={(e) => setSelectedScope(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Scopes</option>
              <option value="global">Global</option>
              <option value="tenant">Tenant</option>
              <option value="own">Own</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Warning for super admin */}
          {isSuperAdmin && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Super Admin role inherits all permissions through wildcard patterns. Manual assignments shown for reference.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Matrix - Transposed: Permissions as rows, Roles as columns */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="sticky left-0 bg-white p-4 text-left font-medium min-w-[200px]">
                    Permission / Role
                  </th>
                  {roles.map(role => (
                    <th key={role.id} className="p-2 text-center min-w-[120px]">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="space-y-1">
                              <div className="text-sm font-medium">{role.name}</div>
                              {role.code === 'super_admin' && (
                                <Badge variant="destructive" className="text-xs">Super</Badge>
                              )}
                              {role.isSystem && (
                                <Badge variant="secondary" className="text-xs">System</Badge>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-2 max-w-xs">
                              <p className="font-medium">{role.name}</p>
                              {role.description && (
                                <p className="text-xs">{role.description}</p>
                              )}
                              <div className="flex gap-2 text-xs">
                                <Badge variant="outline">
                                  {role._count.users} user{role._count.users === 1 ? '' : 's'}
                                </Badge>
                                <Badge variant="outline">
                                  {role._count.permissions} permission{role._count.permissions === 1 ? '' : 's'}
                                </Badge>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPermissions.map(permission => (
                  <tr key={permission.id} className="border-b hover:bg-gray-50">
                    <td className="sticky left-0 bg-white p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                            {showPermissionDetails ? permission.name : permission.name.split('.').pop()}
                          </code>
                          {permission.isWildcard && (
                            <Badge variant="outline" className="text-xs">*</Badge>
                          )}
                        </div>
                        {permission.description && (
                          <div className="text-xs text-muted-foreground">{permission.description}</div>
                        )}
                        <div className="flex gap-2 text-xs">
                          <Badge 
                            variant="secondary"
                            className={
                              permission.scope === 'global' ? 'bg-red-100 text-red-700' :
                              permission.scope === 'tenant' ? 'bg-blue-100 text-blue-700' :
                              permission.scope === 'own' ? 'bg-green-100 text-green-700' :
                              ''
                            }
                          >
                            {permission.scope || 'unknown'}
                          </Badge>
                          {permission.resource && (
                            <Badge variant="outline" className="text-xs">
                              {permission.resource}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    {roles.map(role => {
                      const hasPermission = permissionMatrix.has(`${role.id}-${permission.id}`);
                      const isInherited = role.code === 'super_admin' && 
                        (permission.scope === 'global' || permission.name.includes('.global'));
                      
                      return (
                        <td key={role.id} className="p-2 text-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex justify-center">
                                  <Checkbox
                                    checked={hasPermission || isInherited}
                                    onCheckedChange={() => handlePermissionToggle(role.id, permission.id, hasPermission)}
                                    disabled={togglePermissionMutation.isPending || isInherited}
                                    className={isInherited ? 'opacity-50' : ''}
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-1">
                                  <p className="text-xs font-medium">{role.name}</p>
                                  {isInherited ? (
                                    <p className="text-xs">Inherited through wildcard pattern</p>
                                  ) : (
                                    <p className="text-xs">Click to {hasPermission ? 'revoke' : 'grant'}</p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Checkbox checked disabled />
              <span>Granted</span>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked disabled className="opacity-50" />
              <span>Inherited (wildcard)</span>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox disabled />
              <span>Not granted</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">*</Badge>
              <span>Wildcard permission</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}