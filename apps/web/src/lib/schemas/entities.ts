/**
 * itellico Mono Entity Types
 * 
 * Top-level entity types for a comprehensive two-sided marketplace platform.
 * These are hardcoded for optimal performance and type safety.
 */

// Core entity types as const for type safety
export const ENTITY_TYPES = {
  USER: 'user',
  CONTENT: 'content', 
  TRANSACTION: 'transaction',
  COMMUNICATION: 'communication',
  SYSTEM: 'system',
  RESOURCE: 'resource',
  EVENT: 'event',
  WORKFLOW: 'workflow',
  ANALYTICS: 'analytics',
  MODERATION: 'moderation',
  TENANT: 'tenant',
  PLATFORM: 'platform',
} as const;

// Type-safe entity type union
export type EntityType = typeof ENTITY_TYPES[keyof typeof ENTITY_TYPES];

// Array of all entity types for runtime operations
export const ALL_ENTITY_TYPES: EntityType[] = Object.values(ENTITY_TYPES);

// Entity metadata for UI display
export const ENTITY_METADATA: Record<EntityType, {
  displayName: string;
  description: string;
  icon: string;
  allowsCategories: boolean;
  allowsTags: boolean;
}> = {
  [ENTITY_TYPES.USER]: {
    displayName: 'User',
    description: 'Profiles, organizations, accounts',
    icon: 'user',
    allowsCategories: true,
    allowsTags: true,
  },
  [ENTITY_TYPES.CONTENT]: {
    displayName: 'Content',
    description: 'Media, listings, portfolios, products',
    icon: 'file',
    allowsCategories: true,
    allowsTags: true,
  },
  [ENTITY_TYPES.TRANSACTION]: {
    displayName: 'Transaction',
    description: 'Bookings, orders, payments, contracts',
    icon: 'credit-card',
    allowsCategories: true,
    allowsTags: true,
  },
  [ENTITY_TYPES.COMMUNICATION]: {
    displayName: 'Communication',
    description: 'Messages, notifications, reviews',
    icon: 'message-circle',
    allowsCategories: true,
    allowsTags: true,
  },
  [ENTITY_TYPES.SYSTEM]: {
    displayName: 'System',
    description: 'Settings, templates, configurations',
    icon: 'settings',
    allowsCategories: true,
    allowsTags: true,
  },
  [ENTITY_TYPES.RESOURCE]: {
    displayName: 'Resource',
    description: 'Assets, locations, skills, certifications',
    icon: 'archive',
    allowsCategories: true,
    allowsTags: true,
  },
  [ENTITY_TYPES.EVENT]: {
    displayName: 'Event',
    description: 'Calendar events, activities, schedules',
    icon: 'calendar',
    allowsCategories: true,
    allowsTags: true,
  },
  [ENTITY_TYPES.WORKFLOW]: {
    displayName: 'Workflow',
    description: 'Processes, automations, approvals',
    icon: 'git-branch',
    allowsCategories: true,
    allowsTags: true,
  },
  [ENTITY_TYPES.ANALYTICS]: {
    displayName: 'Analytics',
    description: 'Reports, metrics, tracking, insights',
    icon: 'bar-chart',
    allowsCategories: true,
    allowsTags: true,
  },
  [ENTITY_TYPES.MODERATION]: {
    displayName: 'Moderation',
    description: 'Disputes, flags, bans, verifications',
    icon: 'shield',
    allowsCategories: true,
    allowsTags: true,
  },
  [ENTITY_TYPES.TENANT]: {
    displayName: 'Tenant',
    description: 'Tenant-specific entities and configurations',
    icon: 'building',
    allowsCategories: true,
    allowsTags: true,
  },
  [ENTITY_TYPES.PLATFORM]: {
    displayName: 'Platform',
    description: 'Platform-wide entities and configurations',
    icon: 'globe',
    allowsCategories: true,
    allowsTags: true,
  },
};

// Helper functions
export function isValidEntityType(entityType: string): entityType is EntityType {
  return ALL_ENTITY_TYPES.includes(entityType as EntityType);
}

export function getEntityMetadata(entityType: EntityType) {
  return ENTITY_METADATA[entityType];
}

export function getCategorizable(): EntityType[] {
  return ALL_ENTITY_TYPES.filter(type => ENTITY_METADATA[type].allowsCategories);
}

export function getTaggable(): EntityType[] {
  return ALL_ENTITY_TYPES.filter(type => ENTITY_METADATA[type].allowsTags);
} 