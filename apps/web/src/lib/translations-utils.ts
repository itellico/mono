import { useTranslations } from 'next-intl';

// ============================
// SEARCHABLE DATA KEYS
// ============================

export const EXPERIENCE_LEVEL_KEYS = ['beginner', 'intermediate', 'professional', 'expert'] as const;

export const SPECIALTY_KEYS_BY_USER_TYPE = {
  fashion_model: ['runway', 'editorial', 'commercial', 'high_fashion', 'catalog', 'fitness'],
  commercial_model: ['lifestyle', 'product', 'corporate', 'family', 'mature', 'character'],
  plus_size_model: ['fashion', 'lingerie', 'fitness', 'lifestyle', 'beauty'],
  child_model: ['catalog', 'toy_ads', 'fashion', 'educational', 'entertainment'],
  hand_model: ['jewelry', 'cosmetics', 'technology', 'food', 'automotive'],
  pet_model: ['commercials', 'print', 'fashion', 'product', 'entertainment'],
  photographer: ['fashion', 'portrait', 'commercial', 'product', 'beauty', 'lifestyle'],
  agency: ['talent_management', 'casting', 'brand_development', 'portfolio_building'],
  brand: ['fashion', 'beauty', 'technology', 'food_beverage', 'automotive', 'healthcare'],
} as const;

export const USER_TYPE_TO_SPECIALTY_CATEGORY = {
  fashion_model: 'fashion',
  commercial_model: 'commercial',
  plus_size_model: 'plus_size',
  child_model: 'child',
  hand_model: 'hand',
  pet_model: 'pet',
  photographer: 'photographer',
  agency: 'agency',
  brand: 'brand'
} as const;

// ============================
// TYPE DEFINITIONS
// ============================

export type ExperienceLevelKey = typeof EXPERIENCE_LEVEL_KEYS[number];
export type UserType = keyof typeof SPECIALTY_KEYS_BY_USER_TYPE;
export type SpecialtyCategory = typeof USER_TYPE_TO_SPECIALTY_CATEGORY[UserType];
export type SpecialtyKey = typeof SPECIALTY_KEYS_BY_USER_TYPE[UserType][number];

// ============================
// UTILITY FUNCTIONS
// ============================

/**
 * Get specialty category for translation lookup based on user type
 */
export function getSpecialtyCategory(userType: string): SpecialtyCategory {
  return USER_TYPE_TO_SPECIALTY_CATEGORY[userType as UserType] || 'commercial';
}

/**
 * Get available specialty keys for a user type
 */
export function getSpecialtyKeys(userType: string): string[] {
  const keys = SPECIALTY_KEYS_BY_USER_TYPE[userType as UserType] || SPECIALTY_KEYS_BY_USER_TYPE.commercial_model;
  return [...keys]; // Convert readonly array to mutable array
}

/**
 * Validate if experience level key is valid
 */
export function isValidExperienceLevel(key: string): key is ExperienceLevelKey {
  return EXPERIENCE_LEVEL_KEYS.includes(key as ExperienceLevelKey);
}

/**
 * Validate if specialty key is valid for a user type
 */
export function isValidSpecialtyKey(key: string, userType: string): boolean {
  const validKeys = getSpecialtyKeys(userType);
  return validKeys.includes(key);
}

// ============================
// SEARCH/FILTER UTILITIES
// ============================

/**
 * Search utility: Get all models with specific experience level
 * @param experienceLevel - The experience level key to search for
 * @returns SQL condition for Drizzle queries
 */
export function createExperienceLevelFilter(experienceLevel: ExperienceLevelKey) {
  return { experienceLevel };
}

/**
 * Search utility: Get all models with specific specialties
 * @param specialties - Array of specialty keys to search for
 * @returns Function for array containment filtering
 */
export function createSpecialtiesFilter(specialties: string[]) {
  // This would be used with Drizzle's array operators
  // Example: where(arrayContains(users.specialties, specialties))
  return specialties;
}

/**
 * Advanced search: Match users by multiple criteria
 */
export interface SearchCriteria {
  experienceLevel?: ExperienceLevelKey;
  specialties?: string[];
  userType?: UserType;
  location?: string;
  // Add more search criteria as needed
}

/**
 * Build search filters for Drizzle queries
 */
export function buildSearchFilters(criteria: SearchCriteria) {
  const filters: Record<string, any> = {};

  if (criteria.experienceLevel) {
    filters.experienceLevel = criteria.experienceLevel;
  }

  // For JSONB specialty searches, you'd use Drizzle's JSONB operators
  // Example: jsonb_path_exists(specialties, '$.specialty[*] ? (@ == "lifestyle")')

  return filters;
}

// ============================
// TRANSLATION HOOKS (Client-side)
// ============================

/**
 * Hook to get translated experience level options
 */
export function useExperienceLevelOptions() {
  const t = useTranslations('common');

  return EXPERIENCE_LEVEL_KEYS.map(key => ({
    key,
    label: t(`experienceLevel.${key}`),
    description: t(`experienceLevelDescription.${key}`)
  }));
}

/**
 * Hook to get translated specialty options for a user type
 */
export function useSpecialtyOptions(userType: string) {
  const t = useTranslations('common');
  const category = getSpecialtyCategory(userType);
  const keys = getSpecialtyKeys(userType);

  return keys.map(key => ({
    key,
    label: t(`specialties.${category}.${key}`),
    category
  }));
}

/**
 * Hook to translate a single experience level
 */
export function useTranslatedExperienceLevel(key: string) {
  const t = useTranslations('common');
  return isValidExperienceLevel(key) ? t(`experienceLevel.${key}`) : key;
}

/**
 * Hook to translate a single specialty
 */
export function useTranslatedSpecialty(key: string, userType: string) {
  const t = useTranslations('common');
  const category = getSpecialtyCategory(userType);
  return isValidSpecialtyKey(key, userType) ? t(`specialties.${category}.${key}`) : key;
} 