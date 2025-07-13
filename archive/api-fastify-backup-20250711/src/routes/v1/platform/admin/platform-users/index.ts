import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

const platformUsersRoutes: FastifyPluginAsync = async (fastify) => {
  
  // Get platform users (cross-tenant)
  fastify.get('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.platform-users.read')
    ],
    schema: {
      tags: ['platform.platform-users'],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        search: Type.Optional(Type.String()),
        userTypes: Type.Optional(Type.String()),
        statuses: Type.Optional(Type.String()),
        tenantIds: Type.Optional(Type.String())
      }),
      response: {
        200: Type.Object({
          users: Type.Array(Type.Object({
            id: Type.String(),
            uuid: uuidSchema,
            firstName: Type.String(),
            lastName: Type.String(),
            email: Type.String(),
            isActive: Type.Boolean(),
            isVerified: Type.Boolean(),
            userType: Type.String(),
            tenantId: Type.Number(),
            tenant: Type.Union([
              Type.Object({
                name: Type.String(),
                domain: Type.String()
              }),
              Type.Null()
            ]),
            lastLoginAt: Type.Union([Type.String(), Type.Null()]),
            createdAt: Type.String(),
            stats: Type.Object({
              sessionCount: Type.Number(),
              lastActivityAt: Type.Union([Type.String(), Type.Null()])
            })
          })),
          pagination: Type.Object({
            total: Type.Number(),
            page: Type.Number(),
            limit: Type.Number(),
            pages: Type.Number(),
            hasMore: Type.Boolean()
          }),
          stats: Type.Object({
            totalUsers: Type.Number(),
            activeUsers: Type.Number(),
            verifiedUsers: Type.Number(),
            totalTenants: Type.Number(),
            newUsersThisMonth: Type.Number()
          }),
          tenantSummaries: Type.Object({}, { additionalProperties: Type.Object({
            name: Type.String(),
            domain: Type.String(),
            userCount: Type.Number(),
            lastActivity: Type.Union([Type.String(), Type.Null()])
          })})
        })
      }
    },
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    const { user } = request;
    
    // ✅ SECURITY: Super admin only for platform-wide user management
    if (!user.roles?.includes('super_admin')) {
      return reply.code(403).send({ error: 'SUPER_ADMIN_ACCESS_REQUIRED' });
    }

    const { page = 1, limit = 20, search = '', userTypes = '', statuses = '', tenantIds = '' } = request.query as any;
    const offset = (page - 1) * limit;

    // ✅ REDIS CACHING: Check cache first for platform users
    const cacheKey = `platform:users:list:${JSON.stringify({ page, limit, search, userTypes, statuses, tenantIds })}`;
    const cached = await fastify.redis?.get(cacheKey);
    if (cached) {
      fastify.log.info('✅ Platform users served from cache', { cacheKey });
      return JSON.parse(cached);
    }

    // ✅ BUILD FILTERS: Cross-tenant user query
    const where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { account: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // User type filter
    const userTypeArray = userTypes ? userTypes.split(',').filter(Boolean) : [];
    if (userTypeArray.length > 0) {
      where.userType = { in: userTypeArray };
    }

    // Status filter
    const statusArray = statuses ? statuses.split(',').filter(Boolean) : [];
    if (statusArray.length > 0) {
      const activeStatuses = statusArray.map(status => {
        switch (status) {
          case 'active': return true;
          case 'inactive': return false;
          default: return undefined;
        }
      }).filter(s => s !== undefined);
      
      if (activeStatuses.length > 0) {
        where.isActive = { in: activeStatuses };
      }
    }

    // Tenant filter
    const tenantIdArray = tenantIds ? tenantIds.split(',').filter(Boolean) : [];
    if (tenantIdArray.length > 0) {
      const tenantIdNumbers = tenantIdArray.map(id => parseInt(id)).filter(id => !isNaN(id));
      if (tenantIdNumbers.length > 0) {
        where.tenantId = { in: tenantIdNumbers };
      }
    }

    // ✅ FETCH USERS: Cross-tenant aggregation with tenant info
    const [users, totalCount] = await Promise.all([
      fastify.prisma.user.findMany({
        where,
        include: {
          account: {
            select: {
              email: true,
              isVerified: true
            }
          },
          tenant: {
            select: {
              id: true,
              name: true,
              domain: true
            }
          },
          _count: {
            select: {
              sessions: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      fastify.prisma.user.count({ where })
    ]);

    // ✅ GET TENANT SUMMARIES: Aggregate stats by tenant
    const tenantSummaries = await fastify.prisma.user.groupBy({
      by: ['tenantId'],
      where: statusArray.length > 0 ? { isActive: { in: statusArray.includes('active') ? [true] : [false] } } : {},
      _count: {
        id: true
      },
      _max: {
        createdAt: true
      }
    });

    // ✅ GET TENANT DETAILS
    const tenantDetails = await fastify.prisma.tenant.findMany({
      where: {
        id: { in: tenantSummaries.map(t => t.tenantId) }
      },
      select: {
        id: true,
        name: true,
        domain: true
      }
    });

    // ✅ TRANSFORM DATA: Format platform users with cross-tenant context
    const platformUsers = users.map(user => ({
      id: user.id.toString(),
      uuid: user.uuid,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.account?.email || '',
      isActive: user.isActive,
      isVerified: user.account?.isVerified || false,
      userType: user.userType || 'individual',
      tenantId: user.tenantId,
      tenant: user.tenant ? {
        id: user.tenant.uuid as UUID,
        name: user.tenant.name,
        domain: user.tenant.domain
      } : null,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      stats: {
        sessionCount: user._count.sessions,
        lastActivityAt: user.lastLoginAt?.toISOString() || null
      }
    }));

    // ✅ AGGREGATE STATS: Platform-wide statistics
    const platformStats = {
      totalUsers: totalCount,
      activeUsers: await fastify.prisma.user.count({ where: { isActive: true } }),
      verifiedUsers: await fastify.prisma.user.count({ 
        where: { account: { isVerified: true } } 
      }),
      totalTenants: await fastify.prisma.tenant.count(),
      newUsersThisMonth: await fastify.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    };

    // ✅ TENANT SUMMARY MAP
    const tenantSummaryMap = tenantSummaries.reduce((acc, summary) => {
      const tenant = tenantDetails.find(t => t.id === summary.tenantId);
      if (tenant) {
        acc[summary.tenantId] = {
          ...tenant,
          userCount: summary._count.uuid as UUID,
          lastActivity: summary._max.createdAt?.toISOString() || null
        };
      }
      return acc;
    }, {} as Record<number, any>);

    const totalPages = Math.ceil(totalCount / limit);

    const result = {
      users: platformUsers,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: totalPages,
        hasMore: page < totalPages
      },
      stats: platformStats,
      tenantSummaries: tenantSummaryMap
    };

    // ✅ REDIS CACHING: Cache the result for 2 minutes (platform-wide data changes less frequently)
    if (fastify.redis) {
      await fastify.redis.setex(cacheKey, 120, JSON.stringify(result));
    }

    fastify.log.info('✅ Platform users fetched successfully', {
      userId: user.uuid as UUID,
      totalUsers: totalCount,
      page,
      limit,
      filters: { search, userTypes, statuses, tenantIds },
      cached: false
    });

    return result;
  });

  // Bulk update platform users
  fastify.put('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.platform-users.read')
    ],
    schema: {
      tags: ['platform.platform-users'],
      body: Type.Object({
        userIds: Type.Array(Type.String()),
        action: Type.Union([
          Type.Literal('activate'),
          Type.Literal('deactivate')
        ]),
        data: Type.Optional(Type.Object({}, { additionalProperties: true }))
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
          affectedCount: Type.Number()
        })
      }
    },
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    const { user } = request;
    
    // ✅ SECURITY: Super admin only for platform-wide user management
    if (!user.roles?.includes('super_admin')) {
      return reply.code(403).send({ error: 'SUPER_ADMIN_ACCESS_REQUIRED' });
    }

    const { userIds, action, data } = request.body as any;

    if (!userIds || !Array.isArray(userIds) || !action) {
      return reply.code(400).send({ error: 'INVALID_REQUEST_BODY_-_USERIDS_ARRAY_AND_ACTION_REQUIRED' });
    }

    const userIdNumbers = userIds.map(id => parseInt(id)).filter(id => !isNaN(id));

    let updateData: any = {};
    let actionDescription = '';

    switch (action) {
      case 'activate':
        updateData = { isActive: true };
        actionDescription = 'activated';
        break;
      case 'deactivate':
        updateData = { isActive: false };
        actionDescription = 'deactivated';
        break;
      default:
        return reply.code(400).send({ error: 'INVALID_ACTION._SUPPORTED:_ACTIVATE,_DEACTIVATE' });
    }

    // ✅ BULK UPDATE: Platform-wide user updates
    const result = await fastify.prisma.user.updateMany({
      where: {
        id: { in: userIdNumbers }
      },
      data: updateData
    });

    // ✅ REDIS CACHE INVALIDATION: Clear platform users cache after bulk update
    if (fastify.redis) {
      const pattern = `platform:users:list:*`;
      const keys = await fastify.redis.keys(pattern);
      if (keys.length > 0) {
        await fastify.redis.del(...keys);
        fastify.log.info('✅ Platform users cache invalidated after bulk update', { 
          keysCleared: keys.length 
        });
      }
    }

    fastify.log.info(`✅ Platform users bulk ${actionDescription}`, {
      adminUserId: user.uuid as UUID,
      affectedUsers: result.count,
      userIds: userIdNumbers,
      action
    });

    return {
      success: true,
      message: `Successfully ${actionDescription} ${result.count} users`,
      affectedCount: result.count
    };
  });

  // Get single platform user by UUID
  fastify.get('/:uuid', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.platform-users.read')
    ],
    schema: {
      tags: ['platform.platform-users'],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          id: Type.String(),
          uuid: uuidSchema,
          firstName: Type.String(),
          lastName: Type.String(),
          email: Type.String(),
          isActive: Type.Boolean(),
          isVerified: Type.Boolean(),
          userType: Type.String(),
          tenantId: Type.Number(),
          tenant: Type.Union([
            Type.Object({
              name: Type.String(),
              domain: Type.String()
            }),
            Type.Null()
          ]),
          lastLoginAt: Type.Union([Type.String(), Type.Null()]),
          createdAt: Type.String(),
          stats: Type.Object({
            sessionCount: Type.Number(),
            lastActivityAt: Type.Union([Type.String(), Type.Null()])
          })
        })
      }
    },
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    const { user } = request;
    
    // ✅ SECURITY: Super admin only for platform-wide user management
    if (!user.roles?.includes('super_admin')) {
      return reply.code(403).send({ error: 'SUPER_ADMIN_ACCESS_REQUIRED' });
    }

    const { uuid } = request.params as any;

    // ✅ FETCH USER: Get individual platform user
    const platformUser = await fastify.prisma.user.findUnique({
      where: { uuid },
      include: {
        account: {
          select: {
            email: true,
            isVerified: true
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
            domain: true
          }
        },
        _count: {
          select: {
            sessions: true
          }
        }
      }
    });

    if (!platformUser) {
      return reply.code(404).send({ error: 'PLATFORM_USER_NOT_FOUND' });
    }

    // ✅ TRANSFORM DATA: Format platform user
    const userData = {
      id: platformUser.id.toString(),
      uuid: platformUser.uuid,
      firstName: platformUser.firstName || '',
      lastName: platformUser.lastName || '',
      email: platformUser.account?.email || '',
      isActive: platformUser.isActive,
      isVerified: platformUser.account?.isVerified || false,
      userType: platformUser.userType || 'individual',
      tenantId: platformUser.tenantId,
      tenant: platformUser.tenant ? {
        id: platformUser.tenant.uuid as UUID,
        name: platformUser.tenant.name,
        domain: platformUser.tenant.domain
      } : null,
      lastLoginAt: platformUser.lastLoginAt?.toISOString() || null,
      createdAt: platformUser.createdAt.toISOString(),
      stats: {
        sessionCount: platformUser._count.sessions,
        lastActivityAt: platformUser.lastLoginAt?.toISOString() || null
      }
    };

    fastify.log.info('✅ Platform user fetched successfully', {
      adminUserId: user.uuid as UUID,
      fetchedUserId: platformUser.uuid as UUID,
      fetchedUserEmail: platformUser.account?.email
    });

    return userData;
  });

  // Update single platform user by UUID
  fastify.put('/:uuid', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.platform-users.read')
    ],
    schema: {
      tags: ['platform.platform-users'],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        firstName: Type.Optional(Type.String()),
        lastName: Type.Optional(Type.String()),
        email: Type.Optional(Type.String()),
        isActive: Type.Optional(Type.Boolean()),
        userType: Type.Optional(Type.String()),
        tenantId: Type.Optional(Type.Number()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
          user: Type.Object({
            id: Type.String(),
            uuid: uuidSchema,
            firstName: Type.String(),
            lastName: Type.String(),
            email: Type.String(),
            isActive: Type.Boolean(),
            userType: Type.String(),
            tenantId: Type.Number(),
          })
        })
      }
    },
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    const { user } = request;
    
    // ✅ SECURITY: Super admin only for platform-wide user management
    if (!user.roles?.includes('super_admin')) {
      return reply.code(403).send({ error: 'SUPER_ADMIN_ACCESS_REQUIRED' });
    }

    const { uuid } = request.params as any;
    const updateData = request.body as any;

    // ✅ UPDATE USER: Update platform user
    const updatedUser = await fastify.prisma.user.update({
      where: { uuid },
      data: {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        isActive: updateData.isActive,
        userType: updateData.userType,
        tenantId: updateData.tenantId,
        // Note: Email updates would need to update the account table separately
      },
      include: {
        account: {
          select: {
            email: true,
            isVerified: true
          }
        }
      }
    });

    // ✅ REDIS CACHE INVALIDATION: Clear platform users cache after update
    if (fastify.redis) {
      const pattern = `platform:users:list:*`;
      const keys = await fastify.redis.keys(pattern);
      if (keys.length > 0) {
        await fastify.redis.del(...keys);
        fastify.log.info('✅ Platform users cache invalidated after update', { 
          keysCleared: keys.length 
        });
      }
    }

    fastify.log.info('✅ Platform user updated successfully', {
      adminUserId: user.uuid as UUID,
      updatedUserId: updatedUser.uuid as UUID,
      updatedUserEmail: updatedUser.account?.email,
      changes: Object.keys(updateData)
    });

    return {
      success: true,
      message: 'Platform user updated successfully',
      user: {
        id: updatedUser.id.toString(),
        uuid: updatedUser.uuid,
        firstName: updatedUser.firstName || '',
        lastName: updatedUser.lastName || '',
        email: updatedUser.account?.email || '',
        isActive: updatedUser.isActive,
        userType: updatedUser.userType || 'individual',
        tenantId: updatedUser.tenantId,
      }
    };
  });

  // Create new platform user
  fastify.post('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.platform-users.read')
    ],
    schema: {
      tags: ['platform.platform-users'],
      body: Type.Object({
        firstName: Type.String(),
        lastName: Type.String(),
        email: Type.String(),
        userType: Type.Optional(Type.String()),
        tenantId: Type.Number(),
        isActive: Type.Optional(Type.Boolean()),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
          user: Type.Object({
            id: Type.String(),
            uuid: uuidSchema,
            firstName: Type.String(),
            lastName: Type.String(),
            email: Type.String(),
            isActive: Type.Boolean(),
            userType: Type.String(),
            tenantId: Type.Number(),
          })
        })
      }
    },
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    const { user } = request;
    
    // ✅ SECURITY: Super admin only for platform-wide user management
    if (!user.roles?.includes('super_admin')) {
      return reply.code(403).send({ error: 'SUPER_ADMIN_ACCESS_REQUIRED' });
    }

    const { firstName, lastName, email, userType = 'individual', tenantId, isActive = true } = request.body as any;

    // ✅ CREATE USER: Create new platform user with account
    const newUser = await fastify.prisma.user.create({
      data: {
        firstName,
        lastName,
        userType,
        tenantId,
        isActive,
        uuid: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        account: {
          create: {
            email,
            isVerified: false,
            // Note: In a real implementation, you'd need to set up proper authentication
          }
        }
      },
      include: {
        account: {
          select: {
            email: true,
            isVerified: true
          }
        }
      }
    });

    // ✅ REDIS CACHE INVALIDATION: Clear platform users cache after creation
    if (fastify.redis) {
      const pattern = `platform:users:list:*`;
      const keys = await fastify.redis.keys(pattern);
      if (keys.length > 0) {
        await fastify.redis.del(...keys);
        fastify.log.info('✅ Platform users cache invalidated after creation', { 
          keysCleared: keys.length 
        });
      }
    }

    fastify.log.info('✅ Platform user created successfully', {
      adminUserId: user.uuid as UUID,
      createdUserId: newUser.uuid as UUID,
      createdUserEmail: newUser.account?.email
    });

    return reply.code(201).send({
      success: true,
      message: 'Platform user created successfully',
      user: {
        id: newUser.id.toString(),
        uuid: newUser.uuid,
        firstName: newUser.firstName || '',
        lastName: newUser.lastName || '',
        email: newUser.account?.email || '',
        isActive: newUser.isActive,
        userType: newUser.userType || 'individual',
        tenantId: newUser.tenantId,
      }
    });
  });
};

export { platformUsersRoutes };