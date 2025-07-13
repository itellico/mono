'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAllPermissions, useAllRoles } from '@/hooks/usePermissions';
import { Badge } from '@/components/ui/badge';

/**
 * Permission Analytics Dashboard
 * Shows overview of permission system health and usage
 */
export function PermissionAnalytics() {
  const { data: permissions, isLoading: permissionsLoading } = useAllPermissions();
  const { data: roles, isLoading: rolesLoading } = useAllRoles();

  if (permissionsLoading || rolesLoading) {
    return <div>Loading permission analytics...</div>;
  }

  const permissionsByModule = permissions?.reduce((acc: Record<string, number>, perm: any) => {
    const module = perm.module || 'unknown';
    acc[module] = (acc[module] || 0) + 1;
    return acc;
  }, {}) || {};

  const rolesByTier = roles?.reduce((acc: Record<string, number>, role: any) => {
    const tier = role.tier || 'unknown';
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {}) || {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Permission Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Permissions:</span>
              <Badge variant="secondary">{permissions?.length || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Total Roles:</span>
              <Badge variant="secondary">{roles?.length || 0}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions by Module */}
      <Card>
        <CardHeader>
          <CardTitle>Permissions by Module</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(permissionsByModule).map(([module, count]) => (
              <div key={module} className="flex justify-between">
                <span className="capitalize">{module}:</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Roles by Tier */}
      <Card>
        <CardHeader>
          <CardTitle>Roles by Tier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(rolesByTier).map(([tier, count]) => (
              <div key={tier} className="flex justify-between">
                <span className="capitalize">{tier}:</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}