'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowDown,
  ArrowRight,
  Users,
  Shield,
  Crown,
  Star,
  Search,
  Eye,
  GitBranch,
  Layers,
  ChevronDown,
  ChevronRight,
  Info,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { browserLogger } from '@/lib/browser-logger';

/**
 * PermissionInheritanceViewer Component
 * 
 * Visualizes permission inheritance chains and role hierarchies
 * with detailed inheritance paths and conflict resolution.
 * 
 * @component PermissionInheritanceViewer
 * @param {PermissionInheritanceViewerProps} props - Component props
 * @returns {JSX.Element} Permission inheritance visualization
 * 
 * @example
 * ```tsx
 * <PermissionInheritanceViewer
 *   selectedRole="tenant_admin"
 *   onRoleSelect={(roleId) => setSelectedRole(roleId)}
 *   showInheritancePaths={true}
 * />
 * ```
 */

export interface InheritanceNode {
  id: string;
  name: string;
  type: 'role' | 'permission';
  level: number;
  description: string;
  children: InheritanceNode[];
  parent?: string;
  icon: React.ElementType;
  color: string;
  isActive: boolean;
  source?: 'direct' | 'inherited' | 'overridden';
}

export interface RolePermission {
  id: string;
  resource: string;
  action: string;
  description: string;
  source: 'direct' | 'inherited';
  inheritedFrom?: string;
  level: number;
}

export interface PermissionInheritanceViewerProps {
  /** Currently selected role */
  selectedRole?: string;
  /** Role selection handler */
  onRoleSelect?: (roleId: string) => void;
  /** Show detailed inheritance paths */
  showInheritancePaths?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Compact view mode */
  compact?: boolean;
}

