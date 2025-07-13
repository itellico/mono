#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking database...');
  
  // Check tenants
  const tenants = await prisma.tenant.findMany({
    select: { id: true, uuid: true, domain: true, name: true, is_active: true }
  });
  console.log('\n📦 Tenants:', tenants);
  
  // Check accounts
  const accounts = await prisma.account.findMany({
    where: { email: '1@1.com' },
    select: { 
      id: true, 
      uuid: true, 
      email: true, 
      tenant_id: true,
      is_active: true,
      email_verified: true,
      password_hash: true,
      users: {
        select: {
          id: true,
          uuid: true,
          username: true,
          is_active: true
        }
      }
    }
  });
  console.log('\n👤 Accounts for 1@1.com:', accounts);
  
  // Check roles
  const roles = await prisma.role.findMany({
    where: { 
      OR: [
        { code: 'platform_super_admin' },
        { code: 'super_admin' }
      ]
    },
    select: {
      id: true,
      name: true,
      code: true,
      is_system: true
    }
  });
  console.log('\n🏷️  Roles:', roles);
  
  await prisma.$disconnect();
}

main().catch(console.error);