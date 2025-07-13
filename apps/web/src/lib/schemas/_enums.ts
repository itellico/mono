// ============================
// 🔧 mono PLATFORM ENUMS
// ============================
// 
// 100% Generic marketplace enums for EAV-based architecture
// Removed all industry-specific terminology and hardcoded categories
//
// NOTE: These are TypeScript enums/const assertions compatible with Prisma
// The actual database enums are defined in the Prisma schema

// ============================
// MARKETPLACE CORE ENUMS
// ============================

// Generic marketplace sides - configurable per tenant
export const MarketplaceSide = {
  PROFESSIONAL: 'professional',  // Service providers, buyers (photographers, agencies, casting directors)
  TALENT: 'talent'              // Service sellers, providers (models, writers, designers, etc.)
} as const;

export type MarketplaceSide = typeof MarketplaceSide[keyof typeof MarketplaceSide];

// ============================
// SUBSCRIPTION & BUSINESS ENUMS
// ============================

// Generic subscription types for any marketplace
export const SubscriptionType = {
  // Individual/starter subscriptions
  MARKETPLACE_BASIC: 'marketplace_basic',    // €19/month - 1 category, 5 entities, basic features
  FREELANCER_STARTER: 'freelancer_starter',  // €49/month - 3 categories, 20 entities, portfolio
  CREATIVE_BASIC: 'creative_basic',          // €99/month - 5 categories, 50 entities, booking tools
  SERVICE_PROVIDER: 'service_provider',      // €149/month - unlimited categories, 100 entities,

  // Business marketplace subscriptions
  BUSINESS_SMALL: 'business_small',          // €499/month - Multi-user, 500 entities, team management
  BUSINESS_MEDIUM: 'business_medium',        // €999/month - Advanced workflows, 2K entities, analytics  
  BUSINESS_ENTERPRISE: 'business_enterprise', // €2999/month - White-label, unlimited entities, API access

  // Specialized marketplace subscriptions
  PLATFORM_BUILDER: 'platform_builder',      // €299/month - Category builder, custom workflows
  MARKETPLACE_PRO: 'marketplace_pro',        // €599/month - Advanced search, recommendation engine
  ENTERPRISE_CUSTOM: 'enterprise_custom'     // €1999/month - Custom development, dedicated support
} as const;

export type SubscriptionType = typeof SubscriptionType[keyof typeof SubscriptionType];

// User roles within accounts (removed agency-specific roles)
export const AccountRole = {
  ACCOUNT_OWNER: 'account_owner',      // Full access, billing, can manage all users/entities
  ACCOUNT_MANAGER: 'account_manager',  // Can manage users/entities, no billing access
  CATEGORY_ADMIN: 'category_admin',    // Can create/edit categories and attributes
  ENTITY_EDITOR: 'entity_editor',      // Can edit assigned entities only (replaces profile_editor)
  ENTITY_VIEWER: 'entity_viewer'       // Can view assigned entities only (replaces profile_viewer)
} as const;

export type AccountRole = typeof AccountRole[keyof typeof AccountRole];

// Permission levels for entity access (replaces profile permissions)
export const PermissionLevel = {
  OWNER: 'owner',       // Entity subject - full control
  MANAGER: 'manager',   // Can manage everything except delete
  EDITOR: 'editor',     // Can edit content and media
  VIEWER: 'viewer'      // Can view only
} as const;

export type PermissionLevel = typeof PermissionLevel[keyof typeof PermissionLevel];

// ============================
// PLATFORM FEATURES & LIMITS ENUMS
// ============================

// Feature types for platform features system
export const FeatureType = {
  CORE: 'core',           // Core platform features (always available)
  PREMIUM: 'premium',     // Premium subscription features
  ENTERPRISE: 'enterprise', // Enterprise-only features
  ADDON: 'addon'          // Optional add-on features
} as const;

export type FeatureType = typeof FeatureType[keyof typeof FeatureType];

// Limit types for subscription enforcement
export const LimitType = {
  COUNT: 'count',         // Numeric count limits (entities, users, categories)
  STORAGE: 'storage',     // Storage space limits
  BANDWIDTH: 'bandwidth', // Bandwidth usage limits
  DURATION: 'duration'    // Time-based limits
} as const;

export type LimitType = typeof LimitType[keyof typeof LimitType];

// Limit units for subscription limits
export const LimitUnit = {
  ITEMS: 'items',    // Count of items
  MB: 'mb',          // Megabytes
  GB: 'gb',          // Gigabytes
  TB: 'tb',          // Terabytes
  HOURS: 'hours',    // Hours
  DAYS: 'days',      // Days
  MONTHS: 'months'   // Months
} as const;

export type LimitUnit = typeof LimitUnit[keyof typeof LimitUnit];

