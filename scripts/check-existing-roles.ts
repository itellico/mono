import { db as prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

async function checkExistingRoles() {
  try {
    // Check all roles
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        users: true
      }
    });

    logger.info(`\n📋 Total roles in system: ${roles.length}`);
    
    for (const role of roles) {
      logger.info(`\n🎭 Role: ${role.name}`);
      logger.info(`   Description: ${role.description || 'N/A'}`);
      logger.info(`   Permissions: ${role.permissions.length}`);
      logger.info(`   Users assigned: ${role.users.length}`);
    }

    // Check users for 1@1.com
    const account = await prisma.account.findFirst({
      where: { email: '1@1.com' },
      include: {
        users: {
          include: {
            userRoles: {
              include: {
                role: true
              }
            }
          }
        }
      }
    });

    if (account) {
      logger.info(`\n👤 Account 1@1.com:`);
      for (const user of account.users) {
        logger.info(`   User: ${user.firstName} ${user.lastName}`);
        logger.info(`   Roles: ${user.userRoles.map(ur => ur.role.name).join(', ') || 'None'}`);
      }
    }

    // Check all permissions
    const permissions = await prisma.permission.findMany({
      orderBy: { name: 'asc' }
    });

    logger.info(`\n🔑 Total permissions in system: ${permissions.length}`);
    
  } catch (error) {
    logger.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExistingRoles();