#!/usr/bin/env tsx
/**
 * Script to migrate Next.js API routes to Fastify following 5-tier architecture
 */

import { promises as fs } from 'fs';
import path from 'path';

const PROJECT_ROOT = process.cwd();
const NEXTJS_API = path.join(PROJECT_ROOT, 'src/app/api');
const FASTIFY_API = path.join(PROJECT_ROOT, 'apps/api/src/routes/v1');

// Mapping of Next.js routes to 5-tier structure
const ROUTE_MAPPINGS = {
  // Next.js path -> Fastify tier path
  'admin/queue': 'platform/admin/queue',
  'features': 'platform/features',
  'health/middleware': 'public/health',
  'jobs/[uuid]/apply': 'public/jobs/applications',
  'media': 'user/media',
  'metrics': 'platform/monitoring/metrics',
  'openapi': 'platform/docs/openapi',
  'payments/process': 'account/billing/payments',
  'plans': 'platform/subscriptions/plans',
  'portfolio/media': 'user/portfolio/media',
  'profile/model': 'user/profiles/model',
  'search/models': 'public/search/models',
  'settings/media': 'user/settings/media',
  'subscriptions': 'user/subscriptions',
  'tenants': 'platform/tenants',
  'user/compcard': 'user/profiles/compcard',
  'workflows': 'tenant/workflows',
};

async function createFastifyRoute(nextjsPath: string, fastifyPath: string) {
  const nextjsFile = path.join(NEXTJS_API, nextjsPath, 'route.ts');
  const fastifyDir = path.join(FASTIFY_API, fastifyPath);
  const fastifyFile = path.join(fastifyDir, 'index.ts');
  
  // Create directory
  await fs.mkdir(fastifyDir, { recursive: true });
  
  // Determine tier and resource from path
  const [tier, ...resourceParts] = fastifyPath.split('/');
  const resource = resourceParts.join('.');
  
  // Generate Fastify route template
  const template = `import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/lib/types/uuid';

export const ${resource.replace(/[.-]/g, '')}Routes: FastifyPluginAsync = async (fastify) => {
  // TODO: Migrate logic from Next.js route
  // Original file: ${nextjsPath}/route.ts
  
  fastify.get('/', {
    schema: {
      tags: ['${tier}.${resource}'],
      summary: 'TODO: Add summary',
      description: 'TODO: Add description',
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            // TODO: Define response schema
          })
        })
      }
    },
    ${tier !== 'public' ? `preHandler: [
      fastify.authenticate,
      fastify.requirePermission('${tier}.${resource}.read')
    ],` : ''}
    handler: async (request, reply) => {
      // TODO: Implement handler logic
      return {
        success: true,
        data: {}
      };
    }
  });
};

export default ${resource.replace(/[.-]/g, '')}Routes;
`;

  await fs.writeFile(fastifyFile, template);
  console.log(`✅ Created Fastify route: ${fastifyPath}`);
  
  // Create migration notes
  const notesFile = path.join(fastifyDir, 'MIGRATION_NOTES.md');
  const notes = `# Migration Notes

## Original Next.js Route
- Path: ${nextjsPath}/route.ts
- Migrated to: ${fastifyPath}/index.ts

## Migration Checklist
- [ ] Copy business logic from Next.js route
- [ ] Convert Next.js Request/Response to Fastify
- [ ] Add proper TypeBox schemas
- [ ] Add authentication middleware (if not public)
- [ ] Add permission checks
- [ ] Update response format to standard
- [ ] Add proper error handling
- [ ] Write tests
- [ ] Update API documentation

## Code Conversion Guide

### Next.js to Fastify

\`\`\`typescript
// Next.js
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  // ...
  return Response.json({ data });
}

// Fastify
fastify.get('/', {
  schema: {
    querystring: Type.Object({
      id: Type.String()
    })
  },
  handler: async (request, reply) => {
    const { id } = request.query;
    // ...
    return { success: true, data };
  }
});
\`\`\`
`;

  await fs.writeFile(notesFile, notes);
}

async function generateMigrationReport() {
  const report = `# Next.js to Fastify Migration Report

## Routes to Migrate

${Object.entries(ROUTE_MAPPINGS).map(([nextjs, fastify]) => {
  const [tier] = fastify.split('/');
  return `### ${nextjs}
- **Tier**: ${tier}
- **New Path**: /api/v1/${fastify}
- **Status**: ⏳ Pending
`;
}).join('\n')}

## Migration Steps

1. Run \`pnpm tsx scripts/migrate-nextjs-to-fastify.ts\`
2. For each route:
   - Review the generated Fastify route
   - Copy business logic from Next.js
   - Update to use Fastify patterns
   - Add proper schemas and validation
   - Test thoroughly
3. Update app.ts to register new routes
4. Remove old Next.js routes
5. Update frontend API calls

## Standard Patterns

### Authentication
\`\`\`typescript
preHandler: [
  fastify.authenticate,
  fastify.requirePermission('tier.resource.action')
]
\`\`\`

### Response Format
\`\`\`typescript
// Success
return {
  success: true,
  data: { ... }
};

// Error
return reply.status(400).send({
  success: false,
  error: 'ERROR_CODE',
  message: 'Human readable message'
});
\`\`\`

### UUID Handling
\`\`\`typescript
const uuid = toUUID(request.params.uuid);
\`\`\`
`;

  const reportPath = path.join(PROJECT_ROOT, 'docs/migrations/NEXTJS_TO_FASTIFY_MIGRATION.md');
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, report);
  console.log('📄 Created migration report');
}

async function main() {
  console.log('🚀 Starting Next.js to Fastify migration setup...\n');
  
  // Create Fastify route templates
  for (const [nextjsPath, fastifyPath] of Object.entries(ROUTE_MAPPINGS)) {
    await createFastifyRoute(nextjsPath, fastifyPath);
  }
  
  // Generate migration report
  await generateMigrationReport();
  
  console.log('\n✨ Migration setup complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Review generated routes in apps/api/src/routes/v1/');
  console.log('2. Implement the actual migration for each route');
  console.log('3. See MIGRATION_NOTES.md in each route directory');
  console.log('4. Check docs/migrations/NEXTJS_TO_FASTIFY_MIGRATION.md');
}

main().catch(console.error);