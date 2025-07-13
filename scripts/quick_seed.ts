import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Quick seeding for authentication test...');

  // Create tenant
  const tenant = await prisma.tenant.upsert({
    where: { domain: 'platform.local' },
    update: {},
    create: {
      name: 'itellico Mono',
      domain: 'platform.local',
      slug: 'mono-platform',
      description: { desc: 'Main platform tenant' },
      isActive: true
    }
  });

  // Create super admin role
  const role = await prisma.role.upsert({
    where: { code: 'super_admin' },
    update: {},
    create: {
      name: 'super_admin',
      code: 'super_admin',
      description: 'Super Administrator',
      level: 100,
      tenantid: tenant.id,
      issystem: true
    }
  });

  // Create permissions (just a few key ones)
  const permissions = [
    { name: 'admin.full_access', pattern: 'admin.*', description: 'Full admin access' },
    { name: 'admin.manage', pattern: 'admin.manage', description: 'Admin management' },
    { name: 'tenant.manage', pattern: 'tenant.manage', description: 'Tenant management' },
    { name: 'users.manage', pattern: 'users.manage', description: 'User management' }
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm
    });
  }

  // Link role to all permissions
  const allPerms = await prisma.permission.findMany();
  for (const perm of allPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
      update: {},
      create: { roleId: role.id, permissionId: perm.id }
    });
  }

  // Create account with correct password
  const passwordHash = await bcrypt.hash('123', 12);
  const account = await prisma.account.upsert({
    where: { email: '1@1.com' },
    update: { passwordHash },
    create: {
      tenantId: tenant.id,
      email: '1@1.com',
      passwordHash,
      accountType: 'business',
      emailVerified: true
    }
  });

  // Create user
  const user = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      accountId: account.id,
      firstName: 'Super',
      lastName: 'Admin',
      username: 'superadmin',
      userType: 'business',
      userHash: 'superadmin-hash',
      isActive: true,
      isVerified: true
    }
  });

  // Assign role to user
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: {
      userId: user.id,
      roleId: role.id,
      grantReason: 'Initial super admin setup'
    }
  });

  console.log('✅ Quick seed completed!');
  console.log(`   Account: ${account.email}`);
  console.log(`   User: ${user.firstName} ${user.lastName} (${user.username})`);
  console.log(`   Role: ${role.name} with ${allPerms.length} permissions`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });