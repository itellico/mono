#!/usr/bin/env npx tsx

/**
 * Redis Tenant Key Migration Script
 * 
 * Migrates existing tenant Redis keys from numeric IDs to UUIDs for security and consistency.
 * 
 * Before: tenant:1:user:uuid:sessions
 * After:  tenant:550e8400-e29b-41d4-a716-446655440000:user:uuid:sessions
 */

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { config } from 'dotenv';

// Load environment variables
config();

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface TenantMapping {
  id: number;
  uuid: string;
}

async function main() {
  console.log('🔄 Starting Redis tenant key migration to UUIDs...');
  
  try {
    // 1. Get all tenant ID -> UUID mappings
    console.log('📊 Fetching tenant mappings...');
    const tenants = await prisma.tenant.findMany({
      select: { id: true, uuid: true }
    });
    
    const tenantMap = new Map<number, string>();
    tenants.forEach(tenant => {
      tenantMap.set(tenant.id, tenant.uuid);
    });
    
    console.log(`✅ Found ${tenants.length} tenants`);
    
    // 2. Find all Redis keys with numeric tenant IDs
    console.log('🔍 Scanning Redis for tenant keys with numeric IDs...');
    const allKeys = await redis.keys('tenant:*');
    
    const numericTenantKeys = allKeys.filter(key => {
      const parts = key.split(':');
      if (parts.length < 2 || parts[0] !== 'tenant') return false;
      
      // Check if second part is numeric (tenant ID)
      const tenantPart = parts[1];
      return /^\d+$/.test(tenantPart);
    });
    
    console.log(`📋 Found ${numericTenantKeys.length} keys with numeric tenant IDs`);
    
    if (numericTenantKeys.length === 0) {
      console.log('✅ No keys to migrate - all tenant keys already use UUIDs');
      return;
    }
    
    // 3. Group keys by tenant ID for efficient migration
    const keysByTenant = new Map<number, string[]>();
    
    for (const key of numericTenantKeys) {
      const tenantId = parseInt(key.split(':')[1]);
      if (!keysByTenant.has(tenantId)) {
        keysByTenant.set(tenantId, []);
      }
      keysByTenant.get(tenantId)!.push(key);
    }
    
    console.log(`📊 Keys grouped by ${keysByTenant.size} tenant(s)`);
    
    // 4. Migrate each tenant's keys
    let totalMigrated = 0;
    let totalErrors = 0;
    
    for (const [tenantId, keys] of keysByTenant) {
      const tenantUuid = tenantMap.get(tenantId);
      
      if (!tenantUuid) {
        console.log(`❌ No UUID found for tenant ID ${tenantId}, skipping ${keys.length} keys`);
        totalErrors += keys.length;
        continue;
      }
      
      console.log(`🔄 Migrating ${keys.length} keys for tenant ${tenantId} -> ${tenantUuid}`);
      
      for (const oldKey of keys) {
        try {
          // Generate new key with UUID
          const newKey = oldKey.replace(`tenant:${tenantId}:`, `tenant:${tenantUuid}:`);
          
          // Get the data from old key
          const keyType = await redis.type(oldKey);
          
          if (keyType === 'string') {
            const value = await redis.get(oldKey);
            const ttl = await redis.ttl(oldKey);
            
            if (value !== null) {
              if (ttl > 0) {
                await redis.setex(newKey, ttl, value);
              } else {
                await redis.set(newKey, value);
              }
            }
          } else if (keyType === 'set') {
            const members = await redis.smembers(oldKey);
            const ttl = await redis.ttl(oldKey);
            
            if (members.length > 0) {
              await redis.sadd(newKey, ...members);
              if (ttl > 0) {
                await redis.expire(newKey, ttl);
              }
            }
          } else if (keyType === 'hash') {
            const hash = await redis.hgetall(oldKey);
            const ttl = await redis.ttl(oldKey);
            
            if (Object.keys(hash).length > 0) {
              await redis.hmset(newKey, hash);
              if (ttl > 0) {
                await redis.expire(newKey, ttl);
              }
            }
          } else {
            console.log(`⚠️  Skipping key ${oldKey} with unsupported type: ${keyType}`);
            continue;
          }
          
          // Delete old key after successful migration
          await redis.del(oldKey);
          totalMigrated++;
          
          console.log(`  ✅ ${oldKey} -> ${newKey}`);
          
        } catch (error) {
          console.log(`  ❌ Failed to migrate ${oldKey}:`, error);
          totalErrors++;
        }
      }
    }
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`✅ Successfully migrated: ${totalMigrated} keys`);
    console.log(`❌ Errors: ${totalErrors} keys`);
    
    if (totalErrors === 0) {
      console.log(`🎉 All tenant keys successfully migrated to UUID format!`);
    } else {
      console.log(`⚠️  Migration completed with ${totalErrors} errors`);
    }
    
    // 5. Verify final state
    console.log('\n🔍 Verifying final Redis key state...');
    const finalKeys = await redis.keys('tenant:*');
    const stillNumeric = finalKeys.filter(key => {
      const parts = key.split(':');
      return parts.length >= 2 && /^\d+$/.test(parts[1]);
    });
    
    if (stillNumeric.length === 0) {
      console.log('✅ All tenant keys now use UUIDs');
    } else {
      console.log(`⚠️  ${stillNumeric.length} keys still using numeric tenant IDs:`);
      stillNumeric.forEach(key => console.log(`  - ${key}`));
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await redis.quit();
  }
}

// Run the migration
main().catch(console.error);