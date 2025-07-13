#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseStatus() {
  console.log('🔍 Checking Database Status...\n');
  
  try {
    // Check Accounts (these handle authentication)
    const accountCount = await prisma.account.count();
    const sampleAccount = await prisma.account.findFirst({
      select: { email: true, uuid: true }
    });
    console.log(`👥 Accounts: ${accountCount} total`);
    if (sampleAccount) {
      console.log(`   Sample: ${sampleAccount.email} (${sampleAccount.uuid})`);
    }
    
    // Check specific test account
    const testAccount = await prisma.account.findUnique({
      where: { email: '1@1.com' },
      select: { 
        email: true, 
        uuid: true, 
        passwordHash: true,
        users: {
          select: {
            username: true,
            userRoles: {
              select: {
                role: {
                  select: { name: true }
                }
              }
            }
          }
        }
      }
    });
    
    if (testAccount) {
      console.log(`   ✅ Test account 1@1.com exists`);
      console.log(`   🔐 Password hash: ${testAccount.passwordHash ? 'Set' : 'Missing'}`);
      console.log(`   👤 Users in account: ${testAccount.users.length}`);
      if (testAccount.users.length > 0) {
        const user = testAccount.users[0];
        console.log(`   🔑 User roles: ${user.userRoles.length}`);
        user.userRoles.forEach(ur => console.log(`     - ${ur.role.name}`));
      }
    } else {
      console.log(`   ❌ Test account 1@1.com NOT FOUND`);
    }
    
    // Check Users (these are profiles within accounts)
    const userCount = await prisma.user.count();
    console.log(`\n👤 Users (profiles): ${userCount} total`);
    
    // Check Tenants
    const tenantCount = await prisma.tenant.count();
    const sampleTenant = await prisma.tenant.findFirst({
      select: { name: true, uuid: true }
    });
    console.log(`\n🏢 Tenants: ${tenantCount} total`);
    if (sampleTenant) {
      console.log(`   Sample: ${sampleTenant.name} (${sampleTenant.uuid})`);
    }
    
    // Check Permissions
    const permissionCount = await prisma.permission.count();
    const adminPermissions = await prisma.permission.findMany({
      where: {
        OR: [
          { name: { contains: 'admin' } },
          { name: { contains: 'platform' } }
        ]
      },
      select: { name: true },
      take: 5
    });
    console.log(`\n🔑 Permissions: ${permissionCount} total`);
    console.log(`   Admin permissions found: ${adminPermissions.length}`);
    adminPermissions.forEach(p => console.log(`     - ${p.name}`));
    
    // Check Categories
    const categoryCount = await prisma.category.count();
    console.log(`\n📂 Categories: ${categoryCount} total`);
    
    // Check Tags  
    const tagCount = await prisma.tag.count();
    console.log(`🏷️  Tags: ${tagCount} total`);
    
    // Summary
    console.log('\n📊 Summary:');
    const hasAccounts = accountCount > 0;
    const hasTestAccount = !!testAccount;
    const hasPermissions = permissionCount > 0;
    const hasBasicData = categoryCount > 0 || tagCount > 0;
    
    console.log(`   ${hasAccounts ? '✅' : '❌'} Accounts: ${accountCount}`);
    console.log(`   ${hasTestAccount ? '✅' : '❌'} Test account (1@1.com)`);
    console.log(`   ${hasPermissions ? '✅' : '❌'} Permissions: ${permissionCount}`);
    console.log(`   ${hasBasicData ? '✅' : '❌'} Basic data (categories/tags)`);
    
    if (!hasAccounts || !hasTestAccount) {
      console.log('\n🔧 Recommendations:');
      console.log('   1. Run: pnpm tsx scripts/create-admin-user.ts');
      console.log('   2. Run: pnpm tsx scripts/comprehensive-seeder.ts');
    }
    
    if (!hasPermissions) {
      console.log('\n⚠️  CRITICAL: No permissions found!');
      console.log('   Run: pnpm tsx scripts/seed-complete-rbac-system.ts');
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseStatus();