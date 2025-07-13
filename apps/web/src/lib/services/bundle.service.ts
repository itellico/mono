
// ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
// ❌ REMOVED: Direct database imports (architectural violation)
// import { db as prisma } from '@/lib/db';
// import { Prisma } from '@prisma/client';
import { ApiAuthService } from '@/lib/api-clients/api-auth.service';
import { logger } from '@/lib/logger';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function getBundles() {
  try {
    const headers = await ApiAuthService.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/bundles`, { headers });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch bundles: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data || data;
  } catch (error) {
    logger.error('Failed to get bundles via API', { error });
    throw error;
  }
}

export async function getBundle(id: string) {
  try {
    const headers = await ApiAuthService.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/bundles/${id}`, { headers });
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch bundle: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data || data;
  } catch (error) {
    logger.error('Failed to get bundle via API', { error, id });
    throw error;
  }
}

export async function createBundle(bundle: any, featureIds: string[]) {
  try {
    const headers = await ApiAuthService.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/bundles`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bundle, featureIds }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create bundle: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data || data;
  } catch (error) {
    logger.error('Failed to create bundle via API', { error, bundle });
    throw error;
  }
}

export async function updateBundle(id: string, bundle: any, featureIds: string[]) {
  try {
    const headers = await ApiAuthService.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/bundles/${id}`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bundle, featureIds }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update bundle: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data || data;
  } catch (error) {
    logger.error('Failed to update bundle via API', { error, id, bundle });
    throw error;
  }
}

export async function deleteBundle(id: string) {
  try {
    const headers = await ApiAuthService.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/bundles/${id}`, {
      method: 'DELETE',
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete bundle: ${response.statusText}`);
    }
    
    return { success: true };
  } catch (error) {
    logger.error('Failed to delete bundle via API', { error, id });
    throw error;
  }
}
