# Seeding Strategy for itellico Mono

This document outlines a comprehensive strategy for seeding the itellico Mono database, addressing the distinctions between Option Sets, Categories, and Tags, and covering both core system data and demo data. It also highlights necessary schema additions based on the `GEMINI.md` guidelines.

## 1. Proposed Schema Additions (P0 - Critical)

Based on the `GEMINI.md` descriptions and the current `prisma/schema.prisma`, the following models are conceptually defined but not explicitly present as relational tables. For robust data management, queryability, and adherence to the described structures, it is highly recommended to add these to `prisma/schema.prisma`.

### 1.1. Option Sets System

To fully support the "Option Sets System" as described in `GEMINI.md`, dedicated tables are crucial. This allows for proper foreign key relationships, efficient querying, and clear separation of concerns.

```prisma
// prisma/schema.prisma additions

model OptionSet {
  id          Int        @id @default(autoincrement())
  uuid        String     @default(uuid())
  slug        String     @unique // e.g., "shoe_size", "hair_color", "height_cm"
  label       String     // Display label, e.g., "Shoe Size", "Hair Color"
  tenantId    Int?       // Null for global option sets, value for tenant-specific
  description String?    
  isActive    Boolean    @default(true)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  values      OptionValue[]

  @@unique([slug, tenantId]) // Ensure unique slug per tenant or globally
}

model OptionValue {
  id             Int      @id @default(autoincrement())
  uuid           String   @default(uuid())
  optionSetId    Int
  optionSet      OptionSet @relation(fields: [optionSetId], references: [id])
  value          String   // The actual value, e.g., "US_10", "black", "175"
  label          String   // Display label, e.g., "US 10", "Black", "175 cm"
  order          Int      @default(0)
  canonicalRegion String?  // e.g., "US", "EU" for shoe sizes
  regionalMappings Json?    // JSONB for localized labels/values, e.g., { "EU": "43", "UK": "9" }
  metadata       Json?    // Additional metadata, e.g., conversion factors
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([optionSetId, value]) // Ensure unique value within an option set
}
```

### 1.2. Categories and Tags System

For robust classification and tagging, dedicated models are recommended. This allows for proper foreign key relationships, efficient querying, and clear separation of concerns.

```prisma
// prisma/schema.prisma additions

model Category {
  id          Int        @id @default(autoincrement())
  uuid        String     @default(uuid())
  slug        String     @unique // e.g., "baby_model", "fashion_model"
  name        String     // Display name, e.g., "Baby Model", "Fashion Model"
  description String?    
  parentId    Int?       // For hierarchical categories
  parent      Category?  @relation("Subcategories", fields: [parentId], references: [id])
  subcategories Category[] @relation("Subcategories")
  isActive    Boolean    @default(true)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  tags        CategoryTag[]
  // Add relations to other models that use categories (e.g., Job, Profile)
}

model Tag {
  id          Int        @id @default(autoincrement())
  uuid        String     @default(uuid())
  slug        String     @unique // e.g., "curly_hair", "blue_eyes"
  name        String     // Display name, e.g., "Curly Hair", "Blue Eyes"
  description String?    
  isActive    Boolean    @default(true)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  categories  CategoryTag[]
  // Add relations to other models that use tags (e.g., Job, Profile)
}

model CategoryTag {
  categoryId Int
  tagId      Int
  category   Category @relation(fields: [categoryId], references: [id])
  tag        Tag      @relation(fields: [tagId], references: [id])

  @@id([categoryId, tagId])
}
```

### 1.3. Core Data Models (Currencies, Countries, Languages)

While some of these might be stored as JSON in `Tenant` settings, for comprehensive and standardized lists, dedicated tables are often more manageable and extensible.

