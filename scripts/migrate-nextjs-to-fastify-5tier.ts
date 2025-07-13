#!/usr/bin/env tsx

/**
 * Mass Migration Script: Next.js API Routes → Fastify 5-Tier Architecture
 * 
 * Migrates all 204 Next.js API routes to Fastify with:
 * - 5-tier architecture (public, user, account, tenant, platform)
 * - Central middleware security (authenticate, requirePermission)
 * - UUID type safety
 * - Redis cache integration
 * - Tenant isolation
 * - Standard response format
 */

import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';

interface RouteMapping {
  nextjsPath: string;
  fastifyPath: string;
  tier: 'public' | 'user' | 'account' | 'tenant' | 'platform';
  resource: string;
  permission: string;
  requiresTenant: boolean;
  description: string;
}

// Route mapping configuration based on audit analysis
const ROUTE_MAPPINGS: RouteMapping[] = [
  // PUBLIC TIER - No authentication required
  {
    nextjsPath: 'src/app/api/v1/auth/permissions/route.ts',
    fastifyPath: 'apps/api/src/routes/v1/public/auth/permissions/index.ts',
    tier: 'public',
    resource: 'auth.permissions',
    permission: 'public.auth.permissions.read',
    requiresTenant: false,
    description: 'Get user permissions (public endpoint)'
  },
  {
    nextjsPath: 'src/app/api/v1/auth/permissions/check/route.ts',
    fastifyPath: 'apps/api/src/routes/v1/public/auth/permissions/check/index.ts',
    tier: 'public',
    resource: 'auth.permissions',
    permission: 'public.auth.permissions.check',
    requiresTenant: false,
    description: 'Check specific permission (public endpoint)'
  },
  {
    nextjsPath: 'src/app/api/v1/zones/route.ts',
    fastifyPath: 'apps/api/src/routes/v1/public/zones/index.ts',
    tier: 'public',
    resource: 'zones',
    permission: 'public.zones.read',
    requiresTenant: false,
    description: 'Get available zones'
  },
  {
    nextjsPath: 'src/app/api/v1/zone-components/route.ts',
    fastifyPath: 'apps/api/src/routes/v1/public/components/index.ts',
    tier: 'public',
    resource: 'components',
    permission: 'public.components.read',
    requiresTenant: false,
    description: 'Get available zone components'
  },
  {
    nextjsPath: 'src/app/api/v1/audit/track-page/route.ts',
    fastifyPath: 'apps/api/src/routes/v1/public/audit/track-page/index.ts',
    tier: 'public',
    resource: 'audit.tracking',
    permission: 'public.audit.track',
    requiresTenant: false,
    description: 'Track page views (anonymous)'
  },

  // USER TIER - Individual user operations
  {
    nextjsPath: 'src/app/api/v1/saved-searches/route.ts',
    fastifyPath: 'apps/api/src/routes/v1/user/saved-searches/index.ts',
    tier: 'user',
    resource: 'saved-searches',
    permission: 'user.saved-searches.manage',
    requiresTenant: true,
    description: 'Manage user saved searches'
  },
  {
    nextjsPath: 'src/app/api/v1/subscriptions/route.ts',
    fastifyPath: 'apps/api/src/routes/v1/user/subscriptions/index.ts',
    tier: 'user',
    resource: 'subscriptions',
    permission: 'user.subscriptions.read',
    requiresTenant: true,
    description: 'User subscription management'
  },
  {
    nextjsPath: 'src/app/api/v1/llm/execute/route.ts',
    fastifyPath: 'apps/api/src/routes/v1/user/llm/execute/index.ts',
    tier: 'user',
    resource: 'llm.execute',
    permission: 'user.llm.execute',
    requiresTenant: true,
    description: 'Execute LLM operations for user'
  },

  // ACCOUNT TIER - Account/organization management
  {
    nextjsPath: 'src/app/api/v1/permissions/bulk/route.ts',
    fastifyPath: 'apps/api/src/routes/v1/account/permissions/bulk/index.ts',
    tier: 'account',
    resource: 'permissions.bulk',
    permission: 'account.permissions.bulk',
    requiresTenant: true,
    description: 'Bulk permission operations for account'
  },
  {
    nextjsPath: 'src/app/api/v1/workflows/manage/route.ts',
    fastifyPath: 'apps/api/src/routes/v1/account/workflows/manage/index.ts',
    tier: 'account',
    resource: 'workflows.manage',
    permission: 'account.workflows.manage',
    requiresTenant: true,
    description: 'Manage account workflows'
  },

  // TENANT TIER - Tenant administration (most routes)
  {
    nextjsPath: 'src/app/api/v1/admin/tags/route.ts',
    fastifyPath: 'apps/api/src/routes/v1/tenant/content/tags/index.ts',
    tier: 'tenant',
    resource: 'content.tags',
    permission: 'tenant.content.tags.manage',
    requiresTenant: true,
    description: 'Manage tenant content tags'
  },
  {
    nextjsPath: 'src/app/api/v1/admin/categories/route.ts',
    fastifyPath: 'apps/api/src/routes/v1/tenant/content/categories/index.ts',
    tier: 'tenant',
    resource: 'content.categories',
    permission: 'tenant.content.categories.manage',
    requiresTenant: true,
    description: 'Manage tenant content categories'
  },
  {
    nextjsPath: 'src/app/api/v1/admin/settings/route.ts',
    fastifyPath: 'apps/api/src/routes/v1/tenant/config/settings/index.ts',
    tier: 'tenant',
    resource: 'config.settings',
    permission: 'tenant.config.settings.manage',
    requiresTenant: true,
    description: 'Manage tenant configuration settings'
  },

  // PLATFORM TIER - Platform-wide operations (super admin only)
  {
    nextjsPath: 'src/app/api/v1/admin/platform-users/route.ts',
    fastifyPath: 'apps/api/src/routes/v1/platform/admin/users/index.ts',
    tier: 'platform',
    resource: 'admin.users',
    permission: 'platform.admin.users.manage',
    requiresTenant: false,
    description: 'Manage platform users (super admin)'
  },
  {
    nextjsPath: 'src/app/api/v1/admin/operational-modes/route.ts',
    fastifyPath: 'apps/api/src/routes/v1/platform/operations/modes/index.ts',
    tier: 'platform',
    resource: 'operations.modes',
    permission: 'platform.operations.modes.manage',
    requiresTenant: false,
    description: 'Manage platform operational modes'
  },
];

