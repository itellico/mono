import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

interface CountryWithMetadata {
  id: number;
  code: string;
  name: string;
  dialCode?: string | null;
  timezones?: string[];
  capital?: string;
  region?: string;
  languages?: string[];
  currencies?: string[];
  flag?: string;
}

interface TimezoneInfo {
  name: string;
  countries: string[];
  utcOffset: number;
  utcOffsetStr: string;
  dstOffset: number;
  dstOffsetStr: string;
  aliasOf?: string | null;
}

/**
 * Service for accessing international data (countries, timezones, currencies, languages)
 * with caching and convenience methods
 */
export class InternationalDataService {
  
  /**
   * Get all countries with extended metadata including timezones
   */
  async getCountriesWithTimezones(): Promise<CountryWithMetadata[]> {
    return unstable_cache(
      async () => {
        // Get countries from database
        const countries = await prisma.country.findMany({
          where: { isActive: true },
          orderBy: { name: 'asc' }
        });

        // Get metadata from settings
        const metadataSetting = await prisma.setting.findFirst({
          where: {
            key: 'platform_country_metadata',
            tenantId: 0
          }
        });

        if (!metadataSetting || !metadataSetting.value) {
          return countries;
        }

        // Parse metadata
        const metadata = JSON.parse(metadataSetting.value as string);

        // Merge countries with metadata
        return countries.map(country => ({
          ...country,
          ...(metadata[country.code] || {})
        }));
      },
      ['countries-with-timezones'],
      {
        revalidate: 3600, // Cache for 1 hour
        tags: ['countries', 'timezones']
      }
    )();
  }

  /**
   * Get countries by timezone
   */
  async getCountriesByTimezone(timezone: string): Promise<CountryWithMetadata[]> {
    const allCountries = await this.getCountriesWithTimezones();
    return allCountries.filter(country => 
      country.timezones?.includes(timezone)
    );
  }

  /**
   * Get all timezones with metadata
   */
  async getAllTimezones(): Promise<TimezoneInfo[]> {
    return unstable_cache(
      async () => {
        const timezoneSetting = await prisma.setting.findFirst({
          where: {
            key: 'platform_timezones',
            tenantId: 0
          }
        });

        if (!timezoneSetting || !timezoneSetting.value) {
          return [];
        }

        return JSON.parse(timezoneSetting.value as string);
      },
      ['all-timezones'],
      {
        revalidate: 3600,
        tags: ['timezones']
      }
    )();
  }

  /**
   * Get timezones for a specific country
   */
  async getTimezonesForCountry(countryCode: string): Promise<string[]> {
    const countries = await this.getCountriesWithTimezones();
    const country = countries.find(c => c.code === countryCode);
    return country?.timezones || [];
  }

  /**
   * Get all currencies with metadata
   */
  async getCurrenciesWithMetadata() {
    return unstable_cache(
      async () => {
        const currencies = await prisma.currency.findMany({
          where: { isActive: true },
          orderBy: { code: 'asc' }
        });

        const metadataSetting = await prisma.setting.findFirst({
          where: {
            key: 'platform_currency_metadata',
            tenantId: 0
          }
        });

        if (!metadataSetting || !metadataSetting.value) {
          return currencies;
        }

        const metadata = JSON.parse(metadataSetting.value as string);

        return currencies.map(currency => ({
          ...currency,
          ...(metadata[currency.code] || {})
        }));
      },
      ['currencies-with-metadata'],
      {
        revalidate: 3600,
        tags: ['currencies']
      }
    )();
  }

  /**
   * Get all languages with metadata
   */
  async getLanguagesWithMetadata() {
    return unstable_cache(
      async () => {
        const languages = await prisma.language.findMany({
          where: { isActive: true },
          orderBy: { name: 'asc' }
        });

        const metadataSetting = await prisma.setting.findFirst({
          where: {
            key: 'platform_language_metadata',
            tenantId: 0
          }
        });

        if (!metadataSetting || !metadataSetting.value) {
          return languages;
        }

        const metadata = JSON.parse(metadataSetting.value as string);

        return languages.map(language => ({
          ...language,
          ...(metadata[language.code] || {})
        }));
      },
      ['languages-with-metadata'],
      {
        revalidate: 3600,
        tags: ['languages']
      }
    )();
  }

  /**
   * Get countries by language
   */
  async getCountriesByLanguage(languageCode: string): Promise<CountryWithMetadata[]> {
    const countries = await this.getCountriesWithTimezones();
    return countries.filter(country => 
      country.languages?.includes(languageCode)
    );
  }

  /**
   * Get countries by currency
   */
  async getCountriesByCurrency(currencyCode: string): Promise<CountryWithMetadata[]> {
    const countries = await this.getCountriesWithTimezones();
    return countries.filter(country => 
      country.currencies?.includes(currencyCode)
    );
  }

  /**
   * Get country groups (EU, G7, G20, etc.)
   */
  async getCountryGroups() {
    return unstable_cache(
      async () => {
        const groupSettings = await prisma.setting.findMany({
          where: {
            category: 'platform_groups',
            tenantId: 0
          }
        });

        const groups: Record<string, any> = {};
        
        groupSettings.forEach(setting => {
          const key = setting.key.replace('country_group_', '');
          groups[key] = JSON.parse(setting.value as string);
        });

        return groups;
      },
      ['country-groups'],
      {
        revalidate: 3600,
        tags: ['countries', 'groups']
      }
    )();
  }

  /**
   * Get countries in a specific group (e.g., EU, G7)
   */
  async getCountriesInGroup(groupKey: string): Promise<CountryWithMetadata[]> {
    const groups = await this.getCountryGroups();
    const group = groups[groupKey];
    
    if (!group || !group.codes) {
      return [];
    }

    const allCountries = await this.getCountriesWithTimezones();
    return allCountries.filter(country => 
      group.codes.includes(country.code)
    );
  }

  /**
   * Format country for select options
   */
  formatCountryOption(country: CountryWithMetadata) {
    return {
      value: country.code,
      label: country.name,
      dialCode: country.dialCode,
      flag: country.flag || `https://flagcdn.com/w80/${country.code.toLowerCase()}.png`
    };
  }

  /**
   * Format timezone for select options
   */
  formatTimezoneOption(timezone: TimezoneInfo) {
    return {
      value: timezone.name,
      label: `${timezone.name} (${timezone.utcOffsetStr})`,
      offset: timezone.utcOffset,
      offsetStr: timezone.utcOffsetStr
    };
  }

  /**
   * Get user's likely timezone based on country
   */
  async getDefaultTimezoneForCountry(countryCode: string): Promise<string | null> {
    const timezones = await this.getTimezonesForCountry(countryCode);
    
    if (timezones.length === 0) {
      return null;
    }
    
    // For countries with single timezone, return it
    if (timezones.length === 1) {
      return timezones[0];
    }
    
    // For countries with multiple timezones, return the most common one
    // This is a simplified heuristic - you might want to enhance this
    const commonTimezones: Record<string, string> = {
      'US': 'America/New_York',
      'CA': 'America/Toronto',
      'BR': 'America/Sao_Paulo',
      'RU': 'Europe/Moscow',
      'AU': 'Australia/Sydney',
      'CN': 'Asia/Shanghai',
      'IN': 'Asia/Kolkata',
      'MX': 'America/Mexico_City',
      'ID': 'Asia/Jakarta',
      'KZ': 'Asia/Almaty'
    };
    
    return commonTimezones[countryCode] || timezones[0];
  }
}

// Export singleton instance
export const internationalDataService = new InternationalDataService();