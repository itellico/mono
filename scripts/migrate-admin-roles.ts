#!/usr/bin/env tsx

/**
 * Migration Script: AdminRole to Role/Permission System
 * 
 * This script migrates data from the legacy AdminRole table to the 
 * unified Role/Permission system before removing the AdminRole table.
 * 
 * Steps:
 * 1. Create admin permissions for all AdminRole boolean flags
 * 2. Create admin roles for all AdminRole types
 * 3. Assign permissions to roles based on typical admin workflows
 * 4. Migrate existing AdminRole records to UserRole assignments
 * 5. Verify migration success
 */

import { PrismaClient } from '@prisma/client'
import { logger } from '@/lib/logger'

const prisma = new PrismaClient()

interface AdminRoleData {
  userId: bigint
  tenantId: number
  roleType: string
  canApproveModels: boolean
  canReviewPictures: boolean
  canManageUsers: boolean
  canAccessAnalytics: boolean
  canManageContent: boolean
  canImpersonateUsers: boolean
  isActive: boolean
}

// Admin permission definitions
const ADMIN_PERMISSIONS = [
  { name: 'models.approve', description: 'Approve model applications and profiles' },
  { name: 'pictures.review', description: 'Review and moderate user pictures' },
  { name: 'users.manage', description: 'Manage user accounts and profiles' },
  { name: 'analytics.access', description: 'Access platform analytics and reports' },
  { name: 'content.manage', description: 'Manage platform content and settings' },
  { name: 'users.impersonate', description: 'Impersonate other users for support' },
  { name: 'admin.full_access', description: 'Full administrative access' },
  { name: 'tenant.manage', description: 'Manage tenant settings and configuration' }
] as const

// Admin role definitions with their permissions
const ADMIN_ROLES = {
  super_admin: {
    name: 'super_admin',
    description: 'Super Administrator - Full platform access',
    permissions: [
      'models.approve',
      'pictures.review', 
      'users.manage',
      'analytics.access',
      'content.manage',
      'users.impersonate',
      'admin.full_access',
      'tenant.manage'
    ]
  },
  tenant_admin: {
    name: 'tenant_admin',
    description: 'Tenant Administrator - Tenant-specific admin access',
    permissions: [
      'models.approve',
      'pictures.review',
      'users.manage', 
      'analytics.access',
      'content.manage',
      'tenant.manage'
    ]
  },
  content_moderator: {
    name: 'content_moderator', 
    description: 'Content Moderator - Content review and moderation',
    permissions: [
      'models.approve',
      'pictures.review',
      'content.manage'
    ]
  },
  approver: {
    name: 'approver',
    description: 'Application Approver - Model and application approval',
    permissions: [
      'models.approve'
    ]
  },
  support_agent: {
    name: 'support_agent',
    description: 'Support Agent - Customer support access',
    permissions: [
      'users.manage',
      'users.impersonate'
    ]
  },
  analytics_viewer: {
    name: 'analytics_viewer',
    description: 'Analytics Viewer - Read-only analytics access', 
    permissions: [
      'analytics.access'
    ]
  }
} as const

async function createAdminPermissions() {
  logger.info('🔑 Creating admin permissions...')
  
  for (const permission of ADMIN_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: { description: permission.description },
      create: {
        name: permission.name,
        description: permission.description
      }
    })
    logger.info(`✅ Created/updated permission: ${permission.name}`)
  }
  
  logger.info('✅ Admin permissions created successfully')
}

async function createAdminRoles() {
  logger.info('👥 Creating admin roles...')
  
  for (const [roleKey, roleData] of Object.entries(ADMIN_ROLES)) {
    // Create role
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: { description: roleData.description },
      create: {
        name: roleData.name,
        description: roleData.description
      }
    })
    
    // Assign permissions to role
    for (const permissionName of roleData.permissions) {
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName }
      })
      
      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id
            }
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id
          }
        })
      }
    }
    
    logger.info(`✅ Created/updated role: ${roleData.name} with ${roleData.permissions.length} permissions`)
  }
  
  logger.info('✅ Admin roles created successfully')
}

