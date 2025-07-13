# itellico Mono - Option Sets & Model Schemas Architecture

## Executive Summary

itellico Mono implements a sophisticated **option sets and model schemas system** that enables dynamic form generation, regional conversions, and industry-specific profile creation. This system separates data modeling from presentation, allowing for flexible multi-tenant marketplace customization across different modeling industries (child, fitness, pet, voice, etc.).

## Core Concepts

### 1. Option Sets - The Foundation of Dynamic Data

**Option Sets** are reusable collections of predefined values used in dropdowns, selections, and multi-choice fields. They provide the building blocks for dynamic forms while maintaining data consistency and enabling regional variations.

```typescript
// Core Structure
OptionSet {
  id: number;
  slug: string;           // Unique identifier (e.g., "height_cm", "eye_colors")
  label: string;          // Display name (e.g., "Height (Centimeters)")
  tenantId: number | null; // Multi-tenant isolation (null = global)
  values: OptionValue[];   // Collection of available options
}

OptionValue {
  id: number;
  value: string;                    // Stored value (e.g., "170")
  label: string;                    // Display label (e.g., "170 cm")
  order: number;                    // Sort order in dropdowns
  canonicalRegion: string;          // Base region (e.g., "GLOBAL", "EU")
  regionalMappings: Record<string, string>; // Regional conversions
  metadata: Record<string, any>;    // Additional context
}
```

### 2. Model Schemas - Dynamic Profile Templates

**Model Schemas** define the structure and fields for different profile types using option sets as their data source. They enable creation of industry-specific forms without hardcoding field definitions.

```typescript
ModelSchema {
  type: string;        // Entity type (e.g., "profile", "application")
  subType: string;     // Specialization (e.g., "fitness", "child", "pet")
  displayName: Record<string, string>; // Multilingual names
  schema: {
    fields: SchemaField[]; // Field definitions
  };
}

SchemaField {
  name: string;          // Field identifier
  type: FieldType;       // Field type (option_set, string, number, etc.)
  optionSetId?: number;  // References option set for dropdowns
  required: boolean;     // Validation rule
  tab?: string;          // UI grouping (e.g., "Basic Info", "Measurements")
  group?: string;        // Sub-grouping within tabs
  order: number;         // Display order
  unit?: string;         // Measurement unit display
}
```

## Regional Conversion System

### Problem Statement
Different regions use different measurement systems and standards:
- **Height**: Centimeters (EU/Asia) vs Feet/Inches (US/UK)
- **Weight**: Kilograms (EU/Asia) vs Pounds (US)
- **Clothing Sizes**: EU 38 vs US 8 vs UK 10
- **Shoe Sizes**: Regional variations by gender

### Solution Architecture

**1. Canonical Values with Regional Mappings**
```typescript
// Height option value example
{
  value: "170",           // Stored as canonical value
  label: "170 cm",        // Default display
  canonicalRegion: "GLOBAL",
  regionalMappings: {
    "US": "5'7\"",        // Auto-converted for US users
    "UK": "5'7\"",        // Auto-converted for UK users  
    "EU": "170 cm",       // Native display for EU
    "Asia": "170 cm"      // Native display for Asia
  }
}
```

**2. Automatic Conversion Generation**
The system automatically generates regional mappings using smart conversion algorithms:

```typescript
// Auto-generate mappings for height option set
const heightMappings = generateConversionMatrix({
  slug: "height_cm",
  values: [
    { value: "150", label: "150 cm" },
    { value: "160", label: "160 cm" },
    { value: "170", label: "170 cm" },
    { value: "180", label: "180 cm" }
  ]
});

// Results in automatic regional conversions:
// 150cm → 4'11", 160cm → 5'3", 170cm → 5'7", 180cm → 5'11"
```

**3. Smart Pattern Detection**
The conversion system detects patterns to apply appropriate conversion logic:

```typescript
const CONVERSION_CATEGORIES = [
  {
    id: 'height',
    pattern: /\d+\s*cm$/i,
    conversion: (value) => convertHeight(value)
  },
  {
    id: 'weight', 
    pattern: /\d+(\.\d+)?\s*kg$/i,
    conversion: (value) => convertWeight(value)
  },
  {
    id: 'clothing',
    pattern: /(XS|S|M|L|XL)/i,
    conversion: (value, metadata) => convertClothingSize(value, metadata.gender)
  }
];
```

## Industry-Specific Model Types

