import { 
  pgTable, 
  serial, 
  uuid,
  varchar, 
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  foreignKey,
  unique
} from 'drizzle-orm/pg-core';
import { users, tenants, modelSchemas } from '../schemas';
import { industryTemplates } from './industry-templates';

// ============================
// 📝 PROFILE BUILDING FORMS
// ============================

export const formTemplateType = ['profile_builder', 'application_form', 'onboarding_flow', 'portfolio_upload', 'registration'] as const;
export type FormTemplateType = typeof formTemplateType[number];

export const formTemplateStatus = ['draft', 'published', 'archived'] as const;
export type FormTemplateStatus = typeof formTemplateStatus[number];

// Form Templates (not standalone forms, but profile building templates)
export const formTemplates = pgTable('form_templates', {
  id: uuid().defaultRandom().primaryKey(),
  
  // MANDATORY TENANT ISOLATION
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  
  // Industry Template Integration
  industryTemplateId: uuid('industry_template_id').references(() => industryTemplates.id, { onDelete: 'cascade' }),
  
  // Template Info
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  slug: varchar({ length: 100 }).notNull(), // for SEO-friendly URLs
  
  // Template Purpose
  templateType: varchar('template_type', { length: 50 }).default('profile_builder'), 
  status: varchar({ length: 20 }).default('draft'), 
  
  // Form Structure - stores the visual builder output
  structure: jsonb().notNull(), // FormElement[] from the builder
  
  // Profile Integration Settings
  targetProfileType: varchar('target_profile_type', { length: 100 }), // 'baby_model', 'kids_model', 'photographer', etc.
  modelSchemaId: uuid('model_schema_id').references(() => modelSchemas.id, { onDelete: 'set null' }), // REQUIRED for profile building
  
  // Form Behavior Settings
  settings: jsonb().default({}), // validation rules, behavior, notifications
  profileMappings: jsonb('profile_mappings').default({}), // Maps form fields to user/profile table columns
  
  // Workflow Integration
  onSubmissionWorkflow: varchar('on_submission_workflow', { length: 100 }), // 'create_profile', 'update_profile', 'approval_required'
  approvalRequired: boolean('approval_required').default(false),
  autoPublishProfile: boolean('auto_publish_profile').default(false),
  
  // Display & UX
  theme: jsonb().default({}), // styling and theming options
  stepNavigation: boolean('step_navigation').default(false), // multi-step forms
  progressTracking: boolean('progress_tracking').default(true),
  
  // Success Actions
  successMessage: jsonb('success_message').default({}), // multi-language success messages
  redirectUrl: varchar('redirect_url', { length: 500 }), // post-submission redirect
  emailNotifications: jsonb('email_notifications').default({}), // notification settings
  
  // Analytics & Tracking
  submissionCount: integer('submission_count').default(0),
  completionRate: integer('completion_rate').default(0), // percentage
  lastSubmissionAt: timestamp('last_submission_at', { mode: 'string' }),
  
  // Template Metadata
  version: integer().default(1),
  isTemplate: boolean('is_template').default(false),
  isActive: boolean('is_active').default(true),
  componentOrder: integer('component_order').default(0), // Order within industry template
  
  // Audit fields
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  updatedBy: integer('updated_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow(),
}, (table) => [
  // TENANT ISOLATION INDEXES (Critical for performance)
  index('form_templates_tenant_idx').on(table.tenantId),
  index('form_templates_tenant_status_idx').on(table.tenantId, table.status),
  index('form_templates_tenant_type_idx').on(table.tenantId, table.templateType),
  index('form_templates_tenant_active_idx').on(table.tenantId, table.isActive),
  
  // Other indexes
  index('form_templates_industry_template_idx').on(table.industryTemplateId),
  index('form_templates_target_profile_idx').on(table.targetProfileType),
  index('form_templates_schema_idx').on(table.modelSchemaId),
  
  // Unique constraints - MUST include tenantId for proper isolation
  unique('form_templates_tenant_slug_unique').on(table.tenantId, table.slug),
]);

// Profile Building Submissions (creates actual user profiles)
export const profileSubmissions = pgTable('profile_submissions', {
  id: uuid().defaultRandom().primaryKey(),
  
  // MANDATORY TENANT ISOLATION  
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  
  formTemplateId: uuid('form_template_id').notNull().references(() => formTemplates.id, { onDelete: 'cascade' }),
  
  // Profile Building Results
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }), // User that gets created/updated
  profileId: uuid('profile_id'), // References user_profiles.id if applicable
  profileType: varchar('profile_type', { length: 100 }), // Type of profile created
  
  // Submission Data
  formData: jsonb('form_data').notNull(), // Raw form data
  processedData: jsonb('processed_data').default({}), // Normalized data for database insertion
  validationResults: jsonb('validation_results').default({}), // Schema validation results
  
  // Submitter Information
  submittedBy: integer('submitted_by').references(() => users.id, { onDelete: 'set null' }), // For authenticated submissions
  submitterEmail: varchar('submitter_email', { length: 255 }), // For non-authenticated
  submitterName: varchar('submitter_name', { length: 255 }),
  submissionSource: varchar('submission_source', { length: 100 }).default('web'), // 'web', 'mobile', 'api'
  
  // Processing Status
  status: varchar({ length: 20 }).default('pending'), // pending, processed, approved, rejected
  processingStage: varchar('processing_stage', { length: 50 }).default('validation'), // validation, profile_creation, approval, completion
  isValid: boolean('is_valid').default(true),
  validationErrors: jsonb('validation_errors').default([]),
  
  // Profile Creation Results
  profileCreated: boolean('profile_created').default(false),
  userCreated: boolean('user_created').default(false),
  fieldsUpdated: jsonb('fields_updated').default([]), // List of fields that were updated
  
  // Workflow & Approval
  requiresApproval: boolean('requires_approval').default(false),
  approvalStatus: varchar('approval_status', { length: 20 }).default('pending'), // pending, approved, rejected
  approvedBy: integer('approved_by').references(() => users.id, { onDelete: 'set null' }),
  approvedAt: timestamp('approved_at', { mode: 'string' }),
  rejectionReason: text('rejection_reason'),
  
  // Processing Details
  processedAt: timestamp('processed_at', { mode: 'string' }),
  processedBy: integer('processed_by').references(() => users.id, { onDelete: 'set null' }),
  processingNotes: text('processing_notes'),
  errorDetails: jsonb('error_details').default({}),
  
  // Metadata
  metadata: jsonb().default({}), // IP, user agent, referrer, etc.
  
  // Timestamps
  submittedAt: timestamp('submitted_at', { mode: 'string' }).defaultNow(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow(),
}, (table) => [
  // TENANT ISOLATION INDEXES (Critical for performance)
  index('profile_submissions_tenant_idx').on(table.tenantId),
  index('profile_submissions_tenant_status_idx').on(table.tenantId, table.status),
  index('profile_submissions_tenant_submitted_at_idx').on(table.tenantId, table.submittedAt),
  index('profile_submissions_tenant_approval_idx').on(table.tenantId, table.approvalStatus),
  
  // Other indexes
  index('profile_submissions_form_template_idx').on(table.formTemplateId),
  index('profile_submissions_user_idx').on(table.userId),
  index('profile_submissions_profile_idx').on(table.profileId),
  index('profile_submissions_submitted_by_idx').on(table.submittedBy),
  index('profile_submissions_email_idx').on(table.submitterEmail),
]);

