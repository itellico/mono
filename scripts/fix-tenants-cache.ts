#!/usr/bin/env npx tsx

/**
 * 🔧 Fix Tenants Service Cache Script
 * 
 * Updates the tenants service to use the unified cache middleware
 * instead of the old individual TenantsCache approach.
 */

import fs from 'fs';
import path from 'path';

const TENANTS_SERVICE_PATH = path.join(process.cwd(), 'src/lib/services/tenants.service.ts');

function fixTenantsServiceCache() {
  console.log('🔧 Fixing tenants service cache implementation...');

  try {
    let content = fs.readFileSync(TENANTS_SERVICE_PATH, 'utf8');

    // Replace all tenantsCache calls with unified cache middleware calls
    const replacements = [
      // Fix cache get for tenant list
      {
        from: /await tenantsCache\.getTenantList\(params\)/g,
        to: 'await cache.get<GetTenantsResponse>(`cache:global:tenants:list:${this.createCacheKey(params)}`)'
      },
      // Fix cache set for tenant list  
      {
        from: /await tenantsCache\.setTenantList\(params, result\)/g,
        to: 'await cache.set(`cache:global:tenants:list:${this.createCacheKey(params)}`, result, { ttl: 5 * 60, tags: [\'tenants\', \'tenants-list\'] })'
      },
      // Fix cache get for individual tenant
      {
        from: /await tenantsCache\.getTenant\(uuid\)/g,
        to: 'await cache.get<TenantListItem>(`cache:global:tenants:id:${uuid}`)'
      },
      // Fix cache set for individual tenant
      {
        from: /await tenantsCache\.setTenant\(tenantListItem\)/g,
        to: 'await cache.set(`cache:global:tenants:id:${tenantListItem.uuid}`, tenantListItem, { ttl: 5 * 60, tags: [\'tenants\', `tenant:${tenantListItem.uuid}`] })'
      },
      // Fix cache get for tenant stats
      {
        from: /await tenantsCache\.getTenantStats\(\)/g,
        to: 'await cache.get<TenantStats>(\'cache:global:tenants:stats\')'
      },
      // Fix cache set for tenant stats
      {
        from: /await tenantsCache\.setTenantStats\(stats\)/g,
        to: 'await cache.set(\'cache:global:tenants:stats\', stats, { ttl: 10 * 60, tags: [\'tenants\', \'tenant-stats\'] })'
      },
      // Fix cache invalidation calls
      {
        from: /await tenantsCache\.invalidateAll\(\)/g,
        to: 'await cache.invalidateByTag(\'tenants\')'
      },
      {
        from: /await tenantsCache\.invalidateTenant\(tenantUuid\)/g,
        to: 'await cache.invalidateByTag(`tenant:${tenantUuid}`)'
      }
    ];

    // Apply all replacements
    for (const replacement of replacements) {
      content = content.replace(replacement.from, replacement.to);
    }

    // Add the createCacheKey method if it doesn't exist
    if (!content.includes('createCacheKey')) {
      const methodToAdd = `
  /**
   * Create cache key from parameters
   */
  private createCacheKey(params: GetTenantsParams): string {
    const keyParts: string[] = [];
    
    if (params.page) keyParts.push(\`page:\${params.page}\`);
    if (params.limit) keyParts.push(\`limit:\${params.limit}\`);
    if (params.search) keyParts.push(\`search:\${params.search}\`);
    if (params.status) keyParts.push(\`status:\${params.status}\`);
    if (params.currency) keyParts.push(\`currency:\${params.currency}\`);
    if (params.userCountRange) keyParts.push(\`userCountRange:\${params.userCountRange}\`);
    
    return keyParts.join(':') || 'default';
  }
`;

      // Insert before the last closing brace
      const lastBraceIndex = content.lastIndexOf('}');
      content = content.slice(0, lastBraceIndex) + methodToAdd + content.slice(lastBraceIndex);
    }

    // Update comments to reflect unified cache middleware
    content = content.replace(
      /Uses template cache patterns \(TenantsCache\)/g,
      'Uses unified cache middleware'
    );
    content = content.replace(
      /LAYER 2: Redis via TenantsCache/g,
      'LAYER 2: Redis via unified cache middleware'
    );

    // Write the updated content
    fs.writeFileSync(TENANTS_SERVICE_PATH, content, 'utf8');

    console.log('✅ Tenants service cache implementation fixed successfully!');
    console.log('📝 Updated to use unified cache middleware pattern');

  } catch (error) {
    console.error('❌ Failed to fix tenants service cache:', error);
    process.exit(1);
  }
}

// Run the fix
fixTenantsServiceCache(); 