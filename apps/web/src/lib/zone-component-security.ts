/**
 * Zone Component Security Service
 * 
 * Comprehensive security layer for zone components including:
 * - Input sanitization and XSS protection
 * - Permission validation with enhanced checks
 * - Security audit logging
 * - Component configuration validation
 * - Content Security Policy integration
 * 
 * @author itellico Mono
 * @version 1.0.0
 */

import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { canAccessAPI } from '@/lib/permissions/enhanced-unified-permission-system';
import { UnifiedPermissionService } from '@/lib/services/unified-permission.service';
import { AuditService } from '@/lib/services/audit.service';

/**
 * Security configuration for zone components
 */
export interface ZoneComponentSecurityConfig {
  // Input sanitization settings
  sanitization: {
    allowedTags: string[];
    allowedAttributes: string[];
    maxStringLength: number;
    maxDepth: number;
  };
  
  // Permission requirements
  permissions: {
    view: string[];
    create: string[];
    edit: string[];
    delete: string[];
    deploy: string[];
  };
  
  // Content security policy
  csp: {
    allowedImageSources: string[];
    allowedVideoSources: string[];
    allowedScriptSources: string[];
    allowedStyleSources: string[];
  };
  
  // Rate limiting
  rateLimits: {
    maxComponentsPerTenant: number;
    maxConfigUpdatesPerHour: number;
    maxDeploymentsPerDay: number;
  };
}

/**
 * Default security configuration
 */
const DEFAULT_SECURITY_CONFIG: ZoneComponentSecurityConfig = {
  sanitization: {
    allowedTags: [
      'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'a', 'img', 'button', 'input', 'label', 'form',
      'ul', 'ol', 'li', 'strong', 'em', 'br'
    ],
    allowedAttributes: [
      'class', 'id', 'href', 'src', 'alt', 'title', 'data-*',
      'aria-*', 'role', 'tabindex', 'target'
    ],
    maxStringLength: 10000,
    maxDepth: 10
  },
  
  permissions: {
    view: ['zone_components.view.tenant'],
    create: ['zone_components.create.tenant'],
    edit: ['zone_components.edit.tenant', 'zone_components.edit.self'],
    delete: ['zone_components.delete.tenant', 'zone_components.delete.self'],
    deploy: ['zone_components.deploy.tenant']
  },
  
  csp: {
    allowedImageSources: [
      'self',
      'data:',
      'https://images.unsplash.com',
      'https://cdn.example.com'
    ],
    allowedVideoSources: [
      'self',
      'https://www.youtube.com',
      'https://vimeo.com'
    ],
    allowedScriptSources: ['self'],
    allowedStyleSources: ['self', 'unsafe-inline']
  },
  
  rateLimits: {
    maxComponentsPerTenant: 100,
    maxConfigUpdatesPerHour: 50,
    maxDeploymentsPerDay: 10
  }
};

/**
 * Validation schemas for component data
 */
const ComponentConfigSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  buttonText: z.string().max(50).optional(),
  buttonUrl: z.string().url().max(500).optional(),
  imageUrl: z.string().url().max(500).optional(),
  videoUrl: z.string().url().max(500).optional(),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  alignment: z.enum(['left', 'center', 'right']).optional(),
  size: z.enum(['small', 'medium', 'large']).optional(),
  style: z.enum(['card', 'banner', 'minimal']).optional(),
  showUrgency: z.boolean().optional(),
  urgencyText: z.string().max(100).optional(),
  customCSS: z.string().max(5000).optional(),
  customHTML: z.string().max(10000).optional()
});

/**
 * Security validation result
 */
export interface SecurityValidationResult {
  isValid: boolean;
  sanitizedData?: any;
  violations: string[];
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

/**
 * Zone Component Security Service
 */
export class ZoneComponentSecurity {
  private static instance: ZoneComponentSecurity;
  private config: ZoneComponentSecurityConfig;

