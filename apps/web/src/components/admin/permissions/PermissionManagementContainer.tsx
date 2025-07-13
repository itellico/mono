/**
 * @fileoverview Permission Management Container - Main UI Component
 * 
 * This is the main container that orchestrates the 4-tab permission management interface.
 * Features: Overview, Roles, Permissions, Matrix with emergency access capabilities.
 * 
 * @author itellico Mono Team
 * @version 1.0.0
 */

'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, Users, Key, Grid3X3, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { browserLogger } from '@/lib/browser-logger';

// Import tab components
import { OverviewTab } from './tabs/OverviewTab';
import { RoleManagementTab } from './tabs/RoleManagementTab';
import { PermissionListTab } from './tabs/PermissionListTab';
import { PermissionMatrixTab } from './tabs/PermissionMatrixTab';
import { EmergencyAccessCard } from './EmergencyAccessCard';

interface PermissionManagementContainerProps {
  userId: number;
  userEmail: string;
  tenantId: number | null;
  isSuperAdmin: boolean;
}

/**
 * Main Permission Management Container
 * 
 * @component
 * @param {PermissionManagementContainerProps} props - Container props
 * @example
 * ```tsx
 * <PermissionManagementContainer 
 *   userId={1}
 *   userEmail="admin@example.com"
 *   tenantId={null}
 *   isSuperAdmin={true}
 * />
 * ```
 */
export function PermissionManagementContainer({
  userId,
  userEmail,
  tenantId,
  isSuperAdmin
}: PermissionManagementContainerProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // ✅ AUDIT: Log tab navigation
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    browserLogger.userAction('Permission management tab changed', 'PermissionManagementContainer', {
      userId,
      userEmail,
      tenantId,
      tab: value,
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="space-y-6">
      {/* Emergency Access Controls - Super Admin Only */}
      <EmergencyAccessCard
        userId={userId}
        userEmail={userEmail}
        isSuperAdmin={isSuperAdmin}
      />

      {/* Main Tabs Interface */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Roles</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center space-x-2">
            <Key className="h-4 w-4" />
            <span>Permissions</span>
          </TabsTrigger>
          <TabsTrigger value="matrix" className="flex items-center space-x-2">
            <Grid3X3 className="h-4 w-4" />
            <span>Matrix</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <OverviewTab 
            userId={userId}
            userEmail={userEmail}
            tenantId={tenantId}
            isSuperAdmin={isSuperAdmin}
          />
        </TabsContent>

        {/* Roles Tab - Now using actual component */}
        <TabsContent value="roles" className="space-y-6">
          <RoleManagementTab
            userId={userId}
            userEmail={userEmail}
            tenantId={tenantId}
            isSuperAdmin={isSuperAdmin}
          />
        </TabsContent>

        {/* Permissions Tab - Now using actual component */}
        <TabsContent value="permissions" className="space-y-6">
          <PermissionListTab
            userId={userId}
            userEmail={userEmail}
            tenantId={tenantId}
            isSuperAdmin={isSuperAdmin}
          />
        </TabsContent>

        {/* Matrix Tab - Now using actual component */}
        <TabsContent value="matrix" className="space-y-6">
          <PermissionMatrixTab
            userId={userId}
            userEmail={userEmail}
            tenantId={tenantId}
            isSuperAdmin={isSuperAdmin}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 