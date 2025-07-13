import createMiddleware from 'next-intl/middleware';
import { DEFAULT_LOCALE, ALL_LOCALES } from '@/lib/i18n/config';

export const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales: ALL_LOCALES,
  
  // Used when no locale matches
  defaultLocale: DEFAULT_LOCALE,
  
  // Don't use locale prefix for default locale
  localePrefix: 'as-needed'
});