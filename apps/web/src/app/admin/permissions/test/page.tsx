import React from 'react';
import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { permissionsService } from '@/lib/services/permissions.service';
import { testSuperAdminAccess } from '@/lib/permissions/page-guards';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  EnhancedPermissionGate,
  ReadOnlyPermissionGate,
  DisabledPermissionGate,
  ConditionalPermissionGate 
} from '@/components/auth/EnhancedPermissionGate';
import { 
  Shield, 
  Crown, 
  Users, 
  Building2, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Info,
  Eye,
  Lock
} from 'lucide-react';

/**
 * Permission System Test Page
 * 
 * Comprehensive demonstration and verification of the enhanced permission system:
 * - Super admin universal access verification
 * - Role hierarchy demonstration
 * - Component-level permission states
 * - Page-level guard functionality
 * 
 * This page proves that super admin has access to everything while other roles
 * are properly restricted based on their specific permissions.
 */

interface PermissionTestResult {
  permission: string;
  hasAccess: boolean;
  description: string;
  category: 'system' | 'tenant' | 'user' | 'content' | 'billing';
}

interface RoleTestData {
  roleName: string;
  hasRole: boolean;
  description: string;
  expectedCapabilities: string[];
}

async function getUserPermissionData() {
  const session = await auth();
  if (!session?.user) return null;

  const userWithId = session.user as { id?: string; email?: string };
  const userId = userWithId.id || userWithId.email;
  if (!userId) return null;

  // Get comprehensive permission data
  const [
    userPermissions,
    isSuperAdmin,
    isTenantAdmin,
    isContentModerator,
    canAccessAdmin,
    superAdminTestResults
  ] = await Promise.all([
    permissionsService.getUserPermissions(String(userId)),
    permissionsService.hasRole(String(userId), 'super_admin'),
    permissionsService.hasRole(String(userId), 'tenant_admin'),
    permissionsService.hasRole(String(userId), 'content_moderator'),
    permissionsService.canAccessAdmin(String(userId)),
    testSuperAdminAccess()
  ]);

  // Test specific permissions
  const permissionTests: PermissionTestResult[] = await Promise.all([
    // System permissions
    { permission: 'system.configure', description: 'Configure system settings', category: 'system' as const },
    { permission: 'admin.full_access', description: 'Full admin panel access', category: 'system' as const },
    { permission: 'audit.read', description: 'Read audit logs', category: 'system' as const },
    
    // Tenant permissions
    { permission: 'tenant.read', description: 'View tenant information', category: 'tenant' as const },
    { permission: 'tenant.update', description: 'Edit tenant settings', category: 'tenant' as const },
    { permission: 'tenant.delete', description: 'Delete tenants', category: 'tenant' as const },
    { permission: 'tenant.manage', description: 'Manage tenant operations', category: 'tenant' as const },
    
    // User permissions
    { permission: 'users.read', description: 'View user profiles', category: 'user' as const },
    { permission: 'users.manage', description: 'Manage user accounts', category: 'user' as const },
    { permission: 'users.impersonate', description: 'Impersonate users', category: 'user' as const },
    
    // Content permissions
    { permission: 'content.manage', description: 'Manage content', category: 'content' as const },
    { permission: 'models.approve', description: 'Approve model submissions', category: 'content' as const },
    
    // Billing permissions
    { permission: 'billing.read', description: 'View billing information', category: 'billing' as const },
    { permission: 'billing.manage', description: 'Manage billing and subscriptions', category: 'billing' as const }
  ].map(async (test) => ({
    ...test,
    hasAccess: await permissionsService.hasPermission(String(userId), test.permission)
  })));

  const roleTests: RoleTestData[] = [
    {
      roleName: 'super_admin',
      hasRole: isSuperAdmin,
      description: 'Unlimited access to all system functions',
      expectedCapabilities: ['All permissions', 'Cross-tenant access', 'System configuration']
    },
    {
      roleName: 'tenant_admin',
      hasRole: isTenantAdmin,
      description: 'Administrative access within tenant scope',
      expectedCapabilities: ['Tenant management', 'User management', 'Content oversight']
    },
    {
      roleName: 'content_moderator',
      hasRole: isContentModerator,
      description: 'Content review and moderation capabilities',
      expectedCapabilities: ['Content approval', 'User content review', 'Moderation tools']
    }
  ];

  return {
    userPermissions,
    permissionTests,
    roleTests,
    canAccessAdmin,
    superAdminTestResults,
    session,
    userId
  };
}

function PermissionTestCard({ test }: { test: PermissionTestResult }) {
  const categoryColors = {
    system: 'bg-purple-100 text-purple-800 border-purple-200',
    tenant: 'bg-blue-100 text-blue-800 border-blue-200',
    user: 'bg-green-100 text-green-800 border-green-200',
    content: 'bg-orange-100 text-orange-800 border-orange-200',
    billing: 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center space-x-3">
        {test.hasAccess ? (
          <CheckCircle className="w-5 h-5 text-green-600" />
        ) : (
          <XCircle className="w-5 h-5 text-red-600" />
        )}
        <div>
          <p className="font-medium text-sm">{test.permission}</p>
          <p className="text-xs text-muted-foreground">{test.description}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Badge 
          variant="outline" 
          className={`text-xs ${categoryColors[test.category]}`}
        >
          {test.category}
        </Badge>
        <Badge variant={test.hasAccess ? 'default' : 'secondary'}>
          {test.hasAccess ? 'Granted' : 'Denied'}
        </Badge>
      </div>
    </div>
  );
}

