import { translationsService } from '@/lib/services/translations-service';
import { logger } from '@/lib/logger';
import type { CreateTranslationData } from '@/lib/services/translations-service';

/**
 * Essential translations seed data for Mono platform
 * Following the database-based translation system
 */
const ESSENTIAL_TRANSLATIONS: CreateTranslationData[] = [
  // Auth namespace translations
  {
    entityType: 'ui',
    entityId: 'auth', 
    languageCode: 'en-US',
    key: 'auth.signIn',
    value: 'Sign In'
  },
  {
    entityType: 'ui',
    entityId: 'auth',
    languageCode: 'en-US', 
    key: 'auth.signOut',
    value: 'Sign Out'
  },
  {
    entityType: 'ui',
    entityId: 'auth',
    languageCode: 'en-US',
    key: 'auth.email',
    value: 'Email'
  },
  {
    entityType: 'ui',
    entityId: 'auth',
    languageCode: 'en-US',
    key: 'auth.password', 
    value: 'Password'
  },
  {
    entityType: 'ui',
    entityId: 'auth',
    languageCode: 'en-US',
    key: 'auth.authentication_required',
    value: 'Authentication Required'
  },
  {
    entityType: 'ui',
    entityId: 'auth',
    languageCode: 'en-US',
    key: 'auth.sign_in_required_admin',
    value: 'Please sign in to access the admin panel.'
  },
  {
    entityType: 'ui',
    entityId: 'auth',
    languageCode: 'en-US', 
    key: 'auth.invalidCredentials',
    value: 'Invalid credentials'
  },
  {
    entityType: 'ui',
    entityId: 'auth',
    languageCode: 'en-US',
    key: 'auth.unauthorized',
    value: 'Unauthorized access'
  },

  // Admin-common namespace translations
  {
    entityType: 'ui',
    entityId: 'admin-common',
    languageCode: 'en-US',
    key: 'admin-common.navigation.dashboard',
    value: 'Dashboard'
  },
  {
    entityType: 'ui',
    entityId: 'admin-common',
    languageCode: 'en-US',
    key: 'admin-common.navigation.users',
    value: 'Users'
  },
  {
    entityType: 'ui',
    entityId: 'admin-common',
    languageCode: 'en-US',
    key: 'admin-common.navigation.tenants',
    value: 'Tenants'
  },
  {
    entityType: 'ui',
    entityId: 'admin-common',
    languageCode: 'en-US',
    key: 'admin-common.navigation.settings',
    value: 'Settings'
  },
  {
    entityType: 'ui',
    entityId: 'admin-common',
    languageCode: 'en-US',
    key: 'admin-common.navigation.preferences',
    value: 'Preferences'
  },
  {
    entityType: 'ui',
    entityId: 'admin-common',
    languageCode: 'en-US',
    key: 'admin-common.permissions.accessDenied',
    value: 'Access denied'
  },

  // Common namespace translations
  {
    entityType: 'ui',
    entityId: 'common',
    languageCode: 'en-US',
    key: 'common.loading',
    value: 'Loading...'
  },
  {
    entityType: 'ui',
    entityId: 'common',
    languageCode: 'en-US',
    key: 'common.error',
    value: 'Error'
  },
  {
    entityType: 'ui',
    entityId: 'common',
    languageCode: 'en-US',
    key: 'common.success',
    value: 'Success'
  },
  {
    entityType: 'ui',
    entityId: 'common',
    languageCode: 'en-US',
    key: 'common.cancel',
    value: 'Cancel'
  },
  {
    entityType: 'ui',
    entityId: 'common',
    languageCode: 'en-US',
    key: 'common.save',
    value: 'Save'
  }
];

/**
 * Seed essential translations for the Mono platform
 */
export async function seedTranslations() {
  try {
    logger.info('🌐 Starting translation seeding...');

    let createdCount = 0;
    let skippedCount = 0;

    for (const translationData of ESSENTIAL_TRANSLATIONS) {
      try {
        // Check if translation already exists
        const existing = await translationsService.getTranslation(
          translationData.entityType,
          translationData.entityId,
          translationData.languageCode,
          translationData.key
        );

        if (existing) {
          logger.info(`⏭️  Translation already exists: ${translationData.key}`);
          skippedCount++;
          continue;
        }

        // Create new translation
        await translationsService.createTranslation(translationData);
        logger.info(`✅ Created translation: ${translationData.key} = "${translationData.value}"`);
        createdCount++;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`❌ Failed to create translation: ${translationData.key}`, { error: errorMessage });
      }
    }

    logger.info(`🎉 Translation seeding completed!`, {
      total: ESSENTIAL_TRANSLATIONS.length,
      created: createdCount,
      skipped: skippedCount
    });

    return {
      success: true,
      created: createdCount,
      skipped: skippedCount,
      total: ESSENTIAL_TRANSLATIONS.length
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('❌ Translation seeding failed', { error: errorMessage });
    throw error;
  }
}

/**
 * Run seeding when called directly
 */
if (require.main === module) {
  seedTranslations()
    .then((result) => {
      logger.info('✅ Translation seeding completed successfully', result);
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Translation seeding failed', { error: error.message });
      process.exit(1);
    });
} 