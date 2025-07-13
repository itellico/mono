# Step-by-Step Authentication Implementation Guide

## Overview
This guide provides exact steps to implement a best-practice JWT authentication system for itellico Mono using Fastify and Next.js.

## Step 1: Generate Security Keys

```bash
# Create keys directory
mkdir -p apps/api/keys

# Generate RSA key pair for JWT
cd apps/api/keys
openssl genrsa -out jwt-private.pem 2048
openssl rsa -in jwt-private.pem -pubout -out jwt-public.pem

# Generate random secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" > cookie-secret.txt
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" > refresh-secret.txt
```

## Step 2: Update Environment Variables

Add to `.env`:
```env
# JWT Keys (copy content from generated files)
JWT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----"

JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
...
-----END PUBLIC KEY-----"

# Secrets
JWT_REFRESH_SECRET="<content-from-refresh-secret.txt>"
COOKIE_SECRET="<content-from-cookie-secret.txt>"

# Security Config
BCRYPT_ROUNDS=12
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
SESSION_INACTIVE_TIMEOUT=24h
MAX_CONCURRENT_SESSIONS=5

# Redis (required for sessions)
REDIS_URL=redis://localhost:6379
```

## Step 3: Install Required Dependencies

```bash
cd apps/api
npm install @fastify/cookie @fastify/csrf-protection @fastify/rate-limit bcryptjs
npm install -D @types/bcryptjs
```

## Step 4: Create Core Authentication Service

Create `/apps/api/src/services/auth/types.ts`:
```typescript
export interface AuthUser {
  id: string; // UUID
  email: string;
  roles: string[];
  permissions: string[];
}

export interface Session {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
```