async function migrateAdminRoleData() {
  logger.info('🔄 Migrating AdminRole data to UserRole assignments...')
  
  // Get all existing AdminRole records
  const adminRoles = await prisma.adminRole.findMany({
    where: { isActive: true }
  }) as AdminRoleData[]
  
  logger.info(`📊 Found ${adminRoles.length} active AdminRole records to migrate`)
  
  let migratedCount = 0
  let skippedCount = 0
  
  for (const adminRole of adminRoles) {
    try {
      // Find the corresponding role in the new system
      const role = await prisma.role.findUnique({
        where: { name: adminRole.roleType }
      })
      
      if (!role) {
        logger.warn(`⚠️ Role not found for type: ${adminRole.roleType}, skipping user ${adminRole.userId}`)
        skippedCount++
        continue
      }
      
      // Create UserRole assignment
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: adminRole.userId,
            roleId: role.id
          }
        },
        update: {}, // No update needed if exists
        create: {
          userId: adminRole.userId,
          roleId: role.id
        }
      })
      
      migratedCount++
      logger.info(`✅ Migrated user ${adminRole.userId} to role ${adminRole.roleType}`)
      
    } catch (error) {
      logger.error(`❌ Failed to migrate AdminRole for user ${adminRole.userId}:`, error)
      skippedCount++
    }
  }
  
  logger.info(`✅ Migration completed: ${migratedCount} migrated, ${skippedCount} skipped`)
}

async function verifyMigration() {
  logger.info('🔍 Verifying migration...')
  
  const adminRoleCount = await prisma.adminRole.count()
  const userRoleCount = await prisma.userRole.count()
  const roleCount = await prisma.role.count()
  const permissionCount = await prisma.permission.count()
  
  logger.info(`📊 Migration verification:`)
  logger.info(`   - AdminRole records: ${adminRoleCount}`)
  logger.info(`   - UserRole assignments: ${userRoleCount}`)
  logger.info(`   - Total roles: ${roleCount}`)
  logger.info(`   - Total permissions: ${permissionCount}`)
  
  // Check that all AdminRole users have UserRole assignments
  const adminRoleUsers = await prisma.adminRole.findMany({
    select: { userId: true },
    distinct: ['userId']
  })
  
  const userRoleUsers = await prisma.userRole.findMany({
    select: { userId: true },
    distinct: ['userId']
  })
  
  const adminUserIds = new Set(adminRoleUsers.map(ar => ar.userId.toString()))
  const roleUserIds = new Set(userRoleUsers.map(ur => ur.userId.toString()))
  
  const unmigrated = [...adminUserIds].filter(id => !roleUserIds.has(id))
  
  if (unmigrated.length > 0) {
    logger.warn(`⚠️ ${unmigrated.length} AdminRole users not found in UserRole:`, unmigrated)
  } else {
    logger.info(`✅ All AdminRole users successfully migrated to UserRole system`)
  }
}

async function main() {
  try {
    logger.info('🚀 Starting AdminRole to Role/Permission migration...')
    
    // Step 1: Create admin permissions
    await createAdminPermissions()
    
    // Step 2: Create admin roles with permissions
    await createAdminRoles()
    
    // Step 3: Migrate existing AdminRole data
    await migrateAdminRoleData()
    
    // Step 4: Verify migration
    await verifyMigration()
    
    logger.info('🎉 AdminRole migration completed successfully!')
    logger.info('📝 Next steps:')
    logger.info('   1. Test the new permission system thoroughly')
    logger.info('   2. Update all code references to use Role/Permission system')
    logger.info('   3. Run the database migration to drop AdminRole table')
    
  } catch (error) {
    logger.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
if (require.main === module) {
  main()
}

export { main as migrateAdminRoles } 