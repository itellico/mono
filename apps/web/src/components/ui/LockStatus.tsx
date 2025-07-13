'use client';

import { AlertTriangle, Lock, LockOpen, Clock, User, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslations } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import type { LockInfo } from '@/hooks/useLocking';

export interface LockStatusProps {
  /** Current lock information */
  lockInfo: LockInfo | null;
  /** Whether the entity is currently locked */
  isLocked: boolean;
  /** Whether the lock check is in progress */
  isLoading?: boolean;
  /** Error message if lock check failed */
  error?: string | null;
  /** Whether the current user can force unlock (admin) */
  canForceUnlock?: boolean;
  /** Whether to show detailed lock information */
  showDetails?: boolean;
  /** Callback when force unlock is requested */
  onForceUnlock?: () => void;
  /** Callback when lock refresh is requested */
  onRefreshLock?: () => void;
  /** Custom className for styling */
  className?: string;
}

/**
 * Component for displaying entity lock status and controls
 * 
 * @param props - Lock status component props
 * @returns JSX element showing lock status
 * 
 * @example
 * ```tsx
 * const { lockStatus } = useLocking({
 *   entityType: 'user',
 *   entityId: user.id
 * });
 * 
 * <LockStatus
 *   isLocked={lockStatus.isLocked}
 *   lockInfo={lockStatus.lockInfo}
 *   canForceUnlock={hasAdminRole}
 *   onForceUnlock={forceUnlock}
 *   showDetails={true}
 * />
 * ```
 * 
 * @component
 */
export const LockStatus = ({
  lockInfo,
  isLocked,
  isLoading = false,
  error = null,
  canForceUnlock = false,
  showDetails = true,
  onForceUnlock,
  onRefreshLock,
  className = ''
}: LockStatusProps) => {
  const t = useTranslations('common.locking');

  // Error state
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{t('error')}: {error}</span>
          {onRefreshLock && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefreshLock}
              disabled={isLoading}
            >
              {t('retry')}
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Alert className={className}>
        <Clock className="h-4 w-4 animate-spin" />
        <AlertDescription>
          {t('checking_lock_status')}
        </AlertDescription>
      </Alert>
    );
  }

  // Not locked state
  if (!isLocked || !lockInfo) {
    return (
      <Alert variant="default" className={`border-green-200 bg-green-50 ${className}`}>
        <LockOpen className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          {t('available_for_editing')}
        </AlertDescription>
      </Alert>
    );
  }

  // Locked by current user
  if (lockInfo.isOwnedByCurrentUser) {
    const expiresAt = new Date(lockInfo.expiresAt);
    const timeUntilExpiry = formatDistanceToNow(expiresAt, { addSuffix: true });

    return (
      <Alert variant="default" className={`border-blue-200 bg-blue-50 ${className}`}>
        <Lock className="h-4 w-4 text-blue-600" />
        <AlertDescription className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">
              {t('locked_by_you')}
            </span>
            <Badge variant="secondary" className="text-xs">
              {t('expires')} {timeUntilExpiry}
            </Badge>
          </div>
          
          {showDetails && lockInfo.reason && (
            <div className="text-sm text-blue-700">
              <strong>{t('reason')}:</strong> {lockInfo.reason}
            </div>
          )}
          
          {showDetails && (
            <div className="text-xs text-blue-600">
              {t('locked_at')}: {new Date(lockInfo.lockedAt).toLocaleString()}
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Locked by another user
  const lockedAt = new Date(lockInfo.lockedAt);
  const lockDuration = formatDistanceToNow(lockedAt, { addSuffix: false });
  const expiresAt = lockInfo.expiresAt ? new Date(lockInfo.expiresAt) : null;
  const timeUntilExpiry = expiresAt ? formatDistanceToNow(expiresAt, { addSuffix: true }) : null;

  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-medium">
            {t('locked_by_another_user')}
          </span>
          {timeUntilExpiry && (
            <Badge variant="destructive" className="text-xs">
              {t('expires')} {timeUntilExpiry}
            </Badge>
          )}
        </div>

        {showDetails && (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-3 w-3" />
              <span>{t('locked_by_user_id')}: {lockInfo.lockedBy}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>{t('locked_for')}: {lockDuration}</span>
            </div>
            
            {lockInfo.reason && (
              <div>
                <strong>{t('reason')}:</strong> {lockInfo.reason}
              </div>
            )}
            
            <div className="text-xs opacity-75">
              {t('locked_at')}: {lockedAt.toLocaleString()}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          {onRefreshLock && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefreshLock}
              disabled={isLoading}
            >
              {t('refresh')}
            </Button>
          )}
          
          {canForceUnlock && onForceUnlock && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={onForceUnlock}
                    disabled={isLoading}
                  >
                    {t('force_unlock')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('force_unlock_warning')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}; 