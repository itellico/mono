import { pgTable, serial, varchar, text, jsonb, boolean, timestamp, integer, bigserial, bigint, uuid, index, foreignKey, unique, pgEnum } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { users } from './auth';

// Email-related enums
export const emailType = pgEnum("email_type", ['transactional', 'marketing', 'notification', 'system']);
export const emailPriority = pgEnum("email_priority", ['high', 'normal', 'low']);
export const emailStatus = pgEnum("email_status", ['queued', 'sending', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked']);
export const templateType = pgEnum("template_type", ['welcome', 'verification', 'password_reset', 'notification', 'marketing', 'workflow', 'custom']);

// Email Templates - Multi-tenant with i18n support
export const emailTemplates = pgTable("email_templates", {
  id: serial().primaryKey().notNull(),
  uuid: uuid().defaultRandom().notNull(),
  tenantId: integer("tenant_id").notNull(),

  // Template identification
  key: varchar({ length: 100 }).notNull(), // e.g., 'welcome', 'password_reset'
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  type: templateType().notNull(),

  // Content with i18n support
  language: varchar({ length: 10 }).notNull().default('en'), // ISO language code
  subject: varchar({ length: 255 }).notNull(),
  htmlContent: text("html_content"),
  textContent: text("text_content"),

  // Template variables and configuration
  variables: jsonb().default('[]'), // Array of variable definitions
  defaultVariables: jsonb("default_variables").default('{}'), // Default values

  // Workflow integration
  workflowTriggers: jsonb("workflow_triggers").default('[]'), // Workflow events that can trigger this template

  // Template metadata
  version: integer().default(1),
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false), // Default template for this type/language

  // Audit fields
  createdBy: bigint("created_by", { mode: "number" }),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),

  // Content management
  lastTestedAt: timestamp("last_tested_at", { mode: 'string' }),
  testData: jsonb("test_data").default('{}'), // Sample data for testing
}, (table) => [
  foreignKey({
    columns: [table.tenantId],
    foreignColumns: [tenants.id],
    name: "email_templates_tenant_id_fk"
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.createdBy],
    foreignColumns: [users.id],
    name: "email_templates_created_by_fk"
  }).onDelete("set null"),
  unique("email_templates_uuid_unique").on(table.uuid),
  unique("email_template_tenant_key_lang_unique").on(table.tenantId, table.key, table.language),
  index("email_template_tenant_idx").on(table.tenantId),
  index("email_template_key_idx").on(table.key),
  index("email_template_language_idx").on(table.language),
  index("email_template_type_idx").on(table.type),
]);

// Email Template Variables - Define template placeholders
export const emailTemplateVariables = pgTable("email_template_variables", {
  id: serial().primaryKey().notNull(),
  templateId: integer("template_id").notNull(),

  // Variable definition
  key: varchar({ length: 100 }).notNull(), // e.g., 'user.firstName', 'company.name'
  name: varchar({ length: 255 }).notNull(), // Display name
  description: text(),
  dataType: varchar("data_type", { length: 50 }).notNull().default('string'), // string, number, boolean, date, array, object

  // Validation and formatting
  isRequired: boolean("is_required").default(false),
  defaultValue: text("default_value"),
  validationRules: jsonb("validation_rules").default('{}'), // JSON schema for validation
  formatters: jsonb().default('[]'), // Array of formatter functions

  // UI configuration
  displayOrder: integer("display_order").default(0),
  groupName: varchar("group_name", { length: 100 }), // Group variables for UI organization

  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
  foreignKey({
    columns: [table.templateId],
    foreignColumns: [emailTemplates.id],
    name: "email_template_variables_template_id_fk"
  }).onDelete("cascade"),
  unique("email_template_variable_unique").on(table.templateId, table.key),
  index("email_template_variables_template_idx").on(table.templateId),
]);

