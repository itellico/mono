# Regional Measurement System Implementation Guide

## Overview

This document outlines the implementation of a comprehensive regional measurement system for the itellico Mono, handling global variations in measurement units while maintaining searchable base values.

## Core Principle: Store Base, Display Regional

### Storage Strategy
- **Always store in standardized base units** (metric/EU standards)
- **Convert for display** based on user/tenant preferences
- **Convert for input** from regional formats to base values
- **Search using base values** for consistent results

## Database Schema

### Base Storage Fields
```sql
-- Model profile measurements (ALWAYS in base units)
height_cm INTEGER,                    -- Base: centimeters
weight_kg DECIMAL(5,2),              -- Base: kilograms  
bust_cm INTEGER,                     -- Base: centimeters
waist_cm INTEGER,                    -- Base: centimeters
hips_cm INTEGER,                     -- Base: centimeters
dress_size_base VARCHAR(10),         -- Base: EU sizing (34, 36, 38)
shoe_size_base DECIMAL(4,1),         -- Base: EU sizing (36.0, 37.5)

-- User display preferences
preferred_measurement_system VARCHAR(10), -- 'metric', 'imperial'
preferred_size_system VARCHAR(10),        -- 'eu', 'us', 'uk', 'asia'
```

### Conversion Tables
```sql
-- Complete conversion mapping
CREATE TABLE measurement_conversions (
  measurement_type VARCHAR(50),    -- 'height', 'weight', 'dress_size', 'shoe_size'
  region VARCHAR(10),             -- 'us', 'eu', 'uk', 'asia', 'jp'
  gender VARCHAR(10),             -- 'male', 'female', 'unisex', 'child'
  category VARCHAR(30),           -- 'general', 'petite', 'plus_size', 'tall', 'child'
  
  base_value DECIMAL(8,2),        -- Standard metric/EU value
  regional_value VARCHAR(20),     -- Regional equivalent (can be text)
  regional_display VARCHAR(50),   -- User-friendly display format
  
  -- Age ranges for children's sizing
  age_min INTEGER,                -- Minimum age (for children's sizes)
  age_max INTEGER                 -- Maximum age (for children's sizes)
);
```

## Conversion Examples

### Height Conversions
```sql
INSERT INTO measurement_conversions VALUES
-- Metric to Imperial
('height', 'us', 'unisex', 'general', 150.0, '4''11"', '4 feet 11 inches', NULL, NULL),
('height', 'us', 'unisex', 'general', 155.0, '5''1"', '5 feet 1 inch', NULL, NULL),
('height', 'us', 'unisex', 'general', 160.0, '5''3"', '5 feet 3 inches', NULL, NULL),
('height', 'us', 'unisex', 'general', 165.0, '5''5"', '5 feet 5 inches', NULL, NULL),
('height', 'us', 'unisex', 'general', 170.0, '5''7"', '5 feet 7 inches', NULL, NULL),
('height', 'us', 'unisex', 'general', 175.0, '5''9"', '5 feet 9 inches', NULL, NULL),
('height', 'us', 'unisex', 'general', 180.0, '5''11"', '5 feet 11 inches', NULL, NULL),
('height', 'us', 'unisex', 'general', 185.0, '6''1"', '6 feet 1 inch', NULL, NULL);
```

### Shoe Size Conversions (Women's)
```sql
INSERT INTO measurement_conversions VALUES
-- EU to US Women's
('shoe_size', 'us', 'female', 'general', 35.0, '5', 'US 5', NULL, NULL),
('shoe_size', 'us', 'female', 'general', 36.0, '6', 'US 6', NULL, NULL),
('shoe_size', 'us', 'female', 'general', 37.0, '6.5', 'US 6.5', NULL, NULL),
('shoe_size', 'us', 'female', 'general', 38.0, '7.5', 'US 7.5', NULL, NULL),
('shoe_size', 'us', 'female', 'general', 39.0, '8.5', 'US 8.5', NULL, NULL),
('shoe_size', 'us', 'female', 'general', 40.0, '9', 'US 9', NULL, NULL),
('shoe_size', 'us', 'female', 'general', 41.0, '9.5', 'US 9.5', NULL, NULL),
('shoe_size', 'us', 'female', 'general', 42.0, '10.5', 'US 10.5', NULL, NULL),

-- EU to UK Women's  
('shoe_size', 'uk', 'female', 'general', 35.0, '2.5', 'UK 2.5', NULL, NULL),
('shoe_size', 'uk', 'female', 'general', 36.0, '3', 'UK 3', NULL, NULL),
('shoe_size', 'uk', 'female', 'general', 37.0, '4', 'UK 4', NULL, NULL),
('shoe_size', 'uk', 'female', 'general', 38.0, '5', 'UK 5', NULL, NULL),
('shoe_size', 'uk', 'female', 'general', 39.0, '6', 'UK 6', NULL, NULL),
('shoe_size', 'uk', 'female', 'general', 40.0, '6.5', 'UK 6.5', NULL, NULL),

-- EU to Asian (cm-based)
('shoe_size', 'asia', 'female', 'general', 35.0, '22.5', '22.5cm', NULL, NULL),
('shoe_size', 'asia', 'female', 'general', 36.0, '23', '23cm', NULL, NULL),
('shoe_size', 'asia', 'female', 'general', 37.0, '23.5', '23.5cm', NULL, NULL),
('shoe_size', 'asia', 'female', 'general', 38.0, '24', '24cm', NULL, NULL),
('shoe_size', 'asia', 'female', 'general', 39.0, '24.5', '24.5cm', NULL, NULL);
```

