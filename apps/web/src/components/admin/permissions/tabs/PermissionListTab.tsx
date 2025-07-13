/**
 * @fileoverview Permission List Tab - Optimized Permission System Display
 * 
 * Displays the new optimized permission structure with:
 * - Wildcard patterns
 * - Scope-based permissions (global/tenant/own)
 * - Category grouping
 * - Pattern visualization
 * 
 * @author itellico Mono Team
 * @version 2.0.0
 */

'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Shield, Globe, Building, User } from 'lucide-react';
import { browserLogger } from '@/lib/browser-logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface Permission {
  id: number;
  name: string;
  pattern?: string;
  description: string | null;
  resource?: string;
  action?: string;
  scope?: 'global' | 'tenant' | 'own';
  isWildcard?: boolean;
  priority?: number;
  category?: string;
  _count?: {
    roles: number;
  };
}

interface PermissionGroup {
  category: string;
  permissions: Permission[];
  icon: React.ReactNode;
  description: string;
}

interface PermissionListTabProps {
  userId: number;
  userEmail: string;
  tenantId: number | null;
  isSuperAdmin: boolean;
}

// ============================================================================
// PERMISSION SERVICE
// ============================================================================

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

// ============================================================================
// PERMISSION CATEGORIES
// ============================================================================

const PERMISSION_CATEGORIES = {
  'Platform Management': {
    icon: <Globe className="h-5 w-5" />,
    description: 'Platform-wide control and system operations',
    color: 'red'
  },
  'Global Configuration': {
    icon: <Shield className="h-5 w-5" />,
    description: 'Global settings and integrations',
    color: 'purple'
  },
  'User Management': {
    icon: <User className="h-5 w-5" />,
    description: 'User and account management across the platform',
    color: 'blue'
  },
  'Tenant Management': {
    icon: <Building className="h-5 w-5" />,
    description: 'Tenant-specific operations and settings',
    color: 'green'
  },
  'Content Management': {
    icon: <Shield className="h-5 w-5" />,
    description: 'Content moderation and management',
    color: 'yellow'
  },
  'Account Management': {
    icon: <User className="h-5 w-5" />,
    description: 'Individual account and team management',
    color: 'orange'
  },
  'Talent Management': {
    icon: <User className="h-5 w-5" />,
    description: 'Profile and portfolio management',
    color: 'pink'
  }
};

// ============================================================================
// PERMISSION LIST TAB COMPONENT
// ============================================================================