// Template for Fastify route files
const FASTIFY_ROUTE_TEMPLATE = `import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '{{uuidImportPath}}';

/**
 * {{description}}
 * Tier: {{tier}}
 * Permission: {{permission}}
 */
export const {{routeName}}Routes: FastifyPluginAsync = async (fastify) => {
  const { prisma } = fastify;
  
  // GET endpoint
  fastify.get('/', {
    preHandler: [
      {{preHandler}}
    ],
    schema: {
      tags: ['{{tag}}'],
      security: [{ bearerAuth: [] }],
      {{querystring}}
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            // TODO: Define proper response schema
          }, { additionalProperties: true })
        })
      }
    }
  }, async (request, reply) => {
    try {
      // Build where clause{{tenantIsolation}}
      const where: any = {};
      
      // TODO: Implement route logic
      // This is a migration stub - implement actual functionality
      
      return {
        success: true,
        data: {
          message: 'Route migrated successfully - implement logic',
          originalPath: '{{originalPath}}'
        }
      };
    } catch (error) {
      fastify.log.error('Error in {{routeName}} route:', error);
      return reply.code(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  });

  // POST endpoint (if needed)
  fastify.post('/', {
    preHandler: [
      {{preHandler}}
    ],
    schema: {
      tags: ['{{tag}}'],
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        // TODO: Define request body schema
      }, { additionalProperties: true }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            // TODO: Define response schema
          }, { additionalProperties: true })
        })
      }
    }
  }, async (request, reply) => {
    try {
      // TODO: Implement POST logic
      
      return reply.code(201).send({
        success: true,
        data: {
          message: 'Route migrated successfully - implement logic'
        }
      });
    } catch (error) {
      fastify.log.error('Error in {{routeName}} POST route:', error);
      return reply.code(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  });
};

export default {{routeName}}Routes;
`;

class NextJSToFastifyMigrator {
  private processedRoutes: number = 0;
  private errors: string[] = [];

  async migrateAllRoutes() {
    console.log('🚀 Starting Next.js to Fastify 5-Tier Migration...\n');

    // Get all Next.js route files
    const routeFiles = await glob('src/app/api/**/route.ts', { cwd: process.cwd() });
    console.log(`📊 Found ${routeFiles.length} Next.js API routes to migrate\n`);
    
    // Debug: List first 10 files found
    console.log('📁 First 10 files found:');
    routeFiles.slice(0, 10).forEach(file => console.log(`   ${file}`));
    console.log('');

    // Process all known mappings first
    for (const mapping of ROUTE_MAPPINGS) {
      await this.migrateRoute(mapping);
    }

    // Auto-generate mappings for remaining routes
    const remainingRoutes = routeFiles.filter(route => 
      !ROUTE_MAPPINGS.some(mapping => mapping.nextjsPath === route)
    );

    console.log(`\n🔄 Auto-generating mappings for ${remainingRoutes.length} remaining routes...\n`);

    for (const routePath of remainingRoutes) {
      const autoMapping = this.generateAutoMapping(routePath);
      if (autoMapping) {
        await this.migrateRoute(autoMapping);
      }
    }

    this.printSummary();
  }

