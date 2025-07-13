import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { Auth } from '@common/decorators/auth.decorator';
import { Permission } from '@common/decorators/permission.decorator';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';
import { CurrentUser } from '@common/decorators/user.decorator';
import { PermissionService } from '@modules/permissions/permission.service';
import { PrismaService } from '@common/prisma/prisma.service';

@Controller('admin/permissions')
@ApiTags('Platform - Core')
@Auth()
@Tier(UserTier.PLATFORM)
export class AdminPermissionsController {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('user-access')
  @Permission('admin.permissions.view')
  @Tier(UserTier.PLATFORM)
  @ApiOperation({ 
    summary: 'Get current user permission access for admin area',
    description: 'Returns user roles and permissions for permission management access control'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User permission data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            email: { type: 'string' },
            tenantId: { type: 'number' },
            isSuperAdmin: { type: 'boolean' },
            hasAdminAccess: { type: 'boolean' },
            roles: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                  code: { type: 'string' },
                  level: { type: 'number' }
                }
              }
            },
            permissions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                  action: { type: 'string' },
                  resource: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserPermissionAccess(@CurrentUser() user: any) {
    try {
      // Get user with roles and permissions through proper service layer
      const userWithPermissions = await this.prisma.user.findFirst({
        where: { uuid: user.id },
        include: {
          account: {
            select: {
              id: true,
              email: true,
              tenant_id: true
            }
          },
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!userWithPermissions) {
        return {
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User not found in database'
        };
      }

      // Check if user is Super Admin
      const isSuperAdmin = userWithPermissions.userRoles.some(userRole => 
        userRole.role.code === 'super_admin'
      );

      // Check if user has admin access
      const hasAdminAccess = userWithPermissions.userRoles.some(userRole =>
        userRole.role.rolePermissions.some(rolePermission =>
          rolePermission.permission.name === 'admin.full_access' ||
          rolePermission.permission.name === 'admin.manage' ||
          rolePermission.permission.name === 'admin.permissions.view'
        )
      );

      // Format roles data
      const roles = userWithPermissions.userRoles.map(userRole => ({
        id: userRole.role.id,
        name: userRole.role.name,
        code: userRole.role.code,
        level: userRole.role.level
      }));

      // Format permissions data
      const permissions = userWithPermissions.userRoles.flatMap(userRole =>
        userRole.role.rolePermissions.map(rolePermission => ({
          id: rolePermission.permission.id,
          name: rolePermission.permission.name,
          action: rolePermission.permission.action,
          resource: rolePermission.permission.resource
        }))
      );

      return {
        success: true,
        data: {
          userId: userWithPermissions.uuid,
          email: userWithPermissions.account.email,
          tenantId: userWithPermissions.account.tenant_id,
          isSuperAdmin,
          hasAdminAccess,
          roles,
          permissions,
          accessGranted: isSuperAdmin || hasAdminAccess
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'PERMISSION_CHECK_FAILED',
        message: 'Failed to check user permissions'
      };
    }
  }
}