// Mock role hierarchy data
const ROLE_HIERARCHY: InheritanceNode[] = [
  {
    id: 'super_admin',
    name: 'Super Admin',
    type: 'role',
    level: 5,
    description: 'Platform-wide administrative access',
    icon: Crown,
    color: 'bg-red-100 text-red-700 border-red-200',
    isActive: true,
    children: [
      {
        id: 'tenant_admin',
        name: 'Tenant Admin',
        type: 'role',
        level: 4,
        description: 'Full tenant management access',
        icon: Shield,
        color: 'bg-purple-100 text-purple-700 border-purple-200',
        isActive: true,
        parent: 'super_admin',
        children: [
          {
            id: 'content_moderator',
            name: 'Content Moderator',
            type: 'role',
            level: 3,
            description: 'Content review and moderation',
            icon: Eye,
            color: 'bg-blue-100 text-blue-700 border-blue-200',
            isActive: true,
            parent: 'tenant_admin',
            children: [
              {
                id: 'account_owner',
                name: 'Account Owner',
                type: 'role',
                level: 2,
                description: 'Manage owned accounts and profiles',
                icon: Star,
                color: 'bg-green-100 text-green-700 border-green-200',
                isActive: true,
                parent: 'content_moderator',
                children: [
                  {
                    id: 'user',
                    name: 'User',
                    type: 'role',
                    level: 1,
                    description: 'Basic platform access',
                    icon: Users,
                    color: 'bg-gray-100 text-gray-700 border-gray-200',
                    isActive: true,
                    parent: 'account_owner',
                    children: []
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];

// Mock permission data with inheritance
const ROLE_PERMISSIONS: Record<string, RolePermission[]> = {
  super_admin: [
    {
      id: 'system.manage',
      resource: 'system',
      action: 'manage',
      description: 'Full system management access',
      source: 'direct',
      level: 5
    },
    {
      id: 'tenant.create',
      resource: 'tenant',
      action: 'create',
      description: 'Create new tenants',
      source: 'direct',
      level: 5
    }
  ],
  tenant_admin: [
    {
      id: 'tenant.settings.manage',
      resource: 'tenant',
      action: 'settings.manage',
      description: 'Manage tenant configuration',
      source: 'direct',
      level: 4
    },
    {
      id: 'accounts.manage.all',
      resource: 'accounts',
      action: 'manage.all',
      description: 'Manage all tenant accounts',
      source: 'direct',
      level: 4
    },
    {
      id: 'profiles.moderate',
      resource: 'profiles',
      action: 'moderate',
      description: 'Moderate and review profiles',
      source: 'inherited',
      inheritedFrom: 'content_moderator',
      level: 3
    }
  ],
  content_moderator: [
    {
      id: 'profiles.moderate',
      resource: 'profiles',
      action: 'moderate',
      description: 'Moderate and review profiles',
      source: 'direct',
      level: 3
    },
    {
      id: 'reports.review',
      resource: 'reports',
      action: 'review',
      description: 'Review user reports',
      source: 'direct',
      level: 3
    },
    {
      id: 'accounts.manage.own',
      resource: 'accounts',
      action: 'manage.own',
      description: 'Manage owned accounts',
      source: 'inherited',
      inheritedFrom: 'account_owner',
      level: 2
    }
  ],
  account_owner: [
    {
      id: 'accounts.manage.own',
      resource: 'accounts',
      action: 'manage.own',
      description: 'Manage owned accounts',
      source: 'direct',
      level: 2
    },
    {
      id: 'profiles.manage.own',
      resource: 'profiles',
      action: 'manage.own',
      description: 'Edit and manage owned profiles',
      source: 'direct',
      level: 2
    },
    {
      id: 'profiles.view.own',
      resource: 'profiles',
      action: 'view.own',
      description: 'View owned profiles',
      source: 'inherited',
      inheritedFrom: 'user',
      level: 1
    }
  ],
  user: [
    {
      id: 'profiles.view.own',
      resource: 'profiles',
      action: 'view.own',
      description: 'View owned profiles',
      source: 'direct',
      level: 1
    },
    {
      id: 'accounts.view.own',
      resource: 'accounts',
      action: 'view.own',
      description: 'View owned accounts',
      source: 'direct',
      level: 1
    }
  ]
};

export function PermissionInheritanceViewer({
  selectedRole = 'tenant_admin',
  onRoleSelect,
  showInheritancePaths = true,
  className,
  compact = false
}: PermissionInheritanceViewerProps) {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['super_admin']));
  const [selectedView, setSelectedView] = useState<'hierarchy' | 'permissions'>('hierarchy');

  // Handle role selection
  const handleRoleSelect = (roleId: string) => {
    browserLogger.userAction('inheritance_role_select', 'PermissionInheritanceViewer', {
      roleId,
      previousRole: selectedRole
    });
    onRoleSelect?.(roleId);
  };

  // Toggle node expansion
  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // Get inheritance path for a role
  const getInheritancePath = (roleId: string): string[] => {
    const path: string[] = [];
    
    const findPath = (node: InheritanceNode, targetId: string, currentPath: string[]): boolean => {
      if (node.id === targetId) {
        path.push(...currentPath, node.id);
        return true;
      }
      
      for (const child of node.children) {
        if (findPath(child, targetId, [...currentPath, node.id])) {
          return true;
        }
      }
      
      return false;
    };

    for (const rootNode of ROLE_HIERARCHY) {
      if (findPath(rootNode, roleId, [])) {
        break;
      }
    }

    return path;
  };

  // Render hierarchy tree
  const renderHierarchyNode = (node: InheritanceNode, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedRole === node.id;
    const hasChildren = node.children.length > 0;
    const NodeIcon = node.icon;

    return (
      <div key={node.id} className="space-y-2">
        <div 
          className={cn(
            'flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors',
            isSelected ? 'bg-blue-100 border-2 border-blue-300' : 'hover:bg-gray-50 border border-gray-200',
            node.color
          )}
          style={{ marginLeft: `${depth * 24}px` }}
          onClick={() => handleRoleSelect(node.id)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="p-1 hover:bg-white/50 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          
          {!hasChildren && <div className="w-6" />}
          
          <div className="p-2 bg-white/80 rounded">
            <NodeIcon className="h-4 w-4" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium">{node.name}</span>
              <Badge variant="outline" className="text-xs">
                Level {node.level}
              </Badge>
              {isSelected && (
                <Badge className="bg-blue-600 text-white text-xs">
                  Selected
                </Badge>
              )}
            </div>
            {!compact && (
              <p className="text-sm opacity-80 mt-1">{node.description}</p>
            )}
          </div>
          
          {depth > 0 && (
            <ArrowDown className="h-4 w-4 opacity-50" />
          )}
        </div>

        {isExpanded && hasChildren && (
          <div className="space-y-2">
            {node.children.map(child => renderHierarchyNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Get effective permissions for a role
  const getEffectivePermissions = (roleId: string): RolePermission[] => {
    const permissions = ROLE_PERMISSIONS[roleId] || [];
    const inheritancePath = getInheritancePath(roleId);
    
    // Add inherited permissions from parent roles
    const inheritedPermissions: RolePermission[] = [];
    inheritancePath.forEach((ancestorId, index) => {
      if (ancestorId !== roleId && ROLE_PERMISSIONS[ancestorId]) {
        ROLE_PERMISSIONS[ancestorId].forEach(permission => {
          // Don't add if already exists with higher precedence
          if (!permissions.find(p => p.id === permission.id) && 
              !inheritedPermissions.find(p => p.id === permission.id)) {
            inheritedPermissions.push({
              ...permission,
              source: 'inherited',
              inheritedFrom: ancestorId
            });
          }
        });
      }
    });

    return [...permissions, ...inheritedPermissions].sort((a, b) => b.level - a.level);
  };

  const effectivePermissions = selectedRole ? getEffectivePermissions(selectedRole) : [];
  const inheritancePath = selectedRole ? getInheritancePath(selectedRole) : [];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Permission Inheritance</h3>
          <p className="text-sm text-gray-600">
            Visualize role hierarchy and permission inheritance paths
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={selectedView === 'hierarchy' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedView('hierarchy')}
          >
            <Layers className="h-4 w-4 mr-2" />
            Hierarchy
          </Button>
          <Button
            variant={selectedView === 'permissions' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedView('permissions')}
          >
            <Shield className="h-4 w-4 mr-2" />
            Permissions
          </Button>
        </div>
      </div>

      {/* Search */}
      {selectedView === 'permissions' && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search permissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Content Tabs */}
      {selectedView === 'hierarchy' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Role Hierarchy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GitBranch className="h-5 w-5" />
                <span>Role Hierarchy</span>
              </CardTitle>
              <CardDescription>
                Click on roles to explore their permissions and inheritance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {ROLE_HIERARCHY.map(node => renderHierarchyNode(node))}
            </CardContent>
          </Card>

          {/* Inheritance Path */}
          {selectedRole && showInheritancePaths && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ArrowRight className="h-5 w-5" />
                  <span>Inheritance Path</span>
                </CardTitle>
                <CardDescription>
                  Permission inheritance flow for {selectedRole}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {inheritancePath.length > 0 ? (
                  <div className="space-y-3">
                    {inheritancePath.map((roleId, index) => {
                      const roleInfo = ROLE_HIERARCHY[0].children.find(r => r.id === roleId) || 
                                     ROLE_HIERARCHY.find(r => r.id === roleId);
                      if (!roleInfo) return null;
                      
                      const RoleIcon = roleInfo.icon;
                      const isSelected = roleId === selectedRole;
                      
                      return (
                        <div key={roleId} className="flex items-center space-x-3">
                          <div className={cn(
                            'p-3 rounded-lg border',
                            isSelected ? 'bg-blue-100 border-blue-300' : roleInfo.color
                          )}>
                            <div className="flex items-center space-x-3">
                              <RoleIcon className="h-5 w-5" />
                              <div>
                                <div className="font-medium">{roleInfo.name}</div>
                                <div className="text-xs opacity-75">Level {roleInfo.level}</div>
                              </div>
                            </div>
                          </div>
                          
                          {index < inheritancePath.length - 1 && (
                            <ArrowDown className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Info className="h-8 w-8 mx-auto mb-2" />
                    <p>Select a role to view inheritance path</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* Permission Details */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Effective Permissions</span>
              {selectedRole && (
                <Badge variant="outline" className="ml-2">
                  {selectedRole}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              All permissions available to the selected role (direct + inherited)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedRole ? (
              <div className="space-y-3">
                {effectivePermissions
                  .filter(permission => 
                    !searchTerm || 
                    permission.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    permission.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    permission.action.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(permission => (
                    <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <Badge variant={permission.source === 'direct' ? 'default' : 'outline'}>
                            {permission.source === 'direct' ? 'Direct' : 'Inherited'}
                          </Badge>
                          <span className="font-medium">
                            {permission.resource}.{permission.action}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            Level {permission.level}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {permission.description}
                        </p>
                        {permission.inheritedFrom && (
                          <p className="text-xs text-blue-600 mt-1">
                            Inherited from: {permission.inheritedFrom}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                {effectivePermissions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>No permissions found for this role</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Shield className="h-8 w-8 mx-auto mb-2" />
                <p>Select a role from the hierarchy to view permissions</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 