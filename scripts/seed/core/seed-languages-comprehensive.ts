import { PrismaClient } from '@prisma/client';
import { countries as worldCountries } from 'world-countries';

const prisma = new PrismaClient();

interface LanguageData {
  code: string;
  name: string;
  nativeName: string;
  countries: string[];
  speakers?: number;
  script?: string;
  rtl?: boolean;
}

/**
 * Comprehensive language seeder
 * Seeds all ISO 639-1 language codes with metadata
 */
export async function seedLanguagesComprehensive() {
  console.log('🌐 Starting comprehensive language seeding...');

  try {
    // Build language map from world-countries data
    const languageMap = new Map<string, LanguageData>();

    // Process world-countries data to extract languages
    worldCountries.forEach((country) => {
      const languages = country.languages || {};
      
      Object.entries(languages).forEach(([code, name]) => {
        if (languageMap.has(code)) {
          // Add country to existing language
          languageMap.get(code)!.countries.push(country.cca2);
        } else {
          // Add new language with basic info from world-countries
          languageMap.set(code, {
            code: code,
            name: name as string,
            nativeName: name as string, // Will be updated below
            countries: [country.cca2]
          });
        }
      });
    });

    // Comprehensive language metadata with native names and additional info
    const languageMetadata: Record<string, Partial<LanguageData>> = {
      // Major World Languages
      'en': { name: 'English', nativeName: 'English', speakers: 1500000000, script: 'Latin' },
      'zh': { name: 'Chinese', nativeName: '中文', speakers: 1200000000, script: 'Chinese' },
      'es': { name: 'Spanish', nativeName: 'Español', speakers: 500000000, script: 'Latin' },
      'hi': { name: 'Hindi', nativeName: 'हिन्दी', speakers: 600000000, script: 'Devanagari' },
      'ar': { name: 'Arabic', nativeName: 'العربية', speakers: 400000000, script: 'Arabic', rtl: true },
      'bn': { name: 'Bengali', nativeName: 'বাংলা', speakers: 300000000, script: 'Bengali' },
      'pt': { name: 'Portuguese', nativeName: 'Português', speakers: 260000000, script: 'Latin' },
      'ru': { name: 'Russian', nativeName: 'Русский', speakers: 260000000, script: 'Cyrillic' },
      'ja': { name: 'Japanese', nativeName: '日本語', speakers: 125000000, script: 'Japanese' },
      'pa': { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', speakers: 125000000, script: 'Gurmukhi' },
      
      // European Languages
      'de': { name: 'German', nativeName: 'Deutsch', speakers: 100000000, script: 'Latin' },
      'fr': { name: 'French', nativeName: 'Français', speakers: 280000000, script: 'Latin' },
      'it': { name: 'Italian', nativeName: 'Italiano', speakers: 85000000, script: 'Latin' },
      'nl': { name: 'Dutch', nativeName: 'Nederlands', speakers: 24000000, script: 'Latin' },
      'sv': { name: 'Swedish', nativeName: 'Svenska', speakers: 10000000, script: 'Latin' },
      'da': { name: 'Danish', nativeName: 'Dansk', speakers: 6000000, script: 'Latin' },
      'no': { name: 'Norwegian', nativeName: 'Norsk', speakers: 5000000, script: 'Latin' },
      'fi': { name: 'Finnish', nativeName: 'Suomi', speakers: 5500000, script: 'Latin' },
      'pl': { name: 'Polish', nativeName: 'Polski', speakers: 45000000, script: 'Latin' },
      'cs': { name: 'Czech', nativeName: 'Čeština', speakers: 10000000, script: 'Latin' },
      'sk': { name: 'Slovak', nativeName: 'Slovenčina', speakers: 5000000, script: 'Latin' },
      'hu': { name: 'Hungarian', nativeName: 'Magyar', speakers: 13000000, script: 'Latin' },
      'ro': { name: 'Romanian', nativeName: 'Română', speakers: 24000000, script: 'Latin' },
      'bg': { name: 'Bulgarian', nativeName: 'Български', speakers: 8000000, script: 'Cyrillic' },
      'hr': { name: 'Croatian', nativeName: 'Hrvatski', speakers: 5500000, script: 'Latin' },
      'sr': { name: 'Serbian', nativeName: 'Српски', speakers: 12000000, script: 'Cyrillic' },
      'sl': { name: 'Slovenian', nativeName: 'Slovenščina', speakers: 2500000, script: 'Latin' },
      'el': { name: 'Greek', nativeName: 'Ελληνικά', speakers: 13500000, script: 'Greek' },
      'tr': { name: 'Turkish', nativeName: 'Türkçe', speakers: 88000000, script: 'Latin' },
      'uk': { name: 'Ukrainian', nativeName: 'Українська', speakers: 35000000, script: 'Cyrillic' },
      'be': { name: 'Belarusian', nativeName: 'Беларуская', speakers: 7000000, script: 'Cyrillic' },
      'et': { name: 'Estonian', nativeName: 'Eesti', speakers: 1100000, script: 'Latin' },
      'lv': { name: 'Latvian', nativeName: 'Latviešu', speakers: 1500000, script: 'Latin' },
      'lt': { name: 'Lithuanian', nativeName: 'Lietuvių', speakers: 3000000, script: 'Latin' },
      'sq': { name: 'Albanian', nativeName: 'Shqip', speakers: 7500000, script: 'Latin' },
      'mk': { name: 'Macedonian', nativeName: 'Македонски', speakers: 2000000, script: 'Cyrillic' },
      'mt': { name: 'Maltese', nativeName: 'Malti', speakers: 520000, script: 'Latin' },
      'is': { name: 'Icelandic', nativeName: 'Íslenska', speakers: 350000, script: 'Latin' },
      'ga': { name: 'Irish', nativeName: 'Gaeilge', speakers: 1800000, script: 'Latin' },
      'cy': { name: 'Welsh', nativeName: 'Cymraeg', speakers: 700000, script: 'Latin' },
      'gd': { name: 'Scottish Gaelic', nativeName: 'Gàidhlig', speakers: 60000, script: 'Latin' },
      'eu': { name: 'Basque', nativeName: 'Euskara', speakers: 750000, script: 'Latin' },
      'ca': { name: 'Catalan', nativeName: 'Català', speakers: 10000000, script: 'Latin' },
      'gl': { name: 'Galician', nativeName: 'Galego', speakers: 2400000, script: 'Latin' },
      
      // Asian Languages
      'ko': { name: 'Korean', nativeName: '한국어', speakers: 80000000, script: 'Hangul' },
      'vi': { name: 'Vietnamese', nativeName: 'Tiếng Việt', speakers: 95000000, script: 'Latin' },
      'th': { name: 'Thai', nativeName: 'ไทย', speakers: 60000000, script: 'Thai' },
      'id': { name: 'Indonesian', nativeName: 'Bahasa Indonesia', speakers: 200000000, script: 'Latin' },
      'ms': { name: 'Malay', nativeName: 'Bahasa Melayu', speakers: 290000000, script: 'Latin' },
      'tl': { name: 'Filipino', nativeName: 'Filipino', speakers: 90000000, script: 'Latin' },
      'my': { name: 'Burmese', nativeName: 'မြန်မာဘာသာ', speakers: 33000000, script: 'Myanmar' },
      'km': { name: 'Khmer', nativeName: 'ខ្មែរ', speakers: 16000000, script: 'Khmer' },
      'lo': { name: 'Lao', nativeName: 'ພາສາລາວ', speakers: 7000000, script: 'Lao' },
      'si': { name: 'Sinhala', nativeName: 'සිංහල', speakers: 17000000, script: 'Sinhala' },
      'ta': { name: 'Tamil', nativeName: 'தமிழ்', speakers: 78000000, script: 'Tamil' },
      'te': { name: 'Telugu', nativeName: 'తెలుగు', speakers: 83000000, script: 'Telugu' },
      'kn': { name: 'Kannada', nativeName: 'ಕನ್ನಡ', speakers: 45000000, script: 'Kannada' },
      'ml': { name: 'Malayalam', nativeName: 'മലയാളം', speakers: 38000000, script: 'Malayalam' },
      'mr': { name: 'Marathi', nativeName: 'मराठी', speakers: 83000000, script: 'Devanagari' },
      'gu': { name: 'Gujarati', nativeName: 'ગુજરાતી', speakers: 56000000, script: 'Gujarati' },
      'or': { name: 'Odia', nativeName: 'ଓଡ଼ିଆ', speakers: 35000000, script: 'Odia' },
      'ne': { name: 'Nepali', nativeName: 'नेपाली', speakers: 25000000, script: 'Devanagari' },
      'mn': { name: 'Mongolian', nativeName: 'Монгол', speakers: 6000000, script: 'Cyrillic' },
      'ka': { name: 'Georgian', nativeName: 'ქართული', speakers: 4000000, script: 'Georgian' },
      'hy': { name: 'Armenian', nativeName: 'Հայերեն', speakers: 6000000, script: 'Armenian' },
      'az': { name: 'Azerbaijani', nativeName: 'Azərbaycan', speakers: 30000000, script: 'Latin' },
      'kk': { name: 'Kazakh', nativeName: 'Қазақ', speakers: 18000000, script: 'Cyrillic' },
      'ky': { name: 'Kyrgyz', nativeName: 'Кыргыз', speakers: 5000000, script: 'Cyrillic' },
      'uz': { name: 'Uzbek', nativeName: 'Oʻzbek', speakers: 35000000, script: 'Latin' },
      'tg': { name: 'Tajik', nativeName: 'Тоҷикӣ', speakers: 9000000, script: 'Cyrillic' },
      'tk': { name: 'Turkmen', nativeName: 'Türkmen', speakers: 7000000, script: 'Latin' },
      
      // Middle Eastern Languages
      'fa': { name: 'Persian', nativeName: 'فارسی', speakers: 110000000, script: 'Arabic', rtl: true },
      'ps': { name: 'Pashto', nativeName: 'پښتو', speakers: 60000000, script: 'Arabic', rtl: true },
      'ur': { name: 'Urdu', nativeName: 'اردو', speakers: 70000000, script: 'Arabic', rtl: true },
      'he': { name: 'Hebrew', nativeName: 'עברית', speakers: 9000000, script: 'Hebrew', rtl: true },
      'yi': { name: 'Yiddish', nativeName: 'ייִדיש', speakers: 1500000, script: 'Hebrew', rtl: true },
      'ku': { name: 'Kurdish', nativeName: 'Kurdî', speakers: 30000000, script: 'Latin' },
      
      // African Languages
      'am': { name: 'Amharic', nativeName: 'አማርኛ', speakers: 32000000, script: 'Ethiopic' },
      'ha': { name: 'Hausa', nativeName: 'Hausa', speakers: 72000000, script: 'Latin' },
      'yo': { name: 'Yoruba', nativeName: 'Yorùbá', speakers: 45000000, script: 'Latin' },
      'ig': { name: 'Igbo', nativeName: 'Igbo', speakers: 30000000, script: 'Latin' },
      'sw': { name: 'Swahili', nativeName: 'Kiswahili', speakers: 100000000, script: 'Latin' },
      'zu': { name: 'Zulu', nativeName: 'isiZulu', speakers: 12000000, script: 'Latin' },
      'xh': { name: 'Xhosa', nativeName: 'isiXhosa', speakers: 8000000, script: 'Latin' },
      'af': { name: 'Afrikaans', nativeName: 'Afrikaans', speakers: 7000000, script: 'Latin' },
      'st': { name: 'Southern Sotho', nativeName: 'Sesotho', speakers: 6000000, script: 'Latin' },
      'tn': { name: 'Tswana', nativeName: 'Setswana', speakers: 8000000, script: 'Latin' },
      'so': { name: 'Somali', nativeName: 'Soomaali', speakers: 22000000, script: 'Latin' },
      'ti': { name: 'Tigrinya', nativeName: 'ትግርኛ', speakers: 9000000, script: 'Ethiopic' },
      'om': { name: 'Oromo', nativeName: 'Afaan Oromoo', speakers: 37000000, script: 'Latin' },
      'rw': { name: 'Kinyarwanda', nativeName: 'Ikinyarwanda', speakers: 12000000, script: 'Latin' },
      'ny': { name: 'Chichewa', nativeName: 'ChiCheŵa', speakers: 16000000, script: 'Latin' },
      'mg': { name: 'Malagasy', nativeName: 'Malagasy', speakers: 25000000, script: 'Latin' },
      
      // Pacific Languages
      'mi': { name: 'Māori', nativeName: 'Te Reo Māori', speakers: 150000, script: 'Latin' },
      'sm': { name: 'Samoan', nativeName: 'Gagana Samoa', speakers: 510000, script: 'Latin' },
      'to': { name: 'Tongan', nativeName: 'Lea faka-Tonga', speakers: 100000, script: 'Latin' },
      'fj': { name: 'Fijian', nativeName: 'Vosa Vakaviti', speakers: 450000, script: 'Latin' },
      'haw': { name: 'Hawaiian', nativeName: 'ʻŌlelo Hawaiʻi', speakers: 24000, script: 'Latin' },
      
      // Other Languages
      'eo': { name: 'Esperanto', nativeName: 'Esperanto', speakers: 2000000, script: 'Latin' },
      'la': { name: 'Latin', nativeName: 'Latina', speakers: 0, script: 'Latin' }
    };

    // Apply metadata to languages
    Object.entries(languageMetadata).forEach(([code, metadata]) => {
      if (languageMap.has(code)) {
        Object.assign(languageMap.get(code)!, metadata);
      } else {
        // Add language even if not in world-countries
        languageMap.set(code, {
          code,
          name: metadata.name || code,
          nativeName: metadata.nativeName || metadata.name || code,
          countries: [],
          speakers: metadata.speakers,
          script: metadata.script,
          rtl: metadata.rtl || false
        });
      }
    });

    // Convert to array and sort by number of speakers (descending) then by code
    const languagesToSeed = Array.from(languageMap.values())
      .sort((a, b) => {
        if (a.speakers && b.speakers) {
          return b.speakers - a.speakers;
        }
        return a.code.localeCompare(b.code);
      });

    // Delete existing languages
    await prisma.language.deleteMany();
    console.log('🗑️  Deleted existing languages');

    // Seed languages in batches
    const batchSize = 50;
    let seededCount = 0;

    for (let i = 0; i < languagesToSeed.length; i += batchSize) {
      const batch = languagesToSeed.slice(i, i + batchSize);
      
      await prisma.language.createMany({
        data: batch.map(language => ({
          code: language.code,
          name: language.name,
          nativeName: language.nativeName,
          isActive: true
        }))
      });

      seededCount += batch.length;
      console.log(`✅ Seeded ${seededCount}/${languagesToSeed.length} languages`);
    }

    // Store extended language metadata
    await storeLanguageMetadata(languagesToSeed);

    console.log('🎉 Language seeding completed successfully!');
    console.log(`📊 Total languages seeded: ${seededCount}`);
    
    // Display statistics
    const mostSpokenLanguages = languagesToSeed
      .filter(l => l.speakers)
      .sort((a, b) => (b.speakers || 0) - (a.speakers || 0))
      .slice(0, 10);
    
    console.log('\n🗣️  Most spoken languages:');
    mostSpokenLanguages.forEach(language => {
      const speakers = language.speakers?.toLocaleString() || 'Unknown';
      console.log(`   ${language.code} - ${language.name} (${language.nativeName}): ${speakers} speakers`);
    });

    const rtlLanguages = languagesToSeed.filter(l => l.rtl);
    console.log(`\n📝 RTL (Right-to-Left) languages: ${rtlLanguages.length}`);
    rtlLanguages.forEach(language => {
      console.log(`   ${language.code} - ${language.name} (${language.nativeName})`);
    });

  } catch (error) {
    console.error('❌ Error seeding languages:', error);
    throw error;
  }
}

/**
 * Store extended language metadata
 */
async function storeLanguageMetadata(languages: LanguageData[]) {
  console.log('\n💾 Storing extended language metadata...');

  try {
    // Create metadata object
    const languageMetadata = languages.reduce((acc, language) => {
      acc[language.code] = {
        countries: language.countries,
        speakers: language.speakers,
        script: language.script,
        rtl: language.rtl || false,
        usage: language.countries.length
      };
      return acc;
    }, {} as Record<string, any>);

    // Store as platform setting
    await prisma.setting.upsert({
      where: {
        key_tenantId: {
          key: 'platform_language_metadata',
          tenantId: 0
        }
      },
      update: {
        value: JSON.stringify(languageMetadata),
        type: 'json',
        category: 'platform',
        description: 'Extended language metadata including speakers, script, and RTL information',
        updatedAt: new Date()
      },
      create: {
        key: 'platform_language_metadata',
        value: JSON.stringify(languageMetadata),
        type: 'json',
        category: 'platform',
        description: 'Extended language metadata including speakers, script, and RTL information',
        tenantId: 0
      }
    });

    console.log(`✅ Stored metadata for ${languages.length} languages`);

  } catch (error) {
    console.error('❌ Error storing language metadata:', error);
    throw error;
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedLanguagesComprehensive()
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

export default seedLanguagesComprehensive;