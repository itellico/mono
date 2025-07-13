'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Unlock, Clock, User, AlertTriangle } from 'lucide-react';
import { useLocking } from '@/lib/hooks/useLocking';

interface LockStatusProps {
  entityType: string;
  entityId: string;
  className?: string;
  showControls?: boolean;
  onLockAcquired?: () => void;
  onLockReleased?: () => void;
}

export function LockStatus({
  entityType,
  entityId,
  className = '',
  showControls = true,
  onLockAcquired,
  onLockReleased
}: LockStatusProps) {
  const {
    lockStatus,
    isLoading,
    acquireLock,
    releaseLock,
    forceReleaseLock
  } = useLocking(entityType, entityId);

  const handleAcquireLock = async () => {
    const success = await acquireLock('Editing record');
    if (success && onLockAcquired) {
      onLockAcquired();
    }
  };

  const handleReleaseLock = async () => {
    const success = await releaseLock();
    if (success && onLockReleased) {
      onLockReleased();
    }
  };

  const handleForceRelease = async () => {
    const success = await forceReleaseLock();
    if (success && onLockReleased) {
      onLockReleased();
    }
  };

  if (!lockStatus.isLocked) {
    return showControls ? (
      <div className={`flex items-center gap-2 ${className}`}>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Unlock className="h-3 w-3" />
          Available
        </Badge>
        <Button
          size="sm"
          variant="outline"
          onClick={handleAcquireLock}
          disabled={isLoading}
          className="h-7"
        >
          {isLoading ? 'Acquiring...' : 'Lock for Editing'}
        </Button>
      </div>
    ) : (
      <Badge variant="secondary" className={`flex items-center gap-1 ${className}`}>
        <Unlock className="h-3 w-3" />
        Available
      </Badge>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Alert className={lockStatus.isOwnedByCurrentUser ? 'border-blue-200 bg-blue-50' : 'border-orange-200 bg-orange-50'}>
        <Lock className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {lockStatus.isOwnedByCurrentUser ? 'Locked by you' : 'Locked by another user'}
            </span>
            {lockStatus.expiresAt && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                Expires in 30 minutes
              </div>
            )}
          </div>

          {showControls && (
            <div className="flex items-center gap-2">
              {lockStatus.isOwnedByCurrentUser ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReleaseLock}
                  disabled={isLoading}
                  className="h-7"
                >
                  {isLoading ? 'Releasing...' : 'Release Lock'}
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleForceRelease}
                  disabled={isLoading}
                  className="h-7"
                >
                  {isLoading ? 'Releasing...' : 'Force Release'}
                </Button>
              )}
            </div>
          )}
        </AlertDescription>
      </Alert>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {lockStatus.lockedBy && (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            User ID: {lockStatus.lockedBy}
          </div>
        )}

        {lockStatus.reason && (
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {lockStatus.reason}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Simplified lock badge for compact display with reduced API calls
 */
export function LockBadge({ 
  entityType, 
  entityId, 
  className = '' 
}: {
  entityType: string;
  entityId: string;
  className?: string;
}) {
  // Simple lock badge without frequent API calls to reduce rate limiting
  // Just show a static badge for now
  return (
    <Badge variant="secondary" className={`flex items-center gap-1 ${className}`}>
      <Unlock className="h-3 w-3" />
      Available
    </Badge>
  );
} 