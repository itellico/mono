
// ✅ ARCHITECTURE COMPLIANCE: Removed direct database imports
// import { db } from '@/lib/db'; // ❌ FORBIDDEN: Direct database access
import { SubscriptionLimits } from '@/lib/schemas/limits';
import { ApiAuthService } from '@/lib/api-clients/api-auth.service';
import { logger } from '@/lib/logger';

/**
 * ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
 * Limits Service Layer - Proxy to Account Billing API
 */

export async function getSubscriptionLimits(planId: string): Promise<SubscriptionLimits | null> {
  try {
    logger.info('Fetching subscription limits from NestJS API', { planId });
    
    // Use the account billing limits endpoint
    const limits = await ApiAuthService.makeAuthenticatedRequest<SubscriptionLimits>('/account/billing/limits');
    
    if (!limits) {
      logger.warn('Failed to fetch subscription limits from API', { planId });
      return null;
    }
    
    return limits;
  } catch (error) {
    logger.error('Error fetching subscription limits', { planId, error });
    throw error;
  }
}
