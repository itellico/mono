import { DateTime } from 'luxon';

export interface ComboboxOption {
  value: string;
  label: string;
  searchTerms: string;
  flag?: string;
  offset?: string;
}

// Enhanced timezone options with current offsets and flags
export const getEnhancedTimezoneOptions = (): ComboboxOption[] => {
  const timezoneMap: Record<string, { flag: string; country: string; searchTerms: string }> = {
    'Europe/Vienna': { flag: '🇦🇹', country: 'Austria', searchTerms: 'austria central europe vienna' },
    'Europe/London': { flag: '🇬🇧', country: 'United Kingdom', searchTerms: 'uk united kingdom britain london' },
    'Europe/Paris': { flag: '🇫🇷', country: 'France', searchTerms: 'france paris' },
    'Europe/Berlin': { flag: '🇩🇪', country: 'Germany', searchTerms: 'germany deutschland berlin' },
    'Europe/Rome': { flag: '🇮🇹', country: 'Italy', searchTerms: 'italy italia rome' },
    'Europe/Madrid': { flag: '🇪🇸', country: 'Spain', searchTerms: 'spain espana madrid' },
    'America/New_York': { flag: '🇺🇸', country: 'United States', searchTerms: 'usa us eastern est new york' },
    'America/Los_Angeles': { flag: '🇺🇸', country: 'United States', searchTerms: 'usa us pacific pst california los angeles' },
    'America/Chicago': { flag: '🇺🇸', country: 'United States', searchTerms: 'usa us central cst chicago' },
    'America/Denver': { flag: '🇺🇸', country: 'United States', searchTerms: 'usa us mountain mst denver' },
    'America/Toronto': { flag: '🇨🇦', country: 'Canada', searchTerms: 'canada eastern toronto' },
    'America/Vancouver': { flag: '🇨🇦', country: 'Canada', searchTerms: 'canada pacific vancouver' },
    'Asia/Tokyo': { flag: '🇯🇵', country: 'Japan', searchTerms: 'japan jst tokyo' },
    'Asia/Shanghai': { flag: '🇨🇳', country: 'China', searchTerms: 'china beijing shanghai' },
    'Asia/Singapore': { flag: '🇸🇬', country: 'Singapore', searchTerms: 'singapore sgt' },
    'Asia/Dubai': { flag: '🇦🇪', country: 'UAE', searchTerms: 'uae emirates dubai' },
    'Australia/Sydney': { flag: '🇦🇺', country: 'Australia', searchTerms: 'australia aest sydney' },
    'Australia/Melbourne': { flag: '🇦🇺', country: 'Australia', searchTerms: 'australia aest melbourne' },
    'Pacific/Auckland': { flag: '🇳🇿', country: 'New Zealand', searchTerms: 'new zealand nzst auckland' }
  };

  return Object.entries(timezoneMap).map(([tz, info]) => {
    const dt = DateTime.now().setZone(tz);
    const offset = dt.toFormat('ZZ');
    const cityName = tz.split('/').pop() || '';

    return {
      value: tz,
      label: `${info.flag} ${cityName} (${offset})`,
      searchTerms: info.searchTerms,
      flag: info.flag,
      offset
    };
  }).sort((a, b) => a.label.localeCompare(b.label));
};

// Enhanced language options with flags
export const getEnhancedLanguageOptions = (): ComboboxOption[] => {
  const languageMap: Record<string, { flag: string; nativeName: string; searchTerms: string }> = {
    'en-US': { flag: '🇺🇸', nativeName: 'English', searchTerms: 'english american united states' },
    'en-GB': { flag: '🇬🇧', nativeName: 'English', searchTerms: 'english british britain united kingdom' },
    'de-DE': { flag: '🇩🇪', nativeName: 'Deutsch', searchTerms: 'german deutsch deutschland germany' },
    'fr-FR': { flag: '🇫🇷', nativeName: 'Français', searchTerms: 'french francais france' },
    'es-ES': { flag: '🇪🇸', nativeName: 'Español', searchTerms: 'spanish espanol spain' },
    'it-IT': { flag: '🇮🇹', nativeName: 'Italiano', searchTerms: 'italian italiano italy' },
    'pt-PT': { flag: '🇵🇹', nativeName: 'Português', searchTerms: 'portuguese portugues portugal' },
    'nl-NL': { flag: '🇳🇱', nativeName: 'Nederlands', searchTerms: 'dutch nederlands netherlands' },
    'sv-SE': { flag: '🇸🇪', nativeName: 'Svenska', searchTerms: 'swedish svenska sweden' },
    'da-DK': { flag: '🇩🇰', nativeName: 'Dansk', searchTerms: 'danish dansk denmark' },
    'no-NO': { flag: '🇳🇴', nativeName: 'Norsk', searchTerms: 'norwegian norsk norway' },
    'fi-FI': { flag: '🇫🇮', nativeName: 'Suomi', searchTerms: 'finnish suomi finland' },
    'pl-PL': { flag: '🇵🇱', nativeName: 'Polski', searchTerms: 'polish polski poland' },
    'ru-RU': { flag: '🇷🇺', nativeName: 'Русский', searchTerms: 'russian russkiy russia' },
    'ja-JP': { flag: '🇯🇵', nativeName: '日本語', searchTerms: 'japanese nihongo japan' },
    'ko-KR': { flag: '🇰🇷', nativeName: '한국어', searchTerms: 'korean hangul korea' },
    'zh-CN': { flag: '🇨🇳', nativeName: '中文', searchTerms: 'chinese mandarin china' },
    'ar-SA': { flag: '🇸🇦', nativeName: 'العربية', searchTerms: 'arabic saudi arabia' }
  };

  return Object.entries(languageMap).map(([locale, info]) => {
    const [, regionCode] = locale.split('-');
    const englishName = new Intl.DisplayNames(['en'], { type: 'language' }).of(locale.split('-')[0]) || '';
    const regionName = new Intl.DisplayNames(['en'], { type: 'region' }).of(regionCode) || '';

    return {
      value: locale,
      label: `${info.flag} ${englishName} (${regionName})`,
      searchTerms: info.searchTerms,
      flag: info.flag
    };
  }).sort((a, b) => a.label.localeCompare(b.label));
};

// Helper to format time in specific timezone
export const formatTimeInTimezone = (
  date: Date, 
  timezone: string, 
  format: string = 'yyyy-MM-dd HH:mm:ss'
): string => {
  return DateTime.fromJSDate(date).setZone(timezone).toFormat(format);
};

// Helper to get current offset for timezone
export const getTimezoneOffset = (timezone: string): string => {
  return DateTime.now().setZone(timezone).toFormat('ZZ');
};

// Helper to get timezone info
export const getTimezoneInfo = (timezone: string) => {
  const dt = DateTime.now().setZone(timezone);
  return {
    offset: dt.toFormat('ZZ'),
    offsetName: dt.toFormat('ZZZZ'),
    localTime: dt.toFormat('HH:mm'),
    isDST: dt.isInDST
  };
}; 