### Dress Size Conversions (Women's)
```sql
INSERT INTO measurement_conversions VALUES
-- EU to US Women's
('dress_size', 'us', 'female', 'general', 32.0, '0', 'Size 0', NULL, NULL),
('dress_size', 'us', 'female', 'general', 34.0, '2', 'Size 2', NULL, NULL),
('dress_size', 'us', 'female', 'general', 36.0, '4', 'Size 4', NULL, NULL),
('dress_size', 'us', 'female', 'general', 38.0, '6', 'Size 6', NULL, NULL),
('dress_size', 'us', 'female', 'general', 40.0, '8', 'Size 8', NULL, NULL),
('dress_size', 'us', 'female', 'general', 42.0, '10', 'Size 10', NULL, NULL),
('dress_size', 'us', 'female', 'general', 44.0, '12', 'Size 12', NULL, NULL),

-- EU to UK Women's
('dress_size', 'uk', 'female', 'general', 32.0, '4', 'Size 4', NULL, NULL),
('dress_size', 'uk', 'female', 'general', 34.0, '6', 'Size 6', NULL, NULL),
('dress_size', 'uk', 'female', 'general', 36.0, '8', 'Size 8', NULL, NULL),
('dress_size', 'uk', 'female', 'general', 38.0, '10', 'Size 10', NULL, NULL),
('dress_size', 'uk', 'female', 'general', 40.0, '12', 'Size 12', NULL, NULL),

-- EU to Asian (letter sizing)
('dress_size', 'asia', 'female', 'general', 32.0, 'XXS', 'XXS', NULL, NULL),
('dress_size', 'asia', 'female', 'general', 34.0, 'XS', 'XS', NULL, NULL),
('dress_size', 'asia', 'female', 'general', 36.0, 'S', 'Small', NULL, NULL),
('dress_size', 'asia', 'female', 'general', 38.0, 'M', 'Medium', NULL, NULL),
('dress_size', 'asia', 'female', 'general', 40.0, 'L', 'Large', NULL, NULL),
('dress_size', 'asia', 'female', 'general', 42.0, 'XL', 'XL', NULL, NULL);
```

### Children's Sizing
```sql
INSERT INTO measurement_conversions VALUES
-- Children's clothing (age-based)
('dress_size', 'us', 'child', 'general', 86.0, '2T', 'Size 2T', 2, 3),
('dress_size', 'us', 'child', 'general', 92.0, '3T', 'Size 3T', 3, 4),
('dress_size', 'us', 'child', 'general', 98.0, '4T', 'Size 4T', 4, 5),
('dress_size', 'us', 'child', 'general', 104.0, '5', 'Size 5', 5, 6),
('dress_size', 'us', 'child', 'general', 110.0, '6', 'Size 6', 6, 7),

-- Children's shoes
('shoe_size', 'us', 'child', 'general', 19.0, '3', 'US 3 (Child)', 1, 3),
('shoe_size', 'us', 'child', 'general', 20.0, '4', 'US 4 (Child)', 2, 4),
('shoe_size', 'us', 'child', 'general', 21.0, '5', 'US 5 (Child)', 3, 5),
('shoe_size', 'us', 'child', 'general', 22.0, '6', 'US 6 (Child)', 4, 6);
```

## TypeScript Service Implementation