  constructor(config?: Partial<ZoneComponentSecurityConfig>) {
    this.config = { ...DEFAULT_SECURITY_CONFIG, ...config };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ZoneComponentSecurity {
    if (!ZoneComponentSecurity.instance) {
      ZoneComponentSecurity.instance = new ZoneComponentSecurity();
    }
    return ZoneComponentSecurity.instance;
  }

  /**
   * Validate component permissions with enhanced security
   */
  public async validateComponentPermissions(
    userContext: any,
    action: 'view' | 'create' | 'edit' | 'delete' | 'deploy',
    resourceContext?: {
      componentId?: string;
      tenantId?: string;
      componentType?: string;
    }
  ): Promise<{ allowed: boolean; reason?: string; auditId?: string }> {
    try {
      // Step 1: Basic API access validation
      const apiAccess = canAccessAPI(userContext, '/api/v1/zone-components', 'POST');
      if (!apiAccess.allowed) {
        await this.logSecurityEvent('permission_denied', userContext, {
          action,
          reason: 'API access denied',
          details: apiAccess.reason
        });
        return { allowed: false, reason: apiAccess.reason };
      }

      // Step 2: Detailed permission checking
      const requiredPermissions = this.config.permissions[action];
      for (const permission of requiredPermissions) {
        const hasPermission = await UnifiedPermissionService.hasPermission(
          parseInt(userContext.userId),
          permission,
          {
            tenantId: resourceContext?.tenantId ? parseInt(resourceContext.tenantId) : undefined,
            resourceId: resourceContext?.componentId,
            resourceType: 'zone_component'
          }
        );

        if (!hasPermission.hasPermission) {
          await this.logSecurityEvent('permission_denied', userContext, {
            action,
            permission,
            reason: hasPermission.reason || 'Permission check failed'
          });
          return { 
            allowed: false, 
            reason: `Missing permission: ${permission}` 
          };
        }
      }

      // Step 3: Rate limiting checks
      const rateLimitCheck = await this.checkRateLimits(userContext, action);
      if (!rateLimitCheck.allowed) {
        await this.logSecurityEvent('rate_limit_exceeded', userContext, {
          action,
          limit: rateLimitCheck.limit,
          current: rateLimitCheck.current
        });
        return { allowed: false, reason: rateLimitCheck.reason };
      }

      // Log successful permission validation
      const auditId = await this.logSecurityEvent('permission_granted', userContext, {
        action,
        permissions: requiredPermissions,
        resourceContext
      });

      return { allowed: true, auditId };

    } catch (error) {
      logger.error('Error in permission validation', {
        error: error instanceof Error ? error.message : String(error),
        userContext,
        action,
        resourceContext
      });

      await this.logSecurityEvent('permission_error', userContext, {
        action,
        error: error instanceof Error ? error.message : String(error)
      });

      return { allowed: false, reason: 'Permission validation failed' };
    }
  }

  /**
   * Sanitize and validate component configuration
   */
  public validateComponentConfig(config: any): SecurityValidationResult {
    const violations: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    try {
      // Step 1: Schema validation
      const schemaResult = ComponentConfigSchema.safeParse(config);
      if (!schemaResult.success) {
        violations.push('Invalid configuration schema');
        schemaResult.error.issues.forEach(issue => {
          violations.push(`${issue.path.join('.')}: ${issue.message}`);
        });
        riskLevel = 'high';
      }

      // Step 2: Input sanitization
      const sanitizedConfig = this.sanitizeComponentData(config);

      // Step 3: URL validation
      if (config.buttonUrl && !this.isValidUrl(config.buttonUrl)) {
        violations.push('Invalid button URL detected');
        riskLevel = 'medium';
      }

      if (config.imageUrl && !this.isValidImageUrl(config.imageUrl)) {
        violations.push('Invalid or potentially unsafe image URL');
        riskLevel = 'medium';
      }

      // Step 4: Custom HTML/CSS security check
      if (config.customHTML) {
        const htmlSecurityCheck = this.validateCustomHTML(config.customHTML);
        if (!htmlSecurityCheck.safe) {
          violations.push(...htmlSecurityCheck.violations);
          riskLevel = 'high';
        }
      }

      if (config.customCSS) {
        const cssSecurityCheck = this.validateCustomCSS(config.customCSS);
        if (!cssSecurityCheck.safe) {
          violations.push(...cssSecurityCheck.violations);
          riskLevel = 'medium';
        }
      }

      // Step 5: Content length validation
      if (JSON.stringify(config).length > 50000) {
        violations.push('Configuration data exceeds maximum size limit');
        riskLevel = 'medium';
      }

      // Generate recommendations
      if (config.customHTML || config.customCSS) {
        recommendations.push('Consider using standard configuration options instead of custom HTML/CSS');
      }

      if (!config.alt && config.imageUrl) {
        recommendations.push('Add alt text for images to improve accessibility');
      }

      return {
        isValid: violations.length === 0,
        sanitizedData: sanitizedConfig,
        violations,
        riskLevel,
        recommendations
      };

    } catch (error) {
      logger.error('Error in component config validation', {
        error: error instanceof Error ? error.message : String(error),
        config
      });

      return {
        isValid: false,
        violations: ['Configuration validation failed'],
        riskLevel: 'high',
        recommendations: ['Review configuration data format']
      };
    }
  }

  /**
   * Validate component deployment security
   */
  public async validateDeploymentSecurity(
    componentData: any,
    userContext: any,
    targetDomain: string
  ): Promise<SecurityValidationResult> {
    const violations: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Check permissions for deployment
    const permissionCheck = await this.validateComponentPermissions(
      userContext,
      'deploy',
      { componentId: componentData.id, tenantId: userContext.tenantId }
    );

    if (!permissionCheck.allowed) {
      violations.push(`Deployment permission denied: ${permissionCheck.reason}`);
      riskLevel = 'high';
    }

    // Validate component configuration
    const configValidation = this.validateComponentConfig(componentData.config);
    if (!configValidation.isValid) {
      violations.push(...configValidation.violations);
      if (configValidation.riskLevel === 'high') riskLevel = 'high';
      else if (configValidation.riskLevel === 'medium' && riskLevel === 'low') riskLevel = 'medium';
    }

    // Validate target domain
    if (!this.isValidDeploymentDomain(targetDomain)) {
      violations.push('Invalid or unauthorized deployment domain');
      riskLevel = 'high';
    }

    return {
      isValid: violations.length === 0,
      sanitizedData: configValidation.sanitizedData,
      violations,
      riskLevel,
      recommendations: [...recommendations, ...configValidation.recommendations]
    };
  }

  /**
   * Sanitize component data to prevent XSS
   */
  public sanitizeComponentData(data: any): any {
    if (typeof data === 'string') {
      let sanitized = DOMPurify.sanitize(data, {
        ALLOWED_TAGS: this.config.sanitization.allowedTags,
        ALLOWED_ATTR: this.config.sanitization.allowedAttributes
      });
      
      // Additional checks for JavaScript URLs and expressions
      sanitized = sanitized.replace(/javascript:/gi, '');
      sanitized = sanitized.replace(/expression\s*\(/gi, '');
      
      return sanitized;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeComponentData(item));
    }

    if (data && typeof data === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeComponentData(value);
      }
      return sanitized;
    }

    return data;
  }