function RoleTestCard({ role }: { role: RoleTestData }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            {role.roleName === 'super_admin' && <Crown className="w-5 h-5 text-yellow-600" />}
            {role.roleName === 'tenant_admin' && <Building2 className="w-5 h-5 text-blue-600" />}
            {role.roleName === 'content_moderator' && <Shield className="w-5 h-5 text-green-600" />}
            <span className="capitalize">{role.roleName.replace('_', ' ')}</span>
          </CardTitle>
          <Badge variant={role.hasRole ? 'default' : 'secondary'}>
            {role.hasRole ? 'Active' : 'Not Assigned'}
          </Badge>
        </div>
        <CardDescription>{role.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div>
          <p className="text-sm font-medium mb-2">Expected Capabilities:</p>
          <div className="flex flex-wrap gap-2">
            {role.expectedCapabilities.map((capability, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {capability}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SuperAdminTestResults({ results }: { results: any }) {
  if (!results) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Crown className="w-5 h-5 text-yellow-600" />
          <span>Super Admin Access Test</span>
        </CardTitle>
        <CardDescription>
          Comprehensive test of super admin universal access across all resources
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert className={results.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            {results.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription>
              {results.success 
                ? '✅ Super admin has universal access to all tested resources' 
                : '❌ Super admin access test failed - some resources are not accessible'
              }
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {results.results?.map((result: any, index: number) => (
              <div 
                key={index} 
                className={`flex items-center justify-between p-2 rounded text-sm ${
                  result.hasAccess ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}
              >
                <span className="font-medium">{result.resource}.{result.action}</span>
                <div className="flex items-center space-x-2">
                  {result.isSuperAdmin && (
                    <Badge variant="outline" className="text-xs">Super Admin</Badge>
                  )}
                  {result.hasAccess ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ComponentPermissionDemo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Eye className="w-5 h-5 text-blue-600" />
          <span>Component Permission States Demo</span>
        </CardTitle>
        <CardDescription>
          Demonstration of enhanced permission gate components with different access modes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Standard Permission Gate */}
        <div>
          <h4 className="font-medium mb-2">Standard Permission Gate (Show/Hide)</h4>
          <EnhancedPermissionGate permissions={['tenant.update']} mode="show-hide">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This content is only visible if you have 'tenant.update' permission
              </AlertDescription>
            </Alert>
          </EnhancedPermissionGate>
        </div>

        <Separator />

        {/* Read-Only Permission Gate */}
        <div>
          <h4 className="font-medium mb-2">Read-Only Permission Gate</h4>
          <ReadOnlyPermissionGate 
            permissions={['tenant.delete']} 
            resource="tenant" 
            action="delete"
            showPermissionTooltip={true}
          >
            <Alert className="cursor-pointer">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This would be an editable component, but you only have read-only access
              </AlertDescription>
            </Alert>
          </ReadOnlyPermissionGate>
        </div>

        <Separator />

        {/* Disabled Permission Gate */}
        <div>
          <h4 className="font-medium mb-2">Disabled Permission Gate</h4>
          <DisabledPermissionGate 
            permissions={['system.nuclear']} 
            resource="system" 
            action="nuclear_launch"
            showPermissionTooltip={true}
          >
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>
                This is a high-security action that requires special permissions
              </AlertDescription>
            </Alert>
          </DisabledPermissionGate>
        </div>

        <Separator />

        {/* Conditional Permission Gate */}
        <div>
          <h4 className="font-medium mb-2">Conditional Permission Gate</h4>
          <ConditionalPermissionGate
            permissions={['billing.manage']}
            mode="conditional"
            readOnlyFallback={
              <Alert>
                <Eye className="h-4 w-4" />
                <AlertDescription>
                  You can view billing information but cannot make changes
                </AlertDescription>
              </Alert>
            }
            disabledFallback={
              <Alert className="border-red-200 bg-red-50">
                <Lock className="h-4 w-4 text-red-600" />
                <AlertDescription>
                  Billing management requires additional permissions
                </AlertDescription>
              </Alert>
            }
          >
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                You have full billing management access
              </AlertDescription>
            </Alert>
          </ConditionalPermissionGate>
        </div>
      </CardContent>
    </Card>
  );
}

async function PermissionTestPageContent() {
  const data = await getUserPermissionData();
  
  if (!data) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <XCircle className="h-4 w-4 text-red-600" />
        <AlertDescription>
          Unable to load permission data. Please ensure you are signed in.
        </AlertDescription>
      </Alert>
    );
  }

  const { userPermissions, permissionTests, roleTests, canAccessAdmin, superAdminTestResults } = data;

  return (
    <div className="space-y-6">
      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Current User Context</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium">User ID</p>
              <p className="text-sm text-muted-foreground">{data.userId}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Tenant ID</p>
              <p className="text-sm text-muted-foreground">{userPermissions?.tenantId}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Admin Access</p>
              <Badge variant={canAccessAdmin ? 'default' : 'secondary'}>
                {canAccessAdmin ? 'Granted' : 'Denied'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Tests */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Role Hierarchy Test</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roleTests.map((role, index) => (
            <RoleTestCard key={index} role={role} />
          ))}
        </div>
      </div>

      {/* Super Admin Test Results */}
      <SuperAdminTestResults results={superAdminTestResults} />

      {/* Permission Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Individual Permission Tests</span>
          </CardTitle>
          <CardDescription>
            Test results for specific permissions across different categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {permissionTests.map((test, index) => (
              <PermissionTestCard key={index} test={test} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Component Demo */}
      <ComponentPermissionDemo />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

export default function PermissionTestPage() {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Permission System Test & Verification</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive testing of the enhanced permission system, role hierarchy, and super admin access
          </p>
        </div>
        
        <Suspense fallback={<LoadingSkeleton />}>
          <PermissionTestPageContent />
        </Suspense>
      </div>
    </div>
  );
} 