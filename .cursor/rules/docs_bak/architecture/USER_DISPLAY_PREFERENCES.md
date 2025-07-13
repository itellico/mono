# User Display Preferences System

## Overview

The itellico Mono implements a comprehensive user display preferences system that automatically handles timezone conversion, date/time formatting, number formatting, and currency display based on each user's preferences. This system is deeply integrated into the middleware layer for seamless, automatic formatting across all API responses.

## Architecture

### 1. **Type Definitions** (`src/types/user-preferences.ts`)

Comprehensive type definitions for all user display preferences:

```typescript
interface UserDisplayPreferences {
  // Time & Date Preferences
  timezone: string;                    // IANA timezone (e.g., 'America/New_York')
  dateFormat: string;                  // Date format pattern (e.g., 'MM/DD/YYYY')
  timeFormat: '12h' | '24h';          // Time format preference
  firstDayOfWeek: 0-6;                // 0 = Sunday, 1 = Monday, etc.
  
  // Number & Currency Preferences
  numberFormat: string;                // Number format (e.g., '1,234.56')
  decimalSeparator: '.' | ',';        // Decimal separator
  thousandsSeparator: ',' | '.' | ' ' | '';  // Thousands separator
  currencyCode: string;                // ISO 4217 currency code
  currencyPosition: 'before' | 'after'; // Currency symbol position
  currencySpace: boolean;              // Space between currency and amount
  
  // Relative Time Preferences
  useRelativeTime: boolean;            // Enable relative time display
  relativeTimeThreshold: number;       // Hours before switching to absolute
  relativeTimeStyle: 'short' | 'long' | 'narrow'; // Format style
  
  // Locale & Language
  locale: string;                      // Full locale (e.g., 'en-US')
  languageCode: string;                // ISO 639-1 code
  countryCode: string;                 // ISO 3166-1 code
  
  // International Data Preferences
  phone: string;                       // Formatted phone number with country code
  phoneCountryCode: string;            // Phone country code (e.g., 'US', 'GB')
  phoneFormat: 'international' | 'national' | 'e164'; // Phone display format
  
  // RTL Language Support
  isRTL: boolean;                      // Right-to-left text direction
  textDirection: 'ltr' | 'rtl' | 'auto'; // Text direction preference
  
  // Display Preferences
  themePreference: 'light' | 'dark' | 'system';
  compactMode: boolean;
  showSeconds: boolean;
  showTimezone: boolean;
  showCountryFlags: boolean;           // Display country flags in dropdowns
  timezoneDisplayStyle: 'name' | 'offset' | 'both'; // How to show timezone info
}
```

### 2. **Database Schema** (Prisma)

User preferences are stored in the `Account` table with proper defaults:

```prisma
model Account {
  // Existing fields...
  
  // Date/Time Preferences
  timezone               String?   @db.VarChar(50)
  dateFormat             String?   @db.VarChar(20)
  timeFormat             String?   @db.VarChar(20)
  firstDayOfWeek         Int       @default(0)
  
  // Number/Currency Preferences
  numberFormat           String?   @db.VarChar(20)
  decimalSeparator       String    @default(".") @db.VarChar(1)
  thousandsSeparator     String    @default(",") @db.VarChar(1)
  currencyCode           String?   @default("EUR") @db.VarChar(3)
  currencyPosition       String    @default("before") @db.VarChar(10)
  currencySpace          Boolean   @default(false)
  
  // Relative Time Preferences
  useRelativeTime        Boolean   @default(true)
  relativeTimeThreshold  Int       @default(24)
  relativeTimeStyle      String    @default("long") @db.VarChar(10)
  
  // International Data Fields
  phone                  String?   @db.VarChar(30)
  phoneCountryCode       String?   @db.VarChar(2)
  phoneFormat            String    @default("international") @db.VarChar(20)
  
  // RTL Language Support
  isRTL                  Boolean   @default(false)
  textDirection          String    @default("auto") @db.VarChar(10)
  
  // Display Preferences
  compactMode            Boolean   @default(false)
  showSeconds            Boolean   @default(false)
  showTimezone           Boolean   @default(false)
  showCountryFlags       Boolean   @default(true)
  timezoneDisplayStyle   String    @default("name") @db.VarChar(10)
  notificationTimeFormat String    @default("12h") @db.VarChar(10)
}
```

### 3. **Three-Level Caching** (`src/lib/services/user-preferences.service.ts`)

The preferences service implements a three-level cache for optimal performance:

1. **Memory Cache** (In-process)
   - Fastest access (< 1ms)
   - Limited size (1000 entries)
   - 5-minute TTL
   - Automatic cleanup

