/**
 * Profile Completion Calculation Utility
 */

export function calculateProfileCompletion(profile: any): number {
  const fields = [
    'professionalName',
    'tagline', 
    'yearsExperience',
    'specialties',
    'professionalEmail',
    'baseLocation',
    'websiteUrl',
    'keywords',
    'industryData',
  ];

  let filledFields = 0;
  
  for (const field of fields) {
    const value = profile[field];
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        if (value.length > 0) filledFields++;
      } else if (typeof value === 'object') {
        if (Object.keys(value).length > 0) filledFields++;
      } else {
        filledFields++;
      }
    }
  }
  
  return Math.round((filledFields / fields.length) * 100);
}