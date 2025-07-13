'use client';

/**
 * AdminOnly Component
 * Restricts content to admin users only
 */

import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock } from 'lucide-react';

interface AdminOnlyProps {
  children: React.ReactNode;
  requiredRole?: 'super_admin' | 'tenant_admin' | 'content_moderator';
  fallback?: React.ReactNode;
}

export function AdminOnly({ 
  children, 
  requiredRole = 'tenant_admin',
  fallback 
}: AdminOnlyProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return fallback || (
      <Alert className="border-red-200 bg-red-50">
        <Lock className="h-4 w-4" />
        <AlertDescription>
          Authentication required. Please sign in to access this area.
        </AlertDescription>
      </Alert>
    );
  }

  // Check if user has required admin role with proper hierarchy
  const userRoles = user?.roles || [];
  const adminRoles = ['super_admin', 'tenant_admin', 'content_moderator', 'Admin', 'Tenant Admin', 'Super Admin'];
  
  // Check if user has any admin role
  const hasAdminAccess = userRoles.some(role => adminRoles.includes(role));
  
  // Define role hierarchy - higher roles can access lower role content
  const roleHierarchy = {
    'super_admin': ['super_admin', 'tenant_admin', 'content_moderator'],
    'tenant_admin': ['tenant_admin', 'content_moderator'],
    'content_moderator': ['content_moderator']
  };
  
  // Check if user has sufficient role for the requirement
  const hasRequiredRole = userRoles.some(userRole => {
    const allowedRoles = roleHierarchy[userRole as keyof typeof roleHierarchy] || [];
    return allowedRoles.includes(requiredRole);
  });
  
  // Check specific role requirement with hierarchy
  if (requiredRole && !hasRequiredRole) {
    return fallback || (
      <Alert className="border-orange-200 bg-orange-50">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Access denied. {requiredRole} privileges or higher required to view this content.
        </AlertDescription>
      </Alert>
    );
  }

  if (!hasAdminAccess) {
    return fallback || (
      <Alert className="border-orange-200 bg-orange-50">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Access denied. Administrator privileges required to view this content.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
} 