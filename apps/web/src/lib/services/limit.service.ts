
// ✅ ARCHITECTURE COMPLIANCE: Removed direct database imports
// import { db } from '@/lib/db'; // ❌ FORBIDDEN: Direct database access
// import { limits } from '@/lib/schemas/subscriptions'; // ❌ FORBIDDEN: Direct database schemas
// import { eq } from 'drizzle-orm'; // ❌ FORBIDDEN: Direct database queries

import { LimitsApiService } from '@/lib/api-clients/limits-api.service';
import { logger } from '@/lib/logger';

/**
 * ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
 * Limits Service Layer - Proxy to Limits API Client
 */

export async function getLimits() {
  try {
    logger.info('Fetching limits from NestJS API');
    const limits = await LimitsApiService.getLimits();
    
    if (!limits) {
      logger.warn('Failed to fetch limits from API');
      return [];
    }
    
    return limits;
  } catch (error) {
    logger.error('Error fetching limits', { error });
    throw error;
  }
}

export async function getLimit(id: string) {
  try {
    logger.info('Fetching limit from NestJS API', { limitId: id });
    const limit = await LimitsApiService.getLimit(id);
    
    if (!limit) {
      logger.warn('Limit not found', { limitId: id });
      return null;
    }
    
    return limit;
  } catch (error) {
    logger.error('Error fetching limit', { limitId: id, error });
    throw error;
  }
}

export async function createLimit(limitData: any) {
  try {
    logger.info('Creating limit via NestJS API', { name: limitData.name });
    const limit = await LimitsApiService.createLimit(limitData);
    
    if (!limit) {
      throw new Error('Failed to create limit via API');
    }
    
    return [limit]; // Return array to match original interface
  } catch (error) {
    logger.error('Error creating limit', { limitData, error });
    throw error;
  }
}

export async function updateLimit(id: string, limitData: any) {
  try {
    logger.info('Updating limit via NestJS API', { limitId: id });
    const limit = await LimitsApiService.updateLimit(id, limitData);
    
    if (!limit) {
      throw new Error('Failed to update limit via API');
    }
    
    return [limit]; // Return array to match original interface
  } catch (error) {
    logger.error('Error updating limit', { limitId: id, limitData, error });
    throw error;
  }
}

export async function deleteLimit(id: string) {
  try {
    logger.info('Deleting limit via NestJS API', { limitId: id });
    const success = await LimitsApiService.deleteLimit(id);
    
    if (!success) {
      throw new Error('Failed to delete limit via API');
    }
    
    return [{ id }]; // Return array to match original interface
  } catch (error) {
    logger.error('Error deleting limit', { limitId: id, error });
    throw error;
  }
}
