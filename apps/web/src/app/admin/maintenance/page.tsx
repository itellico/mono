import MaintenancePage from '@/components/maintenance/MaintenancePage';
import { PermissionGate } from '@/components/reusable/PermissionGate';
import { AdminOnly } from '@/components/admin/AdminOnly';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

export default function AdminMaintenancePage() {
  return (
    <AdminOnly requiredRole="super_admin">
      <PermissionGate 
        action="view" 
        resource="analytics" 
        context={{ scope: 'global' }}
        fallback={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="max-w-md w-full mx-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Platform Access Required:</strong> You need platform management permissions to view system maintenance information.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        }
      >
        <MaintenancePage
          title="Queue System Maintenance"
          message="The background processing system is temporarily unavailable."
          systemName="Queue Management & Worker System"
          affectedFeatures={[
            'Queue Management',
            'Background Jobs',
            'Media Processing',
            'Delete Operations',
            'Worker Control'
          ]}
          workingFeatures={[
            'User Management',
            'Media Assets Viewing',
            'Analytics & Reports',
            'System Settings',
            'Profile Management'
          ]}
          retryUrl="/api/admin/queue/stats"
          successRedirectUrl="/admin/queue"
          retryInterval={30}
          showBackButton={true}
          backUrl="/admin"
          estimatedRestoreTime="5-10 minutes"
        />
      </PermissionGate>
    </AdminOnly>
  );
} 