```typescript
export interface RegionalPreferences {
  heightSystem: 'metric' | 'imperial';
  weightSystem: 'metric' | 'imperial'; 
  clothingSizeRegion: 'eu' | 'us' | 'uk' | 'asia' | 'jp';
  shoeSizeRegion: 'eu' | 'us' | 'uk' | 'asia' | 'jp';
}

export class RegionalMeasurementService {
  private conversionCache = new Map<string, any>();
  
  /**
   * Convert base metric value to regional display format
   */
  async formatForDisplay(
    baseValue: number,
    measurementType: string,
    preferences: RegionalPreferences,
    gender: 'male' | 'female' | 'unisex' = 'unisex',
    age?: number
  ): Promise<string> {
    
    const cacheKey = `${measurementType}_${baseValue}_${preferences}_${gender}_${age}`;
    if (this.conversionCache.has(cacheKey)) {
      return this.conversionCache.get(cacheKey);
    }
    
    let result: string;
    
    switch (measurementType) {
      case 'height':
        result = this.formatHeight(baseValue, preferences.heightSystem);
        break;
        
      case 'weight':
        result = this.formatWeight(baseValue, preferences.weightSystem);
        break;
        
      case 'dress_size':
        result = await this.formatClothingSize(baseValue, preferences.clothingSizeRegion, gender, age);
        break;
        
      case 'shoe_size':
        result = await this.formatShoeSize(baseValue, preferences.shoeSizeRegion, gender, age);
        break;
        
      default:
        result = baseValue.toString();
    }
    
    this.conversionCache.set(cacheKey, result);
    return result;
  }
  
  /**
   * Convert regional input to base metric value
   */
  async parseToBaseValue(
    regionalValue: string,
    measurementType: string,
    sourceRegion: string,
    gender: 'male' | 'female' | 'unisex' = 'unisex',
    age?: number
  ): Promise<number> {
    
    switch (measurementType) {
      case 'height':
        return this.parseHeight(regionalValue, sourceRegion);
        
      case 'weight':
        return this.parseWeight(regionalValue, sourceRegion);
        
      case 'dress_size':
      case 'shoe_size':
        return await this.lookupBaseValue(regionalValue, measurementType, sourceRegion, gender, age);
        
      default:
        return parseFloat(regionalValue);
    }
  }
  
  private formatHeight(heightCm: number, system: 'metric' | 'imperial'): string {
    if (system === 'imperial') {
      const totalInches = Math.round(heightCm / 2.54);
      const feet = Math.floor(totalInches / 12);
      const inches = totalInches % 12;
      return `${feet}'${inches}"`;
    }
    return `${heightCm} cm`;
  }
  
  private formatWeight(weightKg: number, system: 'metric' | 'imperial'): string {
    if (system === 'imperial') {
      const pounds = Math.round(weightKg * 2.20462);
      return `${pounds} lbs`;
    }
    return `${weightKg} kg`;
  }
  
  private parseHeight(value: string, region: string): number {
    if (region === 'us' && value.includes("'")) {
      // Parse formats like "5'8\"" or "5'8" 
      const cleaned = value.replace(/['"]/g, '');
      const [feet, inches = '0'] = cleaned.split("'");
      const totalInches = parseInt(feet) * 12 + parseInt(inches);
      return Math.round(totalInches * 2.54); // Convert to cm
    }
    return parseInt(value); // Already in cm
  }
  
  private parseWeight(value: string, region: string): number {
    const numValue = parseFloat(value);
    if (region === 'us') {
      return numValue / 2.20462; // Convert lbs to kg
    }
    return numValue; // Already in kg
  }
  
  private async formatClothingSize(
    baseSize: number, 
    region: string, 
    gender: string,
    age?: number
  ): Promise<string> {
    const category = age && age < 16 ? 'child' : 'general';
    
    const conversion = await this.db.query(`
      SELECT regional_display 
      FROM measurement_conversions 
      WHERE measurement_type = 'dress_size'
        AND region = $1 
        AND gender = $2
        AND category = $3
        AND base_value = $4
        AND ($5 IS NULL OR ($5 BETWEEN age_min AND age_max))
    `, [region, gender, category, baseSize, age]);
    
    return conversion.rows[0]?.regional_display || `EU ${baseSize}`;
  }
  
  private async formatShoeSize(
    baseSize: number, 
    region: string, 
    gender: string,
    age?: number
  ): Promise<string> {
    const category = age && age < 16 ? 'child' : 'general';
    
    const conversion = await this.db.query(`
      SELECT regional_display 
      FROM measurement_conversions 
      WHERE measurement_type = 'shoe_size'
        AND region = $1 
        AND gender = $2
        AND category = $3
        AND base_value = $4
        AND ($5 IS NULL OR ($5 BETWEEN age_min AND age_max))
    `, [region, gender, category, baseSize, age]);
    
    return conversion.rows[0]?.regional_display || `EU ${baseSize}`;
  }
  
  /**
   * Search models with regional filter conversion
   */
  async searchWithRegionalFilters(filters: {
    heightMin?: string;
    heightMax?: string;
    heightRegion?: string;
    shoeSizeMin?: string;
    shoeSizeMax?: string;
    shoeSizeRegion?: string;
    // ... other filters
  }) {
    // Convert all regional inputs to base values
    const baseFilters: any = {};
    
    if (filters.heightMin) {
      baseFilters.heightMinCm = await this.parseToBaseValue(
        filters.heightMin, 
        'height', 
        filters.heightRegion || 'eu'
      );
    }
    
    if (filters.heightMax) {
      baseFilters.heightMaxCm = await this.parseToBaseValue(
        filters.heightMax, 
        'height', 
        filters.heightRegion || 'eu'
      );
    }
    
    if (filters.shoeSizeMin) {
      baseFilters.shoeSizeMinEu = await this.parseToBaseValue(
        filters.shoeSizeMin, 
        'shoe_size', 
        filters.shoeSizeRegion || 'eu'
      );
    }
    
    // Build SQL query using base values
    let query = `
      SELECT * FROM model_profiles 
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;
    
    if (baseFilters.heightMinCm) {
      query += ` AND height_cm >= $${paramIndex}`;
      params.push(baseFilters.heightMinCm);
      paramIndex++;
    }
    
    if (baseFilters.heightMaxCm) {
      query += ` AND height_cm <= $${paramIndex}`;
      params.push(baseFilters.heightMaxCm);
      paramIndex++;
    }
    
    if (baseFilters.shoeSizeMinEu) {
      query += ` AND shoe_size_base >= $${paramIndex}`;
      params.push(baseFilters.shoeSizeMinEu);
      paramIndex++;
    }
    
    return this.db.query(query, params);
  }
}
```

## Frontend Implementation

```typescript
// React component for measurement input
export function MeasurementInput({ 
  measurementType, 
  value, 
  onChange, 
  userPreferences 
}: {
  measurementType: 'height' | 'weight' | 'dress_size' | 'shoe_size';
  value: number; // Always base value
  onChange: (baseValue: number) => void;
  userPreferences: RegionalPreferences;
}) {
  const [displayValue, setDisplayValue] = useState('');
  const measurementService = new RegionalMeasurementService();
  
  useEffect(() => {
    // Convert base value to regional display
    measurementService.formatForDisplay(value, measurementType, userPreferences)
      .then(setDisplayValue);
  }, [value, measurementType, userPreferences]);
  
  const handleInputChange = async (inputValue: string) => {
    setDisplayValue(inputValue);
    
    // Convert regional input back to base value
    const region = measurementType.includes('size') 
      ? userPreferences.clothingSizeRegion 
      : userPreferences.heightSystem === 'imperial' ? 'us' : 'eu';
      
    const baseValue = await measurementService.parseToBaseValue(
      inputValue, 
      measurementType, 
      region
    );
    
    onChange(baseValue);
  };
  
  return (
    <div>
      <input 
        value={displayValue}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={getPlaceholder(measurementType, userPreferences)}
      />
      <span className="hint">
        {getHintText(measurementType, userPreferences)}
      </span>
    </div>
  );
}
```

## Search Implementation

```typescript
// Search component with regional awareness
export function ModelSearchForm() {
  const [filters, setFilters] = useState({
    heightMin: '',
    heightMax: '',
    shoeSizeMin: '',
    shoeSizeMax: ''
  });
  
  const { userPreferences } = useUserPreferences();
  const measurementService = new RegionalMeasurementService();
  
  const handleSearch = async () => {
    // Service automatically converts regional inputs to base values
    const results = await measurementService.searchWithRegionalFilters({
      ...filters,
      heightRegion: userPreferences.heightSystem === 'imperial' ? 'us' : 'eu',
      shoeSizeRegion: userPreferences.shoeSizeRegion
    });
    
    // Results contain base values, format for display
    const formattedResults = await Promise.all(
      results.map(async (model) => ({
        ...model,
        displayHeight: await measurementService.formatForDisplay(
          model.height_cm, 'height', userPreferences
        ),
        displayShoeSize: await measurementService.formatForDisplay(
          model.shoe_size_base, 'shoe_size', userPreferences, model.gender
        )
      }))
    );
    
    return formattedResults;
  };
  
  return (
    <form>
      <MeasurementInput 
        measurementType="height"
        value={filters.heightMin}
        onChange={(value) => setFilters({...filters, heightMin: value})}
        userPreferences={userPreferences}
      />
      {/* ... other inputs */}
    </form>
  );
}
```

## Benefits of This Approach

### 1. **Consistent Search Results**
- All searches use standardized base values
- A 5'8" search (US) finds the same models as a 173cm search (EU)

### 2. **Seamless User Experience**  
- Users see measurements in their preferred format
- Input validation matches their regional expectations
- No mental conversion required

### 3. **Data Integrity**
- Single source of truth (base values)
- No data duplication
- Consistent across all features

### 4. **Scalability**
- Easy to add new regions/formats
- Conversion logic is centralized
- Cache frequently used conversions

### 5. **Global Marketplace**
- US agencies can search European models seamlessly
- Asian models appear in US searches with correct sizing
- Eliminates regional marketplace silos

This system ensures that your global modeling platform works seamlessly across all regions while maintaining data consistency and search accuracy.