2. **Redis Cache** (Shared)
   - Fast access (< 10ms)
   - Shared across instances
   - 5-minute TTL
   - Automatic invalidation

3. **Database** (Source of Truth)
   - Persistent storage
   - Fallback when caches miss
   - Automatic cache population

```typescript
// Usage
const preferencesService = UserPreferencesService.getInstance();
const preferences = await preferencesService.getUserPreferences(userId);
```

### 4. **Middleware Integration** (`middleware.ts`)

The main middleware automatically:
1. Loads user preferences when authenticated
2. Injects preferences as HTTP headers
3. Passes preferences to API handlers

```typescript
// Injected headers
X-User-Timezone: America/New_York
X-User-Locale: en-US
X-User-DateFormat: MM/DD/YYYY
X-User-TimeFormat: 12h
X-User-NumberFormat: 1,234.56
X-User-Currency: USD
X-User-RelativeTime: true
X-User-RelativeThreshold: 24
```

### 5. **Response Transformation** (`src/lib/middleware/response-transformer.ts`)

Automatic transformation of API responses based on user preferences:

```typescript
// Before transformation
{
  "createdAt": "2024-01-03T15:30:00Z",
  "price": 1234.56,
  "total": 2500.00
}

// After transformation (US user)
{
  "createdAt": "Jan 3, 2024 10:30 AM",
  "price": "$1,234.56",
  "total": "$2,500.00"
}

// After transformation (German user)
{
  "createdAt": "03.01.2024 16:30",
  "price": "1.234,56 €",
  "total": "2.500,00 €"
}
```

### 6. **API Middleware Enhancement** (`src/lib/api-middleware.ts`)

The `withMiddleware` wrapper automatically:
- Enables response transformation by default
- Extracts preferences from headers
- Applies formatting to all responses

```typescript
// API route with automatic formatting
export default withMiddleware({
  GET: async (req) => {
    const data = await getOrders();
    return successResponse(data); // Dates/numbers auto-formatted
  }
});

// Disable transformation if needed
export default withMiddleware({
  GET: async (req) => {
    // Return raw data
  }
}, { transformResponse: false });
```

### 7. **React Hooks** (`src/hooks/use-formatters.ts`)

Client-side formatting hooks for React components:

```typescript
function OrderList() {
  const { formatDate, formatCurrency, formatRelativeTime } = useFormatters();
  
  return (
    <div>
      <p>Created: {formatRelativeTime(order.createdAt)}</p>
      <p>Total: {formatCurrency(order.total)}</p>
    </div>
  );
}
```

## Usage Examples

### 1. **Basic API Route**

```typescript
// API automatically formats responses
export default withMiddleware({
  GET: async (req) => {
    const orders = await prisma.order.findMany();
    return successResponse(orders); // All dates/numbers formatted
  }
});
```

### 2. **Custom Formatting Options**

```typescript
// Customize transformation behavior
export default withMiddleware({
  GET: async (req) => {
    return successResponse(data);
  }
}, {
  transformResponse: {
    transformDates: true,
    transformNumbers: true,
    transformCurrency: true,
    dateFields: ['customDate'], // Specific fields
    currencyFields: ['amount', 'balance']
  }
});
```

### 3. **Manual Formatting**

```typescript
// In server components
const preferences = await getServerDatePreferences(userId);
const formatted = formatDate(date, 'medium', preferences);

// In API handlers
const formatted = formatDateForUser(date, request);
```

### 4. **Client Components**

```typescript
// Automatic preference loading
function Dashboard() {
  const { formatDate, formatCurrency, preferences } = useFormatters();
  
  return (
    <div>
      <h1>Welcome! Your timezone: {preferences.timezone}</h1>
      <p>Last login: {formatDate(lastLogin, 'relative')}</p>
    </div>
  );
}
```

### 5. **Live Relative Time**

```typescript
// Updates every minute
function Comment({ createdAt }) {
  const formatted = useLiveRelativeTime(createdAt, 60000);
  
  return <span>{formatted}</span>; // "2 minutes ago" → "3 minutes ago"
}
```

## Performance Considerations

1. **Caching Strategy**
   - Memory cache reduces database queries by ~95%
   - Redis cache enables cross-instance sharing
   - 5-minute TTL balances freshness vs performance

2. **Bulk Operations**
   - `bulkGetUserPreferences()` for loading multiple users
   - Minimizes database round trips
   - Parallel cache checks

3. **Response Transformation**
   - Streaming transformation for large responses
   - Lazy evaluation of date/number detection
   - Minimal overhead (~5-10ms per response)

