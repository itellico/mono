import fp from 'fastify-plugin';
import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyJWT from '@fastify/jwt';
import { AuthService } from '../services/auth/auth.service';
import type { AuthUser } from '../services/auth/types';

declare module 'fastify' {
  interface FastifyRequest {
    tenantId?: number;
    tenant?: any;
    permissions?: string[];
  }
  
  interface FastifyInstance {
    authenticate: (request: FastifyRequest) => Promise<void>;
    authorize: (permissions: string[]) => (request: FastifyRequest) => Promise<void>;
    requirePermission: (permission: string) => (request: FastifyRequest) => Promise<void>;
    hasPermission: (user: AuthUser, permission: string) => boolean;
    verifyAdmin: (request: FastifyRequest) => Promise<void>;
    verifySuperAdmin: (request: FastifyRequest) => Promise<void>;
    authService: AuthService;
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  // Register JWT plugin for decoding tokens
  // Use RSA keys if available, otherwise fallback to simple secret
  const useRSA = process.env.JWT_PRIVATE_KEY && process.env.JWT_PUBLIC_KEY;
  
  if (useRSA) {
    await fastify.register(fastifyJWT, {
      secret: {
        private: process.env.JWT_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        public: process.env.JWT_PUBLIC_KEY!.replace(/\\n/g, '\n')
      },
      sign: { algorithm: 'RS256' },
      verify: { algorithms: ['RS256'] }
    });
  } else {
    // Use simple secret for development
    await fastify.register(fastifyJWT, {
      secret: process.env.JWT_SECRET || 'development-jwt-secret-key-only-for-dev',
      sign: { algorithm: 'HS256' },
      verify: { algorithms: ['HS256'] }
    });
  }

  // Cookie plugin is registered in app.ts

  // Create auth service
  const authService = new AuthService(
    fastify.prisma,
    fastify.redis || null,  // Redis is optional
    fastify.log,
    {
      jwtPrivateKey: useRSA ? process.env.JWT_PRIVATE_KEY!.replace(/\\n/g, '\n') : undefined,
      jwtPublicKey: useRSA ? process.env.JWT_PUBLIC_KEY!.replace(/\\n/g, '\n') : undefined,
      jwtSecret: !useRSA ? (process.env.JWT_SECRET || 'development-jwt-secret-key-only-for-dev') : undefined,
      jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'development-jwt-refresh-secret-key-only-for-dev',
      accessTokenExpiry: process.env.JWT_EXPIRES_IN || '7d',
      refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '86400')
    }
  );

  fastify.decorate('authService', authService);

  // Authenticate decorator
  fastify.decorate('authenticate', async function(request: FastifyRequest) {
    let token: string | undefined;

    // Check cookie first (web clients)
    if (request.cookies.accessToken) {
      token = request.cookies.accessToken;
      fastify.log.debug({ source: 'cookie' }, 'Token found in cookie');
    }
    // Then check Authorization header (API clients)
    else if (request.headers.authorization?.startsWith('Bearer ')) {
      token = request.headers.authorization.substring(7);
      fastify.log.debug({ source: 'header' }, 'Token found in header');
    }

    if (!token) {
      throw fastify.httpErrors.unauthorized('No token provided');
    }

    try {
      const user = await authService.validateAccessToken(token);
      (request as any).user = user;
      fastify.log.debug({ 
        userId: user.id, 
        uuid: user.uuid,
        roles: user.roles,
        permissionCount: user.permissions?.length || 0
      }, 'User authenticated');
    } catch (error: any) {
      fastify.log.error({ error: error.message, token: token.substring(0, 20) + '...' }, 'Token validation failed');
      throw fastify.httpErrors.unauthorized('Invalid token');
    }
  });

  // Authorize decorator - check if user has any of the required permissions
  fastify.decorate('authorize', function(permissions: string[]) {
    return async function(request: FastifyRequest) {
      await fastify.authenticate(request);
      
      const user = (request as any).user as AuthUser;
      if (!user) {
        throw fastify.httpErrors.unauthorized();
      }

      const hasPermission = permissions.some(p => 
        user.permissions.includes(p)
      );

      if (!hasPermission) {
        fastify.log.warn({
          userId: user.id,
          requiredPermissions: permissions,
          userPermissions: user.permissions
        }, 'Authorization failed');
        
        throw fastify.httpErrors.forbidden('Insufficient permissions');
      }
    };
  });

  // Require specific permission with wildcard and format support
  fastify.decorate('requirePermission', function(permission: string) {
    return async function(request: FastifyRequest) {
      await fastify.authenticate(request);
      
      const user = (request as any).user as AuthUser;
      if (!user) {
        throw fastify.httpErrors.unauthorized();
      }

      // Super admin bypass - they have all permissions
      if (user.roles.some(role => 
        role.toLowerCase().includes('super') && role.toLowerCase().includes('admin')
      )) {
        return;
      }

      // Check for global wildcard permission
      if (user.permissions.includes('*')) {
        return;
      }

      // Check exact permission
      let hasPermission = user.permissions.includes(permission);

      // If not found, try wildcard matching
      if (!hasPermission) {
        // Convert colon format to dot format for comparison
        const colonParts = permission.split(':');
        if (colonParts.length === 2) {
          const [resource, action] = colonParts;
          
          // Check for exact dot format permission
          hasPermission = user.permissions.some(p => {
            // Check for manage permissions that include the requested action
            if (p.startsWith(`${resource}.manage`) || p.startsWith(`${resource}.*`)) {
              return true;
            }
            // Check for exact action match in dot format
            return p.startsWith(`${resource}.${action}`);
          });

          // Check for wildcard permissions
          if (!hasPermission) {
            hasPermission = user.permissions.some(p => {
              // Check for global wildcard
              if (p === 'admin.*' || p === 'platform.*.global') {
                return true;
              }
              // Check for resource wildcard
              if (p === `${resource}.*` || p.startsWith(`${resource}.*.`)) {
                return true;
              }
              return false;
            });
          }
        }
      }

      if (!hasPermission) {
        fastify.log.warn({
          userId: user.id,
          requiredPermission: permission,
          userPermissions: user.permissions
        }, 'Permission check failed');
        
        throw fastify.httpErrors.forbidden(`Permission '${permission}' required`);
      }
    };
  });

