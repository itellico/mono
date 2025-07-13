/**
 * RBAC Permission Gate Component
 * 
 * Provides client-side permission checking for UI components
 * Integrates with the RBAC service for consistent permission logic
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserContext, PermissionResult } from '@/lib/services/rbac.service';

// Permission Context
interface PermissionContextType {
  userContext: UserContext | null;
  hasPermission: (permission: string, resource?: string) => Promise<boolean>;
  checkPermission: (permission: string, resource?: string) => PermissionResult | null;
  loading: boolean;
  error: string | null;
}

const PermissionContext = createContext<PermissionContextType | null>(null);

// Permission Provider
interface PermissionProviderProps {
  children: React.ReactNode;
  userContext?: UserContext;
}

export function PermissionProvider({ children, userContext }: PermissionProviderProps) {
  const [permissionCache, setPermissionCache] = useState<Map<string, PermissionResult>>(new Map());
  
  // Fetch user permissions
  const { data: permissions, isLoading, error } = useQuery({
    queryKey: ['userPermissions', userContext?.userId, userContext?.tenantId],
    queryFn: () => fetchUserPermissions(userContext),
    enabled: !!userContext?.userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3
  });

  const hasPermission = async (permission: string, resource?: string): Promise<boolean> => {
    if (!userContext) return false;
    
    const cacheKey = `${permission}:${resource || ''}`;
    const cached = permissionCache.get(cacheKey);
    
    if (cached) {
      return cached.allowed;
    }

    try {
      const result = await checkPermissionAPI(permission, resource);
      setPermissionCache(prev => new Map(prev).set(cacheKey, result));
      return result.allowed;
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  };

  const checkPermission = (permission: string, resource?: string): PermissionResult | null => {
    const cacheKey = `${permission}:${resource || ''}`;
    return permissionCache.get(cacheKey) || null;
  };

  const contextValue: PermissionContextType = {
    userContext: userContext || null,
    hasPermission,
    checkPermission,
    loading: isLoading,
    error: error?.message || null
  };

  return (
    <PermissionContext.Provider value={contextValue}>
      {children}
    </PermissionContext.Provider>
  );
}

// Hook to use permissions
export function usePermissions() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}

// Permission Gate Component
interface PermissionGateProps {
  permission: string;
  resource?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean; // For multiple permissions
  permissions?: string[]; // For multiple permissions
}

export function PermissionGate({ 
  permission, 
  resource, 
  children, 
  fallback = null,
  requireAll = false,
  permissions = []
}: PermissionGateProps) {
  const { hasPermission, userContext, loading } = usePermissions();
  const [allowed, setAllowed] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!userContext) {
        setAllowed(false);
        setChecking(false);
        return;
      }

      try {
        setChecking(true);
        
        if (permissions.length > 0) {
          // Check multiple permissions
          const results = await Promise.all(
            permissions.map(perm => hasPermission(perm, resource))
          );
          
          const hasAccess = requireAll 
            ? results.every(result => result)
            : results.some(result => result);
            
          setAllowed(hasAccess);
        } else {
          // Check single permission
          const result = await hasPermission(permission, resource);
          setAllowed(result);
        }
      } catch (error) {
        console.error('Permission check error:', error);
        setAllowed(false);
      } finally {
        setChecking(false);
      }
    };

    checkPermissions();
  }, [permission, resource, permissions, requireAll, hasPermission, userContext]);

  if (loading || checking) {
    return <div className="animate-pulse bg-gray-200 h-4 w-16 rounded" />;
  }

  return allowed ? <>{children}</> : <>{fallback}</>;
}

// Specific permission components for common use cases
export function AdminOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGate
      permissions={['admin.access', 'tenant.manage', 'platform.access']}
      requireAll={false}
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  );
}

export function TenantAdminOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGate
      permission="tenant.manage"
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  );
}

export function AccountOwnerOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGate
      permission="account.manage.own"
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  );
}

// Permission-aware button component
interface PermissionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  permission: string;
  resource?: string;
  children: React.ReactNode;
  fallbackText?: string;
  showDisabled?: boolean;
}

export function PermissionButton({ 
  permission, 
  resource, 
  children, 
  fallbackText = 'Access Denied',
  showDisabled = true,
  ...buttonProps 
}: PermissionButtonProps) {
  const { hasPermission } = usePermissions();
  const [allowed, setAllowed] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);

  useEffect(() => {
    const checkAccess = async () => {
      setChecking(true);
      try {
        const result = await hasPermission(permission, resource);
        setAllowed(result);
      } catch (error) {
        setAllowed(false);
      } finally {
        setChecking(false);
      }
    };

    checkAccess();
  }, [permission, resource, hasPermission]);

  if (checking) {
    return (
      <button {...buttonProps} disabled>
        <div className="animate-pulse">Loading...</div>
      </button>
    );
  }

  if (!allowed && !showDisabled) {
    return null;
  }

  return (
    <button 
      {...buttonProps} 
      disabled={!allowed || buttonProps.disabled}
      title={!allowed ? fallbackText : buttonProps.title}
    >
      {allowed ? children : fallbackText}
    </button>
  );
}

// API functions
async function fetchUserPermissions(userContext: UserContext | undefined): Promise<string[]> {
  if (!userContext?.userId) return [];
  
  const response = await fetch('/api/v1/user/permissions');
  if (!response.ok) {
    throw new Error('Failed to fetch permissions');
  }
  
  const data = await response.json();
  return data.data.permissions || [];
}

async function checkPermissionAPI(permission: string, resource?: string): Promise<PermissionResult> {
  const params = new URLSearchParams({ permission });
  if (resource) params.append('resource', resource);
  
  const response = await fetch(`/api/v1/user/check-permission?${params}`);
  if (!response.ok) {
    throw new Error('Permission check failed');
  }
  
  const data = await response.json();
  return data.data;
}