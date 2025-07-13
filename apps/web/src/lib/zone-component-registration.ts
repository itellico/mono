/**
 * Zone Component Registration System
 * 
 * Handles bulk registration of standard zone components with the itellico Mono
 * Zone Component Registry.
 */

import { ZoneComponentRegistry } from '@/lib/zone-component-registry';
import { STANDARD_COMPONENTS } from '@/components/zones/standard';
import { logger } from '@/lib/logger';
import type { UserContext } from '@/lib/zone-component-registry';

/**
 * Register all standard zone components
 * 
 * @param userContext - System user context for registration
 * @returns Promise<boolean> - Success status
 */
export async function registerStandardComponents(
  userContext: UserContext
): Promise<boolean> {
  const registry = ZoneComponentRegistry.getInstance();
  
  logger.info('🎯 Starting standard zone component registration', {
    componentCount: STANDARD_COMPONENTS.length,
    userId: userContext.userId,
    tenantId: userContext.tenantId
  });

  let successCount = 0;
  let errorCount = 0;

  try {
    for (const componentMeta of STANDARD_COMPONENTS) {
      try {
        logger.info('📝 Registering zone component', {
          componentId: componentMeta.id,
          name: componentMeta.name,
          category: componentMeta.category
        });

        await registry.registerComponent(
          {
            name: componentMeta.name,
            displayName: componentMeta.displayName,
            description: componentMeta.description,
            category: componentMeta.category,
            componentType: componentMeta.componentType,
            version: componentMeta.version,
            status: 'active' as const,
            tenantId: null, // Platform-wide standard components
            configSchema: componentMeta.configSchema,
            defaultConfig: componentMeta.defaultConfig,
            permissions: componentMeta.permissions || {
              view: ['zone_components.view.tenant'],
              edit: ['zone_components.edit.tenant'],
              delete: ['zone_components.delete.tenant']
            }
          },
          userContext
        );

        successCount++;
        
        logger.info('✅ Zone component registered successfully', {
          componentId: componentMeta.id,
          name: componentMeta.name
        });

      } catch (error) {
        errorCount++;
        
        logger.error('❌ Failed to register zone component', {
          componentId: componentMeta.id,
          name: componentMeta.name,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    const success = errorCount === 0;
    
    logger.info('🎯 Zone component registration completed', {
      totalComponents: STANDARD_COMPONENTS.length,
      successCount,
      errorCount,
      success
    });

    return success;

  } catch (error) {
    logger.error('💥 Zone component registration failed', {
      error: error instanceof Error ? error.message : String(error),
      successCount,
      errorCount
    });
    
    return false;
  }
}

/**
 * Check if standard components are already registered
 * 
 * @param userContext - User context for checking
 * @returns Promise<boolean> - Whether components are registered
 */
export async function areStandardComponentsRegistered(
  userContext: UserContext
): Promise<boolean> {
  const registry = ZoneComponentRegistry.getInstance();
  
  try {
    // Get all platform-wide components (tenantId = null)
    const components = await registry.getComponentsForTenant(
      'platform', // Special identifier for platform-wide components
      userContext
    );

    // Check if all standard components are present
    const registeredIds = new Set(components.map(c => c.name));
    const requiredIds = STANDARD_COMPONENTS.map(c => c.name);
    
    const allRegistered = requiredIds.every(id => registeredIds.has(id));
    
    logger.info('🔍 Standard component registration check', {
      requiredComponents: requiredIds.length,
      registeredComponents: components.length,
      allRegistered,
      registeredIds: Array.from(registeredIds),
      requiredIds
    });

    return allRegistered;

  } catch (error) {
    logger.error('❌ Failed to check component registration status', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return false;
  }
}

/**
 * System user context for component registration
 * Uses super admin privileges for system operations
 */
export const SYSTEM_USER_CONTEXT: UserContext = {
  userId: 'system',
  tenantId: 'platform',
  accountId: 'system',
  role: 'super_admin',
  permissions: ['*'] // All permissions
};

/**
 * Initialize zone component system
 * Registers all standard components if not already present
 */
export async function initializeZoneComponentSystem(): Promise<boolean> {
  logger.info('🚀 Initializing Zone Component System');

  try {
    // Check if components are already registered
    const alreadyRegistered = await areStandardComponentsRegistered(SYSTEM_USER_CONTEXT);
    
    if (alreadyRegistered) {
      logger.info('✅ Standard zone components already registered');
      return true;
    }

    // Register all standard components
    const success = await registerStandardComponents(SYSTEM_USER_CONTEXT);
    
    if (success) {
      logger.info('🎉 Zone Component System initialized successfully');
    } else {
      logger.error('💥 Zone Component System initialization failed');
    }

    return success;

  } catch (error) {
    logger.error('💥 Zone Component System initialization error', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return false;
  }
} 