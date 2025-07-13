'use client';

/**
 * Simplified Permission Guard Component
 * 
 * @component PermissionGuard
 * @description Provides basic access control using enhanced roles to avoid infinite loading
 */

import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { 
  extractUserContext,
  hasAdminAccess,
  ENHANCED_ADMIN_ROLES,
  type PermissionCheck,
  type PermissionResult,
  type BasicUserContext
} from '@/lib/permissions/client-permissions';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface PermissionGuardProps {
  /** Required permission to access the content */
  requiredPermission: PermissionCheck;
  /** Children to render when permission is granted */
  children: React.ReactNode;
  /** Fallback component when permission is denied */
  fallback?: React.ReactNode;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  /** Show detailed error information (admin only) */
  showDetails?: boolean;
  /** Custom error handling */
  onPermissionDenied?: (result: PermissionResult) => void;
  /** Custom success handling */
  onPermissionGranted?: (result: PermissionResult) => void;
}

// ============================================================================
// SIMPLE PERMISSION CHECK FUNCTION
// ============================================================================

function checkPermissionSimple(
  userContext: BasicUserContext,
  permissionCheck: PermissionCheck
): PermissionResult {
  if (!userContext.isAuthenticated) {
    return {
      allowed: false,
      reason: 'User not authenticated'
    };
  }

  if (!userContext.roles || userContext.roles.length === 0) {
    return {
      allowed: false,
      reason: 'User has no enhanced roles assigned'
    };
  }

  // Super admin can access everything
  if (userContext.roles.includes('super_admin')) {
    return {
      allowed: true,
      reason: 'Super admin access'
    };
  }

  // Tenant admin can access most things except global scope
  if (userContext.roles.includes('tenant_admin') && permissionCheck.scope !== 'global') {
    return {
      allowed: true,
      reason: 'Tenant admin access'
    };
  }

  // Content moderator can read/view/moderate
  if (userContext.roles.includes('content_moderator') && 
      ['read', 'view', 'moderate'].includes(permissionCheck.action)) {
    return {
      allowed: true,
      reason: 'Content moderator access'
    };
  }

  // Account owner can manage their own content
  if (userContext.roles.includes('account_owner') && 
      ['read', 'view', 'update'].includes(permissionCheck.action) &&
      permissionCheck.scope === 'own') {
    return {
      allowed: true,
      reason: 'Account owner access'
    };
  }

  return {
    allowed: false,
    reason: 'No matching permissions found'
  };
}

// ============================================================================
// DEFAULT COMPONENTS
// ============================================================================

const DefaultFallback: React.FC<{ 
  result: PermissionResult; 
  showDetails: boolean;
  onRetry: () => void;
}> = ({ result, showDetails, onRetry }) => {
  const { t } = useTranslation();

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader className="flex flex-row items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-destructive" />
        <CardTitle className="text-destructive">
          {t('permission.access_denied')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          {t('permission.insufficient_access')}
        </p>

        {showDetails && result.reason && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm"><strong>Details:</strong> {result.reason}</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRetry}>
            {t('common.retry')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.history.back()}>
            {t('common.go_back')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const DefaultLoading: React.FC = () => {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// MAIN PERMISSION GUARD COMPONENT
// ============================================================================

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  requiredPermission,
  children,
  fallback,
  loadingComponent,
  showDetails = false,
  onPermissionDenied,
  onPermissionGranted
}) => {
  const { user, loading } = useAuth();
  const userContext = extractUserContext({ user });

  // Handle session loading
  if (loading) {
    return loadingComponent || <DefaultLoading />;
  }

  // Handle authentication requirement
  if (!user || !userContext.isAuthenticated) {
    const unauthResult: PermissionResult = {
      allowed: false,
      reason: 'User not authenticated'
    };

    if (onPermissionDenied) {
      onPermissionDenied(unauthResult);
    }

    return fallback || <DefaultFallback result={unauthResult} showDetails={showDetails} onRetry={() => window.location.reload()} />;
  }

  // Perform simple permission check
  const result = checkPermissionSimple(userContext, requiredPermission);

  // Handle permission result
  if (result.allowed) {
    if (onPermissionGranted) {
      onPermissionGranted(result);
    }
    return <>{children}</>;
  } else {
    if (onPermissionDenied) {
      onPermissionDenied(result);
    }

    const handleRetry = () => {
      window.location.reload();
    };

    return fallback || <DefaultFallback result={result} showDetails={showDetails} onRetry={handleRetry} />;
  }
};

// ============================================================================
// SPECIALIZED GUARDS
// ============================================================================

/**
 * Admin Guard - Requires admin-level access
 * Uses proper permission checking according to itellico Mono standards
 */
export const AdminGuard: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <DefaultLoading />;
  }
  
  if (!user) {
    return fallback || (
      <DefaultFallback 
        result={{ allowed: false, reason: 'Authentication required' }} 
        showDetails={false} 
        onRetry={() => window.location.reload()} 
      />
    );
  }
  
  // ✅ PROPER PERMISSION CHECK: Use enhanced permission system
  const userContext = extractUserContext({ user });
  
  // Check if user has admin access
  if (!hasAdminAccess(userContext)) {
    return fallback || (
      <DefaultFallback 
        result={{ 
          allowed: false, 
          reason: `Admin access denied. User roles: [${userContext.roles?.join(', ') || 'none'}]. Required roles: [${ENHANCED_ADMIN_ROLES.join(', ')}]` 
        }} 
        showDetails={true} 
        onRetry={() => window.location.reload()} 
      />
    );
  }
  
  return <>{children}</>;
};

export const TenantAdminGuard: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  tenantId?: string;
}> = ({ children, fallback, tenantId }) => (
  <PermissionGuard 
    requiredPermission={{ action: 'manage', resource: 'users', scope: 'tenant', tenantId }}
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

export const ModeratorGuard: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  tenantId?: string;
}> = ({ children, fallback, tenantId }) => (
  <PermissionGuard 
    requiredPermission={{ action: 'moderate', resource: 'profiles', scope: 'tenant', tenantId }}
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
); 