#!/usr/bin/env tsx

/**
 * Language Seeder - Regional Variants
 * Seeds the languages table with full locale codes for proper i18n support
 * Matches frontend locale system from /apps/web/src/lib/i18n/config.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface LanguageSeed {
  code: string;          // Full locale code (e.g., en-US)
  iso639_1: string;      // Two-letter ISO code
  iso639_2: string;      // Three-letter ISO code
  name: string;          // English name with region
  native_name: string;   // Native name with region
  direction: 'ltr' | 'rtl';
  family: string;
  speakers: number;
  is_active: boolean;
  display_order: number;
}

const languages: LanguageSeed[] = [
  // ========== ACTIVE LANGUAGES (Phase 1-2) ==========
  // English variants - Primary markets
  {
    code: 'en-US',
    iso639_1: 'en',
    iso639_2: 'eng',
    name: 'English (United States)',
    native_name: 'English (United States)',
    direction: 'ltr',
    family: 'Germanic',
    speakers: 330000000,
    is_active: true,
    display_order: 1
  },
  {
    code: 'en-GB',
    iso639_1: 'en',
    iso639_2: 'eng',
    name: 'English (United Kingdom)',
    native_name: 'English (United Kingdom)',
    direction: 'ltr',
    family: 'Germanic',
    speakers: 67000000,
    is_active: true,
    display_order: 2
  },
  {
    code: 'en-CA',
    iso639_1: 'en',
    iso639_2: 'eng',
    name: 'English (Canada)',
    native_name: 'English (Canada)',
    direction: 'ltr',
    family: 'Germanic',
    speakers: 20000000,
    is_active: true,
    display_order: 3
  },
  {
    code: 'en-AU',
    iso639_1: 'en',
    iso639_2: 'eng',
    name: 'English (Australia)',
    native_name: 'English (Australia)',
    direction: 'ltr',
    family: 'Germanic',
    speakers: 25000000,
    is_active: true,
    display_order: 4
  },

  // German variants - Core European markets
  {
    code: 'de-DE',
    iso639_1: 'de',
    iso639_2: 'deu',
    name: 'German (Germany)',
    native_name: 'Deutsch (Deutschland)',
    direction: 'ltr',
    family: 'Germanic',
    speakers: 83000000,
    is_active: true,
    display_order: 10
  },
  {
    code: 'de-AT',
    iso639_1: 'de',
    iso639_2: 'deu',
    name: 'German (Austria)',
    native_name: 'Deutsch (Österreich)',
    direction: 'ltr',
    family: 'Germanic',
    speakers: 9000000,
    is_active: true,
    display_order: 11
  },
  {
    code: 'de-CH',
    iso639_1: 'de',
    iso639_2: 'deu',
    name: 'German (Switzerland)',
    native_name: 'Deutsch (Schweiz)',
    direction: 'ltr',
    family: 'Germanic',
    speakers: 5000000,
    is_active: true,
    display_order: 12
  },

  // ========== PHASE 3 LANGUAGES (Currently inactive) ==========
  // French variants
  {
    code: 'fr-FR',
    iso639_1: 'fr',
    iso639_2: 'fra',
    name: 'French (France)',
    native_name: 'Français (France)',
    direction: 'ltr',
    family: 'Romance',
    speakers: 67000000,
    is_active: false,  // Activate in Phase 3
    display_order: 20
  },
  {
    code: 'fr-CA',
    iso639_1: 'fr',
    iso639_2: 'fra',
    name: 'French (Canada)',
    native_name: 'Français (Canada)',
    direction: 'ltr',
    family: 'Romance',
    speakers: 10000000,
    is_active: false,
    display_order: 21
  },
  {
    code: 'fr-CH',
    iso639_1: 'fr',
    iso639_2: 'fra',
    name: 'French (Switzerland)',
    native_name: 'Français (Suisse)',
    direction: 'ltr',
    family: 'Romance',
    speakers: 2000000,
    is_active: false,
    display_order: 22
  },

  // Spanish variants
  {
    code: 'es-ES',
    iso639_1: 'es',
    iso639_2: 'spa',
    name: 'Spanish (Spain)',
    native_name: 'Español (España)',
    direction: 'ltr',
    family: 'Romance',
    speakers: 47000000,
    is_active: false,
    display_order: 30
  },
  {
    code: 'es-MX',
    iso639_1: 'es',
    iso639_2: 'spa',
    name: 'Spanish (Mexico)',
    native_name: 'Español (México)',
    direction: 'ltr',
    family: 'Romance',
    speakers: 130000000,
    is_active: false,
    display_order: 31
  },
  {
    code: 'es-AR',
    iso639_1: 'es',
    iso639_2: 'spa',
    name: 'Spanish (Argentina)',
    native_name: 'Español (Argentina)',
    direction: 'ltr',
    family: 'Romance',
    speakers: 45000000,
    is_active: false,
    display_order: 32
  },

  // Portuguese variants
  {
    code: 'pt-BR',
    iso639_1: 'pt',
    iso639_2: 'por',
    name: 'Portuguese (Brazil)',
    native_name: 'Português (Brasil)',
    direction: 'ltr',
    family: 'Romance',
    speakers: 215000000,
    is_active: false,
    display_order: 40
  },
  {
    code: 'pt-PT',
    iso639_1: 'pt',
    iso639_2: 'por',
    name: 'Portuguese (Portugal)',
    native_name: 'Português (Portugal)',
    direction: 'ltr',
    family: 'Romance',
    speakers: 10000000,
    is_active: false,
    display_order: 41
  },

  // Other European languages
  {
    code: 'it-IT',
    iso639_1: 'it',
    iso639_2: 'ita',
    name: 'Italian (Italy)',
    native_name: 'Italiano (Italia)',
    direction: 'ltr',
    family: 'Romance',
    speakers: 65000000,
    is_active: false,
    display_order: 50
  },
  {
    code: 'nl-NL',
    iso639_1: 'nl',
    iso639_2: 'nld',
    name: 'Dutch (Netherlands)',
    native_name: 'Nederlands (Nederland)',
    direction: 'ltr',
    family: 'Germanic',
    speakers: 24000000,
    is_active: false,
    display_order: 60
  },

  // Nordic languages
  {
    code: 'sv-SE',
    iso639_1: 'sv',
    iso639_2: 'swe',
    name: 'Swedish (Sweden)',
    native_name: 'Svenska (Sverige)',
    direction: 'ltr',
    family: 'Germanic',
    speakers: 10000000,
    is_active: false,
    display_order: 70
  },
  {
    code: 'da-DK',
    iso639_1: 'da',
    iso639_2: 'dan',
    name: 'Danish (Denmark)',
    native_name: 'Dansk (Danmark)',
    direction: 'ltr',
    family: 'Germanic',
    speakers: 6000000,
    is_active: false,
    display_order: 71
  },
  {
    code: 'no-NO',
    iso639_1: 'no',
    iso639_2: 'nor',
    name: 'Norwegian (Norway)',
    native_name: 'Norsk (Norge)',
    direction: 'ltr',
    family: 'Germanic',
    speakers: 5000000,
    is_active: false,
    display_order: 72
  },
  {
    code: 'fi-FI',
    iso639_1: 'fi',
    iso639_2: 'fin',
    name: 'Finnish (Finland)',
    native_name: 'Suomi (Suomi)',
    direction: 'ltr',
    family: 'Uralic',
    speakers: 5500000,
    is_active: false,
    display_order: 73
  },

  // Eastern European
  {
    code: 'pl-PL',
    iso639_1: 'pl',
    iso639_2: 'pol',
    name: 'Polish (Poland)',
    native_name: 'Polski (Polska)',
    direction: 'ltr',
    family: 'Slavic',
    speakers: 40000000,
    is_active: false,
    display_order: 80
  }
];

async function seedLanguages() {
  console.log('🌍 Seeding languages with regional variants...\n');

  try {
    // Clear existing languages
    await prisma.language.deleteMany();
    console.log('✅ Cleared existing languages');

    // Insert new languages
    const result = await prisma.language.createMany({
      data: languages,
      skipDuplicates: true
    });

    console.log(`✅ Inserted ${result.count} languages`);

    // Display summary
    const activeCount = languages.filter(l => l.is_active).length;
    const inactiveCount = languages.filter(l => !l.is_active).length;

    console.log('\n📊 Summary:');
    console.log(`   Active languages: ${activeCount}`);
    console.log(`   Inactive languages (Phase 3): ${inactiveCount}`);
    console.log(`   Total languages: ${languages.length}`);

    // Show active languages
    console.log('\n🟢 Active Languages:');
    languages
      .filter(l => l.is_active)
      .forEach(l => console.log(`   - ${l.code}: ${l.name}`));

    console.log('\n✨ Language seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding languages:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
seedLanguages().catch(error => {
  console.error(error);
  process.exit(1);
});