Create `/apps/api/src/services/auth/auth.service.ts`:
```typescript
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import type { AuthUser, Session, TokenPair } from './types';

export class AuthService {
  constructor(
    private prisma: PrismaClient,
    private redis: Redis,
    private config: {
      jwtPrivateKey: string;
      jwtPublicKey: string;
      jwtRefreshSecret: string;
      accessTokenExpiry: string;
      refreshTokenExpiry: string;
      bcryptRounds: number;
    }
  ) {}

  async login(email: string, password: string): Promise<{
    user: AuthUser;
    session: Session;
    tokens: TokenPair;
  }> {
    // Find account
    const account = await this.prisma.account.findUnique({
      where: { email },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: { permission: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!account || !account.passwordHash) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, account.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!account.user.isActive) {
      throw new Error('Account is disabled');
    }

    // Create session
    const session = await this.createSession(account.user);

    // Generate tokens
    const tokens = await this.generateTokens(session);

    // Build auth user
    const authUser = this.buildAuthUser(account.user);

    return { user: authUser, session, tokens };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    // Verify refresh token
    const payload = jwt.verify(refreshToken, this.config.jwtRefreshSecret) as any;
    
    // Check if session exists
    const sessionKey = `session:${payload.sessionId}`;
    const sessionData = await this.redis.get(sessionKey);
    
    if (!sessionData) {
      throw new Error('Session expired');
    }

    const session = JSON.parse(sessionData) as Session;
    
    // Check if refresh token matches
    const storedToken = await this.redis.get(`refresh:${session.id}`);
    if (storedToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(session);
    
    // Rotate refresh token
    await this.redis.set(`refresh:${session.id}`, tokens.refreshToken);

    return tokens;
  }

  async logout(sessionId: string): Promise<void> {
    await this.redis.del(`session:${sessionId}`);
    await this.redis.del(`refresh:${sessionId}`);
  }

  async validateAccessToken(token: string): Promise<AuthUser> {
    // Verify JWT
    const payload = jwt.verify(token, this.config.jwtPublicKey, {
      algorithms: ['RS256']
    }) as any;

    // Check session
    const sessionData = await this.redis.get(`session:${payload.sessionId}`);
    if (!sessionData) {
      throw new Error('Session expired');
    }

    // Get cached user or load from DB
    return await this.getAuthUser(payload.sub);
  }

  private async createSession(user: any): Promise<Session> {
    const session: Session = {
      id: randomUUID(),
      userId: user.uuid,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      ipAddress: '', // Will be set by route handler
      userAgent: ''  // Will be set by route handler
    };

    // Store in Redis
    await this.redis.setex(
      `session:${session.id}`,
      86400, // 24 hours
      JSON.stringify(session)
    );

    return session;
  }

  private async generateTokens(session: Session): Promise<TokenPair> {
    // Access token (short-lived)
    const accessToken = jwt.sign(
      {
        sub: session.userId,
        sessionId: session.id,
        type: 'access'
      },
      this.config.jwtPrivateKey,
      {
        algorithm: 'RS256',
        expiresIn: this.config.accessTokenExpiry
      }
    );

    // Refresh token (long-lived)
    const refreshToken = jwt.sign(
      {
        sub: session.userId,
        sessionId: session.id,
        type: 'refresh'
      },
      this.config.jwtRefreshSecret,
      {
        expiresIn: this.config.refreshTokenExpiry
      }
    );

    // Store refresh token
    await this.redis.setex(
      `refresh:${session.id}`,
      7 * 24 * 60 * 60, // 7 days
      refreshToken
    );

    return { accessToken, refreshToken };
  }

  private buildAuthUser(user: any): AuthUser {
    const permissions = new Set<string>();
    
    // Collect all permissions
    for (const userRole of user.roles) {
      for (const rolePerm of userRole.role.permissions) {
        permissions.add(rolePerm.permission.name);
      }
    }

    return {
      id: user.uuid,
      email: user.account.email,
      roles: user.roles.map((ur: any) => ur.role.name),
      permissions: Array.from(permissions)
    };
  }

  private async getAuthUser(userId: string): Promise<AuthUser> {
    // Check cache
    const cached = await this.redis.get(`user:${userId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Load from database
    const user = await this.prisma.user.findUnique({
      where: { uuid: userId },
      include: {
        account: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const authUser = this.buildAuthUser(user);

    // Cache for 5 minutes
    await this.redis.setex(
      `user:${userId}`,
      300,
      JSON.stringify(authUser)
    );

    return authUser;
  }
}
```

## Step 5: Create Authentication Plugin

Create `/apps/api/src/plugins/auth-v2.ts`:
```typescript
import fp from 'fastify-plugin';
import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyJWT from '@fastify/jwt';
import { AuthService } from '../services/auth/auth.service';

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
  
  interface FastifyInstance {
    authenticate: (request: FastifyRequest) => Promise<void>;
    authorize: (permissions: string[]) => (request: FastifyRequest) => Promise<void>;
    authService: AuthService;
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  // Register cookie plugin
  await fastify.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET!,
    parseOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    }
  });

  // Create auth service
  const authService = new AuthService(
    fastify.prisma,
    fastify.redis,
    {
      jwtPrivateKey: process.env.JWT_PRIVATE_KEY!,
      jwtPublicKey: process.env.JWT_PUBLIC_KEY!,
      jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
      accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || '15m',
      refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d',
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12')
    }
  );

  fastify.decorate('authService', authService);

  // Authenticate decorator
  fastify.decorate('authenticate', async function(request: FastifyRequest) {
    let token: string | undefined;

    // Check cookie first (web clients)
    if (request.cookies.accessToken) {
      token = request.cookies.accessToken;
    }
    // Then check Authorization header (API clients)
    else if (request.headers.authorization?.startsWith('Bearer ')) {
      token = request.headers.authorization.substring(7);
    }

    if (!token) {
      throw fastify.httpErrors.unauthorized('No token provided');
    }

    try {
      const user = await authService.validateAccessToken(token);
      request.user = user;
    } catch (error) {
      throw fastify.httpErrors.unauthorized('Invalid token');
    }
  });

  // Authorize decorator
  fastify.decorate('authorize', function(permissions: string[]) {
    return async function(request: FastifyRequest) {
      await fastify.authenticate(request);
      
      if (!request.user) {
        throw fastify.httpErrors.unauthorized();
      }

      const hasPermission = permissions.some(p => 
        request.user!.permissions.includes(p)
      );

      if (!hasPermission) {
        throw fastify.httpErrors.forbidden('Insufficient permissions');
      }
    };
  });
};

