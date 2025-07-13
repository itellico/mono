'use client';

import { AuditSystemDashboard } from '@/components/admin/audit/AuditSystemDashboard';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';
import { useEffect } from 'react';

export default function AuditAdminPage() {
  const { trackPageView } = useAuditTracking();

  useEffect(() => {
    trackPageView('/admin/audit', { section: 'admin' });
  }, [trackPageView]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Audit System</h1>
          <p className="text-muted-foreground mt-1">
            Monitor system activity, manage locks, and review audit trails
          </p>
        </div>
      </div>

      <AuditSystemDashboard />
    </div>
  );
} 