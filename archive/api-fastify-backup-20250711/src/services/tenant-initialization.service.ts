import { storageService } from './storage.service';
import { prisma } from '../plugins/prisma';

export interface TenantInitializationOptions {
  tenantUuid: string;
  tenantId: number;
  initializeStorage?: boolean;
  initializePermissions?: boolean;
  initializeSettings?: boolean;
}

/**
 * Service for initializing new tenant resources
 * Handles storage directories, default permissions, and initial settings
 */
export class TenantInitializationService {
  
  /**
   * Complete tenant initialization workflow
   */
  async initializeTenant(options: TenantInitializationOptions): Promise<void> {
    const { 
      tenantUuid, 
      tenantId, 
      initializeStorage = true, 
      initializePermissions = true,
      initializeSettings = true 
    } = options;

    try {
      // Initialize storage directories
      if (initializeStorage) {
        await this.initializeStorageDirectories(tenantUuid);
      }

      // Initialize default permissions
      if (initializePermissions) {
        await this.initializeDefaultPermissions(tenantId);
      }

      // Initialize default settings
      if (initializeSettings) {
        await this.initializeDefaultSettings(tenantId, tenantUuid);
      }

      console.log(`✅ Tenant ${tenantUuid} initialized successfully`);

    } catch (error) {
      console.error(`❌ Failed to initialize tenant ${tenantUuid}:`, error);
      throw error;
    }
  }

  /**
   * Initialize storage directory structure for tenant
   */
  async initializeStorageDirectories(tenantUuid: string): Promise<void> {
    try {
      await storageService.initializeTenantStorage(tenantUuid);
      console.log(`📁 Storage directories created for tenant: ${tenantUuid}`);
    } catch (error) {
      console.error(`Failed to create storage directories for tenant ${tenantUuid}:`, error);
      throw error;
    }
  }

