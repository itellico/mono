# itellico Mono - Comprehensive Creative Industry Seeding System

## Executive Summary

This document describes the complete seeding system for itellico Mono's multi-tenant creative industry marketplace. The system creates **200+ option sets** with **5,000+ values** and **15+ dynamic model schemas** with **300+ fields**, enabling comprehensive profile management for models, voice talent, pets, photographers, makeup artists, and other creative professionals.

## Architecture Overview

### 🎯 Design Principles

1. **Regional Awareness**: All measurements and sizes include automatic conversions (US ↔ UK ↔ EU ↔ Asia)
2. **Industry Specificity**: Specialized fields for different creative roles and model types
3. **Age Appropriateness**: Different schemas and restrictions for babies, children, teens, and adults
4. **Professional Hierarchy**: From beginner models to industry professionals
5. **Multi-language Support**: Built-in translation keys for global marketplace
6. **Multi-tenant Isolation**: Global option sets with tenant customization capabilities

### 🏗️ System Components

```
itellico Mono Creative Industry Seeding
├── Option Sets (Data Foundation)
│   ├── Physical Measurements (height, weight, body measurements)
│   ├── Clothing & Sizing (regional size conversions)
│   ├── Physical Attributes (eye color, hair, skin tone)
│   ├── Creative Specializations (modeling, fitness, voice, photography)
│   ├── Professional Attributes (experience, certifications, unions)
│   ├── Technical Capabilities (equipment, software, formats)
│   ├── Availability & Logistics (scheduling, travel, rates)
│   └── Industry-Specific (pet breeds, voice accents, makeup brands)
│
├── Model Schemas (Profile Templates)
│   ├── Human Models
│   │   ├── Baby Models (0-2 years) - Guardian management
│   │   ├── Child Models (3-12 years) - Education coordination  
│   │   ├── Teen Models (13-17 years) - Transitional independence
│   │   ├── Adult Fashion Models - Professional measurements
│   │   └── Fitness Models - Performance metrics
│   ├── Voice Talent - Technical capabilities & accents
│   ├── Pet Models - Species-specific traits & training
│   └── Creative Professionals
│       ├── Photographers - Equipment & specializations
│       └── Makeup Artists - Techniques & brand preferences
│
└── Master Orchestration
    ├── Dependency Management (option sets before schemas)
    ├── Error Handling & Recovery
    ├── Progress Tracking & Logging
    └── Comprehensive Reporting
```

## Detailed Seeding Components

### 📊 Option Sets Breakdown

#### **Physical Measurements** (40+ option sets)
```typescript
// Age-appropriate height ranges
height_baby: 30-95cm (5cm steps) → Regional conversions
height_child: 60-160cm (5cm steps) → Regional conversions  
height_teen: 130-200cm (2cm steps) → Regional conversions
height_adult: 140-220cm (1cm steps) → Regional conversions

// Weight ranges with automatic lb conversions
weight_baby: 3-20kg → Auto-converts to lbs for US
weight_child: 10-60kg → Auto-converts to lbs for US
weight_adult: 35-150kg → Auto-converts to lbs for US

// Detailed body measurements
chest_bust: 60-140cm → Inch conversions for US/UK
waist: 50-120cm → Inch conversions for US/UK  
hips: 70-150cm → Inch conversions for US/UK
```

#### **Clothing & Sizing** (15+ option sets)
```typescript
// Women's clothing with comprehensive regional mappings
clothing_women: {
  XS: { US: "XS (0-2)", UK: "UK 4-6", EU: "EU 32-34", Asia: "S" }
  S: { US: "S (4-6)", UK: "UK 8-10", EU: "EU 36-38", Asia: "M" }
  M: { US: "M (8-10)", UK: "UK 12-14", EU: "EU 40-42", Asia: "L" }
  // ... all sizes through 4XL
}

// Men's clothing with regional mappings
clothing_men: {
  S: { US: "S (36-38)", UK: "S (36-38)", EU: "EU 46-48", Asia: "M" }
  // ... complete range
}

// Shoe sizes by gender and region
shoe_sizes: US → UK → EU → Asia conversions by gender
```