```prisma
// prisma/schema.prisma additions (if not already handled by external libraries or JSONB)

model Currency {
  id          Int      @id @default(autoincrement())
  code        String   @unique // e.g., "USD", "EUR"
  name        String
  symbol      String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Country {
  id          Int      @id @default(autoincrement())
  code        String   @unique // ISO 3166-1 alpha-2, e.g., "US", "DE"
  name        String
  dialCode    String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Language {
  id          Int      @id @default(autoincrement())
  code        String   @unique // ISO 639-1, e.g., "en", "de"
  name        String
  nativeName  String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## 2. Proposed Seeder Directory Structure

To maintain organization and clarity, especially with different types of seed data, the following structure within the `scripts/` directory is proposed:

```
scripts/
├── seed/                     # Main directory for all seeding scripts
│   ├── core/                 # Essential, non-tenant-specific data
│   │   ├── seed-currencies.ts
│   │   ├── seed-countries.ts
│   │   └── seed-languages.ts
│   ├── option-sets/          # Option set definitions and values
│   │   ├── seed-heights.ts
│   │   ├── seed-shoe-sizes.ts
│   │   ├── seed-hair-colors.ts
│   │   └── seed-eye-colors.ts
│   ├── categories-tags/      # Categories and Tags definitions
│   │   ├── seed-categories.ts
│   │   └── seed-tags.ts
│   ├── demo/                 # Demo data for development/showcase
│   │   ├── seed-demo-users.ts
│   │   ├── seed-demo-profiles.ts
│   │   └── seed-demo-jobs.ts
│   └── utils/                # Helper functions for seeding (e.g., data loaders)
│       └── seed-utils.ts
└── seed-tenant.ts            # Existing tenant setup script (can be called by demo seeder)
```

## 3. Clarifying Data Types: Option Sets vs. Categories vs. Tags

Understanding the distinct roles of these data types is crucial for proper implementation and seeding.

*   **Option Sets (P1):**
    *   **Purpose:** Provide a predefined, selectable list of values for specific attributes. These are typically used in forms where a user chooses from a set of discrete options. They can have regional variations.
    *   **Examples:** Shoe sizes (US 10, EU 43), hair colors (Black, Brown, Blonde), eye colors (Blue, Green, Brown), heights (170 cm, 171 cm, ...), clothing sizes.
    *   **Seeding Approach:** Each `OptionSet` (e.g., "shoe_size") will have numerous `OptionValue` entries (e.g., "US_10", "US_10.5", "EU_43"). For ranges like height, individual values (e.g., "150", "151", ..., "200") will be seeded as separate `OptionValue` entries. `regionalMappings` will be used for localized labels (e.g., "175 cm" in Europe, "5'9" in US for height).

*   **Categories (P2):**
    *   **Purpose:** Broad classification or grouping of entities. Categories can be hierarchical and help organize content into logical sections.
    *   **Examples:** Model types (Baby Model, Fashion Model, Commercial Model), Job types (Photoshoot, Runway, Commercial), Company types (Photography Studio, Advertising Agency).
    *   **Seeding Approach:** Populate the `Category` table with top-level and nested categories. Seeders will define the hierarchy using `parentId`.

*   **Tags (P2):**
    *   **Purpose:** More granular, descriptive keywords that can be associated with entities or categories. Tags are typically used for search, filtering, and providing additional context.
    *   **Examples:** For a model: "curly hair", "blue eyes", "athletic build". For a job: "outdoor shoot", "product launch".
    *   **Seeding Approach:** Populate the `Tag` table with relevant keywords. `CategoryTag` (join table) will link tags to categories where appropriate.

## 4. Seeding Strategy for Basic Settings

These seeders will populate the proposed `Currency`, `Country`, and `Language` tables with comprehensive, standardized data. This data is generally static and foundational for the platform.

*   **`seed-currencies.ts`:** Populates the `Currency` table with ISO 4217 currency codes, names, and symbols (e.g., USD, EUR, GBP).
*   **`seed-countries.ts`:** Populates the `Country` table with ISO 3166-1 alpha-2 codes, names, and dial codes (e.g., US, DE, GB).
*   **`seed-languages.ts`:** Populates the `Language` table with ISO 639-1 codes, names, and native names (e.g., en, de, fr).

These seeders will typically fetch data from reliable external sources (e.g., npm packages for ISO lists) or use pre-defined JSON data.

## 5. Seeding Strategy for Demo Data

Demo data seeders will populate the database with realistic, but non-essential, data for development, testing, and demonstration purposes. They will leverage the core data and option sets already seeded.

*   **`seed-tenant.ts` (Existing):** This script remains the entry point for setting up a new tenant, including an admin user and initial roles/settings. It can be called as part of a larger demo seeding process.
*   **`seed-demo-users.ts`:** Creates a set of sample users with various roles and account types.
*   **`seed-demo-profiles.ts`:** Creates sample model profiles, populating attributes like height, hair color, eye color using the seeded `OptionSet` values. It will also link to seeded categories and tags.
*   **`seed-demo-jobs.ts`:** Creates sample job postings, referencing seeded categories, tags, and potentially linking to demo users/profiles.

## Next Steps

Before implementing these seeders, the proposed schema additions (Section 1) must be applied to `prisma/schema.prisma` and a new migration generated and applied (`npx prisma migrate dev`). Once the schema is ready, individual seeders can be developed and executed. 
