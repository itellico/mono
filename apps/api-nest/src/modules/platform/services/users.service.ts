import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { RedisService } from '@common/redis/redis.service';

@Injectable()
export class PlatformUsersService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getUsers(query: { 
    page?: number; 
    limit?: number; 
    search?: string;
    active?: boolean;
    userType?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { account: { email: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    if (query.active !== undefined) {
      where.isActive = query.active;
    }

    if (query.userType) {
      where.userType = query.userType;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          account: {
            select: { email: true, isVerified: true }
          },
          tenant: {
            select: { id: true, name: true, domain: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.user.count({ where })
    ]);

    return {
      success: true,
      data: {
        items: users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    };
  }

  async getUserByUuid(uuid: string) {
    const user = await this.prisma.user.findUnique({
      where: { uuid },
      include: {
        account: {
          select: { email: true, isVerified: true, createdAt: true }
        },
        tenant: {
          select: { id: true, name: true, domain: true }
        }
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      data: user
    };
  }

  async getUserExtendedByUuid(uuid: string) {
    const user = await this.prisma.user.findUnique({
      where: { uuid },
      include: {
        account: {
          select: { email: true, isVerified: true, createdAt: true }
        },
        tenant: {
          select: { id: true, name: true, domain: true }
        },
        _count: {
          select: { sessions: true }
        }
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      data: user
    };
  }

  async createUser(createdById: string, createUserDto: {
    firstName: string;
    lastName: string;
    email: string;
    userType?: string;
    tenantId?: string;
    isActive?: boolean;
  }) {
    // Check if email already exists
    const existingAccount = await this.prisma.account.findUnique({
      where: { email: createUserDto.email }
    });

    if (existingAccount) {
      throw new BadRequestException('Email already exists');
    }

    // Verify tenant exists if provided
    if (createUserDto.tenantId) {
      const tenant = await this.prisma.tenant.findUnique({ 
        where: { id: createUserDto.tenantId } 
      });
      if (!tenant) {
        throw new BadRequestException('Tenant not found');
      }
    }

    // Create account and user in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const account = await tx.account.create({
        data: {
          email: createUserDto.email,
          isVerified: false // Platform admins need to verify manually
        }
      });

      const user = await tx.user.create({
        data: {
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
          userType: createUserDto.userType || 'individual',
          isActive: createUserDto.isActive !== false,
          tenantId: createUserDto.tenantId || null,
          accountId: account.id,
          createdById
        },
        include: {
          account: {
            select: { email: true, isVerified: true }
          },
          tenant: {
            select: { id: true, name: true, domain: true }
          }
        }
      });

      return user;
    });

    return {
      success: true,
      data: result
    };
  }

  async updateUser(uuid: string, updateUserDto: {
    firstName?: string;
    lastName?: string;
    userType?: string;
    isActive?: boolean;
    tenantId?: string;
  }) {
    const existingUser = await this.prisma.user.findUnique({
      where: { uuid }
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Verify tenant exists if being updated
    if (updateUserDto.tenantId && updateUserDto.tenantId !== existingUser.tenantId) {
      const tenant = await this.prisma.tenant.findUnique({ 
        where: { id: updateUserDto.tenantId } 
      });
      if (!tenant) {
        throw new BadRequestException('Tenant not found');
      }
    }

    const user = await this.prisma.user.update({
      where: { uuid },
      data: updateUserDto,
      include: {
        account: {
          select: { email: true, isVerified: true }
        },
        tenant: {
          select: { id: true, name: true, domain: true }
        }
      }
    });

    // Clear user cache
    await this.redis.del(`user:${uuid}:*`);

    return {
      success: true,
      data: user
    };
  }

  async deleteUser(uuid: string) {
    const user = await this.prisma.user.findUnique({
      where: { uuid },
      include: { account: true }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete user and account in transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.user.delete({ where: { uuid } });
      if (user.account) {
        await tx.account.delete({ where: { id: user.account.id } });
      }
    });

    // Clear cache
    await this.redis.del(`user:${uuid}:*`);

    return {
      success: true,
      message: 'User deleted successfully'
    };
  }

  async activateUser(uuid: string) {
    const user = await this.prisma.user.findUnique({
      where: { uuid }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { uuid },
      data: { isActive: true },
      include: {
        account: {
          select: { email: true, isVerified: true }
        }
      }
    });

    // Clear cache
    await this.redis.del(`user:${uuid}:*`);

    return {
      success: true,
      data: updatedUser
    };
  }

  async deactivateUser(uuid: string, data: { reason?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { uuid }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { uuid },
      data: { isActive: false },
      include: {
        account: {
          select: { email: true, isVerified: true }
        }
      }
    });

    // Clear cache
    await this.redis.del(`user:${uuid}:*`);

    return {
      success: true,
      data: updatedUser,
      message: data.reason ? `User deactivated: ${data.reason}` : 'User deactivated'
    };
  }

  async getUserStats(uuid: string) {
    const user = await this.prisma.user.findUnique({
      where: { uuid },
      include: {
        _count: {
          select: {
            sessions: true
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get additional stats
    const stats = {
      sessionCount: user._count.sessions,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      accountCreatedAt: user.createdAt.toISOString(),
      isActive: user.isActive,
      daysSinceCreated: Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      daysSinceLastLogin: user.lastLoginAt 
        ? Math.floor((Date.now() - user.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24))
        : null
    };

    return {
      success: true,
      data: {
        userId: user.uuid,
        stats
      }
    };
  }

  async getUserActivity(uuid: string, query: { 
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { uuid },
      select: { id: true }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      userId: user.id
    };

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    // Note: Assuming there's an audit log table, adjust as needed
    const [activities, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          action: true,
          resource: true,
          metadata: true,
          createdAt: true
        }
      }).catch(() => []), // Graceful fallback if audit table doesn't exist
      this.prisma.auditLog.count({ where }).catch(() => 0)
    ]);

    return {
      success: true,
      data: {
        items: activities,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    };
  }
}
