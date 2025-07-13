---
title: Option Sets & Model Schemas
category: features
tags:
  - option-sets
  - model-schemas
  - dynamic-forms
  - regional-conversion
  - multi-industry
priority: high
lastUpdated: '2025-07-06'
---

# Option Sets & Model Schemas

## Overview

Sophisticated option sets and model schemas system enabling dynamic form generation, regional conversions, and industry-specific profile creation for multi-tenant marketplace customization.

## Core Concepts

### Option Sets
Reusable collections of predefined values for dropdowns and selections with regional conversion support.

**Structure**:
- Unique slug identifiers (e.g., "height_cm", "eye_colors")
- Multi-tenant isolation (global or tenant-specific)
- Regional mappings for international support
- Sortable values with metadata

**Schema**: See `prisma/schema.prisma` - OptionSet, OptionValue models

### Model Schemas
Dynamic profile templates using option sets as data sources for industry-specific forms.

**Features**:
- Entity types and specializations (fitness, child, pet, voice)
- Field definitions with validation rules
- Tab-based UI organization
- Conditional field dependencies

**Implementation**: See `src/lib/services/model-schemas.service.ts`

## Regional Conversion System

### Problem Solved
Different measurement systems and standards across regions:
- Height: cm (EU/Asia) vs feet/inches (US/UK)
- Weight: kg (EU/Asia) vs pounds (US)
- Clothing: EU 38 vs US 8 vs UK 10
- Shoe sizes: Regional gender variations

### Solution Architecture

#### Canonical Values with Mappings
Stored values with automatic regional display conversion:
```
170cm → 5'7" (US/UK), 170cm (EU/Asia)
```

#### Automatic Conversion Generation
Smart algorithms generate regional mappings using pattern detection and conversion formulas.

**Conversion Service**: See `src/lib/services/regional-conversion.service.ts`

## Industry-Specific Model Types

### Child Models
- Guardian consent requirements
- Age-restricted fields
- School availability scheduling
- Legal compliance workflows

### Fitness Models
- Body measurements and composition
- Competition history tracking
- Certification management
- Specialty skill sets

### Pet Models
- Species-specific fields
- Breed dependencies
- Health record integration
- Behavioral trait tracking

### Voice Models
- Vocal range capabilities
- Accent and language skills
- Audio portfolio integration
- Recording quality specifications

**Schema Definitions**: See `scripts/seed/model-schemas/`

## Option Set Categories

### Physical Measurements
- Age-appropriate height ranges (baby, child, teen, adult)
- Weight with regional conversions (kg/lbs)
- Body measurements by gender
- Size categories and classifications

### Clothing & Sizing
- Regional size mappings (US/UK/EU/Asia)
- Gender-specific sizing
- Specialty categories (plus-size, petite, children)
- Shoe size conversions

### Physical Attributes
- Eye colors with localization
- Hair colors and types
- Skin tones (diverse representation)
- Body types and builds

### Industry Specializations
- Fitness specialties and certifications
- Modeling categories (fashion, commercial, editorial)
- Voice capabilities and accents
- Dance styles and performance skills
- Pet characteristics and temperaments

**Seed Data**: See `scripts/seed/option-sets/`

## Dynamic Form Generation

### Form Building Process
1. Schema definition using option sets
2. Regional form adaptation
3. Conditional field logic
4. Validation rule application

### Regional Form Rendering
Forms automatically adapt to user's region with localized option labels and measurement units.

**Form Renderer**: See `src/components/forms/DynamicFormRenderer.tsx`

## Search & Filtering Integration

### Universal Search Compatibility
Regional mappings enable seamless search across measurement systems:
- Search "170cm" finds "5'7"" profiles in US
- Search "Size M" finds all regional equivalents
- Multi-dimensional filtering with auto-conversion

**Search Service**: See `src/lib/services/profile-search.service.ts`

## Performance Optimizations

### 3-Layer Caching Strategy
1. **Next.js Cache** (30min) - Pre-rendered form structures
2. **Redis Cache** (5-30min) - Option sets and schema metadata
3. **Performance Indexes** - O(1) lookups for mappings

### Performance Metrics
- Form Generation: \\\&lt;100ms with caching
- Option Set Loading: \\\&lt;20ms cached
- Regional Conversion: \\\&lt;5ms per value
- Search Performance: 5-20ms with pre-computed mappings

**Cache Implementation**: See `src/lib/cache/option-sets-cache.ts`

## Multi-Tenant Architecture

### Tenant Isolation
- Global platform option sets (height, weight, colors)
- Tenant-specific customizations
- Account-level agency options
- Inheritance chain: Account → Tenant → Global

### Inheritance Model
Fallback system ensuring all tenants have access to base functionality while allowing customization.

**Service**: See `src/lib/services/tenant-option-sets.service.ts`

## Seeder Strategy

### Comprehensive Seeds
- Physical measurements by age group
- Clothing sizes with regional mappings
- Physical attributes with localization
- Industry specializations
- Pet-specific characteristics

### Implementation Structure
Organized seeder modules for different category types with bulk insert optimizations.

**Seeders**: See `scripts/seed/option-sets/comprehensive-creative-industry-seeder.ts`

## Implementation Phases

### Phase 1: Core Infrastructure
- Complete option set seeding with regional mappings
- Dynamic form generation for all model types
- Caching and performance optimization

### Phase 2: Advanced Features
- Conditional field logic (breed depends on species)
- Multi-level dependencies
- Enhanced search and filtering

### Phase 3: Industry Extensions
- Voice model audio portfolios
- Pet health record integration
- Child model compliance workflows

### Phase 4: Platform Scaling
- Tenant customization tools
- Bulk import/export capabilities
- Analytics and insights

This architecture provides flexible multi-industry marketplace support with seamless regional adaptation while maintaining data consistency and performance.