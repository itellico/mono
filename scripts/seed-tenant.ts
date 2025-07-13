import { tenantSetupService } from '@/lib/services/tenant-setup.service';
import { logger } from '@/lib/logger';

async function seedTenant() {
  try {
    logger.info('Starting tenant seeding process...');

    const result = await tenantSetupService.createTenant({
      name: 'Test Tenant',
      slug: 'test-tenant',
      adminUser: {
        firstName: 'Test',
        lastName: 'Admin',
        email: 'test.admin@testtenant.com',
      },
    });

    logger.info('Tenant seeding completed successfully:', result);
    process.exit(0);
  } catch (error) {
    logger.error('Tenant seeding failed:', error);
    process.exit(1);
  }
}

seedTenant();
