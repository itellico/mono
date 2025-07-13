// ============================
// INTERNATIONALIZATION CONFIG
// ============================
// Core internationalization configuration for JSON-based translations
export const DEFAULT_LOCALE = 'en-US';
export const FALLBACK_LOCALE = 'en-US';
export const DEFAULT_TIMEZONE = 'Europe/Vienna';

// Supported locales for different areas of the application
export const SUPPORTED_LOCALES_FOR_APPLICATION = {
  // User areas (Phase 2) - English + German with regional variants
  user: ['en-US', 'en-GB', 'de-DE'],

  // Public areas (Phase 3) - Full language support with regional variants
  public: [
    'en-US', 'en-GB', 'en-CA', 'en-AU',
    'de-DE', 'de-AT', 'de-CH',
    'fr-FR', 'fr-CA', 'fr-CH',
    'es-ES', 'es-MX', 'es-AR',
    'it-IT', 'pt-BR', 'pt-PT',
    'nl-NL', 'sv-SE', 'da-DK', 'no-NO', 'fi-FI', 'pl-PL'
  ]
} as const;

// All supported locales (union of all areas) 
export const ALL_LOCALES = [
  ...new Set([
    ...SUPPORTED_LOCALES_FOR_APPLICATION.user,
    ...SUPPORTED_LOCALES_FOR_APPLICATION.public
  ])
] as const;

export type UserLocale = typeof SUPPORTED_LOCALES_FOR_APPLICATION.user[number];
export type PublicLocale = typeof SUPPORTED_LOCALES_FOR_APPLICATION.public[number];
export type Locale = typeof ALL_LOCALES[number];

// Translation namespaces (matching our JSON file structure)
export const TRANSLATION_NAMESPACES = {
  // Shared
  common: 'common',
  ui: 'ui',
  api: 'api',

  // User areas (Phase 2)
  dashboard: 'dashboard', 
  profile: 'profile',
  applications: 'applications',
  messages: 'messages',
  onboarding: 'onboarding',

  // Admin areas (Phase 1 - EN-US only initially)
  adminCommon: 'admin-common',
  adminUi: 'admin-ui',
  adminUsers: 'admin-users',
  adminContent: 'admin-content',
  adminApplications: 'admin-applications',
  adminAnalytics: 'admin-analytics',
  adminSettings: 'admin-settings',
  adminAudit: 'admin-audit',
  adminTags: 'admin-tags',

  // Public areas (Phase 3)
  auth: 'auth',
  landing: 'landing',
  public: 'public'
} as const;

export type TranslationNamespace = typeof TRANSLATION_NAMESPACES[keyof typeof TRANSLATION_NAMESPACES];

