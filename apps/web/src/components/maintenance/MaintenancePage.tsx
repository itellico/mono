'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, RefreshCw, Clock, ArrowLeft, Settings, Database } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { browserLogger } from '@/lib/browser-logger';

interface MaintenancePageProps {
  title?: string;
  message?: string;
  systemName?: string;
  affectedFeatures?: string[];
  workingFeatures?: string[];
  retryUrl?: string;
  successRedirectUrl?: string;
  retryInterval?: number;
  showBackButton?: boolean;
  backUrl?: string;
  estimatedRestoreTime?: string;
}

export default function MaintenancePage({
  title = 'System Maintenance',
  message = 'This system component is temporarily unavailable for maintenance.',
  systemName = 'Background Processing System',
  affectedFeatures = ['Queue Management', 'Background Jobs', 'Worker Processing'],
  workingFeatures = ['User Management', 'Media Assets', 'Analytics', 'Settings'],
  retryUrl,
  successRedirectUrl,
  retryInterval = 30,
  showBackButton = true,
  backUrl = '/admin',
  estimatedRestoreTime
}: MaintenancePageProps) {
  const router = useRouter();
  const [retryCountdown, setRetryCountdown] = useState(retryInterval);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (retryInterval > 0 && retryUrl) {
      const interval = setInterval(() => {
        setRetryCountdown((prev) => {
          if (prev <= 1) {
            handleRetry();
            return retryInterval;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [retryInterval, retryUrl]);

  const handleRetry = async () => {
    if (retryUrl && !isRetrying) {
      setIsRetrying(true);
      try {
        const response = await fetch(retryUrl);
        if (response.ok && successRedirectUrl) {
          // Systems are back, redirect to success page
          window.location.href = successRedirectUrl;
        }
      } catch (error) {
        browserLogger.error('Retry check failed', { error: error.message });
      } finally {
        setIsRetrying(false);
      }
    }
  };

  const handleBackNavigation = () => {
    router.push(backUrl);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Main Status Card */}
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-orange-100 p-3">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-orange-800">{title}</CardTitle>
            <CardDescription className="text-orange-700">
              {message}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-orange-200 bg-orange-50">
              <Settings className="h-4 w-4" />
              <AlertTitle className="text-orange-800">System Component Affected</AlertTitle>
              <AlertDescription className="text-orange-700">
                <strong>{systemName}</strong> is currently experiencing issues.
                {estimatedRestoreTime && (
                  <>
                    <br />
                    <span className="flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      Estimated restore time: {estimatedRestoreTime}
                    </span>
                  </>
                )}
              </AlertDescription>
            </Alert>

            {/* Affected Features */}
            <div className="space-y-2">
              <h4 className="font-medium text-orange-800 flex items-center gap-2">
                <Database className="h-4 w-4" />
                Temporarily Unavailable Features
              </h4>
              <div className="flex flex-wrap gap-2">
                {affectedFeatures.map((feature) => (
                  <Badge key={feature} variant="secondary" className="bg-orange-100 text-orange-800">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator className="bg-orange-200" />

            {/* Working Features */}
            <div className="space-y-2">
              <h4 className="font-medium text-green-800 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Available Features (Working Normally)
              </h4>
              <div className="flex flex-wrap gap-2">
                {workingFeatures.map((feature) => (
                  <Badge key={feature} variant="secondary" className="bg-green-100 text-green-800">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {retryUrl && (
                <Button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="flex items-center gap-2"
                  variant="default"
                >
                  <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
                  {isRetrying ? 'Checking...' : `Try Again (${retryCountdown}s)`}
                </Button>
              )}

              {showBackButton && (
                <Button
                  onClick={handleBackNavigation}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Admin Dashboard
                </Button>
              )}
            </div>

            {retryUrl && (
              <p className="text-sm text-muted-foreground text-center mt-3">
                Automatic retry in {retryCountdown} seconds
              </p>
            )}
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">What You Can Do</AlertTitle>
          <AlertDescription className="text-blue-700">
            • Use other admin features that are working normally
            <br />
            • Wait for automatic system recovery
            <br />
            • Contact support if this issue persists for more than 15 minutes
            <br />
            • Your session and data are safe - no need to log out
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
} 