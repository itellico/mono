/**
 * Workflow Service - API Client
 * 
 * ✅ ARCHITECTURE COMPLIANCE: Uses API calls instead of direct database access
 * All workflow operations go through NestJS API with proper authentication
 */

import { ApiAuthService } from '@/lib/api-clients/api-auth.service';
import { type Node, type Edge } from '@xyflow/react';
import { logger } from '@/lib/logger';
import { getRedisClient } from '@/lib/redis';

export interface SaveWorkflowData {
  name: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
  tenantId: string;
  createdBy: string;
  category?: string;
  tags?: string[];
}

export interface UpdateWorkflowData {
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
  nodes?: Node[];
  edges?: Edge[];
  updatedBy: string;
}

export class WorkflowService {
  private static readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  private static readonly CACHE_TTL = 300; // 5 minutes

  private static async getRedis() {
    try {
      return await getRedisClient();
    } catch (error) {
      logger.warn('Redis client unavailable, proceeding without cache', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Save a workflow with its nodes and edges
   */
  static async saveWorkflow(data: SaveWorkflowData): Promise<string> {
    try {
      logger.info('Saving workflow', { 
        name: data.name, 
        tenantId: data.tenantId,
        nodesCount: data.nodes.length,
        edgesCount: data.edges.length 
      });

      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v1/admin/workflows`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to save workflow: ${response.statusText}`);
      }

      const result = await response.json();
      const workflowId = result.data?.id || result.id;

      // Invalidate cache
      await this.invalidateCache(data.tenantId);

      logger.info('Workflow saved successfully', { 
        workflowId, 
        name: data.name,
        tenantId: data.tenantId 
      });

      return workflowId;
    } catch (error) {
      logger.error('Error saving workflow', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        data 
      });
      throw error;
    }
  }

  /**
   * Load a workflow with its nodes and edges
   */
  static async loadWorkflow(workflowId: string, tenantId: string): Promise<{
    workflow: any;
    nodes: Node[];
    edges: Edge[];
  } | null> {
    try {
      logger.info('Loading workflow', { workflowId, tenantId });

      const headers = await ApiAuthService.getAuthHeaders();
      const queryParams = new URLSearchParams({
        tenantId,
      });

      const response = await fetch(
        `${this.API_BASE_URL}/api/v1/admin/workflows/${workflowId}?${queryParams}`,
        { headers }
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to load workflow: ${response.statusText}`);
      }

      const data = await response.json();
      const result = data.data || data;

      logger.info('Workflow loaded successfully', { 
        workflowId, 
        tenantId,
        nodesCount: result.nodes?.length || 0,
        edgesCount: result.edges?.length || 0
      });

      return {
        workflow: result.workflow,
        nodes: result.nodes || [],
        edges: result.edges || [],
      };
    } catch (error) {
      logger.error('Error loading workflow', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        workflowId, 
        tenantId 
      });
      throw error;
    }
  }

  /**
   * List workflows for a tenant
   */
  static async listWorkflows(tenantId: string, limit = 50, offset = 0) {
    try {
      logger.info('Listing workflows', { tenantId, limit, offset });

      const headers = await ApiAuthService.getAuthHeaders();
      const queryParams = new URLSearchParams({
        tenantId,
        limit: limit.toString(),
        offset: offset.toString(),
      });

      const response = await fetch(
        `${this.API_BASE_URL}/api/v1/admin/workflows?${queryParams}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to list workflows: ${response.statusText}`);
      }

      const data = await response.json();
      const workflowList = data.data || data;

      logger.info('Workflows listed successfully', { 
        tenantId, 
        count: workflowList.length 
      });

      return workflowList;
    } catch (error) {
      logger.error('Error listing workflows', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId 
      });
      throw new Error('Failed to list workflows');
    }
  }

  /**
   * Update workflow status
   */
  static async updateWorkflowStatus(workflowId: string, tenantId: string, status: string, updatedBy: string) {
    try {
      logger.info('Updating workflow status', { workflowId, tenantId, status, updatedBy });

      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v1/admin/workflows/${workflowId}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          updatedBy,
          tenantId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update workflow status: ${response.statusText}`);
      }

      // Invalidate cache
      await this.invalidateCache(tenantId);

      logger.info('Workflow status updated successfully', { workflowId, tenantId, status });
    } catch (error) {
      logger.error('Error updating workflow status', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        workflowId, 
        tenantId, 
        status 
      });
      throw new Error('Failed to update workflow status');
    }
  }

  /**
   * Delete a workflow and all its nodes/edges
   */
  static async deleteWorkflow(workflowId: string, tenantId: string) {
    try {
      logger.info('Deleting workflow', { workflowId, tenantId });

      const headers = await ApiAuthService.getAuthHeaders();
      const queryParams = new URLSearchParams({
        tenantId,
      });

      const response = await fetch(
        `${this.API_BASE_URL}/api/v1/admin/workflows/${workflowId}?${queryParams}`,
        {
          method: 'DELETE',
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete workflow: ${response.statusText}`);
      }

      // Invalidate cache
      await this.invalidateCache(tenantId);

      logger.info('Workflow deleted successfully', { workflowId, tenantId });
    } catch (error) {
      logger.error('Error deleting workflow', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        workflowId, 
        tenantId 
      });
      throw new Error('Failed to delete workflow');
    }
  }

  /**
   * Update a workflow with its nodes and edges
   */
  static async updateWorkflow(workflowId: string, tenantId: string, data: UpdateWorkflowData) {
    try {
      logger.info('Updating workflow', { 
        workflowId, 
        tenantId,
        updatedBy: data.updatedBy,
        hasNodes: !!data.nodes,
        hasEdges: !!data.edges 
      });

      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v1/admin/workflows/${workflowId}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          tenantId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update workflow: ${response.statusText}`);
      }

      const result = await response.json();

      // Invalidate cache
      await this.invalidateCache(tenantId);

      logger.info('Workflow updated successfully', { 
        workflowId, 
        tenantId,
        updatedBy: data.updatedBy 
      });

      return result.data || result;
    } catch (error) {
      logger.error('Error updating workflow', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        workflowId, 
        tenantId, 
        data 
      });
      throw new Error('Failed to update workflow');
    }
  }

  /**
   * Invalidate workflow caches for a tenant
   */
  private static async invalidateCache(tenantId: string): Promise<void> {
    try {
      const redis = await this.getRedis();
      const cacheKey = `workflows:${tenantId}:*`;
      const keys = await redis.keys(cacheKey);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      logger.debug('Workflow cache invalidated', { tenantId });
    } catch (error) {
      logger.warn('Failed to invalidate workflow cache', { 
        error: error instanceof Error ? error.message : String(error),
        tenantId 
      });
    }
  }
} 