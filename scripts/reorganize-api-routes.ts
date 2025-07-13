#!/usr/bin/env tsx
/**
 * Script to reorganize API routes to follow 5-tier architecture
 * This will move routes to their proper tier locations
 */

import { promises as fs } from 'fs';
import path from 'path';

const API_BASE = path.join(process.cwd(), 'apps/api/src/routes/v1');

// Route mapping: current location -> new location
const ROUTE_MIGRATIONS = {
  // Admin routes -> Platform tier
  'admin': 'platform/admin',
  
  // System-wide features -> Platform tier
  'audit': 'platform/audit',
  'monitoring': 'platform/monitoring',
  'integrations': 'platform/integrations',
  'webhooks': 'platform/webhooks',
  'llm': 'platform/ai',
  
  // Tenant-level management
  'categories': 'tenant/content/categories',
  'tags': 'tenant/content/tags',
  'templates': 'tenant/content/templates',
  'model-schemas': 'tenant/data/schemas',
  'option-sets': 'tenant/data/option-sets',
  'workflows': 'tenant/workflows',
  'forms': 'tenant/forms',
  'media': 'tenant/media',
  
  // User-specific features
  'saved-searches': 'user/saved-searches',
  'notifications': 'user/notifications',
  'subscriptions': 'user/subscriptions',
  
  // Account-level features
  'changes': 'account/changes',
  'invitations': 'account/invitations',
  
  // Public features
  'emails': 'public/contact',
};

async function ensureDirectory(dirPath: string) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error(`Failed to create directory ${dirPath}:`, error);
  }
}

async function moveRoute(from: string, to: string) {
  const fromPath = path.join(API_BASE, from);
  const toPath = path.join(API_BASE, to);
  
  try {
    // Check if source exists
    const stats = await fs.stat(fromPath);
    if (!stats.isDirectory()) {
      console.log(`Skipping non-directory: ${from}`);
      return;
    }
    
    // Ensure target directory exists
    await ensureDirectory(path.dirname(toPath));
    
    // Move the directory
    await fs.rename(fromPath, toPath);
    console.log(`✅ Moved: ${from} -> ${to}`);
    
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log(`⏭️  Skipped (not found): ${from}`);
    } else {
      console.error(`❌ Failed to move ${from} -> ${to}:`, error.message);
    }
  }
}

async function updateRouteImports() {
  console.log('\n📝 Updating route imports...');
  
  // Update main router file
  const routerPath = path.join(API_BASE, 'index.ts');
  try {
    let routerContent = await fs.readFile(routerPath, 'utf-8');
    
    // Update import paths
    Object.entries(ROUTE_MIGRATIONS).forEach(([from, to]) => {
      const fromImport = `./${from}`;
      const toImport = `./${to}`;
      routerContent = routerContent.replace(
        new RegExp(`from '${fromImport}'`, 'g'),
        `from '${toImport}'`
      );
    });
    
    await fs.writeFile(routerPath, routerContent);
    console.log('✅ Updated route imports');
  } catch (error) {
    console.error('❌ Failed to update route imports:', error);
  }
}

async function createTierIndexFiles() {
  console.log('\n📁 Creating tier index files...');
  
  const tiers = ['public', 'user', 'account', 'tenant', 'platform'];
  
  for (const tier of tiers) {
    const indexPath = path.join(API_BASE, tier, 'index.ts');
    const indexContent = `import type { FastifyPluginAsync } from 'fastify';

export const ${tier}Routes: FastifyPluginAsync = async (fastify) => {
  // Register all ${tier} tier routes here
  fastify.log.info('Registering ${tier} tier routes');
  
  // Auto-register all subdirectory routes
  // This will be populated by the build process
};

export default ${tier}Routes;
`;
    
    try {
      await ensureDirectory(path.join(API_BASE, tier));
      await fs.writeFile(indexPath, indexContent);
      console.log(`✅ Created ${tier}/index.ts`);
    } catch (error) {
      console.error(`❌ Failed to create ${tier}/index.ts:`, error);
    }
  }
}

async function generateRouteMap() {
  console.log('\n🗺️  Generating route map...');
  
  const routeMap: Record<string, string[]> = {
    public: [],
    user: [],
    account: [],
    tenant: [],
    platform: []
  };
  
  // Scan each tier directory
  for (const tier of Object.keys(routeMap)) {
    const tierPath = path.join(API_BASE, tier);
    try {
      const routes = await scanDirectory(tierPath, '');
      routeMap[tier] = routes;
    } catch (error) {
      console.log(`No routes found in ${tier} tier yet`);
    }
  }
  
  // Write route map
  const mapPath = path.join(API_BASE, 'route-map.json');
  await fs.writeFile(mapPath, JSON.stringify(routeMap, null, 2));
  console.log('✅ Generated route map');
}

async function scanDirectory(dir: string, prefix: string): Promise<string[]> {
  const routes: string[] = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subRoutes = await scanDirectory(
          path.join(dir, entry.name),
          prefix ? `${prefix}/${entry.name}` : entry.name
        );
        routes.push(...subRoutes);
      } else if (entry.name === 'index.ts') {
        routes.push(prefix || '/');
      }
    }
  } catch (error) {
    // Directory doesn't exist yet
  }
  
  return routes;
}

async function main() {
  console.log('🚀 Starting API route reorganization...\n');
  
  // Step 1: Move routes to proper tiers
  console.log('📦 Moving routes to proper tiers...');
  for (const [from, to] of Object.entries(ROUTE_MIGRATIONS)) {
    await moveRoute(from, to);
  }
  
  // Step 2: Create tier index files
  await createTierIndexFiles();
  
  // Step 3: Update imports
  await updateRouteImports();
  
  // Step 4: Generate route map
  await generateRouteMap();
  
  console.log('\n✨ Route reorganization complete!');
  console.log('\n⚠️  Next steps:');
  console.log('1. Update route registrations in apps/api/src/app.ts');
  console.log('2. Update all permission strings to match new structure');
  console.log('3. Run tests to ensure routes are working');
  console.log('4. Update API documentation');
}

// Run the migration
main().catch(console.error);