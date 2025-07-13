// Conversion utilities for option sets with regional standards
export type RegionCode = 'GLOBAL' | 'US' | 'UK' | 'EU' | 'Asia';

export interface ConversionResult {
  global: string;
  regions: Record<string, string>;
}

// Height conversions (cm ↔ feet/inches)
export function convertHeight(value: string, fromRegion: RegionCode = 'GLOBAL'): ConversionResult {
  const cleanValue = value.replace(/[^\d.]/g, '');
  const numericValue = parseFloat(cleanValue);

  if (isNaN(numericValue)) {
    return { global: value, regions: {} };
  }

  let cmValue: number;

  // Convert to cm first
  if (value.includes("'") || value.includes('"') || fromRegion === 'US' || fromRegion === 'UK') {
    // Assume feet/inches format
    const feet = Math.floor(numericValue);
    const inches = (numericValue - feet) * 12;
    cmValue = (feet * 12 + inches) * 2.54;
  } else {
    // Assume cm
    cmValue = numericValue;
  }

  const feet = Math.floor(cmValue / 30.48);
  const inches = Math.round((cmValue % 30.48) / 2.54);
  const feetInchesString = `${feet}'${inches}"`;

  return {
    global: `${Math.round(cmValue)} cm`,
    regions: {
      US: feetInchesString,
      UK: feetInchesString,
      EU: `${Math.round(cmValue)} cm`,
      Asia: `${Math.round(cmValue)} cm`,
    }
  };
}

// Weight conversions (kg ↔ lbs)
export function convertWeight(value: string, fromRegion: RegionCode = 'GLOBAL'): ConversionResult {
  const cleanValue = value.replace(/[^\d.]/g, '');
  const numericValue = parseFloat(cleanValue);

  if (isNaN(numericValue)) {
    return { global: value, regions: {} };
  }

  let kgValue: number;

  // Convert to kg first
  if (value.includes('lbs') || value.includes('lb') || fromRegion === 'US') {
    kgValue = numericValue * 0.453592;
  } else {
    kgValue = numericValue;
  }

  const lbsValue = kgValue * 2.20462;

  return {
    global: `${Math.round(kgValue)} kg`,
    regions: {
      US: `${Math.round(lbsValue)} lbs`,
      UK: `${Math.round(kgValue)} kg`,
      EU: `${Math.round(kgValue)} kg`,
      Asia: `${Math.round(kgValue)} kg`,
    }
  };
}

// Clothing size conversions
export function convertClothingSize(value: string, gender: 'male' | 'female' | 'unisex' = 'unisex'): ConversionResult {
  const cleanValue = value.toUpperCase().trim();

  // Size mappings for different regions
  const sizeMappings = {
    male: {
      'XS': { US: 'XS', UK: 'XS', EU: 'XS', Asia: 'S' },
      'S': { US: 'S', UK: 'S', EU: 'S', Asia: 'M' },
      'M': { US: 'M', UK: 'M', EU: 'M', Asia: 'L' },
      'L': { US: 'L', UK: 'L', EU: 'L', Asia: 'XL' },
      'XL': { US: 'XL', UK: 'XL', EU: 'XL', Asia: 'XXL' },
      'XXL': { US: 'XXL', UK: 'XXL', EU: 'XXL', Asia: 'XXXL' },
    },
    female: {
      'XS': { US: 'XS (0-2)', UK: 'UK 4-6', EU: 'EU 32-34', Asia: 'S' },
      'S': { US: 'S (4-6)', UK: 'UK 8-10', EU: 'EU 36-38', Asia: 'M' },
      'M': { US: 'M (8-10)', UK: 'UK 12-14', EU: 'EU 40-42', Asia: 'L' },
      'L': { US: 'L (12-14)', UK: 'UK 16-18', EU: 'EU 44-46', Asia: 'XL' },
      'XL': { US: 'XL (16-18)', UK: 'UK 20-22', EU: 'EU 48-50', Asia: 'XXL' },
    },
    unisex: {
      'XS': { US: 'XS', UK: 'XS', EU: 'XS', Asia: 'S' },
      'S': { US: 'S', UK: 'S', EU: 'S', Asia: 'M' },
      'M': { US: 'M', UK: 'M', EU: 'M', Asia: 'L' },
      'L': { US: 'L', UK: 'L', EU: 'L', Asia: 'XL' },
      'XL': { US: 'XL', UK: 'XL', EU: 'XL', Asia: 'XXL' },
    }
  };

  const mapping = sizeMappings[gender]?.[cleanValue as keyof typeof sizeMappings[typeof gender]];

  if (!mapping) {
    return { global: value, regions: {} };
  }

  return {
    global: cleanValue,
    regions: mapping
  };
}

