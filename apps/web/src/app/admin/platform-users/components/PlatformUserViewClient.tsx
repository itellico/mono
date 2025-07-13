'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';
import { browserLogger } from '@/lib/browser-logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { 
  ArrowLeft, 
  Edit, 
  Mail, 
  User, 
  Building2, 
  Calendar, 
  Activity,
  Shield,
  Eye,
  CheckCircle,
  XCircle,
  Crown,
  UserCheck
} from 'lucide-react';
import { type PlatformUser } from '@/hooks/admin/usePlatformUsers';

// ============================================================================
// TYPES
// ============================================================================

interface PlatformUserViewClientProps {
  userData: PlatformUser;
  userContext: {
    userId: string;
    adminRole: string;
    tenantId: string | null;
    permissions: string[];
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PlatformUserViewClient({ 
  userData, 
  userContext 
}: PlatformUserViewClientProps) {
  const router = useRouter();
  const { trackClick } = useAuditTracking();

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleBack = () => {
    router.push('/admin/platform-users');
  };

  const handleEdit = () => {
    trackClick('platform_user_edit_from_view', { 
      userId: userData.uuid,
      userRole: userContext.adminRole 
    });
    router.push(`/admin/platform-users/${userData.uuid}/edit`);
  };

  const handleEmail = () => {
    trackClick('platform_user_email_from_view', { 
      userId: userData.uuid,
      userRole: userContext.adminRole 
    });
    browserLogger.info('Platform user email action from view', { userId: userData.uuid });
    // TODO: Implement email functionality
    alert('Email functionality coming soon');
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'model': return <User className="h-4 w-4" />;
      case 'client': return <Building2 className="h-4 w-4" />;
      case 'agency': return <Building2 className="h-4 w-4" />;
      case 'photographer': return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin': return <Crown className="h-4 w-4" />;
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'moderator': return <UserCheck className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Platform Users
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {userData.firstName} {userData.lastName}
            </h1>
            <p className="text-muted-foreground">
              Platform User Details
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PermissionGate permissions={['platform-users.manage']}>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEmail}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Send Email
            </Button>
          </PermissionGate>
          <PermissionGate permissions={['platform-users.update']}>
            <Button
              onClick={handleEdit}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit User
            </Button>
          </PermissionGate>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main User Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">First Name</label>
                  <p className="text-sm font-medium">{userData.firstName || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                  <p className="text-sm font-medium">{userData.lastName || 'Not provided'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                  <p className="text-sm font-medium">{userData.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">User Type</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="flex items-center gap-1 capitalize">
                      {getUserTypeIcon(userData.userType)}
                      {userData.userType}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">User ID</label>
                  <p className="text-sm font-mono text-muted-foreground">{userData.uuid}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Platform Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Primary Tenant</label>
                  {userData.tenant ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {userData.tenant.name}
                      </Badge>
                      {userData.tenant.domain && (
                        <span className="text-xs text-muted-foreground">({userData.tenant.domain})</span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No tenant assigned</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tenant ID</label>
                  <p className="text-sm font-mono text-muted-foreground">{userData.tenantId}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activity & Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Account Created</label>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(userData.createdAt).toLocaleDateString()} at {new Date(userData.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Login</label>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {userData.lastLoginAt ? (
                      <>
                        {new Date(userData.lastLoginAt).toLocaleDateString()} at {new Date(userData.lastLoginAt).toLocaleTimeString()}
                      </>
                    ) : (
                      'Never'
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Sessions</label>
                  <p className="text-sm font-medium">{userData.stats.sessionCount}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Activity</label>
                  <p className="text-sm font-medium">
                    {userData.stats.lastActivityAt ? (
                      new Date(userData.stats.lastActivityAt).toLocaleDateString()
                    ) : (
                      'No activity recorded'
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Status & Actions */}
        <div className="space-y-6">
          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Account Active</span>
                <Badge variant={userData.isActive ? 'default' : 'secondary'} className="flex items-center gap-1">
                  {userData.isActive ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {userData.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Email Verified</span>
                <Badge variant={userData.isVerified ? 'default' : 'outline'} className="flex items-center gap-1">
                  {userData.isVerified ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {userData.isVerified ? 'Verified' : 'Unverified'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sessions</span>
                <span className="font-medium">{userData.stats.sessionCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Account Age</span>
                <span className="font-medium">
                  {Math.floor((Date.now() - new Date(userData.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">User Type</span>
                <Badge variant="outline" className="text-xs capitalize">
                  {userData.userType}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <PermissionGate permissions={['platform-users.update']}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={handleEdit}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit User Details
                </Button>
              </PermissionGate>
              <PermissionGate permissions={['platform-users.manage']}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={handleEmail}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
              </PermissionGate>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => window.open(`mailto:${userData.email}`, '_blank')}
              >
                <Mail className="h-4 w-4 mr-2" />
                Direct Email
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}