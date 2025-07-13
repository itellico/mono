import { PrismaClient } from '@prisma/client';
import ct from 'countries-and-timezones';
import { countries as worldCountries } from 'world-countries';

const prisma = new PrismaClient();

interface CountryData {
  code: string;
  alpha3: string;
  name: string;
  nativeName?: string;
  phoneCode: string;
  flagEmoji: string;
  region?: string;
  subregion?: string;
  isActive: boolean;
}

interface LanguageData {
  code: string;
  iso639_1?: string;
  iso639_2?: string;
  name: string;
  nativeName?: string;
  direction: string;
  family?: string;
  speakers?: number;
  isActive: boolean;
}

interface TimezoneData {
  name: string;
  label: string;
  region?: string;
  city?: string;
  utcOffset: number;
  dstOffset?: number;
  hasDst: boolean;
  abbreviation?: string;
  isActive: boolean;
}

interface CurrencyData {
  code: string;
  numericCode?: string;
  name: string;
  symbol?: string;
  symbolPosition: string;
  decimalPlaces: number;
  decimalSeparator: string;
  thousandsSeparator: string;
  isActive: boolean;
}

/**
 * Comprehensive international reference data seeder
 * Seeds Countries, Languages, Timezones, and Currencies following NestJS best practices
 * Uses integer primary keys and ISO standards compliance
 */
export async function seedInternationalDataComprehensive() {
  console.log('🌍 Starting comprehensive international data seeding...');
  console.log('📊 Target: Countries, Languages, Timezones, Currencies');

  try {
    // Seed all reference data in order
    await seedCountries();
    await seedLanguages();
    await seedTimezones();
    await seedCurrencies();

    console.log('🎉 International data seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding international data:', error);
    throw error;
  }
}

/**
 * Seed Countries with ISO 3166-1 compliance
 */
async function seedCountries() {
  console.log('\n🌍 Seeding countries...');

  try {
    // Get all countries from both sources
    const ctCountries = ct.getAllCountries();
    const countryDataMap = new Map<string, CountryData>();

    // Process countries-and-timezones data first
    Object.entries(ctCountries).forEach(([code, country]) => {
      countryDataMap.set(code, {
        code: code,
        alpha3: '', // Will be filled from world-countries
        name: country.name,
        phoneCode: '',
        flagEmoji: getCountryFlagEmoji(code),
        region: '',
        subregion: '',
        isActive: true
      });
    });

    // Enhance with world-countries data for complete ISO compliance
    if (worldCountries && Array.isArray(worldCountries)) {
      worldCountries.forEach((country) => {
        const code = country.cca2;
        const alpha3 = country.cca3;
        const phoneCode = country.idd.root + (country.idd.suffixes?.[0] || '');
      
      const existing = countryDataMap.get(code);
      if (existing) {
        // Update existing
        countryDataMap.set(code, {
          ...existing,
          alpha3: alpha3,
          nativeName: country.name.native ? Object.values(country.name.native)[0]?.common : undefined,
          phoneCode: phoneCode || existing.phoneCode,
          region: country.region,
          subregion: country.subregion
        });
      } else {
        // Add new country
        countryDataMap.set(code, {
          code: code,
          alpha3: alpha3,
          name: country.name.common,
          nativeName: country.name.native ? Object.values(country.name.native)[0]?.common : undefined,
          phoneCode: phoneCode,
          flagEmoji: getCountryFlagEmoji(code),
          region: country.region,
          subregion: country.subregion,
          isActive: true
        });
      }
    });
    }

    // Ensure popular countries have proper phone codes
    const phoneCodeFixes: Record<string, string> = {
      'US': '+1', 'CA': '+1', 'GB': '+44', 'FR': '+33', 'DE': '+49',
      'JP': '+81', 'CN': '+86', 'IN': '+91', 'BR': '+55', 'RU': '+7',
      'AU': '+61', 'MX': '+52', 'ES': '+34', 'IT': '+39', 'KR': '+82',
      'NL': '+31', 'CH': '+41', 'SE': '+46', 'NO': '+47', 'DK': '+45',
      'AT': '+43', 'BE': '+32', 'SG': '+65', 'HK': '+852', 'TW': '+886'
    };

    Object.entries(phoneCodeFixes).forEach(([code, phoneCode]) => {
      const country = countryDataMap.get(code);
      if (country && !country.phoneCode) {
        country.phoneCode = phoneCode;
      }
    });

    const countriesToSeed = Array.from(countryDataMap.values())
      .filter(country => country.name && country.code)
      .sort((a, b) => a.name.localeCompare(b.name));

    // Clear existing data
    await prisma.country.deleteMany();
    console.log('🗑️  Cleared existing countries');

    // Batch insert for performance
    const batchSize = 50;
    let seededCount = 0;

    for (let i = 0; i < countriesToSeed.length; i += batchSize) {
      const batch = countriesToSeed.slice(i, i + batchSize);
      
      await prisma.country.createMany({
        data: batch.map((country, index) => ({
          code: country.code,
          alpha3: country.alpha3 || country.code + 'X', // Fallback for missing alpha3
          name: country.name,
          native_name: country.nativeName,
          phone_code: country.phoneCode || null,
          flag_emoji: country.flagEmoji,
          region: country.region,
          subregion: country.subregion,
          is_active: country.isActive,
          display_order: i + index
        }))
      });

      seededCount += batch.length;
      console.log(`✅ Seeded ${seededCount}/${countriesToSeed.length} countries`);
    }

    console.log(`🎉 Countries seeded: ${seededCount} total`);

  } catch (error) {
    console.error('❌ Error seeding countries:', error);
    throw error;
  }
}

