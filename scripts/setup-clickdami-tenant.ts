#!/usr/bin/env tsx

/**
 * Setup ClickDami Tenant Configuration
 * 
 * Creates the clickdami tenant with all necessary configuration for:
 * - Casting management
 * - Model applications  
 * - Analytics dashboard (funeralytics)
 * - Categories and tags management
 * - Marketplace features
 * - Comprehensive settings
 */

import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface ClickDamiTenantConfig {
  name: string;
  domain: string;
  slug: string;
  description: any;
  features: any;
  settings: any;
  categories: any;
}

const clickDamiConfig: ClickDamiTenantConfig = {
  name: "ClickDami",
  domain: "clickdami.com",
  slug: "clickdami",
  description: {
    en: "Professional modeling and casting platform",
    tagline: "Where talent meets opportunity",
    industry: "Entertainment & Media",
    focus: ["modeling", "casting", "talent-management"]
  },
  features: {
    // Core Features
    casting: {
      enabled: true,
      createCasting: true,
      manageCasting: true,
      applicationReview: true,
      autoMatching: true
    },
    modelApplications: {
      enabled: true,
      applicationForms: true,
      portfolioReview: true,
      statusTracking: true,
      bulkActions: true
    },
    analytics: {
      enabled: true,
      dashboard: true,
      reporting: true,
      metrics: ["applications", "castings", "conversions", "revenue"],
      realTimeTracking: true
    },
    marketplace: {
      enabled: true,
      gigs: true,
      jobs: true,
      bookings: true,
      payments: true,
      reviews: true
    },
    contentManagement: {
      enabled: true,
      categories: true,
      tags: true,
      hierarchicalStructure: true,
      bulkOperations: true
    },
    // Advanced Features
    portfolioManagement: {
      enabled: true,
      mediaUpload: true,
      galleries: true,
      setCards: true,
      verification: true
    },
    messaging: {
      enabled: true,
      conversations: true,
      notifications: true,
      fileSharing: true
    },
    search: {
      enabled: true,
      advancedFilters: true,
      savedSearches: true,
      recommendations: true
    }
  },
  settings: {
    branding: {
      primaryColor: "#6366f1",
      secondaryColor: "#8b5cf6",
      logo: "/clickdami-logo.svg",
      favicon: "/clickdami-favicon.ico",
      companyName: "ClickDami"
    },
    domain: {
      customDomain: "clickdami.com",
      subdomain: "clickdami.mono.itellico.com",
      ssl: true,
      redirects: ["www.clickdami.com"]
    },
    localization: {
      defaultLanguage: "en-US",
      supportedLanguages: ["en-US", "en-GB", "de-DE", "fr-FR"],
      defaultCurrency: "EUR",
      supportedCurrencies: ["EUR", "USD", "GBP"]
    },
    business: {
      type: "platform",
      model: "marketplace",
      commission: 15,
      paymentMethods: ["stripe", "paypal"],
      taxHandling: "inclusive"
    },
    marketplace: {
      autoApproval: false,
      manualReview: true,
      requireVerification: true,
      allowGuestBrowsing: true,
      featuredListings: true
    },
    content: {
      moderationEnabled: true,
      autoTagging: true,
      imageProcessing: true,
      videoProcessing: true,
      maxFileSize: "50MB"
    },
    navigation: {
      mainMenu: [
        { label: "Home", path: "/", type: "page" },
        { label: "Browse Models", path: "/models", type: "page" },
        { label: "Castings", path: "/castings", type: "page" },
        { label: "Jobs", path: "/jobs", type: "page" },
        { label: "Academy", path: "/academy", type: "page" },
        { label: "Blog", path: "/blog", type: "page" }
      ],
      footerMenu: [
        { label: "About", path: "/about", type: "page" },
        { label: "Contact", path: "/contact", type: "page" },
        { label: "Privacy", path: "/privacy", type: "page" },
        { label: "Terms", path: "/terms", type: "page" }
      ]
    }
  },
  categories: {
    modelTypes: [
      {
        name: "Fashion Models",
        slug: "fashion-models",
        description: "High fashion and runway modeling",
        subcategories: [
          { name: "Runway", slug: "runway" },
          { name: "Editorial", slug: "editorial" },
          { name: "Commercial", slug: "commercial" },
          { name: "Plus Size", slug: "plus-size" }
        ]
      },
      {
        name: "Commercial Models",
        slug: "commercial-models", 
        description: "Advertising and commercial work",
        subcategories: [
          { name: "Lifestyle", slug: "lifestyle" },
          { name: "Corporate", slug: "corporate" },
          { name: "Product", slug: "product" },
          { name: "Automotive", slug: "automotive" }
        ]
      },
      {
        name: "Fitness Models",
        slug: "fitness-models",
        description: "Sports and fitness modeling",
        subcategories: [
          { name: "Athletic Wear", slug: "athletic-wear" },
          { name: "Bodybuilding", slug: "bodybuilding" },
          { name: "Yoga", slug: "yoga" },
          { name: "Dance", slug: "dance" }
        ]
      },
      {
        name: "Alternative Models", 
        slug: "alternative-models",
        description: "Tattoo, gothic, and alternative styling",
        subcategories: [
          { name: "Tattoo", slug: "tattoo" },
          { name: "Gothic", slug: "gothic" },
          { name: "Punk", slug: "punk" },
          { name: "Pin-up", slug: "pin-up" }
        ]
      }
    ],
    castingTypes: [
      {
        name: "Fashion Shows",
        slug: "fashion-shows",
        description: "Runway and fashion presentations"
      },
      {
        name: "Photo Shoots",
        slug: "photo-shoots", 
        description: "Studio and location photography"
      },
      {
        name: "Commercials",
        slug: "commercials",
        description: "TV and online advertising"
      },
      {
        name: "Music Videos",
        slug: "music-videos",
        description: "Music video productions"
      },
      {
        name: "Film & TV",
        slug: "film-tv",
        description: "Movie and television roles"
      }
    ],
    jobTypes: [
      {
        name: "Modeling Gigs",
        slug: "modeling-gigs",
        description: "Short-term modeling assignments"
      },
      {
        name: "Full-time Positions",
        slug: "full-time-positions",
        description: "Long-term employment opportunities"
      },
      {
        name: "Freelance Work",
        slug: "freelance-work",
        description: "Independent contractor roles"
      },
      {
        name: "Representation",
        slug: "representation",
        description: "Agency and management opportunities"
      }
    ]
  }
};