### 1. Child Models
**Special Requirements**: Guardian consent, age restrictions, work permits

```typescript
// Child model schema structure
{
  type: "profile",
  subType: "child_model",
  fields: [
    {
      name: "height",
      type: "option_set",
      optionSetId: 10, // "height_child_cm" (30-150cm range)
      tab: "Physical",
      required: true
    },
    {
      name: "guardian_consent",
      type: "boolean",
      tab: "Legal",
      required: true
    },
    {
      name: "school_schedule",
      type: "option_set", 
      optionSetId: 15, // "school_availability"
      tab: "Availability"
    }
  ]
}
```

### 2. Fitness Models
**Special Requirements**: Body measurements, competition history, certifications

```typescript
// Fitness model schema structure
{
  type: "profile", 
  subType: "fitness_model",
  fields: [
    {
      name: "height",
      type: "option_set",
      optionSetId: 1, // "height_adult_cm" (140-220cm range)
      tab: "Measurements",
      required: true
    },
    {
      name: "body_fat_percentage",
      type: "option_set",
      optionSetId: 25, // "body_fat_ranges"
      tab: "Measurements"
    },
    {
      name: "specialties",
      type: "option_set",
      optionSetId: 30, // "fitness_specialties"
      allowMultiple: true,
      tab: "Expertise"
    }
  ]
}
```

### 3. Pet Models
**Special Requirements**: Species-specific fields, health records, behavioral traits

```typescript
// Pet model schema structure
{
  type: "profile",
  subType: "pet_model", 
  fields: [
    {
      name: "species",
      type: "option_set",
      optionSetId: 40, // "pet_species"
      tab: "Basic Info",
      required: true
    },
    {
      name: "breed", 
      type: "option_set",
      optionSetId: 41, // "dog_breeds" (conditional on species)
      tab: "Basic Info",
      dependsOn: "species"
    },
    {
      name: "size_category",
      type: "option_set",
      optionSetId: 45, // "pet_sizes" (tiny, small, medium, large, giant)
      tab: "Physical"
    }
  ]
}
```

## Option Set Categories & Examples

### 1. Physical Measurements
```typescript
// Height option sets by age group
{
  "height_baby_cm": {
    slug: "height_baby_cm",
    label: "Height - Baby (0-2 years)",
    values: ["30cm", "35cm", "40cm", ..., "90cm"] // 30-90cm range
  },
  "height_child_cm": {
    slug: "height_child_cm", 
    label: "Height - Child (3-12 years)",
    values: ["60cm", "65cm", "70cm", ..., "150cm"] // 60-150cm range
  },
  "height_teen_cm": {
    slug: "height_teen_cm",
    label: "Height - Teen (13-17 years)", 
    values: ["120cm", "125cm", "130cm", ..., "200cm"] // 120-200cm range
  },
  "height_adult_cm": {
    slug: "height_adult_cm",
    label: "Height - Adult (18+ years)",
    values: ["140cm", "145cm", "150cm", ..., "220cm"] // 140-220cm range
  }
}

// Weight option sets with regional mappings
{
  "weight_kg": {
    slug: "weight_kg",
    label: "Weight (Kilograms)",
    values: [
      {
        value: "50", label: "50 kg",
        regionalMappings: { "US": "110 lbs", "UK": "50 kg", "EU": "50 kg" }
      },
      {
        value: "60", label: "60 kg", 
        regionalMappings: { "US": "132 lbs", "UK": "60 kg", "EU": "60 kg" }
      }
      // ... more weight values
    ]
  }
}
```

### 2. Clothing & Sizing
```typescript
// Women's clothing sizes with comprehensive regional mappings
{
  "clothing_women_sizes": {
    slug: "clothing_women_sizes",
    label: "Women's Clothing Sizes",
    values: [
      {
        value: "XS", label: "Extra Small",
        regionalMappings: {
          "US": "XS (0-2)", 
          "UK": "UK 4-6",
          "EU": "EU 32-34",
          "Asia": "S"
        }
      },
      {
        value: "S", label: "Small",
        regionalMappings: {
          "US": "S (4-6)",
          "UK": "UK 8-10", 
          "EU": "EU 36-38",
          "Asia": "M"
        }
      }
      // ... more sizes
    ]
  }
}

// Men's clothing sizes  
{
  "clothing_men_sizes": {
    slug: "clothing_men_sizes",
    label: "Men's Clothing Sizes",
    values: [
      {
        value: "S", label: "Small",
        regionalMappings: {
          "US": "S (36-38)", 
          "UK": "S (36-38)",
          "EU": "EU 46-48",
          "Asia": "M"
        }
      }
      // ... more sizes
    ]
  }
}
```

