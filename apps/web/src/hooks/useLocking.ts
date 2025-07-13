import { useAuth } from '@/contexts/auth-context';
import { useCallback, useEffect, useState } from 'react';
import { browserLogger } from '@/lib/browser-logger';

// Extended user type for itellico Mono
interface ExtendedUser {
  id: string;
  tenantId?: number;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface LockInfo {
  id: string;
  entityType: string;
  entityId: string;
  lockedBy: number;
  lockedAt: string;
  expiresAt: string;
  reason?: string;
  isActive: boolean;
  isOwnedByCurrentUser: boolean;
}

export interface UseLockingOptions {
  entityType: string;
  entityId: string;
  tenantId?: number;
  autoAcquire?: boolean;
  ttlMinutes?: number;
  reason?: string;
  onLockAcquired?: (lockInfo: LockInfo) => void;
  onLockReleased?: () => void;
  onLockFailed?: (error: string) => void;
}

export interface LockStatus {
  isLocked: boolean;
  lockInfo: LockInfo | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for managing entity locking to prevent concurrent editing
 * 
 * @param options - Configuration for entity locking
 * @returns Object with lock status and control functions
 * 
 * @example
 * ```tsx
 * const { lockStatus, acquireLock, releaseLock } = useLocking({
 *   entityType: 'user',
 *   entityId: user.id,
 *   autoAcquire: true,
 *   ttlMinutes: 30,
 *   reason: 'Editing user profile'
 * });
 * 
 * if (lockStatus.isLocked && !lockStatus.lockInfo?.isOwnedByCurrentUser) {
 *   return <div>This record is being edited by another user</div>;
 * }
 * ```
 * 
 * @component
 */
export const useLocking = (options: UseLockingOptions) => {
  const { user } = useAuth();
  const [lockStatus, setLockStatus] = useState<LockStatus>({
    isLocked: false,
    lockInfo: null,
    isLoading: false,
    error: null
  });

  const { entityType, entityId, tenantId, autoAcquire = false, ttlMinutes = 30, reason } = options;

  const checkLockStatus = useCallback(async () => {
    const currentUser = user as ExtendedUser;
    if (!currentUser?.id) {
      browserLogger.debug('No user session for locking');
      return;
    }

    setLockStatus(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`/api/v1/locking/status?entityType=${entityType}&entityId=${entityId}&tenantId=${tenantId || currentUser.tenantId}`);

      if (!response.ok) {
        throw new Error(`Failed to check lock status: ${response.statusText}`);
      }

      const data = await response.json();
      const lockInfo = data.lockInfo ? {
        ...data.lockInfo,
        isOwnedByCurrentUser: data.lockInfo.lockedBy === currentUser.id
      } : null;

      setLockStatus({
        isLocked: data.isLocked,
        lockInfo,
        isLoading: false,
        error: null
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLockStatus(prev => ({ ...prev, isLoading: false, error: errorMessage }));
    }
  }, [user, entityType, entityId, tenantId]);

  const acquireLock = useCallback(async (customReason?: string) => {
    const currentUser = user as ExtendedUser;
    if (!currentUser?.id) {
      browserLogger.debug('No user session for locking');
      return false;
    }

    try {
      const response = await fetch('/api/v1/locking/acquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenantId || currentUser.tenantId,
          entityType,
          entityId,
          lockedBy: currentUser.id,
          ttlMinutes,
          reason: customReason || reason
        })
      });

      const data = await response.json();
      if (data.success) {
        await checkLockStatus();
        return true;
      }
      return false;
    } catch (error) {
      browserLogger.debug('Failed to acquire lock', { error });
      return false;
    }
  }, [user, entityType, entityId, tenantId, ttlMinutes, reason, checkLockStatus]);

  const releaseLock = useCallback(async () => {
    const currentUser = user as ExtendedUser;
    if (!currentUser?.id) {
      browserLogger.debug('No user session for locking');
      return false;
    }

    try {
      const response = await fetch('/api/v1/locking/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenantId || currentUser.tenantId,
          entityType,
          entityId,
          userId: currentUser.id
        })
      });

      const data = await response.json();
      if (data.success) {
        await checkLockStatus();
        return true;
      }
      return false;
    } catch (error) {
      browserLogger.debug('Failed to release lock', { error });
      return false;
    }
  }, [user, entityType, entityId, tenantId, checkLockStatus]);

  const forceUnlock = useCallback(async () => {
    const currentUser = user as ExtendedUser;
    if (!currentUser?.id) return false;

    try {
      const response = await fetch('/api/v1/locking/force-release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenantId || currentUser.tenantId,
          entityType,
          entityId
        })
      });

      const data = await response.json();
      if (data.success) {
        await checkLockStatus();
        browserLogger.userAction('Lock force released', `${entityType}:${entityId}`);
        return true;
      }
      return false;
    } catch (error) {
      browserLogger.debug('Failed to force unlock', { error });
      return false;
    }
  }, [user, entityType, entityId, tenantId, checkLockStatus]);

  useEffect(() => {
    const currentUser = user as ExtendedUser;
    if (autoAcquire && currentUser?.id) {
      acquireLock();
    } else if (currentUser?.id) {
      checkLockStatus();
    }
  }, [user, autoAcquire, acquireLock, checkLockStatus]);

  return {
    lockStatus,
    acquireLock,
    releaseLock,
    forceUnlock,
    checkLockStatus
  };
}; 