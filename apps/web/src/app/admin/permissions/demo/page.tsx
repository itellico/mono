import React from 'react';
import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield,
  Users,
  GitBranch,
  UserPlus,
  Activity,
  Lock,
  Eye,
  Crown
} from 'lucide-react';
import { HierarchicalPermissionManager } from '@/components/admin/permissions/HierarchicalPermissionManager';
import { PermissionInheritanceViewer } from '@/components/admin/permissions/PermissionInheritanceViewer';
import { InvitationManager } from '@/components/admin/permissions/InvitationManager';

export const metadata: Metadata = {
  title: 'Permission Management Demo - itellico Mono',
  description: 'Comprehensive showcase of permission management components',
};

/**
 * Permission Management Demo Page
 * 
 * Comprehensive showcase of all permission-related components
 * including hierarchical management, inheritance visualization, and invitations.
 */

export default function PermissionDemoPage() {
  
  // Mock handlers
  const handlePermissionChange = (change: any) => {
    console.log('Permission change:', change);
  };

  const handleRoleSelect = (roleId: string) => {
    console.log('Role selected:', roleId);
  };

  const handleInvitationSent = (invitation: any) => {
    console.log('Invitation sent:', invitation);
  };

  const handleInvitationUpdated = (invitation: any) => {
    console.log('Invitation updated:', invitation);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Permission Management Demo</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive showcase of permission management components for the itellico Mono
          </p>
        </div>
        <Badge variant="outline" className="bg-purple-50 text-purple-700">
          Phase 3.2 Demo
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Roles</CardTitle>
            <Shield className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-gray-600">Hierarchical levels</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Permissions</CardTitle>
            <Lock className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">112</div>
            <p className="text-xs text-gray-600">Across all categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invitations</CardTitle>
            <UserPlus className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-gray-600">Awaiting acceptance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-gray-600">Across all tenants</p>
          </CardContent>
        </Card>
      </div>

      {/* Component Showcase */}
      <Tabs defaultValue="hierarchy" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hierarchy">Permission Hierarchy</TabsTrigger>
          <TabsTrigger value="inheritance">Inheritance Viewer</TabsTrigger>
          <TabsTrigger value="invitations">Invitation Manager</TabsTrigger>
        </TabsList>

        {/* Hierarchical Permission Manager Tab */}
        <TabsContent value="hierarchy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>HierarchicalPermissionManager Component</span>
              </CardTitle>
              <CardDescription>
                Visual hierarchy management for permissions with inheritance,
                role-based filtering, and bulk operations. Provides comprehensive
                permission management with real-time validation and user-friendly interfaces.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HierarchicalPermissionManager
                tenantId="demo-tenant-123"
                onPermissionChange={handlePermissionChange}
                currentUserRole="tenant_admin"
                showSystemPermissions={true}
              />
            </CardContent>
          </Card>

          {/* Read-only Example */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Read-Only Permission View</span>
              </CardTitle>
              <CardDescription>
                Example of the permission manager in read-only mode for users
                with limited access or for audit purposes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HierarchicalPermissionManager
                tenantId="demo-tenant-123"
                onPermissionChange={handlePermissionChange}
                currentUserRole="content_moderator"
                showSystemPermissions={false}
                readOnly={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permission Inheritance Viewer Tab */}
        <TabsContent value="inheritance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GitBranch className="h-5 w-5" />
                <span>PermissionInheritanceViewer Component</span>
              </CardTitle>
              <CardDescription>
                Visualizes permission inheritance chains and role hierarchies
                with detailed inheritance paths and conflict resolution.
                Shows how permissions flow from higher to lower level roles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermissionInheritanceViewer
                selectedRole="tenant_admin"
                onRoleSelect={handleRoleSelect}
                showInheritancePaths={true}
              />
            </CardContent>
          </Card>

          {/* Compact Inheritance View */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Compact Inheritance View</span>
              </CardTitle>
              <CardDescription>
                Condensed version suitable for dashboards and sidebar widgets.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermissionInheritanceViewer
                selectedRole="account_owner"
                onRoleSelect={handleRoleSelect}
                showInheritancePaths={false}
                compact={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invitation Manager Tab */}
        <TabsContent value="invitations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5" />
                <span>InvitationManager Component</span>
              </CardTitle>
              <CardDescription>
                Comprehensive cross-tenant invitation management with role assignment,
                status tracking, and bulk operations. Handles the complete invitation
                lifecycle from creation to acceptance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InvitationManager
                tenantId="demo-tenant-123"
                currentUserRole="tenant_admin"
                onInvitationSent={handleInvitationSent}
                onInvitationUpdated={handleInvitationUpdated}
                showCrossTenant={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Feature Summary */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Phase 3.2 Feature Summary</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold mb-2">🏗️ Hierarchical Management</h4>
              <ul className="text-sm space-y-1">
                <li>• Visual permission hierarchy</li>
                <li>• Role-based filtering</li>
                <li>• Bulk operations support</li>
                <li>• Real-time validation</li>
                <li>• Category organization</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">🔗 Inheritance Visualization</h4>
              <ul className="text-sm space-y-1">
                <li>• Interactive role tree</li>
                <li>• Permission flow tracking</li>
                <li>• Inheritance path display</li>
                <li>• Conflict resolution</li>
                <li>• Effective permissions view</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">📨 Invitation Management</h4>
              <ul className="text-sm space-y-1">
                <li>• Cross-tenant invitations</li>
                <li>• Role assignment workflow</li>
                <li>• Status tracking system</li>
                <li>• Bulk invitation support</li>
                <li>• Link sharing & resending</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-blue-200 pt-4 mt-4">
            <p className="text-sm">
              <strong>Architecture:</strong> All components follow itellico Mono patterns with proper TypeScript interfaces, 
              browser logging integration, and responsive design. They integrate seamlessly with the unified permission system 
              and subscription management features.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Technical Implementation Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Implementation</CardTitle>
          <CardDescription>
            Key technical aspects and integration patterns for permission management components
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2 flex items-center">
                <Crown className="h-4 w-4 mr-2 text-purple-600" />
                Component Features
              </h4>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>✅ TypeScript strict mode compliance</li>
                <li>✅ Comprehensive JSDoc documentation</li>
                <li>✅ Browser logging for all user actions</li>
                <li>✅ Responsive design with mobile support</li>
                <li>✅ Accessibility features (ARIA labels)</li>
                <li>✅ Error boundaries and loading states</li>
                <li>✅ Optimistic UI updates</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 flex items-center">
                <Shield className="h-4 w-4 mr-2 text-blue-600" />
                Security & Permissions
              </h4>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>✅ Role-based access control</li>
                <li>✅ Tenant isolation enforcement</li>
                <li>✅ Permission validation on all actions</li>
                <li>✅ Audit trail integration</li>
                <li>✅ Secure invitation token generation</li>
                <li>✅ Cross-tenant permission verification</li>
                <li>✅ Read-only mode for restricted users</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 