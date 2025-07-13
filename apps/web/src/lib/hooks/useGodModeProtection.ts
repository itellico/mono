/**
 * God Mode Protection Hook (Client-Side Only)
 * 
 * Provides client-side checks for system entity operations by combining:
 * 1. Client-side Zustand state for UI enablement
 * 2. User session role checks
 * 
 * Note: Server-side validation is handled separately in API routes
 */

import { useAuth } from '@/contexts/auth-context';
import { useMemo } from 'react';
import { useOperationalModes } from '@/lib/hooks/useSimpleOperationalModes';

interface GodModeProtection {
  // UI State (from Zustand)
  isGodModeActive: boolean;
  hasGodModePermission: boolean;
  
  // Combined checks
  canEditSystemEntities: boolean;
  canDeleteSystemEntities: boolean;
  
  // Generic helper function for any entity
  canPerformSystemAction: (action: 'edit' | 'delete', entityType: string, isSystemEntity: boolean) => boolean;
  
  // Specific helper functions (convenience wrappers)
  canEditSystemCategory: (isSystem: boolean) => boolean;
  canDeleteSystemCategory: (isSystem: boolean) => boolean;
  canEditSystemTag: (isSystem: boolean) => boolean;
  canDeleteSystemTag: (isSystem: boolean) => boolean;
  
  // User feedback
  getSystemEntityTooltip: (action: 'edit' | 'delete', entityType: 'category' | 'tag') => string;
  getGenericSystemTooltip: (action: 'edit' | 'delete', entityType: string) => string;
}

/**
 * Client-side God Mode protection hook
 */
export function useGodModeProtection(): GodModeProtection {
  const { user } = useAuth();
  const { data: operationalModes } = useOperationalModes();
  const godMode = operationalModes?.godMode || { hasPermission: false, isActive: false };
  
  const userRoles = user?.roles || [];
  const isSuperAdmin = userRoles.includes('super_admin');
  
  // Memoize calculations for performance
  const protection = useMemo(() => {
    // Basic God Mode state from Zustand
    const isGodModeActive = godMode.isActive && godMode.hasPermission;
    const hasGodModePermission = godMode.hasPermission;
    
    // Combined checks: Must have both permission AND active state
    const canEditSystemEntities = isSuperAdmin && isGodModeActive;
    const canDeleteSystemEntities = isSuperAdmin && isGodModeActive;
    
    return {
      isGodModeActive,
      hasGodModePermission,
      canEditSystemEntities,
      canDeleteSystemEntities,
      
      // Generic helper function for any entity
      canPerformSystemAction: (action: 'edit' | 'delete', entityType: string, isSystemEntity: boolean) => {
        if (!isSuperAdmin) {
          return false;
        }
        if (!isGodModeActive) {
          return false;
        }
        return true;
      },
      
      // Specific helper functions (convenience wrappers)
      canEditSystemCategory: (isSystem: boolean) => isSystem ? canEditSystemEntities : true,
      canDeleteSystemCategory: (isSystem: boolean) => isSystem ? canDeleteSystemEntities : true,
      canEditSystemTag: (isSystem: boolean) => isSystem ? canEditSystemEntities : true,
      canDeleteSystemTag: (isSystem: boolean) => isSystem ? canDeleteSystemEntities : true,
      
      // User feedback messages
      getSystemEntityTooltip: (action: 'edit' | 'delete', entityType: 'category' | 'tag') => {
        if (!isSuperAdmin) {
          return `Only Super Admins can ${action} system ${entityType}s`;
        }
        if (!isGodModeActive) {
          return `God Mode must be enabled to ${action} system ${entityType}s`;
        }
        return `${action} system ${entityType} (God Mode enabled)`;
      },
      getGenericSystemTooltip: (action: 'edit' | 'delete', entityType: string) => {
        if (!isSuperAdmin) {
          return `Only Super Admins can ${action} system ${entityType}s`;
        }
        if (!isGodModeActive) {
          return `God Mode must be enabled to ${action} system ${entityType}s`;
        }
        return `${action} system ${entityType} (God Mode enabled)`;
      }
    };
  }, [godMode, isSuperAdmin]);
  
  return protection;
}

/**
 * Server-side God Mode validation (for API routes)
 * 
 * This function should only be called in server-side contexts (API routes)
 */
export async function validateGodModePermission(
  session: any,
  action: 'edit' | 'delete',
  isSystemEntity: boolean
): Promise<{
  canEditSystemEntity: boolean;
  canDeleteSystemEntity: boolean;
  error?: string;
}> {
  // If not a system entity, allow the operation
  if (!isSystemEntity) {
    return {
      canEditSystemEntity: true,
      canDeleteSystemEntity: true
    };
  }
  
  // Check if user is super admin
  const userRoles = (session?.user as any)?.roles || [];
  if (!userRoles.includes('super_admin')) {
    return {
      canEditSystemEntity: false,
      canDeleteSystemEntity: false,
      error: 'Only Super Admins can modify system entities'
    };
  }
  
  // Import the OperationalModesService to check actual God Mode state
  const { OperationalModesService } = await import('@/lib/services/operational-modes.service');
  
  // Check if God Mode is actually active for this user
  const isGodModeActive = await OperationalModesService.isGodModeActive(session);
  
  if (!isGodModeActive) {
    return {
      canEditSystemEntity: false,
      canDeleteSystemEntity: false,
      error: 'God Mode must be enabled to modify system entities'
    };
  }
  
  // God Mode is active, allow the operation
  return {
    canEditSystemEntity: true,
    canDeleteSystemEntity: true
  };
} 