/**
 * Centralized Audit Tracking Configuration
 * 
 * Controls all audit tracking behavior across the itellico Mono
 * Supports environment-based settings and feature toggles
 * 
 * @example
 * // Development: Full tracking enabled
 * // Production: Selective tracking based on compliance needs
 * // Testing: Minimal tracking to avoid noise
 */

export interface AuditConfig {
  enabled: boolean;
  pageTracking: {
    enabled: boolean;
    autoDetectPages: boolean;
    trackMetadata: boolean;
    excludePatterns: string[];
  };
  interactionTracking: {
    enabled: boolean;
    trackClicks: boolean;
    trackFormSubmissions: boolean;
    trackSearches: boolean;
    trackNavigation: boolean;
    trackViews: boolean;
    excludeComponents: string[];
  };
  entityLocking: {
    enabled: boolean;
    autoDetectEditableEntities: boolean;
    lockTimeout: number; // minutes
    showLockStatus: boolean;
  };
  compliance: {
    gdprMode: boolean;
    requireUserConsent: boolean;
    anonymizeData: boolean;
    dataRetentionDays: number;
  };
  performance: {
    batchRequests: boolean;
    batchSize: number;
    batchInterval: number; // milliseconds
    enableCaching: boolean;
  };
  development: {
    verboseLogging: boolean;
    showDebugInfo: boolean;
    trackInDevelopment: boolean;
  };
}

// Environment-based configuration
const getEnvironmentConfig = (): Partial<AuditConfig> => {
  const env = process.env.NODE_ENV;
  const auditMode = process.env.NEXT_PUBLIC_AUDIT_MODE || 'auto';

  switch (env) {
    case 'development':
      return {
        enabled: auditMode !== 'disabled',
        pageTracking: {
          enabled: true,
          autoDetectPages: true,
          trackMetadata: true,
          excludePatterns: []
        },
        interactionTracking: {
          enabled: true,
          trackClicks: true,
          trackFormSubmissions: true,
          trackSearches: true,
          trackNavigation: true,
          trackViews: true,
          excludeComponents: []
        },
        development: {
          verboseLogging: true,
          showDebugInfo: true,
          trackInDevelopment: true
        }
      };

    case 'production':
      return {
        enabled: auditMode !== 'disabled',
        pageTracking: {
          enabled: true,
          autoDetectPages: true,
          trackMetadata: false, // Reduced metadata in production
          excludePatterns: ['/health', '/metrics', '/api/docs']
        },
        interactionTracking: {
          enabled: true,
          trackClicks: false, // Reduce noise in production
          trackFormSubmissions: true,
          trackSearches: true,
          trackNavigation: false,
          trackViews: true,
          excludeComponents: ['debug-', 'test-']
        },
        development: {
          verboseLogging: false,
          showDebugInfo: false,
          trackInDevelopment: false
        }
      };

    case 'test':
      return {
        enabled: false, // Minimal tracking in tests
        pageTracking: { 
          enabled: false,
          autoDetectPages: false,
          trackMetadata: false,
          excludePatterns: []
        },
        interactionTracking: { 
          enabled: false,
          trackClicks: false,
          trackFormSubmissions: false,
          trackSearches: false,
          trackNavigation: false,
          trackViews: false,
          excludeComponents: []
        },
        entityLocking: { 
          enabled: false,
          autoDetectEditableEntities: false,
          lockTimeout: 0,
          showLockStatus: false
        },
        development: {
          verboseLogging: false,
          showDebugInfo: false,
          trackInDevelopment: false
        }
      };

    default:
      return {};
  }
};

// Default configuration
const defaultConfig: AuditConfig = {
  enabled: true,
  pageTracking: {
    enabled: true,
    autoDetectPages: true,
    trackMetadata: true,
    excludePatterns: [
      '/api/',
      '/_next/',
      '/favicon.ico',
      '/robots.txt',
      '/sitemap.xml'
    ]
  },
  interactionTracking: {
    enabled: true,
    trackClicks: true,
    trackFormSubmissions: true,
    trackSearches: true,
    trackNavigation: true,
    trackViews: true,
    excludeComponents: [
      'skeleton',
      'loading',
      'error-boundary'
    ]
  },
  entityLocking: {
    enabled: true,
    autoDetectEditableEntities: true,
    lockTimeout: 30, // 30 minutes
    showLockStatus: true
  },
  compliance: {
    gdprMode: false,
    requireUserConsent: false,
    anonymizeData: false,
    dataRetentionDays: 90
  },
  performance: {
    batchRequests: true,
    batchSize: 10,
    batchInterval: 5000, // 5 seconds
    enableCaching: true
  },
  development: {
    verboseLogging: false,
    showDebugInfo: false,
    trackInDevelopment: true
  }
};

// Merge environment-specific config with defaults
export const auditConfig: AuditConfig = {
  ...defaultConfig,
  ...getEnvironmentConfig()
};

/**
 * Runtime audit configuration helpers
 */
export const AuditConfigHelpers = {
  /**
   * Check if page tracking should be enabled for a specific path
   */
  shouldTrackPage: (pathname: string): boolean => {
    if (!auditConfig.enabled || !auditConfig.pageTracking.enabled) {
      return false;
    }

    return !auditConfig.pageTracking.excludePatterns.some(pattern => 
      pathname.includes(pattern)
    );
  },

  /**
   * Check if interaction tracking should be enabled for a component
   */
  shouldTrackInteraction: (componentName: string, interactionType: keyof AuditConfig['interactionTracking']): boolean => {
    if (!auditConfig.enabled || !auditConfig.interactionTracking.enabled) {
      return false;
    }

    if (!auditConfig.interactionTracking[interactionType]) {
      return false;
    }

    return !auditConfig.interactionTracking.excludeComponents.some(pattern =>
      componentName.toLowerCase().includes(pattern.toLowerCase())
    );
  },

  /**
   * Check if entity locking should be enabled
   */
  shouldUseLocking: (entityType: string): boolean => {
    if (!auditConfig.enabled || !auditConfig.entityLocking.enabled) {
      return false;
    }

    return auditConfig.entityLocking.autoDetectEditableEntities;
  },

  /**
   * Get performance settings for batching
   */
  getBatchSettings: () => ({
    enabled: auditConfig.performance.batchRequests,
    size: auditConfig.performance.batchSize,
    interval: auditConfig.performance.batchInterval
  }),

  /**
   * Check if user consent is required
   */
  requiresConsent: (): boolean => {
    return auditConfig.compliance.gdprMode && auditConfig.compliance.requireUserConsent;
  }
};

/**
 * Environment variable overrides
 */
export const getAuditOverrides = () => ({
  // Allow runtime disabling via environment variables
  AUDIT_ENABLED: process.env.NEXT_PUBLIC_AUDIT_ENABLED === 'true',
  AUDIT_PAGE_TRACKING: process.env.NEXT_PUBLIC_AUDIT_PAGE_TRACKING === 'true',
  AUDIT_INTERACTION_TRACKING: process.env.NEXT_PUBLIC_AUDIT_INTERACTION_TRACKING === 'true',
  AUDIT_VERBOSE: process.env.NEXT_PUBLIC_AUDIT_VERBOSE === 'true',
  AUDIT_GDPR_MODE: process.env.NEXT_PUBLIC_AUDIT_GDPR_MODE === 'true'
}); 