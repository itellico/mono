import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import bcrypt from 'bcryptjs';

/**
 * Public Authentication Routes
 * No authentication required for these endpoints
 */
export const publicAuthRoutes: FastifyPluginAsync = async (fastify) => {
  // Login endpoint
  fastify.post('/login', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '15 minutes'
      }
    },
    schema: {
      tags: ['public.auth'],
      summary: 'User login',
      description: 'Authenticate user and receive access tokens',
      body: Type.Object({
        email: Type.String({ format: 'email' }),
        password: Type.String({ minLength: 8 }),
        rememberMe: Type.Optional(Type.Boolean({ default: false })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            user: Type.Object({
              id: Type.String(),
              email: Type.String(),
              roles: Type.Array(Type.String()),
              permissions: Type.Array(Type.String()),
              tenantId: Type.Optional(Type.Number()),
            }),
            accessToken: Type.String(),
            refreshToken: Type.String(),
            expiresIn: Type.Number(),
          }),
        }),
        401: Type.Object({
          success: Type.Boolean(),
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
    async handler(request, reply) {
      const { email, password, rememberMe } = request.body;
      const ipAddress = request.ip || 'unknown';
      const userAgent = request.headers['user-agent'] || 'unknown';

      try {
        // Use the auth service for login
        const loginResult = await fastify.authService.login(
          email,
          password,
          ipAddress,
          userAgent
        );

        // Set HTTP-only cookies with cross-domain support
        const isDevelopment = process.env.NODE_ENV === 'development';
        const cookieOptions = {
          httpOnly: true,
          secure: !isDevelopment,
          sameSite: 'lax' as const,
          path: '/',
          // Enable cross-subdomain cookies
          domain: isDevelopment ? undefined : '.mono.com',
        };

        reply.setCookie('accessToken', loginResult.tokens.accessToken, {
          ...cookieOptions,
          maxAge: rememberMe ? 30 * 24 * 60 * 60 : 15 * 60, // 30 days or 15 minutes
        });

        reply.setCookie('refreshToken', loginResult.tokens.refreshToken, {
          ...cookieOptions,
          maxAge: rememberMe ? 90 * 24 * 60 * 60 : 7 * 24 * 60 * 60, // 90 days or 7 days
        });

        return {
          success: true,
          data: {
            user: loginResult.user,
            accessToken: loginResult.tokens.accessToken,
            refreshToken: loginResult.tokens.refreshToken,
            expiresIn: 900, // 15 minutes in seconds
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Login error');
        
        // Check for specific auth errors
        if (error instanceof Error) {
          if (error.message === 'Invalid credentials') {
            return reply.status(401).send({
              success: false,
              error: 'INVALID_CREDENTIALS',
              message: 'Invalid email or password',
            });
          }
          if (error.message === 'Account is disabled') {
            return reply.status(401).send({
              success: false,
              error: 'ACCOUNT_DISABLED',
              message: 'Your account has been disabled',
            });
          }
        }
        
        return reply.status(500).send({
          success: false,
          error: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred during login',
        });
      }
    },
  });

  // Logout endpoint
  fastify.post('/logout', {
    schema: {
      tags: ['public.auth'],
      summary: 'User logout',
      description: 'Logout user and clear authentication cookies',
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const isDevelopment = process.env.NODE_ENV === 'development';
      const cookieOptions = {
        httpOnly: true,
        secure: !isDevelopment,
        sameSite: 'lax' as const,
        path: '/',
        // Enable cross-subdomain cookie clearing
        domain: isDevelopment ? '.monolocal.com' : '.monoplatform.com',
      };

      // Clear authentication cookies
      reply.clearCookie('accessToken', cookieOptions);
      reply.clearCookie('refreshToken', cookieOptions);

      // TODO: Invalidate session in Redis/memory if token provided

      return {
        success: true,
        data: {
          message: 'Logged out successfully',
        },
      };
    },
  });

  // Register endpoint
  fastify.post('/register', {
    config: {
      rateLimit: {
        max: 3,
        timeWindow: '1 hour'
      }
    },
    schema: {
      tags: ['public.auth'],
      summary: 'User registration',
      description: 'Register a new user account',
      body: Type.Object({
        email: Type.String({ format: 'email' }),
        password: Type.String({ minLength: 8 }),
        name: Type.String({ minLength: 2 }),
        tenantCode: Type.Optional(Type.String()),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
            userId: Type.String(),
          }),
        }),
        400: Type.Object({
          success: Type.Boolean(),
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
    async handler(request, reply) {
      const { email, password, name, tenantCode } = request.body;

      try {
        // Check if account already exists
        const existingAccount = await fastify.prisma.account.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (existingAccount) {
          return reply.status(400).send({
            success: false,
            error: 'USER_EXISTS',
            message: 'A user with this email already exists',
          });
        }

        // Find tenant by code or use first active tenant
        let tenant;
        if (tenantCode) {
          tenant = await fastify.prisma.tenant.findFirst({
            where: { 
              OR: [
                { slug: tenantCode },
                { domain: tenantCode }
              ],
              is_active: true
            },
          });
        } else {
          // Use the first active tenant as default
          tenant = await fastify.prisma.tenant.findFirst({
            where: { is_active: true },
            orderBy: { id: 'asc' }
          });
        }

        if (!tenant) {
          return reply.status(400).send({
            success: false,
            error: 'INVALID_TENANT',
            message: 'Invalid tenant code or no active tenant found',
          });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create account and user in a transaction
        const result = await fastify.prisma.$transaction(async (tx) => {
          // Create account
          const account = await tx.account.create({
            data: {
              email: email.toLowerCase(),
              password_hash: hashedPassword,
              tenant_id: tenant.id,
              is_active: true,
              email_verified: false,
              updated_at: new Date(),
            },
          });

          // Parse name into firstName and lastName
          const nameParts = name.trim().split(' ');
          const firstName = nameParts[0] || 'User';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          // Generate username from email
          const emailPrefix = email.split('@')[0];
          const username = `${emailPrefix}${Date.now()}`;

          // Create user
          const user = await tx.user.create({
            data: {
              account_id: account.id,
              first_name: firstName,
              last_name: lastName,
              username,
              user_hash: crypto.randomUUID(),
              is_active: true,
              is_verified: false,
              updated_at: new Date(),
            },
          });

          // Assign default user role
          await tx.userRole.create({
            data: {
              user_id: user.id,
              role_id: 3, // Default user role
            },
          });

          return { account, user };
        });

        // TODO: Send verification email

        return reply.status(201).send({
          success: true,
          data: {
            message: 'Registration successful. Please check your email to verify your account.',
            userId: result.user.uuid,
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Registration error');
        return reply.status(500).send({
          success: false,
          error: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred during registration',
        });
      }
    },
  });

  // Refresh token endpoint
  fastify.post('/refresh', {
    schema: {
      tags: ['public.auth'],
      summary: 'Refresh access token',
      description: 'Get a new access token using refresh token',
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            accessToken: Type.String(),
            refreshToken: Type.String(),
            expiresIn: Type.Number(),
          }),
        }),
        401: Type.Object({
          success: Type.Boolean(),
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
    async handler(request, reply) {
      const refreshToken = request.cookies.refreshToken;

      if (!refreshToken) {
        return reply.status(401).send({
          success: false,
          error: 'NO_REFRESH_TOKEN',
          message: 'Refresh token not provided',
        });
      }

      try {
        // Use the auth service's refresh method
        const tokens = await fastify.authService.refresh(refreshToken);

        // Set new cookies
        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax' as const,
          path: '/',
        };

        reply.setCookie('accessToken', tokens.accessToken, {
          ...cookieOptions,
          maxAge: 15 * 60, // 15 minutes
        });

        reply.setCookie('refreshToken', tokens.refreshToken, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60, // 7 days
        });

        return {
          success: true,
          data: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: 900, // 15 minutes in seconds
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Token refresh error');
        return reply.status(401).send({
          success: false,
          error: 'INVALID_TOKEN',
          message: 'Invalid or expired refresh token',
        });
      }
    },
  });

  // Forgot password endpoint
  fastify.post('/forgot-password', {
    config: {
      rateLimit: {
        max: 3,
        timeWindow: '1 hour'
      }
    },
    schema: {
      tags: ['public.auth'],
      summary: 'Request password reset',
      description: 'Send password reset email',
      body: Type.Object({
        email: Type.String({ format: 'email' }),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { email } = request.body;

      // Always return success to prevent email enumeration
      try {
        const account = await fastify.prisma.account.findUnique({
          where: { email: email.toLowerCase() },
          include: {
            users: {
              where: { is_active: true },
              take: 1
            }
          }
        });

        if (account && account.is_active && account.users.length > 0) {
          // TODO: Generate reset token and send email
          request.log.info({ userId: account.users[0].uuid as UUID }, 'Password reset requested');
        }

        return {
          success: true,
          data: {
            message: 'If the email exists, a password reset link has been sent.',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Forgot password error');
        return {
          success: true,
          data: {
            message: 'If the email exists, a password reset link has been sent.',
          },
        };
      }
    },
  });

  // Reset password endpoint
  fastify.post('/reset-password', {
    schema: {
      tags: ['public.auth'],
      summary: 'Reset password',
      description: 'Reset password using token',
      body: Type.Object({
        token: Type.String(),
        password: Type.String({ minLength: 8 }),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
          }),
        }),
        400: Type.Object({
          success: Type.Boolean(),
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
    async handler(request, reply) {
      const { token, password } = request.body;

      try {
        // TODO: Verify reset token and update password
        
        return {
          success: true,
          data: {
            message: 'Password reset successful. You can now login with your new password.',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Password reset error');
        return reply.status(400).send({
          success: false,
          error: 'INVALID_TOKEN',
          message: 'Invalid or expired reset token',
        });
      }
    },
  });

  // Get current user endpoint
  fastify.get('/me', {
    schema: {
      tags: ['public.auth'],
      summary: 'Get current user',
      description: 'Get currently authenticated user info',
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            user: Type.Object({
              id: Type.String(),
              email: Type.String(),
              name: Type.Optional(Type.String()),
              roles: Type.Array(Type.String()),
              permissions: Type.Array(Type.String()),
              tenantId: Type.Optional(Type.Number()),
              accountId: Type.Optional(Type.Number()),
            }),
          }),
        }),
        401: Type.Object({
          success: Type.Boolean(),
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
    async handler(request, reply) {
      const accessToken = request.cookies.accessToken;

      if (!accessToken) {
        return reply.status(401).send({
          success: false,
          error: 'NO_TOKEN',
          message: 'Authentication required',
        });
      }

      try {
        // Use the auth service to validate the token properly
        const authUser = await fastify.authService.validateAccessToken(accessToken);
        
        return {
          success: true,
          data: {
            user: authUser,
          },
        };
      } catch (error) {
        return reply.status(401).send({
          success: false,
          error: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        });
      }
    },
  });

  // Verify email endpoint
  fastify.post('/verify-email', {
    schema: {
      tags: ['public.auth'],
      summary: 'Verify email address',
      description: 'Verify email using token',
      body: Type.Object({
        token: Type.String(),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
          }),
        }),
        400: Type.Object({
          success: Type.Boolean(),
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
    async handler(request, reply) {
      const { token } = request.body;

      try {
        // TODO: Verify email token and activate account
        
        return {
          success: true,
          data: {
            message: 'Email verified successfully. You can now login.',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Email verification error');
        return reply.status(400).send({
          success: false,
          error: 'INVALID_TOKEN',
          message: 'Invalid or expired verification token',
        });
      }
    },
  });

  // Get CSRF token endpoint
  fastify.get('/csrf-token', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['public.auth'],
      summary: 'Get CSRF token',
      description: 'Get CSRF token for the current session (cookie-based auth only)',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            csrfToken: Type.String(),
          }),
        }),
        401: Type.Object({
          success: Type.Boolean(),
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
    async handler(request, reply) {
      try {
        // Get session from Redis to fetch CSRF token
        const sessionKey = `session:${request.user!.uuid}`;
        const sessionData = await fastify.redis.get(sessionKey);
        
        if (!sessionData) {
          return reply.status(401).send({
            success: false,
            error: 'SESSION_NOT_FOUND',
            message: 'Session expired or not found',
          });
        }
        
        const session = JSON.parse(sessionData);
        
        if (!session.csrfToken) {
          return reply.status(401).send({
            success: false,
            error: 'CSRF_TOKEN_NOT_AVAILABLE',
            message: 'CSRF token not found in session',
          });
        }
        
        return {
          success: true,
          data: {
            csrfToken: session.csrfToken,
          },
        };
      } catch (error) {
        request.log.error({ error }, 'CSRF token retrieval error');
        return reply.status(500).send({
          success: false,
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve CSRF token',
        });
      }
    },
  });
};