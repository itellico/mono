#!/usr/bin/env tsx

/**
 * Simple ClickDami Tenant Creation
 * 
 * Creates just the basic clickdami tenant without categories/tags
 */

import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const clickDamiConfig = {
  name: "ClickDami",
  domain: "clickdami.com",
  slug: "clickdami",
  description: {
    en: "Professional modeling and casting platform",
    tagline: "Where talent meets opportunity",
    industry: "Entertainment & Media"
  } as Prisma.JsonValue,
  features: {
    casting: { enabled: true },
    modelApplications: { enabled: true },
    analytics: { enabled: true },
    marketplace: { enabled: true }
  } as Prisma.JsonValue,
  settings: {
    branding: {
      primaryColor: "#6366f1",
      companyName: "ClickDami"
    }
  } as Prisma.JsonValue,
  allowedCountries: ["US", "GB", "DE", "FR", "IT", "ES"] as Prisma.JsonValue,
  defaultCurrency: "EUR",
  isActive: true
};

async function createClickDamiTenant() {
  console.log('🚀 Creating ClickDami tenant...');

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
      console.log('⚠️  ClickDami tenant already exists!');
      console.log(`🌐 Tenant ID: ${existingTenant.id}`);
      console.log(`🔑 Tenant UUID: ${existingTenant.uuid}`);
      return existingTenant;
    }

    // Create new tenant
    const newTenant = await prisma.tenant.create({
      data: clickDamiConfig
    });

    console.log('✅ ClickDami tenant created successfully!');
    console.log(`🌐 Tenant ID: ${newTenant.id}`);
    console.log(`🔑 Tenant UUID: ${newTenant.uuid}`);
    console.log(`🏠 Domain: ${newTenant.domain}`);
    console.log(`🔧 Slug: ${newTenant.slug}`);

    return newTenant;

  } catch (error) {
    console.error('❌ Error creating ClickDami tenant:', error);
    throw error;
  }
}

// Run the setup
if (require.main === module) {
  createClickDamiTenant()
    .then(() => {
      console.log('🎉 ClickDami tenant setup completed!');
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

export { createClickDamiTenant };