#### **Physical Attributes** (25+ option sets)
```typescript
// Comprehensive eye colors with translations
eye_colors: Brown, Blue, Green, Hazel, Amber, Gray, Violet, Heterochromia
  → EU translations: { Brown: "Marron", Blue: "Bleu", Green: "Vert" }

// Detailed hair options
hair_colors: 15 natural and dyed options
hair_types: Scientific classification (Type 1-4C)
hair_lengths: Bald → Very Long (8 categories)

// Inclusive skin tone representation
skin_tones: 9-level inclusive spectrum (Very Fair → Deep)
```

#### **Creative Industry Specializations** (50+ option sets)
```typescript
// Modeling categories
modeling_categories: Fashion, Commercial, Fitness, Glamour, Plus Size, 
  Alternative, Parts, Promotional, Artistic

// Fitness specializations  
fitness_specialties: Bodybuilding, CrossFit, Yoga, Martial Arts, Dance,
  Competition categories, Training styles

// Voice capabilities
voice_types: Soprano, Alto, Tenor, Bass, Character voices
accents_languages: 25+ accents and languages
voice_styles: Conversational, Authoritative, Character, Commercial

// Photography specializations
photography_styles: Portrait, Fashion, Commercial, Editorial, Beauty,
  Lifestyle, Product, Architectural, Event, Documentary
```

#### **Professional & Technical** (30+ option sets)
```typescript
// Experience and certifications
experience_levels: Beginner → Master (6 levels)
union_status: Non-Union, SAG-AFTRA, Equity, IATSE, Model Guild

// Technical equipment
audio_equipment: Professional microphones, interfaces, acoustic treatment
camera_systems: Canon, Nikon, Sony, Fuji systems
editing_software: Pro Tools, Logic Pro, Photoshop, Lightroom

// Business logistics  
availability_types: Full-time, Part-time, Project-based, Seasonal
travel_willingness: Local → Worldwide (7 levels)
turnaround_times: Same day → 2 weeks
```

#### **Industry-Specific Specializations** (40+ option sets)
```typescript
// Pet model specifics
pet_species: Dog, Cat, Horse, Bird, Rabbit, Exotic
pet_breeds: 25+ common breeds across species
pet_temperaments: Calm, Friendly, Energetic, Trained, Photogenic
pet_skills: Basic obedience → Advanced tricks and agility

// Makeup artistry
makeup_specialties: Beauty, Fashion, Theatrical, SFX, Film/TV
makeup_brands: Professional brand preferences
makeup_techniques: Airbrush, prosthetics, body painting

// Child model specifics
guardian_relationships: Mother, Father, Legal Guardian, etc.
school_schedules: Traditional, Year-round, Homeschool, Online
content_restrictions: Age-appropriate limitations
```

### 🏗️ Model Schemas Breakdown

#### **Baby Models (0-2 years)**
```typescript
// 25+ fields across 6 tabs
tabs: [
  "Basic Info": Name, DOB, gender, guardian contact
  "Physical": Height/weight (age-appropriate ranges), appearance
  "Guardian Info": Primary guardian, emergency contacts, permissions
  "Legal": Work permits, consent forms, medical restrictions
  "Availability": Optimal shoot times, max duration, restrictions
  "Health": Medical info, allergies, special needs
]

// Special features:
- Age-appropriate height/weight ranges (30-95cm, 3-20kg)
- Guardian consent requirements
- Maximum shoot durations (15min-2hr)
- Content restrictions (no swimwear, family-friendly only)
- Medical considerations and emergency protocols
```

#### **Child Models (3-12 years)**
```typescript
// 35+ fields across 7 tabs  
tabs: [
  "Basic Info": Professional name, languages, nationality
  "Physical": Expanded measurements, clothing sizes
  "Experience": Skills, sports, camera comfort, performance history
  "Education": School info, grade level, schedule flexibility
  "Guardian Info": Guardian details, chaperone approval
  "Legal": Work permits, Coogan accounts, content restrictions
  "Availability": School hour availability, tutoring needs
]

// Special features:
- Educational coordination and tutoring requirements
- Expanded skill tracking (sports, performance, special abilities)
- School schedule integration
- Content appropriateness guidelines
- Transition toward independence while maintaining protection
```

