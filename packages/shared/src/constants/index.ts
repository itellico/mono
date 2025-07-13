// Permission constants
export const PERMISSIONS = {
  // Tenant permissions
  TENANT_VIEW: 'tenant.view',
  TENANT_CREATE: 'tenant.create',
  TENANT_UPDATE: 'tenant.update',
  TENANT_DELETE: 'tenant.delete',
  
  // User permissions
  USER_VIEW: 'user.view',
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  
  // Admin permissions
  ADMIN_ACCESS: 'admin.access',
  ADMIN_USERS: 'admin.users',
  ADMIN_SETTINGS: 'admin.settings',
  ADMIN_BILLING: 'admin.billing',
} as const;

// Rate limiting
export const RATE_LIMITS = {
  PUBLIC: {
    max: 100,
    window: '1 minute',
  },
  AUTHENTICATED: {
    max: 1000,
    window: '1 minute',
  },
  UPLOAD: {
    max: 10,
    window: '5 minutes',
  },
} as const;

// File upload limits
export const FILE_LIMITS = {
  MAX_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_FILES: 10,
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
  ],
} as const;

// Cache TTL (in seconds)
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
} as const;