/**
 * Seed Languages with ISO 639 compliance
 */
async function seedLanguages() {
  console.log('\n🗣️ Seeding languages...');

  try {
    const languagesToSeed: LanguageData[] = [
      // Major world languages with comprehensive data
      { code: 'en', iso639_1: 'en', iso639_2: 'eng', name: 'English', nativeName: 'English', direction: 'ltr', family: 'Germanic', speakers: 1500000000, isActive: true },
      { code: 'zh', iso639_1: 'zh', iso639_2: 'chi', name: 'Chinese', nativeName: '中文', direction: 'ltr', family: 'Sino-Tibetan', speakers: 1300000000, isActive: true },
      { code: 'hi', iso639_1: 'hi', iso639_2: 'hin', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr', family: 'Indo-European', speakers: 600000000, isActive: true },
      { code: 'es', iso639_1: 'es', iso639_2: 'spa', name: 'Spanish', nativeName: 'Español', direction: 'ltr', family: 'Romance', speakers: 500000000, isActive: true },
      { code: 'fr', iso639_1: 'fr', iso639_2: 'fra', name: 'French', nativeName: 'Français', direction: 'ltr', family: 'Romance', speakers: 280000000, isActive: true },
      { code: 'ar', iso639_1: 'ar', iso639_2: 'ara', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', family: 'Semitic', speakers: 400000000, isActive: true },
      { code: 'bn', iso639_1: 'bn', iso639_2: 'ben', name: 'Bengali', nativeName: 'বাংলা', direction: 'ltr', family: 'Indo-European', speakers: 300000000, isActive: true },
      { code: 'ru', iso639_1: 'ru', iso639_2: 'rus', name: 'Russian', nativeName: 'Русский', direction: 'ltr', family: 'Slavic', speakers: 260000000, isActive: true },
      { code: 'pt', iso639_1: 'pt', iso639_2: 'por', name: 'Portuguese', nativeName: 'Português', direction: 'ltr', family: 'Romance', speakers: 260000000, isActive: true },
      { code: 'id', iso639_1: 'id', iso639_2: 'ind', name: 'Indonesian', nativeName: 'Bahasa Indonesia', direction: 'ltr', family: 'Austronesian', speakers: 230000000, isActive: true },
      { code: 'ur', iso639_1: 'ur', iso639_2: 'urd', name: 'Urdu', nativeName: 'اردو', direction: 'rtl', family: 'Indo-European', speakers: 170000000, isActive: true },
      { code: 'de', iso639_1: 'de', iso639_2: 'deu', name: 'German', nativeName: 'Deutsch', direction: 'ltr', family: 'Germanic', speakers: 130000000, isActive: true },
      { code: 'ja', iso639_1: 'ja', iso639_2: 'jpn', name: 'Japanese', nativeName: '日本語', direction: 'ltr', family: 'Japonic', speakers: 125000000, isActive: true },
      { code: 'sw', iso639_1: 'sw', iso639_2: 'swa', name: 'Swahili', nativeName: 'Kiswahili', direction: 'ltr', family: 'Niger-Congo', speakers: 100000000, isActive: true },
      { code: 'mr', iso639_1: 'mr', iso639_2: 'mar', name: 'Marathi', nativeName: 'मराठी', direction: 'ltr', family: 'Indo-European', speakers: 95000000, isActive: true },
      { code: 'te', iso639_1: 'te', iso639_2: 'tel', name: 'Telugu', nativeName: 'తెలుగు', direction: 'ltr', family: 'Dravidian', speakers: 95000000, isActive: true },
      { code: 'tr', iso639_1: 'tr', iso639_2: 'tur', name: 'Turkish', nativeName: 'Türkçe', direction: 'ltr', family: 'Turkic', speakers: 88000000, isActive: true },
      { code: 'ta', iso639_1: 'ta', iso639_2: 'tam', name: 'Tamil', nativeName: 'தமிழ்', direction: 'ltr', family: 'Dravidian', speakers: 78000000, isActive: true },
      { code: 'ko', iso639_1: 'ko', iso639_2: 'kor', name: 'Korean', nativeName: '한국어', direction: 'ltr', family: 'Koreanic', speakers: 77000000, isActive: true },
      { code: 'vi', iso639_1: 'vi', iso639_2: 'vie', name: 'Vietnamese', nativeName: 'Tiếng Việt', direction: 'ltr', family: 'Austroasiatic', speakers: 76000000, isActive: true },

      // European languages
      { code: 'it', iso639_1: 'it', iso639_2: 'ita', name: 'Italian', nativeName: 'Italiano', direction: 'ltr', family: 'Romance', speakers: 65000000, isActive: true },
      { code: 'uk', iso639_1: 'uk', iso639_2: 'ukr', name: 'Ukrainian', nativeName: 'Українська', direction: 'ltr', family: 'Slavic', speakers: 40000000, isActive: true },
      { code: 'pl', iso639_1: 'pl', iso639_2: 'pol', name: 'Polish', nativeName: 'Polski', direction: 'ltr', family: 'Slavic', speakers: 40000000, isActive: true },
      { code: 'nl', iso639_1: 'nl', iso639_2: 'nld', name: 'Dutch', nativeName: 'Nederlands', direction: 'ltr', family: 'Germanic', speakers: 23000000, isActive: true },
      { code: 'ro', iso639_1: 'ro', iso639_2: 'ron', name: 'Romanian', nativeName: 'Română', direction: 'ltr', family: 'Romance', speakers: 22000000, isActive: true },
      { code: 'el', iso639_1: 'el', iso639_2: 'ell', name: 'Greek', nativeName: 'Ελληνικά', direction: 'ltr', family: 'Hellenic', speakers: 13000000, isActive: true },
      { code: 'cs', iso639_1: 'cs', iso639_2: 'ces', name: 'Czech', nativeName: 'Čeština', direction: 'ltr', family: 'Slavic', speakers: 10000000, isActive: true },
      { code: 'hu', iso639_1: 'hu', iso639_2: 'hun', name: 'Hungarian', nativeName: 'Magyar', direction: 'ltr', family: 'Uralic', speakers: 9000000, isActive: true },
      { code: 'sv', iso639_1: 'sv', iso639_2: 'swe', name: 'Swedish', nativeName: 'Svenska', direction: 'ltr', family: 'Germanic', speakers: 9000000, isActive: true },
      { code: 'bg', iso639_1: 'bg', iso639_2: 'bul', name: 'Bulgarian', nativeName: 'Български', direction: 'ltr', family: 'Slavic', speakers: 8000000, isActive: true },
      { code: 'da', iso639_1: 'da', iso639_2: 'dan', name: 'Danish', nativeName: 'Dansk', direction: 'ltr', family: 'Germanic', speakers: 6000000, isActive: true },
      { code: 'fi', iso639_1: 'fi', iso639_2: 'fin', name: 'Finnish', nativeName: 'Suomi', direction: 'ltr', family: 'Uralic', speakers: 5000000, isActive: true },
      { code: 'no', iso639_1: 'no', iso639_2: 'nor', name: 'Norwegian', nativeName: 'Norsk', direction: 'ltr', family: 'Germanic', speakers: 5000000, isActive: true },
      { code: 'sk', iso639_1: 'sk', iso639_2: 'slk', name: 'Slovak', nativeName: 'Slovenčina', direction: 'ltr', family: 'Slavic', speakers: 5000000, isActive: true },

      // Locale variants for common regions
      { code: 'en-US', iso639_1: 'en', iso639_2: 'eng', name: 'English (US)', nativeName: 'English (US)', direction: 'ltr', family: 'Germanic', isActive: true },
      { code: 'en-GB', iso639_1: 'en', iso639_2: 'eng', name: 'English (UK)', nativeName: 'English (UK)', direction: 'ltr', family: 'Germanic', isActive: true },
      { code: 'en-CA', iso639_1: 'en', iso639_2: 'eng', name: 'English (Canada)', nativeName: 'English (Canada)', direction: 'ltr', family: 'Germanic', isActive: true },
      { code: 'en-AU', iso639_1: 'en', iso639_2: 'eng', name: 'English (Australia)', nativeName: 'English (Australia)', direction: 'ltr', family: 'Germanic', isActive: true },
      { code: 'fr-FR', iso639_1: 'fr', iso639_2: 'fra', name: 'French (France)', nativeName: 'Français (France)', direction: 'ltr', family: 'Romance', isActive: true },
      { code: 'fr-CA', iso639_1: 'fr', iso639_2: 'fra', name: 'French (Canada)', nativeName: 'Français (Canada)', direction: 'ltr', family: 'Romance', isActive: true },
      { code: 'de-DE', iso639_1: 'de', iso639_2: 'deu', name: 'German (Germany)', nativeName: 'Deutsch (Deutschland)', direction: 'ltr', family: 'Germanic', isActive: true },
      { code: 'de-AT', iso639_1: 'de', iso639_2: 'deu', name: 'German (Austria)', nativeName: 'Deutsch (Österreich)', direction: 'ltr', family: 'Germanic', isActive: true },
      { code: 'de-CH', iso639_1: 'de', iso639_2: 'deu', name: 'German (Switzerland)', nativeName: 'Deutsch (Schweiz)', direction: 'ltr', family: 'Germanic', isActive: true },
      { code: 'es-ES', iso639_1: 'es', iso639_2: 'spa', name: 'Spanish (Spain)', nativeName: 'Español (España)', direction: 'ltr', family: 'Romance', isActive: true },
      { code: 'es-MX', iso639_1: 'es', iso639_2: 'spa', name: 'Spanish (Mexico)', nativeName: 'Español (México)', direction: 'ltr', family: 'Romance', isActive: true },
      { code: 'es-AR', iso639_1: 'es', iso639_2: 'spa', name: 'Spanish (Argentina)', nativeName: 'Español (Argentina)', direction: 'ltr', family: 'Romance', isActive: true },
      { code: 'pt-BR', iso639_1: 'pt', iso639_2: 'por', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', direction: 'ltr', family: 'Romance', isActive: true },
      { code: 'pt-PT', iso639_1: 'pt', iso639_2: 'por', name: 'Portuguese (Portugal)', nativeName: 'Português (Portugal)', direction: 'ltr', family: 'Romance', isActive: true },
      { code: 'zh-CN', iso639_1: 'zh', iso639_2: 'chi', name: 'Chinese (Simplified)', nativeName: '中文 (简体)', direction: 'ltr', family: 'Sino-Tibetan', isActive: true },
      { code: 'zh-TW', iso639_1: 'zh', iso639_2: 'chi', name: 'Chinese (Traditional)', nativeName: '中文 (繁體)', direction: 'ltr', family: 'Sino-Tibetan', isActive: true }
    ];

    // Clear existing data
    await prisma.language.deleteMany();
    console.log('🗑️  Cleared existing languages');

    // Batch insert
    const batchSize = 30;
    let seededCount = 0;

    for (let i = 0; i < languagesToSeed.length; i += batchSize) {
      const batch = languagesToSeed.slice(i, i + batchSize);
      
      await prisma.language.createMany({
        data: batch.map((lang, index) => ({
          code: lang.code,
          iso639_1: lang.iso639_1,
          iso639_2: lang.iso639_2,
          name: lang.name,
          native_name: lang.nativeName,
          direction: lang.direction,
          family: lang.family,
          speakers: lang.speakers,
          is_active: lang.isActive,
          display_order: i + index
        }))
      });

      seededCount += batch.length;
      console.log(`✅ Seeded ${seededCount}/${languagesToSeed.length} languages`);
    }

    console.log(`🎉 Languages seeded: ${seededCount} total`);

  } catch (error) {
    console.error('❌ Error seeding languages:', error);
    throw error;
  }
}

/**
 * Seed Timezones with IANA compliance
 */
async function seedTimezones() {
  console.log('\n⏰ Seeding timezones...');

  try {
    const allTimezones = ct.getAllTimezones();
    const timezonesToSeed: TimezoneData[] = [];

    // Process IANA timezone data
    Object.entries(allTimezones).forEach(([tzName, tzData]) => {
      if (tzData.aliasOf) return; // Skip aliases, only include canonical zones

      const utcOffsetMinutes = tzData.utcOffset * 60; // Convert hours to minutes
      const dstOffsetMinutes = tzData.dstOffset ? tzData.dstOffset * 60 : undefined;
      
      // Parse timezone name for region and city
      const parts = tzName.split('/');
      const region = parts[0];
      const city = parts[1]?.replace(/_/g, ' ');
      
      // Create human-readable label
      const offsetHours = Math.floor(Math.abs(utcOffsetMinutes) / 60);
      const offsetMins = Math.abs(utcOffsetMinutes) % 60;
      const offsetSign = utcOffsetMinutes >= 0 ? '+' : '-';
      const offsetStr = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMins.toString().padStart(2, '0')}`;
      const label = `(UTC${offsetStr}) ${city || tzName}`;

      timezonesToSeed.push({
        name: tzName,
        label: label,
        region: region,
        city: city,
        utcOffset: utcOffsetMinutes,
        dstOffset: dstOffsetMinutes,
        hasDst: tzData.dstOffset !== undefined && tzData.dstOffset !== 0,
        abbreviation: undefined, // Could be enhanced with timezone abbreviations
        isActive: true
      });
    });

    // Sort by UTC offset, then by name
    timezonesToSeed.sort((a, b) => {
      if (a.utcOffset !== b.utcOffset) {
        return a.utcOffset - b.utcOffset;
      }
      return a.name.localeCompare(b.name);
    });

    // Clear existing data
    await prisma.timezone.deleteMany();
    console.log('🗑️  Cleared existing timezones');

    // Batch insert
    const batchSize = 50;
    let seededCount = 0;

    for (let i = 0; i < timezonesToSeed.length; i += batchSize) {
      const batch = timezonesToSeed.slice(i, i + batchSize);
      
      await prisma.timezone.createMany({
        data: batch.map((tz, index) => ({
          name: tz.name,
          label: tz.label,
          region: tz.region,
          city: tz.city,
          utc_offset: tz.utcOffset,
          dst_offset: tz.dstOffset,
          has_dst: tz.hasDst,
          abbreviation: tz.abbreviation,
          is_active: tz.isActive,
          display_order: i + index
        }))
      });

      seededCount += batch.length;
      console.log(`✅ Seeded ${seededCount}/${timezonesToSeed.length} timezones`);
    }

    console.log(`🎉 Timezones seeded: ${seededCount} total`);

  } catch (error) {
    console.error('❌ Error seeding timezones:', error);
    throw error;
  }
}

/**
 * Seed Currencies with ISO 4217 compliance
 */
async function seedCurrencies() {
  console.log('\n💰 Seeding currencies...');

  try {
    const currenciesToSeed: CurrencyData[] = [
      // Major world currencies
      { code: 'USD', numericCode: '840', name: 'US Dollar', symbol: '$', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', isActive: true },
      { code: 'EUR', numericCode: '978', name: 'Euro', symbol: '€', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', isActive: true },
      { code: 'GBP', numericCode: '826', name: 'British Pound', symbol: '£', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', isActive: true },
      { code: 'JPY', numericCode: '392', name: 'Japanese Yen', symbol: '¥', symbolPosition: 'before', decimalPlaces: 0, decimalSeparator: '.', thousandsSeparator: ',', isActive: true },
      { code: 'CHF', numericCode: '756', name: 'Swiss Franc', symbol: 'CHF', symbolPosition: 'after', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: '\'', isActive: true },
      { code: 'CAD', numericCode: '124', name: 'Canadian Dollar', symbol: 'C$', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', isActive: true },
      { code: 'AUD', numericCode: '036', name: 'Australian Dollar', symbol: 'A$', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', isActive: true },
      { code: 'CNY', numericCode: '156', name: 'Chinese Yuan', symbol: '¥', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', isActive: true },
      { code: 'INR', numericCode: '356', name: 'Indian Rupee', symbol: '₹', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', isActive: true },
      { code: 'KRW', numericCode: '410', name: 'South Korean Won', symbol: '₩', symbolPosition: 'before', decimalPlaces: 0, decimalSeparator: '.', thousandsSeparator: ',', isActive: true },

      // Other major currencies
      { code: 'SEK', numericCode: '752', name: 'Swedish Krona', symbol: 'kr', symbolPosition: 'after', decimalPlaces: 2, decimalSeparator: ',', thousandsSeparator: ' ', isActive: true },
      { code: 'NOK', numericCode: '578', name: 'Norwegian Krone', symbol: 'kr', symbolPosition: 'after', decimalPlaces: 2, decimalSeparator: ',', thousandsSeparator: ' ', isActive: true },
      { code: 'DKK', numericCode: '208', name: 'Danish Krone', symbol: 'kr', symbolPosition: 'after', decimalPlaces: 2, decimalSeparator: ',', thousandsSeparator: '.', isActive: true },
      { code: 'PLN', numericCode: '985', name: 'Polish Złoty', symbol: 'zł', symbolPosition: 'after', decimalPlaces: 2, decimalSeparator: ',', thousandsSeparator: ' ', isActive: true },
      { code: 'CZK', numericCode: '203', name: 'Czech Koruna', symbol: 'Kč', symbolPosition: 'after', decimalPlaces: 2, decimalSeparator: ',', thousandsSeparator: ' ', isActive: true },
      { code: 'HUF', numericCode: '348', name: 'Hungarian Forint', symbol: 'Ft', symbolPosition: 'after', decimalPlaces: 0, decimalSeparator: ',', thousandsSeparator: ' ', isActive: true },
      { code: 'RON', numericCode: '946', name: 'Romanian Leu', symbol: 'lei', symbolPosition: 'after', decimalPlaces: 2, decimalSeparator: ',', thousandsSeparator: '.', isActive: true },
      { code: 'BGN', numericCode: '975', name: 'Bulgarian Lev', symbol: 'лв', symbolPosition: 'after', decimalPlaces: 2, decimalSeparator: ',', thousandsSeparator: ' ', isActive: true },
      { code: 'HRK', numericCode: '191', name: 'Croatian Kuna', symbol: 'kn', symbolPosition: 'after', decimalPlaces: 2, decimalSeparator: ',', thousandsSeparator: '.', isActive: true },
      { code: 'RUB', numericCode: '643', name: 'Russian Ruble', symbol: '₽', symbolPosition: 'after', decimalPlaces: 2, decimalSeparator: ',', thousandsSeparator: ' ', isActive: true },

      // Middle East & Africa
      { code: 'AED', numericCode: '784', name: 'UAE Dirham', symbol: 'د.إ', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', isActive: true },
      { code: 'SAR', numericCode: '682', name: 'Saudi Riyal', symbol: '﷼', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', isActive: true },
      { code: 'ZAR', numericCode: '710', name: 'South African Rand', symbol: 'R', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', isActive: true },
      { code: 'EGP', numericCode: '818', name: 'Egyptian Pound', symbol: 'E£', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', isActive: true },
      { code: 'TRY', numericCode: '949', name: 'Turkish Lira', symbol: '₺', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: ',', thousandsSeparator: '.', isActive: true },
      { code: 'ILS', numericCode: '376', name: 'Israeli Shekel', symbol: '₪', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', isActive: true },

      // Latin America
      { code: 'BRL', numericCode: '986', name: 'Brazilian Real', symbol: 'R$', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: ',', thousandsSeparator: '.', isActive: true },
      { code: 'MXN', numericCode: '484', name: 'Mexican Peso', symbol: '$', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', isActive: true },
      { code: 'ARS', numericCode: '032', name: 'Argentine Peso', symbol: '$', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: ',', thousandsSeparator: '.', isActive: true },
      { code: 'CLP', numericCode: '152', name: 'Chilean Peso', symbol: '$', symbolPosition: 'before', decimalPlaces: 0, decimalSeparator: ',', thousandsSeparator: '.', isActive: true },
      { code: 'COP', numericCode: '170', name: 'Colombian Peso', symbol: '$', symbolPosition: 'before', decimalPlaces: 0, decimalSeparator: ',', thousandsSeparator: '.', isActive: true },
      { code: 'PEN', numericCode: '604', name: 'Peruvian Sol', symbol: 'S/', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', isActive: true },

      // Asia Pacific
      { code: 'SGD', numericCode: '702', name: 'Singapore Dollar', symbol: 'S$', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', isActive: true },
      { code: 'HKD', numericCode: '344', name: 'Hong Kong Dollar', symbol: 'HK$', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', isActive: true },
      { code: 'TWD', numericCode: '901', name: 'Taiwan Dollar', symbol: 'NT$', symbolPosition: 'before', decimalPlaces: 0, decimalSeparator: '.', thousandsSeparator: ',', isActive: true },
      { code: 'THB', numericCode: '764', name: 'Thai Baht', symbol: '฿', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', isActive: true },
      { code: 'MYR', numericCode: '458', name: 'Malaysian Ringgit', symbol: 'RM', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', isActive: true },
      { code: 'IDR', numericCode: '360', name: 'Indonesian Rupiah', symbol: 'Rp', symbolPosition: 'before', decimalPlaces: 0, decimalSeparator: ',', thousandsSeparator: '.', isActive: true },
      { code: 'PHP', numericCode: '608', name: 'Philippine Peso', symbol: '₱', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', isActive: true },
      { code: 'VND', numericCode: '704', name: 'Vietnamese Dong', symbol: '₫', symbolPosition: 'after', decimalPlaces: 0, decimalSeparator: ',', thousandsSeparator: '.', isActive: true },
      { code: 'PKR', numericCode: '586', name: 'Pakistani Rupee', symbol: '₨', symbolPosition: 'before', decimalPlaces: 0, decimalSeparator: '.', thousandsSeparator: ',', isActive: true },
      { code: 'BDT', numericCode: '050', name: 'Bangladeshi Taka', symbol: '৳', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', isActive: true },
      { code: 'NZD', numericCode: '554', name: 'New Zealand Dollar', symbol: 'NZ$', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', isActive: true }
    ];

    // Clear existing data
    await prisma.currency.deleteMany();
    console.log('🗑️  Cleared existing currencies');

    // Batch insert
    const batchSize = 25;
    let seededCount = 0;

    for (let i = 0; i < currenciesToSeed.length; i += batchSize) {
      const batch = currenciesToSeed.slice(i, i + batchSize);
      
      await prisma.currency.createMany({
        data: batch.map((currency, index) => ({
          code: currency.code,
          numeric_code: currency.numericCode,
          name: currency.name,
          symbol: currency.symbol,
          symbol_position: currency.symbolPosition,
          decimal_places: currency.decimalPlaces,
          decimal_separator: currency.decimalSeparator,
          thousands_separator: currency.thousandsSeparator,
          is_active: currency.isActive,
          display_order: i + index
        }))
      });

      seededCount += batch.length;
      console.log(`✅ Seeded ${seededCount}/${currenciesToSeed.length} currencies`);
    }

    console.log(`🎉 Currencies seeded: ${seededCount} total`);

  } catch (error) {
    console.error('❌ Error seeding currencies:', error);
    throw error;
  }
}

/**
 * Generate country flag emoji from country code
 */
function getCountryFlagEmoji(countryCode: string): string {
  if (countryCode.length !== 2) return '🏳️';
  
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  
  return String.fromCodePoint(...codePoints);
}

// Run seeder if called directly
if (require.main === module) {
  seedInternationalDataComprehensive()
    .then(() => {
      console.log('✅ International data seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ International data seeding failed:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}

export default seedInternationalDataComprehensive;