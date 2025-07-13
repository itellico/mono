# International Features Guide

## Overview

itellico Mono provides comprehensive international support including timezone handling, country/currency/language selection, RTL text support, phone number formatting, and country flag display. This guide covers all international features and their implementation.

## 🌍 Features Overview

### **Core International Features**
- **250+ Countries** with metadata (timezones, dial codes, flags)
- **170+ Currencies** with proper symbols and formatting
- **100+ Languages** with native names and RTL support
- **All IANA Timezones** with offset information
- **Phone Number Formatting** with country-specific validation
- **Country Flags** with multiple size options
- **RTL Language Support** with automatic text direction
- **User Preference Storage** with 3-layer caching

### **Data Sources**
- **Countries**: `countries-and-timezones` + `world-countries`
- **Phone Numbers**: `libphonenumber-js` + `react-phone-number-input`
- **Flags**: `react-country-flag` + Flagcdn CDN
- **Timezones**: `luxon` for date/time manipulation

## 🗄️ Database Schema

### **Countries Table**
```sql
CREATE TABLE "Country" (
  "id" SERIAL PRIMARY KEY,
  "code" VARCHAR(2) UNIQUE NOT NULL,        -- ISO 3166-1 alpha-2
  "name" VARCHAR(100) NOT NULL,
  "dialCode" VARCHAR(10),                   -- Phone country code (+1, +44, etc.)
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);
```

### **Currencies Table**
```sql
CREATE TABLE "Currency" (
  "id" SERIAL PRIMARY KEY,
  "code" VARCHAR(3) UNIQUE NOT NULL,        -- ISO 4217
  "name" VARCHAR(100) NOT NULL,
  "symbol" VARCHAR(10),                     -- €, $, £, ¥, etc.
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);
```

### **Languages Table**
```sql
CREATE TABLE "Language" (
  "id" SERIAL PRIMARY KEY,
  "code" VARCHAR(10) UNIQUE NOT NULL,       -- ISO 639-1
  "name" VARCHAR(100) NOT NULL,
  "nativeName" VARCHAR(100),                -- 中文, العربية, हिन्दी
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);
```

### **Extended Metadata Storage**
Extended data (timezones, regions, etc.) is stored as JSON in the `Setting` table:

```typescript
// Example metadata structure
{
  "US": {
    "timezones": ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", ...],
    "capital": "Washington, D.C.",
    "region": "Americas",
    "subregion": "Northern America",
    "continent": "North America",
    "languages": ["en"],
    "currencies": ["USD"],
    "flag": "https://flagcdn.com/w80/us.png"
  }
}
```

## 🚀 Usage Examples

### **1. Country Selection with Flags**

```typescript
import { CountrySelect } from '@/components/international/CountrySelect';

function UserProfileForm() {
  const [countryCode, setCountryCode] = useState('US');
  
  return (
    <CountrySelect
      value={countryCode}
      onChange={setCountryCode}
      showFlags={true}
      showDialCodes={true}
      searchable={true}
      groupBy="region"
      placeholder="Select your country"
      className="w-full"
    />
  );
}
```

### **2. Timezone Selection Based on Country**

```typescript
import { TimezoneSelect } from '@/components/international/TimezoneSelect';

function TimezonePreference() {
  const [timezone, setTimezone] = useState('America/New_York');
  const [countryCode, setCountryCode] = useState('US');
  
  return (
    <div className="space-y-4">
      <CountrySelect
        value={countryCode}
        onChange={setCountryCode}
        showFlags={true}
      />
      
      <TimezoneSelect
        value={timezone}
        onChange={setTimezone}
        countryCode={countryCode} // Filter timezones by country
        showOffset={true}
        showCurrentTime={true}
        displayStyle="both" // Show both name and offset
      />
    </div>
  );
}
```

### **3. Phone Number Input with Country Detection**

```typescript
import { PhoneInput } from '@/components/international/PhoneInput';

function ContactForm() {
  const [phone, setPhone] = useState('');
  const [phoneCountry, setPhoneCountry] = useState('US');
  
  return (
    <PhoneInput
      value={phone}
      onChange={(phoneNumber, country) => {
        setPhone(phoneNumber);
        setPhoneCountry(country);
      }}
      defaultCountry={phoneCountry}
      format="international" // +1 (555) 123-4567
      validateOnBlur={true}
      showCountrySelect={true}
      placeholder="Enter phone number"
      className="w-full"
    />
  );
}
```

### **4. Language Selection with RTL Support**