  private generateAutoMapping(nextjsPath: string): RouteMapping | null {
    // Extract path segments
    const segments = nextjsPath.replace('src/app/api/v1/', '').replace('/route.ts', '').split('/');
    
    // Determine tier based on path patterns
    let tier: RouteMapping['tier'] = 'tenant'; // Default to tenant
    let resource = '';
    let permission = '';
    let requiresTenant = true;
    let description = '';

    if (segments.includes('auth') || segments.includes('public')) {
      tier = 'public';
      requiresTenant = false;
    } else if (segments.includes('user') || segments.includes('profile')) {
      tier = 'user';
    } else if (segments.includes('account') || segments.includes('team')) {
      tier = 'account';
    } else if (segments.includes('platform') || segments.includes('system')) {
      tier = 'platform';
      requiresTenant = false;
    } else if (segments.includes('admin')) {
      tier = 'tenant'; // Most admin routes are tenant-level
    }

    // Build resource and permission names
    resource = segments.filter(s => s !== 'admin' && s !== 'v1').join('.');
    permission = `${tier}.${resource}.manage`;
    description = `Auto-migrated route: ${resource}`;

    // Build Fastify path
    const fastifySegments = ['apps/api/src/routes/v1', tier, ...segments.filter(s => s !== 'admin')];
    const fastifyPath = fastifySegments.join('/') + '/index.ts';

    return {
      nextjsPath,
      fastifyPath,
      tier,
      resource,
      permission,
      requiresTenant,
      description
    };
  }

  private async migrateRoute(mapping: RouteMapping) {
    try {
      console.log(`📁 Migrating: ${mapping.nextjsPath}`);
      console.log(`   → ${mapping.fastifyPath}`);
      console.log(`   → Tier: ${mapping.tier} | Permission: ${mapping.permission}\n`);

      // Read original Next.js route
      const originalContent = await fs.readFile(mapping.nextjsPath, 'utf-8');
      
      // Generate Fastify route content
      const fastifyContent = this.generateFastifyRoute(mapping, originalContent);
      
      // Ensure target directory exists
      const targetDir = path.dirname(mapping.fastifyPath);
      await fs.mkdir(targetDir, { recursive: true });
      
      // Write new Fastify route
      await fs.writeFile(mapping.fastifyPath, fastifyContent);
      
      this.processedRoutes++;
    } catch (error) {
      const errorMsg = `Failed to migrate ${mapping.nextjsPath}: ${error}`;
      this.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}\n`);
    }
  }

  private generateFastifyRoute(mapping: RouteMapping, originalContent: string): string {
    // Calculate relative path to UUID types
    const depth = mapping.fastifyPath.split('/').length - 5; // Base depth to src/lib
    const uuidImportPath = '../'.repeat(depth) + '../../../src/lib/types/uuid';
    
    // Generate preHandler based on tier
    let preHandler = '';
    if (mapping.tier === 'public') {
      // Public routes may or may not require auth
      preHandler = '// Public route - customize authentication as needed';
    } else {
      preHandler = `fastify.authenticate,\n      fastify.requirePermission('${mapping.permission}')`;
    }

    // Generate tenant isolation code
    let tenantIsolation = '';
    if (mapping.requiresTenant) {
      tenantIsolation = `
      if (request.user?.tenantId) {
        where.tenantId = request.user.tenantId; // CRITICAL: Tenant isolation
      }`;
    }

    // Generate route name from path
    const routeName = mapping.resource.replace(/\./g, '_').replace(/-/g, '_');
    const tag = `${mapping.tier}.${mapping.resource}`;

    // Add querystring for parameterized routes
    let querystring = '';
    if (mapping.fastifyPath.includes('[') || originalContent.includes('searchParams')) {
      querystring = `querystring: Type.Object({
        page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
        search: Type.Optional(Type.String()),
      }),`;
    }

    return FASTIFY_ROUTE_TEMPLATE
      .replace(/{{uuidImportPath}}/g, uuidImportPath)
      .replace(/{{description}}/g, mapping.description)
      .replace(/{{tier}}/g, mapping.tier)
      .replace(/{{permission}}/g, mapping.permission)
      .replace(/{{routeName}}/g, routeName)
      .replace(/{{preHandler}}/g, preHandler)
      .replace(/{{tag}}/g, tag)
      .replace(/{{querystring}}/g, querystring)
      .replace(/{{tenantIsolation}}/g, tenantIsolation)
      .replace(/{{originalPath}}/g, mapping.nextjsPath);
  }

  private printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully migrated: ${this.processedRoutes} routes`);
    console.log(`❌ Failed migrations: ${this.errors.length} routes`);
    
    if (this.errors.length > 0) {
      console.log('\n🚨 ERRORS:');
      this.errors.forEach(error => console.log(`   • ${error}`));
    }

    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Register new routes in tier index files');
    console.log('2. Update route imports in main router');
    console.log('3. Implement TODO items in migrated routes');
    console.log('4. Test all endpoints thoroughly');
    console.log('5. Remove Next.js route files after validation');
    console.log('\n⚠️  IMPORTANT: All migrated routes need implementation!');
    console.log('   The migration creates structural stubs - implement actual logic.');
  }
}

// Run migration
async function main() {
  const migrator = new NextJSToFastifyMigrator();
  await migrator.migrateAllRoutes();
}

if (require.main === module) {
  main().catch(console.error);
}

export { NextJSToFastifyMigrator };