// Language information with regional variants and currency support
export const LANGUAGE_INFO: Record<Locale, {
  nativeName: string;
  englishName: string;
  direction: 'ltr' | 'rtl';
  numberFormat: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  currency: string;
  currencySymbol: string;
}> = {
  'en-US': {
    nativeName: 'English (US)',
    englishName: 'English (United States)',
    direction: 'ltr',
    numberFormat: '1,234.56',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    currency: 'USD',
    currencySymbol: '$'
  },
  'en-GB': {
    nativeName: 'English (UK)',
    englishName: 'English (United Kingdom)',
    direction: 'ltr',
    numberFormat: '1,234.56',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    currency: 'GBP',
    currencySymbol: '£'
  },
  'en-CA': {
    nativeName: 'English (Canada)',
    englishName: 'English (Canada)',
    direction: 'ltr',
    numberFormat: '1,234.56',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    currency: 'CAD',
    currencySymbol: 'C$'
  },
  'en-AU': {
    nativeName: 'English (Australia)',
    englishName: 'English (Australia)',
    direction: 'ltr',
    numberFormat: '1,234.56',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    currency: 'AUD',
    currencySymbol: 'A$'
  },
  'de-DE': {
    nativeName: 'Deutsch (Deutschland)',
    englishName: 'German (Germany)',
    direction: 'ltr',
    numberFormat: '1.234,56',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24h',
    currency: 'EUR',
    currencySymbol: '€'
  },
  'de-AT': {
    nativeName: 'Deutsch (Österreich)',
    englishName: 'German (Austria)',
    direction: 'ltr',
    numberFormat: '1.234,56',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24h',
    currency: 'EUR',
    currencySymbol: '€'
  },
  'de-CH': {
    nativeName: 'Deutsch (Schweiz)',
    englishName: 'German (Switzerland)',
    direction: 'ltr',
    numberFormat: '1 234.56',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24h',
    currency: 'CHF',
    currencySymbol: 'CHF'
  },
  'fr-FR': {
    nativeName: 'Français (France)',
    englishName: 'French (France)',
    direction: 'ltr',
    numberFormat: '1 234,56',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    currency: 'EUR',
    currencySymbol: '€'
  },
  'fr-CA': {
    nativeName: 'Français (Canada)',
    englishName: 'French (Canada)',
    direction: 'ltr',
    numberFormat: '1 234,56',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    currency: 'CAD',
    currencySymbol: 'C$'
  },
  'fr-CH': {
    nativeName: 'Français (Suisse)',
    englishName: 'French (Switzerland)',
    direction: 'ltr',
    numberFormat: '1 234,56',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24h',
    currency: 'CHF',
    currencySymbol: 'CHF'
  },
  'es-ES': {
    nativeName: 'Español (España)',
    englishName: 'Spanish (Spain)',
    direction: 'ltr',
    numberFormat: '1.234,56',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    currency: 'EUR',
    currencySymbol: '€'
  },
  'es-MX': {
    nativeName: 'Español (México)',
    englishName: 'Spanish (Mexico)',
    direction: 'ltr',
    numberFormat: '1,234.56',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    currency: 'MXN',
    currencySymbol: '$'
  },
  'es-AR': {
    nativeName: 'Español (Argentina)',
    englishName: 'Spanish (Argentina)',
    direction: 'ltr',
    numberFormat: '1.234,56',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    currency: 'ARS',
    currencySymbol: '$'
  },
  'it-IT': {
    nativeName: 'Italiano (Italia)',
    englishName: 'Italian (Italy)',
    direction: 'ltr',
    numberFormat: '1.234,56',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    currency: 'EUR',
    currencySymbol: '€'
  },
  'pt-BR': {
    nativeName: 'Português (Brasil)',
    englishName: 'Portuguese (Brazil)',
    direction: 'ltr',
    numberFormat: '1.234,56',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    currency: 'BRL',
    currencySymbol: 'R$'
  },
  'pt-PT': {
    nativeName: 'Português (Portugal)',
    englishName: 'Portuguese (Portugal)',
    direction: 'ltr',
    numberFormat: '1.234,56',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    currency: 'EUR',
    currencySymbol: '€'
  },
  'nl-NL': {
    nativeName: 'Nederlands (Nederland)',
    englishName: 'Dutch (Netherlands)',
    direction: 'ltr',
    numberFormat: '1.234,56',
    dateFormat: 'DD-MM-YYYY',
    timeFormat: '24h',
    currency: 'EUR',
    currencySymbol: '€'
  },
  'sv-SE': {
    nativeName: 'Svenska (Sverige)',
    englishName: 'Swedish (Sweden)',
    direction: 'ltr',
    numberFormat: '1 234,56',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    currency: 'SEK',
    currencySymbol: 'kr'
  },
  'da-DK': {
    nativeName: 'Dansk (Danmark)',
    englishName: 'Danish (Denmark)',
    direction: 'ltr',
    numberFormat: '1.234,56',
    dateFormat: 'DD-MM-YYYY',
    timeFormat: '24h',
    currency: 'DKK',
    currencySymbol: 'kr'
  },
  'no-NO': {
    nativeName: 'Norsk (Norge)',
    englishName: 'Norwegian (Norway)',
    direction: 'ltr',
    numberFormat: '1 234,56',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24h',
    currency: 'NOK',
    currencySymbol: 'kr'
  },
  'fi-FI': {
    nativeName: 'Suomi (Suomi)',
    englishName: 'Finnish (Finland)',
    direction: 'ltr',
    numberFormat: '1 234,56',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24h',
    currency: 'EUR',
    currencySymbol: '€'
  },
  'pl-PL': {
    nativeName: 'Polski (Polska)',
    englishName: 'Polish (Poland)',
    direction: 'ltr',
    numberFormat: '1 234,56',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24h',
    currency: 'PLN',
    currencySymbol: 'zł'
  }
};

// Area-specific locale validation
export function isValidUserLocale(locale: string): locale is UserLocale {
  return SUPPORTED_LOCALES_FOR_APPLICATION.user.includes(locale as UserLocale);
}

export function isValidPublicLocale(locale: string): locale is PublicLocale {
  return SUPPORTED_LOCALES_FOR_APPLICATION.public.includes(locale as PublicLocale);
}

// isValidLocale function defined above in area-specific validation section

// Get locale from database language code  
export function getLocaleFromLanguageCode(languageCode: string): Locale {
  // Map common language codes to our regional locale format
  const mapping: Record<string, Locale> = {
    // English variants
    'en': 'en-US',
    'en-US': 'en-US',
    'en-GB': 'en-GB',
    'en-CA': 'en-CA',
    'en-AU': 'en-AU',

    // German variants
    'de': 'de-DE',
    'de-DE': 'de-DE',
    'de-AT': 'de-AT',
    'de-CH': 'de-CH',

    // French variants
    'fr': 'fr-FR',
    'fr-FR': 'fr-FR',
    'fr-CA': 'fr-CA',
    'fr-CH': 'fr-CH',

    // Spanish variants
    'es': 'es-ES',
    'es-ES': 'es-ES',
    'es-MX': 'es-MX',
    'es-AR': 'es-AR',

    // Other languages
    'it': 'it-IT',
    'it-IT': 'it-IT',
    'pt': 'pt-BR',
    'pt-BR': 'pt-BR',
    'pt-PT': 'pt-PT',
    'nl': 'nl-NL',
    'nl-NL': 'nl-NL',
    'sv': 'sv-SE',
    'sv-SE': 'sv-SE',
    'da': 'da-DK',
    'da-DK': 'da-DK',
    'no': 'no-NO',
    'no-NO': 'no-NO',
    'fi': 'fi-FI',
    'fi-FI': 'fi-FI',
    'pl': 'pl-PL',
    'pl-PL': 'pl-PL'
  };

  return mapping[languageCode] || DEFAULT_LOCALE;
} 