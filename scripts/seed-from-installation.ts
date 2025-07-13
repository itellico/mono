#!/usr/bin/env npx tsx
/**
 * Master Seeder Script - Seeds database from installation JSON files
 * 
 * This script reads from the /installation directory and seeds all
 * necessary data in the correct order with proper relationships.
 * 
 * Usage:
 *   npm run seed:install                 # Seed everything
 *   npm run seed:install -- --tags      # Seed only tags
 *   npm run seed:install -- --dry-run   # Preview what would be seeded
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

// Installation directory paths
const INSTALLATION_DIR = path.join(process.cwd(), 'installation');
const DATA_DIR = path.join(INSTALLATION_DIR, 'data');

// Command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const seedOnly = args.find(arg => arg.startsWith('--'))?.replace('--', '') || 'all';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Logging utilities
const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  section: (msg: string) => console.log(`\n${colors.bright}${colors.cyan}═══ ${msg} ═══${colors.reset}\n`)
};

// Generate a deterministic UUID from a string
function generateUUID(input: string): string {
  const hash = createHash('sha256').update(input).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 4),
    '4' + hash.substring(13, 3),
    ((parseInt(hash.substring(16, 1), 16) & 0x3) | 0x8).toString(16) + hash.substring(17, 3),
    hash.substring(20, 12)
  ].join('-');
}

// Load JSON file
async function loadJSON(filename: string): Promise<any> {
  const filepath = path.join(DATA_DIR, filename);
  try {
    const content = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    log.error(`Failed to load ${filename}: ${error}`);
    throw error;
  }
}

// Get or create system user
async function getSystemUser(tenantId: string) {
  const systemUserId = generateUUID(`system-user-${tenantId}`);
  
  if (isDryRun) {
    log.info(`Would create system user for tenant ${tenantId}`);
    return systemUserId;
  }

  const user = await prisma.user.upsert({
    where: { id: systemUserId },
    update: {},
    create: {
      id: systemUserId,
      email: `system@tenant-${tenantId}.local`,
      username: 'system',
      password: 'not-for-login', // This user cannot log in
      isActive: true,
      emailVerified: new Date()
    }
  });

  return user.id;
}

// Seed system tags
async function seedSystemTags(tenantId: string) {
  if (seedOnly !== 'all' && seedOnly !== 'tags') return;
  
  log.section('Seeding System Tags');
  
  const tagsData = await loadJSON('system-tags.json');
  const systemUserId = await getSystemUser(tenantId);
  let tagCount = 0;

  for (const [entityType, categories] of Object.entries(tagsData.tags)) {
    for (const [categoryName, tags] of Object.entries(categories as any)) {
      for (const tag of tags as any[]) {
        const tagId = generateUUID(`tag-${tenantId}-${tag.slug}`);
        
        if (isDryRun) {
          log.info(`Would create tag: ${tag.name} (${tag.slug})`);
          tagCount++;
          continue;
        }

        try {
          await prisma.tag.upsert({
            where: { 
              tenantId_slug: {
                tenantId,
                slug: tag.slug
              }
            },
            update: {
              name: tag.name,
              category: tag.category,
              isSystem: true
            },
            create: {
              id: tagId,
              tenantId,
              name: tag.name,
              slug: tag.slug,
              category: tag.category,
              isSystem: true,
              createdBy: systemUserId
            }
          });
          tagCount++;
        } catch (error) {
          log.error(`Failed to create tag ${tag.slug}: ${error}`);
        }
      }
    }
  }

  log.success(`${isDryRun ? 'Would seed' : 'Seeded'} ${tagCount} system tags`);
}

// Seed job categories
async function seedJobCategories(tenantId: string) {
  if (seedOnly !== 'all' && seedOnly !== 'jobs') return;
  
  log.section('Seeding Job Categories');
  
  const jobData = await loadJSON('job-categories.json');
  const systemUserId = await getSystemUser(tenantId);
  let categoryCount = 0;

  for (const [categoryKey, category] of Object.entries(jobData.categories)) {
    const categoryId = generateUUID(`job-category-${tenantId}-${category.slug}`);
    
    if (isDryRun) {
      log.info(`Would create job category: ${category.name}`);
      categoryCount++;
      continue;
    }

    try {
      // Create main category
      await prisma.category.upsert({
        where: { 
          tenantId_slug: {
            tenantId,
            slug: category.slug
          }
        },
        update: {
          name: category.name,
          description: category.description
        },
        create: {
          id: categoryId,
          tenantId,
          name: category.name,
          slug: category.slug,
          description: category.description,
          type: 'job',
          isActive: true,
          createdBy: systemUserId
        }
      });

      // Create subcategories
      for (const [subKey, subcategory] of Object.entries(category.subcategories)) {
        const subCategoryId = generateUUID(`job-category-${tenantId}-${subcategory.slug}`);
        
        await prisma.category.upsert({
          where: {
            tenantId_slug: {
              tenantId,
              slug: subcategory.slug
            }
          },
          update: {
            name: subcategory.name,
            parentId: categoryId
          },
          create: {
            id: subCategoryId,
            tenantId,
            name: subcategory.name,
            slug: subcategory.slug,
            description: `${category.name} - ${subcategory.name}`,
            type: 'job',
            parentId: categoryId,
            isActive: true,
            createdBy: systemUserId
          }
        });

        // Create job types as tags
        for (const jobType of subcategory.types) {
          const tagSlug = `job-type-${jobType.slug}`;
          await prisma.tag.upsert({
            where: {
              tenantId_slug: {
                tenantId,
                slug: tagSlug
              }
            },
            update: {},
            create: {
              id: generateUUID(`tag-${tenantId}-${tagSlug}`),
              tenantId,
              name: jobType.name,
              slug: tagSlug,
              category: 'job-type',
              isSystem: true,
              createdBy: systemUserId
            }
          });
        }
      }

      categoryCount++;
    } catch (error) {
      log.error(`Failed to create job category ${category.slug}: ${error}`);
    }
  }

  log.success(`${isDryRun ? 'Would seed' : 'Seeded'} ${categoryCount} job categories`);
}

// Seed gig categories
async function seedGigCategories(tenantId: string) {
  if (seedOnly !== 'all' && seedOnly !== 'gigs') return;
  
  log.section('Seeding Gig Categories');
  
  const gigData = await loadJSON('gig-categories.json');
  const systemUserId = await getSystemUser(tenantId);
  let categoryCount = 0;

  for (const [categoryKey, category] of Object.entries(gigData.categories)) {
    const categoryId = generateUUID(`gig-category-${tenantId}-${category.slug}`);
    
    if (isDryRun) {
      log.info(`Would create gig category: ${category.name}`);
      categoryCount++;
      continue;
    }

    try {
      // Create main category
      await prisma.category.upsert({
        where: { 
          tenantId_slug: {
            tenantId,
            slug: `gig-${category.slug}`
          }
        },
        update: {
          name: category.name,
          description: category.description
        },
        create: {
          id: categoryId,
          tenantId,
          name: category.name,
          slug: `gig-${category.slug}`,
          description: category.description,
          type: 'gig',
          isActive: true,
          createdBy: systemUserId
        }
      });

      // Create subcategories and services
      for (const [subKey, subcategory] of Object.entries(category.subcategories)) {
        const subCategoryId = generateUUID(`gig-category-${tenantId}-${subcategory.slug}`);
        
        await prisma.category.upsert({
          where: {
            tenantId_slug: {
              tenantId,
              slug: `gig-${subcategory.slug}`
            }
          },
          update: {
            name: subcategory.name,
            parentId: categoryId
          },
          create: {
            id: subCategoryId,
            tenantId,
            name: subcategory.name,
            slug: `gig-${subcategory.slug}`,
            description: `${category.name} - ${subcategory.name}`,
            type: 'gig',
            parentId: categoryId,
            isActive: true,
            createdBy: systemUserId
          }
        });

        // Create service types as tags
        for (const service of subcategory.services) {
          const tagSlug = `gig-service-${service.slug}`;
          await prisma.tag.upsert({
            where: {
              tenantId_slug: {
                tenantId,
                slug: tagSlug
              }
            },
            update: {},
            create: {
              id: generateUUID(`tag-${tenantId}-${tagSlug}`),
              tenantId,
              name: service.name,
              slug: tagSlug,
              category: 'gig-service',
              isSystem: true,
              createdBy: systemUserId
            }
          });
        }
      }

      categoryCount++;
    } catch (error) {
      log.error(`Failed to create gig category ${category.slug}: ${error}`);
    }
  }

  log.success(`${isDryRun ? 'Would seed' : 'Seeded'} ${categoryCount} gig categories`);
}

// Main seeding function
async function main() {
  log.section('itellico Mono Installation Seeder');
  
  try {
    // Load installation config
    const configPath = path.join(INSTALLATION_DIR, 'installation.config.json');
    const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
    
    log.info(`Loading installation version ${config.version}`);
    log.info(`Seed mode: ${seedOnly === 'all' ? 'ALL DATA' : seedOnly.toUpperCase() + ' ONLY'}`);
    log.info(`Dry run: ${isDryRun ? 'YES (no changes will be made)' : 'NO (database will be updated)'}`);

    // Get or create default tenant
    let tenantId: string;
    
    if (isDryRun) {
      tenantId = 'dry-run-tenant-id';
      log.info('Would use default tenant for seeding');
    } else {
      const defaultTenant = await prisma.tenant.findFirst({
        where: { slug: 'default' }
      });

      if (!defaultTenant) {
        log.warning('No default tenant found. Creating one...');
        const newTenant = await prisma.tenant.create({
          data: {
            id: generateUUID('tenant-default'),
            name: 'Default Tenant',
            slug: 'default',
            industry: 'modeling',
            isActive: true
          }
        });
        tenantId = newTenant.id;
      } else {
        tenantId = defaultTenant.id;
      }
    }

    // Run seeders based on configuration order
    const seeders: Record<string, (tenantId: string) => Promise<void>> = {
      systemTags: seedSystemTags,
      jobCategories: seedJobCategories,
      gigCategories: seedGigCategories
    };

    for (const seederName of config.seedingOrder) {
      const seeder = seeders[seederName];
      if (seeder) {
        await seeder(tenantId);
      }
    }

    log.section('Seeding Complete!');
    
    if (isDryRun) {
      log.warning('This was a dry run. No changes were made to the database.');
      log.info('Run without --dry-run to apply changes.');
    } else {
      log.success('All data has been successfully seeded!');
    }

  } catch (error) {
    log.error(`Seeding failed: ${error}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
main();