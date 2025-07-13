import { PrismaClient } from '@prisma/client';
import ct from 'countries-and-timezones';
import { countries as worldCountries } from 'world-countries';

const prisma = new PrismaClient();

interface CountryData {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  timezones: string[];
  capital?: string;
  region?: string;
  subregion?: string;
  languages: string[];
  currencies: string[];
  continent?: string;
}

/**
 * Comprehensive country seeder with all metadata
 * Combines data from multiple sources for complete country information
 */
export async function seedCountriesComprehensive() {
  console.log('🌍 Starting comprehensive country seeding...');

  try {
    // Get all countries from countries-and-timezones
    const ctCountries = ct.getAllCountries();
    
    // Build comprehensive country data
    const countryDataMap = new Map<string, CountryData>();

    // Process countries-and-timezones data
    Object.entries(ctCountries).forEach(([code, country]) => {
      countryDataMap.set(code, {
        code: code,
        name: country.name,
        dialCode: '', // Will be filled from world-countries
        flag: `https://flagcdn.com/w80/${code.toLowerCase()}.png`,
        timezones: country.timezones,
        languages: [],
        currencies: []
      });
    });

    // Enhance with world-countries data
    worldCountries.forEach((country) => {
      const code = country.cca2;
      const existing = countryDataMap.get(code);
      
      if (existing) {
        // Extract dial codes
        const dialCode = country.idd.root + (country.idd.suffixes?.[0] || '');
        
        // Extract languages (ISO 639-1 codes)
        const languages = Object.keys(country.languages || {});
        
        // Extract currencies (ISO 4217 codes)
        const currencies = Object.keys(country.currencies || {});
        
        // Update country data
        countryDataMap.set(code, {
          ...existing,
          dialCode: dialCode || existing.dialCode,
          capital: country.capital?.[0],
          region: country.region,
          subregion: country.subregion,
          languages: languages,
          currencies: currencies,
          continent: country.continents?.[0]
        });
      } else {
        // Add new country not in countries-and-timezones
        const dialCode = country.idd.root + (country.idd.suffixes?.[0] || '');
        
        countryDataMap.set(code, {
          code: code,
          name: country.name.common,
          dialCode: dialCode || '',
          flag: `https://flagcdn.com/w80/${code.toLowerCase()}.png`,
          timezones: [], // No timezone data from this source
          capital: country.capital?.[0],
          region: country.region,
          subregion: country.subregion,
          languages: Object.keys(country.languages || {}),
          currencies: Object.keys(country.currencies || {}),
          continent: country.continents?.[0]
        });
      }
    });

    // Additional dial codes for countries that might be missing
    const additionalDialCodes: Record<string, string> = {
      'US': '+1',
      'CA': '+1',
      'GB': '+44',
      'FR': '+33',
      'DE': '+49',
      'JP': '+81',
      'CN': '+86',
      'IN': '+91',
      'BR': '+55',
      'RU': '+7',
      'AU': '+61',
      'MX': '+52',
      'ES': '+34',
      'IT': '+39',
      'KR': '+82',
      'NL': '+31',
      'CH': '+41',
      'SE': '+46',
      'NO': '+47',
      'DK': '+45',
      'FI': '+358',
      'PL': '+48',
      'AT': '+43',
      'BE': '+32',
      'GR': '+30',
      'PT': '+351',
      'CZ': '+420',
      'HU': '+36',
      'IE': '+353',
      'RO': '+40',
      'IL': '+972',
      'AE': '+971',
      'SA': '+966',
      'ZA': '+27',
      'EG': '+20',
      'NG': '+234',
      'KE': '+254',
      'AR': '+54',
      'CL': '+56',
      'CO': '+57',
      'PE': '+51',
      'VE': '+58',
      'MY': '+60',
      'SG': '+65',
      'TH': '+66',
      'ID': '+62',
      'PH': '+63',
      'VN': '+84',
      'PK': '+92',
      'BD': '+880',
      'TR': '+90',
      'UA': '+380',
      'NZ': '+64',
      'HK': '+852',
      'TW': '+886'
    };

    // Apply additional dial codes
    Object.entries(additionalDialCodes).forEach(([code, dialCode]) => {
      const country = countryDataMap.get(code);
      if (country && !country.dialCode) {
        country.dialCode = dialCode;
      }
    });

    // Convert to array and sort by name
    const countriesToSeed = Array.from(countryDataMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));

    // Delete existing countries
    await prisma.country.deleteMany();
    console.log('🗑️  Deleted existing countries');

    // Seed countries in batches
    const batchSize = 50;
    let seededCount = 0;

    for (let i = 0; i < countriesToSeed.length; i += batchSize) {
      const batch = countriesToSeed.slice(i, i + batchSize);
      
      await prisma.country.createMany({
        data: batch.map(country => ({
          code: country.code,
          name: country.name,
          dialCode: country.dialCode || null,
          isActive: true
        }))
      });

      seededCount += batch.length;
      console.log(`✅ Seeded ${seededCount}/${countriesToSeed.length} countries`);
    }

    // Store extended country metadata
    await storeCountryMetadata(countriesToSeed);
    
    // Create timezone reference data
    await seedTimezoneData();

    console.log('🎉 Country seeding completed successfully!');
    console.log(`📊 Total countries seeded: ${seededCount}`);
    
    // Display some statistics
    const countriesWithTimezones = countriesToSeed.filter(c => c.timezones.length > 0);
    const countriesWithDialCodes = countriesToSeed.filter(c => c.dialCode);
    const countriesWithMultipleTimezones = countriesToSeed.filter(c => c.timezones.length > 1);
    
    console.log(`⏰ Countries with timezone data: ${countriesWithTimezones.length}`);
    console.log(`📞 Countries with dial codes: ${countriesWithDialCodes.length}`);
    console.log(`🌐 Countries with multiple timezones: ${countriesWithMultipleTimezones.length}`);
    
    // List countries with multiple timezones
    console.log('\n🌐 Countries with multiple timezones:');
    countriesWithMultipleTimezones
      .sort((a, b) => b.timezones.length - a.timezones.length)
      .slice(0, 10)
      .forEach(country => {
        console.log(`   ${country.name} (${country.code}): ${country.timezones.length} timezones`);
      });

  } catch (error) {
    console.error('❌ Error seeding countries:', error);
    throw error;
  }
}

