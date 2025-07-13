/**
 * Operational Mode Indicators for Admin Top Bar
 * 
 * Shows real-time status of God Mode and Developer Mode
 * with visual indicators and expiration times
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Code, Clock, AlertTriangle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useOperationalModes } from '@/lib/hooks/useSimpleOperationalModes';
import { useGodModeSelector, useDeveloperModeSelector } from '@/lib/stores/operational-modes.store';
import { cn } from '@/lib/utils';

interface TimeRemainingProps {
  expiresAt: Date;
  onExpired: () => void;
}

function TimeRemaining({ expiresAt, onExpired }: TimeRemainingProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        onExpired();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  return (
    <span className="text-xs opacity-75 ml-1">
      {timeLeft}
    </span>
  );
}

function GodModeIndicator() {
  const { data: modes, refetch } = useOperationalModes();
  const zustandGodMode = useGodModeSelector();

  // Use Zustand state for instant updates, fallback to ReactQuery
  const godMode = zustandGodMode.isActive !== undefined ? zustandGodMode : modes?.godMode;
  const isActive = godMode?.isActive ?? false;
  const hasPermission = godMode?.hasPermission ?? false;
  const expiresAt = godMode?.state?.expiresAt ? new Date(godMode.state.expiresAt) : null;
  const reason = godMode?.state?.reason;

  // Don't render if user doesn't have permission
  if (!hasPermission) {
    return null;
  }

  const handleExpired = () => {
    refetch(); // Refresh the modes when expired
  };

  if (!isActive) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs hover:bg-accent opacity-50"
              disabled
            >
              <Shield className="h-3 w-3 mr-1" />
              God Mode
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>God Mode is inactive</p>
            <p className="text-xs opacity-75">You have permission to enable it</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const isNearExpiry = expiresAt ? (expiresAt.getTime() - Date.now()) < (30 * 60 * 1000) : false; // 30 min warning

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="secondary"
            className={cn(
              "h-7 px-2 text-xs font-medium flex items-center gap-1 animate-pulse bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-600",
              isNearExpiry && "bg-orange-500 hover:bg-orange-600 border-orange-600"
            )}
          >
            <Shield className="h-3 w-3" />
            God Mode
            {expiresAt && (
              <>
                <Clock className="h-3 w-3 ml-1" />
                <TimeRemaining expiresAt={expiresAt} onExpired={handleExpired} />
              </>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm">
          <div className="space-y-1">
            <p className="font-medium flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              God Mode Active
            </p>
            {reason && (
              <p className="text-xs">
                <span className="font-medium">Reason:</span> {reason}
              </p>
            )}
            {expiresAt && (
              <p className="text-xs">
                <span className="font-medium">Expires:</span> {expiresAt.toLocaleString()}
              </p>
            )}
            <p className="text-xs opacity-75 mt-2">
              ⚠️ Full system access enabled. Use with extreme caution.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function DeveloperModeIndicator() {
  const { data: modes } = useOperationalModes();
  const zustandDeveloperMode = useDeveloperModeSelector();

  // Use Zustand state for instant updates, fallback to ReactQuery
  const developerMode = zustandDeveloperMode.isActive !== undefined ? zustandDeveloperMode : modes?.developerMode;
  const isActive = developerMode?.isActive ?? false;
  const hasPermission = developerMode?.hasPermission ?? false;
  const reason = developerMode?.state?.reason;
  const enabledAt = developerMode?.state?.enabledAt ? new Date(developerMode.state.enabledAt) : null;

  // Don't render if user doesn't have permission
  if (!hasPermission) {
    return null;
  }

  if (!isActive) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs hover:bg-accent opacity-50"
              disabled
            >
              <Code className="h-3 w-3 mr-1" />
              Dev Mode
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Developer Mode is inactive</p>
            <p className="text-xs opacity-75">You have permission to enable it</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className="h-7 px-2 text-xs font-medium flex items-center gap-1 bg-white hover:bg-gray-50 text-black border-black dark:bg-white dark:hover:bg-gray-50 dark:text-black dark:border-black"
          >
            <Code className="h-3 w-3" />
            Dev Mode
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm">
          <div className="space-y-1">
            <p className="font-medium flex items-center gap-1">
              <Info className="h-3 w-3" />
              Developer Mode Active
            </p>
            {reason && (
              <p className="text-xs">
                <span className="font-medium">Reason:</span> {reason}
              </p>
            )}
            {enabledAt && (
              <p className="text-xs">
                <span className="font-medium">Enabled:</span> {enabledAt.toLocaleString()}
              </p>
            )}
            <p className="text-xs opacity-75 mt-2">
              🔧 Enhanced development tools and system editing enabled
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Main component for operational mode indicators
 */
export function OperationalModeIndicators() {
  const { data: modes, isLoading, error } = useOperationalModes();

  // Don't render if still loading or error
  if (isLoading || error) {
    return null;
  }

  // Don't render if user has no permissions for either mode
  const hasAnyPermission = modes?.godMode?.hasPermission || modes?.developerMode?.hasPermission;
  if (!hasAnyPermission) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <GodModeIndicator />
      <DeveloperModeIndicator />
    </div>
  );
} 