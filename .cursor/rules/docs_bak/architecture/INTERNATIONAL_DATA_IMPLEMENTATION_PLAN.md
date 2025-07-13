# Implementation Plan: International Data & Searchable Dropdowns

## Overview

This document outlines the implementation plan for integrating timezone, country, language, and phone number packages with searchable dropdown components in the itellico Mono.

## Phase 1: Package Installation & Setup (Day 1)

### 1.1 Install Core Packages
```bash
# Timezone packages
npm install @internationalized/date timezone-support

# Country/Language packages  
npm install i18n-iso-countries iso-639-1 flag-icons

# Phone validation
npm install libphonenumber-js react-phone-number-input

# Searchable components (using existing Radix + cmdk)
npm install cmdk fuse.js

# Utilities
npm install lodash.debounce
```

### 1.2 TypeScript Types
```bash
npm install -D @types/i18n-iso-countries
```

### 1.3 Create Base Data Types
```typescript
// src/types/international.ts
export interface TimezoneData {
  value: string;          // IANA identifier
  label: string;          // Display name
  offset: string;         // Current offset
  offsetMinutes: number;
  abbreviation: string;
  isDST: boolean;
  country?: string;
  cities?: string[];
}

export interface CountryData {
  code: string;           // ISO 3166-1 alpha-2
  code3: string;          // ISO 3166-1 alpha-3
  numericCode: string;
  name: string;
  nativeName: string;
  flag: string;           // Emoji
  flagSvg: string;        // SVG path
  languages: string[];
  currency: string;
  phoneCode: string;
  timezones: string[];
  continent: string;
}

export interface LanguageData {
  code: string;           // ISO 639-1
  name: string;
  nativeName: string;
  rtl: boolean;
  countries: string[];
}

export interface PhoneData {
  country: string;
  phoneCode: string;
  format: string;
  example: string;
}
```

## Phase 2: Data Service Layer (Day 2)

### 2.1 Create International Data Service
```typescript
// src/lib/services/international-data.service.ts
import { CacheService } from '@/lib/cache/cache.service';

export class InternationalDataService {
  private static instance: InternationalDataService;
  private cache: CacheService;
  
  // Singleton pattern
  static getInstance(): InternationalDataService;
  
  // Data loaders with caching
  async getTimezones(): Promise<TimezoneData[]>;
  async getCountries(locale?: string): Promise<CountryData[]>;
  async getLanguages(): Promise<LanguageData[]>;
  async getPhoneFormats(): Promise<PhoneData[]>;
  
  // Search methods
  searchTimezones(query: string): Promise<TimezoneData[]>;
  searchCountries(query: string, locale?: string): Promise<CountryData[]>;
  
  // Validation methods
  validateTimezone(timezone: string): boolean;
  validateCountryCode(code: string): boolean;
  validateLanguageCode(code: string): boolean;
}
```

### 2.2 Data Processing Scripts
```typescript
// scripts/process-international-data.ts
// Process and optimize data for production use
// Generate minified versions for common use cases
// Create search indices
```

### 2.3 Cache Strategy
- Cache processed data in Redis with 24-hour TTL
- Use three-level caching (memory → Redis → source)
- Implement cache warming on server start
- Version cache keys for easy updates

## Phase 3: Searchable Dropdown Components (Day 3-4)

### 3.1 Base Searchable Select Component
```typescript
// src/components/ui/searchable-select.tsx
interface SearchableSelectProps<T> {
  options: T[];
  value: T | null;
  onChange: (value: T | null) => void;
  
  // Display
  getOptionLabel: (option: T) => string;
  getOptionValue: (option: T) => string;
  placeholder?: string;
  
  // Search
  searchable?: boolean;
  searchKeys?: string[];
  minSearchLength?: number;
  
  // Rendering
  renderOption?: (option: T) => React.ReactNode;
  renderValue?: (option: T) => React.ReactNode;
  
  // Performance
  virtualized?: boolean;
  itemHeight?: number;
  
  // Async
  onSearch?: (query: string) => Promise<T[]>;
  loading?: boolean;
}

export function SearchableSelect<T>({ ... }: SearchableSelectProps<T>) {
  // Implementation using Radix Select + cmdk
}
```

