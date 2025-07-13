'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { logger } from '@/lib/browser-logger';

/**
 * 🔐 UNIFIED PERMISSION GATE - UI COMPONENT
 * 
 * P0 Security Requirement: ALL UI components MUST use this for role-based visibility.
 * This component integrates with the unified permission system and TanStack Query
 * for proper client-side caching and state management.
 * 
 * Features:
 * ✅ TanStack Query integration for client-side caching
 * ✅ Unified permission checking (uses canAccessAPI via API)
 * ✅ Multiple display modes (hide, disabled, read-only, upgrade prompt)
 * ✅ Proper loading states and error handling
 * ✅ Comprehensive audit logging
 */

export interface PermissionGateProps {
  /** The action being attempted */
  action: string;
  /** The resource being accessed */
  resource: string;
  /** Resource ID for granular permissions */
  resourceId?: string | number;
  /** Tenant ID for tenant isolation */
  tenantId?: number;
  /** Allow read-only fallback */
  allowReadOnly?: boolean;
  /** What to render when permission is granted */
  children: ReactNode;
  /** What to render when permission is denied (default: nothing) */
  fallback?: ReactNode;
  /** Component to show while loading permissions */
  loading?: ReactNode;
  /** Component to show when permission check fails */
  error?: ReactNode;
  /** Display mode for permission handling */
  mode?: 'hide' | 'disabled' | 'readonly' | 'upgrade';
  /** Optional className for styling */
  className?: string;
  /** Debug mode for development */
  debug?: boolean;
}

/**
 * 🔍 Permission data fetcher using TanStack Query
 */
