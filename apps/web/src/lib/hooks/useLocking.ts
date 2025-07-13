'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { browserLogger } from '@/lib/browser-logger';

export interface LockStatus {
  isLocked: boolean;
  lockedBy?: number;
  lockedAt?: Date;
  expiresAt?: Date;
  reason?: string;
  isOwnedByCurrentUser: boolean;
}

/**
 * Hook for managing record locks
 */
export function useLocking(entityType: string, entityId: string) {
  const { user } = useAuth();
  const [lockStatus, setLockStatus] = useState<LockStatus>({
    isLocked: false,
    isOwnedByCurrentUser: false
  });
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Check lock status from server
   */
  const checkLockStatus = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/v1/locks/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityType,
          entityId
        })
      });

      if (response.ok) {
        const lockInfo = await response.json();

        setLockStatus({
          isLocked: lockInfo.isLocked,
          lockedBy: lockInfo.lockedBy,
          lockedAt: lockInfo.lockedAt ? new Date(lockInfo.lockedAt) : undefined,
          expiresAt: lockInfo.expiresAt ? new Date(lockInfo.expiresAt) : undefined,
          reason: lockInfo.reason,
          isOwnedByCurrentUser: lockInfo.lockedBy === user.id
        });

        browserLogger.debug('Lock status updated', {
          entityType,
          entityId,
          lockStatus: lockInfo
        });
      }
    } catch (error) {
      browserLogger.error('Failed to check lock status', {
        error: (error as Error).message,
        entityType,
        entityId
      });
    }
  }, [entityType, entityId, user?.id]);

  /**
   * Acquire lock on the entity
   */
  const acquireLock = useCallback(async (reason?: string, ttlMinutes?: number) => {
    if (!user?.id) {
      browserLogger.warn('Cannot acquire lock: no user');
      return false;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/locks/acquire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityType,
          entityId,
          reason,
          ttlMinutes
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        await checkLockStatus(); // Refresh status
        browserLogger.info('Lock acquired successfully', {
          entityType,
          entityId,
          reason
        });
        return true;
      } else {
        browserLogger.warn('Failed to acquire lock', {
          entityType,
          entityId,
          error: result.error || 'Unknown error'
        });
        return false;
      }
    } catch (error) {
      browserLogger.error('Error acquiring lock', {
        error: (error as Error).message,
        entityType,
        entityId
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId, user?.id, checkLockStatus]);

  /**
   * Release lock on the entity
   */
  const releaseLock = useCallback(async () => {
    if (!user?.id) {
      browserLogger.warn('Cannot release lock: no user');
      return false;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/locks/release', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityType,
          entityId
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        await checkLockStatus(); // Refresh status
        browserLogger.info('Lock released successfully', {
          entityType,
          entityId
        });
        return true;
      } else {
        browserLogger.warn('Failed to release lock', {
          entityType,
          entityId,
          error: result.error || 'Unknown error'
        });
        return false;
      }
    } catch (error) {
      browserLogger.error('Error releasing lock', {
        error: (error as Error).message,
        entityType,
        entityId
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId, user?.id, checkLockStatus]);

  /**
   * Force release lock (admin function)
   */
  const forceReleaseLock = useCallback(async () => {
    if (!user?.id) {
      browserLogger.warn('Cannot force release lock: no user');
      return false;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/locks/force-release', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityType,
          entityId
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        await checkLockStatus(); // Refresh status
        browserLogger.info('Lock force released successfully', {
          entityType,
          entityId
        });
        return true;
      } else {
        browserLogger.warn('Failed to force release lock', {
          entityType,
          entityId,
          error: result.error || 'Unknown error'
        });
        return false;
      }
    } catch (error) {
      browserLogger.error('Error force releasing lock', {
        error: (error as Error).message,
        entityType,
        entityId
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId, user?.id, checkLockStatus]);

  // Check lock status on mount and when dependencies change
  useEffect(() => {
    checkLockStatus();
  }, [checkLockStatus]);

  // Set up periodic lock status polling
  useEffect(() => {
    const interval = setInterval(checkLockStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [checkLockStatus]);

  return {
    lockStatus,
    isLoading,
    acquireLock,
    releaseLock,
    forceReleaseLock,
    checkLockStatus
  };
} 