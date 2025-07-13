import { PrismaClient } from '@prisma/client';
import seedCountriesComprehensive from './seed-countries-comprehensive.js';
import seedCurrenciesComprehensive from './seed-currencies-comprehensive.js';
import seedLanguagesComprehensive from './seed-languages-comprehensive.js';

const prisma = new PrismaClient();

/**
 * Master seeder for all international data
 * Seeds countries (with timezones), currencies, and languages
 */
export async function seedInternationalData() {
  console.log('🌍 Starting comprehensive international data seeding...\n');

  try {
    // Seed countries first (includes timezone data)
    console.log('='.repeat(60));
    console.log('STEP 1: Seeding Countries and Timezones');
    console.log('='.repeat(60));
    await seedCountriesComprehensive();
    
    console.log('\n' + '='.repeat(60));
    console.log('STEP 2: Seeding Currencies');
    console.log('='.repeat(60));
    await seedCurrenciesComprehensive();
    
    console.log('\n' + '='.repeat(60));
    console.log('STEP 3: Seeding Languages');
    console.log('='.repeat(60));
    await seedLanguagesComprehensive();

    // Create convenience views/settings
    await createConvenienceSettings();

    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL INTERNATIONAL DATA SEEDED SUCCESSFULLY!');
    console.log('='.repeat(60));

    // Display summary
    await displaySummary();

  } catch (error) {
    console.error('\n❌ Error seeding international data:', error);
    throw error;
  }
}

/**
 * Create convenience settings for quick access
 */
async function createConvenienceSettings() {
  console.log('\n⚙️  Creating convenience settings...');

  try {
    // Popular country groups
    const countryGroups = {
      'eu_countries': {
        name: 'European Union Countries',
        codes: ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 
                'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 
                'SI', 'ES', 'SE']
      },
      'g7_countries': {
        name: 'G7 Countries',
        codes: ['CA', 'FR', 'DE', 'IT', 'JP', 'GB', 'US']
      },
      'g20_countries': {
        name: 'G20 Countries',
        codes: ['AR', 'AU', 'BR', 'CA', 'CN', 'FR', 'DE', 'IN', 'ID', 'IT', 'JP', 
                'KR', 'MX', 'RU', 'SA', 'ZA', 'TR', 'GB', 'US', 'EU']
      },
      'asean_countries': {
        name: 'ASEAN Countries',
        codes: ['BN', 'KH', 'ID', 'LA', 'MY', 'MM', 'PH', 'SG', 'TH', 'VN']
      },
      'commonwealth_countries': {
        name: 'Commonwealth Countries',
        codes: ['AG', 'AU', 'BS', 'BD', 'BB', 'BZ', 'BW', 'BN', 'CM', 'CA', 'CY', 
                'DM', 'FJ', 'GM', 'GH', 'GD', 'GY', 'IN', 'JM', 'KE', 'KI', 'LS', 
                'MW', 'MY', 'MV', 'MT', 'MU', 'MZ', 'NA', 'NR', 'NZ', 'NG', 'PK', 
                'PG', 'RW', 'KN', 'LC', 'VC', 'WS', 'SC', 'SL', 'SG', 'SB', 'ZA', 
                'LK', 'SZ', 'TZ', 'TO', 'TT', 'TV', 'UG', 'GB', 'VU', 'ZM']
      }
    };

    // Store country groups
    for (const [key, group] of Object.entries(countryGroups)) {
      await prisma.setting.upsert({
        where: {
          key_tenantId: {
            key: `country_group_${key}`,
            tenantId: 0
          }
        },
        update: {
          value: JSON.stringify(group),
          type: 'json',
          category: 'platform_groups',
          description: `${group.name} member countries`,
          updatedAt: new Date()
        },
        create: {
          key: `country_group_${key}`,
          value: JSON.stringify(group),
          type: 'json',
          category: 'platform_groups',
          description: `${group.name} member countries`,
          tenantId: 0
        }
      });
    }

    // Major currency pairs
    const currencyPairs = {
      'major_pairs': ['EUR/USD', 'USD/JPY', 'GBP/USD', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD'],
      'minor_pairs': ['EUR/GBP', 'EUR/CHF', 'EUR/JPY', 'GBP/JPY', 'EUR/AUD', 'GBP/CHF', 'AUD/JPY'],
      'exotic_pairs': ['USD/SGD', 'USD/HKD', 'USD/ZAR', 'USD/MXN', 'USD/NOK', 'USD/SEK', 'USD/DKK'],
      'crypto_pairs': ['BTC/USD', 'ETH/USD', 'BTC/EUR', 'ETH/EUR']
    };

    await prisma.setting.upsert({
      where: {
        key_tenantId: {
          key: 'currency_pairs',
          tenantId: 0
        }
      },
      update: {
        value: JSON.stringify(currencyPairs),
        type: 'json',
        category: 'platform_finance',
        description: 'Major, minor, and exotic currency pairs',
        updatedAt: new Date()
      },
      create: {
        key: 'currency_pairs',
        value: JSON.stringify(currencyPairs),
        type: 'json',
        category: 'platform_finance',
        description: 'Major, minor, and exotic currency pairs',
        tenantId: 0
      }
    });

    console.log('✅ Created convenience settings');

  } catch (error) {
    console.error('❌ Error creating convenience settings:', error);
    throw error;
  }
}

/**
 * Display summary of seeded data
 */
async function displaySummary() {
  try {
    const countriesCount = await prisma.country.count();
    const currenciesCount = await prisma.currency.count();
    const languagesCount = await prisma.language.count();
    
    const settingsCount = await prisma.setting.count({
      where: { category: { in: ['platform', 'platform_groups', 'platform_finance', 'timezone_shortcuts'] } }
    });

    console.log('\n📊 SEEDING SUMMARY:');
    console.log('='.repeat(40));
    console.log(`Countries:    ${countriesCount} records`);
    console.log(`Currencies:   ${currenciesCount} records`);
    console.log(`Languages:    ${languagesCount} records`);
    console.log(`Settings:     ${settingsCount} platform settings`);
    console.log('='.repeat(40));

    // Show sample data
    const sampleCountries = await prisma.country.findMany({ take: 5, orderBy: { name: 'asc' } });
    const sampleCurrencies = await prisma.currency.findMany({ take: 5, orderBy: { code: 'asc' } });
    const sampleLanguages = await prisma.language.findMany({ take: 5, orderBy: { code: 'asc' } });

    console.log('\n📋 Sample Data:');
    console.log('\nCountries:');
    sampleCountries.forEach(c => console.log(`  ${c.code} - ${c.name} (${c.dialCode || 'No dial code'})`));
    
    console.log('\nCurrencies:');
    sampleCurrencies.forEach(c => console.log(`  ${c.code} - ${c.name} (${c.symbol || c.code})`));
    
    console.log('\nLanguages:');
    sampleLanguages.forEach(l => console.log(`  ${l.code} - ${l.name} (${l.nativeName || l.name})`));

  } catch (error) {
    console.error('Error displaying summary:', error);
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedInternationalData()
    .then(() => {
      console.log('\n✅ All international data seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ International data seeding failed:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}

export default seedInternationalData;