'use client';

/**
 * Super Admin Settings Component
 * 
 * Provides super admin only settings including God Mode toggle
 * for editing system-protected entities
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, Settings, Crown } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useTranslations } from 'next-intl';
import { browserLogger } from '@/lib/browser-logger';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';
import { SuperAdminSettingsTable } from './SuperAdminSettingsTable';

interface SuperAdminSettingsProps {
  className?: string;
}

export function SuperAdminSettings({ className }: SuperAdminSettingsProps) {
  const { user } = useAuth();
  const t = useTranslations('admin-common');
  const { trackClick, trackView } = useAuditTracking();
  
  const [godModeEnabled, setGodModeEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is super admin
  const isSuperAdmin = (user as any)?.role === 'super_admin';

  useEffect(() => {
    if (isSuperAdmin) {
      trackView('super_admin_settings');
      loadGodModeStatus();
    }
  }, [isSuperAdmin]);

  const loadGodModeStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/v1/admin/settings/god-mode');
      
      if (response.ok) {
        const data = await response.json();
        setGodModeEnabled(data.enabled);
      } else {
        browserLogger.error('Failed to load God Mode status', { status: response.status });
      }
    } catch (error) {
      browserLogger.error('Error loading God Mode status:', { error: error instanceof Error ? error.message : String(error) });
      setError('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleGodMode = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/v1/admin/settings/god-mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: !godModeEnabled
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGodModeEnabled(data.enabled);
        
        trackClick('god_mode_toggle', {
          enabled: data.enabled,
          userId: user?.id
        });

        browserLogger.info('God Mode toggled', {
          enabled: data.enabled,
          userId: user?.id
        });
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update God Mode');
        browserLogger.error('Failed to toggle God Mode', { status: response.status });
      }
    } catch (error) {
      browserLogger.error('Error toggling God Mode:', { error: error instanceof Error ? error.message : String(error) });
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if not super admin
  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Legacy God Mode Card - Keep for backwards compatibility */}
      <Card className="border-red-200 bg-red-50/30">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            <CardTitle className="text-red-900">Legacy God Mode Control</CardTitle>
            <Badge variant="destructive" className="text-xs">
              DEPRECATED
            </Badge>
          </div>
          <CardDescription className="text-red-700">
            This is the legacy God Mode control. Please use the new settings table below for all admin settings.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* God Mode Setting */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-amber-600" />
                  <Label 
                    htmlFor="god-mode" 
                    className="text-sm font-medium text-gray-900"
                  >
                    God Mode (Legacy)
                  </Label>
                  {godModeEnabled && (
                    <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 border-amber-300">
                      ACTIVE
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Legacy control for God Mode. Use the settings table below for the new interface.
                </p>
              </div>
              
              <Switch
                id="god-mode"
                checked={godModeEnabled}
                onCheckedChange={toggleGodMode}
                disabled={isLoading}
                className="data-[state=checked]:bg-amber-600"
              />
            </div>

            {godModeEnabled && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>Warning:</strong> God Mode is currently active. 
                  You can now edit system-protected entities. Please use this power responsibly 
                  and disable when not needed.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Additional Super Admin Settings can be added here */}
          <div className="pt-4 border-t border-red-200">
            <p className="text-xs text-red-600">
              All changes to super admin settings are logged and audited. 
              Only super administrators can access and modify these settings.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* New Enhanced Settings Table */}
      <SuperAdminSettingsTable />

      {/* Information Card */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-blue-900">Settings Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-blue-800">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong>God Mode:</strong> Allows editing of system-protected entities. Only available to super administrators.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong>Developer Mode:</strong> Enables debugging features and developer tools. Can be toggled from the top bar.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong>Debug Mode:</strong> Shows detailed error messages and debug information globally.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong>Maintenance Mode:</strong> Puts the platform in maintenance mode for all non-admin users.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 