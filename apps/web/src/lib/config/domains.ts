/**
 * Domain Configuration for itellico Mono
 * 
 * This module handles domain routing configuration across different environments
 * and provides utilities for domain-based tenant resolution.
 * 
 * Architecture:
 * - app.mono.itellico.com - Admin/management interface (all tenants)
 * - tenant.mono.itellico.com - Tenant public content (starter plan)
 * - custom-domain.com - Tenant public content (professional/enterprise)
 * - api.mono.itellico.com - Unified API endpoint
 */

export interface DomainConfig {
  admin: string;
  api: string;
  cdn: string;
  publicBase: string;
}

export interface DomainInfo {
  type: 'admin' | 'api' | 'tenant' | 'docs' | 'unknown';
  tenantSlug?: string;
  isCustomDomain?: boolean;
  hostname: string;
}

/**
 * Get domain configuration based on environment
 */
export const getDomainConfig = (): DomainConfig => {
  const env = process.env.NODE_ENV;
  
  if (env === 'development') {
    return {
      admin: process.env.NEXT_PUBLIC_ADMIN_DOMAIN || 'http://mono.mono:3000',
      api: process.env.NEXT_PUBLIC_API_DOMAIN || 'http://mono.mono:3001',
      cdn: process.env.NEXT_PUBLIC_CDN_DOMAIN || 'http://cdn.mono:3000',
      publicBase: process.env.NEXT_PUBLIC_PUBLIC_BASE || 'http://{tenant}.mono:3000'
    };
  }

  if (env === 'staging') {
    return {
      admin: 'https://app-staging.mono.itellico.com',
      api: 'https://api-staging.mono.itellico.com',
      cdn: 'https://cdn-staging.mono.itellico.com',
      publicBase: 'https://{tenant}-staging.mono.itellico.com'
    };
  }

  // Production
  return {
    admin: 'https://app.mono.itellico.com',
    api: 'https://api.mono.itellico.com',
    cdn: 'https://cdn.mono.itellico.com',
    publicBase: 'https://{tenant}.mono.itellico.com'
  };
};

/**
 * Parse hostname to determine domain type and extract tenant information
 */
export const parseDomain = (hostname: string): DomainInfo => {
  if (!hostname) {
    return { type: 'unknown', hostname: '' };
  }

  const lowercaseHost = hostname.toLowerCase();
  const config = getDomainConfig();

  // Remove port for comparison
  const hostWithoutPort = lowercaseHost.replace(/:\d+$/, '');
  const adminDomainWithoutPort = new URL(config.admin).hostname;
  const apiDomainWithoutPort = new URL(config.api).hostname;

  // Check if it's admin domain
  if (hostWithoutPort === adminDomainWithoutPort || 
      hostWithoutPort.startsWith('app.') ||
      lowercaseHost.includes('app.mono') ||
      hostWithoutPort === 'mono.mono' ||
      hostWithoutPort === 'localhost') {
    return { type: 'admin', hostname: lowercaseHost };
  }

  // Check if it's API domain
  if (hostWithoutPort === apiDomainWithoutPort || 
      hostWithoutPort.startsWith('api.') ||
      lowercaseHost.includes('api.mono') ||
      lowercaseHost.includes('mono.mono:3001')) {
    return { type: 'api', hostname: lowercaseHost };
  }

  // Check if it's docs domain
  if (hostWithoutPort.startsWith('docs.') ||
      hostWithoutPort === 'docs.mono') {
    return { type: 'docs', hostname: lowercaseHost };
  }

  // Check if it's a itellico Mono subdomain (starter plan)
  const platformDomains = ['mono.itellico.com', 'mono.local'];
  for (const domain of platformDomains) {
    if (hostWithoutPort.endsWith(domain)) {
      // Extract subdomain (tenant slug)
      const subdomain = hostWithoutPort.replace(`.${domain}`, '').split('.').pop();
      if (subdomain && !['app', 'api', 'cdn', 'www'].includes(subdomain)) {
        return { 
          type: 'tenant', 
          tenantSlug: subdomain,
          isCustomDomain: false,
          hostname: lowercaseHost 
        };
      }
    }
  }

  // Assume it's a custom domain (professional/enterprise plan)
  return { 
    type: 'tenant', 
    isCustomDomain: true,
    hostname: lowercaseHost 
  };
};

/**
 * Get tenant URL for a given tenant slug
 */
export const getTenantUrl = (tenantSlug: string, path: string = ''): string => {
  const config = getDomainConfig();
  const baseUrl = config.publicBase.replace('{tenant}', tenantSlug);
  return `${baseUrl}${path}`;
};

/**
 * Get admin URL with optional path
 */
export const getAdminUrl = (path: string = ''): string => {
  const config = getDomainConfig();
  return `${config.admin}${path}`;
};

/**
 * Get API URL with optional path
 */
export const getApiUrl = (path: string = ''): string => {
  const config = getDomainConfig();
  return `${config.api}${path}`;
};

/**
 * Check if current domain is admin domain
 */
export const isAdminDomain = (hostname: string): boolean => {
  const domainInfo = parseDomain(hostname);
  return domainInfo.type === 'admin';
};

/**
 * Check if current domain is API domain
 */
export const isApiDomain = (hostname: string): boolean => {
  const domainInfo = parseDomain(hostname);
  return domainInfo.type === 'api';
};

/**
 * Check if current domain is tenant domain
 */
export const isTenantDomain = (hostname: string): boolean => {
  const domainInfo = parseDomain(hostname);
  return domainInfo.type === 'tenant';
};

/**
 * Get cross-domain cookie options based on environment
 */
export const getCrossDomainCookieOptions = () => {
  const isDev = process.env.NODE_ENV === 'development';
  
  return {
    domain: isDev ? '.mono.local' : '.mono.itellico.com',
    httpOnly: true,
    secure: !isDev,
    sameSite: 'lax' as const,
    path: '/'
  };
};