```typescript
import { LanguageSelect } from '@/components/international/LanguageSelect';
import { useRTLSupport } from '@/hooks/useRTLSupport';

function LanguagePreference() {
  const [languageCode, setLanguageCode] = useState('en');
  const { isRTL } = useRTLSupport(languageCode);
  
  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <LanguageSelect
        value={languageCode}
        onChange={(lang) => {
          setLanguageCode(lang);
          // RTL detection happens automatically in useRTLSupport
        }}
        showNativeNames={true}
        showSpeakerCount={true}
        groupByScript={true}
        includeRegionalVariants={false}
      />
      
      {isRTL && (
        <p className="text-sm text-muted-foreground mt-2">
          RTL text direction enabled for this language
        </p>
      )}
    </div>
  );
}
```

### **5. Currency Selection with Symbols**

```typescript
import { CurrencySelect } from '@/components/international/CurrencySelect';

function CurrencyPreference() {
  const [currencyCode, setCurrencyCode] = useState('USD');
  
  return (
    <CurrencySelect
      value={currencyCode}
      onChange={setCurrencyCode}
      showSymbols={true}
      showCountries={true}
      sortBy="usage" // Most commonly used first
      filterByCountry="US" // Show USD, then others
    />
  );
}
```

## 🎨 RTL Language Support

### **Supported RTL Languages**
- Arabic (ar) - العربية
- Hebrew (he) - עברית  
- Persian (fa) - فارسی
- Urdu (ur) - اردو
- Pashto (ps) - پښتو
- Kurdish (ku) - Kurdî (some variants)
- Yiddish (yi) - ייִדיש

### **Automatic RTL Detection**

```typescript
// Custom hook for RTL support
export const useRTLSupport = (languageCode: string) => {
  const [isRTL, setIsRTL] = useState(false);
  
  useEffect(() => {
    const rtlLanguages = ['ar', 'he', 'fa', 'ur', 'ps', 'yi'];
    const isLanguageRTL = rtlLanguages.includes(languageCode);
    setIsRTL(isLanguageRTL);
    
    // Apply to document
    document.documentElement.dir = isLanguageRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = languageCode;
  }, [languageCode]);
  
  return { isRTL };
};
```

### **RTL-Aware CSS**

```css
/* Automatic RTL support */
.container {
  padding-inline-start: 1rem;
  padding-inline-end: 1rem;
  margin-inline-start: auto;
  margin-inline-end: auto;
}

/* RTL-specific overrides */
[dir="rtl"] .dropdown-menu {
  text-align: right;
}

[dir="rtl"] .form-field {
  direction: rtl;
}

/* Logical properties (preferred) */
.card {
  border-inline-start: 4px solid var(--primary);
  padding-inline: 1rem;
}
```

## 📱 Phone Number Handling

### **Formatting Options**

```typescript
import { formatPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';

// Format phone numbers based on user preference
export const formatPhone = (
  phoneNumber: string, 
  format: 'international' | 'national' | 'e164',
  countryCode?: string
) => {
  try {
    const parsed = parsePhoneNumber(phoneNumber, countryCode);
    
    switch (format) {
      case 'international':
        return parsed.formatInternational(); // +1 555 123 4567
      case 'national':
        return parsed.formatNational();      // (555) 123-4567
      case 'e164':
        return parsed.format('E.164');       // +15551234567
      default:
        return parsed.formatInternational();
    }
  } catch (error) {
    return phoneNumber; // Return original if parsing fails
  }
};
```

### **Validation**

```typescript
import { isValidPhoneNumber } from 'libphonenumber-js';

export const validatePhone = (phoneNumber: string, countryCode?: string): boolean => {
  return isValidPhoneNumber(phoneNumber, countryCode);
};

// Usage in forms
const phoneSchema = z.string()
  .refine((phone) => validatePhone(phone), {
    message: "Invalid phone number format"
  });
```

## 🏁 Country Flags

### **Flag Display Options**

```typescript
import ReactCountryFlag from 'react-country-flag';

// High-resolution flag display
<ReactCountryFlag
  countryCode={countryCode}
  svg
  style={{
    width: '1.5em',
    height: '1.5em',
  }}
  title={countryName}
/>

// Or using CDN URLs (stored in database)
<img 
  src={`https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`}
  alt={`${countryName} flag`}
  className="w-6 h-4 object-cover rounded-sm"
/>
```

### **Flag Sizes Available**
- **w20**: 20px width (small icons)
- **w40**: 40px width (standard dropdowns)
- **w80**: 80px width (detailed views)
- **w160**: 160px width (high-resolution)

## ⚡ Performance Optimization

### **Caching Strategy**

```typescript
// Three-level caching for international data
export class InternationalCache {
  // Level 1: Memory cache (fastest)
  private static memoryCache = new Map<string, any>();
  
  // Level 2: Redis cache (shared)
  private static redisCache = redis;
  
  // Level 3: Database (source of truth)
  
  static async getCountries(locale = 'en'): Promise<Country[]> {
    const cacheKey = `countries:${locale}`;
    
    // Check memory cache first
    if (this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey);
    }
    
    // Check Redis cache
    const cached = await this.redisCache.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      this.memoryCache.set(cacheKey, data);
      return data;
    }
    
    // Load from database
    const countries = await internationalDataService.getCountriesWithTimezones();
    
    // Store in caches
    await this.redisCache.setex(cacheKey, 3600, JSON.stringify(countries));
    this.memoryCache.set(cacheKey, countries);
    
    return countries;
  }
}
```

