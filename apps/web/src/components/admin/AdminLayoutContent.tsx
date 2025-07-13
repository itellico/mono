'use client';

/**
 * Admin Layout Content Component
 * 
 * @component AdminLayoutContent
 * @description Main layout container for admin pages using enhanced RBAC system
 * @param {AdminLayoutContentProps} props - Component properties
 * @example
 * <AdminLayoutContent>
 *   <AdminDashboard />
 * </AdminLayoutContent>
 */

import { AdminSidebarWrapper } from '@/components/admin/AdminSidebarWrapper';
import { AdminTopBar } from '@/components/admin/AdminTopBar';
import { useAuth } from '@/contexts/auth-context';
// Temporarily disabled audit tracking to eliminate excessive API calls
// import { useAuditTracking, usePageTracking } from '@/lib/hooks/useAuditTracking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { browserLogger } from '@/lib/browser-logger';
import { extractUserContext } from '@/lib/permissions/client-permissions';
import { useTranslations } from 'next-intl';

interface AdminLayoutContentProps {
  children: React.ReactNode;
}

export function AdminLayoutContent({ children }: AdminLayoutContentProps) {
  const { user, isLoading } = useAuth();
  // Temporarily disabled audit tracking
  // const { trackActivity } = useAuditTracking();
  
  const t = useTranslations('auth');

  // Temporarily disabled page tracking
  // usePageTracking('admin_layout');

  // Extract user context using client-safe enhanced permission system
  const userContext = extractUserContext({ user });

  // Track admin area access - temporarily disabled
  useEffect(() => {
    if (userContext.isAuthenticated) {
      // Temporarily disabled audit tracking
      // trackActivity({
      //   type: 'navigation',
      //   component: 'admin_layout',
      //   action: 'access',
      //   metadata: {
      //     userRoles: userContext.roles,
      //     tenantId: userContext.tenantId,
      //     fromPath: 'unknown',
      //     toPath: '/admin'
      //   }
      // });

      browserLogger.userAction('admin_area_access', {
        userId: userContext.userId,
        userRoles: userContext.roles,
        tenantId: userContext.tenantId
      });
    }
  }, [userContext.isAuthenticated, userContext.userId, userContext.roles, userContext.tenantId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="w-96 bg-card border-r">
          <div className="p-4 space-y-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="h-16 bg-card border-b">
            <div className="p-4 flex justify-between items-center">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
          <main className="flex-1 overflow-auto p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Error state - using translation keys
  if (!user || !userContext.isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-destructive/50 bg-destructive/5">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">
              {t('auth.authentication_required')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('auth.sign_in_required_admin')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main layout with enhanced permission system
  // Note: AdminSidebarWrapper and AdminTopBar need to be updated to accept userContext props
  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebarWrapper />
      <div className="flex-1 flex flex-col transition-all duration-300 ml-96">
        <AdminTopBar />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 