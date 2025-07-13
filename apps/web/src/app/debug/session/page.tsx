'use client';

import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

/**
 * Debug Session Page
 * 
 * Displays the complete session object to debug what's being loaded
 * from the NextAuth session callback.
 */
export default function DebugSessionPage() {
  const { user, loading, refreshUser } = useAuth();

  const handleRefreshSession = async () => {
    await refreshUser();
  };

  const { logout } = useAuth();

  const handleSignOut = async () => {
    await logout();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Session Debug</h1>
        <div className="flex gap-2">
          <Button onClick={handleRefreshSession} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Session
          </Button>
          <Button onClick={handleSignOut} variant="destructive">
            Sign Out
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Session Status */}
        <Card>
          <CardHeader>
            <CardTitle>Session Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <Badge variant={user ? 'default' : 'secondary'}>
                  {loading ? 'loading' : user ? 'authenticated' : 'unauthenticated'}
                </Badge>
              </div>
              {user?.email && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Email:</span>
                  <span>{user.email}</span>
                </div>
              )}
              {user?.id && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">User ID:</span>
                  <span>{user.id}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

                 {/* Enhanced Role */}
        <Card>
          <CardHeader>
            <CardTitle>Enhanced Role</CardTitle>
          </CardHeader>
          <CardContent>
            {user && user.roles && user.roles.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Roles:</span>
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((role: string, index: number) => (
                      <Badge key={index}>{role}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">User ID:</span>
                  <span>{user.id}</span>
                </div>
                {(user as any).tenantId && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Tenant ID:</span>
                    <span>{(user as any).tenantId}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500 italic">No roles found</div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Permissions */}
        <Card>
          <CardHeader>
            <CardTitle>Enhanced Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            {user && user.permissions && user.permissions.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-4">
                  <span className="font-medium">Count:</span>
                  <Badge>{user.permissions.length}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {user.permissions.map((permission: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-gray-500 italic">No permissions found</div>
            )}
          </CardContent>
        </Card>

        {/* Raw User Object */}
        <Card>
          <CardHeader>
            <CardTitle>Raw User Object</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
              {user ? JSON.stringify(user, null, 2) : 'No user'}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 