/**
 * Store extended country metadata as settings
 * Includes timezones, currencies, languages, and other country-specific data
 */
async function storeCountryMetadata(countries: CountryData[]) {
  console.log('\n🌏 Storing extended country metadata...');

  try {
    // Create a comprehensive metadata object
    const countryMetadata = countries.reduce((acc, country) => {
      acc[country.code] = {
        timezones: country.timezones,
        capital: country.capital,
        region: country.region,
        subregion: country.subregion,
        continent: country.continent,
        languages: country.languages,
        currencies: country.currencies,
        flag: country.flag
      };
      return acc;
    }, {} as Record<string, any>);

    // Store as platform setting
    await prisma.setting.upsert({
      where: {
        key_tenantId: {
          key: 'platform_country_metadata',
          tenantId: 0 // Platform-level setting
        }
      },
      update: {
        value: JSON.stringify(countryMetadata),
        type: 'json',
        category: 'platform',
        description: 'Extended country metadata including timezones, currencies, and languages',
        updatedAt: new Date()
      },
      create: {
        key: 'platform_country_metadata',
        value: JSON.stringify(countryMetadata),
        type: 'json',
        category: 'platform',
        description: 'Extended country metadata including timezones, currencies, and languages',
        tenantId: 0
      }
    });

    console.log(`✅ Stored metadata for ${countries.length} countries`);

  } catch (error) {
    console.error('❌ Error storing country metadata:', error);
    throw error;
  }
}

/**
 * Seed timezone reference data as settings
 * Stores all available timezones with their metadata
 */
async function seedTimezoneData() {
  console.log('\n⏰ Seeding timezone reference data...');

  try {
    const allTimezones = ct.getAllTimezones();
    const timezoneData = Object.entries(allTimezones).map(([tzName, tz]) => ({
      name: tzName,
      countries: tz.countries,
      utcOffset: tz.utcOffset,
      utcOffsetStr: tz.utcOffsetStr,
      dstOffset: tz.dstOffset,
      dstOffsetStr: tz.dstOffsetStr,
      aliasOf: tz.aliasOf || null
    }));

    // Store timezone data as a platform setting
    await prisma.setting.upsert({
      where: {
        key_tenantId: {
          key: 'platform_timezones',
          tenantId: 0 // Platform-level setting
        }
      },
      update: {
        value: JSON.stringify(timezoneData),
        type: 'json',
        category: 'platform',
        description: 'Complete timezone reference data',
        updatedAt: new Date()
      },
      create: {
        key: 'platform_timezones',
        value: JSON.stringify(timezoneData),
        type: 'json',
        category: 'platform',
        description: 'Complete timezone reference data',
        tenantId: 0 // Platform-level setting
      }
    });

    console.log(`✅ Stored ${timezoneData.length} timezone definitions`);

    // Create common timezone shortcuts
    const commonTimezones = [
      { key: 'tz_utc', name: 'UTC', value: 'UTC' },
      { key: 'tz_eastern', name: 'Eastern Time', value: 'America/New_York' },
      { key: 'tz_central', name: 'Central Time', value: 'America/Chicago' },
      { key: 'tz_mountain', name: 'Mountain Time', value: 'America/Denver' },
      { key: 'tz_pacific', name: 'Pacific Time', value: 'America/Los_Angeles' },
      { key: 'tz_london', name: 'London', value: 'Europe/London' },
      { key: 'tz_paris', name: 'Paris', value: 'Europe/Paris' },
      { key: 'tz_berlin', name: 'Berlin', value: 'Europe/Berlin' },
      { key: 'tz_moscow', name: 'Moscow', value: 'Europe/Moscow' },
      { key: 'tz_dubai', name: 'Dubai', value: 'Asia/Dubai' },
      { key: 'tz_india', name: 'India', value: 'Asia/Kolkata' },
      { key: 'tz_singapore', name: 'Singapore', value: 'Asia/Singapore' },
      { key: 'tz_tokyo', name: 'Tokyo', value: 'Asia/Tokyo' },
      { key: 'tz_sydney', name: 'Sydney', value: 'Australia/Sydney' },
      { key: 'tz_auckland', name: 'Auckland', value: 'Pacific/Auckland' }
    ];

    for (const tz of commonTimezones) {
      await prisma.setting.upsert({
        where: {
          key_tenantId: {
            key: tz.key,
            tenantId: 0
          }
        },
        update: {
          value: tz.value,
          type: 'string',
          category: 'timezone_shortcuts',
          description: `Common timezone: ${tz.name}`,
          updatedAt: new Date()
        },
        create: {
          key: tz.key,
          value: tz.value,
          type: 'string',
          category: 'timezone_shortcuts',
          description: `Common timezone: ${tz.name}`,
          tenantId: 0
        }
      });
    }

    console.log(`✅ Created ${commonTimezones.length} timezone shortcuts`);

  } catch (error) {
    console.error('❌ Error seeding timezone data:', error);
    throw error;
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedCountriesComprehensive()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}

export default seedCountriesComprehensive;