import { browserLogger } from '@/lib/browser-logger';
import { queryClient } from '@/lib/query-client';

/**
 * Centralized Signout Manager
 * 
 * Handles all signout logic in one place to ensure consistency across the application.
 * Follows itellico Mono rules:
 * - Proper browserLogger usage (no console.log)
 * - Clears all client-side state
 * - Handles errors gracefully with fallbacks
 * - Includes audit logging integration
 * 
 * @example
 * ```tsx
 * import { SignoutManager } from '@/lib/auth/signout-manager';
 * 
 * const handleSignOut = () => {
 *   SignoutManager.signOut();
 * };
 * ```
 */
export class SignoutManager {
  /**
   * Main signout method that handles all cleanup
   * @param options - Signout configuration options
   */
  static async signOut(options: SignoutOptions = {}): Promise<void> {
    const {
      callbackUrl = '/',
      reason = 'user_initiated',
      skipRedirect = false
    } = options;

    try {
      browserLogger.info('Signout process initiated', { 
        reason,
        callbackUrl,
        timestamp: new Date().toISOString()
      });

      // Step 1: Clear all client-side storage
      await this.clearClientStorage();

      // Step 2: Clear Zustand stores
      await this.clearZustandStores();

      // Step 3: Clear TanStack Query cache
      await this.clearQueryCache();

      // Step 4: Clear auth cookies and session
      await this.clearAuthSession();

      // Step 5: Call Fastify logout endpoint
      if (!skipRedirect) {
        // Call our Fastify logout API
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
          await fetch(`${apiUrl}/api/v1/public/auth/logout`, {
            method: 'POST',
            credentials: 'include'
          });
        } catch (error) {
          browserLogger.warn('Logout API call failed', { error });
        }
        
        // Force page reload to ensure clean session state
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            window.location.href = callbackUrl;
          }, 100); // Small delay to ensure signOut completes
        }
      }

      browserLogger.info('Signout process completed successfully', {
        reason,
        callbackUrl
      });

    } catch (error) {
      browserLogger.error('Error during signout process', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        reason,
        callbackUrl
      });

      // Fallback: Force cleanup and redirect
      await this.emergencySignout(callbackUrl);
    }
  }

  /**
   * Clear all browser storage (localStorage, sessionStorage)
   */
  private static async clearClientStorage(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        // Clear localStorage
        const localStorageKeys = Object.keys(localStorage);
        localStorageKeys.forEach(key => {
          try {
            localStorage.removeItem(key);
          } catch (error) {
            browserLogger.warn('Failed to remove localStorage key', { key, error });
          }
        });

        // Clear sessionStorage
        const sessionStorageKeys = Object.keys(sessionStorage);
        sessionStorageKeys.forEach(key => {
          try {
            sessionStorage.removeItem(key);
          } catch (error) {
            browserLogger.warn('Failed to remove sessionStorage key', { key, error });
          }
        });

        browserLogger.info('Client storage cleared', {
          localStorageKeysCleared: localStorageKeys.length,
          sessionStorageKeysCleared: sessionStorageKeys.length
        });
      }
    } catch (error) {
      browserLogger.error('Error clearing client storage', { error });
    }
  }

  /**
   * Clear all Zustand stores that use persist middleware
   */
  private static async clearZustandStores(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        // Clear Zustand persisted stores
        const zustandKeys = [
          'translation-ui-store', // Translation UI store
          'modal-store', // Modal store (if it gets persist in future)
          'ui-preferences-store', // UI preferences (if exists)
          'form-store', // Form store (if exists)
          'shared-store' // Shared store (if exists)
        ];

        zustandKeys.forEach(key => {
          try {
            // Clear from localStorage (where Zustand persist stores data)
            localStorage.removeItem(key);
            
            // Also clear any variations
            localStorage.removeItem(`${key}-storage`);
            localStorage.removeItem(`zustand-${key}`);
          } catch (error) {
            // Not critical if store doesn't exist
            browserLogger.debug('Zustand store not found or already cleared', { key });
          }
        });

        // If we can import the stores dynamically, reset them to initial state
        try {
          const { useTranslationUIStore } = await import('@/stores/translation-ui-store');
          useTranslationUIStore.getState().resetAll();
          browserLogger.info('Translation UI store reset to initial state');
        } catch (error) {
          browserLogger.debug('Could not reset translation UI store', { error });
        }

        try {
          const { useModalStore } = await import('@/stores/ui/modal-store');
          useModalStore.getState().closeModal();
          browserLogger.info('Modal store reset to initial state');
        } catch (error) {
          browserLogger.debug('Could not reset modal store', { error });
        }

        browserLogger.info('Zustand stores cleared');
      }
    } catch (error) {
      browserLogger.error('Error clearing Zustand stores', { error });
    }
  }

  /**
   * Clear TanStack Query cache
   */
  private static async clearQueryCache(): Promise<void> {
    try {
      // Clear all queries
      queryClient.clear();
      
      // Remove all cached data
      queryClient.removeQueries();
      
      // Cancel all ongoing queries
      await queryClient.cancelQueries();
      
      // Invalidate all queries (in case some are still active)
      await queryClient.invalidateQueries();

      browserLogger.info('TanStack Query cache cleared');
    } catch (error) {
      browserLogger.error('Error clearing query cache', { error });
    }
  }

  /**
   * Clear Fastify auth cookies and session data
   */
  private static async clearAuthSession(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && document) {
        // Clear Fastify auth cookies
        const cookiesToClear = [
          'accessToken',
          'refreshToken'
        ];

        cookiesToClear.forEach(cookieName => {
          // Clear for current domain
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
          // Clear for root domain (in case of subdomain)
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
          // Clear for parent domain
          const parts = window.location.hostname.split('.');
          if (parts.length > 1) {
            const parentDomain = parts.slice(-2).join('.');
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${parentDomain}`;
          }
        });

        browserLogger.info('Auth cookies cleared');
      }
    } catch (error) {
      browserLogger.error('Error clearing auth session', { error });
    }
  }

  /**
   * Emergency signout - force cleanup and redirect when normal signout fails
   */
  private static async emergencySignout(callbackUrl: string = '/'): Promise<void> {
    try {
      browserLogger.warn('Performing emergency signout');

      if (typeof window !== 'undefined') {
        // Force clear all storage
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (error) {
          browserLogger.error('Failed to clear storage in emergency signout', { error });
        }

        // Force redirect to signin page
        window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;
      }
    } catch (error) {
      browserLogger.error('Emergency signout failed', { error });
      
      // Last resort - reload page
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  }

  /**
   * Check if user is currently signed out (useful for preventing duplicate signouts)
   */
  static isSignedOut(): boolean {
    try {
      if (typeof window !== 'undefined') {
        // Check for Fastify auth cookie
        const hasSessionCookie = document.cookie.includes('accessToken');
        return !hasSessionCookie;
      }
      return true;
    } catch (error) {
      browserLogger.error('Error checking signout status', { error });
      return false;
    }
  }

  /**
   * Quick signout for components that need simple logout
   */
  static async quickSignOut(): Promise<void> {
    return this.signOut({ reason: 'quick_logout' });
  }

  /**
   * Admin signout with additional admin-specific cleanup
   */
  static async adminSignOut(): Promise<void> {
    try {
      // Clear any admin-specific caches
      if (typeof window !== 'undefined') {
        // Clear admin-specific localStorage keys
        const adminKeys = Object.keys(localStorage).filter(key => 
          key.includes('admin') || key.includes('dashboard')
        );
        adminKeys.forEach(key => localStorage.removeItem(key));
      }

      return this.signOut({ 
        reason: 'admin_logout',
        callbackUrl: '/' 
      });
    } catch (error) {
      browserLogger.error('Error during admin signout', { error });
      return this.emergencySignout('/');
    }
  }

  /**
   * Signout due to session expiry
   */
  static async sessionExpiredSignOut(): Promise<void> {
    return this.signOut({ 
      reason: 'session_expired',
      callbackUrl: '/auth/signin?message=session_expired'
    });
  }

  /**
   * Forced signout (security reason)
   */
  static async securitySignOut(): Promise<void> {
    return this.signOut({ 
      reason: 'security_logout',
      callbackUrl: '/auth/signin?message=security_logout'
    });
  }
}

/**
 * Signout configuration options
 */
interface SignoutOptions {
  /** URL to redirect to after signout */
  callbackUrl?: string;
  /** Reason for signout (for logging) */
  reason?: 'user_initiated' | 'session_expired' | 'security_logout' | 'admin_logout' | 'quick_logout';
  /** Skip redirect (useful for testing) */
  skipRedirect?: boolean;
}

/**
 * Export individual methods for convenience
 */
export const {
  signOut: centralizedSignOut,
  quickSignOut,
  adminSignOut,
  sessionExpiredSignOut,
  securitySignOut,
  isSignedOut
} = SignoutManager; 