// ============================
// SUBSCRIPTION & BILLING ENUMS
// ============================

export const SubscriptionStatus = {
  TRIAL: 'trial',
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
  UNPAID: 'unpaid',
  INCOMPLETE: 'incomplete',
  INCOMPLETE_EXPIRED: 'incomplete_expired',
  SUSPENDED: 'suspended'
} as const;

export type SubscriptionStatus = typeof SubscriptionStatus[keyof typeof SubscriptionStatus];

export const SubscriptionTier = {
  FREE: 'free',
  BASIC: 'basic',
  PROFESSIONAL: 'professional',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise'
} as const;

export type SubscriptionTier = typeof SubscriptionTier[keyof typeof SubscriptionTier];

// ============================
// GENERIC BUSINESS PROCESS ENUMS
// ============================

// Job/gig status for any marketplace
export const JobStatus = {
  DRAFT: 'draft',           // Being created
  PUBLISHED: 'published',   // Live and accepting applications
  CLOSED: 'closed',         // No longer accepting applications
  CANCELLED: 'cancelled',   // Cancelled by poster
  COMPLETED: 'completed'    // Job completed
} as const;

export type JobStatus = typeof JobStatus[keyof typeof JobStatus];

// Media types for media assets
export const MediaType = {
  IMAGE: 'image',       // Photos
  VIDEO: 'video',       // Videos
  DOCUMENT: 'document', // PDFs, docs
  AUDIO: 'audio'        // Audio files
} as const;

export type MediaType = typeof MediaType[keyof typeof MediaType];

// Picture types for photo classification
export const PictureType = {
  PROFILE_PICTURE: 'profile_picture',       // Main profile photo
  PORTFOLIO: 'portfolio',                   // General portfolio photos
  SET_CARD: 'set_card',                    // Structured 5-photo set (body, portrait, action, etc.)
  APPLICATION_PHOTO: 'application_photo',   // Photos submitted during application
  VERIFICATION_PHOTO: 'verification_photo'  // ID verification or other verification photos
} as const;

export type PictureType = typeof PictureType[keyof typeof PictureType];

// Admin role types for platform administration
export const AdminRoleType = {
  SUPER_ADMIN: 'super_admin',           // Full platform access
  TENANT_ADMIN: 'tenant_admin',         // Tenant-specific admin
  CONTENT_MODERATOR: 'content_moderator', // Content moderation
  APPROVER: 'approver',                 // Application approval
  GOCARE_REVIEWER: 'gocare_reviewer',   // Content approval
  SUPPORT_AGENT: 'support_agent',       // Customer support
  ANALYTICS_VIEWER: 'analytics_viewer'  // Analytics read-only access
} as const;

export type AdminRoleType = typeof AdminRoleType[keyof typeof AdminRoleType];

// ============================
// AUTHENTICATION & PERMISSIONS ENUMS
// ============================

export const PermissionType = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
} as const;

export type PermissionType = typeof PermissionType[keyof typeof PermissionType];

export const ResourceType = {
  USER: 'user',
  ACCOUNT: 'account',
  MEDIA: 'media',
  ENTITY: 'entity',       // Replaces 'profile'
  JOB: 'job',
  MESSAGE: 'message',
  TENANT: 'tenant',
  SUBSCRIPTION: 'subscription',
  CATEGORY: 'category',   // New: category management
  ATTRIBUTE: 'attribute'  // New: attribute management
} as const;

export type ResourceType = typeof ResourceType[keyof typeof ResourceType];

export const ContextType = {
  GLOBAL: 'global',
  TENANT: 'tenant',
  ACCOUNT: 'account',
  USER: 'user'
} as const;

export type ContextType = typeof ContextType[keyof typeof ContextType];

export const UserType = {
  INDIVIDUAL: 'individual',
  BUSINESS: 'business',
  ADMIN: 'admin'
} as const;

export type UserType = typeof UserType[keyof typeof UserType];

export const Gender = {
  MALE: 'male',
  FEMALE: 'female',
  NON_BINARY: 'non_binary',
  PREFER_NOT_TO_SAY: 'prefer_not_to_say'
} as const;

export type Gender = typeof Gender[keyof typeof Gender];

export const AccountType = {
  PERSONAL: 'personal',
  BUSINESS: 'business'
} as const;

export type AccountType = typeof AccountType[keyof typeof AccountType];

// ============================
// SITE SETTINGS & CONFIGURATION ENUMS
// ============================

export const SettingsCategory = {
  GENERAL: 'general',           // General platform settings
  EMAIL: 'email',               // Email configuration
  SECURITY: 'security',         // Security settings
  BILLING: 'billing',           // Billing and payment settings
  MEDIA: 'media',               // Media and file settings
  LOCALIZATION: 'localization', // Language and locale settings
  UI: 'ui',                     // User interface settings
  BUSINESS: 'business',         // Business logic settings
  QUEUE: 'queue',               // Queue and worker settings
  CONTENT: 'content',           // Content management settings
  MARKETPLACE: 'marketplace'    // Marketplace-specific settings
} as const;

