import { PrismaClient } from '@prisma/client';
import { countries as worldCountries } from 'world-countries';

const prisma = new PrismaClient();

interface CurrencyData {
  code: string;
  name: string;
  symbol: string;
  countries: string[];
  decimals?: number;
}

/**
 * Comprehensive currency seeder
 * Seeds all ISO 4217 currency codes with metadata
 */
export async function seedCurrenciesComprehensive() {
  console.log('💰 Starting comprehensive currency seeding...');

  try {
    // Build currency map from world-countries data
    const currencyMap = new Map<string, CurrencyData>();

    // Process world-countries data to extract currencies
    worldCountries.forEach((country) => {
      const currencies = country.currencies || {};
      
      Object.entries(currencies).forEach(([code, currency]) => {
        if (currencyMap.has(code)) {
          // Add country to existing currency
          currencyMap.get(code)!.countries.push(country.cca2);
        } else {
          // Add new currency
          currencyMap.set(code, {
            code: code,
            name: currency.name,
            symbol: currency.symbol || code,
            countries: [country.cca2],
            decimals: 2 // Default, can be customized below
          });
        }
      });
    });

    // Add/update common currency symbols and metadata
    const currencyMetadata: Record<string, Partial<CurrencyData>> = {
      'USD': { symbol: '$', name: 'US Dollar', decimals: 2 },
      'EUR': { symbol: '€', name: 'Euro', decimals: 2 },
      'GBP': { symbol: '£', name: 'British Pound Sterling', decimals: 2 },
      'JPY': { symbol: '¥', name: 'Japanese Yen', decimals: 0 },
      'CNY': { symbol: '¥', name: 'Chinese Yuan', decimals: 2 },
      'CHF': { symbol: 'Fr', name: 'Swiss Franc', decimals: 2 },
      'CAD': { symbol: 'C$', name: 'Canadian Dollar', decimals: 2 },
      'AUD': { symbol: 'A$', name: 'Australian Dollar', decimals: 2 },
      'NZD': { symbol: 'NZ$', name: 'New Zealand Dollar', decimals: 2 },
      'HKD': { symbol: 'HK$', name: 'Hong Kong Dollar', decimals: 2 },
      'SGD': { symbol: 'S$', name: 'Singapore Dollar', decimals: 2 },
      'SEK': { symbol: 'kr', name: 'Swedish Krona', decimals: 2 },
      'NOK': { symbol: 'kr', name: 'Norwegian Krone', decimals: 2 },
      'DKK': { symbol: 'kr', name: 'Danish Krone', decimals: 2 },
      'PLN': { symbol: 'zł', name: 'Polish Złoty', decimals: 2 },
      'CZK': { symbol: 'Kč', name: 'Czech Koruna', decimals: 2 },
      'HUF': { symbol: 'Ft', name: 'Hungarian Forint', decimals: 0 },
      'RON': { symbol: 'lei', name: 'Romanian Leu', decimals: 2 },
      'BGN': { symbol: 'лв', name: 'Bulgarian Lev', decimals: 2 },
      'HRK': { symbol: 'kn', name: 'Croatian Kuna', decimals: 2 },
      'RUB': { symbol: '₽', name: 'Russian Ruble', decimals: 2 },
      'TRY': { symbol: '₺', name: 'Turkish Lira', decimals: 2 },
      'INR': { symbol: '₹', name: 'Indian Rupee', decimals: 2 },
      'IDR': { symbol: 'Rp', name: 'Indonesian Rupiah', decimals: 0 },
      'MYR': { symbol: 'RM', name: 'Malaysian Ringgit', decimals: 2 },
      'PHP': { symbol: '₱', name: 'Philippine Peso', decimals: 2 },
      'THB': { symbol: '฿', name: 'Thai Baht', decimals: 2 },
      'VND': { symbol: '₫', name: 'Vietnamese Dong', decimals: 0 },
      'KRW': { symbol: '₩', name: 'South Korean Won', decimals: 0 },
      'TWD': { symbol: 'NT$', name: 'New Taiwan Dollar', decimals: 2 },
      'BRL': { symbol: 'R$', name: 'Brazilian Real', decimals: 2 },
      'MXN': { symbol: '$', name: 'Mexican Peso', decimals: 2 },
      'ARS': { symbol: '$', name: 'Argentine Peso', decimals: 2 },
      'CLP': { symbol: '$', name: 'Chilean Peso', decimals: 0 },
      'COP': { symbol: '$', name: 'Colombian Peso', decimals: 0 },
      'PEN': { symbol: 'S/', name: 'Peruvian Sol', decimals: 2 },
      'UYU': { symbol: '$U', name: 'Uruguayan Peso', decimals: 2 },
      'ZAR': { symbol: 'R', name: 'South African Rand', decimals: 2 },
      'NGN': { symbol: '₦', name: 'Nigerian Naira', decimals: 2 },
      'EGP': { symbol: 'E£', name: 'Egyptian Pound', decimals: 2 },
      'KES': { symbol: 'KSh', name: 'Kenyan Shilling', decimals: 2 },
      'GHS': { symbol: '₵', name: 'Ghanaian Cedi', decimals: 2 },
      'MAD': { symbol: 'د.م.', name: 'Moroccan Dirham', decimals: 2 },
      'AED': { symbol: 'د.إ', name: 'UAE Dirham', decimals: 2 },
      'SAR': { symbol: '﷼', name: 'Saudi Riyal', decimals: 2 },
      'QAR': { symbol: '﷼', name: 'Qatari Riyal', decimals: 2 },
      'KWD': { symbol: 'د.ك', name: 'Kuwaiti Dinar', decimals: 3 },
      'BHD': { symbol: '.د.ب', name: 'Bahraini Dinar', decimals: 3 },
      'OMR': { symbol: '﷼', name: 'Omani Rial', decimals: 3 },
      'JOD': { symbol: 'د.ا', name: 'Jordanian Dinar', decimals: 3 },
      'ILS': { symbol: '₪', name: 'Israeli New Shekel', decimals: 2 },
      'PKR': { symbol: '₨', name: 'Pakistani Rupee', decimals: 2 },
      'BDT': { symbol: '৳', name: 'Bangladeshi Taka', decimals: 2 },
      'LKR': { symbol: 'Rs', name: 'Sri Lankan Rupee', decimals: 2 },
      'NPR': { symbol: '₨', name: 'Nepalese Rupee', decimals: 2 },
      'UAH': { symbol: '₴', name: 'Ukrainian Hryvnia', decimals: 2 },
      'KZT': { symbol: '₸', name: 'Kazakhstani Tenge', decimals: 2 },
      'GEL': { symbol: '₾', name: 'Georgian Lari', decimals: 2 },
      'AZN': { symbol: '₼', name: 'Azerbaijani Manat', decimals: 2 },
      'BYN': { symbol: 'Br', name: 'Belarusian Ruble', decimals: 2 },
      'MDL': { symbol: 'L', name: 'Moldovan Leu', decimals: 2 },
      'AMD': { symbol: '֏', name: 'Armenian Dram', decimals: 0 },
      'UZS': { symbol: 'лв', name: 'Uzbekistan Som', decimals: 0 }
    };

    // Apply metadata to currencies
    Object.entries(currencyMetadata).forEach(([code, metadata]) => {
      if (currencyMap.has(code)) {
        Object.assign(currencyMap.get(code)!, metadata);
      } else {
        // Add currency even if not in world-countries
        currencyMap.set(code, {
          code,
          name: metadata.name || code,
          symbol: metadata.symbol || code,
          countries: [],
          decimals: metadata.decimals || 2
        });
      }
    });

    // Convert to array and sort by code
    const currenciesToSeed = Array.from(currencyMap.values())
      .sort((a, b) => a.code.localeCompare(b.code));

    // Delete existing currencies
    await prisma.currency.deleteMany();
    console.log('🗑️  Deleted existing currencies');

    // Seed currencies in batches
    const batchSize = 50;
    let seededCount = 0;

    for (let i = 0; i < currenciesToSeed.length; i += batchSize) {
      const batch = currenciesToSeed.slice(i, i + batchSize);
      
      await prisma.currency.createMany({
        data: batch.map(currency => ({
          code: currency.code,
          name: currency.name,
          symbol: currency.symbol,
          isActive: true
        }))
      });

      seededCount += batch.length;
      console.log(`✅ Seeded ${seededCount}/${currenciesToSeed.length} currencies`);
    }

    // Store extended currency metadata
    await storeCurrencyMetadata(currenciesToSeed);

    console.log('🎉 Currency seeding completed successfully!');
    console.log(`📊 Total currencies seeded: ${seededCount}`);
    
    // Display statistics
    const mostUsedCurrencies = currenciesToSeed
      .sort((a, b) => b.countries.length - a.countries.length)
      .slice(0, 10);
    
    console.log('\n💱 Most widely used currencies:');
    mostUsedCurrencies.forEach(currency => {
      console.log(`   ${currency.code} (${currency.symbol}) - ${currency.name}: ${currency.countries.length} countries`);
    });

  } catch (error) {
    console.error('❌ Error seeding currencies:', error);
    throw error;
  }
}

