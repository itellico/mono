'use client';

import { AdminSidebarWrapper } from '@/components/admin/AdminSidebarWrapper';
import { AdminTopBar } from '@/components/admin/AdminTopBar';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { browserLogger } from '@/lib/browser-logger';
import { extractUserContext } from '@/lib/permissions/client-permissions';
import { useTranslations } from 'next-intl';

interface AdminEditLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
  actions?: React.ReactNode;
}

export function AdminEditLayout({ children, title, description }: AdminEditLayoutProps) {
  const { user, isLoading } = useAuth();
  const t = useTranslations('admin');

  useEffect(() => {
    if (user) {
      const userContext = extractUserContext(user);
      browserLogger.debug('AdminEditLayout: User context extracted', userContext);
    }
  }, [user]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <div className="w-64 bg-white shadow-lg">
          <Skeleton className="h-16 w-full" />
          <div className="p-4 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <Skeleton className="h-16 w-full" />
          <div className="flex-1 p-6">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (!user) {
    return (
      <div className="flex h-screen bg-gray-100">
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-96">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Authentication Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                You must be logged in to access this page.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebarWrapper />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminTopBar />
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {title && (
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {description && (
                  <p className="mt-2 text-gray-600">{description}</p>
                )}
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}