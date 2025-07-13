#!/usr/bin/env tsx
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { glob } from 'glob';

interface RouteInfo {
  tier: string;
  resource: string;
  path: string;
  methods: string[];
  tags: string[];
  hasAuth: boolean;
  hasPermissions: boolean;
  description?: string;
}

async function extractRouteInfo(filePath: string): Promise<RouteInfo[]> {
  const content = await readFile(filePath, 'utf-8');
  const routes: RouteInfo[] = [];
  
  // Extract tier and resource from path
  const pathMatch = filePath.match(/routes\/v1\/([^\/]+)\/([^\/]+)/);
  if (!pathMatch) return routes;
  
  const [, tier, resource] = pathMatch;
  
  // Find route definitions with regex
  const routeRegex = /fastify\.(get|post|put|patch|delete|route)\s*\(\s*['"`]([^'"`]+)['"`]|fastify\.route\s*\(\s*{[^}]*method:\s*\[?([^\]]+)\]?[^}]*url:\s*['"`]([^'"`]+)['"`]/gm;
  const tagRegex = /tags:\s*\[([^\]]+)\]/g;
  const preHandlerRegex = /preHandler:\s*\[([^\]]+)\]/g;
  
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    let method = '';
    let path = '';
    
    if (match[1] && match[2]) {
      // Simple route definition
      method = match[1].toUpperCase();
      path = match[2];
    } else if (match[3] && match[4]) {
      // Route object definition
      method = match[3].replace(/['"` ]/g, '').toUpperCase();
      path = match[4];
    }
    
    if (!method || !path) continue;
    
    // Extract tags
    const tags: string[] = [];
    const tagMatch = tagRegex.exec(content);
    if (tagMatch) {
      const tagContent = tagMatch[1];
      tags.push(...tagContent.match(/['"`]([^'"`]+)['"`]/g)?.map(t => t.replace(/['"`]/g, '')) || []);
    }
    
    // Check for authentication
    const hasAuth = content.includes('fastify.authenticate') || content.includes('preHandler') && content.includes('authenticate');
    const hasPermissions = content.includes('requirePermission') || content.includes('checkPermission');
    
    routes.push({
      tier,
      resource,
      path: filePath,
      methods: [method],
      tags,
      hasAuth,
      hasPermissions,
      description: resource.replace(/-/g, ' ')
    });
  }
  
  return routes;
}

async function auditApiRoutes() {
  console.log('# itellico Mono API Routes Audit Report\n');
  console.log('Generated:', new Date().toISOString(), '\n');
  
  const routesDir = join(process.cwd(), 'apps/api/src/routes/v1');
  const files = await glob('**/*.ts', { cwd: routesDir });
  
  const tiers = {
    public: { routes: [] as RouteInfo[], count: 0 },
    user: { routes: [] as RouteInfo[], count: 0 },
    account: { routes: [] as RouteInfo[], count: 0 },
    tenant: { routes: [] as RouteInfo[], count: 0 },
    platform: { routes: [] as RouteInfo[], count: 0 }
  };
  
  // Process all route files
  for (const file of files) {
    if (file.includes('index.ts')) {
      const fullPath = join(routesDir, file);
      const routes = await extractRouteInfo(fullPath);
      
      for (const route of routes) {
        if (tiers[route.tier as keyof typeof tiers]) {
          tiers[route.tier as keyof typeof tiers].routes.push(route);
          tiers[route.tier as keyof typeof tiers].count++;
        }
      }
    }
  }
  
  // Generate summary
  console.log('## Summary\n');
  console.log('| Tier | Resources | Routes | Auth Required | Permissions |');
  console.log('|------|-----------|--------|---------------|-------------|');
  
  const tierOrder = ['public', 'user', 'account', 'tenant', 'platform'] as const;
  for (const tier of tierOrder) {
    const data = tiers[tier];
    const resources = new Set(data.routes.map(r => r.resource)).size;
    const authRoutes = data.routes.filter(r => r.hasAuth).length;
    const permRoutes = data.routes.filter(r => r.hasPermissions).length;
    
    console.log(`| ${tier} | ${resources} | ${data.count} | ${authRoutes} | ${permRoutes} |`);
  }
  
  // List resources by tier
  console.log('\n## Resources by Tier\n');
  
  for (const tier of tierOrder) {
    const data = tiers[tier];
    const resources = [...new Set(data.routes.map(r => r.resource))].sort();
    
    console.log(`### ${tier.charAt(0).toUpperCase() + tier.slice(1)} Tier (${resources.length} resources)\n`);
    
    if (resources.length > 0) {
      console.log('| Resource | Path | Status |');
      console.log('|----------|------|--------|');
      
      // Check actual directories
      for (const resource of resources) {
        const resourcePath = join(routesDir, tier, resource);
        try {
          const files = await readdir(resourcePath);
          const hasIndex = files.includes('index.ts');
          const status = hasIndex ? '✅ Implemented' : '⚠️ Partial';
          console.log(`| ${resource} | /api/v1/${tier}/${resource} | ${status} |`);
        } catch {
          console.log(`| ${resource} | /api/v1/${tier}/${resource} | ❌ Not Found |`);
        }
      }
    } else {
      console.log('*No resources found*');
    }
    console.log('');
  }
  
  // List all unique tags
  console.log('## API Tags\n');
  console.log('| Tag | Tier | Resource | Display Name |');
  console.log('|-----|------|----------|--------------|');
  
  const allTags = new Set<string>();
  for (const tier of tierOrder) {
    tiers[tier].routes.forEach(r => r.tags.forEach(t => allTags.add(t)));
  }
  
  const sortedTags = [...allTags].sort();
  for (const tag of sortedTags) {
    const [tierPart, resourcePart] = tag.split('.');
    const displayName = resourcePart ? 
      resourcePart.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') :
      tierPart;
    console.log(`| ${tag} | ${tierPart} | ${resourcePart || '-'} | ${displayName} |`);
  }
  
  // Implementation checklist
  console.log('\n## Implementation Status\n');
  
  const expectedResources = {
    public: ['auth', 'health', 'contact', 'marketplace', 'audit'],
    user: ['profile', 'settings', 'content', 'media', 'marketplace', 'messaging', 'activity', 'search', 'notifications'],
    account: ['users', 'business', 'billing', 'configuration', 'analytics', 'permissions', 'workflows'],
    tenant: ['administration', 'workflows', 'monitoring', 'data', 'content', 'users', 'permissions', 'tags', 'categories', 'audit'],
    platform: ['admin', 'audit', 'ai', 'system', 'operations', 'documentation', 'monitoring']
  };
  
  for (const [tier, expected] of Object.entries(expectedResources)) {
    console.log(`### ${tier.charAt(0).toUpperCase() + tier.slice(1)} Tier\n`);
    
    const implemented = new Set(tiers[tier as keyof typeof tiers].routes.map(r => r.resource));
    
    for (const resource of expected) {
      const status = implemented.has(resource) ? '✅' : '❌';
      console.log(`- [${status}] ${resource}`);
    }
    console.log('');
  }
}

// Run the audit
auditApiRoutes().catch(console.error);