// Enhanced Field Mappings (maps form fields to profile/user table columns)
export const formFieldMappings = pgTable('form_field_mappings', {
  id: serial().primaryKey(),
  
  // MANDATORY TENANT ISOLATION
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  
  formTemplateId: uuid('form_template_id').notNull().references(() => formTemplates.id, { onDelete: 'cascade' }),
  fieldId: varchar('field_id', { length: 100 }).notNull(), // matches FormElement.id
  
  // Schema Mapping
  modelSchemaId: uuid('model_schema_id').references(() => modelSchemas.id, { onDelete: 'set null' }),
  schemaFieldPath: varchar('schema_field_path', { length: 200 }), // e.g., "personal.firstName"
  
  // Database Mapping (direct mapping to tables)
  targetTable: varchar('target_table', { length: 50 }), // 'users', 'user_profiles', 'profile_attributes'
  targetColumn: varchar('target_column', { length: 100 }), // column name in target table
  
  // Option Set Mapping
  optionSetId: integer('option_set_id'),
  
  // Field Processing
  isRequired: boolean('is_required').default(false),
  validationRules: jsonb('validation_rules').default({}),
  transformRules: jsonb('transform_rules').default({}), // data transformation rules
  defaultValue: text('default_value'), // default value if not provided
  
  // Conditional Logic
  conditions: jsonb('conditions').default({}), // when this mapping applies
  dependsOn: jsonb('depends_on').default([]), // other fields this depends on
  
  // Metadata
  order: integer().default(0),
  isActive: boolean('is_active').default(true),
  description: text('description'), // human-readable description
  
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow(),
}, (table) => [
  // TENANT ISOLATION INDEXES (Critical for performance)
  index('form_field_mappings_tenant_idx').on(table.tenantId),
  index('form_field_mappings_tenant_form_idx').on(table.tenantId, table.formTemplateId),
  
  // Other indexes
  index('form_field_mappings_form_template_idx').on(table.formTemplateId),
  index('form_field_mappings_schema_idx').on(table.modelSchemaId),
  index('form_field_mappings_target_table_idx').on(table.targetTable),
  index('form_field_mappings_option_set_idx').on(table.optionSetId),
  
  // Unique constraint - one mapping per field per form per tenant
  unique('form_field_mappings_unique').on(table.tenantId, table.formTemplateId, table.fieldId),
]);

// ============================
// 📊 TYPESCRIPT INTERFACES
// ============================

export interface FormTemplate {
  id: string;
  tenantId: number; // MANDATORY - never null
  industryTemplateId?: string | null;
  name: string;
  description?: string | null;
  slug: string;
  templateType: FormTemplateType;
  status: FormTemplateStatus;
  structure: any; // FormElement[]
  targetProfileType?: string | null;
  modelSchemaId?: string | null;
  settings: any;
  profileMappings: any;
  onSubmissionWorkflow?: string | null;
  approvalRequired: boolean;
  autoPublishProfile: boolean;
  theme: any;
  stepNavigation: boolean;
  progressTracking: boolean;
  successMessage: any;
  redirectUrl?: string | null;
  emailNotifications: any;
  submissionCount: number;
  completionRate: number;
  lastSubmissionAt?: string | null;
  version: number;
  isTemplate: boolean;
  isActive: boolean;
  componentOrder: number;
  createdBy?: number | null;
  updatedBy?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileSubmission {
  id: string;
  tenantId: number; // MANDATORY - never null
  formTemplateId: string;
  userId?: number | null;
  profileId?: string | null;
  profileType?: string | null;
  formData: any;
  processedData: any;
  validationResults: any;
  submittedBy?: number | null;
  submitterEmail?: string | null;
  submitterName?: string | null;
  submissionSource: string;
  status: string;
  processingStage: string;
  isValid: boolean;
  validationErrors: any[];
  profileCreated: boolean;
  userCreated: boolean;
  fieldsUpdated: any[];
  requiresApproval: boolean;
  approvalStatus: string;
  approvedBy?: number | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  processedAt?: string | null;
  processedBy?: number | null;
  processingNotes?: string | null;
  errorDetails: any;
  metadata: any;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface FormFieldMapping {
  id: number;
  tenantId: number; // MANDATORY - never null
  formTemplateId: string;
  fieldId: string;
  modelSchemaId?: string | null;
  schemaFieldPath?: string | null;
  targetTable?: string | null;
  targetColumn?: string | null;
  optionSetId?: number | null;
  isRequired: boolean;
  validationRules: any;
  transformRules: any;
  defaultValue?: string | null;
  conditions: any;
  dependsOn: any[];
  order: number;
  isActive: boolean;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Export alias for backward compatibility with API
export const forms = formTemplates; 