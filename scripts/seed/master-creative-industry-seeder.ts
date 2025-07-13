#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';
import seedComprehensiveCreativeIndustryOptionSets from './option-sets/comprehensive-creative-industry-seeder';
import seedSupplementaryOptionSets from './option-sets/supplementary-option-sets-seeder';
import seedComprehensiveModelSchemas from './model-schemas/comprehensive-model-schemas-seeder';

const prisma = new PrismaClient();

/**
 * Master Creative Industry Seeder
 * 
 * Orchestrates the complete seeding process for itellico Mono's creative industry
 * marketplace, including option sets and model schemas for all professional roles.
 * 
 * This seeder creates:
 * - 200+ option sets with regional mappings
 * - 15+ model schemas for different creative roles
 * - Complete industry-specific workflows
 * 
 * Usage:
 * npm run seed:creative-industry
 * or
 * npx tsx scripts/seed/master-creative-industry-seeder.ts
 */

interface SeedingResult {
  totalOptionSets: number;
  totalOptionValues: number;
  totalModelSchemas: number;
  totalSchemaFields: number;
  duration: number;
  success: boolean;
  errors: string[];
}

async function runMasterSeeder(): Promise<SeedingResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let totalOptionSets = 0;
  let totalOptionValues = 0;
  let totalModelSchemas = 0;
  let totalSchemaFields = 0;

  try {
    logger.info('🚀 Starting Master Creative Industry Seeder...');
    logger.info('This will seed option sets and model schemas for the complete creative industry marketplace.');
    
    // ===========================================
    // PHASE 1: COMPREHENSIVE CREATIVE INDUSTRY OPTION SETS
    // ===========================================
    
    logger.info('\n📋 PHASE 1: Seeding comprehensive creative industry option sets...');
    logger.info('Creating physical measurements, clothing sizes, specializations, and more...');
    
    try {
      const creativeOptionSetsResult = await seedComprehensiveCreativeIndustryOptionSets();
      totalOptionSets += creativeOptionSetsResult.totalOptionSets;
      totalOptionValues += creativeOptionSetsResult.totalValues;
      
      logger.info(`✅ Phase 1 complete: ${creativeOptionSetsResult.totalOptionSets} option sets with ${creativeOptionSetsResult.totalValues} values`);
      logger.info(`Categories created: ${Object.keys(creativeOptionSetsResult.categories).length} categories`);
    } catch (error) {
      const errorMsg = `❌ Phase 1 failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMsg);
      errors.push(errorMsg);
      // Continue with other phases even if this fails
    }

    // Small delay between phases
    await new Promise(resolve => setTimeout(resolve, 2000));

    // ===========================================
    // PHASE 2: SUPPLEMENTARY OPTION SETS
    // ===========================================
    
    logger.info('\n📋 PHASE 2: Seeding supplementary option sets...');
    logger.info('Creating demographic, professional, technical, and specialized option sets...');
    
    try {
      const supplementaryResult = await seedSupplementaryOptionSets();
      totalOptionSets += supplementaryResult.totalOptionSets;
      totalOptionValues += supplementaryResult.totalValues;
      
      logger.info(`✅ Phase 2 complete: ${supplementaryResult.totalOptionSets} option sets with ${supplementaryResult.totalValues} values`);
      logger.info(`Categories created: ${Object.keys(supplementaryResult.categories).length} categories`);
    } catch (error) {
      const errorMsg = `❌ Phase 2 failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMsg);
      errors.push(errorMsg);
      // Continue with model schemas even if this fails
    }

    // Delay before final phase
    await new Promise(resolve => setTimeout(resolve, 2000));

    // ===========================================
    // PHASE 3: MODEL SCHEMAS
    // ===========================================
    
    logger.info('\n🏗️ PHASE 3: Seeding comprehensive model schemas...');
    logger.info('Creating dynamic profile templates for all creative industry roles...');
    
    try {
      const modelSchemasResult = await seedComprehensiveModelSchemas();
      totalModelSchemas = modelSchemasResult.totalSchemas;
      totalSchemaFields = modelSchemasResult.totalFields;
      
      logger.info(`✅ Phase 3 complete: ${modelSchemasResult.totalSchemas} model schemas with ${modelSchemasResult.totalFields} fields`);
      logger.info(`Schema categories: ${Object.keys(modelSchemasResult.categories).length} categories`);
      logger.info('Model types created:', Object.keys(modelSchemasResult.bySubType));
    } catch (error) {
      const errorMsg = `❌ Phase 3 failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMsg);
      errors.push(errorMsg);
    }

    const duration = Date.now() - startTime;
    const success = errors.length === 0;

    // ===========================================
    // FINAL SUMMARY
    // ===========================================
    
    logger.info('\n🎉 MASTER SEEDER COMPLETE!');
    logger.info('=====================================');
    logger.info(`✨ Total Option Sets Created: ${totalOptionSets}`);
    logger.info(`📊 Total Option Values Created: ${totalOptionValues}`);
    logger.info(`🏗️ Total Model Schemas Created: ${totalModelSchemas}`);
    logger.info(`🔧 Total Schema Fields Created: ${totalSchemaFields}`);
    logger.info(`⏱️ Total Duration: ${Math.round(duration / 1000)}s`);
    logger.info(`🎯 Success Rate: ${success ? '100%' : `${Math.round(((3 - errors.length) / 3) * 100)}%`}`);
    
    if (errors.length > 0) {
      logger.warn('\n⚠️ Errors encountered:');
      errors.forEach(error => logger.warn(`  - ${error}`));
    }

    logger.info('\n🔥 itellico Mono Creative Industry Marketplace is now fully seeded!');
    logger.info('Available profile types:');
    logger.info('  👶 Baby Models (0-2 years) with guardian management');
    logger.info('  🧒 Child Models (3-12 years) with education coordination');
    logger.info('  👦 Teen Models (13-17 years) with transitional independence');
    logger.info('  👗 Fashion Models (18+ years) with professional measurements');
    logger.info('  💪 Fitness Models with performance metrics and specializations');
    logger.info('  🎤 Voice Talent with technical capabilities and accents');
    logger.info('  🐕 Pet Models with species-specific traits and training');
    logger.info('  📸 Photographers with equipment and specialization tracking');
    logger.info('  💄 Makeup Artists with technique and brand preferences');
    logger.info('');
    logger.info('🌍 All profiles include:');
    logger.info('  - Regional measurement conversions (US/UK/EU/Asia)');
    logger.info('  - Multi-language support');
    logger.info('  - Industry-specific specializations');
    logger.info('  - Professional experience tracking');
    logger.info('  - Availability and logistics management');
    logger.info('');
    logger.info('🚀 Ready to build the next generation creative marketplace!');

    return {
      totalOptionSets,
      totalOptionValues,
      totalModelSchemas,
      totalSchemaFields,
      duration,
      success,
      errors
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = `💥 Master seeder failed with critical error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    logger.error(errorMsg);
    errors.push(errorMsg);

    return {
      totalOptionSets,
      totalOptionValues,
      totalModelSchemas,
      totalSchemaFields,
      duration,
      success: false,
      errors
    };
  } finally {
    await prisma.$disconnect();
  }
}

// ===========================================
// CLI EXECUTION
// ===========================================

async function main() {
  // Check if running in CLI mode
  if (require.main === module) {
    try {
      const result = await runMasterSeeder();
      
      // Exit with appropriate code
      if (result.success) {
        logger.info('\n✅ Seeding completed successfully!');
        process.exit(0);
      } else {
        logger.error('\n❌ Seeding completed with errors. Check logs above.');
        process.exit(1);
      }
    } catch (error) {
      logger.error('💥 Fatal error in master seeder:', error);
      process.exit(1);
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('\n⏹️ Received SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('\n⏹️ Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Run if called directly
main().catch(error => {
  logger.error('💥 Unhandled error in main:', error);
  process.exit(1);
});

// Export the main function for programmatic use
export { runMasterSeeder };
export default runMasterSeeder;