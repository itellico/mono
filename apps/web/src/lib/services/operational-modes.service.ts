/**
 * Operational Modes Service
 * 
 * Hybrid approach for God Mode and Developer Mode:
 * 1. Enhanced permissions control WHO can access these modes
 * 2. Redis state controls WHEN they are active for each user
 * 3. Both permission + state must be true for mode to be functional
 */

import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { canAccessAPI, extractUserContext } from '@/lib/permissions/enhanced-unified-permission-system';
// JWT User type

interface OperationalModeState {
  isEnabled: boolean;
  enabledAt?: Date;
  enabledBy?: number;
  reason?: string;
  expiresAt?: Date;
}

interface OperationalModes {
  godMode: OperationalModeState;
  developerMode: OperationalModeState;
  debugMode: OperationalModeState;
}

export class OperationalModesService {
  private static readonly CACHE_PREFIX = 'operational_modes';
  private static readonly DEFAULT_TTL = 8 * 60 * 60; // 8 hours default
  private static readonly MAX_GOD_MODE_DURATION = 24 * 60 * 60; // 24 hours max

  // Redis cache keys
  private static getUserModesKey(userId: number): string {
    return `${this.CACHE_PREFIX}:user:${userId}`;
  }

  private static getGlobalModesKey(): string {
    return `${this.CACHE_PREFIX}:global`;
  }

  /**
   * Check if user can access God Mode (permission check)
   */
  static async canAccessGodMode(session: Session): Promise<boolean> {
    try {
      if (!session?.user?.id) return false;
      
      const userContext = extractUserContext(session);
      const result = canAccessAPI(userContext, '/api/v2/admin/settings/god-mode', 'POST');
      return result.allowed;
    } catch (error) {
      logger.error('Failed to check god mode permission:', error);
      return false;
    }
  }

  /**
   * Check if user can access Developer Mode (permission check)
   */
  static async canAccessDeveloperMode(session: Session): Promise<boolean> {
    try {
      if (!session?.user?.id) return false;
      
      const userContext = extractUserContext(session);
      const result = canAccessAPI(userContext, '/api/v2/admin/settings', 'PUT');
      return result.allowed;
    } catch (error) {
      logger.error('Failed to check developer mode permission:', error);
      return false;
    }
  }

  /**
   * Check if God Mode is currently active for user (permission + state check)
   */
  static async isGodModeActive(session: Session): Promise<boolean> {
    try {
      // First check permission
      const hasPermission = await this.canAccessGodMode(session);
      if (!hasPermission) {
        return false;
      }

      // Then check current state
      if (!session?.user?.id) return false;
      const userId = parseInt(session.user.id);
      const modes = await this.getUserModes(userId);
      
      // Check if enabled and not expired
      if (!modes.godMode.isEnabled) {
        return false;
      }

      if (modes.godMode.expiresAt && modes.godMode.expiresAt < new Date()) {
        // Auto-disable expired god mode
        await this.disableGodMode(userId, userId, 'Auto-disabled: session expired');
        return false;
      }

      return true;

    } catch (error) {
      logger.error('Failed to check god mode state:', error);
      return false;
    }
  }

  /**
   * Check if Developer Mode is currently active for user (permission + state check)
   */
  static async isDeveloperModeActive(session: Session): Promise<boolean> {
    try {
      // First check permission
      const hasPermission = await this.canAccessDeveloperMode(session);
      if (!hasPermission) {
        return false;
      }

      // Then check current state
      if (!session?.user?.id) return false;
      const userId = parseInt(session.user.id);
      const modes = await this.getUserModes(userId);
      
      return modes.developerMode.isEnabled;

    } catch (error) {
      logger.error('Failed to check developer mode state:', error);
      return false;
    }
  }