// Shoe size conversions
export function convertShoeSize(value: string, gender: 'male' | 'female' = 'male'): ConversionResult {
  const numericValue = parseFloat(value);

  if (isNaN(numericValue)) {
    return { global: value, regions: {} };
  }

  // Assuming input is US size, convert to other regions
  const usSize = numericValue;
  let ukSize: number;
  let euSize: number;

  if (gender === 'male') {
    ukSize = usSize - 0.5;
    euSize = usSize + 32.5;
  } else {
    ukSize = usSize - 2;
    euSize = usSize + 30.5;
  }

  return {
    global: `US ${usSize}`,
    regions: {
      US: `US ${usSize}`,
      UK: `UK ${ukSize}`,
      EU: `EU ${Math.round(euSize)}`,
      Asia: `${Math.round(euSize + 1)}`, // Asia typically runs smaller
    }
  };
}

// Color/attribute translations
export function convertAttribute(value: string, translations: Record<string, Record<string, string>> = {}): ConversionResult {
  const cleanValue = value.toLowerCase().trim();

  const defaultTranslations: Record<string, Record<string, string>> = {
    'brown': { US: 'Brown', UK: 'Brown', EU: 'Marron', Asia: 'Brown' },
    'blonde': { US: 'Blonde', UK: 'Blonde', EU: 'Blond', Asia: 'Blonde' },
    'black': { US: 'Black', UK: 'Black', EU: 'Noir', Asia: 'Black' },
    'blue': { US: 'Blue', UK: 'Blue', EU: 'Bleu', Asia: 'Blue' },
    'green': { US: 'Green', UK: 'Green', EU: 'Vert', Asia: 'Green' },
  };

  const translation = translations[cleanValue] || defaultTranslations[cleanValue];

  if (!translation) {
    return { global: value, regions: {} };
  }

  return {
    global: value,
    regions: translation
  };
}

// Main conversion function that determines type and applies appropriate conversion
export function convertValue(
  value: string, 
  optionSetSlug: string, 
  metadata: { gender?: 'male' | 'female' | 'unisex'; type?: string } = {}
): ConversionResult {
  const slug = optionSetSlug.toLowerCase();

  if (slug.includes('height') || slug.includes('tall')) {
    return convertHeight(value);
  }

  if (slug.includes('weight')) {
    return convertWeight(value);
  }

  if (slug.includes('clothing') || slug.includes('dress') || slug.includes('shirt')) {
    return convertClothingSize(value, metadata.gender);
  }

  if (slug.includes('shoe') || slug.includes('foot')) {
    return convertShoeSize(value, metadata.gender as 'male' | 'female');
  }

  if (slug.includes('hair') || slug.includes('eye') || slug.includes('skin')) {
    return convertAttribute(value);
  }

  // Default: no conversion
  return { global: value, regions: {} };
}

// Generate conversion matrix for an entire option set
export function generateConversionMatrix(optionSet: {
  slug: string;
  values: Array<{ value: string; label: string; }>;
  metadata?: { gender?: 'male' | 'female' | 'unisex'; type?: string };
}): Array<{ global: string; conversions: ConversionResult }> {
  return optionSet.values.map(optionValue => {
    const conversion = convertValue(
      optionValue.label || optionValue.value, 
      optionSet.slug, 
      optionSet.metadata
    );

    return {
      global: optionValue.label || optionValue.value,
      conversions: conversion
    };
  });
}