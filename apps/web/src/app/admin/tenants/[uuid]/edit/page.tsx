import React from 'react';
import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { extractUserContext } from '@/lib/permissions/enhanced-unified-permission-system';
import { permissionsService } from '@/lib/services/permissions.service';
import { ensureCacheReady } from '@/lib/cache/cache-init';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Save, 
  Trash2, 
  Eye, 
  Lock, 
  Crown, 
  Settings, 
  Users, 
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

/**
 * Enhanced Tenant Edit Page
 * 
 * Comprehensive example demonstrating the complete enhanced permission system:
 * - Page-level guards with granular access control
 * - Enhanced permission gates with advanced states
 * - Context-aware permission feedback
 * - Interactive upgrade prompts
 * 
 * This showcases how all the implemented permission features work together
 * to create a sophisticated, user-friendly admin interface.
 */

interface TenantEditPageProps {
  params: { uuid: string };
}

// Mock tenant data - in real implementation, would fetch from database
async function getTenantData(uuid: string) {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 100));
  
  if (uuid === 'not-found') {
    return null;
  }
  
  return {
    id: uuid,
    name: 'Acme Corporation',
    domain: 'acme.example.com',
    status: 'active',
    description: 'A leading software company specializing in enterprise solutions.',
    createdAt: new Date('2024-01-15'),
    lastLogin: new Date('2024-01-20'),
    subscriptionTier: 'enterprise',
    userCount: 245,
    isActive: true
  };
}

function TenantFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TenantEditForm({ tenant, accessResult }: { 
  tenant: any; 
  accessResult: any;
}) {
  const isReadOnly = accessResult.reason === 'read_only_access';
  
  const handleSave = () => {
    console.log('Saving tenant changes...');
  };
  
  const handleDelete = () => {
    console.log('Deleting tenant...');
  };
  
  const handleUpgrade = () => {
    console.log('Requesting subscription upgrade...');
  };
  
  return (
    <div className="space-y-6">
      {/* Page Access Status */}
      {isReadOnly && (
        <Alert>
          <Eye className="h-4 w-4" />
          <AlertDescription>
            You have read-only access to this tenant. Contact your administrator to get edit permissions.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Edit Tenant: {tenant.name}</h1>
          <p className="text-muted-foreground mt-1">
            Manage tenant settings and configuration
          </p>
        </div>
        
        {/* Action Buttons with Enhanced Permission Gates */}
        <div className="flex space-x-2">
          {/* Save Button - Read-only mode when user lacks update permissions */}
          <ReadOnlyPermissionGate
            permissions={['tenant.update']}
            resource="tenant"
            action="update"
            showPermissionTooltip={true}
            readOnlyFallback={
              <Button variant="outline" disabled>
                <Eye className="w-4 h-4 mr-2" />
                View Only
              </Button>
            }
          >
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </ReadOnlyPermissionGate>
          
          {/* Delete Button - Disabled mode for high-security action */}
          <DisabledPermissionGate
            permissions={['tenant.delete']}
            resource="tenant"
            action="delete"
            showPermissionTooltip={true}
            onUpgradeRequested={handleUpgrade}
          >
            <Button variant="destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Tenant
            </Button>
          </DisabledPermissionGate>
        </div>
      </div>
      
      <Separator />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Basic Information</span>
            </CardTitle>
            <CardDescription>
              Core tenant settings and identification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tenant Name</Label>
              <Input 
                id="name" 
                defaultValue={tenant.name} 
                disabled={isReadOnly}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Input 
                id="domain" 
                defaultValue={tenant.domain} 
                disabled={isReadOnly}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                defaultValue={tenant.description}
                disabled={isReadOnly}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Status & Analytics Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Status & Analytics</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge variant={tenant.isActive ? 'default' : 'secondary'}>
                {tenant.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">User Count</span>
              <span className="text-sm">{tenant.userCount} users</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Login</span>
              <span className="text-sm">{tenant.lastLogin.toLocaleDateString()}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Created</span>
              <span className="text-sm">{tenant.createdAt.toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Advanced Settings with Conditional Permission Gates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Crown className="h-5 w-5" />
            <span>Advanced Settings</span>
          </CardTitle>
          <CardDescription>
            Premium features and advanced configuration options
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Subscription Management - Conditional display based on permissions */}
          <ConditionalPermissionGate
            permissions={['subscription.manage']}
            resource="tenant"
            action="manage_subscription"
            mode="conditional"
            readOnlyFallback={
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Subscription management requires additional permissions. 
                  Contact your administrator for access.
                </AlertDescription>
              </Alert>
            }
            upgradeFallback={
              <Alert className="border-amber-200 bg-amber-50">
                <Crown className="h-4 w-4 text-amber-600" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Subscription management requires Enterprise plan</span>
                  <Button size="sm" variant="outline" onClick={handleUpgrade}>
                    Upgrade Plan
                  </Button>
                </AlertDescription>
              </Alert>
            }
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Subscription Plan</p>
                    <p className="text-sm text-muted-foreground">
                      Current: {tenant.subscriptionTier}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Manage Billing
                </Button>
              </div>
            </div>
          </ConditionalPermissionGate>
          
          {/* User Management Section */}
          <EnhancedPermissionGate
            permissions={['users.manage.tenant']}
            resource="tenant"
            action="manage_users"
            mode="disabled"
            showPermissionTooltip={true}
            onPermissionDenied={(reason, permissions) => {
              console.log('Permission denied:', reason, permissions);
            }}
          >
            <div className="space-y-4 mt-6">
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">User Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage tenant users and their access levels
                  </p>
                </div>
                <Button variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </Button>
              </div>
            </div>
          </EnhancedPermissionGate>
        </CardContent>
      </Card>
      
      {/* Audit Trail Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EnhancedPermissionGate
            permissions={['audit.read']}
            resource="tenant"
            action="read"
            mode="show-hide"
            debug={true}
          >
            <div className="space-y-2">
              <div className="flex items-center space-x-3 p-2 rounded bg-muted/50">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Settings updated by admin@acme.com</span>
                <span className="text-xs text-muted-foreground ml-auto">2 hours ago</span>
              </div>
              <div className="flex items-center space-x-3 p-2 rounded bg-muted/50">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">New user registered: john.doe@acme.com</span>
                <span className="text-xs text-muted-foreground ml-auto">1 day ago</span>
              </div>
            </div>
          </EnhancedPermissionGate>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function TenantEditPage({ params }: TenantEditPageProps) {
  // ✅ REACT 19: Await params before using
  const resolvedParams = await params;
  
  // Authentication and permission checking
  const session = await auth();
  
  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Extract user context and check super admin role
  const basicUserContext = extractUserContext(session);
  
  if (!basicUserContext.isAuthenticated || !basicUserContext.roles?.includes('super_admin')) {
    redirect('/unauthorized');
  }

  // Load permissions from central permission system
  await ensureCacheReady();
  const userPermissions = await permissionsService.getUserPermissions(basicUserContext.userId!);

  if (!userPermissions) {
    redirect('/unauthorized');
  }

  // Check for tenant update permissions
  const hasUpdatePermission = userPermissions.permissions.includes('admin:tenants:write') || 
                              userPermissions.permissions.includes('admin:tenants:update');
  const hasReadPermission = userPermissions.permissions.includes('admin:tenants:read');
  
  if (!hasUpdatePermission && !hasReadPermission) {
    redirect('/admin/tenants');
  }
  
  // Create access result for compatibility with existing component
  const accessResult = {
    hasAccess: true,
    reason: hasUpdatePermission ? 'has_permission' : 'read_only_access',
    userContext: {
      userId: basicUserContext.userId || '',
      adminRole: basicUserContext.roles?.[0] || 'user',
      tenantId: basicUserContext.tenantId || null,
      permissions: userPermissions.permissions,
    }
  };
  
  // Fetch tenant data
  const tenant = await getTenantData(resolvedParams.uuid);
  
  if (!tenant) {
    notFound();
  }
  
  return (
    <div className="container mx-auto px-6 py-8">
      <Suspense fallback={<TenantFormSkeleton />}>
        <TenantEditForm tenant={tenant} accessResult={accessResult} />
      </Suspense>
    </div>
  );
}

export async function generateMetadata({ params }: TenantEditPageProps): Promise<Metadata> {
  // ✅ REACT 19: Await params before using
  const resolvedParams = await params;
  const tenant = await getTenantData(resolvedParams.uuid);
  
  return {
    title: tenant ? `Edit ${tenant.name} - Mono Admin` : 'Tenant Not Found - Mono Admin',
    description: tenant ? `Manage settings for ${tenant.name}` : 'The requested tenant could not be found.'
  };
} 