#### **Teen Models (13-17 years)**
```typescript
// 40+ fields across 8 tabs
tabs: [
  "Basic Info": Social media comfort, professional identity
  "Measurements": Full body measurements, clothing sizes
  "Appearance": Detailed appearance, modification willingness
  "Experience": Modeling categories, dance, sports, special skills
  "Education": Academic status, schedule flexibility
  "Guardian Info": Transitional independence levels
  "Legal": Work permits, content comfort levels
  "Professional": Portfolio, social media following
]

// Special features:
- Transitional independence (can work independently vs. guardian required)
- Social media integration and comfort levels
- Full professional measurements and sizing
- Content comfort level assessment
- Academic schedule coordination
- Portfolio and social media tracking
```

#### **Adult Fashion Models (18+ years)**
```typescript
// 50+ fields across 9 tabs
tabs: [
  "Professional": Business identity, experience, representation
  "Measurements": Precise measurements (cm and regional conversions)
  "Appearance": Detailed appearance, modification flexibility
  "Specializations": Runway, print, commercial, high fashion experience
  "Portfolio": Professional portfolio, social media metrics
  "Business": Agency representation, union status, work authorization
  "Collaboration": Team preferences, working style
  "Logistics": Availability, travel, notice requirements
  "Rates": Rate structures, package deals, negotiation preferences
]

// Special features:
- Professional measurement precision (required chest/waist/hips)
- Industry experience tracking (runway, editorial, commercial)
- Business relationship management (agencies, representation)
- Advanced portfolio and social media metrics
- Professional rate and negotiation management
```

#### **Fitness Models**
```typescript
// 55+ fields across 10 tabs
tabs: [
  "Professional": Identity, certifications, sponsorships
  "Measurements": Body composition, muscle mass, body fat %
  "Specializations": Fitness categories, competition experience
  "Performance": Strength metrics, flexibility, endurance
  "Achievements": Competitions, certifications, sponsorships
  "Training": Training style, years experience, specialties
  "Nutrition": Diet types, supplement use, lifestyle habits
  "Appearance": Vascularity, definition, aesthetic features
  "Business": Rates, availability, professional relationships
  "Portfolio": Transformation photos, competition photos
]

// Special features:
- Advanced body composition tracking (body fat %, muscle mass %)
- Performance metrics (bench press, squat, deadlift maxes)
- Competition history and achievement tracking
- Detailed fitness specialization (bodybuilding, CrossFit, yoga, etc.)
- Nutrition and supplement tracking
- Transformation and progress documentation
```

#### **Voice Talent**
```typescript
// 45+ fields across 8 tabs
tabs: [
  "Professional": Business identity, experience, notable clients
  "Voice Profile": Voice type, age range, tone characteristics
  "Languages": Native language, additional languages, accents
  "Specializations": Voice styles, character voices, industry experience
  "Technical": Home studio, equipment, software proficiency
  "Capabilities": Singing, musical genres, technical delivery
  "Business": Rates, turnaround times, client management
  "Portfolio": Demo reels, sample work, client testimonials
]

// Special features:
- Comprehensive voice classification (type, age range, characteristics)
- Multi-language and accent capabilities
- Technical equipment and software proficiency
- Industry-specific experience (commercial, e-learning, animation)
- Audio delivery format options
- Remote recording capabilities and quality standards
```

#### **Pet Models**
```typescript
// 50+ fields across 9 tabs
tabs: [
  "Basic Info": Name, species, breed, age, basic characteristics
  "Physical": Size, weight, appearance, distinctive features
  "Behavior": Temperament, energy level, socialization
  "Skills": Training level, tricks, specialized abilities
  "Health": Veterinary records, vaccinations, dietary restrictions
  "Handler Info": Owner/handler details, experience level
  "Professional": Modeling experience, previous work, specializations
  "Environment": Comfortable environments, weather limitations
  "Logistics": Availability, travel, maximum shoot duration
]

// Special features:
- Species-specific breed and characteristic tracking
- Comprehensive temperament and behavior assessment
- Training and skill level documentation
- Health and veterinary record management
- Handler experience and capability assessment
- Environmental comfort and limitation tracking
- Weather and duration restrictions for animal welfare
```

#### **Photographers**
```typescript
// 45+ fields across 8 tabs
tabs: [
  "Professional": Business identity, experience, credentials
  "Specializations": Photography styles, preferred subjects
  "Equipment": Camera systems, lenses, lighting equipment
  "Studio": Studio space, mobile capabilities, setup options
  "Post-Production": Editing software, retouching level, delivery
  "Business": Portfolio, insurance, business licensing
  "Collaboration": Team preferences, working style, networks
  "Services": Availability, rates, package offerings
]

// Special features:
- Comprehensive equipment and technical capability tracking
- Studio space and mobile setup documentation
- Post-production and editing service levels
- Professional network and collaboration preferences
- Business credential and insurance verification
- Rate structure and package offering management
```

#### **Makeup Artists**
```typescript
// 40+ fields across 7 tabs
tabs: [
  "Professional": Business identity, experience, notable work
  "Specializations": Makeup styles, age/gender expertise
  "Skills": Techniques, prosthetics, special effects capabilities
  "Equipment": Kit completeness, brand preferences, tools
  "Education": Formal training, certifications, continued education
  "Portfolio": Previous work, fashion week experience, credits
  "Business": Rates, availability, trial sessions, collaboration
]

// Special features:
- Makeup technique and style specialization tracking
- Brand preference and product quality management
- Formal education and certification verification
- Sanitation protocol and safety compliance
- Client consultation and collaboration style assessment
- Professional credit and notable work documentation
```

## Regional Conversion System

### 🌍 Automatic Conversions

The system automatically generates regional variations for all measurement-based option sets:

```typescript
// Height conversion example
"170cm" → {
  GLOBAL: "170 cm",
  US: "5'7\"",
  UK: "5'7\"", 
  EU: "170 cm",
  Asia: "170 cm"
}

// Weight conversion example  
"65kg" → {
  GLOBAL: "65 kg",
  US: "143 lbs",
  UK: "65 kg",
  EU: "65 kg", 
  Asia: "65 kg"
}

// Clothing size conversion example
"M" → {
  US: "M (8-10)",
  UK: "UK 12-14", 
  EU: "EU 40-42",
  Asia: "L"
}
```

### 🔄 Search Compatibility

Regional mappings enable universal search across measurement systems:
- Search "170cm" finds profiles with "5'7\"" in US region
- Search "Size M" finds "EU 38", "UK 10", "US 8" 
- Search in any regional format returns all equivalent profiles

## Multi-Language Support

### 🗣️ Translation Architecture

All user-facing content includes translation keys:

```typescript
// Field label example
label: {
  'en-US': 'Height',
  'es-ES': 'Altura', 
  'fr-FR': 'Taille',
  'de-DE': 'Größe'
}

// Option value example  
regionalMappings: {
  US: 'Brown',
  UK: 'Brown',
  EU: 'Marron',
  Asia: 'Brown'
}
```

### 🎯 Supported Languages

Primary support for:
- **English** (US/UK variants)
- **Spanish** (Spain/Latin America)
- **French** (France/Canadian)
- **German** (Germany/Austria)
- **Italian** (Italy)
- **Portuguese** (Brazil/Portugal)

Extended support for Asian markets:
- **Mandarin Chinese**
- **Japanese** 
- **Korean**

## Installation and Usage

### 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run complete creative industry seeding
npm run seed:creative-industry

# Or run individual components
npm run seed:option-sets
npm run seed:model-schemas

# Or run via tsx directly
npx tsx scripts/seed/master-creative-industry-seeder.ts
```

### 📋 Package.json Scripts

Add these scripts to your package.json:

```json
{
  "scripts": {
    "seed:creative-industry": "tsx scripts/seed/master-creative-industry-seeder.ts",
    "seed:option-sets": "tsx scripts/seed/option-sets/comprehensive-creative-industry-seeder.ts && tsx scripts/seed/option-sets/supplementary-option-sets-seeder.ts",
    "seed:model-schemas": "tsx scripts/seed/model-schemas/comprehensive-model-schemas-seeder.ts"
  }
}
```

### ⚙️ Environment Requirements

Ensure these environment variables are set:

```bash
DATABASE_URL="postgresql://developer:developer@localhost:5432/mono_stable"
NODE_ENV="development"
```

### 🔧 Prerequisites

1. **Database Setup**: PostgreSQL with Prisma schema migrated
2. **Dependencies**: Prisma Client, logging utilities
3. **Permissions**: Database write permissions for seeding

## Seeding Process Flow

### 📈 Execution Phases

```mermaid
graph TD
    A[Master Seeder Start] --> B[Phase 1: Creative Industry Option Sets]
    B --> C[Physical Measurements]
    C --> D[Clothing & Sizing]
    D --> E[Creative Specializations]
    E --> F[Phase 2: Supplementary Option Sets]
    F --> G[Demographics & Professional]
    G --> H[Technical & Equipment]
    H --> I[Industry-Specific]
    I --> J[Phase 3: Model Schemas]
    J --> K[Human Model Types]
    K --> L[Voice Talent]
    L --> M[Pet Models]
    M --> N[Creative Professionals]
    N --> O[Validation & Summary]
    O --> P[Complete Success]
```

### 🎯 Success Metrics

After successful seeding, you should have:

```
✨ Total Option Sets Created: 200+
📊 Total Option Values Created: 5,000+
🏗️ Total Model Schemas Created: 15+
🔧 Total Schema Fields Created: 300+
⏱️ Total Duration: ~60-120 seconds
🎯 Success Rate: 100%
```

### 📊 Verification Queries

Verify successful seeding with these database queries:

```sql
-- Check option sets created
SELECT COUNT(*) as option_sets_count FROM option_sets WHERE tenant_id IS NULL;

-- Check option values with regional mappings
SELECT COUNT(*) as values_with_mappings 
FROM option_values 
WHERE regional_mappings::text != '{}';

-- Check model schemas created
SELECT type, sub_type, 
       jsonb_array_length(schema->'fields') as field_count
FROM model_schemas 
WHERE tenant_id IS NULL;