  /**
   * Enable God Mode for user
   */
  static async enableGodMode(
    userId: number, 
    enabledBy: number, 
    reason: string,
    durationHours: number = 8
  ): Promise<{ success: boolean; message: string; expiresAt?: Date }> {
    try {
      // Validate duration
      const maxDurationSeconds = this.MAX_GOD_MODE_DURATION;
      const requestedDurationSeconds = durationHours * 60 * 60;
      
      if (requestedDurationSeconds > maxDurationSeconds) {
        return {
          success: false,
          message: `God mode duration cannot exceed 24 hours. Requested: ${durationHours}h`
        };
      }

      const cacheKey = this.getUserModesKey(userId);
      
      // Get current modes
      const currentModes = await this.getUserModes(userId);
      
      // Calculate expiration
      const enabledAt = new Date();
      const expiresAt = new Date(enabledAt.getTime() + requestedDurationSeconds * 1000);
      
      // Update god mode state
      currentModes.godMode = {
        isEnabled: true,
        enabledAt,
        enabledBy,
        reason,
        expiresAt
      };

      // Save to Redis with TTL (resilient)
      try {
        const redis = await getRedisClient();
        await redis.setex(
          cacheKey, 
          requestedDurationSeconds, 
          JSON.stringify(currentModes)
        );
      } catch (redisError) {
        logger.warn('Redis unavailable for god mode cache, continuing without cache', {
          error: redisError instanceof Error ? redisError.message : String(redisError)
        });
      }

      // Log the action
      logger.info('God mode enabled', {
        userId,
        enabledBy,
        reason,
        durationHours,
        expiresAt
      });

      return {
        success: true,
        message: `God mode enabled for ${durationHours} hours`,
        expiresAt
      };

    } catch (error) {
      logger.error('Failed to enable god mode:', error);
      return {
        success: false,
        message: 'Failed to enable god mode'
      };
    }
  }

  /**
   * Disable God Mode for user
   */
  static async disableGodMode(
    userId: number, 
    disabledBy: number, 
    reason: string = 'Manual disable'
  ): Promise<{ success: boolean; message: string }> {
    try {
      const cacheKey = this.getUserModesKey(userId);
      
      // Get current modes
      const currentModes = await this.getUserModes(userId);
      
      // Update god mode state
      currentModes.godMode = {
        isEnabled: false,
        enabledAt: undefined,
        enabledBy: undefined,
        reason: undefined,
        expiresAt: undefined
      };

      // Save to Redis (keep other modes active) - resilient
      try {
        const redis = await getRedisClient();
        await redis.setex(
          cacheKey, 
          this.DEFAULT_TTL, 
          JSON.stringify(currentModes)
        );
      } catch (redisError) {
        logger.warn('Redis unavailable for god mode disable cache, continuing without cache', {
          error: redisError instanceof Error ? redisError.message : String(redisError)
        });
      }

      // Log the action
      logger.info('God mode disabled', {
        userId,
        disabledBy,
        reason
      });

      return {
        success: true,
        message: 'God mode disabled successfully'
      };

    } catch (error) {
      logger.error('Failed to disable god mode:', error);
      return {
        success: false,
        message: 'Failed to disable god mode'
      };
    }
  }

  /**
   * Toggle Developer Mode for user
   */
  static async toggleDeveloperMode(
    userId: number, 
    toggledBy: number, 
    reason: string = 'Manual toggle'
  ): Promise<{ success: boolean; message: string; isEnabled: boolean }> {
    try {
      const cacheKey = this.getUserModesKey(userId);
      
      // Get current modes
      const currentModes = await this.getUserModes(userId);
      
      // Toggle developer mode
      const newState = !currentModes.developerMode.isEnabled;
      
      currentModes.developerMode = {
        isEnabled: newState,
        enabledAt: newState ? new Date() : undefined,
        enabledBy: newState ? toggledBy : undefined,
        reason: newState ? reason : undefined
      };

      // Save to Redis - resilient
      try {
        const redis = await getRedisClient();
        await redis.setex(
          cacheKey, 
          this.DEFAULT_TTL, 
          JSON.stringify(currentModes)
        );
      } catch (redisError) {
        logger.warn('Redis unavailable for developer mode cache, continuing without cache', {
          error: redisError instanceof Error ? redisError.message : String(redisError)
        });
      }

      // Log the action
      logger.info('Developer mode toggled', {
        userId,
        toggledBy,
        reason,
        newState
      });

      return {
        success: true,
        message: `Developer mode ${newState ? 'enabled' : 'disabled'}`,
        isEnabled: newState
      };

    } catch (error) {
      logger.error('Failed to toggle developer mode:', error);
      return {
        success: false,
        message: 'Failed to toggle developer mode',
        isEnabled: false
      };
    }
  }

