import { PrismaClient } from '@prisma/client';
import { FastifyRedis } from '@fastify/redis';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import type { AuthUser, Session, TokenPair, JWTPayload, LoginResult } from './types';
import type { FastifyBaseLogger } from 'fastify';

interface AuthConfig {
  jwtPrivateKey?: string;
  jwtPublicKey?: string;
  jwtSecret?: string; // For simple HS256 signing
  jwtRefreshSecret: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
  bcryptRounds: number;
  sessionTimeout: number;
}

export class AuthService {
  private inMemorySessions: Map<string, Session> = new Map();
  private inMemoryRefreshTokens: Map<string, string> = new Map();
  private inMemoryUserSessions: Map<string, Set<string>> = new Map();
  private inMemoryUserCache: Map<string, { user: AuthUser; expiresAt: number }> = new Map();
  private tenantUuidCache: Map<number, string> = new Map(); // Cache for tenant ID -> UUID mapping

  constructor(
    private prisma: PrismaClient,
    private redis: FastifyRedis | null,
    private logger: FastifyBaseLogger,
    private config: AuthConfig
  ) {
    // Clean up in-memory caches periodically when Redis is not available
    if (!this.redis) {
      setInterval(() => this.cleanupInMemoryCache(), 60000); // Clean every minute
    }
  }

