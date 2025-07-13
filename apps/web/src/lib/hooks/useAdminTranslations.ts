/**
 * ✅ ENTERPRISE ADMIN TRANSLATIONS HOOK - SIMPLIFIED
 * 
 * mono PLATFORM BEST PRACTICES:
 * - Use next-intl getTranslations() directly (no middleware bloat)
 * - Component-level loading only
 * - No complex caching (next-intl handles this)
 * - Simple error boundaries
 */

import { useTranslations } from 'next-intl';
import { browserLogger } from '@/lib/browser-logger';

// Admin translation namespaces
export type AdminTranslationNamespace = 
  | 'admin-common'
  | 'admin-tenants' 
  | 'admin-users'
  | 'admin-model-schemas'
  | 'admin-categories'
  | 'admin-tags';

/**
 * ✅ SIMPLIFIED ADMIN TRANSLATIONS HOOK
 * Use this for client-side admin components
 */
export function useAdminTranslations(namespace: AdminTranslationNamespace) {
  try {
    const t = useTranslations(namespace);
    
    return {
      t,
      isLoading: false,
      error: null
    };
  } catch (error) {
    browserLogger.error('Admin translation loading failed', { 
      namespace, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    
    // Fallback function that returns the key if translation fails
    const fallbackT = (key: string, params?: any) => {
      browserLogger.warn('Using fallback translation', { namespace, key, params });
      return key;
    };
    
    return {
      t: fallbackT,
      isLoading: false,
      error: error instanceof Error ? error.message : 'Translation loading failed'
    };
  }
}

/**
 * ✅ LEGACY COMPATIBILITY - Keep for existing imports
 * @deprecated Use useAdminTranslations instead
 */
export function useAdminTranslation(namespace: AdminTranslationNamespace) {
  browserLogger.warn('useAdminTranslation is deprecated - use useAdminTranslations instead');
  return useAdminTranslations(namespace);
}

// ✅ SPECIFIC ADMIN TRANSLATION HOOKS - For convenience
export function useAdminCommonTranslations() {
  return useAdminTranslations('admin-common');
}

export function useAdminUsersTranslations() {
  return useAdminTranslations('admin-users');
}

export function useAdminTagsTranslations() {
  return useAdminTranslations('admin-tags');
}

export function useCommonTranslations() {
  return useAdminTranslations('admin-common');
} 