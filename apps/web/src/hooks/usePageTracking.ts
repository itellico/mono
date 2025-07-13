import { useAuth } from '@/contexts/auth-context';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useCallback } from 'react';
import { browserLogger } from '@/lib/browser-logger';

// Extended user type for itellico Mono
interface ExtendedUser {
  id: string;
  tenantId?: number;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface PageTrackingOptions {
  /** Whether to enable page tracking */
  enabled?: boolean;
  /** Debounce time in milliseconds for rapid navigation */
  debounceMs?: number;
  /** Additional metadata to include with page views */
  metadata?: Record<string, any>;
  /** Custom tenant ID (optional) */
  tenantId?: number;
  /** Callback fired when page view is tracked */
  onPageTracked?: (pathname: string) => void;
  /** Callback fired when tracking fails */
  onTrackingFailed?: (error: string) => void;
}

/**
 * Hook for tracking page views and navigation patterns
 * 
 * @param options - Configuration for page tracking
 * 
 * @example
 * ```tsx
 * // Basic usage
 * usePageTracking();
 * 
 * // With options
 * usePageTracking({
 *   enabled: true,
 *   debounceMs: 300,
 *   metadata: { source: 'main_nav' },
 *   onPageTracked: (pathname) => console.log('Tracked:', pathname)
 * });
 * ```
 * 
 * @component
 */
export const usePageTracking = (options: PageTrackingOptions = {}) => {
  const { user } = useAuth();
  const pathname = usePathname();
  const { 
    enabled = true, 
    debounceMs = 100, 
    metadata = {}, 
    tenantId,
    onPageTracked,
    onTrackingFailed 
  } = options;

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastTrackedPath = useRef<string>('');
  const pageStartTime = useRef<number>(Date.now());

  /**
   * Track a page view with performance optimization
   */
  const trackPageView = useCallback(async (currentPath: string) => {
    const user = user as ExtendedUser;
    if (!user?.id || !enabled) {
      browserLogger.debug('Page tracking skipped - no user session or disabled');
      return;
    }

    // Skip tracking if same path
    if (lastTrackedPath.current === currentPath) {
      browserLogger.debug('Page tracking skipped - same path');
      return;
    }

    const now = Date.now();
    const timeOnPreviousPage = now - pageStartTime.current;

    try {
      const trackingData = {
        tenantId: tenantId || user.tenantId,
        userId: user.id,
        action: 'page_view' as const,
        component: currentPath,
        metadata: {
          ...metadata,
          pathname: currentPath,
          timeOnPreviousPage: lastTrackedPath.current ? timeOnPreviousPage : null,
          previousPage: lastTrackedPath.current || null,
          timestamp: now,
          userAgent: navigator.userAgent,
          referrer: document.referrer || null,
          screenResolution: `${screen.width}x${screen.height}`,
          viewportSize: `${window.innerWidth}x${window.innerHeight}`,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      };

      // Use fetch with keepalive for performance (fire-and-forget)
      const response = await fetch('/api/v1/audit/track-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trackingData),
        keepalive: true // Ensures request completes even if page unloads
      });

      if (response.ok) {
        lastTrackedPath.current = currentPath;
        pageStartTime.current = now;
        onPageTracked?.(currentPath);

        browserLogger.userAction('Page view tracked', currentPath);
      } else {
        throw new Error(`Page tracking failed: ${response.statusText}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onTrackingFailed?.(errorMessage);
      
      // Silent failure - don't break user experience
      browserLogger.debug('Page tracking failed', { 
        error: errorMessage,
        pathname: currentPath 
      });
    }
  }, [user, enabled, tenantId, metadata, onPageTracked, onTrackingFailed]);

  /**
   * Track page exit with time-on-page data
   */
  const trackPageExit = useCallback(async (exitPath: string) => {
    const user = user as ExtendedUser;
    if (!user?.id || !enabled || !lastTrackedPath.current) return;

    const timeOnPage = Date.now() - pageStartTime.current;

    try {
      const exitData = {
        tenantId: tenantId || user.tenantId,
        userId: user.id,
        action: 'page_exit' as const,
        component: exitPath,
        metadata: {
          ...metadata,
          pathname: exitPath,
          timeOnPage,
          timestamp: Date.now()
        }
      };

      // Use sendBeacon for page exit to ensure delivery
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          '/api/v1/audit/track-page', 
          JSON.stringify(exitData)
        );
      } else {
        // Fallback for browsers without sendBeacon
        fetch('/api/v1/audit/track-page', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(exitData),
          keepalive: true
        });
      }

      browserLogger.userAction('Page exit tracked', `${exitPath} (${timeOnPage}ms)`);

    } catch (error) {
      browserLogger.debug('Page exit tracking failed', { error });
    }
  }, [user, enabled, tenantId, metadata]);

  // Track page view with debouncing
  useEffect(() => {
    if (!enabled || !pathname) return;

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new debounce timer
    debounceTimer.current = setTimeout(() => {
      trackPageView(pathname);
    }, debounceMs);

    // Cleanup function
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [pathname, enabled, debounceMs, trackPageView]);

  // Track page exit on unmount
  useEffect(() => {
    return () => {
      if (lastTrackedPath.current) {
        trackPageExit(lastTrackedPath.current);
      }
    };
  }, [trackPageExit]);

  // Track page visibility changes (tab switching)
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden && lastTrackedPath.current) {
        // Page became hidden - track exit
        trackPageExit(lastTrackedPath.current);
      } else if (!document.hidden && pathname) {
        // Page became visible - track view
        pageStartTime.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, pathname, trackPageExit]);

  // Manual tracking functions for special cases
  const manualTrackPageView = useCallback((customPath?: string) => {
    const pathToTrack = customPath || pathname;
    if (pathToTrack) {
      trackPageView(pathToTrack);
    }
  }, [pathname, trackPageView]);

  const manualTrackPageExit = useCallback((customPath?: string) => {
    const pathToTrack = customPath || pathname;
    if (pathToTrack) {
      trackPageExit(pathToTrack);
    }
  }, [pathname, trackPageExit]);

  return {
    /** Current pathname being tracked */
    currentPath: pathname,
    /** Last successfully tracked path */
    lastTrackedPath: lastTrackedPath.current,
    /** Time spent on current page in milliseconds */
    timeOnCurrentPage: Date.now() - pageStartTime.current,
    /** Manually trigger page view tracking */
    trackPageView: manualTrackPageView,
    /** Manually trigger page exit tracking */
    trackPageExit: manualTrackPageExit
  };
}; 