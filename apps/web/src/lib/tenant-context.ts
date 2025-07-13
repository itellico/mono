/**
 * Tenant Context Utilities
 * Wrapper for the platform tenant foundation functionality
 */

import { NextRequest } from 'next/server';
import { getTenantContext as getBaseTenantContext, TenantContext } from '@/lib/platform/tenant-foundation';
import { auth } from '@/lib/auth';
import { useAuth } from '@/contexts/auth-context';
import { logger } from '@/lib/logger';

/**
 * Get tenant context from request
 * Wrapper function that extracts tenant context compatible with API routes
 */
export async function getTenantContext(request?: NextRequest): Promise<TenantContext | null> {
  try {
    // For API routes, we primarily rely on the session-based tenant context
    // The request parameter is kept for compatibility but not strictly needed
    // as the base function already gets session data internally

    return await getBaseTenantContext();
  } catch (error) {
    logger.error({ err: error }, 'Failed to get tenant context');
    return null;
  }
}

/**
 * Extract tenant ID from request headers or session
 */
export async function extractTenantId(request: NextRequest): Promise<number | null> {
  try {
    // Try to get from X-Tenant-ID header first
    const headerTenantId = request.headers.get('X-Tenant-ID');
    if (headerTenantId) {
      const parsed = parseInt(headerTenantId);
      if (!isNaN(parsed)) return parsed;
    }

    // Fall back to session
    const session = await auth();
    return (session?.user as any)?.tenantId || null;
  } catch (error) {
    logger.error({ err: error }, 'Failed to extract tenant ID');
    return null;
  }
}

/**
 * Validate tenant access for API routes
 */
export async function validateTenantAccess(request: NextRequest, requiredTenantId?: number): Promise<boolean> {
  try {
    const tenantContext = await getTenantContext(request);
    if (!tenantContext) return false;

    if (requiredTenantId && tenantContext.id !== requiredTenantId) {
      return false;
    }

    return true;
  } catch (error) {
    logger.error({ err: error }, 'Failed to validate tenant access');
    return false;
  }
}

// Re-export types for convenience
export type { TenantContext } from '@/lib/platform/tenant-foundation';

export function getCurrentTenantId(): string | null {
  if (typeof window === 'undefined') {
    // Server-side: extract from headers, session, etc.
    return null;
  }

  const { user } = useAuth();
  return (user as any)?.tenantId || null;
} 