### 3. Physical Attributes
```typescript
// Eye colors with localization
{
  "eye_colors": {
    slug: "eye_colors", 
    label: "Eye Colors",
    values: [
      {
        value: "brown", label: "Brown",
        regionalMappings: {
          "US": "Brown", "UK": "Brown", 
          "EU": "Marron", "Asia": "Brown"
        }
      },
      {
        value: "blue", label: "Blue",
        regionalMappings: {
          "US": "Blue", "UK": "Blue",
          "EU": "Bleu", "Asia": "Blue" 
        }
      }
      // ... more colors
    ]
  }
}

// Hair colors and types
{
  "hair_colors": {
    slug: "hair_colors",
    label: "Hair Colors", 
    values: ["Black", "Brown", "Blonde", "Red", "Gray", "White", "Other"]
  },
  "hair_types": {
    slug: "hair_types",
    label: "Hair Types",
    values: ["Straight", "Wavy", "Curly", "Coily"]
  }
}
```

### 4. Industry-Specific Attributes
```typescript
// Fitness model specialties
{
  "fitness_specialties": {
    slug: "fitness_specialties",
    label: "Fitness Specialties",
    values: [
      "Bodybuilding", "Crossfit", "Yoga", "Pilates", 
      "Martial Arts", "Dance", "Running", "Swimming",
      "Cycling", "Rock Climbing", "Powerlifting"
    ]
  }
}

// Pet characteristics
{
  "pet_species": {
    slug: "pet_species", 
    label: "Pet Species",
    values: ["Dog", "Cat", "Bird", "Rabbit", "Horse", "Other"]
  },
  "dog_breeds": {
    slug: "dog_breeds",
    label: "Dog Breeds", 
    values: [
      "Golden Retriever", "German Shepherd", "Labrador",
      "Bulldog", "Poodle", "Beagle", "Mixed Breed"
    ]
  },
  "pet_temperaments": {
    slug: "pet_temperaments",
    label: "Pet Temperaments",
    values: [
      "Friendly", "Calm", "Energetic", "Trained",
      "Good with Children", "Good with Other Pets"
    ]
  }
}

// Voice model capabilities
{
  "voice_types": {
    slug: "voice_types",
    label: "Voice Types",
    values: ["Soprano", "Alto", "Tenor", "Bass", "Baritone"]
  },
  "accents": {
    slug: "accents", 
    label: "Accents & Languages",
    values: [
      "American English", "British English", "Australian English",
      "French", "German", "Spanish", "Italian", "Russian"
    ]
  }
}
```

## Dynamic Form Generation

### Form Building Process

**1. Schema Definition**
```typescript
// Define form structure using option sets
const fitnessModelForm = {
  tabs: [
    {
      id: "basic", 
      label: "Basic Information",
      fields: [
        {
          name: "stage_name",
          type: "string",
          required: true
        },
        {
          name: "gender", 
          type: "option_set",
          optionSetId: 2, // References "genders" option set
          required: true
        }
      ]
    },
    {
      id: "measurements",
      label: "Measurements", 
      fields: [
        {
          name: "height",
          type: "option_set", 
          optionSetId: 1, // References "height_adult_cm"
          required: true,
          unit: "cm"
        },
        {
          name: "weight",
          type: "option_set",
          optionSetId: 3, // References "weight_kg" 
          unit: "kg"
        }
      ]
    }
  ]
}
```

**2. Regional Form Rendering**
```typescript
// Form automatically adapts to user's region
const FormRenderer = ({ schema, userRegion = "US" }) => {
  return schema.tabs.map(tab => (
    <TabPanel key={tab.id} title={tab.label}>
      {tab.fields.map(field => {
        if (field.type === "option_set") {
          const optionSet = getOptionSet(field.optionSetId);
          const localizedOptions = optionSet.values.map(value => ({
            value: value.value,
            label: value.regionalMappings[userRegion] || value.label
          }));
          
          return (
            <Select
              name={field.name}
              options={localizedOptions}
              required={field.required}
              placeholder={`Select ${field.unit ? `(${field.unit})` : ''}`}
            />
          );
        }
        
        return <Input type={field.type} name={field.name} />;
      })}
    </TabPanel>
  ));
};
```

## Search & Filtering Integration

