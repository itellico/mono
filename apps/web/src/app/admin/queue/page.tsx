import { Suspense } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PermissionGate } from '@/components/reusable/PermissionGate';
import { AdminOnly } from '@/components/admin/AdminOnly';
import { 
  ActivityIcon, 
  InfoIcon, 
  Shield, 
  RefreshCw, 
  Pause, 
  Play, 
  Trash2,
  Settings,
  BarChart3
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { QueueMonitoringPanel } from '@/components/admin/queue/QueueMonitoringPanel';

// Temporary placeholder for QueueMonitoringPanel
function QueueMonitoringPlaceholder() {
  return (
    <div className="p-8 text-center text-muted-foreground">
      <ActivityIcon className="h-12 w-12 mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Queue Monitoring System</h3>
      <p className="mb-4">Real-time queue monitoring panel will be available soon.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card>
          <CardHeader>
            <h4 className="font-medium">Pending Jobs</h4>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">--</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h4 className="font-medium">Processing Jobs</h4>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">--</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h4 className="font-medium">Completed Jobs</h4>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">--</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Loading skeleton for queue monitoring
function QueueMonitoringSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Skeleton className="h-8 w-16" />
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function QueueManagementPage() {
  return (
    <AdminOnly requiredRole="super_admin">
      <div className="container max-w-7xl mx-auto py-6 px-4">
        {/* Page Header with Permission-Based Actions */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Queue Management</h1>
            <p className="text-muted-foreground mt-2">
              Monitor and manage background job processing
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <PermissionGate 
              action="view" 
              resource="analytics" 
              context={{ scope: 'global' }}
              showFallback={false}
            >
              <Button variant="outline">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Button>
            </PermissionGate>
            
            <PermissionGate 
              action="manage" 
              resource="queue" 
              context={{ scope: 'global' }}
              showFallback={false}
            >
              <Button variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </PermissionGate>
            
            <PermissionGate 
              action="manage" 
              resource="queue" 
              context={{ scope: 'global' }}
              showFallback={false}
            >
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Configure
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* Important Notice for Platform Management */}
        <Alert className="mb-6">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            <strong>Platform Management:</strong> Queue operations affect all tenants. 
            Use caution when pausing or clearing queues as this impacts background job processing.
          </AlertDescription>
        </Alert>

        {/* Queue Control Actions */}
        <Card className="mb-6">
          <CardHeader>
            <h3 className="text-lg font-semibold">Queue Controls</h3>
            <p className="text-sm text-muted-foreground">
              Manage queue operations and worker processes
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <PermissionGate 
                action="manage" 
                resource="queue" 
                context={{ scope: 'global' }}
                showFallback={false}
              >
                <Button variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
                  <Play className="mr-2 h-4 w-4" />
                  Start Queue
                </Button>
              </PermissionGate>
              
              <PermissionGate 
                action="manage" 
                resource="queue" 
                context={{ scope: 'global' }}
                showFallback={false}
              >
                <Button variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50">
                  <Pause className="mr-2 h-4 w-4" />
                  Pause Queue
                </Button>
              </PermissionGate>
              
              <PermissionGate 
                action="manage" 
                resource="queue" 
                context={{ scope: 'global' }}
                showFallback={false}
              >
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Failed Jobs
                </Button>
              </PermissionGate>
            </div>
          </CardContent>
        </Card>

        {/* Queue Monitoring Panel with Analytics Protection */}
        <PermissionGate 
          action="view" 
          resource="analytics" 
          context={{ scope: 'global' }}
          fallback={
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Platform Analytics Required</h3>
                <p className="text-muted-foreground">
                  You need platform analytics permissions to view detailed queue monitoring data.
                </p>
                <div className="mt-6">
                  <QueueMonitoringPlaceholder />
                </div>
              </CardContent>
            </Card>
          }
        >
          <Suspense fallback={<QueueMonitoringSkeleton />}>
            <QueueMonitoringPanel />
          </Suspense>
        </PermissionGate>
      </div>
    </AdminOnly>
  );
} 