// Email Campaigns - Marketing and bulk email campaigns
export const emailCampaigns = pgTable("email_campaigns", {
  id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
  uuid: uuid().defaultRandom().notNull(),
  tenantId: integer("tenant_id").notNull(),

  // Campaign details
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  templateId: integer("template_id"),

  // Targeting and audience
  targetAudience: jsonb("target_audience").default('{}'), // Audience criteria
  estimatedRecipients: integer("estimated_recipients").default(0),
  actualRecipients: integer("actual_recipients").default(0),

  // Scheduling
  scheduledAt: timestamp("scheduled_at", { mode: 'string' }),
  startedAt: timestamp("started_at", { mode: 'string' }),
  completedAt: timestamp("completed_at", { mode: 'string' }),

  // Status and metrics
  status: varchar({ length: 50 }).default('draft'), // draft, scheduled, sending, sent, completed, cancelled
  sentCount: integer("sent_count").default(0),
  deliveredCount: integer("delivered_count").default(0),
  openedCount: integer("opened_count").default(0),
  clickedCount: integer("clicked_count").default(0),
  bouncedCount: integer("bounced_count").default(0),
  complainedCount: integer("complained_count").default(0),
  unsubscribedCount: integer("unsubscribed_count").default(0),

  // Testing
  isTest: boolean("is_test").default(false),
  sendTestTo: jsonb("send_test_to").default('[]'), // Array of test email addresses

  // Audit
  createdBy: bigint("created_by", { mode: "number" }),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
  foreignKey({
    columns: [table.tenantId],
    foreignColumns: [tenants.id],
    name: "email_campaigns_tenant_id_fk"
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.templateId],
    foreignColumns: [emailTemplates.id],
    name: "email_campaigns_template_id_fk"
  }).onDelete("set null"),
  foreignKey({
    columns: [table.createdBy],
    foreignColumns: [users.id],
    name: "email_campaigns_created_by_fk"
  }).onDelete("set null"),
  unique("email_campaigns_uuid_unique").on(table.uuid),
  index("email_campaigns_tenant_idx").on(table.tenantId),
  index("email_campaigns_status_idx").on(table.status),
  index("email_campaigns_scheduled_idx").on(table.scheduledAt),
]);

// Email Deliveries - Track individual email deliveries
export const emailDeliveries = pgTable("email_deliveries", {
  id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
  uuid: uuid().defaultRandom().notNull(),
  tenantId: integer("tenant_id").notNull(),

  // Recipient information
  userId: bigint("user_id", { mode: "number" }),
  recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  recipientName: varchar("recipient_name", { length: 255 }),

  // Email content
  templateId: integer("template_id"),
  templateKey: varchar("template_key", { length: 100 }),
  campaignId: bigint("campaign_id", { mode: "number" }),
  subject: varchar({ length: 255 }).notNull(),

  // Email type and priority
  emailType: emailType("email_type").notNull(),
  priority: emailPriority().default('normal'),

  // Template data and variables
  templateVariables: jsonb("template_variables").default('{}'),
  renderedContent: jsonb("rendered_content").default('{}'), // Cached rendered HTML/text

  // Delivery tracking
  status: emailStatus().default('queued'),
  scheduledAt: timestamp("scheduled_at", { mode: 'string' }),
  sentAt: timestamp("sent_at", { mode: 'string' }),
  deliveredAt: timestamp("delivered_at", { mode: 'string' }),
  openedAt: timestamp("opened_at", { mode: 'string' }),
  clickedAt: timestamp("clicked_at", { mode: 'string' }),

  // Provider information
  providerMessageId: varchar("provider_message_id", { length: 255 }),
  providerType: varchar("provider_type", { length: 50 }).default('mailpit'),
  providerResponse: jsonb("provider_response").default('{}'),

  // Error handling
  errorCount: integer("error_count").default(0),
  lastError: text("last_error"),
  retryAfter: timestamp("retry_after", { mode: 'string' }),

  // Metadata
  metadata: jsonb().default('{}'),
  tags: jsonb().default('[]'), // Array of tags for categorization

  // Workflow integration
  workflowId: varchar("workflow_id", { length: 255 }), // Temporal workflow ID
  workflowRunId: varchar("workflow_run_id", { length: 255 }), // Temporal run ID

  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
  foreignKey({
    columns: [table.tenantId],
    foreignColumns: [tenants.id],
    name: "email_deliveries_tenant_id_fk"
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: "email_deliveries_user_id_fk"
  }).onDelete("set null"),
  foreignKey({
    columns: [table.templateId],
    foreignColumns: [emailTemplates.id],
    name: "email_deliveries_template_id_fk"
  }).onDelete("set null"),
  foreignKey({
    columns: [table.campaignId],
    foreignColumns: [emailCampaigns.id],
    name: "email_deliveries_campaign_id_fk"
  }).onDelete("set null"),
  unique("email_deliveries_uuid_unique").on(table.uuid),
  index("email_deliveries_tenant_idx").on(table.tenantId),
  index("email_deliveries_recipient_idx").on(table.recipientEmail),
  index("email_deliveries_status_idx").on(table.status),
  index("email_deliveries_template_idx").on(table.templateId),
  index("email_deliveries_campaign_idx").on(table.campaignId),
  index("email_deliveries_provider_msg_idx").on(table.providerMessageId),
  index("email_deliveries_workflow_idx").on(table.workflowId),
]);