export type SettingsCategory = typeof SettingsCategory[keyof typeof SettingsCategory];

export const SettingsLevel = {
  GLOBAL: 'global',   // Platform-wide setting
  TENANT: 'tenant',   // Tenant-level setting
  USER: 'user'        // User-specific setting
} as const;

export type SettingsLevel = typeof SettingsLevel[keyof typeof SettingsLevel];

export const SettingsGovernance = {
  ADMIN_MANAGED: 'admin_managed',   // Managed by platform admins only
  TENANT_MANAGED: 'tenant_managed', // Managed by tenant admins
  USER_MANAGED: 'user_managed'      // Managed by end-users
} as const;

export type SettingsGovernance = typeof SettingsGovernance[keyof typeof SettingsGovernance];

// ============================
// ENTITY & ATTRIBUTE ENUMS (EAV)
// ============================

// All entity types in the system
export const EntityType = {
  // Core Types
  USER: 'user',
  ACCOUNT: 'account',
  PROFILE: 'profile',
  TENANT: 'tenant',
  SUBSCRIPTION: 'subscription',
  JOB: 'job',
  APPLICATION: 'application',
  MESSAGE: 'message',
  CATEGORY: 'category',
  ATTRIBUTE: 'attribute',
  MEDIA: 'media',
  TEMPLATE: 'template',
  MODULE: 'module',
  FORM: 'form',
  INVOICE: 'invoice',
  PAYMENT_METHOD: 'payment_method',

  // Custom/Marketplace Specific
  MODEL: 'model',
  PHOTOGRAPHER: 'photographer',
  AGENCY: 'agency',
  CASTING_DIRECTOR: 'casting_director',
  CLIENT: 'client',
  BRAND: 'brand',
  PRODUCT: 'product',
  SERVICE: 'service',
  LOCATION: 'location',
  EVENT: 'event',
  POST: 'post'
} as const;

export type EntityType = typeof EntityType[keyof typeof EntityType];

// Data types for custom attributes
export const AttributeDataType = {
  STRING: 'string',
  TEXT: 'text',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  DATE: 'date',
  DATETIME: 'datetime',
  ENUM: 'enum',
  MULTISELECT: 'multiselect',
  JSON: 'json',
  COUNTRY: 'country',
  LANGUAGE: 'language',
  CURRENCY: 'currency',
  TIMEZONE: 'timezone'
} as const;

export type AttributeDataType = typeof AttributeDataType[keyof typeof AttributeDataType];

// ============================
// INTEGRATIONS & WORKFLOW ENUMS
// ============================

// LLM provider types
export const LLMProvider = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GOOGLE: 'google',
  COHERE: 'cohere'
} as const;

export type LLMProvider = typeof LLMProvider[keyof typeof LLMProvider];

// LLM model types
export const LLMModel = {
  GPT_4: 'gpt-4',
  GPT_35_TURBO: 'gpt-3.5-turbo',
  CLAUDE_2: 'claude-2',
  CLAUDE_INSTANT: 'claude-instant',
  GEMINI_PRO: 'gemini-pro',
  COMMAND_R: 'command-r'
} as const;

export type LLMModel = typeof LLMModel[keyof typeof LLMModel];

// LLM task types
export const LLMTask = {
  TEXT_GENERATION: 'text_generation',
  CLASSIFICATION: 'classification',
  SUMMARIZATION: 'summarization',
  TRANSLATION: 'translation',
  CODE_GENERATION: 'code_generation',
  EMBEDDING: 'embedding'
} as const;

export type LLMTask = typeof LLMTask[keyof typeof LLMTask];

// Integration types
export const IntegrationType = {
  PAYMENT_GATEWAY: 'payment_gateway',
  EMAIL_SERVICE: 'email_service',
  SMS_SERVICE: 'sms_service',
  STORAGE_PROVIDER: 'storage_provider',
  ANALYTICS_SERVICE: 'analytics_service',
  LLM_PROVIDER: 'llm_provider'
} as const;

export type IntegrationType = typeof IntegrationType[keyof typeof IntegrationType];

// Integration status
export const IntegrationStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ERROR: 'error',
  REQUIRES_CONFIGURATION: 'requires_configuration'
} as const;

export type IntegrationStatus = typeof IntegrationStatus[keyof typeof IntegrationStatus];

// ============================
// MODULE & SCHEMA ENUMS
// ============================

