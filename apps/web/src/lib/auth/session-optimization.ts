/**
 * Session Optimization Utilities
 * 
 * Provides utilities to optimize session size and manage server-side session data
 */

import { LeanSession, LegacySession, HydratedSession, ServerSessionData } from './session-types';
import { SessionCacheService } from '@/lib/services/session-cache.service';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

/**
 * Configuration for session optimization
 */
export const SESSION_CONFIG = {
  useLeanSessions: process.env.FEATURE_LEAN_SESSIONS === 'true',
  serverDataCacheTTL: parseInt(process.env.SESSION_CACHE_TTL || '1800'), // 30 minutes
  enableServerDataCache: process.env.REDIS_ENABLED?.toLowerCase() === 'true' || process.env.NODE_ENV === 'development'
};

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Convert legacy session to lean session
 */
export function convertToLeanSession(legacySession: LegacySession): LeanSession {
  const roles: string[] = [];
  
  // Extract roles from legacy session
  if (legacySession.user.adminRole?.roleType) {
    roles.push(legacySession.user.adminRole.roleType);
  }
  if (legacySession.user.enhancedRole?.roleType) {
    roles.push(legacySession.user.enhancedRole.roleType);
  }
  
  // Remove duplicates
  const uniqueRoles = [...new Set(roles)];
  
  return {
    user: {
      id: legacySession.user.id,
      email: legacySession.user.email,
      name: legacySession.user.name,
      tenantId: legacySession.user.tenantId,
      roles: uniqueRoles,
      sessionId: generateSessionId()
    },
    expires: legacySession.expires
  };
}

/**
 * Hydrate lean session with server-side data
 */
export async function hydrateSession(leanSession: LeanSession): Promise<HydratedSession> {
  if (!SESSION_CONFIG.enableServerDataCache) {
    logger.info('Server data cache disabled, returning lean session only');
    return leanSession;
  }

  try {
    // Try to get cached server data
    let serverData = await SessionCacheService.getServerSessionData(leanSession.user.sessionId);
    
    if (!serverData) {
      // Cache miss - fetch and cache server data
      logger.info('Session cache miss, fetching server data', { 
        sessionId: leanSession.user.sessionId,
        userId: leanSession.user.id 
      });
      
      await SessionCacheService.setServerSessionData(
        leanSession.user.sessionId,
        leanSession.user.id,
        leanSession.user.tenantId,
        SESSION_CONFIG.serverDataCacheTTL
      );
      
      // Try to get it again
      serverData = await SessionCacheService.getServerSessionData(leanSession.user.sessionId);
    }

    return {
      ...leanSession,
      serverData: serverData || undefined
    };
  } catch (error) {
    logger.error('Failed to hydrate session', { error, sessionId: leanSession.user.sessionId });
    return leanSession;
  }
}

/**
 * Get session data for components (handles both lean and legacy)
 */
export async function getSessionData(session: any): Promise<HydratedSession> {
  if (!session?.user) {
    throw new Error('No session provided');
  }

  // Check if it's already a lean session
  if (isLeanSession(session)) {
    return await hydrateSession(session);
  }

  // Convert legacy session to lean and hydrate
  if (SESSION_CONFIG.useLeanSessions) {
    const leanSession = convertToLeanSession(session);
    return await hydrateSession(leanSession);
  }

  // Return legacy session as-is (for backward compatibility)
  return session;
}

/**
 * Check if session is already lean
 */
function isLeanSession(session: any): session is LeanSession {
  return session?.user?.sessionId !== undefined && 
         session?.user?.roles !== undefined &&
         !session?.user?.adminRole &&
         !session?.user?.enhancedRole;
}

/**
 * Invalidate session cache when user data changes
 */
export async function invalidateSessionCache(userId: string, sessionId?: string): Promise<void> {
  if (sessionId) {
    await SessionCacheService.invalidateServerSessionData(sessionId);
  }
  
  logger.info('Session cache invalidated for user', { userId, sessionId });
}

/**
 * Get session size estimate (for debugging)
 */
export function getSessionSizeEstimate(session: any): { 
  sizeBytes: number; 
  isOverLimit: boolean; 
  recommendation: string 
} {
  const sessionString = JSON.stringify(session);
  const sizeBytes = Buffer.byteLength(sessionString, 'utf8');
  const isOverLimit = sizeBytes > 4000; // 4KB limit for cookies
  
  let recommendation = 'Session size is optimal';
  if (isOverLimit) {
    recommendation = 'Session is too large - consider enabling lean sessions';
  }
  
  return {
    sizeBytes,
    isOverLimit,
    recommendation
  };
}

/**
 * Extract essential permissions for lean session
 */
export function extractEssentialPermissions(enhancedPermissions: any[]): string[] {
  if (!Array.isArray(enhancedPermissions)) {
    return [];
  }
  
  // Only keep the most critical permissions in the session
  const essentialActions = ['read', 'write', 'admin', 'super_admin'];
  
  return enhancedPermissions
    .filter(p => essentialActions.includes(p.action))
    .map(p => `${p.action}:${p.resource}`)
    .slice(0, 10); // Limit to 10 most important permissions
} 