### Universal Search Compatibility
Regional mappings enable seamless search across different measurement systems:

```typescript
// Search examples that work across regions
searchProfiles("170cm")     // Finds profiles with "5'7\"" in US
searchProfiles("5'7\"")     // Finds profiles with "170cm" in EU  
searchProfiles("Size M")    // Finds "EU 38", "UK 10", "US 8"
searchProfiles("Medium")    // Finds all size variants
```

### Advanced Filtering
```typescript
// Multi-dimensional filtering with regional awareness
const searchFilters = {
  height: {
    min: "160cm",    // Auto-converts to regional equivalents
    max: "180cm"
  },
  clothing_size: ["S", "M"],  // Expands to regional variants
  specialties: ["Yoga", "Pilates"],
  location: "Europe"
};
```

## Performance Optimizations

### 3-Layer Caching Strategy

**1. Next.js Cache (30 minutes)**
- Server-side component caching
- Pre-rendered form structures

**2. Redis Cache (5-30 minutes)** 
- Option sets with values
- Model schemas with computed metadata
- Regional mapping matrices

**3. Performance Indexes (O(1) lookups)**
- Field lookup maps stored in metadata
- Pre-computed regional variants
- Cached form generation results

### Metrics
- **Form Generation**: <100ms with Redis caching
- **Option Set Loading**: <20ms for cached sets  
- **Regional Conversion**: <5ms per value
- **Search Performance**: 5-20ms with pre-computed mappings

## Multi-Tenant Architecture

### Tenant Isolation
```typescript
// Option sets can be global or tenant-specific
{
  tenantId: null,      // Global platform option sets
  slug: "height_cm"    // Available to all tenants
}

{
  tenantId: 123,       // Tenant-specific customization
  slug: "brand_sizes"  // Only for specific fashion tenant
}
```

### Inheritance Model
1. **Platform Global**: Base option sets (height, weight, colors)
2. **Tenant Override**: Custom additions/modifications
3. **Account Custom**: Agency-specific options
4. **Fallback Chain**: Account → Tenant → Global

## Seeder Strategy

### Comprehensive Option Set Seeds

**1. Physical Measurements**
- Age-appropriate height ranges (baby, child, teen, adult)
- Weight ranges with regional conversions
- Body measurements (chest, waist, hips) by gender

**2. Clothing & Sizes**
- Women's clothing (XS-XXL with regional mappings)
- Men's clothing (XS-XXL with regional mappings) 
- Shoe sizes (US/UK/EU/Asia by gender)
- Specialty sizing (children, plus-size, petite)

**3. Physical Attributes**
- Eye colors (with localization)
- Hair colors and types
- Skin tones (diverse representation)
- Body types and builds

**4. Industry Specializations**
- Fitness specialties and certifications
- Modeling categories (fashion, commercial, editorial)
- Voice capabilities and accents
- Dance styles and skills

**5. Pet-Specific Options**
- Species and breed classifications
- Size categories and temperaments
- Training levels and skills
- Health and vaccination status

### Implementation Structure
```typescript
// Seeder organization
const optionSetSeeds = {
  measurements: {
    height: generateHeightSeed(),
    weight: generateWeightSeed(),
    body: generateBodyMeasurementsSeed()
  },
  clothing: {
    women: generateWomensClothingSeed(),
    men: generateMensClothingSeed(), 
    shoes: generateShoeSizeSeed()
  },
  attributes: {
    physical: generatePhysicalAttributesSeed(),
    skills: generateSkillsSeed()
  },
  industry: {
    fitness: generateFitnessSpecialtiesSeed(),
    voice: generateVoiceCapabilitiesSeed(),
    pets: generatePetAttributesSeed()
  }
};
```

## Next Steps

### Implementation Phases

**Phase 1: Core Infrastructure**
- Complete option set seeding with regional mappings
- Implement dynamic form generation for all model types
- Optimize caching and performance

**Phase 2: Advanced Features** 
- Conditional field logic (breed depends on species)
- Multi-level dependencies
- Advanced search and filtering

**Phase 3: Industry Extensions**
- Voice model audio portfolios
- Pet health record integration
- Child model compliance workflows

**Phase 4: Platform Scaling**
- Tenant customization tools
- Bulk import/export capabilities
- Advanced analytics and insights

This architecture provides a robust foundation for itellico Mono's multi-industry marketplace, enabling seamless regional adaptation while maintaining data consistency and performance across all model types and use cases.