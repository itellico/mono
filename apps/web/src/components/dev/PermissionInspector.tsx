'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Shield, User, Key, MapPin, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PermissionInspectorProps {
  className?: string;
}

/**
 * Development tool that displays current page permissions and user session info
 * Only shows in development mode
 */
export function PermissionInspector({ className }: PermissionInspectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { user, loading } = useAuth();
  
  // Handle client-side mounting
  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  // Convert auth context to session-like format for compatibility
  const session = user ? {
    user: {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      image: user.profilePhotoUrl,
      tenantId: user.tenantId,
      accountId: user.accountId,
      enhancedPermissions: user.permissions || [],
      enhancedRole: user.userRoles?.[0] ? {
        roleName: user.userRoles[0].role.name,
        scope: user.userRoles[0].role.scope,
        roleTenantId: user.userRoles[0].role.tenantId
      } : null
    },
    expires: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
  } : null;
  
  const status = loading ? 'loading' : user ? 'authenticated' : 'unauthenticated';

  // Only show in development and after mounting
  if (!mounted || process.env.NODE_ENV !== 'development') {
    return null;
  }

  const getPageType = (path: string) => {
    if (path.startsWith('/admin')) return 'Admin';
    if (path.startsWith('/dashboard')) return 'Dashboard';
    if (path.startsWith('/auth')) return 'Auth';
    if (path.startsWith('/api')) return 'API';
    if (path === '/') return 'Public';
    return 'Protected';
  };

  const getPermissionColor = (permission: string) => {
    if (permission.includes('global')) return 'bg-red-100 text-red-800 border-red-200';
    if (permission.includes('tenant')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (permission.includes('manage')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (permission.includes('read')) return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDateTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Detect permission issues
  const hasPermissionIssues = () => {
    // Skip permission checks for auth pages
    if (pathname.startsWith('/auth')) return 'normal';
    
    // Supadmin accessing anything
    if (session?.user?.name?.includes('supadmin')) return 'error';
    
    // Admin access without enhanced permissions
    if (pathname.startsWith('/admin') && !(session as any)?.user?.enhancedPermissions?.length) return 'warning';
    
    // Unauthorized admin access (only check enhanced permissions, no legacy)
    if (pathname.startsWith('/admin') && 
        !(session as any)?.user?.enhancedPermissions?.some((p: string) => p.includes('global'))) {
      return 'error';
    }
    
    return 'normal';
  };

  const issueStatus = hasPermissionIssues();
  const buttonColor = issueStatus === 'error' ? 'text-red-600' : 
                     issueStatus === 'warning' ? 'text-orange-600' : 'text-blue-600';
  const buttonBorder = issueStatus === 'error' ? 'border-red-200 bg-red-50/90' : 
                      issueStatus === 'warning' ? 'border-orange-200 bg-orange-50/90' : 
                      'border-blue-200 bg-white/90';

  return (
    <div className={`fixed bottom-4 right-4 z-[9999] ${className}`}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`h-10 w-10 rounded-full ${buttonBorder} backdrop-blur-sm border-2 shadow-lg hover:shadow-xl transition-all duration-200`}
          >
            <Shield className={`h-4 w-4 ${buttonColor}`} />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-96 p-0 mr-4 mb-2" 
          align="end" 
          side="top"
        >
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-sm">Permission Inspector</h3>
              </div>
              <Badge variant="outline" className="text-xs">
                DEV
              </Badge>
            </div>

            <Separator />

            {/* Current Page Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4 text-gray-500" />
                Current Page
              </div>
              <div className="ml-6 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {getPageType(pathname)}
                  </Badge>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {pathname}
                  </code>
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Loaded: {formatDateTime(new Date())}
                </div>
              </div>
            </div>

            <Separator />

            {/* Session Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4 text-gray-500" />
                Session Status
              </div>
              <div className="ml-6 space-y-2">
                <Badge 
                  variant={status === 'authenticated' ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {status.toUpperCase()}
                </Badge>
                
                {session?.user && (
                  <div className="space-y-1 text-xs">
                    <div><strong>Email:</strong> {session.user.email}</div>
                    <div><strong>Name:</strong> {session.user.name}</div>
                    {session.user.id && (
                      <div><strong>User ID:</strong> {session.user.id}</div>
                    )}
                    {(session as any)?.user?.enhancedRole && (
                      <div><strong>Role:</strong> {(session as any).user.enhancedRole.roleName} 
                        ({(session as any).user.enhancedRole.scope || 'unknown'})
                      </div>
                    )}
                    {(session as any)?.user?.tenantId && (
                      <div><strong>Account Tenant:</strong> {(session as any).user.tenantId}</div>
                    )}
                    {(session as any)?.user?.enhancedRole?.roleTenantId && (
                      <div><strong>Role Tenant:</strong> {(session as any).user.enhancedRole.roleTenantId}</div>
                    )}
                    {session.expires && (
                      <div className="text-gray-500">
                        <strong>Expires:</strong> {formatDateTime(session.expires)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Enhanced Permissions */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Key className="h-4 w-4 text-gray-500" />
                Enhanced Permissions
              </div>
              <div className="ml-6">
                {(session as any)?.user?.enhancedPermissions?.length > 0 ? (
                  <ScrollArea className="h-32">
                    <div className="space-y-1">
                      {(session as any).user.enhancedPermissions.map((permission: string, index: number) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className={`text-xs ${getPermissionColor(permission)}`}
                        >
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500 italic">
                      No enhanced permissions found
                    </div>
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded border">
                      <div className="font-medium">🔍 Session Debug:</div>
                      <div>user.enhancedPermissions: {JSON.stringify((session as any)?.user?.enhancedPermissions)}</div>
                      <div>user.enhancedRole: {JSON.stringify((session as any)?.user?.enhancedRole)}</div>
                      <div>Session user keys: {JSON.stringify(Object.keys(session?.user || {}))}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Permission Analysis */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Shield className="h-4 w-4 text-gray-500" />
                Access Analysis
              </div>
              <div className="ml-6 space-y-2">
                {/* Admin Access Check */}
                {pathname.startsWith('/admin') && (
                  <div className="p-2 bg-orange-50 border border-orange-200 rounded">
                    <div className="text-xs font-medium text-orange-800">⚠️ Admin Area Access</div>
                    <div className="text-xs text-orange-700 mt-1">
                      {session?.user?.email === '1@1.com' || session?.user?.email === 'admin@mono.com' ? (
                        <span className="text-green-700">✅ Authorized super admin</span>
                      ) : (
                        <span className="text-red-700">❌ Potential unauthorized access!</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Enhanced perms: {(session as any)?.user?.enhancedPermissions?.length || 0}
                    </div>
                  </div>
                )}

                {/* Supadmin Detection */}
                {session?.user?.name?.includes('supadmin') && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded">
                    <div className="text-xs font-medium text-red-800">🚨 SUPADMIN DETECTED</div>
                    <div className="text-xs text-red-700">
                      This user should NOT have admin access!
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Check enhanced permission system configuration
                    </div>
                  </div>
                )}

                {/* Permission Mismatch */}
                {pathname.startsWith('/admin') && 
                 !pathname.startsWith('/auth') && 
                 !(session as any)?.user?.enhancedPermissions?.length && (
                  <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="text-xs font-medium text-yellow-800">⚠️ Permission Mismatch</div>
                    <div className="text-xs text-yellow-700">
                      Accessing admin area without enhanced permissions
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      User needs enhanced permissions to access admin area
                    </div>
                  </div>
                )}

                {/* Expected Permissions for Page */}
                <div className="text-xs text-gray-500">
                  <div><strong>Expected for {getPageType(pathname)}:</strong></div>
                  <div className="ml-2">
                    {pathname.startsWith('/admin') && (
                      <span>users.manage.global, settings.manage.global</span>
                    )}
                    {pathname.startsWith('/dashboard') && (
                      <span>Basic authenticated access</span>
                    )}
                    {pathname === '/' && (
                      <span>Public access</span>
                    )}
                  </div>
                </div>
              </div>
            </div>



            {/* Debug Actions */}
            <Separator />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => {
                  console.log('🔍 SESSION DEBUG:', session);
                  console.log('🔍 PATHNAME:', pathname);
                  console.log('🔍 ENHANCED PERMISSIONS:', (session as any)?.user?.enhancedPermissions);
                }}
              >
                Log Session
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => window.open('/debug/permissions', '_blank')}
              >
                Full Debug
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 