## Security Considerations

1. **Input Validation**
   - Timezone validated against IANA database
   - Format strings validated against whitelist
   - Locale validated for XSS prevention

2. **Cache Security**
   - User-scoped cache keys
   - Automatic cache invalidation on logout
   - No cross-tenant data leakage

3. **Header Injection Prevention**
   - All preference headers sanitized
   - Length limits enforced
   - Special characters escaped

## Migration Guide

### From Legacy System

1. **Update API Routes**
```typescript
// Before
export async function GET() {
  const data = await getData();
  return NextResponse.json(data);
}

// After
export default withMiddleware({
  GET: async (req) => {
    const data = await getData();
    return successResponse(data); // Auto-formatted
  }
});
```

2. **Update Components**
```typescript
// Before
<span>{new Date(date).toLocaleString()}</span>

// After
const { formatDate } = useFormatters();
<span>{formatDate(date)}</span>
```

3. **Database Migration**
```bash
# Apply schema changes
npx prisma migrate dev

# Run migration script
npm run migrate:preferences
```

## Best Practices

1. **Always Use Hooks in Components**
   - Ensures consistent formatting
   - Automatic preference updates
   - Better performance with memoization

2. **Enable Response Transformation**
   - Use `withMiddleware` for all API routes
   - Disable only when returning non-JSON data
   - Test with different locales

3. **Cache Warming**
   - Pre-load preferences for active users
   - Use bulk operations for lists
   - Implement cache warming on login

4. **Fallback Handling**
   - Always provide default preferences
   - Handle cache failures gracefully
   - Log preference loading errors

## Troubleshooting

### Common Issues

1. **Dates Not Formatting**
   - Check if response transformation is enabled
   - Verify user has preferences set
   - Ensure date fields are detected

2. **Wrong Timezone**
   - Verify timezone in database
   - Check middleware header injection
   - Test with explicit timezone

3. **Performance Issues**
   - Monitor cache hit rates
   - Check for cache invalidation loops
   - Use bulk operations for lists

### Debug Mode

```typescript
// Enable debug logging
process.env.PREFERENCE_DEBUG = 'true';

// Check headers in browser
// Network tab → Request → Headers → X-User-*
```

## Future Enhancements

1. **Planned Features**
   - Custom date format builder UI
   - Timezone auto-detection
   - Preference sync across devices
   - A/B testing for formats

2. **Performance Improvements**
   - Edge caching for preferences
   - WebSocket preference updates
   - Predictive cache warming

3. **Extended Support**
   - More number formats
   - Custom currency symbols

## International Components Integration

### **Country Selection Component**

```typescript
import { CountrySelect } from '@/components/international/CountrySelect';

interface CountrySelectProps {
  value?: string;
  onChange: (countryCode: string) => void;
  showFlags?: boolean;
  showDialCodes?: boolean;
  placeholder?: string;
  searchable?: boolean;
  includeTimezones?: boolean;
  filterCountries?: string[]; // Limit to specific countries
  groupBy?: 'region' | 'continent'; // Group countries
}

// Usage Example
<CountrySelect
  value={userPreferences.countryCode}
  onChange={(code) => updatePreference('countryCode', code)}
  showFlags={userPreferences.showCountryFlags}
  showDialCodes={true}
  searchable={true}
  includeTimezones={true}
  groupBy="region"
/>
```

### **Timezone Selection Component**

```typescript
import { TimezoneSelect } from '@/components/international/TimezoneSelect';

interface TimezoneSelectProps {
  value?: string;
  onChange: (timezone: string) => void;
  countryCode?: string; // Filter by country
  showOffset?: boolean;
  showCurrentTime?: boolean;
  groupByCountry?: boolean;
  displayStyle?: 'name' | 'offset' | 'both';
}

// Usage Example
<TimezoneSelect
  value={userPreferences.timezone}
  onChange={(tz) => updatePreference('timezone', tz)}
  countryCode={userPreferences.countryCode}
  showOffset={true}
  showCurrentTime={true}
  displayStyle={userPreferences.timezoneDisplayStyle}
/>
```

### **Phone Number Input Component**

```typescript
import { PhoneInput } from '@/components/international/PhoneInput';

interface PhoneInputProps {
  value?: string;
  onChange: (phone: string, countryCode: string) => void;
  defaultCountry?: string;
  showCountrySelect?: boolean;
  format?: 'international' | 'national' | 'e164';
  validateOnBlur?: boolean;
  placeholder?: string;
}

// Usage Example
<PhoneInput
  value={userPreferences.phone}
  onChange={(phone, country) => {
    updatePreference('phone', phone);
    updatePreference('phoneCountryCode', country);
  }}
  defaultCountry={userPreferences.countryCode}
  format={userPreferences.phoneFormat}
  validateOnBlur={true}
  showCountrySelect={true}
/>
```