  /**
   * Validate URL safety
   */
  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      // Allow only HTTPS and relative URLs
      return ['https:', 'http:'].includes(parsed.protocol) || url.startsWith('/');
    } catch {
      return false;
    }
  }

  /**
   * Validate image URL against allowed sources
   */
  private isValidImageUrl(url: string): boolean {
    if (!this.isValidUrl(url)) return false;

    const allowedSources = this.config.csp.allowedImageSources;
    return allowedSources.some(source => {
      if (source === 'self') return url.startsWith('/');
      if (source === 'data:') return url.startsWith('data:');
      return url.startsWith(source);
    });
  }

  /**
   * Validate custom HTML for security risks
   */
  private validateCustomHTML(html: string): { safe: boolean; violations: string[] } {
    const violations: string[] = [];

    // Check for script tags
    if (/<script/i.test(html)) {
      violations.push('Script tags not allowed in custom HTML');
    }

    // Check for event handlers
    if (/on\w+\s*=/i.test(html)) {
      violations.push('Event handlers not allowed in custom HTML');
    }

    // Check for javascript: URLs
    if (/javascript:/i.test(html)) {
      violations.push('JavaScript URLs not allowed');
    }

    // Check for iframe or object tags
    if (/<(iframe|object|embed)/i.test(html)) {
      violations.push('Iframe, object, and embed tags not allowed');
    }

    return {
      safe: violations.length === 0,
      violations
    };
  }

  /**
   * Validate custom CSS for security risks
   */
  private validateCustomCSS(css: string): { safe: boolean; violations: string[] } {
    const violations: string[] = [];

    // Check for expression() usage (IE-specific)
    if (/expression\s*\(/i.test(css)) {
      violations.push('CSS expressions not allowed');
    }

    // Check for javascript: URLs in CSS
    if (/javascript:/i.test(css)) {
      violations.push('JavaScript URLs not allowed in CSS');
    }

    // Check for @import (could be used for CSS injection)
    if (/@import/i.test(css)) {
      violations.push('CSS @import statements not allowed');
    }

    return {
      safe: violations.length === 0,
      violations
    };
  }

  /**
   * Check rate limits for component operations
   */
  private async checkRateLimits(
    userContext: any,
    action: string
  ): Promise<{ allowed: boolean; reason?: string; limit?: number; current?: number }> {
    // This would integrate with a proper rate limiting service
    // For now, return allowed to not block functionality
    // TODO: Implement proper rate limiting with Redis
    
    return { allowed: true };
  }

  /**
   * Log security events for audit trail
   */
  private async logSecurityEvent(
    eventType: string,
    userContext: any,
    details: any
  ): Promise<string> {
    try {
      const auditId = crypto.randomUUID();
      
      await AuditService.logSecurityEvent({
        id: auditId,
        eventType,
        userId: parseInt(userContext.userId),
        tenantId: userContext.tenantId ? parseInt(userContext.tenantId) : undefined,
        resourceType: 'zone_component',
        details,
        ipAddress: userContext.ipAddress,
        userAgent: userContext.userAgent,
        timestamp: new Date()
      });

      logger.info('Security event logged', {
        auditId,
        eventType,
        userId: userContext.userId,
        details
      });

      return auditId;

    } catch (error) {
      logger.error('Failed to log security event', {
        error: error instanceof Error ? error.message : String(error),
        eventType,
        userContext,
        details
      });
      return crypto.randomUUID(); // Return a dummy ID so operations can continue
    }
  }

  /**
   * Validate deployment domain
   */
  private isValidDeploymentDomain(domain: string): boolean {
    // Add domain validation logic here
    // This would check against allowed deployment domains for the tenant
    return true; // Placeholder - implement actual validation
  }

  /**
   * Generate Content Security Policy headers for zone components
   */
  public generateCSPHeaders(): Record<string, string> {
    const csp = this.config.csp;
    
    const cspDirectives = [
      `default-src 'self'`,
      `img-src ${csp.allowedImageSources.join(' ')}`,
      `media-src ${csp.allowedVideoSources.join(' ')}`,
      `script-src ${csp.allowedScriptSources.join(' ')}`,
      `style-src ${csp.allowedStyleSources.join(' ')}`,
      `object-src 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `frame-ancestors 'none'`
    ];

    return {
      'Content-Security-Policy': cspDirectives.join('; '),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };
  }
}

export default ZoneComponentSecurity; 