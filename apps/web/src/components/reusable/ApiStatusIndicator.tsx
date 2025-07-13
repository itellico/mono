'use client';

import React from 'react';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useComponentLogger } from '@/lib/platform/logging';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface ApiEndpoint {
  name: string;
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  expectedResponseTime?: number; // in milliseconds
  critical?: boolean;
}

export interface ApiStatusResult {
  endpoint: ApiEndpoint;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  responseTime: number;
  error?: string;
  lastChecked: Date;
}

interface ApiStatusIndicatorProps {
  endpoints: ApiEndpoint[];
  refreshInterval?: number; // in seconds, 0 to disable auto-refresh
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
  onStatusChange?: (status: ApiStatusResult[]) => void;
}

// ============================================================================
// STATUS CHECKING UTILITIES
// ============================================================================

async function checkEndpointStatus(endpoint: ApiEndpoint): Promise<ApiStatusResult> {
  const startTime = Date.now();

  try {
    const response = await fetch(endpoint.url, {
      method: endpoint.method || 'GET',
      headers: {
        'Content-Type': 'application/json' },
      // Add timeout
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    const responseTime = Date.now() - startTime;
    const expectedTime = endpoint.expectedResponseTime || 1000;

    let status: ApiStatusResult['status'];

    if (response.ok) {
      if (responseTime < expectedTime) {
        status = 'healthy';
      } else if (responseTime < expectedTime * 2) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }
    } else {
      status = 'unhealthy';
    }

    return {
      endpoint,
      status,
      responseTime,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
      lastChecked: new Date()
    };

  } catch (error) {
    return {
      endpoint,
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      lastChecked: new Date()
    };
  }
}

// ============================================================================
// STATUS INDICATOR COMPONENT
// ============================================================================

export function ApiStatusIndicator({
  endpoints,
  refreshInterval = 30,
  showDetails = true,
  compact = false,
  className = '',
  onStatusChange
}: ApiStatusIndicatorProps) {
  const t = useTranslations('admin-common');
  const [results, setResults] = useState<ApiStatusResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const log = useComponentLogger('ApiStatusIndicator');

  // Check all endpoints
  const checkAllEndpoints = async () => {
    setIsLoading(true);

    try {
      const promises = endpoints.map(checkEndpointStatus);
      const newResults = await Promise.all(promises);

      setResults(newResults);
      setLastRefresh(new Date());

      if (onStatusChange) {
        onStatusChange(newResults);
      }
    } catch (error) {
      log.error('Failed to check API endpoints', { error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    // Initial check
    checkAllEndpoints();

    // Set up interval if refresh is enabled
    if (refreshInterval > 0) {
      const interval = setInterval(checkAllEndpoints, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [endpoints, refreshInterval]);

  // Calculate overall status
  const overallStatus = (): 'healthy' | 'degraded' | 'unhealthy' | 'unknown' => {
    if (results.length === 0) return 'unknown';

    const criticalEndpoints = results.filter(r => r.endpoint.critical);
    const hasCriticalIssues = criticalEndpoints.some(r => r.status === 'unhealthy');

    if (hasCriticalIssues) return 'unhealthy';

    const hasAnyUnhealthy = results.some(r => r.status === 'unhealthy');
    const hasAnyDegraded = results.some(r => r.status === 'degraded');

    if (hasAnyUnhealthy) return 'unhealthy';
    if (hasAnyDegraded) return 'degraded';

    return 'healthy';
  };

  // Status colors and icons
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'unhealthy': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4" />;
      case 'unhealthy': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'healthy' ? 'default' : 
                   status === 'degraded' ? 'secondary' : 'destructive';

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {t(`status.${status}`)}
      </Badge>
    );
  };

  // Compact view
  if (compact) {
    const overall = overallStatus();

    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {getStatusBadge(overall)}
        <Button
          variant="ghost"
          size="sm"
          onClick={checkAllEndpoints}
          disabled={isLoading}
          className="h-6 w-6 p-0"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    );
  }

  // Detailed view
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {t('apiStatus.title')}
        </CardTitle>
        <div className="flex items-center gap-2">
          {getStatusBadge(overallStatus())}
          <Button
            variant="ghost"
            size="sm"
            onClick={checkAllEndpoints}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading && results.length === 0 ? (
          <div className="space-y-2">
            {endpoints.map((_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {results.map((result, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-lg border"
              >
                <div className="flex items-center gap-2">
                  <div className={getStatusColor(result.status)}>
                    {getStatusIcon(result.status)}
                  </div>
                  <div>
                    <div className="font-medium text-sm">
                      {result.endpoint.name}
                      {result.endpoint.critical && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Critical
                        </Badge>
                      )}
                    </div>
                    {result.error && (
                      <div className="text-xs text-red-600">
                        {result.error}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right text-xs text-gray-600">
                  <div>{result.responseTime}ms</div>
                  <div>{result.lastChecked.toLocaleTimeString()}</div>
                </div>
              </div>
            ))}

            {lastRefresh && (
              <div className="text-xs text-gray-500 text-center pt-2">
                Last refresh: {lastRefresh.toLocaleTimeString()}
              </div>
            )}
          </div>
        )}

        {showDetails && (
          <div className="mt-4 text-xs text-gray-600">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="font-medium text-green-600">
                  {results.filter(r => r.status === 'healthy').length}
                </div>
                <div>Healthy</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-yellow-600">
                  {results.filter(r => r.status === 'degraded').length}
                </div>
                <div>Degraded</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-red-600">
                  {results.filter(r => r.status === 'unhealthy').length}
                </div>
                <div>Unhealthy</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// PRESET CONFIGURATIONS
// ============================================================================

export const COMMON_API_ENDPOINTS = {
  admin: [
    { name: 'Admin Dashboard', url: '/api/v1/admin/stats', critical: true },
    { name: 'User Management', url: '/api/v1/admin/users', critical: true },
    { name: 'Settings', url: '/api/v1/admin/settings', critical: false },
    { name: 'Queue Status', url: '/api/v1/admin/queue', critical: true },
  ],
  user: [
    { name: 'User Profile', url: '/api/v1/user/profile', critical: true },
    { name: 'Media Upload', url: '/api/v1/media/upload', critical: true, method: 'POST' as const },
    { name: 'Settings', url: '/api/v1/settings', critical: false },
  ],
  public: [
    { name: 'Health Check', url: '/api/v1/public/health', critical: true },
    { name: 'Public API', url: '/api/v1/public', critical: false },
  ]
};

// ============================================================================
// SPECIALIZED COMPONENTS
// ============================================================================

export function AdminApiStatus({ className }: { className?: string }) {
  return (
    <ApiStatusIndicator
      endpoints={COMMON_API_ENDPOINTS.admin}
      refreshInterval={30}
      showDetails={true}
      className={className}
    />
  );
}

export const UserApiStatus = function UserApiStatus({ className }: { className?: string }) {
  return (
    <ApiStatusIndicator
      endpoints={COMMON_API_ENDPOINTS.user}
      refreshInterval={60}
      showDetails={false}
      compact={true}
      className={className}
    />
  );
} 