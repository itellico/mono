'use client';

import React, { useCallback } from 'react';
import { browserLogger } from '@/lib/browser-logger';
import { useAuth } from '@/contexts/auth-context';

export interface ActivityEntry {
  action: 'click' | 'view' | 'search' | 'form_submission' | 'page_view' | 'filter' | 'sort';
  component?: string;
  metadata?: Record<string, any>;
}

/**
 * Hook for tracking user activity on the client side
 */
export function useAuditTracking() {
  const { user, isLoading } = useAuth();

  const trackActivity = useCallback(async (entry: ActivityEntry) => {
    // Skip tracking if auth is still loading
    if (isLoading) {
      return;
    }

    // Only warn in development about missing user
    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        browserLogger.warn('Cannot track activity: missing user data');
      }
      return;
    }

    try {
      // Log locally with browserLogger (development only)
      browserLogger.info('User activity tracked', {
        userId: user.id,
        action: entry.action,
        component: entry.component,
        metadata: entry.metadata
      });

      // Send to API endpoint for server-side logging
      const response = await fetch('/api/v1/audit/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: entry.action,
          component: entry.component,
          metadata: entry.metadata
        })
      });

      // Only log errors, not auth failures (which are expected when not logged in)
      if (!response.ok && response.status !== 401) {
        const errorData = await response.json().catch(() => ({}));
        browserLogger.error('Activity tracking failed', {
          status: response.status,
          error: errorData.error || 'Unknown error',
          entry
        });
      }

    } catch (error) {
      browserLogger.error('Failed to track activity', {
        error: (error as Error).message,
        entry
      });
    }
  }, [user, isLoading]);

  const trackClick = useCallback((component: string, metadata?: Record<string, any>) => {
    trackActivity({
      action: 'click',
      component,
      metadata
    });
  }, [trackActivity]);

  const trackView = useCallback((component: string, metadata?: Record<string, any>) => {
    trackActivity({
      action: 'view',
      component,
      metadata
    });
  }, [trackActivity]);

  const trackSearch = useCallback((query: string, component?: string, metadata?: Record<string, any>) => {
    trackActivity({
      action: 'search',
      component,
      metadata: {
        query,
        ...metadata
      }
    });
  }, [trackActivity]);

  const trackFormSubmission = useCallback((formName: string, success: boolean, metadata?: Record<string, any>) => {
    trackActivity({
      action: 'form_submission',
      component: formName,
      metadata: {
        success,
        ...metadata
      }
    });
  }, [trackActivity]);

  const trackPageView = useCallback((page: string, metadata?: Record<string, any>) => {
    trackActivity({
      action: 'page_view',
      component: page,
      metadata
    });
  }, [trackActivity]);

  const trackFilter = useCallback((filterType: string, filterValue: any, component?: string) => {
    trackActivity({
      action: 'filter',
      component,
      metadata: {
        filterType,
        filterValue
      }
    });
  }, [trackActivity]);

  const trackSort = useCallback((sortField: string, sortDirection: 'asc' | 'desc', component?: string) => {
    trackActivity({
      action: 'sort',
      component,
      metadata: {
        sortField,
        sortDirection
      }
    });
  }, [trackActivity]);

  return {
    trackActivity,
    trackClick,
    trackView,
    trackSearch,
    trackFormSubmission,
    trackPageView,
    trackFilter,
    trackSort
  };
}

/**
 * Hook for automatically tracking page views
 * Use this in page components to automatically track page access
 */
export function usePageTracking(pageName: string, metadata?: Record<string, any>) {
  const { trackPageView } = useAuditTracking();

  React.useEffect(() => {
    trackPageView(pageName, metadata);
  }, [pageName, trackPageView, metadata]);
} 