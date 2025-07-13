/**
 * Permission Overview Tab - System Statistics and Health
 * 
 * Displays real-time statistics and health status of the permission system
 * 
 * @version 2.0.0
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Key, 
  Shield, 
  Activity,
  Globe,
  Building,
  User,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { browserLogger } from '@/lib/browser-logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface OverviewTabProps {
  userId: number;
  userEmail: string;
  tenantId: number | null;
  isSuperAdmin: boolean;
}

interface PermissionStats {
  totalRoles: number;
  totalPermissions: number;
  activeUsers: number;
  wildcardPermissions: number;
  scopeBreakdown: {
    global: number;
    tenant: number;
    own: number;
  };
  categoryBreakdown: Record<string, number>;
  systemHealth: {
    permissionValidation: string;
    roleHierarchy: string;
    cachePerformance: string;
    auditLogging: string;
  };
  lastUpdated: string;
}

// ============================================================================
// API SERVICE
// ============================================================================

const fetchPermissionStats = async (): Promise<PermissionStats> => {
  const response = await fetch('/api/v1/admin/permissions/stats', {
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error('Failed to fetch permission statistics');
  }
  const data = await response.json();
  return data.data;
};

// ============================================================================
// OVERVIEW TAB COMPONENT
// ============================================================================

export function OverviewTab({ userId, userEmail, tenantId, isSuperAdmin }: OverviewTabProps) {
  // Fetch statistics
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['permission-stats'],
    queryFn: fetchPermissionStats,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'Healthy':
      case 'Active':
      case 'Optimal':
        return <Badge variant="default" className="bg-green-500">{status}</Badge>;
      case 'Degraded':
        return <Badge variant="destructive" className="bg-yellow-500">{status}</Badge>;
      case 'Failed':
      case 'Inactive':
        return <Badge variant="destructive">{status}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'Healthy':
      case 'Active':
      case 'Optimal':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'Degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'Failed':
      case 'Inactive':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Failed to load permission statistics
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  // Calculate percentages for scope breakdown
  const totalScoped = stats.scopeBreakdown.global + stats.scopeBreakdown.tenant + stats.scopeBreakdown.own;
  const globalPercent = totalScoped > 0 ? (stats.scopeBreakdown.global / totalScoped) * 100 : 0;
  const tenantPercent = totalScoped > 0 ? (stats.scopeBreakdown.tenant / totalScoped) * 100 : 0;
  const ownPercent = totalScoped > 0 ? (stats.scopeBreakdown.own / totalScoped) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRoles}</div>
            <p className="text-xs text-muted-foreground">System & Custom Roles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Permissions</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPermissions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.wildcardPermissions} with wildcards
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">With Role Assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((stats.wildcardPermissions / stats.totalPermissions) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">Wildcard Coverage</p>
          </CardContent>
        </Card>
      </div>

      {/* Scope Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Scope Distribution</CardTitle>
          <CardDescription>
            Breakdown of permissions by access scope
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Global Scope</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{stats.scopeBreakdown.global}</span>
                <span className="text-sm text-muted-foreground">({globalPercent.toFixed(1)}%)</span>
              </div>
            </div>
            <Progress value={globalPercent} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Tenant Scope</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{stats.scopeBreakdown.tenant}</span>
                <span className="text-sm text-muted-foreground">({tenantPercent.toFixed(1)}%)</span>
              </div>
            </div>
            <Progress value={tenantPercent} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Own Scope</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{stats.scopeBreakdown.own}</span>
                <span className="text-sm text-muted-foreground">({ownPercent.toFixed(1)}%)</span>
              </div>
            </div>
            <Progress value={ownPercent} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Permission Categories</CardTitle>
            <CardDescription>
              Distribution across functional areas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.categoryBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm">{category}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>
              Current status of permission system components
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getHealthIcon(stats.systemHealth.permissionValidation)}
                <span className="text-sm">Permission Validation</span>
              </div>
              {getHealthBadge(stats.systemHealth.permissionValidation)}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getHealthIcon(stats.systemHealth.roleHierarchy)}
                <span className="text-sm">Role Hierarchy</span>
              </div>
              {getHealthBadge(stats.systemHealth.roleHierarchy)}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getHealthIcon(stats.systemHealth.cachePerformance)}
                <span className="text-sm">Cache Performance</span>
              </div>
              {getHealthBadge(stats.systemHealth.cachePerformance)}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getHealthIcon(stats.systemHealth.auditLogging)}
                <span className="text-sm">Audit Logging</span>
              </div>
              {getHealthBadge(stats.systemHealth.auditLogging)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Updated */}
      <div className="text-xs text-muted-foreground text-center">
        Last updated: {new Date(stats.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
}