#!/usr/bin/env tsx

/**
 * ClickDami Tenant Creation via Raw SQL
 * 
 * Creates the clickdami tenant using raw SQL to bypass Prisma validation issues
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createClickDamiTenantSQL() {
  console.log('🚀 Creating ClickDami tenant via SQL...');

  try {
    // Check if tenant already exists
    const existingTenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { domain: "clickdami.com" },
          { slug: "clickdami" }
        ]
      }
    });

    if (existingTenant) {
      console.log('⚠️  ClickDami tenant already exists!');
      console.log(`🌐 Tenant ID: ${existingTenant.id}`);
      console.log(`🔑 Tenant UUID: ${existingTenant.uuid}`);
      return existingTenant;
    }

    // Create tenant using raw SQL
    const result = await prisma.$executeRaw`
      INSERT INTO "Tenant" (
        "uuid",
        "name", 
        "domain", 
        "slug", 
        "description", 
        "features", 
        "settings",
        "allowedCountries",
        "defaultCurrency",
        "isActive",
        "createdAt",
        "updatedAt"
      ) VALUES (
        gen_random_uuid(),
        'ClickDami',
        'clickdami.com',
        'clickdami',
        '{"en": "Professional modeling and casting platform", "tagline": "Where talent meets opportunity", "industry": "Entertainment & Media"}'::jsonb,
        '{"casting": {"enabled": true}, "modelApplications": {"enabled": true}, "analytics": {"enabled": true}, "marketplace": {"enabled": true}}'::jsonb,
        '{"branding": {"primaryColor": "#6366f1", "companyName": "ClickDami"}}'::jsonb,
        '["US", "GB", "DE", "FR", "IT", "ES"]'::jsonb,
        'EUR',
        true,
        NOW(),
        NOW()
      )
    `;

    console.log('✅ ClickDami tenant created successfully via SQL!');
    console.log(`📊 Rows affected: ${result}`);

    // Fetch the created tenant
    const newTenant = await prisma.tenant.findFirst({
      where: { domain: "clickdami.com" }
    });

    if (newTenant) {
      console.log(`🌐 Tenant ID: ${newTenant.id}`);
      console.log(`🔑 Tenant UUID: ${newTenant.uuid}`);
      console.log(`🏠 Domain: ${newTenant.domain}`);
      console.log(`🔧 Slug: ${newTenant.slug}`);
      return newTenant;
    } else {
      throw new Error('Failed to retrieve created tenant');
    }

  } catch (error) {
    console.error('❌ Error creating ClickDami tenant:', error);
    throw error;
  }
}

// Run the setup
if (require.main === module) {
  createClickDamiTenantSQL()
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

export { createClickDamiTenantSQL };