export const AVAILABLE_REGIONS = [
  { code: 'GLOBAL', name: 'Global', flag: '🌍' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'EU', name: 'Europe', flag: '🇪🇺' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'Asia', name: 'Asia', flag: '🌏' },
] as const;

export type RegionCode = typeof AVAILABLE_REGIONS[number]['code']; 