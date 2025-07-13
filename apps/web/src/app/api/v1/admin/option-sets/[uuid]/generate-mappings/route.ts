import { NextRequest, NextResponse } from 'next/server';
import { OptionSetsService } from '@/lib/services/option-sets.service';
import { logger } from '@/lib/logger';

// Conversion mapping rules for different types of values
const CONVERSION_RULES = {
  height: {
    // Height conversions: cm to feet/inches
    pattern: /^(\d+)\s*cm$/i,
    conversions: (cm: number) => ({
      'US': convertCmToFeetInches(cm),
      'UK': convertCmToFeetInches(cm),
      'EU': `${cm}cm`,
      'Asia': `${cm}cm`
    })
  },
  weight: {
    // Weight conversions: kg to lbs
    pattern: /^(\d+(?:\.\d+)?)\s*kg$/i,
    conversions: (kg: number) => ({
      'US': `${Math.round(kg * 2.20462)}lbs`,
      'UK': `${Math.round(kg * 2.20462)}lbs`, 
      'EU': `${kg}kg`,
      'Asia': `${kg}kg`
    })
  },
  clothingWomen: {
    // Women's clothing size conversions
    pattern: /^(XS|S|M|L|XL|XXL|\d+)$/i,
    conversions: (size: string) => {
      const sizeMap: Record<string, Record<string, string>> = {
        'XS': { 'US': 'XS', 'EU': '32', 'UK': '4', 'Asia': 'S' },
        'S': { 'US': 'S', 'EU': '34', 'UK': '6', 'Asia': 'M' },
        'M': { 'US': 'M', 'EU': '36', 'UK': '8', 'Asia': 'L' },
        'L': { 'US': 'L', 'EU': '38', 'UK': '10', 'Asia': 'XL' },
        'XL': { 'US': 'XL', 'EU': '40', 'UK': '12', 'Asia': 'XXL' },
        'XXL': { 'US': 'XXL', 'EU': '42', 'UK': '14', 'Asia': 'XXXL' },
        // Numeric US sizes
        '2': { 'US': '2', 'EU': '32', 'UK': '4', 'Asia': 'S' },
        '4': { 'US': '4', 'EU': '34', 'UK': '6', 'Asia': 'M' },
        '6': { 'US': '6', 'EU': '36', 'UK': '8', 'Asia': 'L' },
        '8': { 'US': '8', 'EU': '38', 'UK': '10', 'Asia': 'XL' },
        '10': { 'US': '10', 'EU': '40', 'UK': '12', 'Asia': 'XXL' },
        '12': { 'US': '12', 'EU': '42', 'UK': '14', 'Asia': 'XXXL' },
      };
      return sizeMap[size.toUpperCase()] || { 'US': size, 'EU': size, 'UK': size, 'Asia': size };
    }
  },
  shoeWomen: {
    // Women's shoe size conversions
    pattern: /^(\d+(?:\.\d+)?)\s*(US|EU|UK)?$/i,
    conversions: (size: number, region?: string) => {
      if (region === 'EU' || (!region && size > 30)) {
        // EU to others
        return {
          'US': `${Math.round((size - 31) * 10) / 10}`,
          'EU': `${size}`,
          'UK': `${Math.round((size - 32.5) * 10) / 10}`,
          'Asia': `${size - 1}`
        };
      } else {
        // Assume US size
        return {
          'US': `${size}`,
          'EU': `${size + 31}`,
          'UK': `${size - 1.5}`,
          'Asia': `${size + 30}`
        };
      }
    }
  }
} as const;

function convertCmToFeetInches(cm: number): string {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}ft${inches}in`;
}

function detectValueType(slug: string, value: string): keyof typeof CONVERSION_RULES | null {
  if (slug.includes('height')) return 'height';
  if (slug.includes('weight')) return 'weight';
  if (slug.includes('clothing') && slug.includes('women')) return 'clothingWomen';
  if (slug.includes('dress') && slug.includes('women')) return 'clothingWomen';
  if (slug.includes('shoe') && slug.includes('women')) return 'shoeWomen';
  return null;
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const optionSetId = parseInt(params.id);

    logger.info('[API:generate-mappings] Generating conversion mappings', { optionSetId });

    // Get the option set with its values
    const optionSet = await OptionSetsService.getOptionSetById(optionSetId);

    if (!optionSet) {
      return NextResponse.json({
        success: false,
        error: 'Option set not found',
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }

    const { values } = optionSet;
    let mappingsGenerated = 0;
    const updateResults = [];

    // Process each value and generate mappings
    for (const value of values) {
      const valueType = detectValueType(optionSet.slug, value.value);

      if (!valueType) {
        // Skip values that don't match conversion patterns
        continue;
      }

      const rule = CONVERSION_RULES[valueType];
      const match = value.value.match(rule.pattern);

      if (!match) {
        continue;
      }

      let mappings: Record<string, string> = {};

      if (valueType === 'height') {
        const cm = parseInt(match[1]);
        mappings = CONVERSION_RULES.height.conversions(cm);
      } else if (valueType === 'weight') {
        const kg = parseFloat(match[1]);
        mappings = CONVERSION_RULES.weight.conversions(kg);
      } else if (valueType === 'clothingWomen') {
        mappings = CONVERSION_RULES.clothingWomen.conversions(match[1]);
      } else if (valueType === 'shoeWomen') {
        const size = parseFloat(match[1]);
        const region = match[2];
        mappings = CONVERSION_RULES.shoeWomen.conversions(size, region);
      }

      // Update the option value with new mappings
      try {
        await OptionSetsService.updateOptionValue(value.id, {
          regionalMappings: mappings,
          metadata: {
            ...value.metadata,
            generatedMappings: true,
            generatedAt: new Date().toISOString(),
            conversionType: valueType
          }
        });

        mappingsGenerated++;
        updateResults.push({
          valueId: value.id,
          value: value.value,
          mappings,
          conversionType: valueType
        });

      } catch (updateError) {
        logger.error('[API:generate-mappings] Error updating value', { 
          valueId: value.id, 
          error: updateError 
        });
      }
    }

    logger.info('[API:generate-mappings] Mappings generated successfully', { 
      optionSetId,
      mappingsGenerated,
      totalValues: values.length
    });

    return NextResponse.json({
      success: true,
      data: {
        optionSetId,
        optionSetSlug: optionSet.slug,
        totalValues: values.length,
        mappingsGenerated,
        updateResults
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const params = await context.params;
    logger.error('[API:generate-mappings] Error generating mappings', { 
      optionSetId: params.id, 
      error 
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to generate conversion mappings',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 