  async login(email: string, password: string, ipAddress: string, userAgent: string): Promise<LoginResult> {
    this.logger.info({ email, passwordProvided: !!password }, 'AuthService.login called');
    try {
      // Find account with users
      const account = await this.prisma.account.findUnique({
        where: { email },
        select: {
          id: true,
          tenant_id: true,
          email: true,
          password_hash: true,
          is_active: true,
          users: {
            select: {
              id: true,
              uuid: true,
              first_name: true,
              last_name: true,
              username: true,
              is_active: true
            }
          }
        }
      });

      if (!account) {
        this.logger.warn({ email }, 'Login attempt for non-existent account');
        throw new Error('Invalid credentials');
      }

      if (!account.password_hash) {
        this.logger.warn({ email, accountId: account.id }, 'Account has no password hash');
        throw new Error('Invalid credentials');
      }

      this.logger.info({ email, accountId: account.id, usersCount: account.users.length }, 'Account found for login');

      // Verify password
      this.logger.info({ email, passwordLength: password.length, hashLength: account.password_hash.length }, 'Attempting password verification');
      const isValid = await bcrypt.compare(password, account.password_hash);
      this.logger.info({ email, isValid }, 'Password verification result');
      
      if (!isValid) {
        this.logger.warn({ email, userId: account.users[0]?.uuid }, 'Invalid password attempt');
        throw new Error('Invalid credentials');
      }

      // Find active user for this account
      this.logger.info({ email, usersCount: account.users.length }, 'Looking for active user');
      const activeUser = account.users.find(user => user.is_active);
      if (!activeUser) {
        this.logger.warn({ email }, 'Login attempt for account with no active users');
        throw new Error('Account is disabled');
      }
      this.logger.info({ email, userId: activeUser.uuid }, 'Active user found');

      // Get user roles
      const userRoles = await this.prisma.userRole.findMany({
        where: { user_id: activeUser.id }
      });

      // Get role details
      const roleIds = userRoles.map(ur => ur.role_id);
      const roles = await this.prisma.role.findMany({
        where: { id: { in: roleIds } }
      });

      // Get permissions for all roles
      const rolePermissions = await this.prisma.rolePermission.findMany({
        where: { role_id: { in: roleIds } }
      });
      
      const permissionIds = rolePermissions.map(rp => rp.permission_id);
      const permissions = await this.prisma.permission.findMany({
        where: { id: { in: permissionIds } }
      });

      // Create session (pass tenant ID from account)
      this.logger.info({ email, userId: activeUser.uuid, tenantId: account.tenant_id }, 'Creating session');
      const session = await this.createSession(activeUser, ipAddress, userAgent, account.tenant_id);
      this.logger.info({ email, sessionId: session.id }, 'Session created');

      // Generate tokens
      this.logger.info({ email, sessionId: session.id }, 'Generating tokens');
      const tokens = await this.generateTokens(session);
      this.logger.info({ email, sessionId: session.id }, 'Tokens generated');

      // Build auth user (no internal IDs)
      this.logger.info({ email, userId: activeUser.uuid }, 'Building auth user');
      const authUser = {
        id: activeUser.uuid,
        uuid: activeUser.uuid,
        email: account.email,
        roles: roles.map(r => r.name),
        permissions: permissions.map(p => p.name),
        tenantId: account.tenant_id
      };
      this.logger.info({ email, userId: activeUser.uuid }, 'Auth user built');

      this.logger.info({ userId: activeUser.uuid, sessionId: session.id }, 'User logged in successfully');

      return { user: authUser, session, tokens };
    } catch (error) {
      this.logger.error({ email, error }, 'Login failed');
      throw error;
    }
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    try {
      // Verify refresh token
      const payload = jwt.verify(refreshToken, this.config.jwtRefreshSecret) as JWTPayload;
      
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Check if session exists
      const sessionKey = `session:${payload.sessionId}`;
      let sessionData: string | null = null;
      
      if (this.redis) {
        sessionData = await this.redis.get(sessionKey);
      } else {
        // Use in-memory storage when Redis is not available
        const session = this.inMemorySessions.get(payload.sessionId);
        if (session && session.expiresAt > new Date()) {
          sessionData = JSON.stringify(session);
        }
      }
      
      if (!sessionData) {
        this.logger.warn({ sessionId: payload.sessionId }, 'Refresh attempt for expired session');
        throw new Error('Session expired');
      }

      const session = JSON.parse(sessionData) as Session;
      
      // Check if refresh token matches
      let storedToken: string | null = null;
      if (this.redis) {
        storedToken = await this.redis.get(`temp:refresh:${session.id}`);
      } else {
        storedToken = this.inMemoryRefreshTokens.get(session.id) || null;
      }
      
      if (storedToken !== refreshToken) {
        this.logger.warn({ sessionId: session.id }, 'Invalid refresh token');
        throw new Error('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(session);
      
      // Rotate refresh token
      if (this.redis) {
        await this.redis.set(`temp:refresh:${session.id}`, tokens.refreshToken);
        await this.redis.expire(`temp:refresh:${session.id}`, 7 * 24 * 60 * 60); // 7 days
      } else {
        this.inMemoryRefreshTokens.set(session.id, tokens.refreshToken);
      }

      this.logger.info({ sessionId: session.id, userId: session.userId }, 'Tokens refreshed');

      return tokens;
    } catch (error) {
      this.logger.error({ error }, 'Token refresh failed');
      throw error;
    }
  }

  async logout(sessionId: string): Promise<void> {
    if (this.redis) {
      await this.redis.del(`temp:session:${sessionId}`);
      await this.redis.del(`temp:refresh:${sessionId}`);
      // Clean up from user sessions list using tenant UUID for consistency
      const sessionData = await this.redis.get(`temp:session:${sessionId}`);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        // Use tenant UUID if available (new format), fallback to ID (legacy)
        const tenantKey = session.tenantUuid || session.tenantId || 1;
        await this.redis.srem(`tenant:${tenantKey}:user:${session.userId}:sessions`, sessionId);
      }
    } else {
      // Clean up in-memory storage
      const session = this.inMemorySessions.get(sessionId);
      if (session) {
        this.inMemorySessions.delete(sessionId);
        this.inMemoryRefreshTokens.delete(sessionId);
        
        // Remove from user sessions
        const userSessions = this.inMemoryUserSessions.get(session.userId);
        if (userSessions) {
          userSessions.delete(sessionId);
          if (userSessions.size === 0) {
            this.inMemoryUserSessions.delete(session.userId);
          }
        }
      }
    }
    
    this.logger.info({ sessionId }, 'Session terminated');
  }

  async validateAccessToken(token: string): Promise<AuthUser> {
    try {
      // Verify JWT with the correct algorithm and key
      const secretOrKey = this.config.jwtPublicKey || this.config.jwtSecret || 'development-jwt-secret-key-only-for-dev';
      const algorithm = this.config.jwtPublicKey ? 'RS256' : 'HS256';
      
      const payload = jwt.verify(token, secretOrKey, {
        algorithms: [algorithm]
      }) as JWTPayload;

      if (payload.type !== 'access') {
        throw new Error('Invalid token type');
      }

      // Check session
      let sessionData: string | null = null;
      if (this.redis) {
        sessionData = await this.redis.get(`temp:session:${payload.sessionId}`);
      } else {
        // Use in-memory storage when Redis is not available
        const session = this.inMemorySessions.get(payload.sessionId);
        if (session && session.expiresAt > new Date()) {
          sessionData = JSON.stringify(session);
        }
      }
      
      if (!sessionData) {
        throw new Error('Session expired');
      }

      // Get cached user or load from DB
      return await this.getAuthUser(payload.sub);
    } catch (error) {
      this.logger.error({ error }, 'Token validation failed');
      throw error;
    }
  }

  private async createSession(user: any, ipAddress: string, userAgent: string, tenantId?: number): Promise<Session> {
    // Check concurrent sessions
    const userSessions = await this.getUserSessions(user.uuid);
    if (userSessions.length >= 5) {
      // Remove oldest session
      const oldest = userSessions.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )[0];
      await this.logout(oldest.id);
    }

    const session: Session = {
      id: randomUUID(),
      userId: user.uuid,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.config.sessionTimeout * 1000),
      ipAddress,
      userAgent,
      csrfToken: randomUUID() // Generate unique CSRF token for this session
    };

