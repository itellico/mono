import { DateTime } from 'luxon';
import countries from 'world-countries';
import * as ct from 'countries-and-timezones';

// ============================================================================
// TYPES for the optimal schema
// ============================================================================

export interface UserLocalePreferences {
  timezone: string;          // 'Europe/Vienna'
  countryCode: string;       // 'AT'  
  languageLocale: string;    // 'de-DE'
  currencyCode: string;      // 'EUR'
  dateFormat: string;        // 'DD.MM.YYYY'
  timeFormat: string;        // '24h'
  numberFormat: string;      // '1.234,56'
}

export interface TimezoneInfo {
  name: string;
  offset: string;           // '+01:00'
  offsetName: string;       // 'Central European Standard Time'
  isDST: boolean;
  localTime: string;        // '14:30'
  country?: CountryInfo;
}

export interface CountryInfo {
  code: string;             // 'AT'
  name: string;             // 'Austria'
  flag: string;             // '🇦🇹'
  currency: string;         // 'EUR'
  languages: string[];      // ['de']
  timezones: string[];      // ['Europe/Vienna']
}

export interface LanguageInfo {
  locale: string;           // 'de-DE'
  language: string;         // 'de'
  region: string;           // 'DE'
  englishName: string;      // 'German'
  nativeName: string;       // 'Deutsch'
  country?: CountryInfo;
}

// ============================================================================
// PACKAGE INTEGRATION FUNCTIONS
// ============================================================================

/**
 * Get comprehensive timezone information
 */
export function getTimezoneInfo(timezone: string): TimezoneInfo {
  const dt = DateTime.now().setZone(timezone);
  const packageTz = ct.getTimezone(timezone);

  // Find country that uses this timezone
  const country = getCountryByTimezone(timezone);

  return {
    name: timezone,
    offset: dt.toFormat('ZZ'),
    offsetName: dt.toFormat('ZZZZ'),
    isDST: dt.isInDST,
    localTime: dt.toFormat('HH:mm'),
    country
  };
}

/**
 * Get country information by country code
 */
export function getCountryInfo(countryCode: string): CountryInfo | null {
  const country = countries.find(c => c.cca2 === countryCode);
  if (!country) return null;

  return {
    code: country.cca2,
    name: country.name.common,
    flag: country.flag,
    currency: country.currencies ? Object.keys(country.currencies)[0] : '',
    languages: country.languages ? Object.keys(country.languages) : [],
    timezones: (country as any).timezones || []
  };
}

/**
 * Get country by timezone
 */
export function getCountryByTimezone(timezone: string): CountryInfo | null {
  const country = countries.find(c => 
    (c as any).timezones && (c as any).timezones.includes(timezone)
  );

  if (!country) return null;
  return getCountryInfo(country.cca2);
}

/**
 * Get language information
 */
export function getLanguageInfo(languageLocale: string): LanguageInfo {
  const [language, region] = languageLocale.split('-');

  const englishName = new Intl.DisplayNames(['en'], { type: 'language' })
    .of(language) || language;

  const nativeName = new Intl.DisplayNames([languageLocale], { type: 'language' })
    .of(language) || language;

  const country = region ? getCountryInfo(region) : null;

  return {
    locale: languageLocale,
    language,
    region,
    englishName,
    nativeName,
    country
  };
}

/**
 * Format date/time according to user preferences
 */
export function formatUserDateTime(
  date: Date,
  preferences: UserLocalePreferences
): {
  date: string;
  time: string;
  dateTime: string;
} {
  const dt = DateTime.fromJSDate(date).setZone(preferences.timezone);

  // Convert our format to Luxon format
  const luxonDateFormat = preferences.dateFormat
    .replace('YYYY', 'yyyy')
    .replace('MM', 'MM')
    .replace('DD', 'dd');

  const timeFormat = preferences.timeFormat === '12h' ? 'h:mm a' : 'HH:mm';

  return {
    date: dt.toFormat(luxonDateFormat),
    time: dt.toFormat(timeFormat),
    dateTime: dt.toFormat(`${luxonDateFormat} ${timeFormat}`)
  };
}

/**
 * Format number according to user preferences
 */
export function formatUserNumber(
  number: number,
  preferences: UserLocalePreferences,
  options?: Intl.NumberFormatOptions
): string {
  // Use the language locale for number formatting
  const formatter = new Intl.NumberFormat(preferences.languageLocale, {
    currency: preferences.currencyCode,
    ...options
  });

  return formatter.format(number);
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate timezone against packages
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    const packageTz = ct.getTimezone(timezone);
    return packageTz !== null;
  } catch {
    return false;
  }
}

