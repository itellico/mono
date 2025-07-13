
// ✅ ARCHITECTURE COMPLIANCE: Removed direct database imports
// import { db } from '@/lib/db'; // ❌ FORBIDDEN: Direct database access
// import { features } from '@/lib/schemas/subscriptions'; // ❌ FORBIDDEN: Direct database schemas
// import { eq } from 'drizzle-orm'; // ❌ FORBIDDEN: Direct database queries

import { FeaturesApiService } from '@/lib/api-clients/features-api.service';
import { logger } from '@/lib/logger';

/**
 * ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
 * Features Service Layer - Proxy to Features API Client
 */

export async function getFeatures() {
  try {
    logger.info('Fetching features from NestJS API');
    const result = await FeaturesApiService.getFeatures();
    
    if (!result) {
      logger.warn('Failed to fetch features from API');
      return [];
    }
    
    return result.items;
  } catch (error) {
    logger.error('Error fetching features', { error });
    throw error;
  }
}

export async function getFeature(id: string) {
  try {
    logger.info('Fetching feature from NestJS API', { featureId: id });
    const feature = await FeaturesApiService.getFeature(id);
    
    if (!feature) {
      logger.warn('Feature not found', { featureId: id });
      return null;
    }
    
    return feature;
  } catch (error) {
    logger.error('Error fetching feature', { featureId: id, error });
    throw error;
  }
}

export async function createFeature(featureData: any) {
  try {
    logger.info('Creating feature via NestJS API', { name: featureData.name });
    const feature = await FeaturesApiService.createFeature(featureData);
    
    if (!feature) {
      throw new Error('Failed to create feature via API');
    }
    
    return [feature]; // Return array to match original interface
  } catch (error) {
    logger.error('Error creating feature', { featureData, error });
    throw error;
  }
}

export async function updateFeature(id: string, featureData: any) {
  try {
    logger.info('Updating feature via NestJS API', { featureId: id });
    const feature = await FeaturesApiService.updateFeature(id, featureData);
    
    if (!feature) {
      throw new Error('Failed to update feature via API');
    }
    
    return [feature]; // Return array to match original interface
  } catch (error) {
    logger.error('Error updating feature', { featureId: id, featureData, error });
    throw error;
  }
}

export async function deleteFeature(id: string) {
  try {
    logger.info('Deleting feature via NestJS API', { featureId: id });
    const success = await FeaturesApiService.deleteFeature(id);
    
    if (!success) {
      throw new Error('Failed to delete feature via API');
    }
    
    return [{ id }]; // Return array to match original interface
  } catch (error) {
    logger.error('Error deleting feature', { featureId: id, error });
    throw error;
  }
}