### 3.2 Specialized Components

#### Timezone Select
```typescript
// src/components/form/timezone-select.tsx
interface TimezoneSelectProps {
  value: string | null;
  onChange: (timezone: string | null) => void;
  placeholder?: string;
  showOffset?: boolean;
  groupByContinent?: boolean;
  popularTimezones?: string[]; // Show these first
}

export function TimezoneSelect(props: TimezoneSelectProps) {
  // Uses SearchableSelect with timezone-specific features
  // Groups by region (America/, Europe/, etc.)
  // Shows current time in each timezone
  // Displays offset from user's current timezone
}
```

#### Country Select
```typescript
// src/components/form/country-select.tsx
interface CountrySelectProps {
  value: string | null;
  onChange: (countryCode: string | null) => void;
  placeholder?: string;
  showFlags?: boolean;
  showPhoneCode?: boolean;
  preferredCountries?: string[]; // Show at top
  excludeCountries?: string[];    // Hide these
  locale?: string;                 // Display language
}

export function CountrySelect(props: CountrySelectProps) {
  // Uses SearchableSelect with country features
  // Shows flag icons
  // Searchable by name, code, native name
  // Optional phone code display
}
```

#### Language Select
```typescript
// src/components/form/language-select.tsx
interface LanguageSelectProps {
  value: string | null;
  onChange: (languageCode: string | null) => void;
  placeholder?: string;
  showNativeName?: boolean;
  showCountries?: boolean;
  popularLanguages?: string[];
}
```

#### Phone Input
```typescript
// src/components/form/phone-input.tsx
interface PhoneInputProps {
  value: string;
  country: string;
  onChange: (value: string, country: string) => void;
  placeholder?: string;
  preferredCountries?: string[];
  onlyCountries?: string[];
  excludeCountries?: string[];
  autoFormat?: boolean;
  nationalMode?: boolean;
}

export function PhoneInput(props: PhoneInputProps) {
  // Integrated country selector
  // Real-time validation
  // Format as you type
  // Show example number
}
```

### 3.3 Composite Component Features

```typescript
// Common features across all searchable dropdowns
- Keyboard navigation (Arrow keys, Enter, Escape)
- Focus management
- ARIA labels and announcements
- Loading states
- Empty states with helpful messages
- Error states with validation messages
- Clear button
- Multi-select support (where applicable)
- Grouped options
- Custom option rendering
- Responsive design
- RTL support
```

## Phase 4: Integration with User Preferences (Day 5)

### 4.1 Update Preference Form
```typescript
// src/components/admin/user-preferences-form.tsx
export function UserPreferencesForm({ user }: { user: User }) {
  const [preferences, setPreferences] = useState<UserDisplayPreferences>();
  
  return (
    <form>
      {/* Timezone Selection */}
      <FormField>
        <Label>Timezone</Label>
        <TimezoneSelect
          value={preferences.timezone}
          onChange={(tz) => updatePreference('timezone', tz)}
          showOffset
          groupByContinent
        />
      </FormField>
      
      {/* Country Selection */}
      <FormField>
        <Label>Country</Label>
        <CountrySelect
          value={preferences.countryCode}
          onChange={(code) => {
            updatePreference('countryCode', code);
            // Auto-update currency and timezone suggestions
            updateRelatedPreferences(code);
          }}
          showFlags
          locale={preferences.locale}
        />
      </FormField>
      
      {/* Language Selection */}
      <FormField>
        <Label>Display Language</Label>
        <LanguageSelect
          value={preferences.languageCode}
          onChange={(lang) => updatePreference('languageCode', lang)}
          showNativeName
        />
      </FormField>
      
      {/* Phone Number */}
      <FormField>
        <Label>Phone Number</Label>
        <PhoneInput
          value={user.phone}
          country={preferences.countryCode}
          onChange={(phone, country) => {
            updatePhone(phone);
            if (country !== preferences.countryCode) {
              suggestCountryUpdate(country);
            }
          }}
          autoFormat
        />
      </FormField>
    </form>
  );
}
```