async function setupClickDamiTenant() {
  console.log('🚀 Setting up ClickDami tenant...');

  try {
    // Check if tenant already exists
    const existingTenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { domain: clickDamiConfig.domain },
          { slug: clickDamiConfig.slug }
        ]
      }
    });

    if (existingTenant) {
      console.log('⚠️  ClickDami tenant already exists. Updating configuration...');
      
      const updatedTenant = await prisma.tenant.update({
        where: { id: existingTenant.id },
        data: {
          name: clickDamiConfig.name,
          description: clickDamiConfig.description as Prisma.JsonValue,
          features: clickDamiConfig.features as Prisma.JsonValue,
          settings: clickDamiConfig.settings as Prisma.JsonValue,
          categories: clickDamiConfig.categories as Prisma.JsonValue,
          allowedCountries: ["US", "GB", "DE", "FR", "IT", "ES", "NL", "BE"] as Prisma.JsonValue,
          defaultCurrency: "EUR",
          isActive: true,
          updatedAt: new Date()
        }
      });

      console.log('✅ ClickDami tenant updated successfully!');
      console.log(`🌐 Tenant ID: ${updatedTenant.id}`);
      console.log(`🔑 Tenant UUID: ${updatedTenant.uuid}`);
      return updatedTenant;
    }

    // Create new tenant
    const newTenant = await prisma.tenant.create({
      data: {
        name: clickDamiConfig.name,
        domain: clickDamiConfig.domain,
        slug: clickDamiConfig.slug,
        description: clickDamiConfig.description as Prisma.JsonValue,
        features: clickDamiConfig.features as Prisma.JsonValue,
        settings: clickDamiConfig.settings as Prisma.JsonValue,
        categories: clickDamiConfig.categories as Prisma.JsonValue,
        allowedCountries: ["US", "GB", "DE", "FR", "IT", "ES", "NL", "BE"] as Prisma.JsonValue,
        defaultCurrency: "EUR",
        isActive: true
      }
    });

    console.log('✅ ClickDami tenant created successfully!');
    console.log(`🌐 Tenant ID: ${newTenant.id}`);
    console.log(`🔑 Tenant UUID: ${newTenant.uuid}`);
    console.log(`🏠 Domain: ${newTenant.domain}`);
    console.log(`🔧 Slug: ${newTenant.slug}`);

    // Create default categories and tags
    await setupDefaultCategories(newTenant.id);
    await setupDefaultTags(newTenant.id);

    console.log('🎉 ClickDami tenant setup completed!');
    return newTenant;

  } catch (error) {
    console.error('❌ Error setting up ClickDami tenant:', error);
    throw error;
  }
}

