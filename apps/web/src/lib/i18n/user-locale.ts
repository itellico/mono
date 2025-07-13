import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { 
  DEFAULT_LOCALE, 
  FALLBACK_LOCALE, 
  getLocaleFromLanguageCode,
  isValidPublicLocale,
  isValidUserLocale,
  type Locale,
  type PublicLocale,
  type UserLocale 
} from './config';
import { logger } from '@/lib/logger';

interface UserLocaleInfo {
  locale: Locale;
  languageId: number | null;
  languageCode: string | null;
  isFromDatabase: boolean;
  fallbackReason?: string;
}

/**
 * Get user's preferred locale from their account settings
 * This is for authenticated areas only (admin, user dashboard)
 */
export async function getUserLocale(): Promise<UserLocaleInfo> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      logger.debug('No authenticated user, using default locale');
      return {
        locale: DEFAULT_LOCALE,
        languageId: null,
        languageCode: null,
        isFromDatabase: false,
        fallbackReason: 'not_authenticated'
      };
    }

    // Get user's language preference from database
    const userAccount = await db.account.findFirst({
      where: {
        id: parseInt(session.user.id)
      },
      include: {
        language: true
      }
    });

    if (!userAccount) {
      logger.warn({ userId: session.user.id }, 'Account not found for authenticated user');
      return {
        locale: DEFAULT_LOCALE,
        languageId: null,
        languageCode: null,
        isFromDatabase: false,
        fallbackReason: 'account_not_found'
      };
    }

    if (!userAccount.language) {
      logger.debug({ userId: session.user.id }, 'No language preference set for user');
      return {
        locale: DEFAULT_LOCALE,
        languageId: userAccount.languageId,
        languageCode: null,
        isFromDatabase: false,
        fallbackReason: 'no_language_preference'
      };
    }

    // Convert database language code to our locale format
    const languageCode = Array.isArray(userAccount.language) ? 
      userAccount.language[0]?.code : userAccount.language?.code;

    if (!languageCode) {
      logger.debug({ userId: session.user.id }, 'Language exists but code is missing');
      return {
        locale: DEFAULT_LOCALE,
        languageId: userAccount.languageId,
        languageCode: null,
        isFromDatabase: false,
        fallbackReason: 'no_language_code'
      };
    }

    const locale = getLocaleFromLanguageCode(languageCode);

    logger.debug({ 
      userId: session.user.id,
      languageCode,
      locale 
    }, 'Retrieved user locale from database');

    return {
      locale,
      languageId: userAccount.languageId,
      languageCode,
      isFromDatabase: true
    };

  } catch (error) {
    logger.error({ 
      error: error instanceof Error ? error.message : String(error),
      type: 'get_user_locale_failed'
    }, 'Error getting user locale');

    return {
      locale: FALLBACK_LOCALE,
      languageId: null,
      languageCode: null,
      isFromDatabase: false,
      fallbackReason: 'database_error'
    };
  }
}

/**
 * Get user locale specifically for admin areas
 * Currently returns English only as per Phase 1 rules
 */
export async function getAdminLocale(): Promise<PublicLocale> {
  // Phase 1: Admin areas use English only
  // In the future, this could check user preferences within supported admin locales
  const userLocaleInfo = await getUserLocale();

  if (isValidPublicLocale(userLocaleInfo.locale)) {
    return userLocaleInfo.locale;
  }

  // Fall back to default admin locale (English)
  return 'en-US';
}

/**
 * Get user locale specifically for user dashboard areas
 * Supports English and German as per Phase 2 rules
 */
export async function getUserDashboardLocale(): Promise<UserLocale> {
  const userLocaleInfo = await getUserLocale();

  if (isValidUserLocale(userLocaleInfo.locale)) {
    return userLocaleInfo.locale;
  }

  // Fall back to English if user's preferred language isn't supported in user areas
  logger.debug({ 
    userLocale: userLocaleInfo.locale,
    fallbackLocale: 'en-US'
  }, 'User locale not supported in user areas, falling back to English');

  return 'en-US';
}

/**
 * Format number according to user's locale preferences
 */
export function formatNumber(
  value: number, 
  locale: Locale, 
  options?: Intl.NumberFormatOptions
): string {
  try {
    return new Intl.NumberFormat(locale, options).format(value);
  } catch (error) {
    logger.warn({ locale, value, error }, 'Error formatting number, falling back to default');
    return new Intl.NumberFormat(DEFAULT_LOCALE, options).format(value);
  }
}

/**
 * Format currency according to user's locale preferences
 */
export function formatCurrency(
  value: number, 
  locale: Locale, 
  currency: string = 'EUR'
): string {
  return formatNumber(value, locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Format date according to user's locale preferences
 */
export function formatDate(
  date: Date | string, 
  locale: Locale, 
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, options).format(dateObj);
  } catch (error) {
    logger.warn({ locale, date, error }, 'Error formatting date, falling back to default');
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(DEFAULT_LOCALE, options).format(dateObj);
  }
}

/**
 * Format relative time (e.g., "2 hours ago") according to user's locale
 */
export function formatRelativeTime(
  date: Date | string, 
  locale: Locale
): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;

    // For longer periods, just show the date
    return formatDate(dateObj, locale, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (error) {
    logger.warn({ locale, date, error }, 'Error formatting relative time');
    return 'unknown';
  }
} 