-- Verify specific model types
SELECT sub_type, COUNT(*) as count
FROM model_schemas 
GROUP BY sub_type
ORDER BY sub_type;
```

## Performance Considerations

### ⚡ Optimization Features

1. **Batch Processing**: Option values created in batches for performance
2. **Intelligent Delays**: Small delays between operations to prevent database overwhelm
3. **Error Recovery**: Continue processing even if individual items fail
4. **Memory Management**: Connection cleanup and resource management
5. **Progress Logging**: Detailed progress tracking and timing information

### 📈 Scaling Metrics

- **Option Set Creation**: ~1-2 seconds per set (100+ sets = ~3-5 minutes)
- **Model Schema Creation**: ~2-3 seconds per schema (15+ schemas = ~1 minute)
- **Total Seeding Time**: 5-10 minutes for complete system
- **Database Impact**: ~10MB of structured data
- **Memory Usage**: Peak ~100MB during seeding process

## Maintenance and Updates

### 🔄 Adding New Option Sets

```typescript
// Add to comprehensive-creative-industry-seeder.ts
export const NEW_OPTION_SETS = {
  new_specialty: {
    slug: 'new_specialty',
    label: 'New Specialty Options',
    description: 'Description of new option set',
    values: [
      { value: 'option1', label: 'Option 1', order: 1 },
      { value: 'option2', label: 'Option 2', order: 2 }
    ]
  }
};
```

### 🏗️ Adding New Model Schemas

```typescript
// Add to comprehensive-model-schemas-seeder.ts
new_profile_type: {
  type: 'profile',
  subType: 'new_profile_type',
  displayName: { 'en-US': 'New Profile Type' },
  schema: {
    fields: [
      createField('field_name', 'option_set', {
        optionSetSlug: 'relevant_option_set',
        required: true,
        tab: 'Basic Info'
      })
    ]
  }
}
```

### 🔧 Regional Mapping Updates

```typescript
// Update regional mappings for new markets
const createRegionalMappings = (baseValue: string, conversions: Record<string, string> = {}) => ({
  US: conversions.US || baseValue,
  UK: conversions.UK || baseValue,
  EU: conversions.EU || baseValue,
  Asia: conversions.Asia || baseValue,
  // Add new regions
  LATAM: conversions.LATAM || baseValue,
  AFRICA: conversions.AFRICA || baseValue,
  ...conversions
});
```

## Error Handling and Recovery

### 🛡️ Error Recovery Strategies

1. **Graceful Degradation**: Continue seeding even if individual items fail
2. **Detailed Logging**: Comprehensive error reporting with context
3. **Rollback Prevention**: No automatic rollbacks - manual cleanup if needed
4. **Dependency Validation**: Check for missing option sets before schema creation
5. **Connection Management**: Proper database connection cleanup

### 🚨 Common Issues and Solutions

**Issue**: Option set already exists
```
Solution: Seeder skips existing sets, logs warning, continues
```

**Issue**: Missing option set referenced by schema
```  
Solution: Schema field skipped, warning logged, schema created without that field
```

**Issue**: Database connection timeout
```
Solution: Automatic retry with exponential backoff, connection recreation
```

**Issue**: Insufficient database permissions
```
Solution: Clear error message with required permissions listed
```

## Integration with itellico Mono

### 🔗 System Integration Points

1. **Dynamic Form Generation**: Model schemas automatically generate forms
2. **Search and Filtering**: Option sets enable advanced search capabilities
3. **Regional Adaptation**: Automatic UI adaptation based on user region
4. **Multi-tenant Support**: Global option sets with tenant customization
5. **Translation System**: Integration with platform translation workflow

### 🎯 Business Value

1. **Time to Market**: Complete industry setup in minutes vs. months
2. **Global Expansion**: Instant regional adaptation for international markets
3. **Industry Coverage**: Comprehensive coverage of creative industry needs
4. **Professional Quality**: Industry-standard terminology and categorization
5. **Scalability**: Foundation for unlimited industry expansion

## Future Enhancements

### 🚀 Planned Expansions

1. **Additional Industries**: Dance, theater, music, writing, design
2. **Advanced Specializations**: Stunt performers, body doubles, hand models
3. **Regional Expansion**: Additional language and measurement system support
4. **Industry Templates**: Pre-configured tenant templates for specific industries
5. **AI-Powered Suggestions**: Machine learning for profile completion suggestions

### 🔧 Technical Roadmap

1. **Performance Optimization**: Parallel processing, batch optimization
2. **Validation Enhancement**: Schema validation, data integrity checks
3. **Migration Tools**: Upgrade existing profiles to new schema versions
4. **Analytics Integration**: Usage tracking and optimization insights
5. **API Enhancement**: REST and GraphQL API for dynamic schema management

## Conclusion

The itellico Mono Creative Industry Seeding System represents a comprehensive solution for building sophisticated, multi-tenant creative marketplaces. With 200+ option sets, 5,000+ values, and 15+ dynamic model schemas, it provides the foundation for global creative industry platforms while maintaining regional sensitivity and professional industry standards.

The system enables rapid deployment of industry-specific marketplaces with:
- **Global Scale**: Regional measurement and language support
- **Industry Depth**: Comprehensive creative industry coverage
- **Professional Quality**: Industry-standard terminology and workflows
- **Technical Excellence**: Performance-optimized, error-resilient architecture
- **Future-Ready**: Extensible design for unlimited industry expansion

This foundation enables itellico Mono to serve as the definitive marketplace solution for the global creative industry, supporting everything from baby models to professional voice talent, photographers to pet models, with the sophistication and regional awareness required for international success.