  /**
   * Initialize default permissions for tenant
   */
  async initializeDefaultPermissions(tenantId: number): Promise<void> {
    try {
      // Default permissions that every tenant should have
      const defaultPermissions = [
        // Media permissions
        'media:upload',
        'media:read',
        'media:delete',
        
        // Artwork permissions
        'artwork:upload',
        'artwork:read',
        'artwork:delete',
        
        // Basic user permissions
        'users:read',
        'users:update_own',
        
        // Category permissions
        'categories:read',
        'categories:create',
        'categories:update',
        
        // Tag permissions
        'tags:read',
        'tags:create',
        'tags:update',
        
        // Profile permissions
        'profiles:read',
        'profiles:create',
        'profiles:update',
      ];

      // Check if permissions already exist before creating
      const existingPermissions = await prisma.permission.findMany({
        where: {
          tenantId,
          code: { in: defaultPermissions }
        }
      });

      const existingCodes = existingPermissions.map(p => p.code);
      const missingPermissions = defaultPermissions.filter(code => !existingCodes.includes(code));

      if (missingPermissions.length > 0) {
        await prisma.permission.createMany({
          data: missingPermissions.map(code => ({
            tenantId,
            code,
            name: this.generatePermissionName(code),
            description: this.generatePermissionDescription(code),
            category: this.getPermissionCategory(code)
          })),
          skipDuplicates: true
        });

        console.log(`🔐 Created ${missingPermissions.length} default permissions for tenant: ${tenantId}`);
      }

    } catch (error) {
      console.error(`Failed to initialize permissions for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Initialize default settings for tenant
   */
  async initializeDefaultSettings(tenantId: number, tenantUuid: string): Promise<void> {
    try {
      // Default settings that every tenant should have
      const defaultSettings = [
        {
          category: 'storage',
          key: 'max_upload_size',
          value: '50MB',
          type: 'string' as const,
          description: 'Maximum file upload size'
        },
        {
          category: 'storage',
          key: 'allowed_file_types',
          value: JSON.stringify(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.pdf', '.mp4', '.mov']),
          type: 'json' as const,
          description: 'Allowed file extensions for uploads'
        },
        {
          category: 'artwork',
          key: 'max_logo_size',
          value: '5MB',
          type: 'string' as const,
          description: 'Maximum logo file size'
        },
        {
          category: 'artwork',
          key: 'max_banner_size',
          value: '10MB',
          type: 'string' as const,
          description: 'Maximum banner file size'
        },
        {
          category: 'branding',
          key: 'primary_color',
          value: '#3b82f6',
          type: 'string' as const,
          description: 'Primary brand color'
        },
        {
          category: 'branding',
          key: 'secondary_color',
          value: '#64748b',
          type: 'string' as const,
          description: 'Secondary brand color'
        },
        {
          category: 'general',
          key: 'tenant_name',
          value: `Tenant ${tenantUuid.slice(0, 8)}`,
          type: 'string' as const,
          description: 'Display name for the tenant'
        },
        {
          category: 'general',
          key: 'timezone',
          value: 'UTC',
          type: 'string' as const,
          description: 'Default timezone for the tenant'
        }
      ];

      // Check if settings already exist
      const existingSettings = await prisma.setting.findMany({
        where: {
          tenantId,
          key: { in: defaultSettings.map(s => s.key) }
        }
      });

      const existingKeys = existingSettings.map(s => s.key);
      const missingSettings = defaultSettings.filter(setting => !existingKeys.includes(setting.key));

      if (missingSettings.length > 0) {
        await prisma.setting.createMany({
          data: missingSettings.map(setting => ({
            tenantId,
            ...setting
          })),
          skipDuplicates: true
        });

        console.log(`⚙️ Created ${missingSettings.length} default settings for tenant: ${tenantId}`);
      }

    } catch (error) {
      console.error(`Failed to initialize settings for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Generate human-readable permission name from code
   */
  private generatePermissionName(code: string): string {
    const parts = code.split(':');
    const resource = parts[0];
    const action = parts[1];

    const actionNames: Record<string, string> = {
      'read': 'Read',
      'create': 'Create',
      'update': 'Update',
      'delete': 'Delete',
      'upload': 'Upload',
      'update_own': 'Update Own'
    };

    const resourceNames: Record<string, string> = {
      'media': 'Media',
      'artwork': 'Artwork',
      'users': 'Users',
      'categories': 'Categories',
      'tags': 'Tags',
      'profiles': 'Profiles'
    };

    const actionName = actionNames[action] || action;
    const resourceName = resourceNames[resource] || resource;

    return `${actionName} ${resourceName}`;
  }

  /**
   * Generate permission description
   */
  private generatePermissionDescription(code: string): string {
    const parts = code.split(':');
    const resource = parts[0];
    const action = parts[1];

    const descriptions: Record<string, string> = {
      'media:upload': 'Upload media files and assets',
      'media:read': 'View and download media files',
      'media:delete': 'Delete media files',
      'artwork:upload': 'Upload artwork and branding assets',
      'artwork:read': 'View artwork and branding assets',
      'artwork:delete': 'Delete artwork and branding assets',
      'users:read': 'View user information',
      'users:update_own': 'Update own user profile',
      'categories:read': 'View categories',
      'categories:create': 'Create new categories',
      'categories:update': 'Update existing categories',
      'tags:read': 'View tags',
      'tags:create': 'Create new tags',
      'tags:update': 'Update existing tags',
      'profiles:read': 'View user profiles',
      'profiles:create': 'Create user profiles',
      'profiles:update': 'Update user profiles'
    };

    return descriptions[code] || `Permission to ${action} ${resource}`;
  }

  /**
   * Get permission category
   */
  private getPermissionCategory(code: string): string {
    const resource = code.split(':')[0];
    
    const categories: Record<string, string> = {
      'media': 'Media Management',
      'artwork': 'Artwork & Branding',
      'users': 'User Management',
      'categories': 'Content Organization',
      'tags': 'Content Organization',
      'profiles': 'Profile Management'
    };

    return categories[resource] || 'General';
  }

  /**
   * Cleanup tenant resources (for tenant deletion)
   */
  async cleanupTenant(tenantUuid: string, tenantId: number): Promise<void> {
    try {
      // Get storage statistics before cleanup
      const stats = await storageService.getTenantStorageStats(tenantUuid);
      console.log(`📊 Tenant ${tenantUuid} storage stats before cleanup:`, stats);

      // Delete all tenant files
      const categories = ['media', 'artwork', 'documents', 'temp'] as const;
      for (const category of categories) {
        const files = await storageService.listTenantFiles(tenantUuid, category);
        for (const file of files) {
          await storageService.deleteFile(file.replace(storageService['uploadDir'], ''), tenantUuid);
        }
      }

      // Delete database records (permissions, settings, etc.)
      await prisma.permission.deleteMany({ where: { tenantId } });
      await prisma.setting.deleteMany({ where: { tenantId } });

      console.log(`🗑️ Cleaned up tenant ${tenantUuid} resources`);

    } catch (error) {
      console.error(`Failed to cleanup tenant ${tenantUuid}:`, error);
      throw error;
    }
  }
}

export const tenantInitializationService = new TenantInitializationService();