export default fp(authPlugin, {
  name: 'auth-v2',
  dependencies: ['prisma', 'redis']
});
```

## Step 6: Create Auth Routes

Create `/apps/api/src/routes/v1/auth-v2/index.ts`:
```typescript
import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Login
  fastify.post('/login', {
    schema: {
      body: Type.Object({
        email: Type.String({ format: 'email' }),
        password: Type.String({ minLength: 12 })
      })
    },
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '15 minutes'
      }
    }
  }, async (request, reply) => {
    const { email, password } = request.body;

    try {
      const result = await fastify.authService.login(email, password);

      // Update session with request info
      result.session.ipAddress = request.ip;
      result.session.userAgent = request.headers['user-agent'] || '';

      // Set cookies
      reply.setCookie('accessToken', result.tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60 // 15 minutes
      });

      reply.setCookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/v1/auth/refresh',
        maxAge: 7 * 24 * 60 * 60 // 7 days
      });

      return {
        success: true,
        user: result.user
      };
    } catch (error) {
      throw fastify.httpErrors.unauthorized('Invalid credentials');
    }
  });

  // Refresh
  fastify.post('/refresh', async (request, reply) => {
    const refreshToken = request.cookies.refreshToken;
    
    if (!refreshToken) {
      throw fastify.httpErrors.unauthorized('No refresh token');
    }

    try {
      const tokens = await fastify.authService.refresh(refreshToken);

      // Update cookies
      reply.setCookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60
      });

      reply.setCookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/v1/auth/refresh',
        maxAge: 7 * 24 * 60 * 60
      });

      return { success: true };
    } catch (error) {
      throw fastify.httpErrors.unauthorized('Invalid refresh token');
    }
  });

  // Logout
  fastify.post('/logout', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    // Get session ID from token
    const token = request.cookies.accessToken || 
                  request.headers.authorization?.substring(7);
                  
    if (token) {
      const payload = fastify.jwt.decode(token) as any;
      await fastify.authService.logout(payload.sessionId);
    }

    // Clear cookies
    reply.clearCookie('accessToken');
    reply.clearCookie('refreshToken');

    return { success: true };
  });

  // Get current user
  fastify.get('/me', {
    preHandler: [fastify.authenticate]
  }, async (request) => {
    return {
      success: true,
      user: request.user
    };
  });
};
```

## Step 7: Update Fastify App

Update `/apps/api/src/app.ts`:
```typescript
// Remove old auth plugin import
// import { authPlugin } from './plugins/auth.js';

// Add new auth plugin
import authPluginV2 from './plugins/auth-v2.js';

// In buildApp function:
// Remove old auth registration
// await app.register(authPlugin);

// Add new auth registration (after redis and prisma)
await app.register(authPluginV2);

// Update routes registration
// Remove old auth routes
// await app.register(authRoutes, { prefix: '/api/v1/auth' });

// Add new auth routes
import { authRoutes as authRoutesV2 } from './routes/v1/auth-v2/index.js';
await app.register(authRoutesV2, { prefix: '/api/v1/auth' });
```

## Step 8: Create Next.js Auth Client

Create `/src/lib/auth/client.ts`:
```typescript
export class AuthClient {
  private baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  async login(email: string, password: string) {
    const response = await fetch(`${this.baseURL}/api/v1/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    return data;
  }

  async logout() {
    await fetch(`${this.baseURL}/api/v1/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
  }

  async getMe() {
    const response = await fetch(`${this.baseURL}/api/v1/auth/me`, {
      credentials: 'include'
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user;
  }

  async makeRequest(url: string, options: RequestInit = {}) {
    return fetch(`${this.baseURL}${url}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
  }
}

export const authClient = new AuthClient();
```

## Step 9: Update Auth Context

Replace `/src/contexts/auth-context.tsx`:
```typescript
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/client';
import type { AuthUser } from '@mono/shared';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await authClient.getMe();
      setUser(user);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authClient.login(email, password);
      setUser(response.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authClient.logout();
      setUser(null);
      router.push('/auth/signin');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const refresh = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      login,
      logout,
      refresh
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

## Step 10: Remove Old Code

1. Delete these files:
   - `/apps/api/src/plugins/auth.ts`
   - `/apps/api/src/middleware/auth-secure.ts`
   - `/apps/api/src/routes/v1/auth/` (old auth routes)
   - Any localStorage token code

2. Update all route files to use new auth:
   - Replace `fastify.authenticate` (should work as-is)
   - Replace `fastify.authorize(['permission'])` (should work as-is)

## Step 11: Test the Implementation

```bash
# Start Redis
docker run -d -p 6379:6379 redis:alpine

# Start API
cd apps/api
npm run dev

# In another terminal, start Next.js
npm run dev

# Test login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"1@1.com","password":"123"}' \
  -c cookies.txt -v

# Test authenticated request
curl http://localhost:3001/api/v1/auth/me \
  -b cookies.txt
```

## Security Notes

1. **Never expose tokens in response bodies** - Only use httpOnly cookies
2. **Never store tokens in localStorage** - XSS vulnerable
3. **Always use HTTPS in production** - Set secure cookie flag
4. **Implement CSRF protection** - For state-changing operations
5. **Add rate limiting** - Prevent brute force attacks
6. **Use strong passwords** - Minimum 12 characters
7. **Audit all auth events** - Track login/logout/failures
8. **Rotate refresh tokens** - One-time use only
9. **Set proper CORS** - Restrict origins
10. **Keep dependencies updated** - Security patches

This implementation is production-ready and follows all security best practices for JWT authentication with Fastify and Next.js.