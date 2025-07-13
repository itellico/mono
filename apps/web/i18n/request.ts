import { getRequestConfig } from 'next-intl/server';
import { DEFAULT_LOCALE, FALLBACK_LOCALE, ALL_LOCALES, type Locale } from '@/lib/i18n/config';
import { logger } from '@/lib/logger';

/**
 * Load translations from JSON files in src/locales/ directory
 * This is the proper approach for performance - database is only for translation management
 */
async function loadTranslations(locale: string): Promise<Record<string, unknown>> {
  try {
    // Import all translation namespaces for the locale
    const [
      auth,
      common,
      ui,
      api,
      adminCommon,
      adminUi,
      adminUsers,
      adminTenants,
      adminTags,
      admin,
      dashboard
    ] = await Promise.all([
      import(`../src/locales/${locale}/auth.json`).catch(() => ({})),
      import(`../src/locales/${locale}/common.json`).catch(() => ({})),
      import(`../src/locales/${locale}/ui.json`).catch(() => ({})),
      import(`../src/locales/${locale}/api.json`).catch(() => ({})),
      import(`../src/locales/${locale}/admin-common.json`).catch(() => ({})),
      import(`../src/locales/${locale}/admin-ui.json`).catch(() => ({})),
      import(`../src/locales/${locale}/admin-users.json`).catch(() => ({})),
      import(`../src/locales/${locale}/admin-tenants.json`).catch(() => ({})),
      import(`../src/locales/${locale}/admin-tags.json`).catch(() => ({})),
      import(`../src/locales/${locale}/admin.json`).catch(() => ({})),
      import(`../src/locales/${locale}/dashboard.json`).catch(() => ({}))
    ]);

    const translations = {
      auth: auth.default || auth,
      common: common.default || common,
      ui: ui.default || ui,
      api: api.default || api,
      'admin-common': adminCommon.default || adminCommon,
      'admin-ui': adminUi.default || adminUi,
      'admin-users': adminUsers.default || adminUsers,
      'admin-tenants': adminTenants.default || adminTenants,
      'admin-tags': adminTags.default || adminTags,
      admin: admin.default || admin,
      dashboard: dashboard.default || dashboard
    };

    logger.info(`✅ Loaded translations from JSON files for locale ${locale}`);
    return translations;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to load JSON translations for locale ${locale}`, { error: errorMessage });
    
    // If current locale fails and it's not the fallback, try fallback
    if (locale !== FALLBACK_LOCALE) {
      logger.warn(`Falling back to ${FALLBACK_LOCALE} for missing locale ${locale}`);
      return loadTranslations(FALLBACK_LOCALE);
    }
    
    // Return minimal fallback translations
    return {
      auth: {
        signIn: "Sign In",
        signOut: "Sign Out",
        email: "Email",
        password: "Password",
        authentication_required: "Authentication Required",
        sign_in_required_admin: "Please sign in to access the admin panel.",
        invalidCredentials: "Invalid credentials",
        unauthorized: "Unauthorized access"
      },
      'admin-common': {
        navigation: {
          dashboard: "Dashboard",
          users: "Users",
          tenants: "Tenants",
          settings: "Settings",
          preferences: "Preferences"
        },
        actions: {
          export: "Export",
          addUser: "Add User"
        },
        permissions: {
          accessDenied: "Access denied"
        }
      },
      common: {
        loading: "Loading...",
        error: "Error",
        success: "Success",
        cancel: "Cancel",
        save: "Save"
      },
      dashboard: {
        welcomeMessage: "Welcome to itellico Mono",
        needHelp: "Need Help?",
        helpDescription: "If you have any questions or need assistance, our support team is here to help."
      }
    };
  }
}

export default getRequestConfig(async ({ locale }: { locale?: string }) => {
  // Use default locale if none provided or invalid
  let currentLocale = locale || DEFAULT_LOCALE;
  
  // Validate locale against supported locales
  if (!ALL_LOCALES.includes(currentLocale as Locale)) {
    logger.warn(`Unsupported locale ${currentLocale}, falling back to ${DEFAULT_LOCALE}`);
    currentLocale = DEFAULT_LOCALE;
  }

  // Load translations from JSON files
  const messages = await loadTranslations(currentLocale);

  return {
    locale: currentLocale,
    messages
  };
});