// Module types for dynamic UI
export const ModuleType = {
  PROFILE_FORM: 'profile_form',
  SEARCH_INTERFACE: 'search_interface',
  DETAIL_PAGE: 'detail_page',
  LISTING_PAGE: 'listing_page',
  APPLICATION_FORM: 'application_form',
  CARD_COMPONENT: 'card_component'
} as const;

export type ModuleType = typeof ModuleType[keyof typeof ModuleType];

// Module status
export const ModuleStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
} as const;

export type ModuleStatus = typeof ModuleStatus[keyof typeof ModuleStatus];

// Option set types
export const OptionSetType = {
  STANDARD: 'standard', // Standard key-value
  COUNTRY: 'country',
  LANGUAGE: 'language',
  CURRENCY: 'currency',
  TIMEZONE: 'timezone'
} as const;

export type OptionSetType = typeof OptionSetType[keyof typeof OptionSetType];

// Schema types
export const SchemaType = {
  PROFILE: 'profile',
  JOB: 'job',
  APPLICATION: 'application',
  FORM: 'form'
} as const;

export type SchemaType = typeof SchemaType[keyof typeof SchemaType];

// ============================
// PERMISSION SYSTEM ENUMS
// ============================

export const RelationshipType = {
  MANAGES: 'manages',
  WORKS_FOR: 'works_for',
  REPRESENTS: 'represents',
  OWNS: 'owns',
  MEMBER_OF: 'member_of'
} as const;

export type RelationshipType = typeof RelationshipType[keyof typeof RelationshipType];

export const PermissionContext = {
  ENUM: 'enum'
} as const;

export type PermissionContext = typeof PermissionContext[keyof typeof PermissionContext];

// =======================================
// AUDITING & VERSIONING ENUMS
// =======================================

export const AuditAction = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAIL: 'login_fail',
  LOGOUT: 'logout',
  PASSWORD_RESET_REQUEST: 'password_reset_request',
  PASSWORD_RESET_SUCCESS: 'password_reset_success',
  EMAIL_SENT: 'email_sent',
  USER_INVITED: 'user_invited',
  USER_ROLE_CHANGED: 'user_role_changed',
  RECORD_LOCKED: 'record_locked',
  RECORD_UNLOCKED: 'record_unlocked',
  VERSION_RESTORED: 'version_restored',
  EXPORT_DATA: 'export_data',
  IMPORT_DATA: 'import_data',
  SYSTEM_NOTIFICATION: 'system_notification'
} as const;

export type AuditAction = typeof AuditAction[keyof typeof AuditAction];

export const ActivityAction = {
  VIEW: 'view',
  SEARCH: 'search',
  FILTER: 'filter',
  SORT: 'sort',
  FORM_SUBMISSION: 'form_submission',
  CLICK: 'click',
  SCROLL_DEPTH: 'scroll_depth',
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',
  PAGE_VIEW: 'page_view'
} as const;

export type ActivityAction = typeof ActivityAction[keyof typeof ActivityAction];

// ============================
// DEPRECATED EXPORTS
// ============================
// These are kept for backward compatibility
// TODO: Remove these in next major version

export const marketplaceSideEnum = MarketplaceSide;
export const subscriptionTypeEnum = SubscriptionType;
export const accountRoleEnum = AccountRole;
export const permissionLevelEnum = PermissionLevel;
export const featureTypeEnum = FeatureType;
export const limitTypeEnum = LimitType;
export const limitUnitEnum = LimitUnit;
export const subscriptionStatusEnum = SubscriptionStatus;
export const subscriptionTierEnum = SubscriptionTier;
export const jobStatusEnum = JobStatus;
export const mediaTypeEnum = MediaType;
export const pictureTypeEnum = PictureType;
export const adminRoleTypeEnum = AdminRoleType;
export const permissionTypeEnum = PermissionType;
export const resourceTypeEnum = ResourceType;
export const contextTypeEnum = ContextType;
export const userTypeEnum = UserType;
export const genderEnum = Gender;
export const accountTypeEnum = AccountType;
export const settingsCategoryEnum = SettingsCategory;
export const settingsLevelEnum = SettingsLevel;
export const settingsGovernanceEnum = SettingsGovernance;
export const entityTypeEnum = EntityType;
export const attributeDataTypeEnum = AttributeDataType;
export const llmProviderEnum = LLMProvider;
export const llmModelEnum = LLMModel;
export const llmTaskEnum = LLMTask;
export const integrationTypeEnum = IntegrationType;
export const integrationStatusEnum = IntegrationStatus;
export const moduleTypeEnum = ModuleType;
export const moduleStatusEnum = ModuleStatus;
export const optionSetTypeEnum = OptionSetType;
export const schemaTypeEnum = SchemaType;
export const relationshipTypeEnum = RelationshipType;
export const permissionContextEnum = PermissionContext;
export const auditActionEnum = AuditAction;
export const activityActionEnum = ActivityAction;