export function PermissionListTab({ 
  userId, 
  userEmail, 
  tenantId, 
  isSuperAdmin 
}: PermissionListTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScope, setSelectedScope] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch permissions
  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: fetchPermissions,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Group permissions by category
  const permissionGroups = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    
    permissions.forEach(permission => {
      // Determine category from permission name or metadata
      let category = permission.category || 'Uncategorized';
      
      // Auto-categorize based on permission patterns
      if (!permission.category) {
        if (permission.name.includes('platform.') || permission.name.includes('system.')) {
          category = 'Platform Management';
        } else if (permission.name.includes('config.') || permission.name.includes('integrations.')) {
          category = 'Global Configuration';
        } else if (permission.name.includes('users.') || permission.name.includes('impersonate.')) {
          category = 'User Management';
        } else if (permission.name.includes('tenant.') || permission.name.includes('billing.')) {
          category = 'Tenant Management';
        } else if (permission.name.includes('content.') || permission.name.includes('moderation.')) {
          category = 'Content Management';
        } else if (permission.name.includes('account.') || permission.name.includes('team.')) {
          category = 'Account Management';
        } else if (permission.name.includes('profiles.') || permission.name.includes('media.')) {
          category = 'Talent Management';
        }
      }
      
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(permission);
    });
    
    return groups;
  }, [permissions]);

  // Filter permissions
  const filteredPermissions = useMemo(() => {
    let filtered = [...permissions];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(permission => 
        permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.resource?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Scope filter
    if (selectedScope !== 'all') {
      filtered = filtered.filter(permission => permission.scope === selectedScope);
    }
    
    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(permission => {
        const category = permission.category || 
          (permission.name.includes('platform.') ? 'Platform Management' : 'Uncategorized');
        return category === selectedCategory;
      });
    }
    
    return filtered;
  }, [permissions, searchTerm, selectedScope, selectedCategory]);

  // Statistics
  const stats = useMemo(() => {
    const wildcardCount = permissions.filter(p => p.isWildcard || p.name.includes('*')).length;
    const globalCount = permissions.filter(p => p.scope === 'global' || p.name.includes('.global')).length;
    const tenantCount = permissions.filter(p => p.scope === 'tenant' || p.name.includes('.tenant')).length;
    const ownCount = permissions.filter(p => p.scope === 'own' || p.name.includes('.own')).length;
    
    return {
      total: permissions.length,
      wildcard: wildcardCount,
      global: globalCount,
      tenant: tenantCount,
      own: ownCount
    };
  }, [permissions]);

  const renderPermissionCard = (permission: Permission) => {
    const scope = permission.scope || 
      (permission.name.includes('.global') ? 'global' : 
       permission.name.includes('.tenant') ? 'tenant' : 
       permission.name.includes('.own') ? 'own' : 'unknown');
    
    const isWildcard = permission.isWildcard || permission.name.includes('*');
    
    return (
      <Card key={permission.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Permission Name and Pattern */}
            <div>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                  {permission.name}
                </code>
                {isWildcard && (
                  <Badge variant="outline" className="text-xs">
                    Wildcard
                  </Badge>
                )}
              </div>
              {permission.pattern && permission.pattern !== permission.name && (
                <div className="text-xs text-muted-foreground mt-1">
                  Pattern: <code className="bg-gray-50 px-1 rounded">{permission.pattern}</code>
                </div>
              )}
            </div>
            
            {/* Description */}
            {permission.description && (
              <p className="text-sm text-muted-foreground">
                {permission.description}
              </p>
            )}
            
            {/* Metadata */}
            <div className="flex items-center gap-2 text-xs">
              <Badge 
                variant="secondary"
                className={
                  scope === 'global' ? 'bg-red-100 text-red-700' :
                  scope === 'tenant' ? 'bg-blue-100 text-blue-700' :
                  scope === 'own' ? 'bg-green-100 text-green-700' :
                  ''
                }
              >
                {scope}
              </Badge>
              
              {permission.resource && (
                <Badge variant="outline" className="text-xs">
                  {permission.resource}
                </Badge>
              )}
              
              {permission.action && permission.action !== '*' && (
                <Badge variant="outline" className="text-xs">
                  {permission.action}
                </Badge>
              )}
              
              {permission._count?.roles && permission._count.roles > 0 && (
                <span className="text-muted-foreground">
                  • {permission._count.roles} role{permission._count.roles === 1 ? '' : 's'}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Permissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.wildcard}</div>
            <p className="text-sm text-muted-foreground">Wildcard Patterns</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.global}</div>
            <p className="text-sm text-muted-foreground">Global Scope</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.tenant}</div>
            <p className="text-sm text-muted-foreground">Tenant Scope</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.own}</div>
            <p className="text-sm text-muted-foreground">Own Scope</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
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
            <Select value={selectedScope} onValueChange={setSelectedScope}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scopes</SelectItem>
                <SelectItem value="global">Global</SelectItem>
                <SelectItem value="tenant">Tenant</SelectItem>
                <SelectItem value="own">Own</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.keys(PERMISSION_CATEGORIES).map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Permissions by Category */}
      <Tabs defaultValue="grouped" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="grouped">Grouped View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="grouped" className="space-y-6">
          {Object.entries(permissionGroups).map(([category, perms]) => {
            const categoryInfo = PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES];
            const filteredCategoryPerms = perms.filter(p => 
              filteredPermissions.some(fp => fp.id === p.id)
            );
            
            if (filteredCategoryPerms.length === 0) return null;
            
            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {categoryInfo?.icon || <Shield className="h-5 w-5" />}
                    {category}
                    <Badge variant="secondary" className="ml-auto">
                      {filteredCategoryPerms.length}
                    </Badge>
                  </CardTitle>
                  {categoryInfo?.description && (
                    <p className="text-sm text-muted-foreground">
                      {categoryInfo.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredCategoryPerms.map(renderPermissionCard)}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
        
        <TabsContent value="list" className="space-y-3">
          {filteredPermissions.map(renderPermissionCard)}
        </TabsContent>
      </Tabs>
    </div>
  );
}