  /**
   * Get all operational modes for user
   */
  static async getUserModes(userId: number): Promise<OperationalModes> {
    try {
      const cacheKey = this.getUserModesKey(userId);
      
      // Try to get from Redis cache - resilient
      try {
        const redis = await getRedisClient();
        const cached = await redis.get(cacheKey);
        
        if (cached) {
          const parsed = JSON.parse(cached);
          // Convert date strings back to Date objects
          if (parsed.godMode?.enabledAt) {
            parsed.godMode.enabledAt = new Date(parsed.godMode.enabledAt);
          }
          if (parsed.godMode?.expiresAt) {
            parsed.godMode.expiresAt = new Date(parsed.godMode.expiresAt);
          }
          if (parsed.developerMode?.enabledAt) {
            parsed.developerMode.enabledAt = new Date(parsed.developerMode.enabledAt);
          }
          return parsed;
        }
      } catch (redisError) {
        logger.warn('Redis unavailable for user modes cache, using defaults', {
          error: redisError instanceof Error ? redisError.message : String(redisError)
        });
      }

      // Return default state
      return {
        godMode: { isEnabled: false },
        developerMode: { isEnabled: false },
        debugMode: { isEnabled: false }
      };

    } catch (error) {
      logger.error('Failed to get user modes:', error);
      return {
        godMode: { isEnabled: false },
        developerMode: { isEnabled: false },
        debugMode: { isEnabled: false }
      };
    }
  }

  /**
   * Get operational modes status with permission context
   */
  static async getModesWithPermissions(session: Session): Promise<{
    godMode: {
      hasPermission: boolean;
      isActive: boolean;
      state?: OperationalModeState;
    };
    developerMode: {
      hasPermission: boolean;
      isActive: boolean;
      state?: OperationalModeState;
    };
  }> {
         try {
       if (!session?.user?.id) {
         return {
           godMode: { hasPermission: false, isActive: false },
           developerMode: { hasPermission: false, isActive: false }
         };
       }
       
       const userId = parseInt(session.user.id);
       
       // Get all data in parallel
      const [
        hasGodModePermission,
        hasDeveloperModePermission,
        userModes
      ] = await Promise.all([
        this.canAccessGodMode(session),
        this.canAccessDeveloperMode(session),
        this.getUserModes(userId)
      ]);

      return {
        godMode: {
          hasPermission: hasGodModePermission,
          isActive: hasGodModePermission && userModes.godMode.isEnabled,
          state: userModes.godMode
        },
        developerMode: {
          hasPermission: hasDeveloperModePermission,
          isActive: hasDeveloperModePermission && userModes.developerMode.isEnabled,
          state: userModes.developerMode
        }
      };

    } catch (error) {
      logger.error('Failed to get modes with permissions:', error);
      return {
        godMode: { hasPermission: false, isActive: false },
        developerMode: { hasPermission: false, isActive: false }
      };
    }
  }

  /**
   * Clear all operational modes for user
   */
  static async clearUserModes(userId: number, clearedBy: number): Promise<void> {
    try {
      const redis = await getRedisClient();
      const cacheKey = this.getUserModesKey(userId);
      
      await redis.del(cacheKey);
      
      logger.info('User operational modes cleared', {
        userId,
        clearedBy
      });

    } catch (error) {
      logger.error('Failed to clear user modes:', error);
    }
  }

  /**
   * Get system-wide mode status (for maintenance mode, etc.)
   */
  static async getGlobalModes(): Promise<{
    maintenanceMode: boolean;
    debugMode: boolean;
  }> {
    try {
      const redis = await getRedisClient();
      const cacheKey = this.getGlobalModesKey();
      
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      return {
        maintenanceMode: false,
        debugMode: false
      };

    } catch (error) {
      logger.error('Failed to get global modes:', error);
      return {
        maintenanceMode: false,
        debugMode: false
      };
    }
  }
} 