/**
 * Validate country code against packages
 */
export function isValidCountryCode(countryCode: string): boolean {
  return countries.some(c => c.cca2 === countryCode);
}

/**
 * Validate language locale
 */
export function isValidLanguageLocale(languageLocale: string): boolean {
  try {
    const [language, region] = languageLocale.split('-');
    if (!language || !region) return false;

    // Test if we can create Intl formatters
    new Intl.DisplayNames([languageLocale], { type: 'language' });
    return isValidCountryCode(region);
  } catch {
    return false;
  }
}

/**
 * Validate complete user preferences
 */
export function validateUserPreferences(preferences: Partial<UserLocalePreferences>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (preferences.timezone && !isValidTimezone(preferences.timezone)) {
    errors.push(`Invalid timezone: ${preferences.timezone}`);
  }

  if (preferences.countryCode && !isValidCountryCode(preferences.countryCode)) {
    errors.push(`Invalid country code: ${preferences.countryCode}`);
  }

  if (preferences.languageLocale && !isValidLanguageLocale(preferences.languageLocale)) {
    errors.push(`Invalid language locale: ${preferences.languageLocale}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============================================================================
// ENHANCED DROPDOWN OPTIONS
// ============================================================================

export interface DropdownOption {
  value: string;
  label: string;
  searchTerms: string;
  metadata?: any;
}

/**
 * Get all available timezones for dropdown
 */
export function getAllTimezoneOptions(): DropdownOption[] {
  const allTimezones = ct.getAllTimezones();

  return Object.entries(allTimezones)
    .filter(([name]) => {
      // Filter out deprecated/alias timezones
      return !name.includes('US/') && 
             !name.includes('Canada/') && 
             !name.includes('Etc/');
    })
    .map(([name, data]) => {
      const dt = DateTime.now().setZone(name);
      const country = getCountryByTimezone(name);
      const cityName = name.split('/').pop() || '';

      return {
        value: name,
        label: `${country?.flag || '🌍'} ${cityName} (${dt.toFormat('ZZ')})`,
        searchTerms: [
          cityName.toLowerCase(),
          country?.name.toLowerCase() || '',
          name.toLowerCase(),
          dt.toFormat('ZZ')
        ].join(' '),
        metadata: {
          country: country?.code,
          offset: dt.toFormat('ZZ'),
          isDST: dt.isInDST
        }
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Get all available countries for dropdown
 */
export function getAllCountryOptions(): DropdownOption[] {
  return countries
    .filter(country => country.cca2 && country.name?.common)
    .map(country => ({
      value: country.cca2,
      label: `${country.flag} ${country.name.common}`,
      searchTerms: [
        country.name.common.toLowerCase(),
        country.cca2.toLowerCase(),
        ...(country.altSpellings || []).map(s => s.toLowerCase())
      ].join(' '),
      metadata: {
        currency: country.currencies ? Object.keys(country.currencies)[0] : null,
        languages: country.languages ? Object.keys(country.languages) : [],
        timezones: (country as any).timezones || []
      }
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Get available language options
 */
export function getLanguageOptions(): DropdownOption[] {
  // Common language-country combinations
  const commonLocales = [
    'en-US', 'en-GB', 'de-DE', 'fr-FR', 'es-ES', 'it-IT', 
    'pt-PT', 'nl-NL', 'sv-SE', 'da-DK', 'no-NO', 'fi-FI',
    'pl-PL', 'ru-RU', 'ja-JP', 'ko-KR', 'zh-CN', 'ar-SA',
    'hi-IN', 'tr-TR', 'th-TH', 'vi-VN'
  ];

  return commonLocales
    .filter(locale => isValidLanguageLocale(locale))
    .map(locale => {
      const info = getLanguageInfo(locale);

      return {
        value: locale,
        label: `${info.country?.flag || '🌍'} ${info.englishName} (${info.country?.name || info.region})`,
        searchTerms: [
          info.englishName.toLowerCase(),
          info.nativeName.toLowerCase(),
          info.country?.name.toLowerCase() || '',
          locale.toLowerCase()
        ].join(' '),
        metadata: {
          language: info.language,
          region: info.region,
          nativeName: info.nativeName
        }
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
} 

 