    // Store session
    if (this.redis) {
      // Get tenant ID and UUID (passed from login or fallback)
      const actualTenantId = tenantId || user.account?.tenantId || 1;
      const tenantUuid = await this.getTenantUuid(actualTenantId);
      
      // Store session with tenant info
      const sessionWithTenant = { ...session, tenantId: actualTenantId, tenantUuid };
      await this.redis.setex(
        `temp:session:${session.id}`,
        this.config.sessionTimeout,
        JSON.stringify(sessionWithTenant)
      );
      // Track user sessions with tenant UUID isolation for security
      await this.redis.sadd(`tenant:${tenantUuid}:user:${user.uuid}:sessions`, session.id);
    } else {
      // Use in-memory storage when Redis is not available
      this.inMemorySessions.set(session.id, session);
      
      // Track user sessions in memory
      if (!this.inMemoryUserSessions.has(user.uuid)) {
        this.inMemoryUserSessions.set(user.uuid, new Set());
      }
      this.inMemoryUserSessions.get(user.uuid)!.add(session.id);
    }

    return session;
  }

  private async getUserSessions(userId: string): Promise<Session[]> {
    let sessionIds: string[] = [];
    const sessions: Session[] = [];

    if (this.redis) {
      // Find user sessions across all tenants (supports both UUID and numeric keys)
      const sessionKeys = await this.redis.keys(`tenant:*:user:${userId}:sessions`);
      
      for (const key of sessionKeys) {
        const tenantSessionIds = await this.redis.smembers(key);
        sessionIds.push(...tenantSessionIds);
      }
      
      for (const sessionId of sessionIds) {
        const sessionData = await this.redis.get(`temp:session:${sessionId}`);
        if (sessionData) {
          sessions.push(JSON.parse(sessionData));
        } else {
          // Clean up invalid session reference from all tenant keys
          for (const key of sessionKeys) {
            await this.redis.srem(key, sessionId);
          }
        }
      }
    } else {
      // Use in-memory storage when Redis is not available
      const userSessions = this.inMemoryUserSessions.get(userId);
      if (userSessions) {
        for (const sessionId of userSessions) {
          const session = this.inMemorySessions.get(sessionId);
          if (session && session.expiresAt > new Date()) {
            sessions.push(session);
          } else {
            // Clean up expired session
            userSessions.delete(sessionId);
            this.inMemorySessions.delete(sessionId);
            this.inMemoryRefreshTokens.delete(sessionId);
          }
        }
        
        if (userSessions.size === 0) {
          this.inMemoryUserSessions.delete(userId);
        }
      }
    }

    return sessions;
  }

  private async generateTokens(session: Session): Promise<TokenPair> {
    // Access token (short-lived)
    const accessToken = jwt.sign(
      {
        sub: session.userId,
        sessionId: session.id,
        type: 'access'
      } as JWTPayload,
      this.config.jwtPrivateKey || this.config.jwtSecret || 'development-jwt-secret-key-only-for-dev',
      {
        algorithm: this.config.jwtPrivateKey ? 'RS256' : 'HS256',
        expiresIn: this.config.accessTokenExpiry
      }
    );

    // Refresh token (long-lived)
    const refreshToken = jwt.sign(
      {
        sub: session.userId,
        sessionId: session.id,
        type: 'refresh'
      } as JWTPayload,
      this.config.jwtRefreshSecret,
      {
        expiresIn: this.config.refreshTokenExpiry
      }
    );

    // Store refresh token
    if (this.redis) {
      await this.redis.setex(
        `temp:refresh:${session.id}`,
        7 * 24 * 60 * 60, // 7 days
        refreshToken
      );
    } else {
      // Store in memory when Redis is not available
      this.inMemoryRefreshTokens.set(session.id, refreshToken);
    }

    return { accessToken, refreshToken };
  }

  private buildAuthUser(user: any, email?: string, tenantId?: number): AuthUser {
    const permissions = new Set<string>();
    const roles: string[] = [];
    
    // Collect all permissions from roles
    if (user.userRole && Array.isArray(user.userRole)) {
      for (const ur of user.userRole) {
        if (ur.role) {
          roles.push(ur.role.name);
          if (ur.role.rolePermission) {
            for (const rolePerm of ur.role.rolePermission) {
              if (rolePerm.permission?.name) {
                permissions.add(rolePerm.permission.name);
              }
            }
          }
        }
      }
    }

    return {
      id: user.uuid, // Only UUID exposed
      uuid: user.uuid, // Same as id, for compatibility
      email: email || user.account?.email,
      roles: roles,
      permissions: Array.from(permissions),
      tenantId: tenantId || user.account?.tenantId || user.accountId
    };
  }

  private async getAuthUser(userUuid: string): Promise<AuthUser> {
    // Check cache first
    let cached: string | null = null;
    if (this.redis) {
      // Try to find user cache across tenants
      const userCacheKeys = await this.redis.keys(`tenant:*:user:${userUuid}:profile`);
      if (userCacheKeys.length > 0) {
        cached = await this.redis.get(userCacheKeys[0]);
      }
    } else {
      // Check in-memory cache
      const inMemoryCached = this.inMemoryUserCache.get(userUuid);
      if (inMemoryCached && inMemoryCached.expiresAt > Date.now()) {
        return inMemoryCached.user;
      } else if (inMemoryCached) {
        // Remove expired entry
        this.inMemoryUserCache.delete(userUuid);
      }
    }
    
    if (cached) {
      return JSON.parse(cached);
    }

    // Load from database
    // Use findFirst with uuid since it's unique but not a Prisma unique field
    const user = await this.prisma.user.findFirst({
      where: { uuid: userUuid },
      include: {
        Account: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get user roles
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId: user.id }
    });

    // Get role details
    const roleIds = userRoles.map(ur => ur.roleId);
    const roles = await this.prisma.role.findMany({
      where: { id: { in: roleIds } }
    });

    // Get permissions from roles
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId: { in: roleIds } }
    });
    
    // Get user-specific permissions
    const userPermissions = await this.prisma.userPermission.findMany({
      where: { 
        userId: user.id,
        granted: true,
        OR: [
          { validUntil: null },
          { validUntil: { gte: new Date() } }
        ]
      }
    });
    
    // Combine permission IDs from both sources
    const permissionIds = [
      ...rolePermissions.map(rp => rp.permissionId),
      ...userPermissions.map(up => up.permissionId)
    ];
    
    const permissions = await this.prisma.permission.findMany({
      where: { id: { in: permissionIds } }
    });

    const authUser = {
      id: user.uuid,
      uuid: user.uuid,
      email: user.Account?.email || '',
      roles: roles.map(r => r.name),
      permissions: permissions.map(p => p.name),
      tenantId: user.Account?.tenantId || 0
    };

    // Cache for 5 minutes using tenant UUID for consistency
    if (this.redis) {
      // Get tenant ID and UUID from auth user
      const tenantId = authUser.tenantId || user?.Account?.tenantId || 1;
      const tenantUuid = await this.getTenantUuid(tenantId);
      
      await this.redis.setex(
        `tenant:${tenantUuid}:user:${userUuid}:profile`,
        300,
        JSON.stringify(authUser)
      );
      
      this.logger.info('Cached user permissions', {
        userId: userUuid,
        permissionCount: authUser.permissions.length,
        roles: authUser.roles
      });
    } else {
      // Cache in memory when Redis is not available
      this.inMemoryUserCache.set(userUuid, {
        user: authUser,
        expiresAt: Date.now() + 300000 // 5 minutes
      });
    }

    return authUser;
  }

  async invalidateUserCache(userUuid: string): Promise<void> {
    if (this.redis) {
      // Delete user cache across all tenants
      const userCacheKeys = await this.redis.keys(`tenant:*:user:${userUuid}:*`);
      if (userCacheKeys.length > 0) {
        await this.redis.del(...userCacheKeys);
      }
    } else {
      // Remove from in-memory cache
      this.inMemoryUserCache.delete(userUuid);
    }
  }

  async revokeAllUserSessions(userUuid: string): Promise<void> {
    const sessions = await this.getUserSessions(userUuid);
    for (const session of sessions) {
      await this.logout(session.id);
    }
    
    if (this.redis) {
      // Delete user sessions across all tenants
      const sessionKeys = await this.redis.keys(`tenant:*:user:${userUuid}:sessions`);
      if (sessionKeys.length > 0) {
        await this.redis.del(...sessionKeys);
      }
    } else {
      // Clean up in-memory storage
      this.inMemoryUserSessions.delete(userUuid);
    }
  }

  /**
   * Get tenant UUID from tenant ID with caching
   * This enables consistent UUID-based Redis keys for better security
   */
  private async getTenantUuid(tenantId: number): Promise<string> {
    // Check cache first
    if (this.tenantUuidCache.has(tenantId)) {
      return this.tenantUuidCache.get(tenantId)!;
    }

    // Fetch from database
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { uuid: true }
    });

    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    // Cache the result
    this.tenantUuidCache.set(tenantId, tenant.uuid);
    return tenant.uuid;
  }

  private cleanupInMemoryCache(): void {
    const now = Date.now();
    
    // Clean up expired user cache entries
    for (const [userUuid, cached] of this.inMemoryUserCache.entries()) {
      if (cached.expiresAt <= now) {
        this.inMemoryUserCache.delete(userUuid);
      }
    }
    
    // Clean up expired sessions
    for (const [sessionId, session] of this.inMemorySessions.entries()) {
      if (session.expiresAt <= new Date()) {
        this.inMemorySessions.delete(sessionId);
        this.inMemoryRefreshTokens.delete(sessionId);
        
        // Remove from user sessions
        const userSessions = this.inMemoryUserSessions.get(session.userId);
        if (userSessions) {
          userSessions.delete(sessionId);
          if (userSessions.size === 0) {
            this.inMemoryUserSessions.delete(session.userId);
          }
        }
      }
    }
    
    this.logger.debug('In-memory cache cleanup completed');
  }
}