### **Language Selection Component**

```typescript
import { LanguageSelect } from '@/components/international/LanguageSelect';

interface LanguageSelectProps {
  value?: string;
  onChange: (languageCode: string) => void;
  showNativeNames?: boolean;
  showSpeakerCount?: boolean;
  filterRTL?: boolean; // Show only RTL or LTR languages
  groupByScript?: boolean;
  includeRegionalVariants?: boolean;
}

// Usage Example
<LanguageSelect
  value={userPreferences.languageCode}
  onChange={(lang) => {
    updatePreference('languageCode', lang);
    // Auto-detect RTL and update text direction
    const isRTL = await isLanguageRTL(lang);
    updatePreference('isRTL', isRTL);
    updatePreference('textDirection', isRTL ? 'rtl' : 'ltr');
  }}
  showNativeNames={true}
  showSpeakerCount={true}
  groupByScript={true}
/>
```

### **Currency Selection Component**

```typescript
import { CurrencySelect } from '@/components/international/CurrencySelect';

interface CurrencySelectProps {
  value?: string;
  onChange: (currencyCode: string) => void;
  showSymbols?: boolean;
  showCountries?: boolean;
  filterByCountry?: string;
  sortBy?: 'code' | 'name' | 'usage';
}

// Usage Example
<CurrencySelect
  value={userPreferences.currencyCode}
  onChange={(currency) => updatePreference('currencyCode', currency)}
  showSymbols={true}
  showCountries={true}
  filterByCountry={userPreferences.countryCode}
  sortBy="usage"
/>
```

## RTL Language Support Implementation

### **Automatic Text Direction Detection**

```typescript
// Auto-detect and apply RTL support
export const useRTLSupport = (languageCode: string) => {
  const [isRTL, setIsRTL] = useState(false);
  
  useEffect(() => {
    const checkRTL = async () => {
      const rtlLanguages = await internationalDataService.getRTLLanguages();
      const isLanguageRTL = rtlLanguages.includes(languageCode);
      setIsRTL(isLanguageRTL);
      
      // Apply direction to document
      document.documentElement.dir = isLanguageRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = languageCode;
    };
    
    checkRTL();
  }, [languageCode]);
  
  return { isRTL };
};
```

### **RTL-Aware Styling**

```css
/* CSS for RTL support */
.user-preferences-panel {
  direction: var(--text-direction, ltr);
}

.user-preferences-panel[dir="rtl"] {
  text-align: right;
}

.user-preferences-panel[dir="rtl"] .form-field {
  margin-left: 0;
  margin-right: 1rem;
}

/* Responsive design for RTL */
@media (prefers-reduced-motion: no-preference) {
  .user-preferences-panel[dir="rtl"] .slide-in {
    animation: slideInRight 0.3s ease-out;
  }
}
```

## Performance Optimization for International Data

### **Cached Service Integration**

```typescript
// Enhanced caching for international components
export class InternationalDataCache {
  private static countriesCache = new Map();
  private static timezonesCache = new Map();
  
  static async getCountriesForSelect(locale?: string): Promise<CountryOption[]> {
    const cacheKey = `countries-select-${locale || 'default'}`;
    
    if (!this.countriesCache.has(cacheKey)) {
      const countries = await internationalDataService.getCountriesWithTimezones();
      const options = countries.map(country => ({
        value: country.code,
        label: country.name,
        flag: country.flag,
        dialCode: country.dialCode,
        timezones: country.timezones
      }));
      
      this.countriesCache.set(cacheKey, options);
      
      // Auto-refresh cache every hour
      setTimeout(() => this.countriesCache.delete(cacheKey), 3600000);
    }
    
    return this.countriesCache.get(cacheKey);
  }
}
```

### **Preloading Strategy**

```typescript
// Preload international data on app start
export const preloadInternationalData = async () => {
  // Preload most common selections
  const preloadTasks = [
    InternationalDataCache.getCountriesForSelect(),
    InternationalDataCache.getTimezonesForSelect(),
    InternationalDataCache.getCurrenciesForSelect(),
    InternationalDataCache.getLanguagesForSelect()
  ];
  
  await Promise.allSettled(preloadTasks);
};
```
   - Industry-specific formats
   - Accessibility options