/**
 * Category and Tag Type Constants
 * These must match the enum values defined in the database schema
 */

export const CATEGORY_TYPES = [
  'user',
  'content', 
  'transaction',
  'communication',
  'system',
  'resource',
  'event',
  'workflow',
  'analytics',
  'moderation',
  'tenant',
  'platform'
] as const;

export const TAG_CATEGORIES = [
  'user',
  'content', 
  'transaction',
  'communication',
  'system',
  'resource',
  'event',
  'workflow',
  'analytics',
  'moderation',
  'tenant',
  'platform'
] as const;

export type CategoryType = typeof CATEGORY_TYPES[number];
export type TagCategory = typeof TAG_CATEGORIES[number];

/**
 * Human-readable labels for category types
 */
export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  user: 'User',
  content: 'Content',
  transaction: 'Transaction', 
  communication: 'Communication',
  system: 'System',
  resource: 'Resource',
  event: 'Event',
  workflow: 'Workflow',
  analytics: 'Analytics',
  moderation: 'Moderation',
  tenant: 'Tenant',
  platform: 'Platform'
};

/**
 * Human-readable labels for tag categories
 */
export const TAG_CATEGORY_LABELS: Record<TagCategory, string> = {
  user: 'User',
  content: 'Content',
  transaction: 'Transaction',
  communication: 'Communication', 
  system: 'System',
  resource: 'Resource',
  event: 'Event',
  workflow: 'Workflow',
  analytics: 'Analytics',
  moderation: 'Moderation',
  tenant: 'Tenant',
  platform: 'Platform'
};

/**
 * Descriptions for category types
 */
export const CATEGORY_TYPE_DESCRIPTIONS: Record<CategoryType, string> = {
  user: 'User profiles, accounts, and identity management',
  content: 'Posts, media, articles, and user-generated content',
  transaction: 'Payments, orders, subscriptions, and financial data',
  communication: 'Messages, notifications, emails, and chat',
  system: 'System configuration, settings, and internal processes',
  resource: 'Files, assets, templates, and resources',
  event: 'Events, bookings, schedules, and calendar items',
  workflow: 'Processes, automation, and business workflows',
  analytics: 'Reports, metrics, tracking, and analytics data',
  moderation: 'Content moderation, reviews, and safety',
  tenant: 'Multi-tenant configuration and isolation',
  platform: 'Platform-wide features and administration'
};

/**
 * Get category type options for dropdowns
 */
export function getCategoryTypeOptions() {
  return CATEGORY_TYPES.map(type => ({
    value: type,
    label: CATEGORY_TYPE_LABELS[type],
    description: CATEGORY_TYPE_DESCRIPTIONS[type]
  }));
}

/**
 * Get tag category options for dropdowns
 */
export function getTagCategoryOptions() {
  return TAG_CATEGORIES.map(category => ({
    value: category,
    label: TAG_CATEGORY_LABELS[category],
    description: CATEGORY_TYPE_DESCRIPTIONS[category]
  })).sort((a, b) => a.label.localeCompare(b.label));
}