### 4.2 Smart Defaults & Suggestions
```typescript
// src/lib/utils/preference-suggestions.ts

// Suggest preferences based on related data
export function suggestPreferences(data: Partial<UserDisplayPreferences>) {
  const suggestions: PreferenceSuggestions = {};
  
  // Country → Currency, Timezone, Phone format
  if (data.countryCode) {
    suggestions.currency = getCountryCurrency(data.countryCode);
    suggestions.timezones = getCountryTimezones(data.countryCode);
    suggestions.phoneFormat = getCountryPhoneFormat(data.countryCode);
  }
  
  // Language → Date/Time format, Number format
  if (data.languageCode) {
    suggestions.dateFormat = getDefaultDateFormat(data.languageCode);
    suggestions.numberFormat = getDefaultNumberFormat(data.languageCode);
  }
  
  // Browser detection fallbacks
  if (!data.timezone) {
    suggestions.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  
  return suggestions;
}
```

## Phase 5: Admin Interface Integration (Day 6)

### 5.1 Update Admin Edit Components
```typescript
// src/components/admin/edit/[entity]/composite-edit.tsx

// Add preference fields to user/account editing
const preferenceFields = [
  {
    name: 'timezone',
    label: 'Timezone',
    component: TimezoneSelect,
    props: { showOffset: true, groupByContinent: true }
  },
  {
    name: 'countryCode',
    label: 'Country',
    component: CountrySelect,
    props: { showFlags: true, showPhoneCode: true }
  },
  {
    name: 'languageCode',
    label: 'Language',
    component: LanguageSelect,
    props: { showNativeName: true }
  },
  {
    name: 'phone',
    label: 'Phone Number',
    component: PhoneInput,
    props: { autoFormat: true }
  }
];
```

### 5.2 Bulk Operations Support
```typescript
// Support bulk updating preferences for multiple users
export function BulkPreferenceUpdate() {
  // Select multiple users
  // Apply timezone/language/country changes
  // Preview changes before applying
  // Audit trail for bulk updates
}
```

## Phase 6: Testing & Migration (Day 7-8)

### 6.1 Testing Strategy
```typescript
// Unit tests
- Data service methods
- Validation functions  
- Search algorithms
- Component rendering

// Integration tests
- API endpoints with new data
- Form submissions
- Cache behavior
- Performance benchmarks

// E2E tests
- Complete preference update flow
- Search functionality
- Keyboard navigation
- Mobile responsiveness
```

### 6.2 Data Migration
```sql
-- Migrate existing data to new format
-- Validate existing timezones against IANA
-- Normalize country codes to ISO 3166-1
-- Validate and format phone numbers
```

### 6.3 Performance Testing
- Test with 10,000+ timezone options
- Measure search response times
- Monitor bundle size impact
- Check memory usage with large datasets

## Phase 7: Documentation & Training (Day 9)

### 7.1 Developer Documentation
- Component API reference
- Usage examples
- Integration guides
- Troubleshooting guide

### 7.2 User Documentation  
- How to update preferences
- Timezone selection guide
- Phone number formats
- Language options

## Phase 8: Deployment (Day 10)

### 8.1 Deployment Checklist
- [ ] Database migrations applied
- [ ] Cache warmed with international data
- [ ] Feature flags configured
- [ ] Monitoring alerts set up
- [ ] Rollback plan ready

### 8.2 Progressive Rollout
1. Enable for internal team
2. Roll out to 10% of users
3. Monitor for issues
4. Full deployment

## Performance Targets

- Dropdown open: < 100ms
- Search response: < 50ms  
- Initial data load: < 200ms
- Bundle size increase: < 100KB (critical path)

## Success Metrics

- User preference completion rate > 80%
- Search success rate > 95%
- Performance targets met
- Zero accessibility issues
- Support ticket reduction

## Risk Mitigation

1. **Bundle Size**: Use code splitting and lazy loading
2. **Data Accuracy**: Regular updates from official sources
3. **Performance**: Implement virtual scrolling for large lists
4. **Accessibility**: Comprehensive testing with screen readers
5. **Browser Support**: Test on all target browsers

## Timeline Summary

- **Week 1**: Package setup, data services, components
- **Week 2**: Integration, testing, deployment

Total estimated time: 10 working days