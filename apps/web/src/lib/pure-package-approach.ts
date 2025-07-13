// ALTERNATIVE APPROACH: Pure Package-Based
// Store timezone/language names directly in accounts table

import { DateTime } from 'luxon';
import countries from 'world-countries';
import * as ct from 'countries-and-timezones';

// Instead of timezoneId: integer, use timezone: string
interface AccountsAlternative {
  id: bigint;
  email: string;
  timezone: string;        // 'Europe/Vienna' directly
  language: string;        // 'de-DE' directly  
  // ... other fields
}

// Benefits:
// ✅ No foreign key constraints
// ✅ Direct package integration  
// ✅ No database sync needed
// ✅ Always up-to-date

// Trade-offs:
// ❌ No referential integrity
// ❌ Possible invalid timezone names
// ❌ Less normalized structure

export const getTimezoneInfo = (timezone: string) => {
  const packageTz = ct.getTimezone(timezone);
  const dt = DateTime.now().setZone(timezone);

  return {
    name: timezone,
    offset: dt.toFormat('ZZ'),
    offsetName: dt.toFormat('ZZZZ'),
    isDST: dt.isInDST,
    country: countries.find(c => (c as any).timezones?.includes(timezone))
  };
};

// Example usage:
// accounts.timezone = 'Europe/Vienna'  // Store directly
// const info = getTimezoneInfo(accounts.timezone)  // Get real-time data 

 