### **Preloading Critical Data**

```typescript
// Preload on application start
export const preloadInternationalData = async () => {
  const commonData = [
    'countries:en',
    'timezones:all',
    'currencies:popular',
    'languages:common'
  ];
  
  await Promise.allSettled(
    commonData.map(key => InternationalCache.preload(key))
  );
};
```

## 🔧 Configuration

### **Environment Variables**

```bash
# International data settings
ENABLE_FLAG_CDN=true
FLAG_CDN_URL=https://flagcdn.com
DEFAULT_COUNTRY_CODE=US
DEFAULT_TIMEZONE=America/New_York
DEFAULT_CURRENCY=USD
DEFAULT_LANGUAGE=en

# Phone number settings
PHONE_VALIDATION_STRICT=true
PHONE_FORMAT_DEFAULT=international

# RTL support
ENABLE_RTL_SUPPORT=true
RTL_AUTO_DETECTION=true
```

### **Platform Configuration**

Reference the storage configuration in `platform.config.js`:

```javascript
// International data configuration
international: {
  features: {
    enableTimezoneSelection: true,
    enablePhoneValidation: true,
    enableRTLSupport: true,
    enableCountryFlags: true
  },
  
  defaults: {
    countryCode: 'US',
    timezone: 'America/New_York',
    currency: 'USD',
    language: 'en'
  },
  
  caching: {
    countriesTTL: 86400,    // 24 hours
    timezonesTTL: 86400,    // 24 hours
    userPrefsTTL: 1800      // 30 minutes
  }
}
```

## 📊 Analytics & Monitoring

### **Usage Tracking**

```typescript
// Track international feature usage
export const trackInternationalUsage = {
  countrySelection: (countryCode: string) => {
    analytics.track('country_selected', { countryCode });
  },
  
  timezoneChange: (from: string, to: string) => {
    analytics.track('timezone_changed', { from, to });
  },
  
  languageSwitch: (languageCode: string, isRTL: boolean) => {
    analytics.track('language_switched', { languageCode, isRTL });
  },
  
  phoneFormatPreference: (format: string) => {
    analytics.track('phone_format_changed', { format });
  }
};
```

### **Performance Metrics**

```typescript
// Monitor cache performance
const cacheMetrics = {
  hitRate: 'cache_hit_rate',
  missRate: 'cache_miss_rate',
  loadTime: 'international_data_load_time',
  userPrefsLoadTime: 'user_preferences_load_time'
};
```

## 🧪 Testing

### **Unit Tests**

```typescript
describe('InternationalDataService', () => {
  test('should return countries with timezones', async () => {
    const countries = await internationalDataService.getCountriesWithTimezones();
    expect(countries).toHaveLength(250); // Approximate
    expect(countries[0]).toHaveProperty('timezones');
  });
  
  test('should detect RTL languages correctly', () => {
    expect(isRTLLanguage('ar')).toBe(true);
    expect(isRTLLanguage('en')).toBe(false);
  });
  
  test('should format phone numbers correctly', () => {
    const formatted = formatPhone('+15551234567', 'national');
    expect(formatted).toBe('(555) 123-4567');
  });
});
```

### **Integration Tests**

```typescript
describe('International Components', () => {
  test('CountrySelect should display flags', () => {
    render(<CountrySelect showFlags={true} />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });
  
  test('TimezoneSelect should filter by country', () => {
    render(<TimezoneSelect countryCode="US" />);
    // Should only show US timezones
  });
});
```

## 🚀 Deployment

### **Database Seeding**

```bash
# Seed all international data
npm run seed:international

# Or seed individually
npm run seed:countries
npm run seed:currencies
npm run seed:languages
```

### **Cache Warming**

```bash
# Warm caches after deployment
npm run warm-international-cache
```

### **Health Checks**

```typescript
// API health check endpoint
app.get('/health/international', async (req, res) => {
  const checks = {
    countriesLoaded: await checkCountriesData(),
    timezonesLoaded: await checkTimezonesData(),
    cacheHealthy: await checkCacheHealth(),
    flagCDNReachable: await checkFlagCDN()
  };
  
  const allHealthy = Object.values(checks).every(Boolean);
  
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'unhealthy',
    checks
  });
});
```

This comprehensive guide covers all aspects of itellico Mono's international features. The system provides robust, performant, and user-friendly international support with proper caching, RTL support, and extensive customization options.