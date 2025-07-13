#!/usr/bin/env tsx

/**
 * Manual Admin Role Assignment Script
 * 
 * Assigns admin roles to existing users after AdminRole migration.
 * This handles the case where AdminRole table was dropped before data migration.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface UserRoleAssignment {
  email: string;
  roleName: string;
  description: string;
}

// Define admin users and their roles
const adminAssignments: UserRoleAssignment[] = [
  {
    email: '1@1.com',
    roleName: 'super_admin',
    description: 'Super Admin - Full platform access'
  },
  {
    email: '2@2.com', 
    roleName: 'content_moderator',
    description: 'Content Moderator - Content review and moderation'
  }
]

async function assignAdminRoles() {
  try {
    console.log('🚀 Starting manual admin role assignment...')
    
    for (const assignment of adminAssignments) {
      // Find account by email, then get the user
      const account = await prisma.account.findUnique({
        where: { email: assignment.email },
        include: { 
          users: {
            include: {
              roles: {
                include: {
                  role: true
                }
              }
            }
          }
        }
      })
      
      if (!account || account.users.length === 0) {
        console.log(`⚠️ User not found for email: ${assignment.email}`)
        continue
      }
      
      const user = account.users[0] // Get the first user from the account
      
      // Find the role
      const role = await prisma.role.findUnique({
        where: { name: assignment.roleName }
      })
      
      if (!role) {
        console.log(`⚠️ Role not found: ${assignment.roleName}`)
        continue
      }
      
      // Check if user already has this role
      const existingUserRole = await prisma.userRole.findUnique({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: role.id
          }
        }
      })
      
      if (existingUserRole) {
        console.log(`✅ User ${assignment.email} already has role ${assignment.roleName}`)
        continue
      }
      
      // Assign the role
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id
        }
      })
      
      console.log(`✅ Assigned ${assignment.roleName} role to ${assignment.email}`)
    }
    
    // Verify assignments
    console.log('\n📊 Verifying role assignments...')
    
    for (const assignment of adminAssignments) {
      const account = await prisma.account.findUnique({
        where: { email: assignment.email },
        include: {
          users: {
            include: {
              roles: {
                include: {
                  role: {
                    include: {
                      permissions: {
                        include: {
                          permission: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      })
      
      if (account && account.users.length > 0) {
        const user = account.users[0]
        const roleNames = user.roles.map(ur => ur.role.name)
        const permissionCount = user.roles.reduce((count: number, ur) => count + ur.role.permissions.length, 0)
        
        console.log(`📋 ${assignment.email}:`)
        console.log(`   - Roles: ${roleNames.join(', ')}`)
        console.log(`   - Total Permissions: ${permissionCount}`)
      }
    }
    
    console.log('\n🎉 Admin role assignment completed successfully!')
    
  } catch (error) {
    console.error('❌ Failed to assign admin roles:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
if (require.main === module) {
  assignAdminRoles()
}

export { assignAdminRoles } 