  // Permission checker function (non-throwing)
  fastify.decorate('hasPermission', function(user: AuthUser, permission: string): boolean {
    if (!user || !user.permissions) {
      return false;
    }

    // Super admin bypass - they have all permissions
    if (user.roles.includes('super_admin')) {
      return true;
    }

    // Check exact permission
    if (user.permissions.includes(permission)) {
      return true;
    }

    // Try wildcard matching with colon format support
    const colonParts = permission.split(':');
    if (colonParts.length === 2) {
      const [resource, action] = colonParts;
      
      // Check for exact dot format permission
      const hasPermission = user.permissions.some(p => {
        // Check for manage permissions that include the requested action
        if (p.startsWith(`${resource}.manage`) || p.startsWith(`${resource}.*`)) {
          return true;
        }
        // Check for exact action match in dot format
        return p.startsWith(`${resource}.${action}`);
      });

      if (hasPermission) {
        return true;
      }

      // Check for wildcard permissions
      return user.permissions.some(p => {
        // Check for global wildcard
        if (p === 'admin.*' || p === 'platform.*.global') {
          return true;
        }
        // Check for resource wildcard
        if (p === `${resource}.*` || p.startsWith(`${resource}.*.`)) {
          return true;
        }
        return false;
      });
    }

    return false;
  });

  // Verify admin decorator
  fastify.decorate('verifyAdmin', async function(request: FastifyRequest) {
    await fastify.authenticate(request);
    
    const user = (request as any).user as AuthUser;
    if (!user) {
      throw fastify.httpErrors.unauthorized();
    }

    const isAdmin = user.roles.some(role => 
      ['admin', 'super_admin', 'tenant_admin', 'content_moderator'].includes(role.toLowerCase())
    );

    if (!isAdmin) {
      fastify.log.warn({
        userId: user.id,
        userRoles: user.roles
      }, 'Admin access denied');
      
      throw fastify.httpErrors.forbidden('Admin access required');
    }
  });

  // Verify super admin decorator
  fastify.decorate('verifySuperAdmin', async function(request: FastifyRequest) {
    await fastify.authenticate(request);
    
    const user = (request as any).user as AuthUser;
    if (!user) {
      throw fastify.httpErrors.unauthorized();
    }

    const isSuperAdmin = user.roles.some(role => 
      role.toLowerCase() === 'super_admin'
    );

    if (!isSuperAdmin) {
      fastify.log.warn({
        userId: user.id,
        userRoles: user.roles
      }, 'Super admin access denied');
      
      throw fastify.httpErrors.forbidden('Super admin access required');
    }
  });

  // CSRF Protection for cookie-based auth
  fastify.addHook('preHandler', async (request, reply) => {
    // Skip for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return;
    }

    // Skip if using Bearer token (API clients)
    if (request.headers.authorization?.startsWith('Bearer ')) {
      return;
    }

    // Skip auth routes themselves (both old and new 4-tier structure)
    if (request.url.startsWith('/api/v1/auth/') || request.url.startsWith('/api/v1/public/auth/')) {
      return;
    }

    // If using cookie auth, verify CSRF token
    if (request.cookies.accessToken) {
      const csrfToken = request.headers['x-csrf-token'] as string;
      
      if (!csrfToken) {
        throw fastify.httpErrors.forbidden('CSRF token required');
      }

      // Implement proper CSRF validation for cookie-based authentication
      try {
        // Generate or retrieve CSRF token from session
        const user = (request as any).user as AuthUser;
        const sessionKey = `session:${user.uuid}`;
        const sessionData = await fastify.redis.get(sessionKey);
        
        if (!sessionData) {
          throw fastify.httpErrors.forbidden('Session expired, CSRF token invalid');
        }
        
        const session = JSON.parse(sessionData);
        const expectedCsrfToken = session.csrfToken;
        
        if (!expectedCsrfToken || csrfToken !== expectedCsrfToken) {
          fastify.log.warn({
            userId: user.id,
            providedToken: csrfToken?.substring(0, 8) + '...',
            expectedToken: expectedCsrfToken?.substring(0, 8) + '...'
          }, 'CSRF token mismatch');
          
          throw fastify.httpErrors.forbidden('Invalid CSRF token');
        }
        
        fastify.log.debug({ userId: user.id }, 'CSRF token validated successfully');
      } catch (error: any) {
        if (error.statusCode) {
          throw error; // Re-throw HTTP errors
        }
        
        fastify.log.error({ error: error.message }, 'CSRF validation error');
        throw fastify.httpErrors.forbidden('CSRF validation failed');
      }
    }
  });
};

export default fp(authPlugin, {
  name: 'auth-v2',
  dependencies: ['prisma', '@fastify/cookie']
});