async function setupDefaultCategories(tenantId: number) {
  console.log('📂 Setting up default categories...');

  const categories = [
    // Model Categories
    { name: "Fashion Models", slug: "fashion-models", description: "High fashion and runway modeling" },
    { name: "Commercial Models", slug: "commercial-models", description: "Advertising and commercial work" },
    { name: "Fitness Models", slug: "fitness-models", description: "Sports and fitness modeling" },
    { name: "Alternative Models", slug: "alternative-models", description: "Tattoo, gothic, and alternative styling" },
    
    // Casting Categories
    { name: "Fashion Shows", slug: "fashion-shows", description: "Runway and fashion presentations" },
    { name: "Photo Shoots", slug: "photo-shoots", description: "Studio and location photography" },
    { name: "Commercials", slug: "commercials", description: "TV and online advertising" },
    { name: "Music Videos", slug: "music-videos", description: "Music video productions" },
    
    // Job Categories
    { name: "Modeling Gigs", slug: "modeling-gigs", description: "Short-term modeling assignments" },
    { name: "Full-time Positions", slug: "full-time-positions", description: "Long-term employment opportunities" },
    { name: "Freelance Work", slug: "freelance-work", description: "Independent contractor roles" },
    { name: "Representation", slug: "representation", description: "Agency and management opportunities" }
  ];

  for (const category of categories) {
    try {
      // Check if category exists by slug
      const existing = await prisma.category.findFirst({
        where: {
          slug: category.slug
        }
      });

      if (!existing) {
        await prisma.category.create({
          data: category
        });
        console.log(`  ✅ Created category: ${category.name}`);
      } else {
        console.log(`  ⚠️  Category already exists: ${category.name}`);
      }
    } catch (error) {
      console.log(`  ❌ Error creating category ${category.name}:`, error);
    }
  }
}

async function setupDefaultTags(tenantId: number) {
  console.log('🏷️  Setting up default tags...');

  const tags = [
    // Physical attributes
    { name: "Blonde", slug: "blonde", category: "physical", tenantId },
    { name: "Brunette", slug: "brunette", category: "physical", tenantId },
    { name: "Redhead", slug: "redhead", category: "physical", tenantId },
    { name: "Blue Eyes", slug: "blue-eyes", category: "physical", tenantId },
    { name: "Brown Eyes", slug: "brown-eyes", category: "physical", tenantId },
    { name: "Green Eyes", slug: "green-eyes", category: "physical", tenantId },
    { name: "Tall", slug: "tall", category: "physical", tenantId },
    { name: "Petite", slug: "petite", category: "physical", tenantId },
    { name: "Plus Size", slug: "plus-size", category: "physical", tenantId },
    { name: "Athletic", slug: "athletic", category: "physical", tenantId },
    
    // Skills
    { name: "Runway Experience", slug: "runway-experience", category: "skill", tenantId },
    { name: "Photo Experience", slug: "photo-experience", category: "skill", tenantId },
    { name: "Acting", slug: "acting", category: "skill", tenantId },
    { name: "Dancing", slug: "dancing", category: "skill", tenantId },
    { name: "Singing", slug: "singing", category: "skill", tenantId },
    { name: "Multilingual", slug: "multilingual", category: "skill", tenantId },
    
    // Specialties
    { name: "Editorial", slug: "editorial", category: "specialty", tenantId },
    { name: "Commercial", slug: "commercial", category: "specialty", tenantId },
    { name: "High Fashion", slug: "high-fashion", category: "specialty", tenantId },
    { name: "Lifestyle", slug: "lifestyle", category: "specialty", tenantId },
    { name: "Beauty", slug: "beauty", category: "specialty", tenantId },
    { name: "Fitness", slug: "fitness", category: "specialty", tenantId },
    
    // Experience Level
    { name: "Beginner", slug: "beginner", category: "experience", tenantId },
    { name: "Intermediate", slug: "intermediate", category: "experience", tenantId },
    { name: "Advanced", slug: "advanced", category: "experience", tenantId },
    { name: "Professional", slug: "professional", category: "experience", tenantId }
  ];

  for (const tag of tags) {
    try {
      // Check if tag exists by slug and tenant
      const existing = await prisma.tag.findFirst({
        where: {
          slug: tag.slug,
          tenantId: tag.tenantId
        }
      });

      if (!existing) {
        await prisma.tag.create({
          data: tag
        });
        console.log(`  ✅ Created tag: ${tag.name}`);
      } else {
        console.log(`  ⚠️  Tag already exists: ${tag.name}`);
      }
    } catch (error) {
      console.log(`  ❌ Error creating tag ${tag.name}:`, error);
    }
  }
}

// Run the setup
if (require.main === module) {
  setupClickDamiTenant()
    .then(() => {
      console.log('🎊 ClickDami tenant setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}

export { setupClickDamiTenant };