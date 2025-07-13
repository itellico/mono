import { Client } from '@temporalio/client';
import { logger } from '@/lib/logger';

export interface TemporalNamespaceConfig {
  tenantId: string;
  tenantDomain: string;
  retentionDays?: number;
}

export class TemporalNamespaceManager {
  private client: Client;

  constructor() {
    this.client = new Client({
      connection: {
        address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
      },
    });
  }

  /**
   * Platform namespace for Mono-level operations
   */
  static getPlatformNamespace(): string {
    return 'mono-platform';
  }

  /**
   * Generate namespace name for a tenant
   */
  static getTenantNamespace(tenantId: string): string {
    return `mono-tenant-${tenantId}`;
  }

  /**
   * Create platform namespace for Mono-level workflows
   * (billing, monitoring, tenant management, etc.)
   */
  async createPlatformNamespace(): Promise<void> {
    const namespaceName = TemporalNamespaceManager.getPlatformNamespace();

    try {
      const exists = await this.namespaceExists(namespaceName);
      if (exists) {
        logger.info(`Platform namespace ${namespaceName} already exists`);
        return;
      }

      await this.client.workflowService.registerNamespace({
        namespace: namespaceName,
        description: 'itellico Mono - System-level workflows (billing, monitoring, tenant management)',
        workflowExecutionRetentionPeriod: {
          seconds: 365 * 24 * 60 * 60, // 1 year retention for platform operations
        },
        data: {
          type: 'platform',
          platform: 'mono',
          createdAt: new Date().toISOString(),
        },
      });

      logger.info(`Created itellico Mono namespace: ${namespaceName}`);
    } catch (error) {
      logger.error(`Failed to create platform namespace ${namespaceName}:`, error);
      throw error;
    }
  }

  /**
   * Create namespace for a tenant
   */
  async createTenantNamespace(config: TemporalNamespaceConfig): Promise<void> {
    const namespaceName = TemporalNamespaceManager.getTenantNamespace(config.tenantId);

    try {
      const exists = await this.namespaceExists(namespaceName);
      if (exists) {
        logger.info(`Tenant namespace ${namespaceName} already exists`);
        return;
      }

      await this.client.workflowService.registerNamespace({
        namespace: namespaceName,
        description: `itellico Mono tenant: ${config.tenantDomain}`,
        workflowExecutionRetentionPeriod: {
          seconds: (config.retentionDays || 90) * 24 * 60 * 60,
        },
        data: {
          type: 'tenant',
          tenantId: config.tenantId,
          tenantDomain: config.tenantDomain,
          platform: 'mono',
          createdAt: new Date().toISOString(),
        },
      });

      logger.info(`Created tenant namespace: ${namespaceName} for ${config.tenantDomain}`);
    } catch (error) {
      logger.error(`Failed to create tenant namespace ${namespaceName}:`, error);
      throw error;
    }
  }

  /**
   * Check if namespace exists
   */
  async namespaceExists(namespaceName: string): Promise<boolean> {
    try {
      await this.client.workflowService.describeNamespace({
        namespace: namespaceName,
      });
      return true;
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        return false;
      }
      throw error;
    }
  }

  /**
   * List all Mono namespaces (platform + tenants)
   */
  async listAllNamespaces(): Promise<{
    platform?: { namespace: string };
    tenants: Array<{ namespace: string; tenantId: string; tenantDomain: string }>;
  }> {
    try {
      const response = await this.client.workflowService.listNamespaces({});

      const platform = response.namespaces
        ?.find(ns => ns.namespaceInfo?.name === 'mono-platform');

      const tenants = response.namespaces
        ?.filter(ns => ns.namespaceInfo?.name?.startsWith('mono-tenant-'))
        .map(ns => ({
          namespace: ns.namespaceInfo?.name || '',
          tenantId: ns.namespaceInfo?.data?.tenantId || '',
          tenantDomain: ns.namespaceInfo?.data?.tenantDomain || '',
        })) || [];

      return {
        platform: platform ? { namespace: platform.namespaceInfo?.name || '' } : undefined,
        tenants,
      };
    } catch (error) {
      logger.error('Failed to list Mono namespaces:', error);
      throw error;
    }
  }

  /**
   * Get client for Mono platform namespace
   */
  getPlatformClient(): Client {
    return new Client({
      connection: {
        address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
      },
      namespace: TemporalNamespaceManager.getPlatformNamespace(),
    });
  }

  /**
   * Get client for specific tenant namespace
   */
  getTenantClient(tenantId: string): Client {
    const namespace = TemporalNamespaceManager.getTenantNamespace(tenantId);

    return new Client({
      connection: {
        address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
      },
      namespace,
    });
  }

  /**
   * Initialize complete itellico Mono setup
   */
  async initializeMonoPlatform(): Promise<void> {
    logger.info('🚀 Initializing itellico Mono Temporal setup...');

    // 1. Create platform namespace
    await this.createPlatformNamespace();

    // 2. Create go-models tenant namespace
    await this.createTenantNamespace({
      tenantId: 'go-models',
      tenantDomain: 'go-models.com',
      retentionDays: 90,
    });

    logger.info('✅ itellico Mono Temporal setup complete!');
  }
} 