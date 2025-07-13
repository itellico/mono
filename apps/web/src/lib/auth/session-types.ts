/**
 * Session Types for itellico Mono
 * 
 * Optimized session structure to reduce cookie size from 6KB+ to <1KB
 */

export interface LeanSession {
  user: {
    id: string;
    email: string;
    name: string;
    tenantId: string;
    roles: string[];
    sessionId: string;
  };
  expires: string;
}

export interface LegacySession {
  user: {
    id: string;
    email: string;
    name: string;
    tenantId: string;
    adminRole?: any;
    enhancedRole?: any;
    enhancedPermissions?: any[];
    // ... other legacy fields
  };
  expires: string;
}

/**
 * Server-side session data stored in Redis/database
 */
export interface ServerSessionData {
  userId: string;
  tenantId: string;
  permissions: string[];
  enhancedRole: {
    id: string;
    roleType: string;
    displayName: string;
    isActive: boolean;
    tenantId: number | null;
  };
  enhancedPermissions: Array<{
    id: string;
    action: string;
    resource: string;
    scope: string;
    conditions: any;
  }>;
  lastUpdated: Date;
  expiresAt: Date;
}

/**
 * Combined session data for components
 */
export interface HydratedSession extends LeanSession {
  serverData?: ServerSessionData;
}

/**
 * Session optimization configuration
 */
export interface SessionConfig {
  useLeanSessions: boolean;
  serverDataCacheTTL: number; // seconds
  enableServerDataCache: boolean;
} 