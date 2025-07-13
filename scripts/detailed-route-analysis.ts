#!/usr/bin/env tsx
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { glob } from 'glob';

interface EndpointInfo {
  tier: string;
  resource: string;
  method: string;
  path: string;
  hasAuth: boolean;
  permission?: string;
  tag?: string;
  summary?: string;
}

async function parseRouteFile(filePath: string): Promise<EndpointInfo[]> {
  const content = await readFile(filePath, 'utf-8');
  const endpoints: EndpointInfo[] = [];
  
  // Extract tier and resource from path
  const pathMatch = filePath.match(/routes\/v1\/([^\/]+)\/([^\/]+)/);
  if (!pathMatch) return endpoints;
  
  const [, tier, ...resourceParts] = pathMatch;
  const resource = resourceParts.filter(p => p !== 'index.ts').join('/');
  
  // Find all route definitions
  const routePatterns = [
    // Simple routes: fastify.get('/path', ...)
    /fastify\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g,
    // Route with config: fastify.route({ method: 'GET', url: '/path' })
    /fastify\.route\s*\(\s*\{[^}]*method:\s*['"`]([^'"`]+)['"`][^}]*url:\s*['"`]([^'"`]+)['"`]/g,
  ];
  
  for (const pattern of routePatterns) {
    let match;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const path = match[2];
      
      // Find the route config section
      const routeStart = match.index;
      let braceCount = 0;
      let configStart = -1;
      let configEnd = -1;
      
      for (let i = routeStart; i < content.length; i++) {
        if (content[i] === '{') {
          if (configStart === -1) configStart = i;
          braceCount++;
        } else if (content[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            configEnd = i;
            break;
          }
        }
      }
      
      const routeConfig = configStart > -1 && configEnd > -1 ? 
        content.substring(configStart, configEnd + 1) : '';
      
      // Extract details from route config
      const hasAuth = routeConfig.includes('fastify.authenticate') || 
                     routeConfig.includes('preHandler') && routeConfig.includes('authenticate');
      
      const permissionMatch = routeConfig.match(/requirePermission\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/);
      const permission = permissionMatch ? permissionMatch[1] : undefined;
      
      const tagMatch = routeConfig.match(/tags:\s*\[\s*['"`]([^'"`]+)['"`]/);
      const tag = tagMatch ? tagMatch[1] : undefined;
      
      const summaryMatch = routeConfig.match(/summary:\s*['"`]([^'"`]+)['"`]/);
      const summary = summaryMatch ? summaryMatch[1] : undefined;
      
      endpoints.push({
        tier,
        resource,
        method,
        path,
        hasAuth,
        permission,
        tag,
        summary
      });
    }
  }
  
  return endpoints;
}

async function analyzeAllRoutes() {
  console.log('# Detailed API Route Analysis\n');
  console.log('Generated:', new Date().toISOString(), '\n');
  
  const routesDir = join(process.cwd(), 'apps/api/src/routes/v1');
  const files = await glob('**/*.ts', { cwd: routesDir });
  
  const allEndpoints: EndpointInfo[] = [];
  const tiers = ['public', 'user', 'account', 'tenant', 'platform'];
  
  // Process all route files
  for (const file of files) {
    if (file.includes('index.ts')) {
      const fullPath = join(routesDir, file);
      const endpoints = await parseRouteFile(fullPath);
      allEndpoints.push(...endpoints);
    }
  }
  
  // Group by tier
  console.log('## Endpoint Summary\n');
  console.log('| Tier | Total Endpoints | Authenticated | With Permissions |');
  console.log('|------|-----------------|---------------|------------------|');
  
  for (const tier of tiers) {
    const tierEndpoints = allEndpoints.filter(e => e.tier === tier);
    const authCount = tierEndpoints.filter(e => e.hasAuth).length;
    const permCount = tierEndpoints.filter(e => e.permission).length;
    
    console.log(`| ${tier} | ${tierEndpoints.length} | ${authCount} | ${permCount} |`);
  }
  
  // List key endpoints by tier
  console.log('\n## Key Endpoints by Tier\n');
  
  for (const tier of tiers) {
    const tierEndpoints = allEndpoints.filter(e => e.tier === tier);
    if (tierEndpoints.length === 0) continue;
    
    console.log(`### ${tier.charAt(0).toUpperCase() + tier.slice(1)} Tier\n`);
    console.log('| Method | Path | Resource | Auth | Permission |');
    console.log('|--------|------|----------|------|------------|');
    
    // Show first 10 endpoints per tier
    tierEndpoints.slice(0, 10).forEach(endpoint => {
      const fullPath = `/api/v1/${tier}${endpoint.resource ? '/' + endpoint.resource : ''}${endpoint.path}`;
      const auth = endpoint.hasAuth ? '✅' : '❌';
      const perm = endpoint.permission || '-';
      
      console.log(`| ${endpoint.method} | ${fullPath} | ${endpoint.resource || tier} | ${auth} | ${perm} |`);
    });
    
    if (tierEndpoints.length > 10) {
      console.log(`\n*... and ${tierEndpoints.length - 10} more endpoints*`);
    }
    console.log('');
  }
  
  // Check for duplicate routes
  console.log('## Route Conflicts Check\n');
  
  const routeMap = new Map<string, EndpointInfo[]>();
  for (const endpoint of allEndpoints) {
    const key = `${endpoint.method}:${endpoint.tier}:${endpoint.resource}:${endpoint.path}`;
    if (!routeMap.has(key)) {
      routeMap.set(key, []);
    }
    routeMap.get(key)!.push(endpoint);
  }
  
  const conflicts = Array.from(routeMap.entries()).filter(([, endpoints]) => endpoints.length > 1);
  
  if (conflicts.length > 0) {
    console.log('⚠️ Found potential route conflicts:');
    conflicts.forEach(([key, endpoints]) => {
      console.log(`- ${key} (${endpoints.length} definitions)`);
    });
  } else {
    console.log('✅ No route conflicts detected');
  }
  
  // Permission patterns
  console.log('\n## Permission Patterns\n');
  
  const permissions = allEndpoints
    .filter(e => e.permission)
    .map(e => e.permission!)
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort();
  
  console.log(`Total unique permissions: ${permissions.length}\n`);
  
  // Group permissions by pattern
  const permissionPatterns = {
    read: permissions.filter(p => p.includes('.read')),
    write: permissions.filter(p => p.includes('.write')),
    create: permissions.filter(p => p.includes('.create')),
    update: permissions.filter(p => p.includes('.update')),
    delete: permissions.filter(p => p.includes('.delete')),
    manage: permissions.filter(p => p.includes('.manage')),
    other: permissions.filter(p => 
      !p.includes('.read') && 
      !p.includes('.write') && 
      !p.includes('.create') && 
      !p.includes('.update') && 
      !p.includes('.delete') && 
      !p.includes('.manage')
    )
  };
  
  for (const [action, perms] of Object.entries(permissionPatterns)) {
    if (perms.length > 0) {
      console.log(`### ${action.charAt(0).toUpperCase() + action.slice(1)} Permissions (${perms.length})`);
      perms.slice(0, 5).forEach(p => console.log(`- ${p}`));
      if (perms.length > 5) {
        console.log(`- ... and ${perms.length - 5} more`);
      }
      console.log('');
    }
  }
}

// Run the analysis
analyzeAllRoutes().catch(console.error);