/**
 * Store extended currency metadata
 */
async function storeCurrencyMetadata(currencies: CurrencyData[]) {
  console.log('\n💾 Storing extended currency metadata...');

  try {
    // Create metadata object
    const currencyMetadata = currencies.reduce((acc, currency) => {
      acc[currency.code] = {
        countries: currency.countries,
        decimals: currency.decimals,
        usage: currency.countries.length
      };
      return acc;
    }, {} as Record<string, any>);

    // Store as platform setting
    await prisma.setting.upsert({
      where: {
        key_tenantId: {
          key: 'platform_currency_metadata',
          tenantId: 0
        }
      },
      update: {
        value: JSON.stringify(currencyMetadata),
        type: 'json',
        category: 'platform',
        description: 'Extended currency metadata including country usage and decimal places',
        updatedAt: new Date()
      },
      create: {
        key: 'platform_currency_metadata',
        value: JSON.stringify(currencyMetadata),
        type: 'json',
        category: 'platform',
        description: 'Extended currency metadata including country usage and decimal places',
        tenantId: 0
      }
    });

    console.log(`✅ Stored metadata for ${currencies.length} currencies`);

  } catch (error) {
    console.error('❌ Error storing currency metadata:', error);
    throw error;
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedCurrenciesComprehensive()
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

export default seedCurrenciesComprehensive;