function usePermissions(
  action: string,
  resource: string,
  options: {
    resourceId?: string | number;
    tenantId?: number;
    allowReadOnly?: boolean;
    enabled?: boolean;
  } = {}
) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['permissions', user?.id, action, resource, options.resourceId, options.tenantId],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('Not authenticated');
      }

      const params = new URLSearchParams({
        action,
        resource,
        ...(options.resourceId && { resourceId: String(options.resourceId) }),
        ...(options.tenantId && { tenantId: String(options.tenantId) }),
        ...(options.allowReadOnly && { allowReadOnly: 'true' })
      });

      const response = await fetch(`/api/v1/auth/permissions/check?${params}`);
      
      if (!response.ok) {
        throw new Error(`Permission check failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      logger.userAction('permission_check', {
        action,
        resource,
        resourceId: options.resourceId,
        tenantId: options.tenantId,
        result: result.data
      });

      return result.data;
    },
    enabled: options.enabled !== false && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error?.message?.includes('Not authenticated')) {
        return false;
      }
      return failureCount < 3;
    }
  });
}

/**
 * ✅ PERMISSION GATE COMPONENT
 */
export function PermissionGate({
  action,
  resource,
  resourceId,
  tenantId,
  allowReadOnly = false,
  children,
  fallback = null,
  loading = null,
  error = null,
  mode = 'hide',
  className,
  debug = false
}: PermissionGateProps) {
  const { user, loading: isLoading } = useAuth();
  const [hasLogged, setHasLogged] = useState(false);

  const {
    data: permissionResult,
    isLoading: isPermissionLoading,
    isError,
    error: queryError
  } = usePermissions(action, resource, {
    resourceId,
    tenantId,
    allowReadOnly,
    enabled: !isLoading
  });

  // Debug logging (only once per mount)
  useEffect(() => {
    if (debug && !hasLogged && permissionResult) {
      logger.userAction('permission_gate_debug', {
        action,
        resource,
        resourceId,
        tenantId,
        permissionResult,
        userId: user?.id
      });
      setHasLogged(true);
    }
  }, [debug, hasLogged, permissionResult, action, resource, resourceId, tenantId, user?.id]);

  // Handle authentication states
  if (isLoading) {
    return loading || <div className="animate-pulse bg-gray-200 h-4 w-16 rounded" />;
  }

  if (!user) {
    logger.userAction('permission_gate_unauthenticated', {
      action,
      resource,
      resourceId,
      tenantId
    });
    return fallback;
  }

  // Handle permission loading
  if (isPermissionLoading) {
    return loading || <div className="animate-pulse bg-gray-200 h-4 w-16 rounded" />;
  }

  // Handle permission errors
  if (isError || !permissionResult) {
    logger.userAction('permission_gate_error', {
      action,
      resource,
      error: queryError?.message || 'Unknown error',
      userId: user?.id
    });
    
    return error || fallback;
  }

  // Handle permission denial
  if (!permissionResult.allowed) {
    logger.userAction('permission_gate_denied', {
      action,
      resource,
      resourceId,
      tenantId,
      reason: permissionResult.reason,
      userId: user?.id
    });

    switch (mode) {
      case 'hide':
        return fallback;
        
      case 'disabled':
        return (
          <div className={`opacity-50 pointer-events-none ${className || ''}`}>
            {children}
          </div>
        );
        
      case 'readonly':
        return (
          <div className={`select-none ${className || ''}`} title="Read-only access">
            {children}
          </div>
        );
        
      case 'upgrade':
        return fallback || (
          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              This feature requires additional permissions. Contact your administrator.
            </p>
          </div>
        );
        
      default:
        return fallback;
    }
  }

  // Permission granted - log success and render children
  logger.userAction('permission_gate_granted', {
    action,
    resource,
    resourceId,
    tenantId,
    isSuperAdminBypass: permissionResult.isSuperAdminBypass,
    isReadOnly: permissionResult.isReadOnly,
    userId: user?.id
  });

  // Handle read-only mode
  if (permissionResult.isReadOnly && mode === 'readonly') {
    return (
      <div className={`select-none ${className || ''}`} title="Read-only access">
        {children}
      </div>
    );
  }

  // Full access granted
  return <div className={className}>{children}</div>;
}

/**
 * ✅ ADMIN GATE - Simplified admin access check
 */
export function AdminGate({
  children,
  fallback = null,
  tenantId,
  mode = 'hide',
  className
}: {
  children: ReactNode;
  fallback?: ReactNode;
  tenantId?: number;
  mode?: 'hide' | 'disabled' | 'readonly' | 'upgrade';
  className?: string;
}) {
  return (
    <PermissionGate
      action="view"
      resource="admin"
      tenantId={tenantId}
      allowReadOnly={true}
      mode={mode}
      className={className}
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  );
}

/**
 * ✅ ROLE GATE - Check for specific roles
 */
export function RoleGate({
  roles,
  children,
  fallback = null,
  mode = 'hide',
  className
}: {
  roles: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
  mode?: 'hide' | 'disabled' | 'readonly' | 'upgrade';
  className?: string;
}) {
  const { user } = useAuth();
  
  const {
    data: permissionResult,
    isLoading: isRoleLoading,
    isError
  } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/v1/auth/user-info');
      
      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      return response.json();
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  if (isRoleLoading) {
    return <div className="animate-pulse bg-gray-200 h-4 w-16 rounded" />;
  }

  if (isError || !permissionResult?.data?.roles) {
    return fallback;
  }

  const userRoles = permissionResult.data.roles.map((r: { name: string }) => r.name);
  const requiredRoles = Array.isArray(roles) ? roles : [roles];
  const hasRole = requiredRoles.some(role => userRoles.includes(role));

  if (!hasRole) {
    switch (mode) {
      case 'hide':
        return fallback;
      case 'disabled':
        return (
          <div className={`opacity-50 pointer-events-none ${className || ''}`}>
            {children}
          </div>
        );
      case 'readonly':
        return (
          <div className={`select-none ${className || ''}`}>
            {children}
          </div>
        );
      case 'upgrade':
        return fallback || (
          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              This feature requires specific role permissions.
            </p>
          </div>
        );
      default:
        return fallback;
    }
  }

  return <div className={className}>{children}</div>;
} 