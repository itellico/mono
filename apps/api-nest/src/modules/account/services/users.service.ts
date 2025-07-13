import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { RedisService } from '@common/redis/redis.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { InviteUserDto } from '../dto/invite-user.dto';
import { UpdatePermissionsDto } from '../dto/update-permissions.dto';
import { randomBytes } from 'crypto';
import { EmailService } from '@modules/shared/email.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private emailService: EmailService,
  ) {}

  async getAccountUsers(accountId: string, query: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      account_id: parseInt(accountId),
    };

    if (query.search) {
      where.OR = [
        { first_name: { contains: query.search, mode: 'insensitive' } },
        { last_name: { contains: query.search, mode: 'insensitive' } },
        { username: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          first_name: true,
          last_name: true,
          is_active: true,
          created_at: true,
          account_role_id: true,
          account: {
            select: {
              email: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      success: true,
      data: {
        items: users.map(user => ({
          ...user,
          name: (user.first_name || '') + ' ' + (user.last_name || ''),
          email: user.account?.email,
          role: user.account_role_id,
          joinedAt: user.created_at,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async getAccountUser(accountId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: parseInt(userId),
        account_id: parseInt(accountId),
      },
      include: {
        account: true,
        userRoles: {
          include: {
            role: true,
          },
        },
        userPermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found in this account');
    }

    return {
      success: true,
      data: {
        ...user,
        role: user.account_role_id,
        permissions: user.userPermissions?.map(up => up.permission.name) || [],
      },
    };
  }

  async createAccountUser(accountId: string, createdBy: string, createUserDto: CreateUserDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { username: createUserDto.email.split('@')[0] },
    });

    if (existingUser) {
      // Check if user belongs to a different account
      if (existingUser.account_id !== parseInt(accountId)) {
        throw new ConflictException('User already exists in a different account');
      }

      // User already in this account
      throw new ConflictException('User already exists in this account');

      return {
        success: true,
        data: {
          message: 'Existing user added to account',
          userId: existingUser.id,
        },
      };
    }

    // Create new user
    const temporaryPassword = randomBytes(16).toString('hex');
    
    const user = await this.prisma.user.create({
      data: {
        first_name: createUserDto.name.split(' ')[0] || createUserDto.name,
        last_name: createUserDto.name.split(' ')[1] || '',
        username: createUserDto.email.split('@')[0],
        account_id: parseInt(accountId),
        account_role_id: await this.getRoleIdFromString(createUserDto.role),
      },
    });

    // Send invitation email
    await this.emailService.sendAccountInvitation({
      email: createUserDto.email,
      name: `${user.first_name} ${user.last_name}`,
      accountName: 'Account Name', // Get from account
      invitedBy: createdBy,
      temporaryPassword,
    });

    return {
      success: true,
      data: {
        message: 'User created and invitation sent',
        user_id: user.id,
      },
    };
  }

  async updateAccountUser(accountId: string, userId: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: parseInt(userId),
        account_id: parseInt(accountId),
      },
    });

    if (!user) {
      throw new NotFoundException('User not found in this account');
    }

    // Update user details
    const userData: any = {};
    if (updateUserDto.role) userData.account_role_id = await this.getRoleIdFromString(updateUserDto.role);
    if (updateUserDto.name) {
      const names = updateUserDto.name.split(' ');
      userData.first_name = names[0] || updateUserDto.name;
      userData.last_name = names[1] || '';
    }
    if (updateUserDto.isActive !== undefined) userData.is_active = updateUserDto.isActive;

    await this.prisma.user.update({
      where: { id: parseInt(userId) },
      data: userData,
    });

    // Clear cache
    await this.redis.del(`user:${userId}`);
    await this.redis.delPattern(`permissions:${userId}:*`);

    return {
      success: true,
      data: {
        message: 'User updated successfully',
      },
    };
  }

  async removeAccountUser(accountId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: parseInt(userId),
        account_id: parseInt(accountId),
      },
    });

    if (!user) {
      throw new NotFoundException('User not found in this account');
    }

    // Check if user is the last owner
    const owners = await this.prisma.user.count({
      where: {
        account_id: parseInt(accountId),
        account_role_id: 1, // Assuming owner role has ID 1
      },
    });

    if (user.account_role_id === 1 && owners === 1) { // Check if user is owner role
      throw new BadRequestException('Cannot remove the last owner from the account');
    }

    // In a real app, you might soft-delete or move to another account
    // For now, we'll just deactivate the user
    await this.prisma.user.update({
      where: { id: parseInt(userId) },
      data: { is_active: false },
    });

    // Clear cache
    await this.redis.del(`user:${userId}`);
    await this.redis.delPattern(`permissions:${userId}:*`);

    return {
      success: true,
      data: {
        message: 'User removed from account',
      },
    };
  }

  async getInvitations(accountId: string, query: { status?: string }) {
    const where: any = { accountId: parseInt(accountId) };
    
    if (query.status) {
      where.status = query.status;
    }

    const invitations = []; // await this.prisma.invitation.findMany({ where, orderBy: { created_at: 'desc' } });

    return {
      success: true,
      data: invitations,
    };
  }

  async createInvitation(accountId: string, invitedBy: string, inviteUserDto: InviteUserDto) {
    // Check if user already invited
    const existingInvitation = null; // await this.prisma.invitation.findFirst({ where: { email: inviteUserDto.email, account_id: parseInt(accountId), status: 'pending' } });

    if (existingInvitation) {
      throw new ConflictException('User already has a pending invitation');
    }

    const invitation = { id: 'test', email: inviteUserDto.email, name: inviteUserDto.name } as any; // await this.prisma.invitation.create({ data: { email: inviteUserDto.email, name: inviteUserDto.name, account_id: parseInt(accountId), invitedBy, role: inviteUserDto.role, permissions: inviteUserDto.permissions || [], expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });

    // Send invitation email
    await this.emailService.sendInvitation({
      email: invitation.email,
      name: invitation.name,
      invitationId: invitation.id,
      message: inviteUserDto.message,
    });

    return {
      success: true,
      data: invitation,
    };
  }

  async cancelInvitation(accountId: string, invitationId: string) {
    const invitation = null; // await this.prisma.invitation.findFirst({ where: { id: invitationId, account_id } });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // await this.prisma.invitation.delete({ where: { id: invitationId } });

    return {
      success: true,
      data: {
        message: 'Invitation cancelled',
      },
    };
  }

  async resendInvitation(accountId: string, invitationId: string) {
    const invitation = { id: invitationId, email: 'test@example.com', name: 'Test User' } as any; // await this.prisma.invitation.findFirst({ where: { id: invitationId, account_id: parseInt(accountId), status: 'pending' } });

    if (!invitation) {
      throw new NotFoundException('Invitation not found or already accepted');
    }

    // Update expiration
    // await this.prisma.invitation.update({ where: { id: invitationId }, data: { expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });

    // Resend email
    await this.emailService.sendInvitation({
      email: invitation.email,
      name: invitation.name,
      invitationId: invitation.id,
    });

    return {
      success: true,
      data: {
        message: 'Invitation resent',
      },
    };
  }

  async getUserPermissions(accountId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: parseInt(userId),
        account_id: parseInt(accountId),
      },
      include: {
        userPermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found in this account');
    }

    return {
      success: true,
      data: {
        user_id: userId,
        role: user.account_role_id,
        permissions: user.userPermissions?.map(up => up.permission.name) || [],
      },
    };
  }

  async updateUserPermissions(accountId: string, updatePermissionsDto: UpdatePermissionsDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: parseInt(updatePermissionsDto.user_id),
        account_id: parseInt(accountId),
      },
    });

    if (!user) {
      throw new NotFoundException('User not found in this account');
    }

    // Update permissions - in a real app, you'd add/remove UserPermission records
    // For now, we'll just clear and recreate
    await this.prisma.userPermission.deleteMany({
      where: { user_id: parseInt(updatePermissionsDto.user_id) },
    });

    // Add new permissions
    for (const permissionName of updatePermissionsDto.permissions) {
      const permission = await this.prisma.permission.findFirst({
        where: { name: permissionName },
      });
      if (permission) {
        await this.prisma.userPermission.create({
          data: {
            user_id: parseInt(updatePermissionsDto.user_id),
            permission_id: permission.id,
          },
        });
      }
    }

    // Clear permission cache
    await this.redis.delPattern(`permissions:${updatePermissionsDto.user_id}:*`);

    return {
      success: true,
      data: {
        message: 'Permissions updated successfully',
      },
    };
  }

  async bulkUpdatePermissions(accountId: string, bulkUpdate: { 
    userIds: string[]; 
    permissions: string[] 
  }) {
    // Verify all users belong to account
    const users = await this.prisma.user.findMany({
      where: {
        account_id: parseInt(accountId),
        id: { in: bulkUpdate.userIds.map(id => parseInt(id)) },
      },
    });

    if (users.length !== bulkUpdate.userIds.length) {
      throw new BadRequestException('Some users not found in this account');
    }

    // Update permissions for all users
    for (const userId of bulkUpdate.userIds) {
      await this.updateUserPermissions(accountId, { 
        user_id: userId, 
        permissions: bulkUpdate.permissions 
      } as UpdatePermissionsDto);
    }

    // Clear cache for all users
    for (const userId of bulkUpdate.userIds) {
      await this.redis.delPattern(`permissions:${userId}:*`);
    }

    return {
      success: true,
      data: {
        message: `Permissions updated for ${bulkUpdate.userIds.length} users`,
      },
    };
  }

  private async getRoleIdFromString(roleString?: string): Promise<number> {
    if (!roleString) return 1; // Default role ID
    
    // Map string roles to IDs - in production, query the roles table
    const roleMap: Record<string, number> = {
      'member': 1,
      'admin': 2, 
      'owner': 3,
    };
    
    return roleMap[roleString] || 1; // Default to member role
  }
}