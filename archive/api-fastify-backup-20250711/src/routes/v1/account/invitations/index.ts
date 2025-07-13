import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export const invitationsRoutes: FastifyPluginAsync = async (fastify) => {
  // Send user invitation (Admin only)
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('users.invite.tenant')],
    schema: {
      tags: ['account.invitations'],
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        email: Type.String({ format: 'email' }),
        firstName: Type.String({ minLength: 1, maxLength: 50 }),
        lastName: Type.String({ minLength: 1, maxLength: 50 }),
        role: Type.Union([
          Type.Literal('user'),
          Type.Literal('content_moderator'),
          Type.Literal('tenant_admin'),
        ]),
        message: Type.Optional(Type.String({ maxLength: 500 })),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            invitation: Type.Object({
              uuid: uuidSchema,
              email: Type.String(),
              token: Type.String(),
              expiresAt: Type.String(),
              invitationUrl: Type.String(),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const { email, firstName, lastName, role, message } = request.body;

    // Check if user already exists
    const existingUser = await fastify.prisma.user.findUnique({
      where: { tenantId: request.user.tenantId, email },
    });

    if (existingUser) {
      return reply.code(409).send({
        success: false,
        error: 'USER_WITH_THIS_EMAIL_ALREADY_EXISTS',
      });
    }

    // Check if invitation already exists
    const existingInvitation = await fastify.prisma.userInvitation.findFirst({
      where: { tenantId: request.user.tenantId, email,
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      return reply.code(409).send({
        success: false,
        error: 'ACTIVE_INVITATION_ALREADY_EXISTS_FOR_THIS_EMAIL',
      });
    }

    // Generate secure token
    const token = randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(token, 10);

    // Create invitation
    const invitation = await fastify.prisma.userInvitation.create({
      data: {
        email,
        firstName,
        lastName,
        role,
        token: hashedToken,
        invitedById: request.user!.id,
        tenantId: request.user!.tenantId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        message,
      },
    });

    // TODO: Send invitation email
    // await emailService.sendInvitation({
    //   to: email,
    //   inviterName: `${request.user!.firstName} ${request.user!.lastName}`,
    //   invitationUrl: `${process.env.FRONTEND_URL}/accept-invitation?token=${token}`,
    //   message,
    // });

    // Log the invitation
    await fastify.prisma.audit_logs.create({
      data: {
        userId: request.user!.id,
        tenantId: request.user!.tenantId,
        action: 'user_invite',
        resource: 'invitation',
        resourceId: invitation.uuid,
        level: 'info',
        message: `Sent invitation to ${email}`,
        metadata: {
          inviteeEmail: email,
          inviteeRole: role,
        },
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      },
    });

    const invitationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invitation?token=${token}`;

    return reply.code(201).send({
      success: true,
      data: {
        invitation: {
          uuid: invitation.uuid,
          email: invitation.email,
          token, // Return plain token for URL
          expiresAt: invitation.expiresAt.toISOString(),
          invitationUrl,
        },
      },
    });
  });

  // List pending invitations (Admin only)
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('users.invite.tenant')],
    schema: {
      tags: ['account.invitations'],
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        status: Type.Optional(Type.Union([
          Type.Literal('pending'),
          Type.Literal('accepted'),
          Type.Literal('expired'),
          Type.Literal('revoked'),
        ])),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            invitations: Type.Array(Type.Object({
              uuid: uuidSchema,
              email: Type.String(),
              firstName: Type.String(),
              lastName: Type.String(),
              role: Type.String(),
              status: Type.String(),
              invitedBy: Type.Object({
                email: Type.String(),
                firstName: Type.String(),
                lastName: Type.String(),
              }),
              expiresAt: Type.String(),
              createdAt: Type.String(),
              acceptedAt: Type.Union([Type.String(), Type.Null()]),
            })),
            pagination: Type.Object({
              page: Type.Number(),
              limit: Type.Number(),
              total: Type.Number(),
              totalPages: Type.Number(),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const { page = 1, limit = 20, status } = request.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {
      tenantId: request.user!.tenantId,
    };

    if (status) {
      if (status === 'expired') {
        where.status = 'pending';
        where.expiresAt = { lt: new Date() };
      } else {
        where.status = status;
      }
    }

    // Get invitations with count
    const [invitations, total] = await Promise.all([
      fastify.prisma.userInvitation.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          invitedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      fastify.prisma.userInvitation.count({ where }),
    ]);

    return {
      success: true,
      data: {
        invitations: invitations.map(inv => ({
          uuid: inv.uuid,
          email: inv.email,
          firstName: inv.firstName,
          lastName: inv.lastName,
          role: inv.role,
          status: inv.expiresAt < new Date() && inv.status === 'pending' ? 'expired' : inv.status,
          invitedBy: inv.invitedBy,
          expiresAt: inv.expiresAt.toISOString(),
          createdAt: inv.createdAt.toISOString(),
          acceptedAt: inv.acceptedAt?.toISOString() || null,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  });

  // Accept invitation (Public)
  fastify.post('/:token/accept', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('account.invitations.read')
    ],
    schema: {
      tags: ['account.invitations'],
      params: Type.Object({
        token: Type.String(),
      }),
      body: Type.Object({
        password: Type.String({ minLength: 8, maxLength: 100 }),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            user: Type.Object({
              uuid: uuidSchema,
              email: Type.String(),
              firstName: Type.String(),
              lastName: Type.String(),
            }),
            tokens: Type.Object({
              accessToken: Type.String(),
              refreshToken: Type.String(),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const { token } = request.params;
    const { password } = request.body;

    // Find invitation
    const invitation = await fastify.prisma.userInvitation.findFirst({
      where: { tenantId: request.user.tenantId, status: 'pending',
        expiresAt: { gt: new Date() },
      },
    });

    if (!invitation) {
      return reply.code(404).send({
        success: false,
        error: 'INVALID_OR_EXPIRED_INVITATION',
      });
    }

    // Verify token
    const validToken = await bcrypt.compare(token, invitation.token);
    if (!validToken) {
      return reply.code(404).send({
        success: false,
        error: 'INVALID_OR_EXPIRED_INVITATION',
      });
    }

    // Create user account
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await fastify.prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          email: invitation.email,
          firstName: invitation.firstName,
          lastName: invitation.lastName,
          password: hashedPassword,
          role: invitation.role,
          tenantId: invitation.tenantId,
          isActive: true,
        },
      });

      // Update invitation
      await tx.userInvitation.update({
        where: { tenantId: request.user.tenantId },
        data: {
          status: 'accepted',
          acceptedAt: new Date(),
          acceptedUserId: newUser.uuid as UUID,
        },
      });

      // Create default user role
      const role = await tx.role.findFirst({
        where: { tenantId: request.user.tenantId, code: invitation.role },
      });

      if (role) {
        await tx.userRole.create({
          data: {
            userId: newUser.uuid as UUID,
            roleId: role.uuid as UUID,
          },
        });
      }

      return newUser;
    });

    // Generate tokens for auto-login
    const session = await fastify.authService.createSession(
      user,
      request.ip,
      request.headers['user-agent'] || ''
    );
    const tokens = await fastify.authService.generateTokens(session);

    // Log the acceptance
    await fastify.prisma.audit_logs.create({
      data: {
        userId: user.uuid as UUID,
        tenantId: user.tenantId,
        action: 'invitation_accepted',
        resource: 'invitation',
        resourceId: invitation.uuid,
        level: 'info',
        message: `User accepted invitation and created account`,
        metadata: {
          invitationId: invitation.uuid as UUID,
          invitedById: invitation.invitedById,
        },
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      },
    });

    return {
      success: true,
      data: {
        user: {
          uuid: user.uuid,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        tokens,
      },
    };
  });

  // Revoke invitation (Admin only)
  fastify.delete('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('users.invite.tenant')],
    schema: {
      tags: ['account.invitations'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);

    // Find invitation
    const invitation = await fastify.prisma.userInvitation.findFirst({
      where: {
        uuid,
        tenantId: request.user!.tenantId,
        status: 'pending',
      },
    });

    if (!invitation) {
      return reply.code(404).send({
        success: false,
        error: 'INVITATION_NOT_FOUND_OR_ALREADY_PROCESSED',
      });
    }

    // Update invitation
    await fastify.prisma.userInvitation.update({
      where: { tenantId: request.user.tenantId },
      data: {
        status: 'revoked',
        revokedAt: new Date(),
        revokedById: request.user!.id,
      },
    });

    // Log the revocation
    await fastify.prisma.audit_logs.create({
      data: {
        userId: request.user!.id,
        tenantId: request.user!.tenantId,
        action: 'invitation_revoked',
        resource: 'invitation',
        resourceId: invitation.uuid,
        level: 'info',
        message: `Revoked invitation for ${invitation.email}`,
        metadata: {
          inviteeEmail: invitation.email,
          inviteeRole: invitation.role,
        },
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      },
    });

    return {
      success: true,
      message: 'Invitation revoked successfully',
    };
  });

  // Resend invitation email (Admin only)
  fastify.post('/:uuid/resend', {
    preHandler: [fastify.authenticate, fastify.requirePermission('users.invite.tenant')],
    schema: {
      tags: ['account.invitations'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);

    // Find invitation
    const invitation = await fastify.prisma.userInvitation.findFirst({
      where: {
        uuid,
        tenantId: request.user!.tenantId,
        status: 'pending',
      },
      include: {
        invitedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!invitation) {
      return reply.code(404).send({
        success: false,
        error: 'INVITATION_NOT_FOUND_OR_ALREADY_PROCESSED',
      });
    }

    // Generate new token
    const token = randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(token, 10);

    // Update invitation with new token and expiry
    await fastify.prisma.userInvitation.update({
      where: { tenantId: request.user.tenantId },
      data: {
        token: hashedToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // TODO: Resend invitation email
    // await emailService.sendInvitation({
    //   to: invitation.email,
    //   inviterName: `${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}`,
    //   invitationUrl: `${process.env.FRONTEND_URL}/accept-invitation?token=${token}`,
    //   message: invitation.message,
    // });

    // Log the resend
    await fastify.prisma.audit_logs.create({
      data: {
        userId: request.user!.id,
        tenantId: request.user!.tenantId,
        action: 'invitation_resent',
        resource: 'invitation',
        resourceId: invitation.uuid,
        level: 'info',
        message: `Resent invitation to ${invitation.email}`,
        metadata: {
          inviteeEmail: invitation.email,
        },
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      },
    });

    return {
      success: true,
      message: 'Invitation resent successfully',
    };
  });
};