// Email Preferences - User email preferences per tenant
export const emailPreferences = pgTable("email_preferences", {
  id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
  userId: bigint("user_id", { mode: "number" }).notNull(),
  tenantId: integer("tenant_id").notNull(),

  // Email type preferences
  transactionalEmails: boolean("transactional_emails").default(true),
  marketingEmails: boolean("marketing_emails").default(true),
  notificationEmails: boolean("notification_emails").default(true),
  newsletterEmails: boolean("newsletter_emails").default(true),
  announcementEmails: boolean("announcement_emails").default(true),
  digestEmails: boolean("digest_emails").default(true),

  // Frequency and limits
  digestFrequency: varchar("digest_frequency", { length: 20 }).default('weekly'), // daily, weekly, monthly
  maxEmailsPerDay: integer("max_emails_per_day").default(10),

  // Language and format preferences
  preferredLanguage: varchar("preferred_language", { length: 10 }),
  htmlEmails: boolean("html_emails").default(true),

  // Specific notification preferences
  jobAlerts: boolean("job_alerts").default(true),
  applicationUpdates: boolean("application_updates").default(true),
  messageNotifications: boolean("message_notifications").default(true),
  paymentNotifications: boolean("payment_notifications").default(true),
  courseUpdates: boolean("course_updates").default(true),
  workflowNotifications: boolean("workflow_notifications").default(true),

  // Unsubscribe management
  globalUnsubscribe: boolean("global_unsubscribe").default(false),
  unsubscribeToken: varchar("unsubscribe_token", { length: 100 }),
  unsubscribedAt: timestamp("unsubscribed_at", { mode: 'string' }),

  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
  foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: "email_preferences_user_id_fk"
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.tenantId],
    foreignColumns: [tenants.id],
    name: "email_preferences_tenant_id_fk"
  }).onDelete("cascade"),
  unique("email_pref_user_tenant_unique").on(table.userId, table.tenantId),
  index("email_preferences_user_idx").on(table.userId),
  index("email_preferences_tenant_idx").on(table.tenantId),
  index("email_preferences_unsubscribe_token_idx").on(table.unsubscribeToken),
]);

// Email Analytics - Track email engagement metrics
export const emailAnalytics = pgTable("email_analytics", {
  id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
  deliveryId: bigint("delivery_id", { mode: "number" }).notNull(),

  // Event tracking
  event: varchar({ length: 50 }).notNull(), // sent, delivered, opened, clicked, bounced, complained, unsubscribed
  eventData: jsonb("event_data").default('{}'), // Additional event-specific data
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }), // IPv6 compatible

  // Link tracking (for clicks)
  linkUrl: text("link_url"),
  linkTitle: varchar("link_title", { length: 255 }),

  // Geographic data
  country: varchar({ length: 2 }), // ISO country code
  region: varchar({ length: 100 }),
  city: varchar({ length: 100 }),

  // Device information
  deviceType: varchar("device_type", { length: 50 }), // desktop, mobile, tablet
  browser: varchar({ length: 100 }),
  operatingSystem: varchar("operating_system", { length: 100 }),

  timestamp: timestamp({ mode: 'string' }).defaultNow(),
}, (table) => [
  foreignKey({
    columns: [table.deliveryId],
    foreignColumns: [emailDeliveries.id],
    name: "email_analytics_delivery_id_fk"
  }).onDelete("cascade"),
  index("email_analytics_delivery_idx").on(table.deliveryId),
  index("email_analytics_event_idx").on(table.event),
  index("email_analytics_timestamp_idx").on(table.timestamp),
]);

// Email Provider Configurations - Tenant-specific email provider settings
export const emailProviders = pgTable("email_providers", {
  id: serial().primaryKey().notNull(),
  tenantId: integer("tenant_id").notNull(),

  // Provider configuration
  name: varchar({ length: 100 }).notNull(),
  provider: varchar({ length: 50 }).notNull(), // mailpit, sendgrid, ses, smtp, etc.
  isActive: boolean("is_active").default(true),
  isPrimary: boolean("is_primary").default(false),

  // Configuration (encrypted)
  configuration: jsonb().default('{}'), // Provider-specific config (API keys, etc.)

  // Sending limits and rules
  dailyLimit: integer("daily_limit"),
  monthlyLimit: integer("monthly_limit"),
  rateLimit: integer("rate_limit"), // emails per minute

  // Email type routing
  supportedTypes: jsonb("supported_types").default('["transactional"]'), // Array of email types
  fallbackProvider: integer("fallback_provider"),

  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
  foreignKey({
    columns: [table.tenantId],
    foreignColumns: [tenants.id],
    name: "email_providers_tenant_id_fk"
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.fallbackProvider],
    foreignColumns: [table.id],
    name: "email_providers_fallback_fk"
  }).onDelete("set null"),
  index("email_providers_tenant_idx").on(table.tenantId),
  index("email_providers_provider_idx").on(table.provider),
]); 