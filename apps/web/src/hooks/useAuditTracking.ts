import { useAuth } from '@/contexts/auth-context';
import { useCallback, useRef } from 'react';
import { browserLogger } from '@/lib/browser-logger';

export interface AuditTrackingOptions {
  entityType: string;
  entityId: string;
  component?: string;
  tenantId?: number;
}

export interface TrackActivityParams {
  action: 'click' | 'view' | 'search' | 'form_submission' | 'page_view' | 'filter' | 'sort' | 'field_change';
  metadata?: Record<string, any>;
  debounceMs?: number;
}

/**
 * Hook for tracking user activities and audit events
 * 
 * @param options - Configuration for audit tracking
 * @returns Object with tracking functions
 * 
 * @example
 * ```tsx
 * const { trackActivity, trackFieldChange } = useAuditTracking({
 *   entityType: 'user',
 *   entityId: user.id,
 *   component: 'UserEditForm'
 * });
 * 
 * // Track user interaction
 * trackActivity({ action: 'click', metadata: { button: 'save' } });
 * 
 * // Track field changes
 * trackFieldChange('email', oldEmail, newEmail);
 * ```
 * 
 * @component
 */
export const useAuditTracking = (options: AuditTrackingOptions) => {
  const { user } = useAuth();
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  /**
   * Track a user activity with optional debouncing
   */
  const trackActivity = useCallback(async (params: TrackActivityParams) => {
    if (!user?.id) {
      browserLogger.debug('No user for audit tracking');
      return;
    }

    const { action, metadata = {}, debounceMs = 0 } = params;
    const debounceKey = `${action}-${options.entityId}`;

    // Clear existing debounce timer
    const existingTimer = debounceTimers.current.get(debounceKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const executeTracking = async () => {
      try {
        const auditData = {
          tenantId: options.tenantId || user.tenantId,
          userId: user.id,
          action,
          component: options.component,
          metadata: {
            ...metadata,
            entityType: options.entityType,
            entityId: options.entityId,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href
          }
        };

        // Use fetch with keepalive for performance (fire-and-forget)
        await fetch('/api/v1/audit/track-activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(auditData),
          keepalive: true
        });

        browserLogger.userAction('Audit activity tracked', {
          action,
          entityType: options.entityType,
          entityId: options.entityId
        });

      } catch (error) {
        // Silent failure - don't break user experience
        browserLogger.debug('Failed to track activity', { 
          error: error instanceof Error ? error.message : 'Unknown error',
          action,
          entityType: options.entityType
        });
      } finally {
        debounceTimers.current.delete(debounceKey);
      }
    };

    if (debounceMs > 0) {
      // Set new debounce timer
      const timer = setTimeout(executeTracking, debounceMs);
      debounceTimers.current.set(debounceKey, timer);
    } else {
      // Execute immediately
      await executeTracking();
    }
  }, [user, options]);

  /**
   * Track field changes with automatic diff logging
   */
  const trackFieldChange = useCallback(async (
    fieldName: string,
    oldValue: any,
    newValue: any,
    additionalMetadata?: Record<string, any>
  ) => {
    await trackActivity({
      action: 'field_change',
      metadata: {
        fieldName,
        changes: {
          [fieldName]: {
            from: oldValue,
            to: newValue
          }
        },
        ...additionalMetadata
      },
      debounceMs: 500 // Debounce rapid field changes
    });
  }, [trackActivity]);

  /**
   * Track form submission with validation results
   */
  const trackFormSubmit = useCallback(async (
    formData: Record<string, any>,
    validationErrors?: Record<string, string[]>
  ) => {
    await trackActivity({
      action: 'form_submission',
      metadata: {
        formData: Object.keys(formData), // Only track field names, not values
        hasValidationErrors: !!validationErrors,
        errorCount: validationErrors ? Object.keys(validationErrors).length : 0
      }
    });
  }, [trackActivity]);

  /**
   * Track search operations
   */
  const trackSearch = useCallback(async (
    query: string,
    filters?: Record<string, any>,
    resultCount?: number
  ) => {
    await trackActivity({
      action: 'search',
      metadata: {
        queryLength: query.length,
        hasFilters: !!filters,
        filterCount: filters ? Object.keys(filters).length : 0,
        resultCount
      },
      debounceMs: 300 // Debounce search as user types
    });
  }, [trackActivity]);

  return {
    trackActivity,
    trackFieldChange,
    trackFormSubmit,
    trackSearch
  };
}; 