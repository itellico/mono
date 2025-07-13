#!/usr/bin/env tsx

/**
 * Fix Language IDs - Reset sequence to start from 1
 * This script will clear and re-insert languages with proper sequential IDs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface LanguageSeed {
  code: string;
  iso639_1: string;
  iso639_2: string;
  name: string;
  native_name: string;
  direction: 'ltr' | 'rtl';
  family: string;
  speakers: number;
  is_active: boolean;
  display_order: number;
}

const languages: LanguageSeed[] = [
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
    is_active: false,
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

async function fixLanguageIds() {
  console.log('🔧 Fixing language IDs to start from 1...\n');

  try {
    // Start a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Delete all existing languages
      await tx.language.deleteMany();
      console.log('✅ Cleared existing languages');

      // 2. Reset the sequence
      await tx.$executeRawUnsafe(`ALTER SEQUENCE languages_id_seq RESTART WITH 1;`);
      console.log('✅ Reset ID sequence to start from 1');

      // 3. Insert languages with explicit IDs
      for (let i = 0; i < languages.length; i++) {
        const lang = languages[i];
        await tx.language.create({
          data: {
            id: i + 1,  // Explicit ID starting from 1
            ...lang
          }
        });
      }
      console.log(`✅ Inserted ${languages.length} languages with sequential IDs`);

      // 4. Update sequence to continue from the last ID
      await tx.$executeRawUnsafe(`SELECT setval('languages_id_seq', ${languages.length}, true);`);
      console.log('✅ Updated sequence for future inserts');
    });

    // Verify the results
    const firstFive = await prisma.language.findMany({
      take: 5,
      orderBy: { id: 'asc' }
    });

    console.log('\n📊 Verification - First 5 languages:');
    firstFive.forEach(lang => {
      console.log(`   ID ${lang.id}: ${lang.code} - ${lang.name}`);
    });

    const count = await prisma.language.count();
    console.log(`\n✨ Success! Total languages: ${count}, IDs now start from 1`);

  } catch (error) {
    console.error('❌ Error fixing language IDs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixLanguageIds().catch(error => {
  console.error(error);
  process.exit(1);
});