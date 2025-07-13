/**
 * Translation Namespaces Configuration
 * 
 * This file defines the available translation namespaces for the itellico Mono.
 * Use this to maintain consistency and enable type-safe translations.
 */

export const TRANSLATION_NAMESPACES = {
  // Common/shared translations
  COMMON: 'common',
  
  // Authentication & user management
  AUTH: 'auth',
  PROFILE: 'profile',
  
  // Admin module namespaces
  ADMIN: {
    COMMON: 'admin.common',
    DASHBOARD: 'admin.dashboard',
    USERS: 'admin.users',
    MODEL_SCHEMAS: 'admin.model-schemas',
    SETTINGS: 'admin.settings',
    AUDIT: 'admin.audit',
    REPORTS: 'admin.reports'
  },
  
  // Feature module namespaces
  MARKETPLACE: 'marketplace',
  SEARCH: 'search',
  MESSAGING: 'messaging',
  NOTIFICATIONS: 'notifications',
  
  // Error handling
  ERRORS: 'errors'
} as const;

/**
 * Type-safe namespace keys
 */
export type TranslationNamespace = typeof TRANSLATION_NAMESPACES[keyof typeof TRANSLATION_NAMESPACES] | 
  typeof TRANSLATION_NAMESPACES.ADMIN[keyof typeof TRANSLATION_NAMESPACES.ADMIN];

/**
 * Helper function to get namespace path
 */
export function getNamespace(namespace: TranslationNamespace): string {
  return namespace;
}

/**
 * Validation function to ensure namespace exists
 */
export function validateNamespace(namespace: string): boolean {
  const allNamespaces = [
    ...Object.values(TRANSLATION_NAMESPACES).filter(ns => typeof ns === 'string'),
    ...Object.values(TRANSLATION_NAMESPACES.ADMIN)
  ];
  
  return allNamespaces.includes(namespace as TranslationNamespace);
} 